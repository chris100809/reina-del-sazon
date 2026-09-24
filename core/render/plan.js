import { TRANSITIONS, ZOOM_AMOUNT } from './effects.js';

const round3 = (n) => Math.round(n * 1000) / 1000;

// Arma la línea de tiempo visual sincronizada con la voz.
//
// S_i = inicio del segmento i en la voz. El clip i entra con una transición de duración d_i
// que TERMINA justo en S_i (la imagen ya está completa cuando empieza la frase):
//   A_i = S_i - d_i                 (momento en que el clip empieza a aparecer)
//   L_i = S_{i+1} - A_i             (dura hasta que el siguiente terminó de entrar)
// El último clip dura hasta el final de la voz + `tail` (respiro para el CTA).
export function planTimeline({ script, voice, frames, broll = [], fps = 30, tail = 0.8 }) {
  const events = script.timeline_events;
  if (voice.segments.length !== events.length) {
    throw new Error(`La voz tiene ${voice.segments.length} segmentos y el guion ${events.length}`);
  }
  if (!frames?.length) throw new Error('No hay frames de producto');
  const brollBySegment = new Map(broll.map((b) => [b.segment, b]));
  const amount = ZOOM_AMOUNT[script.video_pacing] ?? ZOOM_AMOUNT.fast_paced;
  const slow = script.video_pacing === 'cinematic_slow' ? 1.3 : 1;
  const total = round3(voice.duration + tail);

  const image = (idx) => ({ kind: 'image', file: frames[((idx ?? 0) % frames.length + frames.length) % frames.length].file });

  const plan = events.map((ev, i) => {
    const v = ev.visual_directive;
    let source;
    if (v.asset_type === 'b-roll_video') {
      const b = brollBySegment.get(i);
      source = b?.status === 'ok' && b.file ? { kind: 'video', file: b.file } : image(b?.productImageIndex ?? i);
    } else {
      source = image(v.product_image_index);
    }

    const S = i === 0 ? 0 : voice.segments[i].start;
    let transition = null;
    if (i > 0) {
      const t = TRANSITIONS[v.transition_in] ?? TRANSITIONS.cut;
      const prevS = i === 1 ? 0 : voice.segments[i - 1].start;
      const wanted = t.duration == null ? 1 / fps : t.duration * slow;
      // Nunca más de la mitad del segmento anterior (segmentos muy cortos).
      transition = { xfade: t.xfade, duration: round3(Math.min(wanted, (S - prevS) / 2)), glitch: !!t.glitch };
    }
    return {
      index: i,
      source,
      zoom: v.zoom_effect ?? 'none',
      zoomAmount: amount,
      transition,
      visibleAt: round3(S),
      startAt: round3(S - (transition?.duration ?? 0)),
      sfx: ev.audio_directive?.sound_effect && ev.audio_directive.sound_effect !== 'none' ? ev.audio_directive.sound_effect : null,
      ducking: ev.audio_directive?.music_ducking !== false,
      voiceStart: voice.segments[i].start,
      voiceEnd: voice.segments[i].end,
    };
  });

  plan.forEach((seg, i) => {
    const until = i < plan.length - 1 ? plan[i + 1].visibleAt : total;
    seg.length = round3(until - seg.startAt);
    seg.frames = Math.max(1, Math.round(seg.length * fps));
  });
  return { segments: plan, total, fps };
}
