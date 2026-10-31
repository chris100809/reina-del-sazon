import type { Triangle, Vec3 } from '../types';
import { vec3, copy as vcopy, set as vset, sub as vsub, cross as vcross, dot as vdot, normalize as vnormalize, distanceSq as vdistanceSq } from './vec3';

export function triangle(a?: Vec3, b?: Vec3, c?: Vec3): Triangle {
  return {
    a: a ? vcopy(vec3(), a) : vset(vec3(), 0, 0, 0),
    b: b ? vcopy(vec3(), b) : vset(vec3(), 0, 1, 0),
    c: c ? vcopy(vec3(), c) : vset(vec3(), 1, 0, 0),
  };
}

export function set(out: Triangle, a: Vec3, b: Vec3, c: Vec3): Triangle {
  vcopy(out.a, a); vcopy(out.b, b); vcopy(out.c, c);
  return out;
}

export function copy(out: Triangle, t: Triangle): Triangle {
  vcopy(out.a, t.a); vcopy(out.b, t.b); vcopy(out.c, t.c);
  return out;
}

export function clone(t: Triangle): Triangle {
  return { a: vcopy(vec3(), t.a), b: vcopy(vec3(), t.b), c: vcopy(vec3(), t.c) };
}

export function getNormal(out: Vec3, t: Triangle): Vec3 {
  const edge1 = vsub(vec3(), t.b, t.a);
  const edge2 = vsub(vec3(), t.c, t.a);
  vcross(out, edge1, edge2);
  return vnormalize(out, out);
}

export function getPlane(out: { normal: Vec3; constant: number }, t: Triangle): { normal: Vec3; constant: number } {
  getNormal(out.normal, t);
  out.constant = -vdot(out.normal, t.a);
  return out;
}

export function getBarycoord(out: Vec3, point: Vec3, t: Triangle): Vec3 {
  const v0 = vsub(vec3(), t.b, t.a);
  const v1 = vsub(vec3(), t.c, t.a);
  const v2 = vsub(vec3(), point, t.a);
  const d00 = vdot(v0, v0);
  const d01 = vdot(v0, v1);
  const d11 = vdot(v1, v1);
  const d20 = vdot(v2, v0);
  const d21 = vdot(v2, v1);
  const denom = d00 * d11 - d01 * d01;
  out.y = (d11 * d20 - d01 * d21) / denom;
  out.z = (d00 * d21 - d01 * d20) / denom;
  out.x = 1 - out.y - out.z;
  return out;
}

export function containsPoint(t: Triangle, point: Vec3): boolean {
  const bary = getBarycoord(vec3(), point, t);
  return bary.x >= 0 && bary.y >= 0 && bary.z >= 0 && bary.x <= 1 && bary.y <= 1 && bary.z <= 1;
}

export function getArea(t: Triangle): number {
  const edge1 = vsub(vec3(), t.b, t.a);
  const edge2 = vsub(vec3(), t.c, t.a);
  const cross = vcross(vec3(), edge1, edge2);
  return 0.5 * Math.sqrt(vdot(cross, cross));
}

export function equals(a: Triangle, b: Triangle): boolean {
  return a.a.x === b.a.x && a.a.y === b.a.y && a.a.z === b.a.z &&
         a.b.x === b.b.x && a.b.y === b.b.y && a.b.z === b.b.z &&
         a.c.x === b.c.x && a.c.y === b.c.y && a.c.z === b.c.z;
}

export function closestPointToPoint(out: Vec3, t: Triangle, point: Vec3): Vec3 {
  const diff = vsub(vec3(), point, t.a);
  const ab = vsub(vec3(), t.b, t.a);
  const ac = vsub(vec3(), t.c, t.a);
  const d1 = vdot(ab, diff);
  const d2 = vdot(ac, diff);
  if (d1 <= 0 && d2 <= 0) return vcopy(out, t.a);
  const bp = vsub(vec3(), point, t.b);
  const d3 = vdot(ab, bp);
  const d4 = vdot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return vcopy(out, t.b);
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const v = d1 / (d1 - d3);
    return vset(out, t.a.x + ab.x * v, t.a.y + ab.y * v, t.a.z + ab.z * v);
  }
  const cp = vsub(vec3(), point, t.c);
  const d5 = vdot(ab, cp);
  const d6 = vdot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return vcopy(out, t.c);
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const w = d2 / (d2 - d6);
    return vset(out, t.a.x + ac.x * w, t.a.y + ac.y * w, t.a.z + ac.z * w);
  }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
    const denom = 1 / (va + vb + vc);
    const v = vb * denom;
    const w = vc * denom;
    return vset(out, t.a.x + ab.x * v + ac.x * w, t.a.y + ab.y * v + ac.y * w, t.a.z + ab.z * v + ac.z * w);
  }
  return vcopy(out, point);
}

export function distanceSqToPoint(t: Triangle, point: Vec3): number {
  const closest = closestPointToPoint(vec3(), t, point);
  return vdistanceSq(point, closest);
}

export function intersectsBox(t: Triangle, box: { min: Vec3; max: Vec3 }): boolean {
  // Triangle-Box overlap test using Separating Axis Theorem
  // Simplified implementation - in production use a robust SAT implementation
  const { a, b, c } = t;
  const min = box.min, max = box.max;
  // Check if all vertices are outside one of the box planes
  if (a.x > max.x && b.x > max.x && c.x > max.x) return false;
  if (a.x < min.x && b.x < min.x && c.x < min.x) return false;
  if (a.y > max.y && b.y > max.y && c.y > max.y) return false;
  if (a.y < min.y && b.y < min.y && c.y < min.y) return false;
  if (a.z > max.z && b.z > max.z && c.z > max.z) return false;
  if (a.z < min.z && b.z < min.z && c.z < min.z) return false;
  // Check box corners against triangle plane
  const normal = getNormal(vec3(), t);
  const d = -vdot(normal, a);
  const corners = [
    { x: min.x, y: min.y, z: min.z }, { x: max.x, y: min.y, z: min.z },
    { x: min.x, y: max.y, z: min.z }, { x: max.x, y: max.y, z: min.z },
    { x: min.x, y: min.y, z: max.z }, { x: max.x, y: min.y, z: max.z },
    { x: min.x, y: max.y, z: max.z }, { x: max.x, y: max.y, z: max.z },
  ];
  let pos = false, neg = false;
  for (const corner of corners) {
    const dist = vdot(normal, corner) + d;
    if (dist > 1e-6) pos = true;
    else if (dist < -1e-6) neg = true;
    if (pos && neg) return true;
  }
  return false;
}

export function str(t: Triangle): string {
  return `triangle(a: ${t.a.x.toFixed(4)}, ${t.a.y.toFixed(4)}, ${t.a.z.toFixed(4)}; b: ${t.b.x.toFixed(4)}, ${t.b.y.toFixed(4)}, ${t.b.z.toFixed(4)}; c: ${t.c.x.toFixed(4)}, ${t.c.y.toFixed(4)}, ${t.c.z.toFixed(4)})`;
}