// Cada estado significa "qué etapa debe ejecutarse a continuación".
// Si un worker está trabajando un producto, éste lleva un `lock` (lease) encima;
// así "AI_THINKING" o "RENDERING" son simplemente <estado + lock activo>.
export const Status = Object.freeze({
  PENDING_SCRAPE: 'PENDING_SCRAPE',
  PENDING_SCRIPT: 'PENDING_SCRIPT',
  PENDING_ASSETS: 'PENDING_ASSETS',
  READY_FOR_RENDER: 'READY_FOR_RENDER',
  READY_TO_PUBLISH: 'READY_TO_PUBLISH',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED',
});

// Orden estricto del pipeline: etapa -> (estado de entrada, estado de salida).
export const STAGES = Object.freeze([
  { name: 'scrape', from: Status.PENDING_SCRAPE, to: Status.PENDING_SCRIPT, activeLabel: 'SCRAPING' },
  { name: 'script', from: Status.PENDING_SCRIPT, to: Status.PENDING_ASSETS, activeLabel: 'AI_THINKING' },
  { name: 'assets', from: Status.PENDING_ASSETS, to: Status.READY_FOR_RENDER, activeLabel: 'ASSET_GATHERING' },
  { name: 'render', from: Status.READY_FOR_RENDER, to: Status.READY_TO_PUBLISH, activeLabel: 'RENDERING' },
  { name: 'publish', from: Status.READY_TO_PUBLISH, to: Status.PUBLISHED, activeLabel: 'PUBLISHING' },
]);

export const TERMINAL = new Set([Status.PUBLISHED, Status.FAILED]);

export function stageByName(name) {
  const stage = STAGES.find((s) => s.name === name);
  if (!stage) throw new Error(`Etapa desconocida: ${name}`);
  return stage;
}

export function assertTransition(from, to) {
  const ok = to === Status.FAILED || STAGES.some((s) => s.from === from && s.to === to);
  if (!ok) throw new Error(`Transición inválida: ${from} -> ${to}`);
}
