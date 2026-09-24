const PRODUCT_HOST = /(^|\.)aliexpress\.(com|us|ru)$/i;
const SHORT_HOSTS = new Set(['a.aliexpress.com', 's.click.aliexpress.com', 'click.aliexpress.com']);

function parse(raw) {
  try {
    return new URL(String(raw).trim());
  } catch {
    return null;
  }
}

export function isAliExpressUrl(raw) {
  const url = parse(raw);
  return !!url && /^https?:$/.test(url.protocol) && PRODUCT_HOST.test(url.hostname);
}

// Links cortos de la app / afiliados: hay que seguir la redirección para ver el ID.
export function isShortLink(raw) {
  const url = parse(raw);
  return !!url && SHORT_HOSTS.has(url.hostname.toLowerCase());
}

// Soporta: /item/1005006123456789.html, /i/1005....html, ?productId=1005...
export function parseProductId(raw) {
  const url = parse(raw);
  if (!url || !PRODUCT_HOST.test(url.hostname)) return null;
  const fromPath = url.pathname.match(/\/(?:item|i)\/(\d{6,20})\.html$/i);
  if (fromPath) return fromPath[1];
  const fromQuery = url.searchParams.get('productId');
  return fromQuery && /^\d{6,20}$/.test(fromQuery) ? fromQuery : null;
}

export function canonicalProductUrl(productId) {
  return `https://www.aliexpress.us/item/${productId}.html`;
}

// Las imágenes de alicdn traen sufijos de miniatura (".jpg_640x640.jpg_.webp").
// Los quitamos para descargar el original en máxima resolución.
export function normalizeImageUrl(raw) {
  if (typeof raw !== 'string' || !raw) return null;
  const url = parse(raw.startsWith('//') ? `https:${raw}` : raw);
  if (!url || !/^https?:$/.test(url.protocol)) return null;
  url.protocol = 'https:';
  const m = url.pathname.match(/^(.*?\.(?:jpe?g|png|webp))(?:_[^/]*)?$/i);
  if (!m) return null;
  url.pathname = m[1];
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function uniqueImageUrls(list) {
  return [...new Set(list.map(normalizeImageUrl).filter(Boolean))];
}
