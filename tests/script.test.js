import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { extractJson } from '../core/agents/json.js';
import { validateScript } from '../core/agents/scriptSchema.js';
import { writeScript, buildPrompt, GENERATION_CONFIG } from '../core/agents/scriptwriter.js';
import { createGeminiClient } from '../core/agents/gemini.js';
import { createScriptHandler } from '../core/stages/script.js';
import { ensureWorkspace } from '../core/workspace/workspace.js';
import { PermanentError } from '../core/utils/errors.js';
import { tmpDir } from './helpers.js';

const VALID = JSON.parse(await fs.readFile(new URL('./fixtures/script-valid.json', import.meta.url), 'utf8'));
const quiet = { info() {}, warn() {}, error() {} };

test('extractJson tolera ruido, bloques ``` y texto alrededor', () => {
  assert.deepEqual(extractJson('{"a":1}'), { a: 1 });
  assert.deepEqual(extractJson('Sure! ```json\n{"a":2}\n``` hope it helps'), { a: 2 });
  assert.deepEqual(extractJson('Here you go: {"a":{"b":3}} thanks'), { a: { b: 3 } });
  assert.throws(() => extractJson('no json here'), SyntaxError);
  assert.throws(() => extractJson(''), SyntaxError);
});

test('validateScript normaliza detalles menores sin rechazar', () => {
  const { errors, script } = validateScript(VALID, { imageCount: 3 });
  assert.deepEqual(errors, []);
  const tl = script.timeline_events;
  assert.deepEqual(tl.map((s) => s.segment_index), [0, 1, 2, 3, 4, 5], 'reindexa');
  assert.equal(tl[0].visual_directive.search_query, 'tired person kitchen morning');
  assert.deepEqual(tl[1].subtitle_emphasis_words, ['rushed', 'giant'], 'quita palabras que no se dicen');
  assert.equal(tl[3].visual_directive.product_image_index, 1, 'índice 7 con 3 imágenes -> 7 % 3');
  assert.equal(tl[4].visual_directive.product_image_index, 2, 'índice faltante -> secuencial');
  assert.deepEqual(script.hashtags, ['tiktokmademebuyit', 'smoothie', 'gymlife', 'kitchengadgets']);
  const alt = structuredClone(VALID);
  alt.a_b_testing_hooks[0] = 'Otro texto';
  assert.equal(validateScript(alt, { imageCount: 3 }).script.a_b_testing_hooks[0], VALID.timeline_events[0].tts_text);
  assert.notEqual(VALID.hashtags.length, script.hashtags.length, 'no muta la entrada');
});

test('validateScript rechaza errores estructurales con mensajes accionables', () => {
  const bad = structuredClone(VALID);
  bad.marketing_angle = 'fomo';
  bad.a_b_testing_hooks = ['solo uno'];
  bad.timeline_events.forEach((s) => { s.visual_directive = { asset_type: 'b-roll_video', search_query: 'x' }; });
  bad.timeline_events[1].visual_directive.search_query = '';
  const { errors, script } = validateScript(bad, { imageCount: 2 });
  assert.equal(script, null);
  const all = errors.join('\n');
  assert.match(all, /marketing_angle/);
  assert.match(all, /exactly 2/);
  assert.match(all, /product_image/);
  assert.match(all, /search_query required/);

  const short = structuredClone(VALID);
  short.timeline_events = short.timeline_events.slice(0, 4).map((s) => ({ ...s, tts_text: 'Too short.' }));
  short.timeline_events[0].visual_directive = { asset_type: 'product_image', transition_in: 'cut', zoom_effect: 'none' };
  assert.match(validateScript(short, { imageCount: 1 }).errors.join(), /Total spoken words/);
});

test('buildPrompt solo usa datos reales y adjunta feedback', () => {
  const p = buildPrompt({ supplier: { title: 'Mini Blender', price: '12.99' }, imageCount: 4, feedback: ['X is wrong'] });
  assert.match(p, /"title": "Mini Blender"/);
  assert.match(p, /0\.\.3/);
  assert.match(p, /X is wrong/);
  assert.equal(GENERATION_CONFIG.temperature, 0.85);
  assert.equal(GENERATION_CONFIG.responseMimeType, 'application/json');
});

test('writeScript reintenta con feedback: JSON roto -> inválido -> válido', async () => {
  const invalid = structuredClone(VALID);
  invalid.video_pacing = 'medium';
  const replies = ['lo siento, no puedo {', JSON.stringify(invalid), `Here: ${JSON.stringify(VALID)}`];
  const prompts = [];
  const generate = async ({ prompt }) => {
    prompts.push(prompt);
    return { text: replies.shift() };
  };
  const { script, attempts } = await writeScript({ generate, supplier: {}, imageCount: 3, log: quiet });
  assert.equal(attempts, 3);
  assert.equal(script.video_pacing, 'fast_paced');
  assert.match(prompts[1], /not valid JSON/);
  assert.match(prompts[2], /video_pacing/);
});

test('writeScript falla tras 3 intentos inválidos', async () => {
  const generate = async () => ({ text: '{"nope":true}' });
  await assert.rejects(writeScript({ generate, supplier: {}, imageCount: 1, log: quiet }), /3 intentos/);
});

test('cliente Gemini: request correcto y clasificación de errores', async () => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    return Response.json({ candidates: [{ content: { parts: [{ text: '{"ok":1}' }] }, finishReason: 'STOP' }], usageMetadata: { totalTokenCount: 42 } });
  };
  const generate = createGeminiClient({ apiKey: 'KEY', model: 'gemini-2.5-flash', fetch });
  const out = await generate({ systemInstruction: 'sys', prompt: 'hi', generationConfig: { temperature: 0.85 } });
  assert.equal(out.text, '{"ok":1}');
  assert.match(calls[0].url, /models\/gemini-2\.5-flash:generateContent$/);
  assert.equal(calls[0].init.headers['x-goog-api-key'], 'KEY');
  assert.ok(!calls[0].url.includes('KEY'), 'la key no va en la URL (no queda en logs)');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.systemInstruction.parts[0].text, 'sys');
  assert.equal(body.generationConfig.temperature, 0.85);

  const err = (status) => async () => Response.json({ error: { message: 'boom' } }, { status });
  await assert.rejects(createGeminiClient({ apiKey: 'k', model: 'm', fetch: err(400) })({}), PermanentError);
  await assert.rejects(createGeminiClient({ apiKey: 'k', model: 'm', fetch: err(429) })({}), (e) => !(e instanceof PermanentError) && /429/.test(e.message));
  const cut = async () => Response.json({ candidates: [{ content: { parts: [{ text: '{"a":' }] }, finishReason: 'MAX_TOKENS' }] });
  await assert.rejects(createGeminiClient({ apiKey: 'k', model: 'm', fetch: cut })({}), /MAX_TOKENS/);
  assert.throws(() => createGeminiClient({ model: 'm' }), PermanentError);
});

test('etapa script: escribe script.json y lo reutiliza en reintentos', async () => {
  const dir = await tmpDir();
  const paths = await ensureWorkspace(dir, 'p1');
  let calls = 0;
  const generate = async () => { calls += 1; return { text: JSON.stringify(VALID) }; };
  const handler = createScriptHandler({ generate });
  const product = { id: 'p1', data: { supplier: { title: 'Mini Blender' }, frames: [{}, {}, {}] } };

  const out = await handler({ product, paths, log: quiet });
  assert.equal(out.scriptSummary.segments, 6);
  assert.equal(out.scriptSummary.angle, 'pain-point');
  const saved = JSON.parse(await fs.readFile(path.join(paths.base, 'script.json'), 'utf8'));
  assert.equal(saved.product_id, 'p1');

  await handler({ product, paths, log: quiet });
  assert.equal(calls, 1, 'no vuelve a llamar a Gemini');

  await assert.rejects(handler({ product: { id: 'p1', data: {} }, paths, log: quiet }), /frames/);
});
