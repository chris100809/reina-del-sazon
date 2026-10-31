import type { Vec2, Vec3, Vec4, Quat, Mat4 } from '../types';
import { vec2, vec3, vec4, quat, mat4 } from './constructors';

export function randomVec2(out: Vec2, scale = 1): Vec2 {
  out.x = (Math.random() * 2 - 1) * scale;
  out.y = (Math.random() * 2 - 1) * scale;
  return out;
}

export function randomVec3(out: Vec3, scale = 1): Vec3 {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * scale;
  const sinPhi = Math.sin(phi);
  out.x = r * sinPhi * Math.cos(theta);
  out.y = r * sinPhi * Math.sin(theta);
  out.z = r * Math.cos(phi);
  return out;
}

export function randomVec3InSphere(out: Vec3, radius = 1): Vec3 {
  while (true) {
    out.x = (Math.random() * 2 - 1) * radius;
    out.y = (Math.random() * 2 - 1) * radius;
    out.z = (Math.random() * 2 - 1) * radius;
    if (out.x * out.x + out.y * out.y + out.z * out.z <= radius * radius) break;
  }
  return out;
}

export function randomQuat(out: Quat): Quat {
  const u1 = Math.random();
  const u2 = Math.random();
  const u3 = Math.random();
  const r1 = Math.sqrt(1 - u1);
  const r2 = Math.sqrt(u1);
  const t1 = 2 * Math.PI * u2;
  const t2 = 2 * Math.PI * u3;
  out.x = r1 * Math.sin(t1);
  out.y = r1 * Math.cos(t1);
  out.z = r2 * Math.sin(t2);
  out.w = r2 * Math.cos(t2);
  return out;
}

export function randomMat4(out: Mat4): Mat4 {
  const q = randomQuat(quat());
  const t = randomVec3(vec3(), 10);
  const s = randomVec3(vec3(), 2).x + 0.5;
  return fromRotationTranslationScale(out, q, t, { x: s, y: s, z: s });
}

function fromRotationTranslationScale(out: Mat4, q: Quat, t: Vec3, s: Vec3): Mat4 {
  const x = q.x, y = q.y, z = q.z, w = q.w;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  const sx = s.x, sy = s.y, sz = s.z;
  const e = out.elements;
  e[0] = (1 - (yy + zz)) * sx; e[1] = (xy - wz) * sx; e[2] = (xz + wy) * sx; e[3] = 0;
  e[4] = (xy + wz) * sy; e[5] = (1 - (xx + zz)) * sy; e[6] = (yz - wx) * sy; e[7] = 0;
  e[8] = (xz - wy) * sz; e[9] = (yz + wx) * sz; e[10] = (1 - (xx + yy)) * sz; e[11] = 0;
  e[12] = t.x; e[13] = t.y; e[14] = t.z; e[15] = 1;
  return out;
}