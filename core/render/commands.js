import { zoomExpressions, glitchFilter } from './effects.js';

// ---------- Pasada 1: un clip por segmento ----------
// Imagen o video -> 1080x1920, 30 fps, exactamente `seg.frames` frames, con zoom/pan.
// Se sobre-escala (supersample) antes del zoompan para que el Ken Burns no "tiemble".
export function buildSegmentArgs(seg, { input, output, width = 1080, height = 1920, fps = 30, supersample = 2, encoder }) {
  const W = width * supersample;
  const H = height * supersample;
  const filters = [`scale=${W}:${H}:force_original_aspect_ratio=increase`, `crop=${W}:${H}`, 'setsar=1'];
  if (seg.source.kind === 'video') filters.unshift(`fps=${fps}`);

  const zoom = zoomExpressions(seg.zoom, { frames: seg.frames, amount: seg.zoomAmount });
  if (zoom) {
    filters.push(`zoompan=z='${zoom.z}':x='${zoom.x}':y='${zoom.y}':d=1:s=${width}x${height}:fps=${fps}`);
  } else {
    filters.push(`scale=${width}:${height}`);
  }
  if (seg.transition?.glitch) filters.push(glitchFilter(seg.transition.duration + 0.15));
  filters.push('format=yuv420p');

  const inputArgs =
    seg.source.kind === 'image'
      ? ['-loop', '1', '-framerate', String(fps), '-i', input]
      : ['-stream_loop', '-1', '-i', input];
  return [...inputArgs, '-vf', filters.join(','), '-frames:v', String(seg.frames), '-an', '-r', String(fps), ...encoder.intermediate, output];
}

// ---------- Pasada 2: composición final ----------
// Entradas: clips de segmento, voz, música (opcional), sfx. Se ejecuta con cwd = carpeta
// de subtítulos, así el filtro `subtitles=captions.ass` evita el infierno de escapar rutas
// de Windows (C\:\\...) dentro del filtergraph.
export function buildComposeArgs({ plan, segmentFiles, voiceFile, music, sfx = [], subtitlesName, output, encoder, musicVolume = 0.18, sfxVolume = 0.7 }) {
  const { segments, total, fps } = plan;
  const args = [];
  const f = [];
  let n = 0;

  // Video: xfade encadenado. offset = A_i (inicio de la transición) sobre la salida acumulada.
  segmentFiles.forEach((file) => args.push('-i', file));
  segments.forEach((_, i) => f.push(`[${i}:v]settb=AVTB,setpts=PTS-STARTPTS[s${i}]`));
  n = segments.length;
  let last = 's0';
  for (let i = 1; i < segments.length; i++) {
    const t = segments[i].transition;
    f.push(`[${last}][s${i}]xfade=transition=${t.xfade}:duration=${t.duration}:offset=${segments[i].startAt}[x${i}]`);
    last = `x${i}`;
  }
  f.push(subtitlesName ? `[${last}]subtitles=${subtitlesName}[vout]` : `[${last}]null[vout]`);

  // Audio: voz (+ su copia como señal de sidechain).
  const fmt = 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
  const voiceIdx = n++;
  args.push('-i', voiceFile);
  const mix = ['[voice]'];

  if (music) {
    f.push(`[${voiceIdx}:a]${fmt},asplit=2[voice][sc0]`);
    // Segmentos con music_ducking=false: silenciamos la señal de control -> la música no baja.
    const noDuck = segments.filter((s) => !s.ducking).map((s) => `between(t,${s.voiceStart},${s.voiceEnd})`);
    f.push(noDuck.length ? `[sc0]volume=0:enable='${noDuck.join('+')}'[sc]` : '[sc0]anull[sc]');
    const musicIdx = n++;
    args.push('-stream_loop', '-1', '-i', music);
    const fadeOut = Math.max(total - 1.5, 0).toFixed(3);
    f.push(`[${musicIdx}:a]${fmt},atrim=0:${total},asetpts=PTS-STARTPTS,volume=${musicVolume},afade=t=in:d=0.5,afade=t=out:st=${fadeOut}:d=1.5[mus]`);
    // Ducking (compresión sidechain): cuando la voz supera 0.06, la música baja 4:1
    // en 5 ms y se recupera 100 ms después de que la voz calla.
    f.push('[mus][sc]sidechaincompress=threshold=0.06:ratio=4:attack=5:release=100[duck]');
    mix.push('[duck]');
  } else {
    f.push(`[${voiceIdx}:a]${fmt}[voice]`);
  }

  sfx.forEach((s, j) => {
    const idx = n++;
    args.push('-i', s.file);
    const ms = Math.round(s.at * 1000);
    f.push(`[${idx}:a]${fmt},volume=${sfxVolume},adelay=${ms}|${ms}[fx${j}]`);
    mix.push(`[fx${j}]`);
  });

  f.push(
    mix.length > 1
      ? `${mix.join('')}amix=inputs=${mix.length}:duration=longest:normalize=0,apad,atrim=0:${total},alimiter=limit=0.95[aout]`
      : `[voice]apad,atrim=0:${total},alimiter=limit=0.95[aout]`,
  );

  args.push(
    '-filter_complex', f.join(';'),
    '-map', '[vout]', '-map', '[aout]',
    '-r', String(fps), ...encoder.final,
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-t', String(total), '-movflags', '+faststart',
    output,
  );
  return args;
}
