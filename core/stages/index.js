import { createScrapeHandler } from './scrape.js';
import { createScriptHandler } from './script.js';
import { createAssetsHandler } from './assets.js';
import { createGeminiClient } from '../agents/gemini.js';
import { createFfmpeg } from '../media/ffmpeg.js';
import { searchPexelsVideos } from '../broll/pexels.js';

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
  return { handlers, warnings };
}
