import { runProcess } from './process.js';

export function createFfmpeg({ ffmpegBin = 'ffmpeg', ffprobeBin = 'ffprobe' } = {}) {
  async function ffmpeg(args, opts) {
    const { code, stderr } = await runProcess(ffmpegBin, ['-hide_banner', '-loglevel', 'error', '-y', ...args], opts);
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
