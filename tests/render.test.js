import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { planTimeline } from '../core/render/plan.js';
import { buildSegmentArgs, buildComposeArgs } from '../core/render/commands.js';
import { zoomExpressions } from '../core/render/effects.js';
import { ENCODERS, detectEncoder } from '../core/render/encoder.js';
import { pickTrack, listMusic } from '../core/render/music.js';
import { resolveSfx } from '../core/render/sfx.js';
import { createFfmpeg } from '../core/media/ffmpeg.js';
import { createAssetsHandler } from '../core/stages/assets.js';
import { createRenderHandler } from '../core/stages/render.js';
import { ensureWorkspace } from '../core/workspace/workspace.js';
import { tmpDir } from './helpers.js';

const HAS_FFMPEG = spawnSync('ffmpeg', ['-version']).status === 0;
const PYTHON = process.platform === 'win32' ? 'python' : 'python3';
const quiet = { info() {}, warn() {}, error() {} };

const ev = (asset, extra = {}) => ({
  tts_text: 'x',
  visual_directive: { asset_type: asset, transition_in: 'fade', zoom_effect: 'zoom_in_center', ...extra },
  audio_directive: { sound_effect: 'none', music_ducking: true },
});

test('planTimeline: la transición termina justo cuando empieza la frase', () => {
  const script = {
    video_pacing: 'fast_paced',
    timeline_events: [
      ev('b-roll_video', { search_query: 'q' }),
      ev('product_image', { product_image_index: 1, transition_in: 'glitch' }),
      ev('b-roll_video', { search_query: 'q2', transition_in: 'cut' }),
      { ...ev('product_image', { product_image_index: 5 }), audio_directive: { sound_effect: 'ding', music_ducking: false } },
    ],
  };
  const voice = { duration: 8, segments: [{ start: 0, end: 1.9 }, { start: 2, end: 3.9 }, { start: 4, end: 5.9 }, { start: 6, end: 8 }] };
  const frames = [{ file: 'images/a.jpg' }, { file: 'images/b.jpg' }];
  const broll = [{ segment: 0, status: 'ok', file: 'b_roll/seg_00.mp4' }, { segment: 2, status: 'fallback_product', productImageIndex: 0 }];
  const { segments: s, total } = planTimeline({ script, voice, frames, broll, tail: 0.8 });

  assert.equal(total, 8.8);
  assert.deepEqual(s.map((x) => x.source), [
    { kind: 'video', file: 'b_roll/seg_00.mp4' },
    { kind: 'image', file: 'images/b.jpg' },
    { kind: 'image', file: 'images/a.jpg' }, // B-roll fallido -> imagen del producto
    { kind: 'image', file: 'images/b.jpg' }, // índice 5 con 2 frames -> 5 % 2
  ]);
  assert.equal(s[1].transition.glitch, true);
  assert.equal(s[1].startAt, 2 - 0.25);
  assert.equal(s[2].transition.duration, 0.033, 'cut = 1 frame');
  for (let i = 0; i < s.length; i++) {
    const until = i < s.length - 1 ? s[i + 1].visibleAt : total;
    assert.ok(Math.abs(s[i].startAt + s[i].length - until) < 1e-6, `seg ${i} cubre hasta que entra el siguiente`);
  }
  assert.equal(s[3].ducking, false);
  assert.equal(s[3].sfx, 'ding');
  assert.throws(() => planTimeline({ script, voice: { ...voice, segments: voice.segments.slice(1) }, frames }), /segmentos/);
});

test('zoomExpressions: Ken Burns centrado y paneos', () => {
  assert.deepEqual(zoomExpressions('zoom_in_center', { frames: 91, amount: 0.2 }), { z: '1+0.2*on/90', x: 'iw/2-(iw/zoom/2)', y: 'ih/2-(ih/zoom/2)' });
  assert.equal(zoomExpressions('zoom_out', { frames: 91, amount: 0.2 }).z, '1.2-0.2*on/90');
  assert.match(zoomExpressions('pan_right', { frames: 10, amount: 0.1 }).x, /\(iw-iw\/zoom\)\*on\/9/);
  assert.equal(zoomExpressions('none', { frames: 10, amount: 0.2 }), null);
});

test('buildSegmentArgs: imagen en loop, video en stream_loop, frames exactos, glitch', () => {
  const seg = { source: { kind: 'image' }, zoom: 'zoom_in_center', zoomAmount: 0.2, frames: 90, transition: { duration: 0.25, glitch: true } };
  const a = buildSegmentArgs(seg, { input: 'in.jpg', output: 'o.mp4', encoder: ENCODERS.x264 });
  assert.deepEqual(a.slice(0, 6), ['-loop', '1', '-framerate', '30', '-i', 'in.jpg']);
  const vf = a[a.indexOf('-vf') + 1];
  assert.match(vf, /^scale=2160:3840.*zoompan=z='1\+0\.2\*on\/89'.*s=1080x1920/);
  assert.match(vf, /rgbashift=.*enable='lt\(t,0\.400\)'/);
  assert.equal(a[a.indexOf('-frames:v') + 1], '90');
  const v = buildSegmentArgs({ ...seg, source: { kind: 'video' }, transition: null }, { input: 'c.mp4', output: 'o.mp4', encoder: ENCODERS.nvenc });
  assert.deepEqual(v.slice(0, 4), ['-stream_loop', '-1', '-i', 'c.mp4']);
  assert.ok(v.includes('h264_nvenc'));
  assert.ok(!v[v.indexOf('-vf') + 1].includes('rgbashift'));
});

test('buildComposeArgs: xfade encadenado, ducking selectivo, sfx y subtítulos', () => {
  const plan = {
    fps: 30,
    total: 6.8,
    segments: [
      { transition: null, ducking: true, voiceStart: 0, voiceEnd: 2 },
      { transition: { xfade: 'slideup', duration: 0.3 }, startAt: 1.8, ducking: false, voiceStart: 2.1, voiceEnd: 4 },
      { transition: { xfade: 'fade', duration: 0.3 }, startAt: 3.8, ducking: true, voiceStart: 4.1, voiceEnd: 6 },
    ],
  };
  const args = buildComposeArgs({
    plan, segmentFiles: ['s0.mp4', 's1.mp4', 's2.mp4'], voiceFile: 'voice.mp3', music: 'm.mp3',
    sfx: [{ file: 'whoosh.wav', at: 1.8 }], subtitlesName: 'captions.ass', output: 'final.mp4', encoder: ENCODERS.x264,
  });
  const fc = args[args.indexOf('-filter_complex') + 1];
  assert.match(fc, /\[s0\]\[s1\]xfade=transition=slideup:duration=0.3:offset=1.8\[x1\]/);
  assert.match(fc, /\[x1\]\[s2\]xfade=transition=fade:duration=0.3:offset=3.8\[x2\]/);
  assert.match(fc, /\[x2\]subtitles=captions\.ass\[vout\]/);
  assert.match(fc, /\[sc0\]volume=0:enable='between\(t,2\.1,4\)'\[sc\]/, 'sin ducking en el segmento 1');
  assert.match(fc, /\[mus\]\[sc\]sidechaincompress=threshold=0\.06:ratio=4:attack=5:release=100\[duck\]/);
  assert.match(fc, /adelay=1800\|1800/);
  assert.match(fc, /amix=inputs=3:duration=longest:normalize=0/);
  assert.deepEqual(args.slice(args.indexOf('-stream_loop'), args.indexOf('-stream_loop') + 4), ['-stream_loop', '-1', '-i', 'm.mp3']);
  assert.equal(args[args.indexOf('-t') + 1], '6.8');

  const noMusic = buildComposeArgs({ plan: { ...plan, segments: [plan.segments[0]] }, segmentFiles: ['s0.mp4'], voiceFile: 'v.mp3', output: 'o.mp4', encoder: ENCODERS.x264 });
  const fc2 = noMusic[noMusic.indexOf('-filter_complex') + 1];
  assert.ok(!fc2.includes('sidechaincompress') && !fc2.includes('xfade'));
  assert.match(fc2, /\[s0\]null\[vout\]/);
});

test('pickTrack: determinista por producto y reparte entre pistas', () => {
  const tracks = ['a.mp3', 'b.mp3', 'c.mp3'];
  assert.equal(pickTrack(tracks, 'ali_1'), pickTrack(tracks, 'ali_1'));
  const used = new Set(Array.from({ length: 30 }, (_, i) => pickTrack(tracks, `ali_${i}`)));
  assert.equal(used.size, 3);
  assert.equal(pickTrack([], 'x'), null);
});

test('detectEncoder: respeta la preferencia y no se fía de la lista de encoders', { skip: !HAS_FFMPEG }, async () => {
  assert.equal(await detectEncoder({ preference: 'x264' }), 'x264');
  assert.equal(await detectEncoder({ preference: 'nvenc' }), 'nvenc');
  const hasGpu = spawnSync('nvidia-smi').status === 0;
  assert.equal(await detectEncoder(), hasGpu ? 'nvenc' : 'x264');
});

test('resolveSfx: usa el archivo del usuario o sintetiza el que falta', { skip: !HAS_FFMPEG }, async () => {
  const dir = await tmpDir();
  const { ffmpeg, probeDuration } = createFfmpeg();
  await ffmpeg(['-f', 'lavfi', '-i', 'sine=d=0.2', path.join(dir, 'pop.mp3')]);
  const r = await resolveSfx({ names: ['pop', 'whoosh', 'whoosh', 'desconocido'], sfxDir: dir, ffmpeg });
  assert.deepEqual(Object.keys(r).sort(), ['pop', 'whoosh']);
  assert.equal(r.pop.generated, false);
  assert.equal(r.whoosh.file, path.join(dir, '_generated', 'whoosh.wav'));
  assert.ok((await probeDuration(r.whoosh.file)) > 0.3);
  assert.deepEqual(await listMusic(path.join(dir, 'nope')), []);
});

// ---- Render de punta a punta (voz falsa, todo lo demás real) ----
test('etapa render: final.mp4 1080x1920 con audio, portada y reutilización', { skip: !HAS_FFMPEG }, async () => {
  const dir = await tmpDir();
  const paths = await ensureWorkspace(dir, 'e2e');
  const { ffmpeg, probeDuration } = createFfmpeg();

  const frames = [];
  for (const [i, c] of ['#d33', '#3a3'].entries()) {
    const f = path.join(paths.images, `frame_0${i + 1}.jpg`);
    await sharp({ create: { width: 1080, height: 1920, channels: 3, background: c } }).jpeg().toFile(f);
    frames.push({ file: path.relative(paths.base, f) });
  }
  const script = {
    video_pacing: 'fast_paced',
    timeline_events: [
      { ...ev('b-roll_video', { search_query: 'kitchen' }), tts_text: 'Stop scrolling right now', audio_directive: { sound_effect: 'whoosh', music_ducking: true }, subtitle_emphasis_words: ['Stop'] },
      { ...ev('product_image', { product_image_index: 0, transition_in: 'glitch', zoom_effect: 'pan_left' }), tts_text: 'Meet the mini blender', subtitle_emphasis_words: [] },
      { ...ev('product_image', { product_image_index: 1, transition_in: 'zoom_blur', zoom_effect: 'zoom_out' }), tts_text: 'Tap the link today', audio_directive: { sound_effect: 'riser', music_ducking: false }, subtitle_emphasis_words: [] },
    ],
  };
  await fs.writeFile(path.join(paths.base, 'script.json'), JSON.stringify(script));
  const musicDir = path.join(dir, 'music');
  await fs.mkdir(musicDir);
  await ffmpeg(['-f', 'lavfi', '-i', 'sine=f=330:d=2', '-ac', '2', path.join(musicDir, 'loop.mp3')]);

  const env = { ...process.env, PYTHONPATH: fileURLToPath(new URL('./fixtures/fake_edge_tts', import.meta.url)), FAKE_TTS_LOG: path.join(dir, 'tts.log') };
  const product = { id: 'e2e', data: { frames, scriptFile: 'script.json' } };
  Object.assign(product.data, await createAssetsHandler({ tts: { pythonBin: PYTHON, voice: 'v', rate: '+15%', pitch: '+2Hz', env }, ffmpeg, probeDuration })({ product, paths, log: quiet }));

  const render = createRenderHandler({ ffmpeg, probeDuration, getEncoder: async () => 'x264', musicDir, sfxDir: path.join(dir, 'sfx'), musicVolume: 0.18, supersample: 1 });
  const { render: r } = await render({ product, paths, log: quiet });
  const final = path.join(paths.base, r.file);
  const probe = JSON.parse(spawnSync('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', final]).stdout.toString());
  const video = probe.streams.find((s) => s.codec_type === 'video');
  const audio = probe.streams.find((s) => s.codec_type === 'audio');
  assert.deepEqual([video.width, video.height, video.codec_name, video.r_frame_rate], [1080, 1920, 'h264', '30/1']);
  assert.equal(audio.codec_name, 'aac');
  assert.ok(Math.abs(r.duration - (product.data.voice.duration + 0.8)) < 0.1);
  assert.equal(r.music, 'loop.mp3');
  assert.ok((await fs.stat(path.join(paths.base, r.cover))).size > 0);
  assert.ok(!(await fs.readdir(paths.output)).includes('.segments'), 'limpia temporales');

  const mtime = (await fs.stat(final)).mtimeMs;
  await render({ product, paths, log: quiet });
  assert.equal((await fs.stat(final)).mtimeMs, mtime, 'no re-renderiza si nada cambió');
});
