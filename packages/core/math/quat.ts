import type { Vec3, Quat, Mat4, Euler } from '../types';
import { vec3, copy as vcopy, normalize as vnormalize, cross as vcross, dot as vdot, set as vset } from './vec3';

export function quat(x = 0, y = 0, z = 0, w = 1): Quat {
  return { x, y, z, w };
}

export function set(q: Quat, x: number, y: number, z: number, w: number): Quat {
  q.x = x; q.y = y; q.z = z; q.w = w;
  return q;
}

export function copy(out: Quat, q: Quat): Quat {
  out.x = q.x; out.y = q.y; out.z = q.z; out.w = q.w;
  return out;
}

export function clone(q: Quat): Quat {
  return { x: q.x, y: q.y, z: q.z, w: q.w };
}

export function identity(q: Quat): Quat {
  q.x = 0; q.y = 0; q.z = 0; q.w = 1;
  return q;
}

export function add(out: Quat, a: Quat, b: Quat): Quat {
  out.x = a.x + b.x; out.y = a.y + b.y; out.z = a.z + b.z; out.w = a.w + b.w;
  return out;
}

export function mul(out: Quat, a: Quat, b: Quat): Quat {
  const ax = a.x, ay = a.y, az = a.z, aw = a.w;
  const bx = b.x, by = b.y, bz = b.z, bw = b.w;
  out.x = ax * bw + aw * bx + ay * bz - az * by;
  out.y = ay * bw + aw * by + az * bx - ax * bz;
  out.z = az * bw + aw * bz + ax * by - ay * bx;
  out.w = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}

export function scale(out: Quat, q: Quat, s: number): Quat {
  out.x = q.x * s; out.y = q.y * s; out.z = q.z * s; out.w = q.w * s;
  return out;
}

export function dot(a: Quat, b: Quat): number {
  return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
}

export function len(q: Quat): number {
  return Math.hypot(q.x, q.y, q.z, q.w);
}

export function lenSq(q: Quat): number {
  return q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w;
}

export function normalize(out: Quat, q: Quat): Quat {
  const l = len(q);
  if (l > 0) {
    out.x = q.x / l; out.y = q.y / l; out.z = q.z / l; out.w = q.w / l;
  }
  return out;
}

export function conjugate(out: Quat, q: Quat): Quat {
  out.x = -q.x; out.y = -q.y; out.z = -q.z; out.w = q.w;
  return out;
}

export function invert(out: Quat, q: Quat): Quat {
  const l2 = lenSq(q);
  if (l2 > 0) {
    const inv = 1 / l2;
    out.x = -q.x * inv; out.y = -q.y * inv; out.z = -q.z * inv; out.w = q.w * inv;
  }
  return out;
}

export function rotateX(out: Quat, q: Quat, rad: number): Quat {
  rad *= 0.5;
  const ax = q.x, ay = q.y, az = q.z, aw = q.w;
  const bx = Math.sin(rad), bw = Math.cos(rad);
  out.x = ax * bw + aw * bx;
  out.y = ay * bw + az * bx;
  out.z = az * bw - ay * bx;
  out.w = aw * bw - ax * bx;
  return out;
}

export function rotateY(out: Quat, q: Quat, rad: number): Quat {
  rad *= 0.5;
  const ax = q.x, ay = q.y, az = q.z, aw = q.w;
  const by = Math.sin(rad), bw = Math.cos(rad);
  out.x = ax * bw - az * by;
  out.y = ay * bw + aw * by;
  out.z = az * bw + ax * by;
  out.w = aw * bw - ay * by;
  return out;
}

export function rotateZ(out: Quat, q: Quat, rad: number): Quat {
  rad *= 0.5;
  const ax = q.x, ay = q.y, az = q.z, aw = q.w;
  const bz = Math.sin(rad), bw = Math.cos(rad);
  out.x = ax * bw + ay * bz;
  out.y = ay * bw - ax * bz;
  out.z = az * bw + aw * bz;
  out.w = aw * bw - az * bz;
  return out;
}

export function fromEuler(out: Quat, euler: Euler, order = 'YXZ'): Quat {
  const c1 = Math.cos(euler.x * 0.5);
  const c2 = Math.cos(euler.y * 0.5);
  const c3 = Math.cos(euler.z * 0.5);
  const s1 = Math.sin(euler.x * 0.5);
  const s2 = Math.sin(euler.y * 0.5);
  const s3 = Math.sin(euler.z * 0.5);

  switch (order) {
    case 'XYZ':
      out.x = s1 * c2 * c3 + c1 * s2 * s3;
      out.y = c1 * s2 * c3 - s1 * c2 * s3;
      out.z = c1 * c2 * s3 + s1 * s2 * c3;
      out.w = c1 * c2 * c3 - s1 * s2 * s3;
      break;
    case 'YXZ':
      out.x = s1 * c2 * c3 + c1 * s2 * s3;
      out.y = c1 * s2 * c3 - s1 * c2 * s3;
      out.z = c1 * c2 * s3 - s1 * s2 * c3;
      out.w = c1 * c2 * c3 + s1 * s2 * s3;
      break;
    case 'ZXY':
      out.x = s1 * c2 * c3 - c1 * s2 * s3;
      out.y = c1 * s2 * c3 + s1 * c2 * s3;
      out.z = c1 * c2 * s3 + s1 * s2 * c3;
      out.w = c1 * c2 * c3 - s1 * s2 * s3;
      break;
    case 'ZYX':
      out.x = s1 * c2 * c3 - c1 * s2 * s3;
      out.y = c1 * s2 * c3 + s1 * c2 * s3;
      out.z = c1 * c2 * s3 - s1 * s2 * c3;
      out.w = c1 * c2 * c3 + s1 * s2 * s3;
      break;
    case 'YZX':
      out.x = s1 * c2 * c3 + c1 * s2 * s3;
      out.y = c1 * s2 * c3 + s1 * c2 * s3;
      out.z = c1 * c2 * s3 - s1 * s2 * c3;
      out.w = c1 * c2 * c3 - s1 * s2 * s3;
      break;
    case 'XZY':
      out.x = s1 * c2 * c3 - c1 * s2 * s3;
      out.y = c1 * s2 * c3 - s1 * c2 * s3;
      out.z = c1 * c2 * s3 + s1 * s2 * c3;
      out.w = c1 * c2 * c3 + s1 * s2 * s3;
      break;
    default:
      out.x = s1 * c2 * c3 + c1 * s2 * s3;
      out.y = c1 * s2 * c3 - s1 * c2 * s3;
      out.z = c1 * c2 * s3 - s1 * s2 * c3;
      out.w = c1 * c2 * c3 + s1 * s2 * s3;
  }
  return out;
}

export function toEuler(out: Euler, q: Quat, order = 'YXZ'): Euler {
  const x = q.x, y = q.y, z = q.z, w = q.w;
  const test = x * y + z * w;

  if (test > 0.499) {
    out.y = 2 * Math.atan2(x, w);
    out.x = Math.PI / 2;
    out.z = 0;
  } else if (test < -0.499) {
    out.y = -2 * Math.atan2(x, w);
    out.x = -Math.PI / 2;
    out.z = 0;
  } else {
    const sqx = x * x, sqy = y * y, sqz = z * z;
    switch (order) {
      case 'XYZ':
        out.x = Math.atan2(2 * (w * x - y * z), 1 - 2 * (sqx + sqy));
        out.y = Math.asin(Math.max(-1, Math.min(1, 2 * test)));
        out.z = Math.atan2(2 * (w * z - x * y), 1 - 2 * (sqy + sqz));
        break;
      case 'YXZ':
        out.x = Math.asin(Math.max(-1, Math.min(1, 2 * test)));
        out.y = Math.atan2(2 * (w * y - x * z), 1 - 2 * (sqx + sqy));
        out.z = Math.atan2(2 * (w * z - x * y), 1 - 2 * (sqx + sqz));
        break;
      case 'ZXY':
        out.x = Math.asin(Math.max(-1, Math.min(1, 2 * (w * x - y * z))));
        out.y = Math.atan2(2 * (w * y + x * z), 1 - 2 * (sqx + sqy));
        out.z = Math.atan2(2 * (w * z + x * y), 1 - 2 * (sqx + sqz));
        break;
      case 'ZYX':
        out.x = Math.atan2(2 * (w * x + y * z), 1 - 2 * (sqx + sqy));
        out.y = Math.asin(Math.max(-1, Math.min(1, 2 * test)));
        out.z = Math.atan2(2 * (w * z + x * y), 1 - 2 * (sqx + sqz));
        break;
      case 'YZX':
        out.x = Math.atan2(2 * (w * x + y * z), 1 - 2 * (sqx + sqz));
        out.y = Math.atan2(2 * (w * y + x * z), 1 - 2 * (sqx + sqy));
        out.z = Math.asin(Math.max(-1, Math.min(1, 2 * (w * z - x * y))));
        break;
      case 'XZY':
        out.x = Math.atan2(2 * (w * x + y * z), 1 - 2 * (sqx + sqz));
        out.y = Math.asin(Math.max(-1, Math.min(1, 2 * (w * y - x * z))));
        out.z = Math.atan2(2 * (w * z + x * y), 1 - 2 * (sqx + sqy));
        break;
      default:
        out.x = Math.asin(Math.max(-1, Math.min(1, 2 * test)));
        out.y = Math.atan2(2 * (w * y - x * z), 1 - 2 * (sqx + sqy));
        out.z = Math.atan2(2 * (w * z - x * y), 1 - 2 * (sqx + sqz));
    }
  }
  out.order = order;
  return out;
}

export function fromAxisAngle(out: Quat, axis: Vec3, rad: number): Quat {
  rad *= 0.5;
  const s = Math.sin(rad);
  const n = vnormalize(vcopy({ x: 0, y: 0, z: 0 }, axis));
  out.x = n.x * s;
  out.y = n.y * s;
  out.z = n.z * s;
  out.w = Math.cos(rad);
  return out;
}

export function toAxisAngle(out: Vec3, q: Quat): { axis: Vec3; angle: number } {
  const l = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z);
  if (l > 1e-6) {
    out.x = q.x / l;
    out.y = q.y / l;
    out.z = q.z / l;
  } else {
    out.x = 1; out.y = 0; out.z = 0;
  }
  return { axis: out, angle: 2 * Math.acos(Math.max(-1, Math.min(1, q.w))) };
}

export function slerp(out: Quat, a: Quat, b: Quat, t: number): Quat {
  let cosTheta = dot(a, b);
  let ax = a.x, ay = a.y, az = a.z, aw = a.w;
  if (cosTheta < 0) {
    cosTheta = -cosTheta;
    ax = -ax; ay = -ay; az = -az; aw = -aw;
  }
  if (cosTheta >= 1 - 1e-6) {
    return lerp(out, a, b, t);
  }
  const theta = Math.acos(cosTheta);
  const sinTheta = Math.sin(theta);
  const t1 = Math.sin((1 - t) * theta) / sinTheta;
  const t2 = Math.sin(t * theta) / sinTheta;
  out.x = ax * t1 + b.x * t2;
  out.y = ay * t1 + b.y * t2;
  out.z = az * t1 + b.z * t2;
  out.w = aw * t1 + b.w * t2;
  return out;
}

export function lerp(out: Quat, a: Quat, b: Quat, t: number): Quat {
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
  out.z = a.z + (b.z - a.z) * t;
  out.w = a.w + (b.w - a.w) * t;
  return normalize(out, out);
}

export function rotateTowards(out: Quat, a: Quat, b: Quat, maxAngle: number): Quat {
  const cosTheta = dot(a, b);
  if (cosTheta >= 1 - 1e-6) return copy(out, a);
  const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
  if (theta <= maxAngle) return copy(out, b);
  return slerp(out, a, b, maxAngle / theta);
}

export function fromMat4(out: Quat, m: Mat4): Quat {
  const e = m.elements;
  const trace = e[0] + e[5] + e[10];
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    out.w = 0.25 * s;
    out.x = (e[6] - e[9]) / s;
    out.y = (e[8] - e[2]) / s;
    out.z = (e[1] - e[4]) / s;
  } else if (e[0] > e[5] && e[0] > e[10]) {
    const s = Math.sqrt(1 + e[0] - e[5] - e[10]) * 2;
    out.w = (e[6] - e[9]) / s;
    out.x = 0.25 * s;
    out.y = (e[1] + e[4]) / s;
    out.z = (e[8] + e[2]) / s;
  } else if (e[5] > e[10]) {
    const s = Math.sqrt(1 + e[5] - e[0] - e[10]) * 2;
    out.w = (e[8] - e[2]) / s;
    out.x = (e[1] + e[4]) / s;
    out.y = 0.25 * s;
    out.z = (e[6] + e[9]) / s;
  } else {
    const s = Math.sqrt(1 + e[10] - e[0] - e[5]) * 2;
    out.w = (e[1] - e[4]) / s;
    out.x = (e[8] + e[2]) / s;
    out.y = (e[6] + e[9]) / s;
    out.z = 0.25 * s;
  }
  return out;
}

export function fromRotationMatrix(out: Quat, m: Mat4): Quat {
  return fromMat4(out, m);
}

export function equals(a: Quat, b: Quat, epsilon = 1e-6): boolean {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon &&
         Math.abs(a.z - b.z) < epsilon && Math.abs(a.w - b.w) < epsilon;
}

export function exactEquals(a: Quat, b: Quat): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w;
}

export function fromArray(out: Quat, arr: ArrayLike<number>, offset = 0): Quat {
  out.x = arr[offset]; out.y = arr[offset + 1]; out.z = arr[offset + 2]; out.w = arr[offset + 3];
  return out;
}

export function toArray(q: Quat, out: number[] = [], offset = 0): number[] {
  out[offset] = q.x; out[offset + 1] = q.y; out[offset + 2] = q.z; out[offset + 3] = q.w;
  return out;
}

export function str(q: Quat): string {
  return `quat(${q.x.toFixed(4)}, ${q.y.toFixed(4)}, ${q.z.toFixed(4)}, ${q.w.toFixed(4)})`;
}

export const IDENTITY = Object.freeze(quat(0, 0, 0, 1));