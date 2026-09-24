import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import sharp from 'sharp';
import { toVerticalFrame, FRAME_WIDTH, FRAME_HEIGHT } from '../core/images/vertical.js';
import { tmpDir } from './helpers.js';

// Producto rojo 600x600 sobre un lienzo blanco 1000x1000 (foto típica de proveedor).
async function productOnWhite(file) {
  const red = await sharp({ create: { width: 600, height: 600, channels: 3, background: '#d02020' } }).png().toBuffer();
  await sharp({ create: { width: 1000, height: 1000, channels: 3, background: '#ffffff' } })
    .composite([{ input: red, gravity: 'centre' }])
    .jpeg()
    .toFile(file);
}

test('imagen cuadrada -> 1080x1920 con fondo difuminado y sin bordes blancos', async () => {
  const dir = await tmpDir();
  const input = path.join(dir, 'in.jpg');
  const output = path.join(dir, 'out.jpg');
  await productOnWhite(input);

  const r = await toVerticalFrame(input, output);
  assert.equal(r.mode, 'blur-fill');
  assert.ok(r.sourceWidth <= 610 && r.sourceHeight <= 610, `trim: ${r.sourceWidth}x${r.sourceHeight}`);

  const meta = await sharp(output).metadata();
  assert.equal(meta.width, FRAME_WIDTH);
  assert.equal(meta.height, FRAME_HEIGHT);

  // El centro es el producto (rojo); arriba es fondo difuminado y oscurecido (no blanco).
  const { data, info } = await sharp(output).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => Array.from(data.subarray((y * info.width + x) * info.channels, (y * info.width + x) * info.channels + 3));
  const [r0, g0, b0] = px(540, 960);
  assert.ok(r0 > 150 && g0 < 80 && b0 < 80, `centro rojo: ${[r0, g0, b0]}`);
  const top = px(540, 20);
  assert.ok(Math.max(...top) < 200, `fondo oscurecido: ${top}`);
});

test('imagen ya vertical -> recorte cover directo', async () => {
  const dir = await tmpDir();
  const input = path.join(dir, 'v.png');
  await sharp({ create: { width: 900, height: 1600, channels: 3, background: '#3060c0' } }).png().toFile(input);
  const r = await toVerticalFrame(input, path.join(dir, 'o.jpg'));
  assert.equal(r.mode, 'cover');
});

test('imagen totalmente blanca no rompe el trim', async () => {
  const dir = await tmpDir();
  const input = path.join(dir, 'w.png');
  await sharp({ create: { width: 800, height: 800, channels: 3, background: '#ffffff' } }).png().toFile(input);
  const r = await toVerticalFrame(input, path.join(dir, 'o.jpg'));
  assert.equal(r.sourceWidth, 800);
});
