import fs from 'node:fs/promises';
import path from 'node:path';
import { PermanentError } from '../utils/errors.js';
import { isAliExpressUrl, isShortLink, parseProductId, canonicalProductUrl } from '../scrapers/aliexpress/url.js';
import { fetchProductViaApi } from '../scrapers/aliexpress/api.js';
import { fetchProductViaPage, resolveShortLink } from '../scrapers/aliexpress/page.js';
import { downloadAll } from '../scrapers/download.js';
import { toVerticalFrame, imageSize } from '../images/vertical.js';

const IMAGE_RE = /\.(jpe?g|png|webp)$/i;
const SUPPLIER_FILE = 'supplier.json';

async function listImages(dir) {
  try {
    return (await fs.readdir(dir)).filter((f) => IMAGE_RE.test(f)).sort().map((f) => path.join(dir, f));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

// Obtiene los datos del proveedor: API oficial si hay credenciales, si no la página pública.
async function fetchSupplier({ sourceUrl, config, fetch, signal, log }) {
  let url = sourceUrl;
  if (isShortLink(url)) {
    url = await resolveShortLink(url, { fetch, signal });
    log.info(`Link corto resuelto: ${url}`);
  }
  if (!isAliExpressUrl(url)) throw new PermanentError(`No es un link de AliExpress: ${sourceUrl}`);
  const productId = parseProductId(url);
  if (!productId) throw new PermanentError(`No encontré el ID del producto en: ${url}`);

  const { appKey, appSecret, trackingId } = config.aliexpress ?? {};
  if (appKey && appSecret) {
    const info = await fetchProductViaApi({ productId, appKey, appSecret, trackingId, fetch, signal });
    if (info?.imageUrls.length) return info;
    log.warn('El producto no está en el programa de afiliados; uso la página pública');
  }
  const info = await fetchProductViaPage(canonicalProductUrl(productId), { fetch, signal });
  return { productId, ...info };
}

// Etapa "scrape": link de AliExpress -> raw_images/ + images/ (frames 1080x1920).
//
// Imágenes manuales: si pones fotos en raw_images/ antes de correr, se usan tal cual
// y no se contacta AliExpress (útil cuando hay captcha o para productos propios).
export function createScrapeHandler({ fetch = globalThis.fetch, maxImages = 12, minSide = 500 } = {}) {
  return async ({ product, paths, config, log, signal }) => {
    const supplierFile = path.join(paths.base, SUPPLIER_FILE);
    let supplier = await readJson(supplierFile);
    let raw = await listImages(paths.raw_images);

    if (!supplier && raw.length) {
      supplier = { source: 'manual', title: product.meta?.title ?? null, imageUrls: [] };
      log.info(`Usando ${raw.length} imagen(es) manual(es) de raw_images/`);
    } else if (!supplier) {
      supplier = await fetchSupplier({ sourceUrl: product.sourceUrl, config, fetch, signal, log });
      if (!supplier.imageUrls.length) {
        throw new Error('No se encontraron imágenes (¿página cambió o bloqueo?). Configura la API o usa imágenes manuales');
      }
      log.info(`${supplier.title ?? '(sin título)'} — ${supplier.imageUrls.length} imagen(es) vía ${supplier.source}`);

      // Descargamos en una carpeta temporal y movemos al final: si algo se corta a
      // mitad, el reintento no confunde descargas parciales con imágenes manuales.
      const tmp = path.join(paths.base, '.download');
      await fs.rm(tmp, { recursive: true, force: true });
      const files = await downloadAll(supplier.imageUrls.slice(0, maxImages), tmp, {
        fetch,
        signal,
        onError: (url, err) => log.warn(`Descarga falló: ${err.message}`),
      });
      for (const f of files) await fs.rename(f, path.join(paths.raw_images, path.basename(f)));
      await fs.rm(tmp, { recursive: true, force: true });
      await fs.writeFile(supplierFile, JSON.stringify(supplier, null, 2));
      raw = await listImages(paths.raw_images);
    }

    // Descarta miniaturas / iconos y genera los frames verticales.
    await fs.rm(paths.images, { recursive: true, force: true });
    await fs.mkdir(paths.images, { recursive: true });
    const frames = [];
    for (const file of raw) {
      let size;
      try {
        size = await imageSize(file);
      } catch {
        log.warn(`Imagen corrupta, se ignora: ${path.basename(file)}`);
        continue;
      }
      if (Math.min(size.width, size.height) < minSide) {
        log.warn(`Muy pequeña (${size.width}x${size.height}), se ignora: ${path.basename(file)}`);
        continue;
      }
      const out = path.join(paths.images, `frame_${String(frames.length + 1).padStart(2, '0')}.jpg`);
      const { mode } = await toVerticalFrame(file, out);
      frames.push({ file: path.relative(paths.base, out), source: path.relative(paths.base, file), mode });
    }
    if (!frames.length) throw new Error('Ninguna imagen utilizable tras el filtrado');
    log.info(`${frames.length} frame(s) 1080x1920 listos`);

    const { imageUrls, ...details } = supplier;
    return { supplier: { ...details, imageCount: raw.length }, frames };
  };
}
