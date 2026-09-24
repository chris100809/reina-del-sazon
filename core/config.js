import path from 'node:path';

// Toda la configuración sale de variables de entorno con valores por defecto sensatos,
// así el mismo código corre en Windows (C:\DropshipEngine) o Linux sin cambios.
export function loadConfig(env = process.env) {
  const root = path.resolve(env.ENGINE_ROOT ?? process.cwd());
  return {
    root,
    workspaceDir: path.resolve(root, env.ENGINE_WORKSPACE_DIR ?? 'workspace'),
    logsDir: path.resolve(root, env.ENGINE_LOGS_DIR ?? 'logs'),
    dbFile: path.resolve(root, env.ENGINE_DB_FILE ?? 'data/products.json'),
    pollIntervalMs: Number(env.ENGINE_POLL_INTERVAL_MS ?? 5 * 60 * 1000),
    leaseMs: Number(env.ENGINE_LEASE_MS ?? 30 * 60 * 1000),
    maxAttempts: Number(env.ENGINE_MAX_ATTEMPTS ?? 3),
    backoffBaseMs: Number(env.ENGINE_BACKOFF_BASE_MS ?? 30 * 1000),
    tts: {
      pythonBin: env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3'),
      voice: env.TTS_VOICE || 'en-US-AriaNeural',
      rate: env.TTS_RATE || '+15%',
      pitch: env.TTS_PITCH || '+2Hz',
    },
    ffmpeg: {
      ffmpegBin: env.FFMPEG_BIN || 'ffmpeg',
      ffprobeBin: env.FFPROBE_BIN || 'ffprobe',
    },
    subtitles: {
      font: env.SUBS_FONT || 'Arial Black',
    },
    pexels: {
      apiKey: env.PEXELS_API_KEY || null,
    },
    render: {
      encoder: env.RENDER_ENCODER || 'auto', // auto | nvenc | x264
      musicDir: path.resolve(root, env.ENGINE_MUSIC_DIR ?? 'assets/music'),
      sfxDir: path.resolve(root, env.ENGINE_SFX_DIR ?? 'assets/sfx'),
      musicVolume: Number(env.MUSIC_VOLUME ?? 0.18),
    },
    gemini: {
      apiKey: env.GEMINI_API_KEY || null,
      model: env.GEMINI_MODEL || 'gemini-2.5-flash',
    },
    aliexpress: {
      appKey: env.ALIEXPRESS_APP_KEY || null,
      appSecret: env.ALIEXPRESS_APP_SECRET || null,
      trackingId: env.ALIEXPRESS_TRACKING_ID || null,
    },
  };
}
