import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { parseProductId, isAliExpressUrl, isShortLink, normalizeImageUrl } from '../core/scrapers/aliexpress/url.js';
import { signParams, buildRequestParams, parseProductDetail } from '../core/scrapers/aliexpress/api.js';
import { parseProductPage, BlockedError } from '../core/scrapers/aliexpress/page.js';

test('parseProductId reconoce los formatos de link', () => {
  assert.equal(parseProductId('https://www.aliexpress.com/item/1005006123456789.html?spm=a2g0o'), '1005006123456789');
  assert.equal(parseProductId('https://es.aliexpress.com/item/1005006123456789.html'), '1005006123456789');
  assert.equal(parseProductId('https://www.aliexpress.us/item/3256805555555555.html'), '3256805555555555');
  assert.equal(parseProductId('https://m.aliexpress.com/i/1005006123456789.html'), '1005006123456789');
  assert.equal(parseProductId('https://www.aliexpress.com/p/x/index.html?productId=1005006123456789'), '1005006123456789');
  assert.equal(parseProductId('https://evil.com/item/1005006123456789.html'), null);
  assert.equal(parseProductId('https://aliexpress.com.evil.com/item/1005006123456789.html'), null);
  assert.equal(parseProductId('no es url'), null);
});

test('detecta links cortos y dominios válidos', () => {
  assert.ok(isShortLink('https://a.aliexpress.com/_mKabc12'));
  assert.ok(!isShortLink('https://www.aliexpress.com/item/1.html'));
  assert.ok(isAliExpressUrl('https://www.aliexpress.us/item/1.html'));
  assert.ok(!isAliExpressUrl('ftp://www.aliexpress.com/item/1.html'));
});

test('normalizeImageUrl quita sufijos de miniatura', () => {
  assert.equal(normalizeImageUrl('https://ae01.alicdn.com/kf/Sabc.jpg_640x640.jpg_.webp'), 'https://ae01.alicdn.com/kf/Sabc.jpg');
  assert.equal(normalizeImageUrl('//ae01.alicdn.com/kf/Sabc.png_220x220.png'), 'https://ae01.alicdn.com/kf/Sabc.png');
  assert.equal(normalizeImageUrl('https://ae01.alicdn.com/kf/Sabc.jpg?x=1'), 'https://ae01.alicdn.com/kf/Sabc.jpg');
  assert.equal(normalizeImageUrl('javascript:alert(1)'), null);
  assert.equal(normalizeImageUrl(''), null);
});

test('firma HMAC-SHA256 ordenada y en mayúsculas', () => {
  // Referencia: printf 'a1b2c3' | openssl dgst -sha256 -hmac secret
  assert.equal(signParams({ c: '3', a: '1', b: '2' }, 'secret'), '92BF214BEDA023F18F438BCBCF058EEA8C0D47ED733E058662427F800EE98040');
  const p = buildRequestParams({ appKey: 'k', appSecret: 's', productId: '123', now: 1700000000000 });
  assert.equal(p.method, 'aliexpress.affiliate.productdetail.get');
  assert.equal(p.ship_to_country, 'US');
  assert.match(p.sign, /^[0-9A-F]{64}$/);
  const { sign, ...rest } = p;
  assert.equal(sign, signParams(rest, 's'));
});

test('parseProductDetail normaliza la respuesta de la API', () => {
  const body = {
    aliexpress_affiliate_productdetail_get_response: {
      resp_result: {
        resp_code: 200,
        result: {
          products: {
            product: [{
              product_id: 1005006123456789,
              product_title: 'Mini Blender',
              target_sale_price: '12.99',
              target_sale_price_currency: 'USD',
              product_main_image_url: 'https://ae01.alicdn.com/kf/A.jpg',
              product_small_image_urls: { string: ['https://ae01.alicdn.com/kf/A.jpg_50x50.jpg', 'https://ae01.alicdn.com/kf/B.jpg'] },
              product_video_url: '',
            }],
          },
        },
      },
    },
  };
  const info = parseProductDetail(body);
  assert.equal(info.title, 'Mini Blender');
  assert.equal(info.price, '12.99');
  assert.equal(info.videoUrl, null);
  assert.deepEqual(info.imageUrls, ['https://ae01.alicdn.com/kf/A.jpg', 'https://ae01.alicdn.com/kf/B.jpg']);

  const empty = { aliexpress_affiliate_productdetail_get_response: { resp_result: { resp_code: 200, result: { current_record_count: 0 } } } };
  assert.equal(parseProductDetail(empty), null);
  assert.throws(() => parseProductDetail({ error_response: { code: 'IncompleteSignature', msg: 'bad sign' } }), /bad sign/);
});

test('parseProductPage extrae título e imágenes del HTML', async () => {
  const html = await fs.readFile(new URL('./fixtures/aliexpress-item.html', import.meta.url), 'utf8');
  const info = parseProductPage(html);
  assert.equal(info.title, 'Mini Portable Blender USB Rechargeable & Cordless');
  assert.deepEqual(info.imageUrls, [
    'https://ae01.alicdn.com/kf/Smain.jpg',
    'https://ae01.alicdn.com/kf/S222.jpg',
    'https://ae01.alicdn.com/kf/S333.png',
  ]);
});

test('parseProductPage detecta captcha', () => {
  assert.throws(() => parseProductPage('<html><script src="/_____tmd_____/punish"></script>'), BlockedError);
});
