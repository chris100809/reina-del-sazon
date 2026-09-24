import fs from 'node:fs/promises';
import path from 'node:path';

const EXTS = ['.wav', '.mp3', '.ogg', '.m4a'];

// Si no pones tus propios efectos en assets/sfx/, se sintetizan con FFmpeg (aevalsrc):
// suenan básicos pero el pipeline funciona desde el día 1.
export const SYNTH_RECIPES = Object.freeze({
  whoosh: "anoisesrc=d=0.45:c=pink:a=0.6,highpass=f=500,lowpass=f=4000,afade=t=in:d=0.2,afade=t=out:st=0.2:d=0.25",
  impact: "aevalsrc='0.9*sin(2*PI*(70-40*t)*t)*exp(-7*t)':d=0.7",
  pop: "aevalsrc='0.8*sin(2*PI*(900-700*t)*t)*exp(-35*t)':d=0.18",
  ding: "aevalsrc='0.5*(sin(2*PI*1320*t)+0.4*sin(2*PI*2640*t))*exp(-4*t)':d=1.0",
  riser: "aevalsrc='0.45*sin(2*PI*(180+500*t*t)*t)*(t/1.2)':d=1.2",
});

async function findUserFile(dir, name) {
  for (const ext of EXTS) {
    const f = path.join(dir, name + ext);
    try {
      await fs.access(f);
      return f;
    } catch {
      /* siguiente extensión */
    }
  }
  return null;
}

// Devuelve la ruta de cada sfx pedido: primero assets/sfx/<nombre>.(wav|mp3|ogg|m4a),
// si no existe, uno sintetizado en assets/sfx/_generated/ (se genera una sola vez).
export async function resolveSfx({ names, sfxDir, ffmpeg, signal }) {
  const out = {};
  for (const name of new Set(names)) {
    let file = await findUserFile(sfxDir, name);
    let generated = false;
    if (!file) {
      const recipe = SYNTH_RECIPES[name];
      if (!recipe) continue;
      const genDir = path.join(sfxDir, '_generated');
      file = path.join(genDir, `${name}.wav`);
      generated = true;
      const exists = await fs.access(file).then(() => true, () => false);
      if (!exists) {
        await fs.mkdir(genDir, { recursive: true });
        await ffmpeg(['-f', 'lavfi', '-i', recipe, '-ar', '48000', '-ac', '2', file], { signal });
      }
    }
    out[name] = { file, generated };
  }
  return out;
}
