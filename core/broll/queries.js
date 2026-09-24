const STOPWORDS = new Set([
  'a', 'an', 'the', 'at', 'on', 'in', 'of', 'to', 'for', 'with', 'and', 'or', 'is', 'are', 'from', 'by', 'into', 'your', 'my', 'their', 'his', 'her',
]);

export function cleanQuery(q) {
  return String(q ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Cadena de búsquedas de más específica a más genérica:
//   "shocked person looking at phone"
//   -> "shocked person looking phone" (sin stopwords)
//   -> "shocked person looking" -> "shocked person" -> "shocked"   (recorta la última palabra)
//   -> genéricas de respaldo
export function queryFallbacks(query, generic = []) {
  const out = [];
  const add = (q) => q && !out.includes(q) && out.push(q);
  const base = cleanQuery(query);
  add(base);
  const words = base.split(' ').filter((w) => w && !STOPWORDS.has(w));
  for (let n = words.length; n >= 1; n--) add(words.slice(0, n).join(' '));
  generic.map(cleanQuery).forEach(add);
  return out;
}
