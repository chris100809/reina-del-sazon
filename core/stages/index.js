import { createScrapeHandler } from './scrape.js';
import { createScriptHandler } from './script.js';
import { createGeminiClient } from '../agents/gemini.js';

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
  return { handlers, warnings };
}
