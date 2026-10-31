import type { Vec3, Vec4, Quat, Mat4 } from '../types';

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export function set(v: Vec3, x: number, y: number, z: number): Vec3 {
  v.x = x;
  v.y = y;
  v.z = z;
  return v;
}

export function copy(out: Vec3, v: Vec3): Vec3 {
  out.x = v.x;
  out.y = v.y;
  out.z = v.z;
  return out;
}

export function clone(v: Vec3): Vec3 {
  return { x: v.x, y: v.y, z: v.z };
}

export function add(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out.x = a.x + b.x;
  out.y = a.y + b.y;
  out.z = a.z + b.z;
  return out;
}

export function sub(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out.x = a.x - b.x;
  out.y = a.y - b.y;
  out.z = a.z - b.z;
  return out;
}

export function mul(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out.x = a.x * b.x;
  out.y = a.y * b.y;
  out.z = a.z * b.z;
  return out;
}

export function div(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out.x = a.x / b.x;
  out.y = a.y / b.y;
  out.z = a.z / b.z;
  return out;
}

export function scale(out: Vec3, v: Vec3, s: number): Vec3 {
  out.x = v.x * s;
  out.y = v.y * s;
  out.z = v.z * s;
  return out;
}

export function scaleAndAdd(out: Vec3, a: Vec3, b: Vec3, s: number): Vec3 {
  out.x = a.x + b.x * s;
  out.y = a.y + b.y * s;
  out.z = a.z + b.z * s;
  return out;
}

export function negate(out: Vec3, v: Vec3): Vec3 {
  out.x = -v.x;
  out.y = -v.y;
  out.z = -v.z;
  return out;
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  const ax = a.x, ay = a.y, az = a.z;
  const bx = b.x, by = b.y, bz = b.z;
  out.x = ay * bz - az * by;
  out.y = az * bx - ax * bz;
  out.z = ax * by - ay * bx;
  return out;
}

export function len(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

export function lenSq(v: Vec3): number {
  return v.x * v.x + v.y * v.y + v.z * v.z;
}

export function normalize(out: Vec3, v: Vec3): Vec3 {
  const l = len(v);
  if (l > 0) {
    out.x = v.x / l;
    out.y = v.y / l;
    out.z = v.z / l;
  }
  return out;
}

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function distanceSq(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

export function lerp(out: Vec3, a: Vec3, b: Vec3, t: number): Vec3 {
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
  out.z = a.z + (b.z - a.z) * t;
  return out;
}

export function min(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out.x = Math.min(a.x, b.x);
  out.y = Math.min(a.y, b.y);
  out.z = Math.min(a.z, b.z);
  return out;
}

export function max(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out.x = Math.max(a.x, b.x);
  out.y = Math.max(a.y, b.y);
  out.z = Math.max(a.z, b.z);
  return out;
}

export function clamp(out: Vec3, v: Vec3, min: Vec3, max: Vec3): Vec3 {
  out.x = Math.max(min.x, Math.min(max.x, v.x));
  out.y = Math.max(min.y, Math.min(max.y, v.y));
  out.z = Math.max(min.z, Math.min(max.z, v.z));
  return out;
}

export function floor(out: Vec3, v: Vec3): Vec3 {
  out.x = Math.floor(v.x);
  out.y = Math.floor(v.y);
  out.z = Math.floor(v.z);
  return out;
}

export function ceil(out: Vec3, v: Vec3): Vec3 {
  out.x = Math.ceil(v.x);
  out.y = Math.ceil(v.y);
  out.z = Math.ceil(v.z);
  return out;
}

export function round(out: Vec3, v: Vec3): Vec3 {
  out.x = Math.round(v.x);
  out.y = Math.round(v.y);
  out.z = Math.round(v.z);
  return out;
}

export function abs(out: Vec3, v: Vec3): Vec3 {
  out.x = Math.abs(v.x);
  out.y = Math.abs(v.y);
  out.z = Math.abs(v.z);
  return out;
}

export function sign(out: Vec3, v: Vec3): Vec3 {
  out.x = Math.sign(v.x);
  out.y = Math.sign(v.y);
  out.z = Math.sign(v.z);
  return out;
}

export function angle(a: Vec3, b: Vec3): number {
  const den = Math.sqrt(lenSq(a) * lenSq(b));
  if (den === 0) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot(a, b) / den)));
}

export function direction(out: Vec3, from: Vec3, to: Vec3): Vec3 {
  return normalize(out, sub(out, to, from));
}

export function project(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  const scale = dot(a, b) / dot(b, b);
  return scale(out, b, scale);
}

export function reject(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  const scale = dot(a, b) / dot(b, b);
  out.x = a.x - b.x * scale;
  out.y = a.y - b.y * scale;
  out.z = a.z - b.z * scale;
  return out;
}

export function reflect(out: Vec3, incident: Vec3, normal: Vec3): Vec3 {
  const d = dot(incident, normal) * 2;
  out.x = incident.x - normal.x * d;
  out.y = incident.y - normal.y * d;
  out.z = incident.z - normal.z * d;
  return out;
}

export function refract(out: Vec3, incident: Vec3, normal: Vec3, eta: number): Vec3 {
  const cosi = Math.max(-1, Math.min(1, dot(incident, normal)));
  let n = normal;
  if (cosi < 0) {
    cosi = -cosi;
  } else {
    n = { x: -normal.x, y: -normal.y, z: -normal.z };
    eta = 1 / eta;
  }
  const k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) {
    return set(out, 0, 0, 0);
  }
  out.x = incident.x * eta + n.x * (eta * cosi - Math.sqrt(k));
  out.y = incident.y * eta + n.y * (eta * cosi - Math.sqrt(k));
  out.z = incident.z * eta + n.z * (eta * cosi - Math.sqrt(k));
  return out;
}

export function faceForward(out: Vec3, n: Vec3, i: Vec3, nRef: Vec3): Vec3 {
  return dot(nRef, i) < 0 ? copy(out, n) : negate(out, n);
}

export function orthonormalize(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  copy(out, a);
  normalize(out, out);
  const proj = dot(out, b);
  sub(out, b, scale(out, out, proj));
  return normalize(out, out);
}

export function rotateX(out: Vec3, v: Vec3, center: Vec3, rad: number): Vec3 {
  const x = v.x - center.x;
  const y = v.y - center.y;
  const z = v.z - center.z;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  out.x = x;
  out.y = y * c - z * s + center.y;
  out.z = y * s + z * c + center.z;
  return out;
}

export function rotateY(out: Vec3, v: Vec3, center: Vec3, rad: number): Vec3 {
  const x = v.x - center.x;
  const y = v.y - center.y;
  const z = v.z - center.z;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  out.x = x * c + z * s + center.x;
  out.y = y;
  out.z = -x * s + z * c + center.z;
  return out;
}

export function rotateZ(out: Vec3, v: Vec3, center: Vec3, rad: number): Vec3 {
  const x = v.x - center.x;
  const y = v.y - center.y;
  const z = v.z - center.z;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  out.x = x * c - y * s + center.x;
  out.y = x * s + y * c + center.y;
  out.z = z;
  return out;
}

export function transformQuat(out: Vec3, v: Vec3, q: Quat): Vec3 {
  const x = v.x, y = v.y, z = v.z;
  const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;
  out.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  out.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  out.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  return out;
}

export function transformMat4(out: Vec3, v: Vec3, m: Mat4): Vec3 {
  const x = v.x, y = v.y, z = v.z;
  const e = m.elements;
  const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
  out.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
  out.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
  out.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
  return out;
}

export function transformMat4Normal(out: Vec3, v: Vec3, m: Mat4): Vec3 {
  const x = v.x, y = v.y, z = v.z;
  const e = m.elements;
  out.x = e[0] * x + e[4] * y + e[8] * z;
  out.y = e[1] * x + e[5] * y + e[9] * z;
  out.z = e[2] * x + e[6] * y + e[10] * z;
  return normalize(out, out);
}

export function equals(a: Vec3, b: Vec3, epsilon = 1e-6): boolean {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon && Math.abs(a.z - b.z) < epsilon;
}

export function exactEquals(a: Vec3, b: Vec3): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

export function fromArray(out: Vec3, arr: ArrayLike<number>, offset = 0): Vec3 {
  out.x = arr[offset];
  out.y = arr[offset + 1];
  out.z = arr[offset + 2];
  return out;
}

export function toArray(v: Vec3, out: number[] = [], offset = 0): number[] {
  out[offset] = v.x;
  out[offset + 1] = v.y;
  out[offset + 2] = v.z;
  return out;
}

export function str(v: Vec3): string {
  return `vec3(${v.x.toFixed(4)}, ${v.y.toFixed(4)}, ${v.z.toFixed(4)})`;
}

export const ZERO = Object.freeze(vec3(0, 0, 0));
export const ONE = Object.freeze(vec3(1, 1, 1));
export const UNIT_X = Object.freeze(vec3(1, 0, 0));
export const UNIT_Y = Object.freeze(vec3(0, 1, 0));
export const UNIT_Z = Object.freeze(vec3(0, 0, 1));
export const UP = UNIT_Y;
export const DOWN = Object.freeze(vec3(0, -1, 0));
export const LEFT = Object.freeze(vec3(-1, 0, 0));
export const RIGHT = UNIT_X;
export const FORWARD = Object.freeze(vec3(0, 0, -1));
export const BACK = UNIT_Z;