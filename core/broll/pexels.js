import { PermanentError } from '../utils/errors.js';

export const PEXELS_VIDEO_SEARCH = 'https://api.pexels.com/videos/search';

// Busca videos verticales. Devuelve una lista normalizada (y la cuota restante).
export async function searchPexelsVideos({ query, apiKey, fetch = globalThis.fetch, perPage = 15, signal }) {
  const url = new URL(PEXELS_VIDEO_SEARCH);
  url.search = new URLSearchParams({ query, orientation: 'portrait', size: 'medium', per_page: String(perPage) }).toString();
  const res = await fetch(url, { headers: { Authorization: apiKey }, signal });
  if (res.status === 401 || res.status === 403) throw new PermanentError(`Pexels rechazó la API key (HTTP ${res.status})`);
  if (!res.ok) throw new Error(`Pexels HTTP ${res.status}`); // 429 / 5xx -> reintento del daemon
  const body = await res.json();
  return {
    remaining: Number(res.headers.get('x-ratelimit-remaining') ?? NaN),
    videos: (body.videos ?? []).map((v) => ({
      id: String(v.id),
      source: 'pexels',
      pageUrl: v.url,
      author: v.user?.name ?? null,
      authorUrl: v.user?.url ?? null,
      width: v.width,
      height: v.height,
      duration: v.duration,
      files: (v.video_files ?? [])
        .filter((f) => f.file_type === 'video/mp4' && f.link && f.width && f.height)
        .map((f) => ({ link: f.link, width: f.width, height: f.height, fps: f.fps ?? null, quality: f.quality ?? null })),
    })),
  };
}

// Mejor archivo para un frame 1080x1920: vertical, el más liviano con alto >= 1280;
// si no hay, el más grande disponible. Evita 4K (pesado sin beneficio).
export function pickFile(files, { minHeight = 1280, maxHeight = 2160 } = {}) {
  const portrait = files.filter((f) => f.height >= f.width && f.height <= maxHeight);
  if (!portrait.length) return null;
  const good = portrait.filter((f) => f.height >= minHeight).sort((a, b) => a.height - b.height);
  return good[0] ?? portrait.sort((a, b) => b.height - a.height)[0];
}

// Elige el clip para un segmento: vertical, no usado antes en este video, preferentemente
// más largo que el segmento (si es más corto se hace loop, que se nota más).
export function chooseVideo(videos, { minDuration, usedIds = new Set() }) {
  const candidates = videos
    .filter((v) => !usedIds.has(v.id))
    .map((v) => ({ video: v, file: pickFile(v.files) }))
    .filter((c) => c.file);
  if (!candidates.length) return null;
  const longEnough = candidates.filter((c) => c.video.duration >= minDuration);
  return longEnough[0] ?? candidates.sort((a, b) => b.video.duration - a.video.duration)[0];
}
