// Directivas del guion -> parámetros de FFmpeg.

// transition_in -> transición de xfade y su duración base (s).
export const TRANSITIONS = Object.freeze({
  cut: { xfade: 'fade', duration: null }, // 1 frame: corte seco
  fade: { xfade: 'fade', duration: 0.3 },
  slide_up: { xfade: 'slideup', duration: 0.3 },
  zoom_blur: { xfade: 'zoomin', duration: 0.35 },
  glitch: { xfade: 'pixelize', duration: 0.25, glitch: true },
});

// Cuánto zoom hace cada segmento según el ritmo del guion.
export const ZOOM_AMOUNT = Object.freeze({ fast_paced: 0.2, cinematic_slow: 0.1 });

// Expresiones de zoompan con d=1 (un frame de salida por frame de entrada), basadas en
// el número de frame `on`: deterministas y válidas tanto para imágenes como para video.
// Ken Burns centrado: x = iw/2 - iw/zoom/2 mantiene el centro geométrico.
export function zoomExpressions(effect, { frames, amount }) {
  const p = `on/${Math.max(frames - 1, 1)}`;
  const cx = 'iw/2-(iw/zoom/2)';
  const cy = 'ih/2-(ih/zoom/2)';
  switch (effect) {
    case 'zoom_in_center':
      return { z: `1+${amount}*${p}`, x: cx, y: cy };
    case 'zoom_out':
      return { z: `${1 + amount}-${amount}*${p}`, x: cx, y: cy };
    case 'pan_left':
      return { z: `${1 + amount}`, x: `(iw-iw/zoom)*(1-${p})`, y: cy };
    case 'pan_right':
      return { z: `${1 + amount}`, x: `(iw-iw/zoom)*${p}`, y: cy };
    default:
      return null; // 'none'
  }
}

// Efecto glitch: separación RGB (aberración cromática) + ruido temporal durante
// la transición de entrada del clip.
export function glitchFilter(seconds) {
  const on = `enable='lt(t,${seconds.toFixed(3)})'`;
  return `rgbashift=rh=-18:bh=18:gv=6:${on},noise=alls=35:allf=t:${on}`;
}
