import os from 'node:os';
import { STAGES } from '../state/states.js';
import { PermanentError } from '../utils/errors.js';
import { ensureWorkspace } from '../workspace/workspace.js';

// Orquestador: en cada "tick" recorre las etapas en orden y procesa todo lo que
// esté listo. `handlers` es un mapa { scrape, script, assets, render, publish } de
// funciones async (ctx) => dataPatch. Las etapas sin handler se saltan, así el
// motor funciona mientras construimos los módulos uno por uno.
export class Daemon {
  constructor({ store, handlers, config, logger, workerId = `${os.hostname()}:${process.pid}` }) {
    this.store = store;
    this.handlers = handlers;
    this.config = config;
    this.logger = logger;
    this.workerId = workerId;
    this.stopped = false;
    this.timer = null;
    this.abort = new AbortController();
  }

  async runStage(stage) {
    const handler = this.handlers[stage.name];
    if (!handler) return 0;
    let processed = 0;
    while (!this.stopped) {
      const product = await this.store.claimNext(stage.from, this.workerId, this.config.leaseMs);
      if (!product) break;
      processed += 1;
      const log = (level) => (msg, f) => this.logger[level](msg, { productId: product.id, stage: stage.name, ...f });
      const ctx = {
        product,
        paths: await ensureWorkspace(this.config.workspaceDir, product.id),
        config: this.config,
        log: { info: log('info'), warn: log('warn'), error: log('error') },
        signal: this.abort.signal,
      };
      ctx.log.info(`${stage.activeLabel}...`);
      try {
        const patch = (await handler(ctx)) ?? {};
        await this.store.complete(product.id, this.workerId, stage.to, patch);
        ctx.log.info(`OK -> ${stage.to}`);
      } catch (err) {
        const updated = await this.store.fail(product.id, this.workerId, err, {
          permanent: err instanceof PermanentError,
          maxAttempts: this.config.maxAttempts,
          backoffBaseMs: this.config.backoffBaseMs,
        });
        const where = updated.status === 'FAILED' ? 'FAILED' : `reintento ${updated.attempts}/${this.config.maxAttempts}`;
        ctx.log.error(`${err.message} (${where})`);
      }
    }
    return processed;
  }

  // Un pase completo por todas las etapas. Devuelve cuántos trabajos procesó.
  async tick() {
    let total = 0;
    for (const stage of STAGES) total += await this.runStage(stage);
    return total;
  }

  // Bucle infinito tipo cron: tick, esperar pollIntervalMs, repetir.
  async start() {
    this.logger.info(`Daemon iniciado (worker ${this.workerId}, cada ${this.config.pollIntervalMs / 1000}s)`);
    while (!this.stopped) {
      try {
        await this.tick();
      } catch (err) {
        this.logger.error(`Tick falló: ${err.stack ?? err}`);
      }
      if (this.stopped) break;
      await new Promise((resolve) => {
        this.timer = setTimeout(resolve, this.config.pollIntervalMs);
        this.wake = resolve;
      });
    }
    this.logger.info('Daemon detenido');
  }

  stop() {
    this.stopped = true;
    this.abort.abort();
    clearTimeout(this.timer);
    this.wake?.();
  }
}
