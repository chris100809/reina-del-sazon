import { PermanentError } from '../utils/errors.js';

export const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiError extends Error {
  constructor(message, { status, retryable = true } = {}) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
    this.retryable = retryable;
  }
}

// Cliente REST mínimo de Gemini (sin SDK). Devuelve el texto de la primera respuesta.
export function createGeminiClient({ apiKey, model, fetch = globalThis.fetch, timeoutMs = 90_000 }) {
  if (!apiKey) throw new PermanentError('Falta GEMINI_API_KEY');

  return async function generate({ systemInstruction, prompt, generationConfig, signal }) {
    const timeout = AbortSignal.timeout(timeoutMs);
    const res = await fetch(`${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      }),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = `Gemini HTTP ${res.status}: ${body?.error?.message ?? res.statusText}`;
      // 400/401/403/404 = key inválida, modelo inexistente o request mal formado: reintentar no ayuda.
      if ([400, 401, 403, 404].includes(res.status)) throw new PermanentError(msg);
      throw new GeminiError(msg, { status: res.status }); // 429 / 5xx -> reintentable
    }

    if (body.promptFeedback?.blockReason) {
      throw new GeminiError(`Gemini bloqueó el prompt: ${body.promptFeedback.blockReason}`);
    }
    const cand = body.candidates?.[0];
    const text = cand?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    if (cand?.finishReason === 'MAX_TOKENS') throw new GeminiError('Gemini cortó la respuesta (MAX_TOKENS)');
    if (!text) throw new GeminiError(`Gemini no devolvió texto (finishReason=${cand?.finishReason ?? 'desconocido'})`);
    return { text, usage: body.usageMetadata ?? null, finishReason: cand.finishReason };
  };
}
