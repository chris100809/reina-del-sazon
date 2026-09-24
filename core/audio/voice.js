import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runProcess } from '../media/process.js';
import { PermanentError } from '../utils/errors.js';

export const TTS_SCRIPT = fileURLToPath(new URL('./tts.py', import.meta.url));

const WORD_RE = /[\p{L}\p{N}'’-]+/gu;
const norm = (w) => w.toLowerCase().replace(/’/g, "'").replace(/[^\p{L}\p{N}']/gu, '');

// Invoca tts.py (Python + edge-tts) y devuelve los clips por segmento con tiempos por palabra.
export async function runTts({ pythonBin, segments, outDir, voice, rate, pitch, volume = '+0%', signal, scriptPath = TTS_SCRIPT, env }) {
  const input = JSON.stringify({ voice, rate, pitch, volume, out_dir: outDir, segments });
  const { code, stdout, stderr } = await runProcess(pythonBin, [scriptPath], { input, signal, env, timeoutMs: 5 * 60 * 1000 });
  const detail = stderr.trim().split('\n').slice(-2).join(' | ');
  if (code === 3 || code === 4) throw new PermanentError(`TTS: ${detail}`);
  if (code !== 0) throw new Error(`TTS falló (código ${code}): ${detail}`);
  return JSON.parse(stdout).segments;
}

// Si edge-tts no mandó WordBoundary, repartimos las palabras del texto
// proporcionalmente a su longitud (mejor que no tener subtítulos).
export function estimateWords(text, durationSec) {
  const tokens = text.match(WORD_RE) ?? [];
  const total = tokens.reduce((n, t) => n + t.length + 1, 0) || 1;
  let t = 0;
  return tokens.map((tok) => {
    const d = (durationSec * (tok.length + 1)) / total;
    const w = { text: tok, start: t, end: t + d * 0.92 };
    t += d;
    return w;
  });
}

// Coloca los clips uno tras otro (con `gap` de silencio) y convierte los tiempos
// relativos de cada palabra en tiempos absolutos del video.
export function buildTimeline({ clips, durations, script, gap }) {
  const segments = [];
  const words = [];
  let cursor = 0;
  clips.forEach((clip, i) => {
    const seg = script.timeline_events[clip.index];
    const duration = durations[i];
    const start = cursor;
    const end = start + duration;
    const emphasis = new Set((seg.subtitle_emphasis_words ?? []).map(norm));
    const rel = clip.words.length
      ? clip.words.map((w) => ({ text: w.text, start: w.start_ms / 1000, end: w.end_ms / 1000 }))
      : estimateWords(seg.tts_text, duration);
    for (const w of rel) {
      words.push({
        text: w.text,
        start: round(start + Math.min(w.start, duration)),
        end: round(start + Math.min(w.end, duration)),
        segment: clip.index,
        emphasis: emphasis.has(norm(w.text)),
      });
    }
    segments.push({ index: clip.index, start: round(start), end: round(end), audioFile: clip.file, estimatedWords: !clip.words.length });
    cursor = end + gap;
  });
  return { segments, words, duration: round(cursor - gap) };
}

const round = (n) => Math.round(n * 1000) / 1000;

// Une los clips en una sola pista y la "masteriza" para que suene a anuncio:
// highpass (quita graves sucios) -> compresor (voz pareja) -> loudnorm a -14 LUFS (estándar de redes).
export async function concatVoice({ ffmpeg, files, gap, output, signal }) {
  const inputs = files.flatMap((f) => ['-i', f]);
  const padded = files.map((_, i) => (i < files.length - 1 ? `[${i}:a]apad=pad_dur=${gap}[p${i}]` : `[${i}:a]anull[p${i}]`));
  const chain = files.map((_, i) => `[p${i}]`).join('');
  const filter = [
    ...padded,
    `${chain}concat=n=${files.length}:v=0:a=1[cat]`,
    '[cat]highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=60,loudnorm=I=-14:TP=-1.5:LRA=11[out]',
  ].join(';');
  await ffmpeg([...inputs, '-filter_complex', filter, '-map', '[out]', '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '160k', output], { signal });
  return output;
}

export async function synthesizeVoice({ script, audioDir, tts, ffmpeg, probeDuration, gap = 0.12, signal, log }) {
  // Usamos la posición (no segment_index) para que un script.json editado a mano no desalinee nada.
  const segments = script.timeline_events.map((s, i) => ({ index: i, text: s.tts_text }));
  const clips = await runTts({ ...tts, segments, outDir: audioDir, signal });
  // Decodificamos cada clip a WAV: la duración del MP3 que reporta ffprobe incluye el
  // relleno del encoder (~50 ms por clip) y acumularía desfase en los subtítulos.
  const durations = [];
  const wavs = [];
  for (const c of clips) {
    const wav = c.file.replace(/\.mp3$/i, '.wav');
    await ffmpeg(['-i', c.file, '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le', wav], { signal });
    durations.push(await probeDuration(wav, { signal }));
    wavs.push(wav);
  }
  const timeline = buildTimeline({ clips, durations, script, gap });
  const estimated = timeline.segments.filter((s) => s.estimatedWords).length;
  if (estimated) log?.warn(`${estimated} segmento(s) sin tiempos por palabra; se estimaron`);

  const voiceFile = path.join(audioDir, 'voice.mp3');
  await concatVoice({ ffmpeg, files: wavs, gap, output: voiceFile, signal });
  await Promise.all(wavs.map((w) => fs.rm(w, { force: true })));
  return { voiceFile, ...timeline };
}
