import type { Vec2 } from '../types';

export function vec2(x = 0, y = 0): Vec2 {
  return { x, y };
}

export function set(v: Vec2, x: number, y: number): Vec2 {
  v.x = x;
  v.y = y;
  return v;
}

export function copy(out: Vec2, v: Vec2): Vec2 {
  out.x = v.x;
  out.y = v.y;
  return out;
}

export function clone(v: Vec2): Vec2 {
  return { x: v.x, y: v.y };
}

export function add(out: Vec2, a: Vec2, b: Vec2): Vec2 {
  out.x = a.x + b.x;
  out.y = a.y + b.y;
  return out;
}

export function sub(out: Vec2, a: Vec2, b: Vec2): Vec2 {
  out.x = a.x - b.x;
  out.y = a.y - b.y;
  return out;
}

export function mul(out: Vec2, a: Vec2, b: Vec2): Vec2 {
  out.x = a.x * b.x;
  out.y = a.y * b.y;
  return out;
}

export function div(out: Vec2, a: Vec2, b: Vec2): Vec2 {
  out.x = a.x / b.x;
  out.y = a.y / b.y;
  return out;
}

export function scale(out: Vec2, v: Vec2, s: number): Vec2 {
  out.x = v.x * s;
  out.y = v.y * s;
  return out;
}

export function scaleAndAdd(out: Vec2, a: Vec2, b: Vec2, s: number): Vec2 {
  out.x = a.x + b.x * s;
  out.y = a.y + b.y * s;
  return out;
}

export function negate(out: Vec2, v: Vec2): Vec2 {
  out.x = -v.x;
  out.y = -v.y;
  return out;
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function cross(a: Vec2, b: Vec2): number {
  return a.x * b.y - a.y * b.x;
}

export function len(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

export function lenSq(v: Vec2): number {
  return v.x * v.x + v.y * v.y;
}

export function normalize(out: Vec2, v: Vec2): Vec2 {
  const l = len(v);
  if (l > 0) {
    out.x = v.x / l;
    out.y = v.y / l;
  }
  return out;
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function distanceSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function lerp(out: Vec2, a: Vec2, b: Vec2, t: number): Vec2 {
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
  return out;
}

export function min(out: Vec2, a: Vec2, b: Vec2): Vec2 {
  out.x = Math.min(a.x, b.x);
  out.y = Math.min(a.y, b.y);
  return out;
}

export function max(out: Vec2, a: Vec2, b: Vec2): Vec2 {
  out.x = Math.max(a.x, b.x);
  out.y = Math.max(a.y, b.y);
  return out;
}

export function clamp(out: Vec2, v: Vec2, min: Vec2, max: Vec2): Vec2 {
  out.x = Math.max(min.x, Math.min(max.x, v.x));
  out.y = Math.max(min.y, Math.min(max.y, v.y));
  return out;
}

export function floor(out: Vec2, v: Vec2): Vec2 {
  out.x = Math.floor(v.x);
  out.y = Math.floor(v.y);
  return out;
}

export function ceil(out: Vec2, v: Vec2): Vec2 {
  out.x = Math.ceil(v.x);
  out.y = Math.ceil(v.y);
  return out;
}

export function round(out: Vec2, v: Vec2): Vec2 {
  out.x = Math.round(v.x);
  out.y = Math.round(v.y);
  return out;
}

export function fract(out: Vec2, v: Vec2): Vec2 {
  out.x = v.x - Math.floor(v.x);
  out.y = v.y - Math.floor(v.y);
  return out;
}

export function abs(out: Vec2, v: Vec2): Vec2 {
  out.x = Math.abs(v.x);
  out.y = Math.abs(v.y);
  return out;
}

export function sign(out: Vec2, v: Vec2): Vec2 {
  out.x = Math.sign(v.x);
  out.y = Math.sign(v.y);
  return out;
}

export function rotate(out: Vec2, v: Vec2, center: Vec2, rad: number): Vec2 {
  const x = v.x - center.x;
  const y = v.y - center.y;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  out.x = x * c - y * s + center.x;
  out.y = x * s + y * c + center.y;
  return out;
}

export function angle(a: Vec2, b: Vec2): number {
  return Math.atan2(cross(a, b), dot(a, b));
}

export function direction(out: Vec2, from: Vec2, to: Vec2): Vec2 {
  return normalize(out, sub(out, to, from));
}

export function project(out: Vec2, a: Vec2, b: Vec2): Vec2 {
  const scale = dot(a, b) / dot(b, b);
  return scale(out, b, scale);
}

export function reflect(out: Vec2, incident: Vec2, normal: Vec2): Vec2 {
  const d = dot(incident, normal) * 2;
  out.x = incident.x - normal.x * d;
  out.y = incident.y - normal.y * d;
  return out;
}

export function perpendicular(out: Vec2, v: Vec2): Vec2 {
  out.x = -v.y;
  out.y = v.x;
  return out;
}

export function equals(a: Vec2, b: Vec2, epsilon = 1e-6): boolean {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
}

export function exactEquals(a: Vec2, b: Vec2): boolean {
  return a.x === b.x && a.y === b.y;
}

export function fromArray(out: Vec2, arr: ArrayLike<number>, offset = 0): Vec2 {
  out.x = arr[offset];
  out.y = arr[offset + 1];
  return out;
}

export function toArray(v: Vec2, out: number[] = [], offset = 0): number[] {
  out[offset] = v.x;
  out[offset + 1] = v.y;
  return out;
}

export function str(v: Vec2): string {
  return `vec2(${v.x.toFixed(4)}, ${v.y.toFixed(4)})`;
}

export const ZERO = Object.freeze(vec2(0, 0));
export const ONE = Object.freeze(vec2(1, 1));
export const UNIT_X = Object.freeze(vec2(1, 0));
export const UNIT_Y = Object.freeze(vec2(0, 1));