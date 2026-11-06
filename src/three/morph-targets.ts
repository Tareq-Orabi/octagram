import * as THREE from "three";
import { BRAIN_PARTICLE_COUNT } from "./particle-density";

/** Area-weighted samples of the real Blender mesh, including its negative space. */
export function sampleLogoSurface(
  group: THREE.Group,
  count = BRAIN_PARTICLE_COUNT,
  scale = 1.9,
) {
  const positions: number[] = [];
  const cumulative: number[] = [];
  const rootInverse = new THREE.Matrix4();
  group.updateWorldMatrix(true, true);
  rootInverse.copy(group.matrixWorld).invert();
  const matrix = new THREE.Matrix4();
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3();
  const cross = new THREE.Vector3(),
    edge = new THREE.Vector3();
  let area = 0;
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    matrix.multiplyMatrices(rootInverse, object.matrixWorld);
    const attribute = object.geometry.getAttribute("position");
    const indices = object.geometry.getIndex();
    const length = indices ? indices.count : attribute.count;
    for (let index = 0; index + 2 < length; index += 3) {
      a.fromBufferAttribute(
        attribute,
        indices ? indices.getX(index) : index,
      ).applyMatrix4(matrix);
      b.fromBufferAttribute(
        attribute,
        indices ? indices.getX(index + 1) : index + 1,
      ).applyMatrix4(matrix);
      c.fromBufferAttribute(
        attribute,
        indices ? indices.getX(index + 2) : index + 2,
      ).applyMatrix4(matrix);
      const triangleArea =
        cross.subVectors(b, a).cross(edge.subVectors(c, a)).length() * 0.5;
      if (triangleArea < 1e-10) continue;
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      area += triangleArea;
      cumulative.push(area);
    }
  });
  const target = new Float32Array(count * 3);
  if (!area) return target;
  const fraction = (n: number) => n - Math.floor(n);
  for (let index = 0; index < count; index++) {
    const selection = fraction((index + 0.5) * 0.61803398875) * area;
    let low = 0,
      high = cumulative.length - 1;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (cumulative[mid] < selection) low = mid + 1;
      else high = mid;
    }
    const at = low * 9,
      root = Math.sqrt(fraction((index + 1) * 0.754877666));
    const u = 1 - root,
      v = fraction((index + 1) * 0.569840296) * root,
      w = 1 - u - v;
    for (let axis = 0; axis < 3; axis++)
      target[index * 3 + axis] =
        scale *
        (positions[at + axis] * u +
          positions[at + 3 + axis] * v +
          positions[at + 6 + axis] * w);
  }
  return target;
}

export function sphereTargets(count = BRAIN_PARTICLE_COUNT, radius = 3.8) {
  const points = new Float32Array(count * 3),
    angle = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < count; index++) {
    const y = 1 - (2 * (index + 0.5)) / count,
      r = Math.sqrt(1 - y * y);
    points.set(
      [
        Math.cos(index * angle) * r * radius,
        y * radius,
        Math.sin(index * angle) * r * radius,
      ],
      index * 3,
    );
  }
  return points;
}
