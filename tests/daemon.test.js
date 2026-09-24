import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { JsonStore } from '../core/state/jsonStore.js';
import { Status } from '../core/state/states.js';
import { Daemon } from '../core/queue/daemon.js';
import { createLogger } from '../core/utils/logger.js';
import { PermanentError } from '../core/utils/errors.js';
import { tmpDir } from './helpers.js';

async function setup(handlers) {
  const dir = await tmpDir();
  const config = {
    workspaceDir: path.join(dir, 'workspace'),
    leaseMs: 60_000,
    maxAttempts: 3,
    backoffBaseMs: 0,
    pollIntervalMs: 10,
  };
  const store = new JsonStore(path.join(dir, 'db.json'));
  const logger = createLogger({ silent: true });
  return { store, daemon: new Daemon({ store, handlers, config, logger, workerId: 'test' }) };
}

test('un tick lleva el producto de punta a punta con todos los handlers', async () => {
  const seen = [];
  const h = (name) => async (ctx) => {
    seen.push(name);
    assert.ok(ctx.paths.raw_images.includes('p1'));
    return { [name]: true };
  };
  const { store, daemon } = await setup({
    scrape: h('scrape'), script: h('script'), assets: h('assets'), render: h('render'), publish: h('publish'),
  });
  await store.create({ id: 'p1', sourceUrl: 'u' });
  await daemon.tick();
  const p = await store.get('p1');
  assert.equal(p.status, Status.PUBLISHED);
  assert.deepEqual(seen, ['scrape', 'script', 'assets', 'render', 'publish']);
  assert.deepEqual(Object.keys(p.data), seen);
});

test('se detiene en la primera etapa sin handler', async () => {
  const { store, daemon } = await setup({ scrape: async () => ({}) });
  await store.create({ id: 'p1', sourceUrl: 'u' });
  await daemon.tick();
  assert.equal((await store.get('p1')).status, Status.PENDING_SCRIPT);
});

test('fallos transitorios se reintentan en ticks siguientes', async () => {
  let calls = 0;
  const { store, daemon } = await setup({
    scrape: async () => {
      calls += 1;
      if (calls < 3) throw new Error('timeout');
      return {};
    },
  });
  await store.create({ id: 'p1', sourceUrl: 'u' });
  await daemon.tick();
  await daemon.tick();
  await daemon.tick();
  assert.equal(calls, 3);
  assert.equal((await store.get('p1')).status, Status.PENDING_SCRIPT);
});

test('PermanentError no se reintenta', async () => {
  const { store, daemon } = await setup({
    scrape: async () => { throw new PermanentError('URL inválida'); },
  });
  await store.create({ id: 'p1', sourceUrl: 'u' });
  await daemon.tick();
  const p = await store.get('p1');
  assert.equal(p.status, Status.FAILED);
  assert.equal(p.lastError.message, 'URL inválida');
});

test('start/stop del bucle', async () => {
  const { daemon } = await setup({});
  const running = daemon.start();
  setTimeout(() => daemon.stop(), 30);
  await running;
});
