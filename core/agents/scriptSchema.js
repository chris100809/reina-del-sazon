// Contrato del guion: lo que Gemini debe devolver y lo que consumen las etapas siguientes
// (TTS en la Parte 4, B-roll en la 5, FFmpeg en la 6, publicación en la 7).

export const ENUMS = Object.freeze({
  marketing_angle: ['pain-point', 'curiosity', 'life-hack'],
  video_pacing: ['fast_paced', 'cinematic_slow'],
  asset_type: ['product_image', 'b-roll_video'],
  transition_in: ['cut', 'fade', 'glitch', 'slide_up', 'zoom_blur'],
  zoom_effect: ['zoom_in_center', 'zoom_out', 'pan_left', 'pan_right', 'none'],
  sound_effect: ['none', 'whoosh', 'impact', 'pop', 'ding', 'riser'],
});

export const LIMITS = Object.freeze({
  minSegments: 4,
  maxSegments: 10,
  // Con edge-tts a +15% se habla ~2.8 palabras/s -> 20..45 s de video.
  minWords: 55,
  maxWords: 125,
  maxSegmentWords: 25,
  minHashtags: 3,
  maxHashtags: 8,
});

const str = (description, extra = {}) => ({ type: 'STRING', description, ...extra });
const enumOf = (values, description) => ({ type: 'STRING', format: 'enum', enum: values, description });

// Esquema en el formato OpenAPI-subset que acepta `responseSchema` de Gemini.
// `propertyOrdering` pone `strategy` primero: el modelo razona (cadena de pensamiento
// estructurada) antes de escribir el guion, y todo sigue siendo JSON parseable.
export const GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    strategy: {
      type: 'OBJECT',
      description: 'Brief reasoning done BEFORE writing the script.',
      properties: {
        target_customer: str('Who buys this in the US, in one sentence.'),
        core_problem: str('The specific everyday problem the product solves.'),
        key_benefit: str('The single most compelling, truthful benefit.'),
        hook_rationale: str('Why the hooks will stop the scroll.'),
      },
      required: ['target_customer', 'core_problem', 'key_benefit', 'hook_rationale'],
      propertyOrdering: ['target_customer', 'core_problem', 'key_benefit', 'hook_rationale'],
    },
    marketing_angle: enumOf(ENUMS.marketing_angle),
    video_pacing: enumOf(ENUMS.video_pacing),
    a_b_testing_hooks: {
      type: 'ARRAY',
      description: 'Exactly 2 alternative opening lines. Hook 1 = direct problem; Hook 2 = curiosity.',
      items: str('Spoken hook, max 15 words.'),
      minItems: 2,
      maxItems: 2,
    },
    timeline_events: {
      type: 'ARRAY',
      minItems: LIMITS.minSegments,
      maxItems: LIMITS.maxSegments,
      items: {
        type: 'OBJECT',
        properties: {
          segment_index: { type: 'INTEGER' },
          tts_text: str('Exact words the voiceover says in this segment.'),
          visual_directive: {
            type: 'OBJECT',
            properties: {
              asset_type: enumOf(ENUMS.asset_type),
              product_image_index: { type: 'INTEGER', nullable: true, description: '0-based index of product image (only for product_image).' },
              search_query: str('2-4 word English stock-footage query (only for b-roll_video).', { nullable: true }),
              transition_in: enumOf(ENUMS.transition_in),
              zoom_effect: enumOf(ENUMS.zoom_effect),
            },
            required: ['asset_type', 'transition_in', 'zoom_effect'],
            propertyOrdering: ['asset_type', 'product_image_index', 'search_query', 'transition_in', 'zoom_effect'],
          },
          audio_directive: {
            type: 'OBJECT',
            properties: {
              sound_effect: enumOf(ENUMS.sound_effect),
              music_ducking: { type: 'BOOLEAN' },
            },
            required: ['sound_effect', 'music_ducking'],
          },
          subtitle_emphasis_words: { type: 'ARRAY', items: { type: 'STRING' }, description: '1-3 words copied exactly from tts_text.' },
        },
        required: ['segment_index', 'tts_text', 'visual_directive', 'audio_directive', 'subtitle_emphasis_words'],
        propertyOrdering: ['segment_index', 'tts_text', 'visual_directive', 'audio_directive', 'subtitle_emphasis_words'],
      },
    },
    cta: str('Final call to action line (also must be the last segment tts_text).'),
    caption: str('Social caption, max 150 chars, no hashtags.'),
    hashtags: { type: 'ARRAY', items: str('Lowercase hashtag without #.') },
  },
  required: ['strategy', 'marketing_angle', 'video_pacing', 'a_b_testing_hooks', 'timeline_events', 'cta', 'caption', 'hashtags'],
  propertyOrdering: ['strategy', 'marketing_angle', 'video_pacing', 'a_b_testing_hooks', 'timeline_events', 'cta', 'caption', 'hashtags'],
};

const words = (s) => (String(s).match(/[\p{L}\p{N}'’-]+/gu) ?? []);
const norm = (w) => w.toLowerCase().replace(/[’]/g, "'");
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

// Valida y normaliza. Errores "duros" -> se devuelven para que Gemini los corrija.
// Detalles menores (índices, énfasis, hashtags) se arreglan aquí sin gastar otra llamada.
export function validateScript(input, { imageCount }) {
  const errors = [];
  if (!isObj(input)) return { errors: ['Root must be a JSON object'], script: null };
  const s = structuredClone(input);

  if (!isObj(s.strategy)) errors.push('Missing "strategy" object');
  for (const key of ['marketing_angle', 'video_pacing']) {
    if (!ENUMS[key].includes(s[key])) errors.push(`"${key}" must be one of ${ENUMS[key].join(', ')}`);
  }
  if (!Array.isArray(s.a_b_testing_hooks) || s.a_b_testing_hooks.length !== 2 || !s.a_b_testing_hooks.every(nonEmpty)) {
    errors.push('"a_b_testing_hooks" must have exactly 2 non-empty strings');
  }

  const tl = s.timeline_events;
  if (!Array.isArray(tl) || tl.length < LIMITS.minSegments || tl.length > LIMITS.maxSegments) {
    errors.push(`"timeline_events" must have ${LIMITS.minSegments}-${LIMITS.maxSegments} segments`);
  } else {
    let totalWords = 0;
    let productShots = 0;
    tl.forEach((seg, i) => {
      const at = `timeline_events[${i}]`;
      if (!isObj(seg)) return errors.push(`${at} must be an object`);
      seg.segment_index = i;
      if (!nonEmpty(seg.tts_text)) {
        errors.push(`${at}.tts_text is empty`);
      } else {
        seg.tts_text = seg.tts_text.trim();
        const n = words(seg.tts_text).length;
        totalWords += n;
        if (n > LIMITS.maxSegmentWords) errors.push(`${at}.tts_text has ${n} words (max ${LIMITS.maxSegmentWords}); split it`);
      }

      const v = seg.visual_directive;
      if (!isObj(v)) {
        errors.push(`${at}.visual_directive missing`);
      } else {
        if (!ENUMS.asset_type.includes(v.asset_type)) errors.push(`${at}.visual_directive.asset_type invalid`);
        if (!ENUMS.transition_in.includes(v.transition_in)) v.transition_in = 'cut';
        if (!ENUMS.zoom_effect.includes(v.zoom_effect)) v.zoom_effect = 'zoom_in_center';
        if (v.asset_type === 'b-roll_video') {
          if (!nonEmpty(v.search_query)) errors.push(`${at}.visual_directive.search_query required for b-roll_video`);
          else v.search_query = v.search_query.trim().toLowerCase();
          v.product_image_index = null;
        } else if (v.asset_type === 'product_image') {
          productShots += 1;
          const idx = Number.isInteger(v.product_image_index) ? v.product_image_index : productShots - 1;
          v.product_image_index = imageCount > 0 ? ((idx % imageCount) + imageCount) % imageCount : 0;
          v.search_query = null;
        }
      }

      const a = seg.audio_directive;
      if (!isObj(a)) seg.audio_directive = { sound_effect: 'none', music_ducking: true };
      else {
        if (!ENUMS.sound_effect.includes(a.sound_effect)) a.sound_effect = 'none';
        a.music_ducking = a.music_ducking !== false;
      }

      // Palabras de énfasis: solo las que realmente aparecen en el texto (para el karaoke).
      const spoken = new Set(words(seg.tts_text ?? '').map(norm));
      seg.subtitle_emphasis_words = (Array.isArray(seg.subtitle_emphasis_words) ? seg.subtitle_emphasis_words : [])
        .filter((w) => typeof w === 'string' && spoken.has(norm(w.trim())))
        .map((w) => w.trim())
        .slice(0, 3);
    });

    // El segmento 0 ES el hook A; así el render puede generar la variante B cambiando solo ese texto.
    if (Array.isArray(s.a_b_testing_hooks) && s.a_b_testing_hooks.length === 2 && nonEmpty(tl[0]?.tts_text)) {
      s.a_b_testing_hooks[0] = tl[0].tts_text;
    }
    if (productShots === 0) errors.push('At least one segment must use asset_type "product_image"');
    if (totalWords < LIMITS.minWords || totalWords > LIMITS.maxWords) {
      errors.push(`Total spoken words = ${totalWords}; must be ${LIMITS.minWords}-${LIMITS.maxWords} (20-45 s of voiceover)`);
    }
  }

  if (!nonEmpty(s.cta)) errors.push('"cta" is empty');
  if (!nonEmpty(s.caption)) errors.push('"caption" is empty');
  else s.caption = s.caption.trim().slice(0, 150);

  s.hashtags = [...new Set((Array.isArray(s.hashtags) ? s.hashtags : [])
    .filter((h) => typeof h === 'string')
    .map((h) => h.replace(/^#+/, '').replace(/\s+/g, '').toLowerCase())
    .filter((h) => /^[\p{L}\p{N}_]{2,40}$/u.test(h)))].slice(0, LIMITS.maxHashtags);
  if (s.hashtags.length < LIMITS.minHashtags) errors.push(`Need at least ${LIMITS.minHashtags} valid hashtags`);

  return { errors, script: errors.length ? null : s };
}

export function totalSpokenWords(script) {
  return script.timeline_events.reduce((n, seg) => n + words(seg.tts_text).length, 0);
}
