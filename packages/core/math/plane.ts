import type { Plane, Vec3 } from '../types';
import { vec3, copy as vcopy, set as vset, dot as vdot, normalize as vnormalize, len as vlen } from './vec3';

export function plane(normal?: Vec3, constant = 0): Plane {
  return { normal: normal ? vcopy(vec3(), normal) : vset(vec3(), 0, 0, 1), constant };
}

export function set(out: Plane, normal: Vec3, constant: number): Plane {
  vcopy(out.normal, normal);
  out.constant = constant;
  return out;
}

export function copy(out: Plane, p: Plane): Plane {
  vcopy(out.normal, p.normal);
  out.constant = p.constant;
  return out;
}

export function clone(p: Plane): Plane {
  return { normal: vcopy(vec3(), p.normal), constant: p.constant };
}

export function fromNormalAndCoplanarPoint(out: Plane, normal: Vec3, point: Vec3): Plane {
  vnormalize(out.normal, normal);
  out.constant = -vdot(out.normal, point);
  return out;
}

export function fromCoplanarPoints(out: Plane, a: Vec3, b: Vec3, c: Vec3): Plane {
  const normal = vec3();
  vcopy(normal, b);
  vsub(normal, normal, a);
  vcross(normal, normal, vsub(vec3(), c, a));
  vnormalize(normal, normal);
  out.normal = normal;
  out.constant = -vdot(normal, a);
  return out;
}

function vsub(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out.x = a.x - b.x; out.y = a.y - b.y; out.z = a.z - b.z; return out;
}
function vcross(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  const ax = a.x, ay = a.y, az = a.z; const bx = b.x, by = b.y, bz = b.z;
  out.x = ay * bz - az * by; out.y = az * bx - ax * bz; out.z = ax * by - ay * bx; return out;
}

export function distanceToPoint(p: Plane, v: Vec3): number {
  return vdot(p.normal, v) + p.constant;
}

export function projectPoint(out: Vec3, p: Plane, v: Vec3): Vec3 {
  const distance = distanceToPoint(p, v);
  return vset(out, v.x - p.normal.x * distance, v.y - p.normal.y * distance, v.z - p.normal.z * distance);
}

export function intersectsLine(p: Plane, start: Vec3, end: Vec3): Vec3 | null {
  const direction = vsub(vec3(), end, start);
  const denominator = vdot(p.normal, direction);
  if (Math.abs(denominator) < 1e-6) return null;
  const t = -(vdot(p.normal, start) + p.constant) / denominator;
  if (t < 0 || t > 1) return null;
  return vset(vec3(), start.x + direction.x * t, start.y + direction.y * t, start.z + direction.z * t);
}

export function intersectsLineInfinite(p: Plane, start: Vec3, direction: Vec3): Vec3 | null {
  const denominator = vdot(p.normal, direction);
  if (Math.abs(denominator) < 1e-6) return null;
  const t = -(vdot(p.normal, start) + p.constant) / denominator;
  return vset(vec3(), start.x + direction.x * t, start.y + direction.y * t, start.z + direction.z * t);
}

export function coplanarPoint(out: Vec3, p: Plane): Vec3 {
  return vset(out, -p.normal.x * p.constant, -p.normal.y * p.constant, -p.normal.z * p.constant);
}

export function applyMat4(out: Plane, p: Plane, m: Float32Array): Plane {
  const e = m;
  const nx = p.normal.x, ny = p.normal.y, nz = p.normal.z;
  const x = e[0] * nx + e[4] * ny + e[8] * nz;
  const y = e[1] * nx + e[5] * ny + e[9] * nz;
  const z = e[2] * nx + e[6] * ny + e[10] * nz;
  const d = -p.constant;
  const d2 = e[3] * nx + e[7] * ny + e[11] * nz + e[15] * d;
  vset(out.normal, x, y, z);
  vnormalize(out.normal, out.normal);
  out.constant = -d2;
  return out;
}

export function translate(out: Plane, p: Plane, offset: Vec3): Plane {
  vcopy(out.normal, p.normal);
  out.constant = p.constant - vdot(p.normal, offset);
  return out;
}

export function equals(a: Plane, b: Plane): boolean {
  return a.normal.x === b.normal.x && a.normal.y === b.normal.y && a.normal.z === b.normal.z && a.constant === b.constant;
}

export function str(p: Plane): string {
  return `plane(normal: ${p.normal.x.toFixed(4)}, ${p.normal.y.toFixed(4)}, ${p.normal.z.toFixed(4)}; constant: ${p.constant.toFixed(4)})`;
}