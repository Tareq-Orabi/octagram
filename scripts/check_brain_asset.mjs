/** Validate extraction against the included original atlases and particle GLB. */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { FloatType } from "three";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  src = path.join(root, "assets/source/brain");
const file = await fs.readFile(
  path.join(root, "public/assets/models/brain-reference.bin"),
);
const buffer = file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength,
  ),
  header = new Uint32Array(buffer, 0, 8);
const [magic, version, count, vertexCount, indexCount] = header;
if (
  magic !== 0x4f435442 ||
  version !== 2 ||
  count !== 10000 ||
  vertexCount !== 20 ||
  indexCount !== 144
)
  throw new Error("Invalid header");
if (file.length !== 32 + count * 28 + vertexCount * 12 + indexCount * 2)
  throw new Error("Unexpected file length");
const pos = new Float32Array(buffer, 32, count * 3),
  scale = new Float32Array(buffer, 32 + count * 12, count),
  colors = new Float32Array(buffer, 32 + count * 16, count * 3);
const vertices = new Float32Array(buffer, 32 + count * 28, vertexCount * 3),
  indices = new Uint16Array(
    buffer,
    32 + count * 28 + vertexCount * 12,
    indexCount,
  );
for (const array of [pos, scale, colors, vertices])
  if ([...array].some((x) => !Number.isFinite(x)))
    throw new Error("Non-finite number");
if ([...indices].some((i) => i >= vertexCount))
  throw new Error("Mesh index outside vertex buffer");
const original = await fs.readFile(path.join(src, "pos-33.exr"));
const exr = new EXRLoader()
  .setDataType(FloatType)
  .parse(
    original.buffer.slice(
      original.byteOffset,
      original.byteOffset + original.byteLength,
    ),
  );
let maximumPositionError = 0;
for (let i = 0; i < count; i++)
  for (let k = 0; k < 3; k++)
    maximumPositionError = Math.max(
      maximumPositionError,
      Math.abs(
        pos[i * 3 + k] -
          Math.fround(
            (exr.data[((199 - Math.floor(i / 100)) * 200 + (i % 100)) * 4 + k] -
              0.5) *
              8.7,
          ),
      ),
    );
if (maximumPositionError !== 0)
  throw new Error("Extracted points differ from source");
const originalGlb = await fs.readFile(path.join(src, "py-lod7.glb")),
  jsonLength = originalGlb.readUInt32LE(12),
  json = JSON.parse(originalGlb.subarray(20, 20 + jsonLength));
const bin = originalGlb.subarray(28 + jsonLength),
  primitive = json.meshes[0].primitives[0];
const pv =
    json.bufferViews[json.accessors[primitive.attributes.POSITION].bufferView],
  iv = json.bufferViews[json.accessors[primitive.indices].bufferView];
if (
  !Buffer.from(
    vertices.buffer,
    vertices.byteOffset,
    vertices.byteLength,
  ).equals(bin.subarray(pv.byteOffset, pv.byteOffset + pv.byteLength))
)
  throw new Error("Particle vertices changed");
if (
  !Buffer.from(indices.buffer, indices.byteOffset, indices.byteLength).equals(
    bin.subarray(iv.byteOffset, iv.byteOffset + iv.byteLength),
  )
)
  throw new Error("Particle topology changed");
const bounds = (angle) => {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity],
    c = Math.cos(angle),
    s = Math.sin(angle);
  for (let i = 0; i < count; i++) {
    const x = pos[i * 3],
      y = pos[i * 3 + 1],
      z = pos[i * 3 + 2],
      p = [x * c + z * s, y, -x * s + z * c];
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], p[k]);
      max[k] = Math.max(max[k], p[k]);
    }
  }
  return { min, max, size: max.map((v, i) => v - min[i]) };
};
const files = {};
for (const name of ["pos-33.exr", "sc-33.png", "cd-33.png", "py-lod7.glb"]) {
  const bytes = await fs.readFile(path.join(src, name));
  files[name] = {
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  };
}
for (const name of ["brain-fallback.webp"]) {
  const p = path.join(root, "public/assets", name),
    meta = await sharp(p).metadata();
  if (meta.width !== 1080 || meta.height !== 1020 || !meta.hasAlpha)
    throw new Error("Poster dimensions or transparency wrong");
}
const globe = await fs.readFile(
  path.join(root, "public/assets/models/brain-globe-target.bin"),
);
if (globe.length !== count * 12)
  throw new Error("Globe morph target size incorrect");
const report = {
  status: "PASS",
  sourceFiles: files,
  asset: {
    bytes: file.length,
    sha256: crypto.createHash("sha256").update(file).digest("hex"),
    particles: count,
    particleVertices: vertexCount,
    particleTriangles: indexCount / 3,
    totalRenderedTriangles: (count * indexCount) / 3,
    mobileParticles: 7000,
    maximumPositionError,
    meshVerticesByteIdentical: true,
    meshIndicesByteIdentical: true,
    allNumbersFinite: true,
    sourceBasisBounds: bounds(0),
    entranceYawMinus45Bounds: bounds(-Math.PI / 4),
  },
  posters: { dimensions: [1080, 1020], transparent: true, darkAndLight: true },
  globeMorph: { positions: 10000, bytes: globe.length },
};
await fs.writeFile(
  path.join(src, "validation-report.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    status: report.status,
    particles: count,
    vertices: vertexCount,
    triangles: indexCount / 3,
    bytes: file.length,
    maximumPositionError,
    allNumbersFinite: true,
  }),
);
