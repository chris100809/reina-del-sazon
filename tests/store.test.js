import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { JsonStore } from '../core/state/jsonStore.js';
import { Status } from '../core/state/states.js';
import { tmpDir, fakeClock } from './helpers.js';

const opts = { maxAttempts: 3, backoffBaseMs: 1000 };

async function setup() {
  const now = fakeClock();
  const store = new JsonStore(path.join(await tmpDir(), 'db.json'), { now });
  return { store, now };
}

test('create + claim + complete avanza el estado y guarda datos', async () => {
  const { store } = await setup();
  await store.create({ id: 'p1', sourceUrl: 'https://x' });
  await assert.rejects(store.create({ id: 'p1', sourceUrl: 'https://x' }), /ya existe/);

  const claimed = await store.claimNext(Status.PENDING_SCRAPE, 'w1', 60_000);
  assert.equal(claimed.id, 'p1');
  assert.equal(await store.claimNext(Status.PENDING_SCRAPE, 'w2', 60_000), null, 'lock impide doble toma');

  const done = await store.complete('p1', 'w1', Status.PENDING_SCRIPT, { images: 14 });
  assert.equal(done.status, Status.PENDING_SCRIPT);
  assert.deepEqual(done.data, { images: 14 });
  assert.equal(done.lock, null);
});

test('no permite saltarse etapas', async () => {
  const { store } = await setup();
  await store.create({ id: 'p1', sourceUrl: 'u' });
  await store.claimNext(Status.PENDING_SCRAPE, 'w1', 60_000);
  await assert.rejects(store.complete('p1', 'w1', Status.PUBLISHED), /Transición inválida/);
});

test('fallo reintenta con backoff exponencial y luego pasa a FAILED', async () => {
  const { store, now } = await setup();
  await store.create({ id: 'p1', sourceUrl: 'u' });

  await store.claimNext(Status.PENDING_SCRAPE, 'w', 60_000);
  let p = await store.fail('p1', 'w', new Error('red caída'), opts);
  assert.equal(p.status, Status.PENDING_SCRAPE);
  assert.equal(p.notBefore - now(), 1000);
  assert.equal(await store.claimNext(Status.PENDING_SCRAPE, 'w', 60_000), null, 'respeta backoff');

  now.advance(1000);
  await store.claimNext(Status.PENDING_SCRAPE, 'w', 60_000);
  p = await store.fail('p1', 'w', new Error('red caída'), opts);
  assert.equal(p.notBefore - now(), 2000);

  now.advance(2000);
  await store.claimNext(Status.PENDING_SCRAPE, 'w', 60_000);
  p = await store.fail('p1', 'w', new Error('red caída'), opts);
  assert.equal(p.status, Status.FAILED);
  assert.equal(p.failedAt, Status.PENDING_SCRAPE);

  p = await store.retry('p1');
  assert.equal(p.status, Status.PENDING_SCRAPE);
  assert.equal(p.attempts, 0);
});

test('error permanente va directo a FAILED', async () => {
  const { store } = await setup();
  await store.create({ id: 'p1', sourceUrl: 'u' });
  await store.claimNext(Status.PENDING_SCRAPE, 'w', 60_000);
  const p = await store.fail('p1', 'w', new Error('404'), { ...opts, permanent: true });
  assert.equal(p.status, Status.FAILED);
});

test('un lease vencido (worker muerto) se puede reclamar', async () => {
  const { store, now } = await setup();
  await store.create({ id: 'p1', sourceUrl: 'u' });
  await store.claimNext(Status.PENDING_SCRAPE, 'muerto', 1000);
  now.advance(1001);
  const p = await store.claimNext(Status.PENDING_SCRAPE, 'nuevo', 1000);
  assert.equal(p.lock.workerId, 'nuevo');
  await assert.rejects(store.complete('p1', 'muerto', Status.PENDING_SCRIPT), /ya no tiene el lock/);
});

test('las mutaciones concurrentes no se pisan', async () => {
  const { store } = await setup();
  await Promise.all(Array.from({ length: 20 }, (_, i) => store.create({ id: `p${i}`, sourceUrl: 'u' })));
  assert.equal((await store.list()).length, 20);
});
