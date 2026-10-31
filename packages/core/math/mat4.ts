import type { Mat4, Vec3, Quat } from '../types';

export function mat4(): Mat4 {
  return { elements: new Float32Array(16) };
}

export function set(out: Mat4, ...values: number[]): Mat4 {
  out.elements.set(values);
  return out;
}

export function copy(out: Mat4, m: Mat4): Mat4 {
  out.elements.set(m.elements);
  return out;
}

export function clone(m: Mat4): Mat4 {
  return { elements: new Float32Array(m.elements) };
}

export function identity(m: Mat4): Mat4 {
  const e = m.elements;
  e[0] = 1; e[1] = 0; e[2] = 0; e[3] = 0;
  e[4] = 0; e[5] = 1; e[6] = 0; e[7] = 0;
  e[8] = 0; e[9] = 0; e[10] = 1; e[11] = 0;
  e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
  return m;
}

export function transpose(out: Mat4, m: Mat4): Mat4 {
  const a = m.elements, b = out.elements;
  b[0] = a[0]; b[1] = a[4]; b[2] = a[8]; b[3] = a[12];
  b[4] = a[1]; b[5] = a[5]; b[6] = a[9]; b[7] = a[13];
  b[8] = a[2]; b[9] = a[6]; b[10] = a[10]; b[11] = a[14];
  b[12] = a[3]; b[13] = a[7]; b[14] = a[11]; b[15] = a[15];
  return out;
}

export function invert(out: Mat4, m: Mat4): Mat4 {
  const a = m.elements, b = out.elements;
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
  b[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  b[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  b[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  b[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  b[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  b[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  b[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  b[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  b[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  b[10] = (a30 * b05 - a31 * b02 + a33 * b00) * det;
  b[11] = (a21 * b02 - a20 * b05 - a23 * b00) * det;
  b[12] = (a11 * b07 - a10 * b09 - a13 * b06) * det;
  b[13] = (a00 * b09 - a01 * b07 + a03 * b06) * det;
  b[14] = (a31 * b01 - a30 * b03 - a33 * b00) * det;
  b[15] = (a20 * b03 - a21 * b01 + a23 * b00) * det;
  return out;
}

export function mul(out: Mat4, a: Mat4, b: Mat4): Mat4 {
  const ae = a.elements, be = b.elements, te = out.elements;
  const a00 = ae[0], a01 = ae[1], a02 = ae[2], a03 = ae[3];
  const a10 = ae[4], a11 = ae[5], a12 = ae[6], a13 = ae[7];
  const a20 = ae[8], a21 = ae[9], a22 = ae[10], a23 = ae[11];
  const a30 = ae[12], a31 = ae[13], a32 = ae[14], a33 = ae[15];
  const b00 = be[0], b01 = be[1], b02 = be[2], b03 = be[3];
  const b10 = be[4], b11 = be[5], b12 = be[6], b13 = be[7];
  const b20 = be[8], b21 = be[9], b22 = be[10], b23 = be[11];
  const b30 = be[12], b31 = be[13], b32 = be[14], b33 = be[15];
  te[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
  te[1] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
  te[2] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
  te[3] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
  te[4] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
  te[5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
  te[6] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
  te[7] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
  te[8] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
  te[9] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
  te[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
  te[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
  te[12] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
  te[13] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
  te[14] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
  te[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
  return out;
}

export function mulVec3(out: Vec3, m: Mat4, v: Vec3): Vec3 {
  const e = m.elements;
  const x = v.x, y = v.y, z = v.z;
  const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
  out.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
  out.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
  out.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
  return out;
}

export function mulVec4(out: Vec4, m: Mat4, v: Vec4): Vec4 {
  const e = m.elements;
  const x = v.x, y = v.y, z = v.z, w = v.w;
  out.x = e[0] * x + e[4] * y + e[8] * z + e[12] * w;
  out.y = e[1] * x + e[5] * y + e[9] * z + e[13] * w;
  out.z = e[2] * x + e[6] * y + e[10] * z + e[14] * w;
  out.w = e[3] * x + e[7] * y + e[11] * z + e[15] * w;
  return out;
}

export function translate(out: Mat4, m: Mat4, v: Vec3): Mat4 {
  const e = m.elements, te = out.elements;
  const x = v.x, y = v.y, z = v.z;
  te[12] = e[0] * x + e[4] * y + e[8] * z + e[12];
  te[13] = e[1] * x + e[5] * y + e[9] * z + e[13];
  te[14] = e[2] * x + e[6] * y + e[10] * z + e[14];
  te[15] = e[3] * x + e[7] * y + e[11] * z + e[15];
  if (out !== m) {
    te[0] = e[0]; te[1] = e[1]; te[2] = e[2]; te[3] = e[3];
    te[4] = e[4]; te[5] = e[5]; te[6] = e[6]; te[7] = e[7];
    te[8] = e[8]; te[9] = e[9]; te[10] = e[10]; te[11] = e[11];
  }
  return out;
}

export function rotateX(out: Mat4, m: Mat4, rad: number): Mat4 {
  const e = m.elements, te = out.elements;
  const s = Math.sin(rad), c = Math.cos(rad);
  const a10 = e[4], a11 = e[5], a12 = e[6], a13 = e[7];
  const a20 = e[8], a21 = e[9], a22 = e[10], a23 = e[11];
  te[4] = c * a10 + s * a20; te[5] = c * a11 + s * a21; te[6] = c * a12 + s * a22; te[7] = c * a13 + s * a23;
  te[8] = c * a20 - s * a10; te[9] = c * a21 - s * a11; te[10] = c * a22 - s * a12; te[11] = c * a23 - s * a13;
  if (out !== m) {
    te[0] = e[0]; te[1] = e[1]; te[2] = e[2]; te[3] = e[3];
    te[12] = e[12]; te[13] = e[13]; te[14] = e[14]; te[15] = e[15];
  }
  return out;
}

export function rotateY(out: Mat4, m: Mat4, rad: number): Mat4 {
  const e = m.elements, te = out.elements;
  const s = Math.sin(rad), c = Math.cos(rad);
  const a00 = e[0], a01 = e[1], a02 = e[2], a03 = e[3];
  const a20 = e[8], a21 = e[9], a22 = e[10], a23 = e[11];
  te[0] = c * a00 - s * a20; te[1] = c * a01 - s * a21; te[2] = c * a02 - s * a22; te[3] = c * a03 - s * a23;
  te[8] = c * a20 + s * a00; te[9] = c * a21 + s * a01; te[10] = c * a22 + s * a02; te[11] = c * a23 + s * a03;
  if (out !== m) {
    te[4] = e[4]; te[5] = e[5]; te[6] = e[6]; te[7] = e[7];
    te[12] = e[12]; te[13] = e[13]; te[14] = e[14]; te[15] = e[15];
  }
  return out;
}

export function rotateZ(out: Mat4, m: Mat4, rad: number): Mat4 {
  const e = m.elements, te = out.elements;
  const s = Math.sin(rad), c = Math.cos(rad);
  const a00 = e[0], a01 = e[1], a02 = e[2], a03 = e[3];
  const a10 = e[4], a11 = e[5], a12 = e[6], a13 = e[7];
  te[0] = c * a00 + s * a10; te[1] = c * a01 + s * a11; te[2] = c * a02 + s * a12; te[3] = c * a03 + s * a13;
  te[4] = c * a10 - s * a00; te[5] = c * a11 - s * a01; te[6] = c * a12 - s * a02; te[7] = c * a13 - s * a03;
  if (out !== m) {
    te[8] = e[8]; te[9] = e[9]; te[10] = e[10]; te[11] = e[11];
    te[12] = e[12]; te[13] = e[13]; te[14] = e[14]; te[15] = e[15];
  }
  return out;
}

export function scale(out: Mat4, m: Mat4, v: Vec3): Mat4 {
  const e = m.elements, te = out.elements;
  const x = v.x, y = v.y, z = v.z;
  te[0] = e[0] * x; te[1] = e[1] * x; te[2] = e[2] * x; te[3] = e[3] * x;
  te[4] = e[4] * y; te[5] = e[5] * y; te[6] = e[6] * y; te[7] = e[7] * y;
  te[8] = e[8] * z; te[9] = e[9] * z; te[10] = e[10] * z; te[11] = e[11] * z;
  te[12] = e[12]; te[13] = e[13]; te[14] = e[14]; te[15] = e[15];
  return out;
}

export function fromTranslation(out: Mat4, v: Vec3): Mat4 {
  const e = out.elements;
  e[0] = 1; e[1] = 0; e[2] = 0; e[3] = 0;
  e[4] = 0; e[5] = 1; e[6] = 0; e[7] = 0;
  e[8] = 0; e[9] = 0; e[10] = 1; e[11] = 0;
  e[12] = v.x; e[13] = v.y; e[14] = v.z; e[15] = 1;
  return out;
}

export function fromRotation(out: Mat4, q: Quat): Mat4 {
  const x = q.x, y = q.y, z = q.z, w = q.w;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  const e = out.elements;
  e[0] = 1 - (yy + zz); e[1] = xy - wz; e[2] = xz + wy; e[3] = 0;
  e[4] = xy + wz; e[5] = 1 - (xx + zz); e[6] = yz - wx; e[7] = 0;
  e[8] = xz - wy; e[9] = yz + wx; e[10] = 1 - (xx + yy); e[11] = 0;
  e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
  return out;
}

export function fromRotationTranslation(out: Mat4, q: Quat, v: Vec3): Mat4 {
  const x = q.x, y = q.y, z = q.z, w = q.w;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  const e = out.elements;
  e[0] = 1 - (yy + zz); e[1] = xy - wz; e[2] = xz + wy; e[3] = 0;
  e[4] = xy + wz; e[5] = 1 - (xx + zz); e[6] = yz - wx; e[7] = 0;
  e[8] = xz - wy; e[9] = yz + wx; e[10] = 1 - (xx + yy); e[11] = 0;
  e[12] = v.x; e[13] = v.y; e[14] = v.z; e[15] = 1;
  return out;
}

export function fromQuat2(out: Mat4, q: Quat): Mat4 {
  return fromRotation(out, q);
}

export function fromScaling(out: Mat4, v: Vec3): Mat4 {
  const e = out.elements;
  e[0] = v.x; e[1] = 0; e[2] = 0; e[3] = 0;
  e[4] = 0; e[5] = v.y; e[6] = 0; e[7] = 0;
  e[8] = 0; e[9] = 0; e[10] = v.z; e[11] = 0;
  e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
  return out;
}

export function fromRotationTranslationScale(out: Mat4, q: Quat, v: Vec3, s: Vec3): Mat4 {
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
  e[12] = v.x; e[13] = v.y; e[14] = v.z; e[15] = 1;
  return out;
}

export function fromRotationTranslationScaleOrigin(out: Mat4, q: Quat, v: Vec3, s: Vec3, o: Vec3): Mat4 {
  const x = q.x, y = q.y, z = q.z, w = q.w;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  const sx = s.x, sy = s.y, sz = s.z;
  const ox = o.x, oy = o.y, oz = o.z;
  const e = out.elements;
  e[0] = (1 - (yy + zz)) * sx; e[1] = (xy - wz) * sx; e[2] = (xz + wy) * sx; e[3] = 0;
  e[4] = (xy + wz) * sy; e[5] = (1 - (xx + zz)) * sy; e[6] = (yz - wx) * sy; e[7] = 0;
  e[8] = (xz - wy) * sz; e[9] = (yz + wx) * sz; e[10] = (1 - (xx + yy)) * sz; e[11] = 0;
  e[12] = v.x + ox - (e[0] * ox + e[4] * oy + e[8] * oz);
  e[13] = v.y + oy - (e[1] * ox + e[5] * oy + e[9] * oz);
  e[14] = v.z + oz - (e[2] * ox + e[6] * oy + e[10] * oz);
  e[15] = 1;
  return out;
}

export function fromValues(out: Mat4, m00: number, m01: number, m02: number, m03: number,
  m10: number, m11: number, m12: number, m13: number,
  m20: number, m21: number, m22: number, m23: number,
  m30: number, m31: number, m32: number, m33: number): Mat4 {
  const e = out.elements;
  e[0] = m00; e[1] = m01; e[2] = m02; e[3] = m03;
  e[4] = m10; e[5] = m11; e[6] = m12; e[7] = m13;
  e[8] = m20; e[9] = m21; e[10] = m22; e[11] = m23;
  e[12] = m30; e[13] = m31; e[14] = m32; e[15] = m33;
  return out;
}

export function frustum(out: Mat4, left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
  const e = out.elements;
  const rl = 1 / (right - left);
  const tb = 1 / (top - bottom);
  const fn = -1 / (far - near);
  e[0] = 2 * near * rl; e[1] = 0; e[2] = 0; e[3] = 0;
  e[4] = 0; e[5] = 2 * near * tb; e[6] = 0; e[7] = 0;
  e[8] = (right + left) * rl; e[9] = (top + bottom) * tb; e[10] = (far + near) * fn; e[11] = -1;
  e[12] = 0; e[13] = 0; e[14] = 2 * far * near * fn; e[15] = 0;
  return out;
}

export function perspective(out: Mat4, fovy: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovy / 2);
  const e = out.elements;
  e[0] = f / aspect; e[1] = 0; e[2] = 0; e[3] = 0;
  e[4] = 0; e[5] = f; e[6] = 0; e[7] = 0;
  e[8] = 0; e[9] = 0; e[11] = -1;
  if (far !== Infinity) {
    const nf = 1 / (near - far);
    e[10] = (far + near) * nf; e[14] = 2 * far * near * nf; e[15] = 0;
  } else {
    e[10] = -1; e[14] = -2 * near; e[15] = 0;
  }
  return out;
}

export function ortho(out: Mat4, left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
  const e = out.elements;
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);
  e[0] = -2 * lr; e[1] = 0; e[2] = 0; e[3] = 0;
  e[4] = 0; e[5] = -2 * bt; e[6] = 0; e[7] = 0;
  e[8] = 0; e[9] = 0; e[10] = 2 * nf; e[11] = 0;
  e[12] = (left + right) * lr; e[13] = (top + bottom) * bt; e[14] = (far + near) * nf; e[15] = 1;
  return out;
}

export function lookAt(out: Mat4, eye: Vec3, center: Vec3, up: Vec3): Mat4 {
  const e = out.elements;
  let x0, x1, x2, y0, y1, y2, z0, z1, z2;
  const eyex = eye.x, eyey = eye.y, eyez = eye.z;
  const upx = up.x, upy = up.y, upz = up.z;
  const centerx = center.x, centery = center.y, centerz = center.z;
  if (Math.abs(eyex - centerx) < 1e-6 && Math.abs(eyey - centery) < 1e-6 && Math.abs(eyez - centerz) < 1e-6) {
    return identity(out);
  }
  z0 = eyex - centerx; z1 = eyey - centery; z2 = eyez - centerz;
  let len = 1 / Math.hypot(z0, z1, z2);
  z0 *= len; z1 *= len; z2 *= len;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.hypot(x0, x1, x2);
  if (!len) { x0 = 0; x1 = 0; x2 = 0; } else {
    len = 1 / len; x0 *= len; x1 *= len; x2 *= len;
  }
  y0 = z1 * x2 - z2 * x1; y1 = z2 * x0 - z0 * x2; y2 = z0 * x1 - z1 * x0;
  len = Math.hypot(y0, y1, y2);
  if (!len) { y0 = 0; y1 = 0; y2 = 0; } else {
    len = 1 / len; y0 *= len; y1 *= len; y2 *= len;
  }
  e[0] = x0; e[1] = y0; e[2] = z0; e[3] = 0;
  e[4] = x1; e[5] = y1; e[6] = z1; e[7] = 0;
  e[8] = x2; e[9] = y2; e[10] = z2; e[11] = 0;
  e[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  e[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  e[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  e[15] = 1;
  return out;
}

export function targetTo(out: Mat4, eye: Vec3, target: Vec3, up: Vec3): Mat4 {
  return lookAt(out, eye, target, up);
}

export function getTranslation(out: Vec3, m: Mat4): Vec3 {
  const e = m.elements;
  out.x = e[12]; out.y = e[13]; out.z = e[14];
  return out;
}

export function getScaling(out: Vec3, m: Mat4): Vec3 {
  const e = m.elements;
  out.x = Math.hypot(e[0], e[1], e[2]);
  out.y = Math.hypot(e[4], e[5], e[6]);
  out.z = Math.hypot(e[8], e[9], e[10]);
  return out;
}

export function getRotation(out: Quat, m: Mat4): Quat {
  const e = m.elements;
  let sx = 1 / Math.hypot(e[0], e[1], e[2]);
  let sy = 1 / Math.hypot(e[4], e[5], e[6]);
  let sz = 1 / Math.hypot(e[8], e[9], e[10]);
  const m11 = e[0] * sx, m12 = e[1] * sx, m13 = e[2] * sx;
  const m21 = e[4] * sy, m22 = e[5] * sy, m23 = e[6] * sy;
  const m31 = e[8] * sz, m32 = e[9] * sz, m33 = e[10] * sz;
  const trace = m11 + m22 + m33;
  if (trace > 0) {
    let s = Math.sqrt(trace + 1) * 2;
    out.w = 0.25 * s;
    out.x = (m32 - m23) / s;
    out.y = (m13 - m31) / s;
    out.z = (m21 - m12) / s;
  } else if (m11 > m22 && m11 > m33) {
    let s = Math.sqrt(1 + m11 - m22 - m33) * 2;
    out.w = (m32 - m23) / s;
    out.x = 0.25 * s;
    out.y = (m12 + m21) / s;
    out.z = (m13 + m31) / s;
  } else if (m22 > m33) {
    let s = Math.sqrt(1 + m22 - m11 - m33) * 2;
    out.w = (m13 - m31) / s;
    out.x = (m12 + m21) / s;
    out.y = 0.25 * s;
    out.z = (m23 + m32) / s;
  } else {
    let s = Math.sqrt(1 + m33 - m11 - m22) * 2;
    out.w = (m21 - m12) / s;
    out.x = (m13 + m31) / s;
    out.y = (m23 + m32) / s;
    out.z = 0.25 * s;
  }
  return out;
}

export function compose(out: Mat4, position: Vec3, rotation: Quat, scale: Vec3): Mat4 {
  const x = rotation.x, y = rotation.y, z = rotation.z, w = rotation.w;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  const sx = scale.x, sy = scale.y, sz = scale.z;
  const e = out.elements;
  e[0] = (1 - (yy + zz)) * sx; e[1] = (xy - wz) * sx; e[2] = (xz + wy) * sx; e[3] = 0;
  e[4] = (xy + wz) * sy; e[5] = (1 - (xx + zz)) * sy; e[6] = (yz - wx) * sy; e[7] = 0;
  e[8] = (xz - wy) * sz; e[9] = (yz + wx) * sz; e[10] = (1 - (xx + yy)) * sz; e[11] = 0;
  e[12] = position.x; e[13] = position.y; e[14] = position.z; e[15] = 1;
  return out;
}

export function decompose(m: Mat4, position: Vec3, rotation: Quat, scale: Vec3): boolean {
  const e = m.elements;
  let sx = Math.hypot(e[0], e[1], e[2]);
  let sy = Math.hypot(e[4], e[5], e[6]);
  let sz = Math.hypot(e[8], e[9], e[10]);
  const det = e[0] * (e[5] * e[10] - e[6] * e[9]) - e[1] * (e[4] * e[10] - e[6] * e[8]) + e[2] * (e[4] * e[9] - e[5] * e[8]);
  if (det < 0) sx = -sx;
  position.x = e[12]; position.y = e[13]; position.z = e[14];
  const invSX = 1 / sx, invSY = 1 / sy, invSZ = 1 / sz;
  const m11 = e[0] * invSX, m12 = e[1] * invSX, m13 = e[2] * invSX;
  const m21 = e[4] * invSY, m22 = e[5] * invSY, m23 = e[6] * invSY;
  const m31 = e[8] * invSZ, m32 = e[9] * invSZ, m33 = e[10] * invSZ;
  const trace = m11 + m22 + m33;
  if (trace > 0) {
    let s = Math.sqrt(trace + 1) * 2;
    rotation.w = 0.25 * s;
    rotation.x = (m32 - m23) / s;
    rotation.y = (m13 - m31) / s;
    rotation.z = (m21 - m12) / s;
  } else if (m11 > m22 && m11 > m33) {
    let s = Math.sqrt(1 + m11 - m22 - m33) * 2;
    rotation.w = (m32 - m23) / s;
    rotation.x = 0.25 * s;
    rotation.y = (m12 + m21) / s;
    rotation.z = (m13 + m31) / s;
  } else if (m22 > m33) {
    let s = Math.sqrt(1 + m22 - m11 - m33) * 2;
    rotation.w = (m13 - m31) / s;
    rotation.x = (m12 + m21) / s;
    rotation.y = 0.25 * s;
    rotation.z = (m23 + m32) / s;
  } else {
    let s = Math.sqrt(1 + m33 - m11 - m22) * 2;
    rotation.w = (m21 - m12) / s;
    rotation.x = (m13 + m31) / s;
    rotation.y = (m23 + m32) / s;
    rotation.z = 0.25 * s;
  }
  scale.x = sx; scale.y = sy; scale.z = sz;
  return true;
}

export function equals(a: Mat4, b: Mat4, epsilon = 1e-6): boolean {
  const ae = a.elements, be = b.elements;
  for (let i = 0; i < 16; i++) if (Math.abs(ae[i] - be[i]) > epsilon) return false;
  return true;
}

export function exactEquals(a: Mat4, b: Mat4): boolean {
  return a.elements === b.elements || a.elements.every((v, i) => v === b.elements[i]);
}

export function fromArray(out: Mat4, arr: ArrayLike<number>): Mat4 {
  out.elements.set(arr);
  return out;
}

export function toArray(m: Mat4, out: number[] = []): number[] {
  out[0] = m.elements[0]; out[1] = m.elements[1]; out[2] = m.elements[2]; out[3] = m.elements[3];
  out[4] = m.elements[4]; out[5] = m.elements[5]; out[6] = m.elements[6]; out[7] = m.elements[7];
  out[8] = m.elements[8]; out[9] = m.elements[9]; out[10] = m.elements[10]; out[11] = m.elements[11];
  out[12] = m.elements[12]; out[13] = m.elements[13]; out[14] = m.elements[14]; out[15] = m.elements[15];
  return out;
}

export function str(m: Mat4): string {
  const e = m.elements;
  return `mat4(\n  ${e[0].toFixed(4)} ${e[1].toFixed(4)} ${e[2].toFixed(4)} ${e[3].toFixed(4)}\n  ${e[4].toFixed(4)} ${e[5].toFixed(4)} ${e[6].toFixed(4)} ${e[7].toFixed(4)}\n  ${e[8].toFixed(4)} ${e[9].toFixed(4)} ${e[10].toFixed(4)} ${e[11].toFixed(4)}\n  ${e[12].toFixed(4)} ${e[13].toFixed(4)} ${e[14].toFixed(4)} ${e[15].toFixed(4)}\n)`;
}

export const IDENTITY = Object.freeze(mat4());