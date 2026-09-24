import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';

// Logger JSON-lines: escribe a logs/engine.log y emite eventos 'log'
// para que la futura TUI (blessed/ink) pueda suscribirse en tiempo real.
export function createLogger({ logsDir, console: out = console, silent = false } = {}) {
  const events = new EventEmitter();
  let stream = null;
  if (logsDir) {
    fs.mkdirSync(logsDir, { recursive: true });
    stream = fs.createWriteStream(path.join(logsDir, 'engine.log'), { flags: 'a' });
  }

  function write(level, msg, fields = {}) {
    const entry = { ts: new Date().toISOString(), level, msg, ...fields };
    stream?.write(JSON.stringify(entry) + '\n');
    events.emit('log', entry);
    if (!silent) {
      const ctx = fields.productId ? `[${fields.productId}] ` : '';
      out[level === 'error' ? 'error' : 'log'](`${entry.ts} ${level.toUpperCase()} ${ctx}${msg}`);
    }
  }

  return {
    events,
    info: (msg, f) => write('info', msg, f),
    warn: (msg, f) => write('warn', msg, f),
    error: (msg, f) => write('error', msg, f),
    close: () => new Promise((resolve) => (stream ? stream.end(resolve) : resolve())),
  };
}
