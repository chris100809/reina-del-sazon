import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { createScrapeHandler } from '../core/stages/scrape.js';
import { ensureWorkspace } from '../core/workspace/workspace.js';
import { PermanentError } from '../core/utils/errors.js';
import { createLogger } from '../core/utils/logger.js';
import { tmpDir } from './helpers.js';

const logger = createLogger({ silent: true });
const log = { info: logger.info, warn: logger.warn, error: logger.error };
const PAGE = await fs.readFile(new URL('./fixtures/aliexpress-item.html', import.meta.url), 'utf8');

const jpg = (w, h) => sharp({ create: { width: w, height: h, channels: 3, background: '#20a040' } }).jpeg().toBuffer();

function fakeFetch(routes) {
  const calls = [];
  const fn = async (url, opts = {}) => {
    calls.push({ url: String(url), method: opts.method ?? 'GET' });
    const route = routes[String(url)];
    if (!route) return new Response('not found', { status: 404 });
    return typeof route === 'function' ? route() : route.clone();
  };
  fn.calls = calls;
  return fn;
}

const img = (buf) => new Response(buf, { headers: { 'content-type': 'image/jpeg' } });

async function ctxFor(product, config = {}) {
  const dir = await tmpDir();
  return { product, paths: await ensureWorkspace(dir, product.id), config, log, signal: undefined };
}

test('link de AliExpress -> descarga, filtra miniaturas y genera frames 9:16', async () => {
  const big = await jpg(800, 800);
  const small = await jpg(200, 200);
  const fetch = fakeFetch({
    'https://www.aliexpress.us/item/1005006123456789.html': new Response(PAGE, { headers: { 'content-type': 'text/html' } }),
    'https://ae01.alicdn.com/kf/Smain.jpg': () => img(big),
    'https://ae01.alicdn.com/kf/S222.jpg': () => img(small),
    // S333.png -> 404: no debe tumbar el lote
  });
  const ctx = await ctxFor({ id: 'ali_1', sourceUrl: 'https://es.aliexpress.com/item/1005006123456789.html?spm=x' });
  const out = await createScrapeHandler({ fetch })(ctx);

  assert.equal(out.supplier.title, 'Mini Portable Blender USB Rechargeable & Cordless');
  assert.equal(out.supplier.source, 'page');
  assert.equal(out.frames.length, 1, 'la miniatura 200x200 se descarta');
  const meta = await sharp(path.join(ctx.paths.base, out.frames[0].file)).metadata();
  assert.deepEqual([meta.width, meta.height], [1080, 1920]);

  // Reintento: no vuelve a contactar AliExpress (usa supplier.json + raw_images).
  const before = fetch.calls.length;
  await createScrapeHandler({ fetch })(ctx);
  assert.equal(fetch.calls.length, before);
});

test('usa la API oficial cuando hay credenciales', async () => {
  const api = {
    aliexpress_affiliate_productdetail_get_response: { resp_result: { resp_code: 200, result: { products: { product: [{
      product_id: 1005006123456789, product_title: 'API Blender', target_sale_price: '9.99',
      product_main_image_url: 'https://ae01.alicdn.com/kf/Smain.jpg', product_small_image_urls: { string: [] },
    }] } } } },
  };
  const big = await jpg(900, 900);
  const fetch = fakeFetch({
    'https://api-sg.aliexpress.com/sync': Response.json(api),
    'https://ae01.alicdn.com/kf/Smain.jpg': () => img(big),
  });
  const ctx = await ctxFor(
    { id: 'ali_2', sourceUrl: 'https://www.aliexpress.com/item/1005006123456789.html' },
    { aliexpress: { appKey: 'k', appSecret: 's' } },
  );
  const out = await createScrapeHandler({ fetch })(ctx);
  assert.equal(out.supplier.source, 'api');
  assert.equal(out.supplier.price, '9.99');
  assert.equal(fetch.calls[0].method, 'POST');
  assert.ok(!fetch.calls.some((c) => c.url.includes('/item/')), 'no toca la página pública');
});

test('imágenes manuales en raw_images/ evitan contactar AliExpress', async () => {
  const fetch = fakeFetch({});
  const ctx = await ctxFor({ id: 'm1', sourceUrl: 'https://www.aliexpress.com/item/1005006123456789.html', meta: { title: 'Mío' } });
  await fs.writeFile(path.join(ctx.paths.raw_images, 'foto.jpg'), await jpg(1200, 900));
  const out = await createScrapeHandler({ fetch })(ctx);
  assert.equal(fetch.calls.length, 0);
  assert.equal(out.supplier.source, 'manual');
  assert.equal(out.supplier.title, 'Mío');
  assert.equal(out.frames.length, 1);
});

test('link que no es de AliExpress -> PermanentError', async () => {
  const ctx = await ctxFor({ id: 'x', sourceUrl: 'https://amazon.com/dp/B000' });
  await assert.rejects(createScrapeHandler({ fetch: fakeFetch({}) })(ctx), PermanentError);
});

test('captcha -> error reintentable (no permanente)', async () => {
  const fetch = fakeFetch({
    'https://www.aliexpress.us/item/1005006123456789.html': new Response('<script src="/_____tmd_____/x"></script>'),
  });
  const ctx = await ctxFor({ id: 'c', sourceUrl: 'https://www.aliexpress.com/item/1005006123456789.html' });
  await assert.rejects(createScrapeHandler({ fetch })(ctx), (err) => !(err instanceof PermanentError) && /captcha/.test(err.message));
});
