// Extrae un objeto JSON de la respuesta del modelo, tolerando ruido alrededor:
//   1) JSON puro   2) bloque ```json ... ```   3) primer "{" ... último "}" (/{[\s\S]*}/)
export function extractJson(text) {
  if (typeof text !== 'string' || !text.trim()) throw new SyntaxError('Respuesta vacía');
  const candidates = [text.trim()];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1].trim());
  const braces = text.match(/{[\s\S]*}/);
  if (braces) candidates.push(braces[0]);

  let lastError;
  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch (err) {
      lastError = err;
    }
  }
  throw new SyntaxError(`No se pudo extraer JSON válido: ${lastError.message}`);
}
