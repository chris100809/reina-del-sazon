import { runProcess } from './process.js';

export function createFfmpeg({ ffmpegBin = 'ffmpeg', ffprobeBin = 'ffprobe' } = {}) {
  // `onProgress(segundos)` recibe el tiempo ya codificado (vía -progress pipe:1).
  async function ffmpeg(args, { onProgress, ...opts } = {}) {
    const extra = onProgress ? ['-progress', 'pipe:1', '-nostats'] : [];
    let buf = '';
    const onStdout = onProgress
      ? (chunk) => {
          buf += chunk;
          const lines = buf.split('\n');
          buf = lines.pop();
          for (const l of lines) {
            const m = l.match(/^out_time_us=(\d+)/);
            if (m) onProgress(Number(m[1]) / 1e6);
          }
        }
      : undefined;
    const { code, stderr } = await runProcess(ffmpegBin, ['-hide_banner', '-loglevel', 'error', '-y', ...extra, ...args], { ...opts, onStdout });
    if (code !== 0) throw new Error(`ffmpeg falló (${code}): ${stderr.trim().split('\n').slice(-3).join(' | ')}`);
  }

  async function probeDuration(file, opts) {
    const { code, stdout, stderr } = await runProcess(
      ffprobeBin,
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file],
      opts,
    );
    const d = Number.parseFloat(stdout);
    if (code !== 0 || !Number.isFinite(d)) throw new Error(`ffprobe no pudo leer ${file}: ${stderr.trim()}`);
    return d;
  }

  return { ffmpeg, probeDuration };
}
