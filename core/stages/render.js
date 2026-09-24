import crypto from 'node:crypto';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import { planTimeline } from '../render/plan.js';
import { buildSegmentArgs, buildComposeArgs } from '../render/commands.js';
import { ENCODERS } from '../render/encoder.js';
import { resolveSfx } from '../render/sfx.js';
import { listMusic, pickTrack } from '../render/music.js';

const RENDER_VERSION = 1; // súbelo si cambias el render para invalidar videos ya hechos
const readJson = async (f) => JSON.parse(await fs.readFile(f, 'utf8'));
const exists = (f) => fs.stat(f).then(() => true, () => false);

async function fileId(f) {
  const st = await fs.stat(f);
  return `${path.basename(f)}:${st.size}:${st.mtimeMs}`;
}

// Etapa "render": frames + B-roll + voz + subtítulos + música + sfx -> output/final.mp4.
export function createRenderHandler({ ffmpeg, probeDuration, getEncoder, musicDir, sfxDir, musicVolume, supersample = 2, parallel = Math.min(3, Math.max(1, Math.floor(os.availableParallelism() / 2))) }) {
  return async ({ product, paths, log, signal }) => {
    const abs = (rel) => path.join(paths.base, rel);
    const script = await readJson(abs(product.data.scriptFile ?? 'script.json'));
    const voice = await readJson(abs(product.data.voice?.manifest ?? 'audio/voice.json'));
    const subsFile = abs(product.data.subtitles?.file ?? 'subs/captions.ass');
    const plan = planTimeline({ script, voice, frames: product.data.frames, broll: product.data.broll });

    const encoderName = await getEncoder();
    const encoder = ENCODERS[encoderName];
    const music = pickTrack(await listMusic(musicDir), product.id);
    if (!music) log.warn(`Sin música: agrega pistas en ${musicDir}`);
    const sfxMap = await resolveSfx({ names: plan.segments.map((s) => s.sfx).filter(Boolean), sfxDir, ffmpeg, signal });
    const generated = Object.entries(sfxMap).filter(([, v]) => v.generated).map(([k]) => k);
    if (generated.length) log.info(`SFX sintetizados (pon los tuyos en ${sfxDir}): ${generated.join(', ')}`);

    // SFX en el inicio de cada transición; el "riser" crece y TERMINA cuando entra el segmento.
    const sfx = [];
    for (const s of plan.segments.filter((x) => x.sfx && sfxMap[x.sfx])) {
      const file = sfxMap[s.sfx].file;
      const at = s.sfx === 'riser' ? Math.max(0, s.visibleAt - (await probeDuration(file, { signal }))) : s.startAt;
      sfx.push({ name: s.sfx, file, at });
    }

    // ¿Ya existe un render idéntico? (mismos insumos + mismo encoder)
    const inputs = [voice.voiceFile, subsFile, ...plan.segments.map((s) => abs(s.source.file)), ...(music ? [music] : []), ...sfx.map((s) => s.file)];
    const fingerprint = crypto
      .createHash('sha1')
      .update(JSON.stringify({ v: RENDER_VERSION, plan, sfx, encoderName, musicVolume, supersample, ids: await Promise.all(inputs.map(fileId)) }))
      .digest('hex');
    const finalFile = path.join(paths.output, 'final.mp4');
    const metaFile = path.join(paths.output, 'render.json');
    const prev = await readJson(metaFile).catch(() => null);
    if (prev?.fingerprint === fingerprint && (await exists(finalFile))) {
      log.info('Render idéntico ya existe, se reutiliza');
      return { render: prev.summary };
    }

    const started = Date.now();
    const segDir = path.join(paths.output, '.segments');
    await fs.rm(segDir, { recursive: true, force: true });
    await fs.mkdir(segDir, { recursive: true });

    // Pasada 1: clips por segmento, varios en paralelo (zoompan usa un solo núcleo).
    const segmentFiles = plan.segments.map((seg) => path.join(segDir, `seg_${String(seg.index).padStart(2, '0')}.mp4`));
    let next = 0;
    let done = 0;
    const worker = async () => {
      while (next < plan.segments.length) {
        const seg = plan.segments[next++];
        await ffmpeg(buildSegmentArgs(seg, { input: abs(seg.source.file), output: segmentFiles[seg.index], fps: plan.fps, supersample, encoder }), { signal });
        log.info(`Segmento ${++done}/${plan.segments.length} listo (${seg.source.kind}, ${seg.zoom}, ${seg.length.toFixed(2)} s)`);
      }
    };
    await Promise.all(Array.from({ length: Math.min(parallel, plan.segments.length) }, worker));

    // Pasada 2: composición final, reportando progreso cada 25 %.
    const totalFrames = Math.round(plan.total * plan.fps);
    let nextMark = 25;
    const args = buildComposeArgs({ plan, segmentFiles, voiceFile: voice.voiceFile, music, sfx, subtitlesName: path.basename(subsFile), output: finalFile, encoder, musicVolume });
    await ffmpeg(args, {
      cwd: path.dirname(subsFile),
      signal,
      onProgress: (sec) => {
        const pct = Math.min(100, Math.floor((sec / plan.total) * 100));
        if (pct >= nextMark) {
          log.info(`FFmpeg: frame ${Math.round(sec * plan.fps)}/${totalFrames} (${pct}%)`);
          nextMark += 25;
        }
      },
    });

    const duration = await probeDuration(finalFile, { signal });
    if (Math.abs(duration - plan.total) > 0.25) throw new Error(`Duración inesperada: ${duration.toFixed(2)} s (esperado ${plan.total} s)`);

    // Portada: el primer frame de producto que aparece en el video (sin subtítulos).
    const coverSrc = plan.segments.find((s) => s.source.kind === 'image')?.source.file ?? product.data.frames[0].file;
    const coverFile = path.join(paths.output, 'cover.jpg');
    await fs.copyFile(abs(coverSrc), coverFile);
    await fs.rm(segDir, { recursive: true, force: true });

    const summary = {
      file: path.relative(paths.base, finalFile),
      cover: path.relative(paths.base, coverFile),
      duration: Math.round(duration * 100) / 100,
      encoder: encoderName,
      music: music ? path.basename(music) : null,
      renderSeconds: Math.round((Date.now() - started) / 100) / 10,
    };
    await fs.writeFile(metaFile, JSON.stringify({ fingerprint, summary, plan }, null, 2));
    log.info(`Video listo: ${summary.file} (${summary.duration} s, ${encoderName}, ${summary.renderSeconds} s de render)`);
    return { render: summary };
  };
}
