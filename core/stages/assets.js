import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { synthesizeVoice } from '../audio/voice.js';
import { buildAss } from '../subs/ass.js';

const VOICE_MANIFEST = 'voice.json';
const SUBS_FILE = 'captions.ass';

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

// Huella de todo lo que afecta al audio: si cambia el guion o la voz, se regenera.
function voiceFingerprint(script, tts, gap) {
  const texts = script.timeline_events.map((s) => s.tts_text);
  return crypto.createHash('sha1').update(JSON.stringify({ texts, voice: tts.voice, rate: tts.rate, pitch: tts.pitch, gap })).digest('hex');
}

// Etapa "assets". Parte 4: voz (edge-tts) + subtítulos karaoke (.ass).
// Parte 5 agregará aquí la descarga de B-roll.
export function createAssetsHandler({ tts, ffmpeg, probeDuration, subStyle = {}, gap = 0.12 }) {
  return async ({ product, paths, log, signal }) => {
    const script = await readJson(path.join(paths.base, product.data.scriptFile ?? 'script.json'));
    if (!script) throw new Error('No existe script.json (¿se saltó la etapa script?)');

    const manifestFile = path.join(paths.audio, VOICE_MANIFEST);
    const fingerprint = voiceFingerprint(script, tts, gap);
    let voice = await readJson(manifestFile);
    const reusable = voice?.fingerprint === fingerprint && (await fs.stat(voice.voiceFile).then(() => true, () => false));

    if (reusable) {
      log.info('Reutilizando voz existente');
    } else {
      log.info(`Sintetizando voz (${tts.voice}, rate ${tts.rate}, pitch ${tts.pitch})...`);
      voice = await synthesizeVoice({ script, audioDir: paths.audio, tts, ffmpeg, probeDuration, gap, signal, log });
      voice.fingerprint = fingerprint;
      await fs.writeFile(manifestFile, JSON.stringify(voice, null, 2));
    }
    log.info(`Voz: ${voice.duration.toFixed(1)} s, ${voice.words.length} palabras`);

    const subsFile = path.join(paths.subs, SUBS_FILE);
    await fs.writeFile(subsFile, buildAss(voice.words, subStyle));

    const rel = (f) => path.relative(paths.base, f);
    return {
      voice: {
        file: rel(voice.voiceFile),
        manifest: rel(manifestFile),
        duration: voice.duration,
        segments: voice.segments.map(({ index, start, end }) => ({ index, start, end })),
      },
      subtitles: { file: rel(subsFile) },
    };
  };
}
