#!/usr/bin/env node
import { loadConfig } from '../core/config.js';
import { JsonStore } from '../core/state/jsonStore.js';
import { Daemon } from '../core/queue/daemon.js';
import { createLogger } from '../core/utils/logger.js';
import { createHandlers } from '../core/stages/index.js';
import { parseProductId } from '../core/scrapers/aliexpress/url.js';
import crypto from 'node:crypto';
import path from 'node:path';
import { runTts } from '../core/audio/voice.js';
import fs from 'node:fs';

// Carga .env (ALIEXPRESS_APP_KEY, etc.) si existe.
if (fs.existsSync('.env')) process.loadEnvFile('.env');

const USAGE = `Uso:
  engine add <url> [id]     Encola un link de AliExpress (ID automático: ali_<productId>)
  engine list [status]      Lista productos
  engine show <id>          Muestra el detalle de un producto
  engine retry <id>         Reencola un producto FAILED
  engine run [--once]       Arranca el daemon (--once: un solo pase)
  engine voice-sample [voz] ["texto"]  Genera sample.mp3 para escuchar una voz`;

const config = loadConfig();
const store = new JsonStore(config.dbFile);
const [cmd, ...args] = process.argv.slice(2);

async function main() {
  switch (cmd) {
    case 'add': {
      const [url, customId] = args;
      if (!url) throw new Error(USAGE);
      const aliId = parseProductId(url);
      const id = customId ?? (aliId ? `ali_${aliId}` : `ali_${crypto.createHash('sha1').update(url).digest('hex').slice(0, 10)}`);
      const p = await store.create({ id, sourceUrl: url });
      console.log(`Encolado ${p.id} -> ${p.status}`);
      break;
    }
    case 'list': {
      const rows = await store.list({ status: args[0] });
      if (!rows.length) return console.log('(vacío)');
      for (const p of rows) {
        const err = p.lastError ? `  ! ${p.lastError.message}` : '';
        console.log(`${p.id.padEnd(20)} ${p.status.padEnd(18)} intentos=${p.attempts}${err}`);
      }
      break;
    }
    case 'show': {
      console.log(JSON.stringify(await store.get(args[0]), null, 2));
      break;
    }
    case 'retry': {
      const p = await store.retry(args[0]);
      console.log(`${p.id} reencolado en ${p.status}`);
      break;
    }
    case 'run': {
      const logger = createLogger({ logsDir: config.logsDir });
      const { handlers, warnings } = createHandlers(config);
      warnings.forEach((w) => logger.warn(w));
      const daemon = new Daemon({ store, handlers, config, logger });
      process.on('SIGINT', () => daemon.stop());
      process.on('SIGTERM', () => daemon.stop());
      if (args.includes('--once')) {
        const n = await daemon.tick();
        logger.info(`Pase único terminado: ${n} trabajo(s)`);
      } else {
        await daemon.start();
      }
      await logger.close();
      break;
    }
    case 'voice-sample': {
      const [voice = config.tts.voice, text = 'Still skipping smoothies because your blender lives on the counter? Meet the mini blender that fits in your bag.'] = args;
      const outDir = path.resolve('voice-samples');
      const [clip] = await runTts({ ...config.tts, voice, segments: [{ index: 0, text }], outDir });
      const file = path.join(outDir, `${voice}.mp3`);
      fs.renameSync(clip.file, file);
      console.log(`Escucha: ${file} (${clip.words.length} palabras con tiempos)`);
      break;
    }
    default:
      console.log(USAGE);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
