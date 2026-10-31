import type { Ray, Vec3, Box3, Sphere, Plane, Triangle } from '../types';
import { vec3, copy as vcopy, set as vset, sub as vsub, dot as vdot, normalize as vnormalize, distanceSq as vdistanceSq } from './vec3';
import { box3 } from './box3';

export function ray(origin?: Vec3, direction?: Vec3): Ray {
  return {
    origin: origin ? vcopy(vec3(), origin) : vset(vec3(), 0, 0, 0),
    direction: direction ? vcopy(vec3(), direction) : vset(vec3(), 0, 0, -1),
  };
}

export function set(out: Ray, origin: Vec3, direction: Vec3): Ray {
  vcopy(out.origin, origin);
  vcopy(out.direction, direction);
  return out;
}

export function copy(out: Ray, r: Ray): Ray {
  vcopy(out.origin, r.origin);
  vcopy(out.direction, r.direction);
  return out;
}

export function clone(r: Ray): Ray {
  return { origin: vcopy(vec3(), r.origin), direction: vcopy(vec3(), r.direction) };
}

export function at(out: Vec3, r: Ray, t: number): Vec3 {
  return vset(out, r.origin.x + r.direction.x * t, r.origin.y + r.direction.y * t, r.origin.z + r.direction.z * t);
}

export function lookAt(out: Ray, origin: Vec3, target: Vec3): Ray {
  vcopy(out.origin, origin);
  vnormalize(out.direction, vsub(out.direction, target, origin));
  return out;
}

export function recast(out: Ray, r: Ray, t: number): Ray {
  vcopy(out.origin, at(vec3(), r, t));
  vcopy(out.direction, r.direction);
  return out;
}

export function closestPointToPoint(out: Vec3, r: Ray, point: Vec3): Vec3 {
  const directionDistance = vdot(point, r.direction) - vdot(r.origin, r.direction);
  if (directionDistance < 0) return vcopy(out, r.origin);
  return vset(out, r.origin.x + r.direction.x * directionDistance, r.origin.y + r.direction.y * directionDistance, r.origin.z + r.direction.z * directionDistance);
}

export function distanceToPoint(r: Ray, point: Vec3): number {
  const diff = vsub(vec3(), point, r.origin);
  const directionDistance = vdot(diff, r.direction);
  if (directionDistance < 0) return Math.sqrt(vdistanceSq(point, r.origin));
  const closest = vset(vec3(), r.origin.x + r.direction.x * directionDistance, r.origin.y + r.direction.y * directionDistance, r.origin.z + r.direction.z * directionDistance);
  return Math.sqrt(vdistanceSq(point, closest));
}

export function distanceSqToPoint(r: Ray, point: Vec3): number {
  const diff = vsub(vec3(), point, r.origin);
  const directionDistance = vdot(diff, r.direction);
  if (directionDistance < 0) return vdistanceSq(point, r.origin);
  const closest = vset(vec3(), r.origin.x + r.direction.x * directionDistance, r.origin.y + r.direction.y * directionDistance, r.origin.z + r.direction.z * directionDistance);
  return vdistanceSq(point, closest);
}

export function distanceToPlane(r: Ray, plane: Plane): number {
  const denominator = vdot(plane.normal, r.direction);
  if (Math.abs(denominator) < 1e-6) return vdot(plane.normal, r.origin) + plane.constant;
  return -(vdot(plane.normal, r.origin) + plane.constant) / denominator;
}

export function intersectPlane(out: Vec3, r: Ray, plane: Plane): Vec3 | null {
  const denominator = vdot(plane.normal, r.direction);
  if (Math.abs(denominator) < 1e-6) return null;
  const t = -(vdot(plane.normal, r.origin) + plane.constant) / denominator;
  if (t < 0) return null;
  return at(out, r, t);
}

export function intersectsBox(r: Ray, box: Box3): boolean {
  let tmin = -Infinity, tmax = Infinity;
  const invDirX = 1 / r.direction.x, invDirY = 1 / r.direction.y, invDirZ = 1 / r.direction.z;
  let t1 = (box.min.x - r.origin.x) * invDirX;
  let t2 = (box.max.x - r.origin.x) * invDirX;
  tmin = Math.max(tmin, Math.min(t1, t2));
  tmax = Math.min(tmax, Math.max(t1, t2));
  t1 = (box.min.y - r.origin.y) * invDirY;
  t2 = (box.max.y - r.origin.y) * invDirY;
  tmin = Math.max(tmin, Math.min(t1, t2));
  tmax = Math.min(tmax, Math.max(t1, t2));
  t1 = (box.min.z - r.origin.z) * invDirZ;
  t2 = (box.max.z - r.origin.z) * invDirZ;
  tmin = Math.max(tmin, Math.min(t1, t2));
  tmax = Math.min(tmax, Math.max(t1, t2));
  return tmax >= Math.max(tmin, 0);
}

export function intersectBox(out: Vec3, r: Ray, box: Box3): Vec3 | null {
  let tmin = -Infinity, tmax = Infinity;
  const invDirX = 1 / r.direction.x, invDirY = 1 / r.direction.y, invDirZ = 1 / r.direction.z;
  let t1 = (box.min.x - r.origin.x) * invDirX;
  let t2 = (box.max.x - r.origin.x) * invDirX;
  tmin = Math.max(tmin, Math.min(t1, t2));
  tmax = Math.min(tmax, Math.max(t1, t2));
  t1 = (box.min.y - r.origin.y) * invDirY;
  t2 = (box.max.y - r.origin.y) * invDirY;
  tmin = Math.max(tmin, Math.min(t1, t2));
  tmax = Math.min(tmax, Math.max(t1, t2));
  t1 = (box.min.z - r.origin.z) * invDirZ;
  t2 = (box.max.z - r.origin.z) * invDirZ;
  tmin = Math.max(tmin, Math.min(t1, t2));
  tmax = Math.min(tmax, Math.max(t1, t2));
  if (tmax < Math.max(tmin, 0)) return null;
  return at(out, r, Math.max(tmin, 0));
}

export function intersectsSphere(r: Ray, sphere: Sphere): boolean {
  const diff = vsub(vec3(), r.origin, sphere.center);
  const a = vdot(r.direction, r.direction);
  const b = 2 * vdot(diff, r.direction);
  const c = vdot(diff, diff) - sphere.radius * sphere.radius;
  const discriminant = b * b - 4 * a * c;
  return discriminant >= 0;
}

export function intersectSphere(out: Vec3, r: Ray, sphere: Sphere): Vec3 | null {
  const diff = vsub(vec3(), r.origin, sphere.center);
  const a = vdot(r.direction, r.direction);
  const b = 2 * vdot(diff, r.direction);
  const c = vdot(diff, diff) - sphere.radius * sphere.radius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);
  if (t1 >= 0) return at(out, r, t1);
  if (t2 >= 0) return at(out, r, t2);
  return null;
}

export function intersectsTriangle(r: Ray, triangle: Triangle, backfaceCulling = false): boolean {
  return intersectTriangle(vec3(), r, triangle, backfaceCulling) !== null;
}

export function intersectTriangle(out: Vec3, r: Ray, triangle: Triangle, backfaceCulling = false): Vec3 | null {
  const { a, b, c } = triangle;
  const edge1 = vsub(vec3(), b, a);
  const edge2 = vsub(vec3(), c, a);
  const h = vcross(vec3(), r.direction, edge2);
  const a_det = vdot(edge1, h);
  if (Math.abs(a_det) < 1e-6) return null;
  const f = 1 / a_det;
  const s = vsub(vec3(), r.origin, a);
  const u = f * vdot(s, h);
  if (u < 0 || u > 1) return null;
  const q = vcross(vec3(), s, edge1);
  const v = f * vdot(r.direction, q);
  if (v < 0 || u + v > 1) return null;
  const t = f * vdot(edge2, q);
  if (t < 0) return null;
  return at(out, r, t);
}

function vcross(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  const ax = a.x, ay = a.y, az = a.z; const bx = b.x, by = b.y, bz = b.z;
  out.x = ay * bz - az * by; out.y = az * bx - ax * bz; out.z = ax * by - ay * bx; return out;
}

export function applyMat4(out: Ray, r: Ray, m: Float32Array): Ray {
  const e = m;
  const x = e[0] * r.origin.x + e[4] * r.origin.y + e[8] * r.origin.z + e[12];
  const y = e[1] * r.origin.x + e[5] * r.origin.y + e[9] * r.origin.z + e[13];
  const z = e[2] * r.origin.x + e[6] * r.origin.y + e[10] * r.origin.z + e[14];
  vset(out.origin, x, y, z);
  const dx = e[0] * r.direction.x + e[4] * r.direction.y + e[8] * r.direction.z;
  const dy = e[1] * r.direction.x + e[5] * r.direction.y + e[9] * r.direction.z;
  const dz = e[2] * r.direction.x + e[6] * r.direction.y + e[10] * r.direction.z;
  vset(out.direction, dx, dy, dz);
  vnormalize(out.direction, out.direction);
  return out;
}

export function equals(a: Ray, b: Ray): boolean {
  return a.origin.x === b.origin.x && a.origin.y === b.origin.y && a.origin.z === b.origin.z &&
         a.direction.x === b.direction.x && a.direction.y === b.direction.y && a.direction.z === b.direction.z;
}

export function str(r: Ray): string {
  return `ray(origin: ${r.origin.x.toFixed(4)}, ${r.origin.y.toFixed(4)}, ${r.origin.z.toFixed(4)}; direction: ${r.direction.x.toFixed(4)}, ${r.direction.y.toFixed(4)}, ${r.direction.z.toFixed(4)})`;
}