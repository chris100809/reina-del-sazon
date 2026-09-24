import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { ensureWorkspace, WORKSPACE_SUBDIRS } from '../core/workspace/workspace.js';
import { tmpDir } from './helpers.js';

test('crea todas las subcarpetas del producto y es idempotente', async () => {
  const dir = await tmpDir();
  const paths = await ensureWorkspace(dir, 'prod_12938');
  await ensureWorkspace(dir, 'prod_12938');
  for (const sub of WORKSPACE_SUBDIRS) {
    assert.ok((await fs.stat(paths[sub])).isDirectory(), sub);
  }
});

test('rechaza IDs que podrían escapar del workspace', async () => {
  const dir = await tmpDir();
  for (const bad of ['../etc', 'a/b', '', 'x'.repeat(65), 'C:\\x']) {
    await assert.rejects(ensureWorkspace(dir, bad), /inválido/);
  }
});
