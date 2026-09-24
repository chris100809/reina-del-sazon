import fs from 'node:fs/promises';
import path from 'node:path';
import { PermanentError } from '../utils/errors.js';
import { queryFallbacks } from './queries.js';
import { chooseVideo } from './pexels.js';
import { streamDownload } from '../media/download.js';
import { normalizeClip } from './prepare.js';

const MANIFEST = 'manifest.json';
const exists = (f) => fs.stat(f).then(() => true, () => false);

async function readManifest(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return { entries: {} };
  }
}

// Consigue un clip por cada segmento "b-roll_video" del guion.
//  - Duración = la del segmento en la voz (Parte 4) + `pad` para las transiciones.
//  - Búsqueda con fallback recortando palabras (queries.js) y clips no repetidos.
//  - Si no hay API key o nada funciona: el segmento usa una imagen del producto.
//    Nunca queda un hueco negro.
// El progreso se guarda por segmento en b_roll/manifest.json: un reintento continúa
// donde quedó sin gastar cuota de Pexels.
export async function gatherBroll({ script, voice, paths, imageCount, search, ffmpeg, fetch, pad = 0.5, genericQueries = [], maxCandidates = 3, signal, log }) {
  const manifestFile = path.join(paths.b_roll, MANIFEST);
  const manifest = await readManifest(manifestFile);
  const save = () => fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2));
  const searchCache = new Map();
  const cachedSearch = async (q) => {
    if (!searchCache.has(q)) searchCache.set(q, (await search({ query: q, signal })).videos);
    return searchCache.get(q);
  };

  const usedIds = new Set(Object.values(manifest.entries).map((e) => e.videoId).filter(Boolean));
  const results = [];

  for (const [i, seg] of script.timeline_events.entries()) {
    const v = seg.visual_directive;
    if (v.asset_type !== 'b-roll_video') continue;
    const timing = voice.segments[i];
    const duration = Math.round((timing.end - timing.start + pad) * 1000) / 1000;
    const prev = manifest.entries[i];

    if (prev?.status === 'ok' && prev.query === v.search_query && prev.duration >= duration - 0.01 && (await exists(path.join(paths.base, prev.file)))) {
      results.push(prev);
      continue;
    }
    if (prev?.videoId) usedIds.delete(prev.videoId);

    let entry = null;
    if (search) {
      for (const q of queryFallbacks(v.search_query, genericQueries)) {
        const videos = await cachedSearch(q);
        for (let attempt = 0; attempt < maxCandidates && !entry; attempt++) {
          const choice = chooseVideo(videos, { minDuration: duration, usedIds });
          if (!choice) break;
          usedIds.add(choice.video.id);
          try {
            const raw = path.join(paths.b_roll, `raw_${choice.video.source}_${choice.video.id}.mp4`);
            if (!(await exists(raw))) await streamDownload(choice.file.link, raw, { fetch, signal });
            const out = path.join(paths.b_roll, `seg_${String(i).padStart(2, '0')}.mp4`);
            await normalizeClip({ ffmpeg, input: raw, output: out, duration, signal });
            entry = {
              segment: i,
              status: 'ok',
              query: v.search_query,
              queryUsed: q,
              file: path.relative(paths.base, out),
              duration,
              videoId: choice.video.id,
              source: choice.video.source,
              author: choice.video.author,
              pageUrl: choice.video.pageUrl,
              looped: choice.video.duration < duration,
            };
          } catch (err) {
            if (err instanceof PermanentError || signal?.aborted) throw err;
            log?.warn(`Clip ${choice.video.id} inservible (${err.message}); pruebo otro`);
          }
        }
        if (entry) break;
        log?.info(`Sin resultados útiles para "${q}"`);
      }
    }

    if (entry) {
      log?.info(`B-roll seg ${i}: "${entry.queryUsed}" -> ${entry.source} #${entry.videoId}${entry.looped ? ' (loop)' : ''}`);
    } else {
      // Respaldo: imagen del producto (la Parte 6 le aplica zoom como a cualquier otra).
      entry = { segment: i, status: 'fallback_product', query: v.search_query, productImageIndex: imageCount ? i % imageCount : 0, duration };
      log?.warn(`B-roll seg ${i}: sin video para "${v.search_query}", uso imagen del producto`);
    }
    manifest.entries[i] = entry;
    await save();
    results.push(entry);
  }

  // Borra descargas crudas que ya no usa ningún segmento (ahorra disco).
  const keep = new Set(Object.values(manifest.entries).map((e) => e.videoId && `raw_${e.source}_${e.videoId}.mp4`));
  for (const f of await fs.readdir(paths.b_roll)) {
    if (f.startsWith('raw_') && !keep.has(f)) await fs.rm(path.join(paths.b_roll, f), { force: true });
  }
  return results;
}
