import crypto from 'node:crypto';
import { uniqueImageUrls } from './url.js';

// Cliente mínimo de la AliExpress Open Platform (programa de afiliados, gratis).
// Registro: https://portals.aliexpress.com  -> App Key / App Secret / Tracking ID.
export const API_ENDPOINT = 'https://api-sg.aliexpress.com/sync';

// Firma IOP: parámetros ordenados, concatenados clave+valor, HMAC-SHA256 en hex mayúsculas.
export function signParams(params, secret) {
  const base = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join('');
  return crypto.createHmac('sha256', secret).update(base, 'utf8').digest('hex').toUpperCase();
}

export function buildRequestParams({ appKey, appSecret, trackingId, productId, now = Date.now() }) {
  const params = {
    app_key: appKey,
    method: 'aliexpress.affiliate.productdetail.get',
    sign_method: 'sha256',
    timestamp: String(now),
    product_ids: productId,
    target_currency: 'USD',
    target_language: 'EN',
    ship_to_country: 'US',
  };
  if (trackingId) params.tracking_id = trackingId;
  params.sign = signParams(params, appSecret);
  return params;
}

// Convierte la respuesta cruda en nuestro formato normalizado. Devuelve null si el
// producto no está en el programa de afiliados (entonces se usa la página pública).
export function parseProductDetail(body) {
  if (body?.error_response) {
    const e = body.error_response;
    throw new Error(`AliExpress API: ${e.code ?? ''} ${e.msg ?? e.sub_msg ?? 'error'}`.trim());
  }
  const resp = body?.aliexpress_affiliate_productdetail_get_response?.resp_result;
  if (!resp) throw new Error('AliExpress API: respuesta con formato inesperado');
  if (Number(resp.resp_code) !== 200) {
    throw new Error(`AliExpress API: ${resp.resp_code} ${resp.resp_msg ?? ''}`.trim());
  }
  const p = resp.result?.products?.product?.[0];
  if (!p) return null;
  const small = p.product_small_image_urls?.string ?? [];
  return {
    source: 'api',
    productId: String(p.product_id),
    title: p.product_title ?? null,
    price: p.target_sale_price ?? p.sale_price ?? null,
    originalPrice: p.target_original_price ?? p.original_price ?? null,
    currency: p.target_sale_price_currency ?? 'USD',
    category: p.second_level_category_name ?? p.first_level_category_name ?? null,
    rating: p.evaluate_rate ?? null,
    videoUrl: p.product_video_url || null,
    affiliateUrl: p.promotion_link ?? null,
    imageUrls: uniqueImageUrls([p.product_main_image_url, ...(Array.isArray(small) ? small : [small])]),
  };
}

export async function fetchProductViaApi({ productId, appKey, appSecret, trackingId, fetch = globalThis.fetch, signal }) {
  const params = buildRequestParams({ appKey, appSecret, trackingId, productId });
  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams(params).toString(),
    signal,
  });
  if (!res.ok) throw new Error(`AliExpress API HTTP ${res.status}`);
  return parseProductDetail(await res.json());
}
