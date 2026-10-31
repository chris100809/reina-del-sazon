import type { Sphere, Vec3, Box3 } from '../types';
import { vec3, copy as vcopy, set as vset, len as vlen, distance as vdistance } from './vec3';

export function sphere(center?: Vec3, radius = 0): Sphere {
  return { center: center ? vcopy(vec3(), center) : vset(vec3(), 0, 0, 0), radius };
}

export function set(out: Sphere, center: Vec3, radius: number): Sphere {
  vcopy(out.center, center);
  out.radius = radius;
  return out;
}

export function copy(out: Sphere, s: Sphere): Sphere {
  vcopy(out.center, s.center);
  out.radius = s.radius;
  return out;
}

export function clone(s: Sphere): Sphere {
  return { center: vcopy(vec3(), s.center), radius: s.radius };
}

export function makeEmptySphere(out: Sphere): Sphere {
  vset(out.center, 0, 0, 0);
  out.radius = -1;
  return out;
}

export function isEmpty(s: Sphere): boolean {
  return s.radius < 0;
}

export function containsPoint(s: Sphere, v: Vec3): boolean {
  return vdistance(v, s.center) <= s.radius;
}

export function distanceToPoint(s: Sphere, v: Vec3): number {
  return vdistance(v, s.center) - s.radius;
}

export function intersectsSphere(s: Sphere, other: Sphere): boolean {
  const radiusSum = s.radius + other.radius;
  return vdistance(s.center, other.center) <= radiusSum;
}

export function intersectsBox(s: Sphere, b: Box3): boolean {
  const closestX = Math.max(b.min.x, Math.min(s.center.x, b.max.x));
  const closestY = Math.max(b.min.y, Math.min(s.center.y, b.max.y));
  const closestZ = Math.max(b.min.z, Math.min(s.center.z, b.max.z));
  const dx = s.center.x - closestX;
  const dy = s.center.y - closestY;
  const dz = s.center.z - closestZ;
  return dx * dx + dy * dy + dz * dz <= s.radius * s.radius;
}

export function intersectsPlane(s: Sphere, plane: { normal: Vec3; constant: number }): boolean {
  const distance = plane.normal.x * s.center.x + plane.normal.y * s.center.y + plane.normal.z * s.center.z + plane.constant;
  return Math.abs(distance) <= s.radius;
}

export function clampPoint(out: Vec3, s: Sphere, v: Vec3): Vec3 {
  const deltaX = v.x - s.center.x;
  const deltaY = v.y - s.center.y;
  const deltaZ = v.z - s.center.z;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
  if (distance <= s.radius) return vcopy(out, v);
  const scale = s.radius / distance;
  return vset(out, s.center.x + deltaX * scale, s.center.y + deltaY * scale, s.center.z + deltaZ * scale);
}

export function getBoundingBox(out: Box3, s: Sphere): Box3 {
  if (isEmpty(s)) return makeEmptyBox(out);
  vset(out.min, s.center.x - s.radius, s.center.y - s.radius, s.center.z - s.radius);
  vset(out.max, s.center.x + s.radius, s.center.y + s.radius, s.center.z + s.radius);
  return out;
}

export function applyMat4(out: Sphere, s: Sphere, m: Float32Array): Sphere {
  if (isEmpty(s)) return makeEmptySphere(out);
  const e = m;
  const x = e[0] * s.center.x + e[4] * s.center.y + e[8] * s.center.z + e[12];
  const y = e[1] * s.center.x + e[5] * s.center.y + e[9] * s.center.z + e[13];
  const z = e[2] * s.center.x + e[6] * s.center.y + e[10] * s.center.z + e[14];
  vset(out.center, x, y, z);
  const scaleX = Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);
  const scaleY = Math.sqrt(e[4] * e[4] + e[5] * e[5] + e[6] * e[6]);
  const scaleZ = Math.sqrt(e[8] * e[8] + e[9] * e[9] + e[10] * e[10]);
  out.radius = s.radius * Math.max(scaleX, scaleY, scaleZ);
  return out;
}

export function translateSphere(out: Sphere, s: Sphere, offset: Vec3): Sphere {
  vcopy(out.center, s.center);
  out.center.x += offset.x;
  out.center.y += offset.y;
  out.center.z += offset.z;
  out.radius = s.radius;
  return out;
}

export function expandByPointSphere(out: Sphere, s: Sphere, v: Vec3): Sphere {
  if (isEmpty(s)) {
    vcopy(out.center, v);
    out.radius = 0;
    return out;
  }
  const distance = vdistance(v, s.center);
  if (distance <= s.radius) return copy(out, s);
  const newRadius = (s.radius + distance) * 0.5;
  const scale = (newRadius - s.radius) / distance;
  out.center.x = s.center.x + (v.x - s.center.x) * scale;
  out.center.y = s.center.y + (v.y - s.center.y) * scale;
  out.center.z = s.center.z + (v.z - s.center.z) * scale;
  out.radius = newRadius;
  return out;
}

export function unionSphere(out: Sphere, s1: Sphere, s2: Sphere): Sphere {
  if (isEmpty(s1)) return copy(out, s2);
  if (isEmpty(s2)) return copy(out, s1);
  const centerDist = vdistance(s1.center, s2.center);
  const radiusSum = s1.radius + s2.radius;
  if (centerDist >= radiusSum) {
    const newRadius = (centerDist + radiusSum) * 0.5;
    const scale = (newRadius - s1.radius) / centerDist;
    out.center.x = s1.center.x + (s2.center.x - s1.center.x) * scale;
    out.center.y = s1.center.y + (s2.center.y - s1.center.y) * scale;
    out.center.z = s1.center.z + (s2.center.z - s1.center.z) * scale;
    out.radius = newRadius;
  } else {
    const r1 = s1.radius, r2 = s2.radius;
    if (r1 >= r2 + centerDist) return copy(out, s1);
    if (r2 >= r1 + centerDist) return copy(out, s2);
    const newRadius = (centerDist + r1 + r2) * 0.5;
    const scale = (newRadius - r1) / centerDist;
    out.center.x = s1.center.x + (s2.center.x - s1.center.x) * scale;
    out.center.y = s1.center.y + (s2.center.y - s1.center.y) * scale;
    out.center.z = s1.center.z + (s2.center.z - s1.center.z) * scale;
    out.radius = newRadius;
  }
  return out;
}

export function equals(a: Sphere, b: Sphere): boolean {
  return a.center.x === b.center.x && a.center.y === b.center.y && a.center.z === b.center.z && a.radius === b.radius;
}

export function fromPoints(out: Sphere, points: Float32Array, stride = 3): Sphere {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0, l = points.length; i < l; i += stride) {
    const x = points[i], y = points[i + 1], z = points[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  const centerX = (minX + maxX) * 0.5;
  const centerY = (minY + maxY) * 0.5;
  const centerZ = (minZ + maxZ) * 0.5;
  vset(out.center, centerX, centerY, centerZ);
  out.radius = Math.max(maxX - centerX, maxY - centerY, maxZ - centerZ);
  return out;
}

export function str(s: Sphere): string {
  return `sphere(center: ${s.center.x.toFixed(4)}, ${s.center.y.toFixed(4)}, ${s.center.z.toFixed(4)}; radius: ${s.radius.toFixed(4)})`;
}

function makeEmptyBox(out: Box3): Box3 {
  vset(out.min, Infinity, Infinity, Infinity);
  vset(out.max, -Infinity, -Infinity, -Infinity);
  return out;
}