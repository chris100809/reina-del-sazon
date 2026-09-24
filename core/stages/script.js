import fs from 'node:fs/promises';
import path from 'node:path';
import { writeScript } from '../agents/scriptwriter.js';
import { validateScript, totalSpokenWords } from '../agents/scriptSchema.js';

const SCRIPT_FILE = 'script.json';

// Etapa "script": supplier + frames (Parte 2) -> script.json con guion y directivas de edición.
// Si script.json ya existe y es válido se reutiliza (reintentos sin gastar cuota; para
// regenerar, borra el archivo o edítalo a mano: se revalida).
export function createScriptHandler({ generate, maxAttempts = 3 }) {
  return async ({ product, paths, log, signal }) => {
    const imageCount = product.data.frames?.length ?? 0;
    if (!imageCount) throw new Error('No hay frames de producto (¿se saltó la etapa scrape?)');
    const file = path.join(paths.base, SCRIPT_FILE);

    let script = null;
    try {
      const { errors, script: existing } = validateScript(JSON.parse(await fs.readFile(file, 'utf8')), { imageCount });
      if (errors.length) log.warn(`script.json existente inválido, se regenera: ${errors[0]}`);
      else {
        script = existing;
        log.info('Reutilizando script.json existente');
      }
    } catch (err) {
      if (err.code !== 'ENOENT') log.warn(`No pude leer script.json: ${err.message}`);
    }

    if (!script) {
      ({ script } = await writeScript({ generate, supplier: product.data.supplier, imageCount, maxAttempts, signal, log }));
    }
    script.product_id = product.id;
    await fs.writeFile(file, JSON.stringify(script, null, 2));

    const words = totalSpokenWords(script);
    log.info(`Guion: ${script.marketing_angle}, ${script.timeline_events.length} segmentos, ${words} palabras — "${script.a_b_testing_hooks[0]}"`);
    return {
      scriptFile: SCRIPT_FILE,
      scriptSummary: {
        angle: script.marketing_angle,
        pacing: script.video_pacing,
        hooks: script.a_b_testing_hooks,
        segments: script.timeline_events.length,
        words,
      },
    };
  };
}
