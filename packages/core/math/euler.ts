import type { Euler } from '../types';

export function euler(x = 0, y = 0, z = 0, order: Euler['order'] = 'YXZ'): Euler {
  return { x, y, z, order };
}

export function set(e: Euler, x: number, y: number, z: number, order: Euler['order'] = 'YXZ'): Euler {
  e.x = x; e.y = y; e.z = z; e.order = order;
  return e;
}

export function copy(out: Euler, e: Euler): Euler {
  out.x = e.x; out.y = e.y; out.z = e.z; out.order = e.order;
  return out;
}

export function clone(e: Euler): Euler {
  return { x: e.x, y: e.y, z: e.z, order: e.order };
}

export function fromArray(out: Euler, arr: ArrayLike<number>): Euler {
  out.x = arr[0]; out.y = arr[1]; out.z = arr[2]; out.order = 'YXZ';
  return out;
}

export function toArray(e: Euler, out: number[] = []): number[] {
  out[0] = e.x; out[1] = e.y; out[2] = e.z;
  return out;
}

export function reorder(out: Euler, e: Euler, order: Euler['order']): Euler {
  const q = { x: 0, y: 0, z: 0, w: 1 };
  fromEuler(q, e);
  return toEuler(out, q, order);
}

export function equals(a: Euler, b: Euler, epsilon = 1e-6): boolean {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon &&
         Math.abs(a.z - b.z) < epsilon && a.order === b.order;
}

export function fromQuat(out: Euler, q: { x: number; y: number; z: number; w: number }, order: Euler['order'] = 'YXZ'): Euler {
  return toEuler(out, q, order);
}

export function toQuat(e: Euler, out: { x: number; y: number; z: number; w: number } = { x: 0, y: 0, z: 0, w: 1 }): { x: number; y: number; z: number; w: number } {
  return fromEuler(out, e);
}

function fromEuler(out: { x: number; y: number; z: number; w: number }, e: Euler): { x: number; y: number; z: number; w: number } {
  const c1 = Math.cos(e.x * 0.5);
  const c2 = Math.cos(e.y * 0.5);
  const c3 = Math.cos(e.z * 0.5);
  const s1 = Math.sin(e.x * 0.5);
  const s2 = Math.sin(e.y * 0.5);
  const s3 = Math.sin(e.z * 0.5);

  switch (e.order) {
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

function toEuler(out: Euler, q: { x: number; y: number; z: number; w: number }, order: Euler['order'] = 'YXZ'): Euler {
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

export function str(e: Euler): string {
  return `euler(${e.x.toFixed(4)}, ${e.y.toFixed(4)}, ${e.z.toFixed(4)}, '${e.order}')`;
}