import { createScrapeHandler } from './scrape.js';
import { createScriptHandler } from './script.js';
import { createAssetsHandler } from './assets.js';
import { createGeminiClient } from '../agents/gemini.js';
import { createFfmpeg } from '../media/ffmpeg.js';
import { searchPexelsVideos } from '../broll/pexels.js';
import { createRenderHandler } from './render.js';
import { detectEncoder } from '../render/encoder.js';

// Construye los handlers según la configuración. Una etapa sin handler queda en pausa
// (sus productos esperan) y se avisa en `warnings`.
export function createHandlers(config) {
  const handlers = { scrape: createScrapeHandler() };
  const warnings = [];

  if (config.gemini.apiKey) {
    const generate = createGeminiClient({ apiKey: config.gemini.apiKey, model: config.gemini.model });
    handlers.script = createScriptHandler({ generate });
  } else {
    warnings.push('Etapa "script" en pausa: falta GEMINI_API_KEY en .env');
  }

  const { ffmpeg, probeDuration } = createFfmpeg(config.ffmpeg);
  let searchBroll = null;
  if (config.pexels.apiKey) {
    searchBroll = ({ query, signal }) => searchPexelsVideos({ query, apiKey: config.pexels.apiKey, signal });
  } else {
    warnings.push('Sin PEXELS_API_KEY: los segmentos de B-roll usarán imágenes del producto');
  }
  handlers.assets = createAssetsHandler({ tts: config.tts, ffmpeg, probeDuration, subStyle: config.subtitles, searchBroll });

  let encoderPromise = null; // se detecta una vez, en el primer render
  handlers.render = createRenderHandler({
    ffmpeg,
    probeDuration,
    getEncoder: () => (encoderPromise ??= detectEncoder({ ffmpegBin: config.ffmpeg.ffmpegBin, preference: config.render.encoder })),
    musicDir: config.render.musicDir,
    sfxDir: config.render.sfxDir,
    musicVolume: config.render.musicVolume,
  });
  return { handlers, warnings };
}
