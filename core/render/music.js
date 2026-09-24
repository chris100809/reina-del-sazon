import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const EXTS = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac']);

export async function listMusic(musicDir) {
  try {
    return (await fs.readdir(musicDir))
      .filter((f) => EXTS.has(path.extname(f).toLowerCase()) && !f.startsWith('.'))
      .sort()
      .map((f) => path.join(musicDir, f));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

// Pista determinista por producto: variedad entre videos, pero el mismo producto
// siempre re-renderiza con la misma música.
export function pickTrack(tracks, productId) {
  if (!tracks.length) return null;
  const h = Number.parseInt(crypto.createHash('sha1').update(productId).digest('hex').slice(0, 8), 16);
  return tracks[h % tracks.length];
}
