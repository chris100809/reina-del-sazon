// Subtítulos .ass estilo "karaoke" TikTok: bloques de 1-3 palabras en blanco; la palabra
// que se está diciendo se pinta de amarillo y crece. Las palabras de énfasis del guion
// (subtitle_emphasis_words) crecen más, con un pequeño "pop" animado.

export const DEFAULT_SUB_STYLE = Object.freeze({
  width: 1080,
  height: 1920,
  font: 'Arial Black',
  fontSize: 92,
  primary: '#FFFFFF',
  highlight: '#FFFF00',
  outline: '#000000',
  outlineWidth: 7,
  shadow: 3,
  marginV: 620, // desde abajo: deja libre la zona de botones/descripción de TikTok
  activeScale: 115,
  emphasisScale: 132,
  maxWordsPerChunk: 3,
  maxCharsPerChunk: 20,
  pauseBreak: 0.3, // una pausa mayor a esto empieza bloque nuevo
  holdMax: 0.45, // cuánto puede quedarse un bloque en pantalla durante un silencio
  uppercase: true,
});

// #RRGGBB -> &HAABBGGRR (ASS usa BGR y alfa invertido: 00 = opaco)
export function assColor(hex, alpha = 0) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`Color inválido: ${hex}`);
  const a = alpha.toString(16).padStart(2, '0');
  return `&H${a}${m[3]}${m[2]}${m[1]}`.toUpperCase();
}

export function assTime(sec) {
  const cs = Math.max(0, Math.round(sec * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`;
}

// Quita lo que ASS interpretaría como etiquetas de override o saltos.
const clean = (t) => t.replace(/[{}\\]/g, '').replace(/\s+/g, ' ').trim();

export function chunkWords(words, style = DEFAULT_SUB_STYLE) {
  const chunks = [];
  let cur = null;
  for (const w of words) {
    const text = clean(w.text);
    if (!text) continue;
    const prev = cur?.words.at(-1);
    const chars = cur ? cur.words.reduce((n, x) => n + x.text.length + 1, 0) + text.length : 0;
    const breakHere =
      !cur ||
      cur.words.length >= style.maxWordsPerChunk ||
      chars > style.maxCharsPerChunk ||
      w.segment !== prev.segment ||
      w.start - prev.end > style.pauseBreak;
    if (breakHere) chunks.push((cur = { words: [] }));
    cur.words.push({ ...w, text });
  }
  return chunks;
}

export function buildAss(words, overrides = {}) {
  const st = { ...DEFAULT_SUB_STYLE, ...overrides };
  const chunks = chunkWords(words, st);
  const hl = assColor(st.highlight);
  const events = [];

  chunks.forEach((chunk, ci) => {
    const nextStart = chunks[ci + 1]?.words[0].start ?? Infinity;
    const last = chunk.words.at(-1);
    const chunkEnd = Math.min(nextStart, last.end + st.holdMax);

    chunk.words.forEach((active, wi) => {
      const start = active.start;
      const end = wi < chunk.words.length - 1 ? chunk.words[wi + 1].start : chunkEnd;
      if (end - start < 0.01) return;
      const scale = active.emphasis ? st.emphasisScale : st.activeScale;
      const pop = active.emphasis ? `\\fscx100\\fscy100\\t(0,90,\\fscx${scale}\\fscy${scale})` : `\\fscx${scale}\\fscy${scale}`;
      const text = chunk.words
        .map((w, i) => {
          const t = st.uppercase ? w.text.toUpperCase() : w.text;
          return i === wi ? `{\\c${hl}&${pop}}${t}{\\r}` : t;
        })
        .join(' ');
      events.push(`Dialogue: 0,${assTime(start)},${assTime(end)},Karaoke,,0,0,0,,${text}`);
    });
  });

  return [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${st.width}`,
    `PlayResY: ${st.height}`,
    'WrapStyle: 2',
    'ScaledBorderAndShadow: yes',
    'YCbCr Matrix: TV.709',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Karaoke,${st.font},${st.fontSize},${assColor(st.primary)},${hl},${assColor(st.outline)},${assColor('#000000', 0x64)},-1,0,0,0,100,100,0,0,1,${st.outlineWidth},${st.shadow},2,60,60,${st.marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    ...events,
    '',
  ].join('\n');
}
