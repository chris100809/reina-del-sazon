import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildTimeline, estimateWords, runTts } from '../core/audio/voice.js';
import { createAssetsHandler } from '../core/stages/assets.js';
import { createFfmpeg } from '../core/media/ffmpeg.js';
import { ensureWorkspace } from '../core/workspace/workspace.js';
import { PermanentError } from '../core/utils/errors.js';
import { tmpDir } from './helpers.js';

const PYTHON = process.platform === 'win32' ? 'python' : 'python3';
const HAS_TOOLS = spawnSync('ffmpeg', ['-version']).status === 0 && spawnSync(PYTHON, ['--version']).status === 0;
const HAS_LIBASS = HAS_TOOLS && /subtitles/.test(spawnSync('ffmpeg', ['-hide_banner', '-filters']).stdout?.toString() ?? '');
const FAKE = fileURLToPath(new URL('./fixtures/fake_edge_tts', import.meta.url));
const VALID = JSON.parse(await fs.readFile(new URL('./fixtures/script-valid.json', import.meta.url), 'utf8'));
const quiet = { info() {}, warn() {}, error() {} };
const TTS = { pythonBin: PYTHON, voice: 'en-US-AriaNeural', rate: '+15%', pitch: '+2Hz' };

async function fakeEnv(mode = 'ok') {
  const log = path.join(await tmpDir(), 'tts.log');
  await fs.writeFile(log, '');
  return { env: { ...process.env, PYTHONPATH: FAKE, FAKE_TTS_LOG: log, FAKE_TTS_MODE: mode }, log };
}
const readLog = async (f) => (await fs.readFile(f, 'utf8')).trim().split('\n').map((l) => JSON.parse(l));

test('buildTimeline: encadena segmentos con gap y hace absolutos los tiempos', () => {
  const script = {
    timeline_events: [
      { segment_index: 0, tts_text: 'Stop scrolling now', subtitle_emphasis_words: ['Stop'] },
      { segment_index: 1, tts_text: 'Meet the blender', subtitle_emphasis_words: [] },
    ],
  };
  const clips = [
    { index: 0, file: 'a', words: [{ text: 'Stop', start_ms: 50, end_ms: 300 }, { text: 'scrolling', start_ms: 320, end_ms: 800 }, { text: 'now', start_ms: 820, end_ms: 1000 }] },
    { index: 1, file: 'b', words: [] },
  ];
  const t = buildTimeline({ clips, durations: [1.2, 0.9], script, gap: 0.1 });
  assert.deepEqual(t.segments.map((s) => [s.start, s.end]), [[0, 1.2], [1.3, 2.2]]);
  assert.equal(t.duration, 2.2);
  assert.deepEqual(t.words[0], { text: 'Stop', start: 0.05, end: 0.3, segment: 0, emphasis: true });
  assert.equal(t.words[1].emphasis, false);
  const seg1 = t.words.filter((w) => w.segment === 1);
  assert.deepEqual(seg1.map((w) => w.text), ['Meet', 'the', 'blender'], 'estimadas si no hubo WordBoundary');
  assert.ok(seg1[0].start >= 1.3 && seg1.at(-1).end <= 2.2);
});

test('estimateWords reparte proporcionalmente y sin solaparse', () => {
  const w = estimateWords("It's cordless, and USB-rechargeable!", 2);
  assert.deepEqual(w.map((x) => x.text), ["It's", 'cordless', 'and', 'USB-rechargeable']);
  for (let i = 1; i < w.length; i++) assert.ok(w[i].start >= w[i - 1].end);
  assert.ok(w.at(-1).end <= 2);
});

test('tts.py: pasa voz/rate/pitch/WordBoundary y devuelve tiempos en ms', { skip: !HAS_TOOLS }, async () => {
  const { env, log } = await fakeEnv();
  const out = await tmpDir();
  const clips = await runTts({ ...TTS, env, outDir: out, segments: [{ index: 0, text: 'Hello there friend' }, { index: 3, text: 'Buy it' }] });
  assert.deepEqual(clips.map((c) => path.basename(c.file)), ['seg_00.mp3', 'seg_03.mp3']);
  assert.deepEqual(clips[0].words.map((w) => w.text), ['Hello', 'there', 'friend']);
  assert.equal(clips[0].words[1].start_ms, 300);
  const calls = await readLog(log);
  assert.deepEqual(calls[0], { text: 'Hello there friend', voice: 'en-US-AriaNeural', rate: '+15%', pitch: '+2Hz', boundary: 'WordBoundary' });
});

test('tts.py: sin edge-tts -> PermanentError; red caída -> reintentable', { skip: !HAS_TOOLS }, async () => {
  const out = await tmpDir();
  const noModule = { ...process.env, PYTHONPATH: await tmpDir(), PYTHONNOUSERSITE: '1' };
  const hasReal = spawnSync(PYTHON, ['-c', 'import edge_tts']).status === 0;
  if (!hasReal) {
    await assert.rejects(runTts({ ...TTS, env: noModule, outDir: out, segments: [{ index: 0, text: 'hi' }] }), PermanentError);
  }
  const { env } = await fakeEnv('fail');
  await assert.rejects(
    runTts({ ...TTS, env, outDir: out, segments: [{ index: 0, text: 'hi' }] }),
    (e) => !(e instanceof PermanentError) && /red caída/.test(e.message),
  );
  await assert.rejects(runTts({ ...TTS, pythonBin: 'python-que-no-existe', outDir: out, segments: [{ index: 0, text: 'hi' }] }), PermanentError);
});

test('etapa assets: voz unida y masterizada + captions.ass, y reutiliza en reintentos', { skip: !HAS_TOOLS }, async () => {
  const { env, log } = await fakeEnv();
  const dir = await tmpDir();
  const paths = await ensureWorkspace(dir, 'p1');
  await fs.writeFile(path.join(paths.base, 'script.json'), JSON.stringify(VALID));
  const { ffmpeg, probeDuration } = createFfmpeg();
  const handler = createAssetsHandler({ tts: { ...TTS, env }, ffmpeg, probeDuration });
  const product = { id: 'p1', data: { scriptFile: 'script.json' } };

  const out = await handler({ product, paths, log: quiet });
  const segs = out.voice.segments;
  assert.equal(segs.length, VALID.timeline_events.length);
  for (let i = 1; i < segs.length; i++) assert.ok(Math.abs(segs[i].start - (segs[i - 1].end + 0.12)) < 0.002, 'gap de 0.12 s');
  // Medimos el audio decodificado (ffprobe sobre MP3 suma ~40 ms de relleno del encoder).
  const decoded = path.join(dir, 'decoded.wav');
  await ffmpeg(['-i', path.join(paths.base, out.voice.file), decoded]);
  const real = await probeDuration(decoded);
  assert.ok(Math.abs(real - out.voice.duration) < 0.03, `duración real ${real} vs timeline ${out.voice.duration}`);

  const ass = await fs.readFile(path.join(paths.base, out.subtitles.file), 'utf8');
  assert.match(ass, /PlayResX: 1080/);
  assert.match(ass, /\{\\c&H0000FFFF&\\fscx115\\fscy115\}STILL\{\\r\}/, 'primera palabra resaltada en amarillo');
  assert.match(ass, /\\t\(0,90,\\fscx132\\fscy132\)\}SKIPPING/, 'palabra de énfasis con pop');

  // FFmpeg (libass) debe aceptar el .ass: lo quemamos sobre un fondo negro.
  if (HAS_LIBASS) {
    const frame = path.join(dir, 'frame.png');
    await ffmpeg(['-f', 'lavfi', '-i', 'color=black:s=1080x1920:d=2', '-vf', 'subtitles=captions.ass', '-ss', '0.5', '-frames:v', '1', frame], { cwd: paths.subs });
    assert.ok((await fs.stat(frame)).size > 0);
  }
  const n = (await readLog(log)).length;
  await handler({ product, paths, log: quiet });
  assert.equal((await readLog(log)).length, n, 'no vuelve a sintetizar si el guion no cambió');

  const changed = structuredClone(VALID);
  changed.timeline_events[0].tts_text = 'Brand new hook line here?';
  await fs.writeFile(path.join(paths.base, 'script.json'), JSON.stringify(changed));
  await handler({ product, paths, log: quiet });
  assert.ok((await readLog(log)).length > n, 'regenera si el guion cambió');
});
