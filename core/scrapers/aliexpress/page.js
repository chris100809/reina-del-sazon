import { uniqueImageUrls } from './url.js';

// Lectura "honesta" de la página pública: una petición normal, sin técnicas de evasión.
// Si AliExpress responde con captcha lo reportamos y el daemon reintenta más tarde;
// la vía robusta es la API de afiliados o poner las imágenes a mano en raw_images/.
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

const BLOCK_MARKERS = ['/_____tmd_____/', 'punish?x5secdata', 'captcha-h5', 'baxia-punish'];

export class BlockedError extends Error {
  constructor(message = 'AliExpress devolvió un captcha/bloqueo') {
    super(message);
    this.name = 'BlockedError';
  }
}

function decodeEntities(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function meta(html, prop) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i');
  const alt = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, 'i');
  const m = html.match(re) ?? html.match(alt);
  return m ? decodeEntities(m[1]) : null;
}

// Extrae título e imágenes del HTML (JSON incrustado "imagePathList" + og:image).
export function parseProductPage(html) {
  if (BLOCK_MARKERS.some((m) => html.includes(m))) throw new BlockedError();

  const images = [];
  for (const m of html.matchAll(/"imagePathList"\s*:\s*(\[[^\]]*\])/g)) {
    try {
      images.push(...JSON.parse(m[1]));
    } catch {
      /* bloque malformado: lo ignoramos */
    }
  }
  const og = meta(html, 'og:image');
  if (og) images.push(og);

  let title = meta(html, 'og:title');
  if (!title) {
    const subject = html.match(/"subject"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (subject) title = JSON.parse(`"${subject[1]}"`);
  }
  if (title) title = title.replace(/\s*-\s*AliExpress.*$/i, '').trim();

  return { source: 'page', title: title || null, imageUrls: uniqueImageUrls(images) };
}

export async function fetchProductViaPage(url, { fetch = globalThis.fetch, signal } = {}) {
  const res = await fetch(url, { headers: HEADERS, redirect: 'follow', signal });
  if (res.status === 403 || res.status === 429) throw new BlockedError(`AliExpress HTTP ${res.status}`);
  if (!res.ok) throw new Error(`AliExpress HTTP ${res.status}`);
  return parseProductPage(await res.text());
}

// Sigue la redirección de un link corto (a.aliexpress.com/_xxxx) y devuelve la URL final.
export async function resolveShortLink(url, { fetch = globalThis.fetch, signal } = {}) {
  const res = await fetch(url, { headers: HEADERS, redirect: 'follow', signal });
  await res.body?.cancel();
  return res.url || url;
}
