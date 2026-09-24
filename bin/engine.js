#!/usr/bin/env node
import { loadConfig } from '../core/config.js';
import { JsonStore } from '../core/state/jsonStore.js';
import { Daemon } from '../core/queue/daemon.js';
import { createLogger } from '../core/utils/logger.js';
import { handlers } from '../core/stages/index.js';
import { parseProductId } from '../core/scrapers/aliexpress/url.js';
import crypto from 'node:crypto';
import fs from 'node:fs';

// Carga .env (ALIEXPRESS_APP_KEY, etc.) si existe.
if (fs.existsSync('.env')) process.loadEnvFile('.env');

const USAGE = `Uso:
  engine add <url> [id]     Encola un link de AliExpress (ID automático: ali_<productId>)
  engine list [status]      Lista productos
  engine show <id>          Muestra el detalle de un producto
  engine retry <id>         Reencola un producto FAILED
  engine run [--once]       Arranca el daemon (--once: un solo pase)`;

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
    default:
      console.log(USAGE);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
