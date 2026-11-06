/** Decode the production GLB with the same Three/Meshopt stack used in the site. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const bytes = fs.readFileSync(
  path.join(project, "public/assets/models/octagram.glb"),
);
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
// Skip image decoding in Node; UVs, texture PNGs, and material assignments are
// checked below from the actual GLB, and visually in Blender/browser separately.
loader.register(() => ({
  name: "HEADLESS_TEXTURE_CHECK",
  loadTexture: async () => new THREE.Texture(),
}));
const gltf = await loader.parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  "",
);
gltf.scene.updateMatrixWorld(true);
const modules = [],
  meshes = [];
gltf.scene.traverse((o) => {
  if (o.name.startsWith("module-")) modules.push(o);
  if (o.isMesh) meshes.push(o);
});
if (modules.length !== 8 || meshes.length !== 12)
  throw new Error("Wrong module/path count");
for (const mesh of meshes) {
  for (const name of ["position", "normal", "uv"]) {
    const attribute = mesh.geometry.getAttribute(name);
    if (!attribute || !Array.from(attribute.array).every(Number.isFinite))
      throw new Error("Invalid " + name);
  }
  if (!mesh.material.map)
    throw new Error("Missing gradient texture assignment");
}
const ray = new THREE.Raycaster(
  new THREE.Vector3(0, 0, 5),
  new THREE.Vector3(0, 0, -1),
);
if (ray.intersectObjects(meshes, false).length !== 0)
  throw new Error("Central hole is filled");
const bounds = new THREE.Box3().setFromObject(gltf.scene),
  size = bounds.getSize(new THREE.Vector3());
if (Math.abs(size.x - 3.5) > 0.015 || size.z < 0.2 || size.z > 0.25)
  throw new Error("Wrong logo dimensions");
const jsonLength = bytes.readUInt32LE(12),
  document = JSON.parse(bytes.subarray(20, 20 + jsonLength));
if (document.images.length !== 12 || document.textures.length !== 12)
  throw new Error("Expected twelve precise gradient textures");
const report = {
  modules: modules.length,
  meshes: meshes.length,
  gradientTextures: document.textures.length,
  centralHoleRayHits: 0,
  bounds: size.toArray(),
  meshoptDecoded: true,
  finiteGeometry: true,
  bytes: bytes.length,
  moduleNames: modules.map((m) => m.name),
};
fs.writeFileSync(
  path.join(project, "assets/source/model-validation.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(report);
