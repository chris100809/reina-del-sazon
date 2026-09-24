import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export async function tmpDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'engine-test-'));
}

export function fakeClock(start = Date.parse('2026-01-01T00:00:00Z')) {
  let t = start;
  const now = () => t;
  now.advance = (ms) => (t += ms);
  return now;
}
