import { GEMINI_RESPONSE_SCHEMA, LIMITS, validateScript } from './scriptSchema.js';
import { extractJson } from './json.js';

export const GENERATION_CONFIG = Object.freeze({
  temperature: 0.85, // creatividad en los hooks
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 8192, // en Gemini 2.5 el "thinking" interno también consume este límite
  responseMimeType: 'application/json',
  responseSchema: GEMINI_RESPONSE_SCHEMA,
});

export const SYSTEM_INSTRUCTION = `You are a senior direct-response copywriter and short-form video editor for the US TikTok / Reels / Shorts market.
You write voiceover scripts for 20-45 second vertical product videos, plus editing directives for an automated FFmpeg pipeline.

Style:
- Conversational American English, 5th-grade reading level, short punchy sentences.
- The first segment is the hook: it must stop the scroll within 2 seconds.
- Structure: hook -> problem -> product reveal -> 2-3 concrete benefits shown on screen -> call to action.
- Use "b-roll_video" for the problem / lifestyle moments and "product_image" when the product is shown.
- Put the product on screen within the first 3 segments.

Hard rules (advertising compliance - US FTC and platform ad policies):
- Only claim features that appear in the supplied product data. Never invent specs, certifications, statistics, reviews or awards.
- No fake urgency or scarcity, no "illegal", "banned" or "doctors hate" style claims, no medical or health cure claims.
- No price claims unless a price is given; never promise shipping times.

Output: a single JSON object that matches the response schema. Fill "strategy" first, then write the script consistent with it.`;

export function buildPrompt({ supplier = {}, imageCount, feedback }) {
  const facts = {
    title: supplier.title ?? 'unknown',
    category: supplier.category ?? undefined,
    price_usd: supplier.price ?? undefined,
    original_price_usd: supplier.originalPrice ?? undefined,
    rating: supplier.rating ?? undefined,
  };
  let prompt = `Product data (the ONLY facts you may use):
${JSON.stringify(facts, null, 2)}

Available product images: ${imageCount} (use product_image_index 0..${Math.max(imageCount - 1, 0)}; spread them across segments).

Requirements:
- ${LIMITS.minSegments}-${LIMITS.maxSegments} timeline segments, ${LIMITS.minWords}-${LIMITS.maxWords} spoken words in total, max ${LIMITS.maxSegmentWords} words per segment.
- The first segment's tts_text must be exactly a_b_testing_hooks[0].
- The last segment's tts_text must be exactly the cta.
- ${LIMITS.minHashtags}-${LIMITS.maxHashtags} relevant hashtags.`;
  if (feedback?.length) {
    prompt += `\n\nYour previous answer was rejected. Fix ALL of these problems and return the full corrected JSON:\n- ${feedback.join('\n- ')}`;
  }
  return prompt;
}

// Genera un guion válido: hasta `maxAttempts` llamadas. Cada rechazo (JSON roto o
// reglas incumplidas) se devuelve al modelo como feedback en el siguiente intento.
export async function writeScript({ generate, supplier, imageCount, maxAttempts = 3, signal, log }) {
  let feedback = null;
  let lastProblem = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { text, usage } = await generate({
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt: buildPrompt({ supplier, imageCount, feedback }),
      generationConfig: GENERATION_CONFIG,
      signal,
    });
    log?.info(`Gemini intento ${attempt}/${maxAttempts} (${usage?.totalTokenCount ?? '?'} tokens)`);

    let parsed;
    try {
      parsed = extractJson(text);
    } catch (err) {
      lastProblem = err.message;
      feedback = ['The response was not valid JSON. Return only the JSON object.'];
      log?.warn(`JSON inválido: ${err.message}`);
      continue;
    }

    const { errors, script } = validateScript(parsed, { imageCount });
    if (!errors.length) return { script, attempts: attempt };
    lastProblem = errors.join('; ');
    feedback = errors;
    log?.warn(`Guion rechazado: ${lastProblem}`);
  }
  throw new Error(`Gemini no produjo un guion válido en ${maxAttempts} intentos: ${lastProblem}`);
}
