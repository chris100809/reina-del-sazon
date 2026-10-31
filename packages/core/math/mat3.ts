import type { Mat3, Vec3 } from '../types';

export function mat3(): Mat3 {
  return { elements: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) };
}

export function set(out: Mat3, m11: number, m12: number, m13: number,
  m21: number, m22: number, m23: number,
  m31: number, m32: number, m33: number): Mat3 {
  const e = out.elements;
  e[0] = m11; e[1] = m12; e[2] = m13;
  e[3] = m21; e[4] = m22; e[5] = m23;
  e[6] = m31; e[7] = m32; e[8] = m33;
  return out;
}

export function copy(out: Mat3, m: Mat3): Mat3 {
  out.elements.set(m.elements);
  return out;
}

export function clone(m: Mat3): Mat3 {
  return { elements: new Float32Array(m.elements) };
}

export function identity(m: Mat3): Mat3 {
  const e = m.elements;
  e[0] = 1; e[1] = 0; e[2] = 0;
  e[3] = 0; e[4] = 1; e[5] = 0;
  e[6] = 0; e[7] = 0; e[8] = 1;
  return m;
}

export function transpose(out: Mat3, m: Mat3): Mat3 {
  const a = m.elements, b = out.elements;
  b[0] = a[0]; b[1] = a[3]; b[2] = a[6];
  b[3] = a[1]; b[4] = a[4]; b[5] = a[7];
  b[6] = a[2]; b[7] = a[5]; b[8] = a[8];
  return out;
}

export function invert(out: Mat3, m: Mat3): Mat3 {
  const a = m.elements, b = out.elements;
  const a00 = a[0], a01 = a[1], a02 = a[2];
  const a10 = a[3], a11 = a[4], a12 = a[5];
  const a20 = a[6], a21 = a[7], a22 = a[8];

  const b01 = a22 * a11 - a12 * a21;
  const b11 = -a22 * a10 + a12 * a20;
  const b21 = a21 * a10 - a11 * a20;

  let det = a00 * b01 + a01 * b11 + a02 * b21;
  if (Math.abs(det) < 1e-6) return null as any;
  det = 1 / det;

  b[0] = b01 * det;
  b[1] = (-a22 * a01 + a02 * a21) * det;
  b[2] = (a12 * a01 - a02 * a11) * det;
  b[3] = b11 * det;
  b[4] = (a22 * a00 - a02 * a20) * det;
  b[5] = (-a12 * a00 + a02 * a10) * det;
  b[6] = b21 * det;
  b[7] = (-a21 * a00 + a01 * a20) * det;
  b[8] = (a11 * a00 - a01 * a10) * det;
  return out;
}

export function mul(out: Mat3, a: Mat3, b: Mat3): Mat3 {
  const ae = a.elements, be = b.elements, te = out.elements;
  const a00 = ae[0], a01 = ae[1], a02 = ae[2];
  const a10 = ae[3], a11 = ae[4], a12 = ae[5];
  const a20 = ae[6], a21 = ae[7], a22 = ae[8];
  const b00 = be[0], b01 = be[1], b02 = be[2];
  const b10 = be[3], b11 = be[4], b12 = be[5];
  const b20 = be[6], b21 = be[7], b22 = be[8];
  te[0] = a00 * b00 + a01 * b10 + a02 * b20;
  te[1] = a00 * b01 + a01 * b11 + a02 * b21;
  te[2] = a00 * b02 + a01 * b12 + a02 * b22;
  te[3] = a10 * b00 + a11 * b10 + a12 * b20;
  te[4] = a10 * b01 + a11 * b11 + a12 * b21;
  te[5] = a10 * b02 + a11 * b12 + a12 * b22;
  te[6] = a20 * b00 + a21 * b10 + a22 * b20;
  te[7] = a20 * b01 + a21 * b11 + a22 * b21;
  te[8] = a20 * b02 + a21 * b12 + a22 * b22;
  return out;
}

export function mulVec3(out: Vec3, m: Mat3, v: Vec3): Vec3 {
  const e = m.elements;
  const x = v.x, y = v.y, z = v.z;
  out.x = e[0] * x + e[1] * y + e[2] * z;
  out.y = e[3] * x + e[4] * y + e[5] * z;
  out.z = e[6] * x + e[7] * y + e[8] * z;
  return out;
}

export function fromMat4(out: Mat3, m: Float32Array): Mat3 {
  const e = out.elements;
  e[0] = m[0]; e[1] = m[1]; e[2] = m[2];
  e[3] = m[4]; e[4] = m[5]; e[5] = m[6];
  e[6] = m[8]; e[7] = m[9]; e[8] = m[10];
  return out;
}

export function normalFromMat4(out: Mat3, m: Float32Array): Mat3 {
  const a = m, b = out.elements;
  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;

  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (Math.abs(det) < 1e-6) return null as any;
  det = 1 / det;

  b[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  b[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  b[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  b[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  b[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  b[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  b[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  b[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  b[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  return out;
}

export function fromQuat(out: Mat3, q: { x: number; y: number; z: number; w: number }): Mat3 {
  const x = q.x, y = q.y, z = q.z, w = q.w;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  const e = out.elements;
  e[0] = 1 - (yy + zz); e[1] = xy - wz; e[2] = xz + wy;
  e[3] = xy + wz; e[4] = 1 - (xx + zz); e[5] = yz - wx;
  e[6] = xz - wy; e[7] = yz + wx; e[8] = 1 - (xx + yy);
  return out;
}

export function fromRotationTranslation(out: Mat3, q: { x: number; y: number; z: number; w: number }, v: Vec3): Mat3 {
  const x = q.x, y = q.y, z = q.z, w = q.w;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  const e = out.elements;
  e[0] = 1 - (yy + zz); e[1] = xy - wz; e[2] = 0;
  e[3] = xy + wz; e[4] = 1 - (xx + zz); e[5] = 0;
  e[6] = xz - wy; e[7] = yz + wx; e[8] = 1;
  return out;
}

export function fromScaling(out: Mat3, v: Vec3): Mat3 {
  const e = out.elements;
  e[0] = v.x; e[1] = 0; e[2] = 0;
  e[3] = 0; e[4] = v.y; e[5] = 0;
  e[6] = 0; e[7] = 0; e[8] = v.z;
  return out;
}

export function rotate(out: Mat3, m: Mat3, rad: number): Mat3 {
  const s = Math.sin(rad), c = Math.cos(rad);
  const ae = m.elements, te = out.elements;
  const a00 = ae[0], a01 = ae[1], a02 = ae[2];
  const a10 = ae[3], a11 = ae[4], a12 = ae[5];
  const a20 = ae[6], a21 = ae[7], a22 = ae[8];
  te[0] = c * a00 + s * a10;
  te[1] = c * a01 + s * a11;
  te[2] = c * a02 + s * a12;
  te[3] = c * a10 - s * a00;
  te[4] = c * a11 - s * a01;
  te[5] = c * a12 - s * a02;
  te[6] = a20; te[7] = a21; te[8] = a22;
  return out;
}

export function scale(out: Mat3, m: Mat3, v: Vec3): Mat3 {
  const e = out.elements, ae = m.elements;
  e[0] = ae[0] * v.x; e[1] = ae[1] * v.x; e[2] = ae[2] * v.x;
  e[3] = ae[3] * v.y; e[4] = ae[4] * v.y; e[5] = ae[5] * v.y;
  e[6] = ae[6] * v.z; e[7] = ae[7] * v.z; e[8] = ae[8] * v.z;
  return out;
}

export function fromArray(out: Mat3, arr: ArrayLike<number>): Mat3 {
  out.elements.set(arr);
  return out;
}

export function toArray(m: Mat3, out: number[] = []): number[] {
  out[0] = m.elements[0]; out[1] = m.elements[1]; out[2] = m.elements[2];
  out[3] = m.elements[3]; out[4] = m.elements[4]; out[5] = m.elements[5];
  out[6] = m.elements[6]; out[7] = m.elements[7]; out[8] = m.elements[8];
  return out;
}

export function str(m: Mat3): string {
  const e = m.elements;
  return `mat3(\n  ${e[0].toFixed(4)} ${e[1].toFixed(4)} ${e[2].toFixed(4)}\n  ${e[3].toFixed(4)} ${e[4].toFixed(4)} ${e[5].toFixed(4)}\n  ${e[6].toFixed(4)} ${e[7].toFixed(4)} ${e[8].toFixed(4)}\n)`;
}

export const IDENTITY = Object.freeze(mat3());