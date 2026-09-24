import fs from 'node:fs/promises';
import path from 'node:path';
import { Status, assertTransition } from './states.js';
import { assertSafeId } from '../workspace/workspace.js';

// Almacén de estado en un archivo JSON local ($0, sin servidor).
// Expone la misma interfaz que tendrá el adaptador de Firestore:
//   create, get, list, claimNext, complete, fail, retry
// Todas las mutaciones se serializan en una cola interna y se escriben de forma
// atómica (tmp + rename) para que un corte de luz no corrompa la base.
export class JsonStore {
  constructor(file, { now = () => Date.now() } = {}) {
    this.file = file;
    this.now = now;
    this.chain = Promise.resolve();
  }

  async #read() {
    try {
      return JSON.parse(await fs.readFile(this.file, 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') return { products: {} };
      throw err;
    }
  }

  async #write(db) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, this.file);
  }

  // Ejecuta `fn(db)` en exclusión mutua; si devuelve algo distinto de undefined, persiste.
  #mutate(fn) {
    const run = this.chain.then(async () => {
      const db = await this.#read();
      const result = await fn(db);
      await this.#write(db);
      return result;
    });
    this.chain = run.catch(() => {});
    return run;
  }

  async get(id) {
    await this.chain;
    return (await this.#read()).products[id] ?? null;
  }

  async list({ status } = {}) {
    await this.chain;
    const all = Object.values((await this.#read()).products);
    return status ? all.filter((p) => p.status === status) : all;
  }

  create({ id, sourceUrl, meta = {} }) {
    assertSafeId(id);
    return this.#mutate((db) => {
      if (db.products[id]) throw new Error(`El producto ${id} ya existe`);
      const ts = new Date(this.now()).toISOString();
      const product = {
        id,
        sourceUrl,
        meta,
        status: Status.PENDING_SCRAPE,
        attempts: 0,
        notBefore: null,
        lock: null,
        data: {},
        history: [{ at: ts, status: Status.PENDING_SCRAPE }],
        lastError: null,
        createdAt: ts,
        updatedAt: ts,
      };
      db.products[id] = product;
      return product;
    });
  }

  // Toma el siguiente producto disponible en `status` y le pone un lease.
  // Un lock vencido (worker que murió a medias) se considera libre.
  claimNext(status, workerId, leaseMs) {
    return this.#mutate((db) => {
      const t = this.now();
      const candidate = Object.values(db.products)
        .filter((p) => p.status === status)
        .filter((p) => !p.lock || p.lock.expiresAt <= t)
        .filter((p) => !p.notBefore || p.notBefore <= t)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      if (!candidate) return null;
      candidate.lock = { workerId, claimedAt: t, expiresAt: t + leaseMs };
      candidate.updatedAt = new Date(t).toISOString();
      return structuredClone(candidate);
    });
  }

  #owned(db, id, workerId) {
    const p = db.products[id];
    if (!p) throw new Error(`Producto ${id} no existe`);
    if (!p.lock || p.lock.workerId !== workerId) {
      throw new Error(`El worker ${workerId} ya no tiene el lock de ${id}`);
    }
    return p;
  }

  // Avanza a la siguiente etapa, fusionando `dataPatch` en product.data.
  complete(id, workerId, nextStatus, dataPatch = {}) {
    return this.#mutate((db) => {
      const p = this.#owned(db, id, workerId);
      assertTransition(p.status, nextStatus);
      const ts = new Date(this.now()).toISOString();
      Object.assign(p, {
        status: nextStatus,
        data: { ...p.data, ...dataPatch },
        attempts: 0,
        notBefore: null,
        lock: null,
        lastError: null,
        updatedAt: ts,
      });
      p.history.push({ at: ts, status: nextStatus });
      return structuredClone(p);
    });
  }

  // Registra un fallo. Si quedan intentos, programa reintento con backoff exponencial;
  // si no (o si es permanente), pasa a FAILED conservando la etapa donde falló.
  fail(id, workerId, error, { permanent = false, maxAttempts, backoffBaseMs }) {
    return this.#mutate((db) => {
      const p = this.#owned(db, id, workerId);
      const t = this.now();
      const ts = new Date(t).toISOString();
      p.attempts += 1;
      p.lock = null;
      p.lastError = { at: ts, stage: p.status, message: String(error?.message ?? error), attempt: p.attempts };
      p.updatedAt = ts;
      if (permanent || p.attempts >= maxAttempts) {
        p.failedAt = p.status;
        p.status = Status.FAILED;
        p.notBefore = null;
        p.history.push({ at: ts, status: Status.FAILED, error: p.lastError.message });
      } else {
        p.notBefore = t + backoffBaseMs * 2 ** (p.attempts - 1);
      }
      return structuredClone(p);
    });
  }

  // Reencola manualmente un producto FAILED en la etapa donde falló.
  retry(id) {
    return this.#mutate((db) => {
      const p = db.products[id];
      if (!p) throw new Error(`Producto ${id} no existe`);
      if (p.status !== Status.FAILED) throw new Error(`${id} no está en FAILED (está en ${p.status})`);
      const ts = new Date(this.now()).toISOString();
      Object.assign(p, { status: p.failedAt, attempts: 0, notBefore: null, lock: null, updatedAt: ts });
      delete p.failedAt;
      p.history.push({ at: ts, status: p.status, note: 'manual retry' });
      return structuredClone(p);
    });
  }
}
