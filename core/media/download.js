import fs from 'node:fs';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// Descarga en streaming (videos pesados no se cargan en memoria), con límite de tamaño,
// timeout y escritura atómica (.part + rename): un corte nunca deja un archivo a medias.
export async function streamDownload(url, dest, { fetch = globalThis.fetch, signal, maxBytes = 150 * 1024 * 1024, timeoutMs = 3 * 60 * 1000, expectType } = {}) {
  const timeout = AbortSignal.timeout(timeoutMs);
  const res = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} descargando ${url}`);
  const type = res.headers.get('content-type') ?? '';
  if (expectType && !type.startsWith(expectType)) throw new Error(`Tipo inesperado (${type}) en ${url}`);
  if (Number(res.headers.get('content-length') ?? 0) > maxBytes) throw new Error(`Archivo demasiado grande: ${url}`);

  let bytes = 0;
  const limit = new Transform({
    transform(chunk, _enc, cb) {
      bytes += chunk.length;
      cb(bytes > maxBytes ? new Error(`Archivo demasiado grande: ${url}`) : null, chunk);
    },
  });
  const tmp = `${dest}.part`;
  try {
    await pipeline(Readable.fromWeb(res.body), limit, fs.createWriteStream(tmp));
    await fs.promises.rename(tmp, dest);
  } catch (err) {
    await fs.promises.rm(tmp, { force: true });
    throw err;
  }
  return { file: dest, bytes };
}
