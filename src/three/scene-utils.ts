import type * as Three from "three";
export type Point2 = [number, number];
export type Point3 = [number, number, number];
export type Ring = Point2[];
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function disposeGroup(group: Three.Group) {
  group.traverse((object) => {
    const item = object as Three.Mesh;
    item.geometry?.dispose();
    if (Array.isArray(item.material)) item.material.forEach((m) => m.dispose());
    else item.material?.dispose();
  });
}
export function pointInRing(lon: number, lat: number, ring: Ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > lat !== b[1] > lat &&
      lon < ((b[0] - a[0]) * (lat - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
