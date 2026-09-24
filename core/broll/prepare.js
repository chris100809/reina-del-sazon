// Normaliza un clip de stock para el render: 1080x1920 (cover centrado), 30 fps,
// sin audio, exactamente `duration` segundos (loop si el original es más corto).
// Así la Parte 6 recibe piezas uniformes y el filtergraph queda simple y rápido.
export async function normalizeClip({ ffmpeg, input, output, duration, width = 1080, height = 1920, fps = 30, signal }) {
  const vf = [
    `scale=${width}:${height}:force_original_aspect_ratio=increase`,
    `crop=${width}:${height}`,
    `fps=${fps}`,
    'setsar=1',
    'format=yuv420p',
  ].join(',');
  await ffmpeg(
    ['-stream_loop', '-1', '-i', input, '-t', duration.toFixed(3), '-vf', vf, '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-movflags', '+faststart', output],
    { signal },
  );
  return output;
}
