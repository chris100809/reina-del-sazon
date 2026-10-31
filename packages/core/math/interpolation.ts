export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function mapLinear(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

export function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

export function clampDeg(deg: number): number {
  deg %= 360;
  if (deg < 0) deg += 360;
  return deg;
}

export function clampRad(rad: number): number {
  rad %= Math.PI * 2;
  if (rad < 0) rad += Math.PI * 2;
  return rad;
}

export function shortestArc(a: number, b: number): number {
  let diff = b - a;
  diff = (diff + Math.PI) % (Math.PI * 2) - Math.PI;
  return a + diff;
}

export function pingPong(t: number, length: number): number {
  const half = length * 0.5;
  return half - Math.abs((t + half) % length - half);
}

export function repeat(t: number, length: number): number {
  return t - Math.floor(t / length) * length;
}

export function sign(x: number): number {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
}

export function random(min = 0, max = 1): number {
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function seedRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export const EPS = 1e-6;
export const PI = Math.PI;
export const TWO_PI = Math.PI * 2;
export const HALF_PI = Math.PI * 0.5;
export const QUARTER_PI = Math.PI * 0.25;
export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;