import { createScrapeHandler } from './scrape.js';

// Registro de handlers por etapa. Una etapa ausente = en pausa (el producto espera).
export const handlers = {
  scrape: createScrapeHandler(),
};
