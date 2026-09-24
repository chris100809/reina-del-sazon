import { runProcess } from '../media/process.js';

// Perfiles de codificación. "final" = entrega (TikTok recomienda ~8 Mbps H.264 High);
// "intermediate" = clips temporales por segmento (casi sin pérdida, rápidos).
export const ENCODERS = Object.freeze({
  x264: {
    final: ['-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-maxrate', '10M', '-bufsize', '20M', '-profile:v', 'high', '-pix_fmt', 'yuv420p'],
    intermediate: ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p'],
  },
  nvenc: {
    final: ['-c:v', 'h264_nvenc', '-preset', 'p6', '-tune', 'hq', '-rc', 'vbr', '-b:v', '8M', '-maxrate', '10M', '-bufsize', '16M', '-profile:v', 'high', '-pix_fmt', 'yuv420p'],
    intermediate: ['-c:v', 'h264_nvenc', '-preset', 'p4', '-rc', 'vbr', '-cq', '16', '-pix_fmt', 'yuv420p'],
  },
});

// Detecta NVENC de verdad: que FFmpeg liste h264_nvenc no basta (se compila aunque no
// haya GPU ni driver), así que hacemos una codificación de prueba de 0.1 s.
export async function detectEncoder({ ffmpegBin = 'ffmpeg', preference = 'auto' } = {}) {
  if (preference === 'x264' || preference === 'nvenc') return preference;
  const list = await runProcess(ffmpegBin, ['-hide_banner', '-encoders'], { timeoutMs: 20_000 });
  if (!list.stdout.includes('h264_nvenc')) return 'x264';
  const probe = await runProcess(
    ffmpegBin,
    ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=black:s=256x256:d=0.1', '-c:v', 'h264_nvenc', '-f', 'null', '-'],
    { timeoutMs: 30_000 },
  );
  return probe.code === 0 ? 'nvenc' : 'x264';
}
