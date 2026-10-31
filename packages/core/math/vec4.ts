import type { Vec4, Vec3 } from '../types';

export function vec4(x = 0, y = 0, z = 0, w = 0): Vec4 {
  return { x, y, z, w };
}

export function set(v: Vec4, x: number, y: number, z: number, w: number): Vec4 {
  v.x = x; v.y = y; v.z = z; v.w = w;
  return v;
}

export function copy(out: Vec4, v: Vec4): Vec4 {
  out.x = v.x; out.y = v.y; out.z = v.z; out.w = v.w;
  return out;
}

export function clone(v: Vec4): Vec4 {
  return { x: v.x, y: v.y, z: v.z, w: v.w };
}

export function add(out: Vec4, a: Vec4, b: Vec4): Vec4 {
  out.x = a.x + b.x; out.y = a.y + b.y; out.z = a.z + b.z; out.w = a.w + b.w;
  return out;
}

export function sub(out: Vec4, a: Vec4, b: Vec4): Vec4 {
  out.x = a.x - b.x; out.y = a.y - b.y; out.z = a.z - b.z; out.w = a.w - b.w;
  return out;
}

export function mul(out: Vec4, a: Vec4, b: Vec4): Vec4 {
  out.x = a.x * b.x; out.y = a.y * b.y; out.z = a.z * b.z; out.w = a.w * b.w;
  return out;
}

export function div(out: Vec4, a: Vec4, b: Vec4): Vec4 {
  out.x = a.x / b.x; out.y = a.y / b.y; out.z = a.z / b.z; out.w = a.w / b.w;
  return out;
}

export function scale(out: Vec4, v: Vec4, s: number): Vec4 {
  out.x = v.x * s; out.y = v.y * s; out.z = v.z * s; out.w = v.w * s;
  return out;
}

export function negate(out: Vec4, v: Vec4): Vec4 {
  out.x = -v.x; out.y = -v.y; out.z = -v.z; out.w = -v.w;
  return out;
}

export function dot(a: Vec4, b: Vec4): number {
  return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
}

export function len(v: Vec4): number {
  return Math.hypot(v.x, v.y, v.z, v.w);
}

export function lenSq(v: Vec4): number {
  return v.x * v.x + v.y * v.y + v.z * v.z + v.w * v.w;
}

export function normalize(out: Vec4, v: Vec4): Vec4 {
  const l = len(v);
  if (l > 0) {
    out.x = v.x / l; out.y = v.y / l; out.z = v.z / l; out.w = v.w / l;
  }
  return out;
}

export function distance(a: Vec4, b: Vec4): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z, a.w - b.w);
}

export function lerp(out: Vec4, a: Vec4, b: Vec4, t: number): Vec4 {
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
  out.z = a.z + (b.z - a.z) * t;
  out.w = a.w + (b.w - a.w) * t;
  return out;
}

export function min(out: Vec4, a: Vec4, b: Vec4): Vec4 {
  out.x = Math.min(a.x, b.x); out.y = Math.min(a.y, b.y);
  out.z = Math.min(a.z, b.z); out.w = Math.min(a.w, b.w);
  return out;
}

export function max(out: Vec4, a: Vec4, b: Vec4): Vec4 {
  out.x = Math.max(a.x, b.x); out.y = Math.max(a.y, b.y);
  out.z = Math.max(a.z, b.z); out.w = Math.max(a.w, b.w);
  return out;
}

export function clamp(out: Vec4, v: Vec4, min: Vec4, max: Vec4): Vec4 {
  out.x = Math.max(min.x, Math.min(max.x, v.x));
  out.y = Math.max(min.y, Math.min(max.y, v.y));
  out.z = Math.max(min.z, Math.min(max.z, v.z));
  out.w = Math.max(min.w, Math.min(max.w, v.w));
  return out;
}

export function fromVec3(out: Vec4, v: Vec3, w = 0): Vec4 {
  out.x = v.x; out.y = v.y; out.z = v.z; out.w = w;
  return out;
}

export function toVec3(out: Vec3, v: Vec4): Vec3 {
  out.x = v.x; out.y = v.y; out.z = v.z;
  return out;
}

export function equals(a: Vec4, b: Vec4, epsilon = 1e-6): boolean {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon &&
         Math.abs(a.z - b.z) < epsilon && Math.abs(a.w - b.w) < epsilon;
}

export function exactEquals(a: Vec4, b: Vec4): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w;
}

export function fromArray(out: Vec4, arr: ArrayLike<number>, offset = 0): Vec4 {
  out.x = arr[offset]; out.y = arr[offset + 1]; out.z = arr[offset + 2]; out.w = arr[offset + 3];
  return out;
}

export function toArray(v: Vec4, out: number[] = [], offset = 0): number[] {
  out[offset] = v.x; out[offset + 1] = v.y; out[offset + 2] = v.z; out[offset + 3] = v.w;
  return out;
}

export function str(v: Vec4): string {
  return `vec4(${v.x.toFixed(4)}, ${v.y.toFixed(4)}, ${v.z.toFixed(4)}, ${v.w.toFixed(4)})`;
}

export const ZERO = Object.freeze(vec4(0, 0, 0, 0));
export const ONE = Object.freeze(vec4(1, 1, 1, 1));