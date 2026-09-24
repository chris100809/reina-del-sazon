import fs from 'node:fs/promises';
import path from 'node:path';

const EXT_BY_TYPE = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

// Descarga una imagen validando tipo y tamaño. Devuelve la ruta escrita.
export async function downloadImage(url, destBase, { fetch = globalThis.fetch, signal, maxBytes = 15 * 1024 * 1024, timeoutMs = 30_000 } = {}) {
  const timeout = AbortSignal.timeout(timeoutMs);
  const res = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  if (!res.ok) throw new Error(`HTTP ${res.status} descargando ${url}`);
  const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const ext = EXT_BY_TYPE[type];
  if (!ext) throw new Error(`Tipo no soportado (${type || 'desconocido'}) en ${url}`);
  const declared = Number(res.headers.get('content-length') ?? 0);
  if (declared > maxBytes) throw new Error(`Imagen demasiado grande (${declared} bytes)`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) throw new Error(`Imagen demasiado grande (${buf.length} bytes)`);
  const file = `${destBase}${ext}`;
  await fs.writeFile(file, buf);
  return file;
}

// Descarga varias imágenes con concurrencia limitada. Las que fallan se reportan pero
// no tumban el lote: basta con que algunas lleguen.
export async function downloadAll(urls, dir, { concurrency = 4, onError = () => {}, ...opts } = {}) {
  await fs.mkdir(dir, { recursive: true });
  const results = new Array(urls.length).fill(null);
  let next = 0;
  async function worker() {
    while (next < urls.length) {
      const i = next++;
      const base = path.join(dir, String(i + 1).padStart(2, '0'));
      try {
        results[i] = await downloadImage(urls[i], base, opts);
      } catch (err) {
        onError(urls[i], err);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return results.filter(Boolean);
}
