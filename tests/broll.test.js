import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { queryFallbacks } from '../core/broll/queries.js';
import { searchPexelsVideos, pickFile, chooseVideo } from '../core/broll/pexels.js';
import { streamDownload } from '../core/media/download.js';
import { gatherBroll } from '../core/broll/gather.js';
import { createFfmpeg } from '../core/media/ffmpeg.js';
import { ensureWorkspace } from '../core/workspace/workspace.js';
import { PermanentError } from '../core/utils/errors.js';
import { tmpDir } from './helpers.js';

const HAS_FFMPEG = spawnSync('ffmpeg', ['-version']).status === 0;
const quiet = { info() {}, warn() {}, error() {} };

test('queryFallbacks: quita stopwords y recorta la última palabra', () => {
  assert.deepEqual(queryFallbacks('Shocked person looking at phone!', ['lifestyle']), [
    'shocked person looking at phone',
    'shocked person looking phone',
    'shocked person looking',
    'shocked person',
    'shocked',
    'lifestyle',
  ]);
  assert.deepEqual(queryFallbacks('kitchen gadget'), ['kitchen gadget', 'kitchen']);
  assert.deepEqual(queryFallbacks(''), []);
});

const file = (w, h, q = 'hd') => ({ file_type: 'video/mp4', link: `https://v/${w}x${h}.mp4`, width: w, height: h, fps: 30, quality: q });

test('searchPexelsVideos: request vertical con Authorization y normaliza', async () => {
  let req;
  const fetch = async (url, init) => {
    req = { url: new URL(url), init };
    return Response.json(
      { videos: [{ id: 7, url: 'https://pexels.com/v/7', duration: 12, width: 1080, height: 1920, user: { name: 'Ana' }, video_files: [file(1080, 1920), { file_type: 'video/webm', link: 'x', width: 1, height: 2 }] }] },
      { headers: { 'x-ratelimit-remaining': '199' } },
    );
  };
  const r = await searchPexelsVideos({ query: 'kitchen', apiKey: 'KEY', fetch });
  assert.equal(req.init.headers.Authorization, 'KEY');
  assert.equal(req.url.searchParams.get('orientation'), 'portrait');
  assert.equal(req.url.searchParams.get('size'), 'medium');
  assert.equal(r.remaining, 199);
  assert.equal(r.videos[0].id, '7');
  assert.equal(r.videos[0].files.length, 1, 'descarta no-mp4');

  const denied = async () => new Response('', { status: 401 });
  await assert.rejects(searchPexelsVideos({ query: 'x', apiKey: 'bad', fetch: denied }), PermanentError);
  const limited = async () => new Response('', { status: 429 });
  await assert.rejects(searchPexelsVideos({ query: 'x', apiKey: 'k', fetch: limited }), (e) => !(e instanceof PermanentError));
});

test('pickFile y chooseVideo', () => {
  assert.equal(pickFile([file(2160, 3840), file(720, 1280), file(1080, 1920), file(1920, 1080)]).height, 1280, 'el más liviano >= 1280, sin 4K ni horizontales');
  assert.equal(pickFile([file(360, 640), file(540, 960)]).height, 960, 'si no hay HD, el más grande');
  assert.equal(pickFile([file(1920, 1080)]), null);

  const vids = [
    { id: 'a', duration: 3, files: [file(1080, 1920)] },
    { id: 'b', duration: 10, files: [file(1920, 1080)] },
    { id: 'c', duration: 9, files: [file(1080, 1920)] },
    { id: 'd', duration: 6, files: [file(1080, 1920)] },
  ];
  assert.equal(chooseVideo(vids, { minDuration: 5 }).video.id, 'c', 'primero que alcance la duración');
  assert.equal(chooseVideo(vids, { minDuration: 5, usedIds: new Set(['c']) }).video.id, 'd', 'no repite clips');
  assert.equal(chooseVideo(vids, { minDuration: 20 }).video.id, 'c', 'si ninguno alcanza, el más largo');
  assert.equal(chooseVideo([], { minDuration: 1 }), null);
});

test('streamDownload: límite de tamaño sin dejar archivos a medias', async () => {
  const dir = await tmpDir();
  const fetch = async () => new Response(new Uint8Array(5000), { headers: { 'content-type': 'video/mp4' } });
  const ok = await streamDownload('https://x/v.mp4', path.join(dir, 'ok.mp4'), { fetch, expectType: 'video/' });
  assert.equal(ok.bytes, 5000);
  await assert.rejects(streamDownload('https://x/v.mp4', path.join(dir, 'big.mp4'), { fetch, maxBytes: 1000 }), /grande/);
  assert.deepEqual((await fs.readdir(dir)).sort(), ['ok.mp4']);
});

// ---- Integración con ffmpeg real ----

async function mp4(file, { w, h, d, color }) {
  const { ffmpeg } = createFfmpeg();
  await ffmpeg(['-f', 'lavfi', '-i', `color=${color}:s=${w}x${h}:d=${d}:r=25`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', file]);
  return fs.readFile(file);
}

function scriptWith(queries) {
  return {
    timeline_events: queries.map((q, i) => ({
      segment_index: i,
      tts_text: 'x',
      visual_directive: q ? { asset_type: 'b-roll_video', search_query: q } : { asset_type: 'product_image', product_image_index: 0 },
    })),
  };
}

test('gatherBroll: fallback de búsqueda, loop, 1080x1920, sin repetir y reanudable', { skip: !HAS_FFMPEG }, async () => {
  const dir = await tmpDir();
  const paths = await ensureWorkspace(dir, 'p1');
  const long = await mp4(path.join(dir, 'long.mp4'), { w: 720, h: 1280, d: 4, color: 'red' });
  const short = await mp4(path.join(dir, 'short.mp4'), { w: 540, h: 960, d: 1, color: 'blue' });

  const catalog = {
    shocked: [{ id: '1', source: 'pexels', duration: 4, files: [{ link: 'https://cdn/long.mp4', width: 720, height: 1280 }] }],
    'busy morning': [
      { id: '1', source: 'pexels', duration: 4, files: [{ link: 'https://cdn/long.mp4', width: 720, height: 1280 }] },
      { id: '2', source: 'pexels', duration: 1, files: [{ link: 'https://cdn/short.mp4', width: 540, height: 960 }] },
    ],
  };
  const searches = [];
  const search = async ({ query }) => {
    searches.push(query);
    return { videos: catalog[query] ?? [] };
  };
  const fetch = async (url) => {
    const body = { 'https://cdn/long.mp4': long, 'https://cdn/short.mp4': short }[url];
    return body ? new Response(body, { headers: { 'content-type': 'video/mp4' } }) : new Response('', { status: 404 });
  };
  const { ffmpeg, probeDuration } = createFfmpeg();
  const script = scriptWith(['shocked person looking at phone', null, 'busy morning', 'zzz nothing']);
  const voice = { segments: [{ start: 0, end: 2 }, { start: 2.1, end: 4 }, { start: 4.1, end: 6.1 }, { start: 6.2, end: 8 }] };
  const args = { script, voice, paths, imageCount: 3, search, ffmpeg, fetch, log: quiet };

  const r = await gatherBroll(args);
  assert.deepEqual(r.map((e) => [e.segment, e.status]), [[0, 'ok'], [2, 'ok'], [3, 'fallback_product']]);
  assert.equal(r[0].queryUsed, 'shocked', 'encontró recortando palabras');
  assert.equal(r[1].videoId, '2', 'no repite el clip 1 ya usado en el seg 0');
  assert.equal(r[1].looped, true);
  assert.equal(r[2].productImageIndex, 0);

  for (const e of r.filter((x) => x.status === 'ok')) {
    const f = path.join(paths.base, e.file);
    assert.ok(Math.abs((await probeDuration(f)) - e.duration) < 0.1, `duración ${e.file}`);
    const { stdout } = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate', '-of', 'csv=p=0', f]);
    assert.equal(stdout.toString().trim(), '1080,1920,30/1');
  }
  assert.equal(r[1].duration, 2.5, 'duración del segmento (2.0) + 0.5 de margen para la transición');
  assert.ok(!(await fs.readdir(paths.b_roll)).some((f) => f.endsWith('.part')));

  // Reintento: no vuelve a buscar los segmentos ya resueltos.
  const n = searches.length;
  await gatherBroll(args);
  assert.deepEqual(searches.slice(n), ['zzz nothing', 'zzz'], 'solo reintenta el que había fallado');
});

test('gatherBroll sin API key: todo B-roll pasa a imagen de producto', { skip: !HAS_FFMPEG }, async () => {
  const dir = await tmpDir();
  const paths = await ensureWorkspace(dir, 'p2');
  const r = await gatherBroll({
    script: scriptWith(['a', 'b']),
    voice: { segments: [{ start: 0, end: 1 }, { start: 1, end: 2 }] },
    paths, imageCount: 2, search: null, ffmpeg: null, log: quiet,
  });
  assert.deepEqual(r.map((e) => [e.status, e.productImageIndex]), [['fallback_product', 0], ['fallback_product', 1]]);
});

test('gatherBroll: key inválida se propaga como PermanentError', async () => {
  const dir = await tmpDir();
  const paths = await ensureWorkspace(dir, 'p3');
  const search = async () => { throw new PermanentError('Pexels rechazó la API key'); };
  await assert.rejects(
    gatherBroll({ script: scriptWith(['a']), voice: { segments: [{ start: 0, end: 1 }] }, paths, imageCount: 1, search, ffmpeg: null, log: quiet }),
    PermanentError,
  );
});
