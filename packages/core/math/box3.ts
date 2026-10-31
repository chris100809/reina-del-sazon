import type { Box3, Vec3 } from '../types';
import { vec3, copy as vcopy, min as vmin, max as vmax, set as vset } from './vec3';

export function box3(min?: Vec3, max?: Vec3): Box3 {
  return {
    min: min ? vcopy(vec3(), min) : vset(vec3(), Infinity, Infinity, Infinity),
    max: max ? vcopy(vec3(), max) : vset(vec3(), -Infinity, -Infinity, -Infinity),
  };
}

export function set(out: Box3, min: Vec3, max: Vec3): Box3 {
  vcopy(out.min, min);
  vcopy(out.max, max);
  return out;
}

export function copy(out: Box3, b: Box3): Box3 {
  vcopy(out.min, b.min);
  vcopy(out.max, b.max);
  return out;
}

export function clone(b: Box3): Box3 {
  return { min: vcopy(vec3(), b.min), max: vcopy(vec3(), b.max) };
}

export function makeEmpty(out: Box3): Box3 {
  vset(out.min, Infinity, Infinity, Infinity);
  vset(out.max, -Infinity, -Infinity, -Infinity);
  return out;
}

export function isEmpty(b: Box3): boolean {
  return b.max.x < b.min.x || b.max.y < b.min.y || b.max.z < b.min.z;
}

export function getCenter(out: Vec3, b: Box3): Vec3 {
  return isEmpty(b) ? vset(out, 0, 0, 0) : vcopy(out, b.min).x = (b.min.x + b.max.x) * 0.5,
    out.y = (b.min.y + b.max.y) * 0.5,
    out.z = (b.min.z + b.max.z) * 0.5, out;
}

export function getSize(out: Vec3, b: Box3): Vec3 {
  return isEmpty(b) ? vset(out, 0, 0, 0) :
    vset(out, b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
}

export function expandByPoint(out: Box3, b: Box3, v: Vec3): Box3 {
  vmin(out.min, b.min, v);
  vmax(out.max, b.max, v);
  return out;
}

export function expandByVector(out: Box3, b: Box3, v: Vec3): Box3 {
  vmin(out.min, b.min, { x: b.min.x - v.x, y: b.min.y - v.y, z: b.min.z - v.z });
  vmax(out.max, b.max, { x: b.max.x + v.x, y: b.max.y + v.y, z: b.max.z + v.z });
  return out;
}

export function expandByScalar(out: Box3, b: Box3, s: number): Box3 {
  vmin(out.min, b.min, { x: b.min.x - s, y: b.min.y - s, z: b.min.z - s });
  vmax(out.max, b.max, { x: b.max.x + s, y: b.max.y + s, z: b.max.z + s });
  return out;
}

export function containsPoint(b: Box3, v: Vec3): boolean {
  return v.x >= b.min.x && v.x <= b.max.x &&
         v.y >= b.min.y && v.y <= b.max.y &&
         v.z >= b.min.z && v.z <= b.max.z;
}

export function containsBox(b: Box3, box: Box3): boolean {
  return b.min.x <= box.min.x && b.max.x >= box.max.x &&
         b.min.y <= box.min.y && b.max.y >= box.max.y &&
         b.min.z <= box.min.z && b.max.z >= box.max.z;
}

export function getParameter(out: Vec3, b: Box3, v: Vec3): Vec3 {
  return vset(out,
    (v.x - b.min.x) / (b.max.x - b.min.x),
    (v.y - b.min.y) / (b.max.y - b.min.y),
    (v.z - b.min.z) / (b.max.z - b.min.z)
  );
}

export function intersectsBox(b: Box3, box: Box3): boolean {
  return !(box.max.x < b.min.x || box.min.x > b.max.x ||
           box.max.y < b.min.y || box.min.y > b.max.y ||
           box.max.z < b.min.z || box.min.z > b.max.z);
}

export function intersectsSphere(b: Box3, sphere: { center: Vec3; radius: number }): boolean {
  const closestX = Math.max(b.min.x, Math.min(sphere.center.x, b.max.x));
  const closestY = Math.max(b.min.y, Math.min(sphere.center.y, b.max.y));
  const closestZ = Math.max(b.min.z, Math.min(sphere.center.z, b.max.z));
  const dx = sphere.center.x - closestX;
  const dy = sphere.center.y - closestY;
  const dz = sphere.center.z - closestZ;
  return dx * dx + dy * dy + dz * dz <= sphere.radius * sphere.radius;
}

export function intersectsPlane(b: Box3, plane: { normal: Vec3; constant: number }): boolean {
  let min, max;
  if (plane.normal.x > 0) { min = plane.normal.x * b.min.x; max = plane.normal.x * b.max.x; }
  else { min = plane.normal.x * b.max.x; max = plane.normal.x * b.min.x; }
  if (plane.normal.y > 0) { min += plane.normal.y * b.min.y; max += plane.normal.y * b.max.y; }
  else { min += plane.normal.y * b.max.y; max += plane.normal.y * b.min.y; }
  if (plane.normal.z > 0) { min += plane.normal.z * b.min.z; max += plane.normal.z * b.max.z; }
  else { min += plane.normal.z * b.max.z; max += plane.normal.z * b.min.z; }
  return min <= -plane.constant && max >= -plane.constant;
}

export function clampPoint(out: Vec3, b: Box3, v: Vec3): Vec3 {
  return vset(out,
    Math.max(b.min.x, Math.min(b.max.x, v.x)),
    Math.max(b.min.y, Math.min(b.max.y, v.y)),
    Math.max(b.min.z, Math.min(b.max.z, v.z))
  );
}

export function distanceToPoint(b: Box3, v: Vec3): number {
  const dx = Math.max(b.min.x - v.x, 0, v.x - b.max.x);
  const dy = Math.max(b.min.y - v.y, 0, v.y - b.max.y);
  const dz = Math.max(b.min.z - v.z, 0, v.z - b.max.z);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function getBoundingSphere(out: { center: Vec3; radius: number }, b: Box3): { center: Vec3; radius: number } {
  getCenter(out.center, b);
  out.radius = getSize(vec3(), b).x * 0.5;
  return out;
}

export function applyMat4(out: Box3, b: Box3, m: Float32Array): Box3 {
  if (isEmpty(b)) return out;
  const min = b.min, max = b.max;
  const bx = min.x, by = min.y, bz = min.z;
  const Bx = max.x, By = max.y, Bz = max.z;
  const e = m;
  let x, y, z;
  x = e[0] * bx + e[4] * by + e[8] * bz + e[12];
  y = e[1] * bx + e[5] * by + e[9] * bz + e[13];
  z = e[2] * bx + e[6] * by + e[10] * bz + e[14];
  out.min.x = x; out.min.y = y; out.min.z = z;
  out.max.x = x; out.max.y = y; out.max.z = z;
  x = e[0] * Bx + e[4] * by + e[8] * bz + e[12];
  y = e[1] * Bx + e[5] * by + e[9] * bz + e[13];
  z = e[2] * Bx + e[6] * by + e[10] * bz + e[14];
  vmin(out.min, out.min, { x, y, z });
  vmax(out.max, out.max, { x, y, z });
  x = e[0] * bx + e[4] * By + e[8] * bz + e[12];
  y = e[1] * bx + e[5] * By + e[9] * bz + e[13];
  z = e[2] * bx + e[6] * By + e[10] * bz + e[14];
  vmin(out.min, out.min, { x, y, z });
  vmax(out.max, out.max, { x, y, z });
  x = e[0] * Bx + e[4] * By + e[8] * bz + e[12];
  y = e[1] * Bx + e[5] * By + e[9] * bz + e[13];
  z = e[2] * Bx + e[6] * By + e[10] * bz + e[14];
  vmin(out.min, out.min, { x, y, z });
  vmax(out.max, out.max, { x, y, z });
  x = e[0] * bx + e[4] * by + e[8] * Bz + e[12];
  y = e[1] * bx + e[5] * by + e[9] * Bz + e[13];
  z = e[2] * bx + e[6] * by + e[10] * Bz + e[14];
  vmin(out.min, out.min, { x, y, z });
  vmax(out.max, out.max, { x, y, z });
  x = e[0] * Bx + e[4] * by + e[8] * Bz + e[12];
  y = e[1] * Bx + e[5] * by + e[9] * Bz + e[13];
  z = e[2] * Bx + e[6] * by + e[10] * Bz + e[14];
  vmin(out.min, out.min, { x, y, z });
  vmax(out.max, out.max, { x, y, z });
  x = e[0] * bx + e[4] * By + e[8] * Bz + e[12];
  y = e[1] * bx + e[5] * By + e[9] * Bz + e[13];
  z = e[2] * bx + e[6] * By + e[10] * Bz + e[14];
  vmin(out.min, out.min, { x, y, z });
  vmax(out.max, out.max, { x, y, z });
  x = e[0] * Bx + e[4] * By + e[8] * Bz + e[12];
  y = e[1] * Bx + e[5] * By + e[9] * Bz + e[13];
  z = e[2] * Bx + e[6] * By + e[10] * Bz + e[14];
  vmin(out.min, out.min, { x, y, z });
  vmax(out.max, out.max, { x, y, z });
  return out;
}

export function equals(a: Box3, b: Box3): boolean {
  return a.min.x === b.min.x && a.min.y === b.min.y && a.min.z === b.min.z &&
         a.max.x === b.max.x && a.max.y === b.max.y && a.max.z === b.max.z;
}

export function str(b: Box3): string {
  return `box3(min: ${b.min.x.toFixed(4)}, ${b.min.y.toFixed(4)}, ${b.min.z.toFixed(4)}; max: ${b.max.x.toFixed(4)}, ${b.max.y.toFixed(4)}, ${b.max.z.toFixed(4)})`;
}