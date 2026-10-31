import type { Vec2, Vec3, Vec4, Quat, Mat3, Mat4, Euler, Box3, Sphere, Plane, Ray, Triangle } from '../types';

export function vec2(x = 0, y = 0): Vec2 {
  return { x, y };
}

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export function vec4(x = 0, y = 0, z = 0, w = 0): Vec4 {
  return { x, y, z, w };
}

export function quat(x = 0, y = 0, z = 0, w = 1): Quat {
  return { x, y, z, w };
}

export function mat3(): Mat3 {
  return { elements: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) };
}

export function mat4(): Mat4 {
  return { elements: new Float32Array(16) };
}

export function euler(x = 0, y = 0, z = 0, order: Euler['order'] = 'YXZ'): Euler {
  return { x, y, z, order };
}

export function box3(min?: Vec3, max?: Vec3): Box3 {
  return {
    min: min ? { ...min } : { x: Infinity, y: Infinity, z: Infinity },
    max: max ? { ...max } : { x: -Infinity, y: -Infinity, z: -Infinity },
  };
}

export function sphere(center?: Vec3, radius = 0): Sphere {
  return { center: center ? { ...center } : { x: 0, y: 0, z: 0 }, radius };
}

export function plane(normal?: Vec3, constant = 0): Plane {
  return { normal: normal ? { ...normal } : { x: 0, y: 0, z: 1 }, constant };
}

export function ray(origin?: Vec3, direction?: Vec3): Ray {
  return {
    origin: origin ? { ...origin } : { x: 0, y: 0, z: 0 },
    direction: direction ? { ...direction } : { x: 0, y: 0, z: -1 },
  };
}

export function triangle(a?: Vec3, b?: Vec3, c?: Vec3): Triangle {
  return {
    a: a ? { ...a } : { x: 0, y: 0, z: 0 },
    b: b ? { ...b } : { x: 1, y: 0, z: 0 },
    c: c ? { ...c } : { x: 0, y: 1, z: 0 },
  };
}