/** Lossless EXT_meshopt_compression for the Blender-exported Octagram GLB.
 * Run after build_blender_assets.py: node scripts/compress_gltf.mjs
 * Every decoded compressed buffer is compared byte-for-byte with the original.
 * The uncompressed Blender export is retained with the native source project.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const file = path.join(project, "public/assets/models/octagram.glb");
const source = path.join(project, "assets/source/octagram-uncompressed.glb");
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const raw = fs.readFileSync(file),
  jsonLength = raw.readUInt32LE(12),
  document = JSON.parse(raw.subarray(20, 20 + jsonLength).toString());
if (document.extensionsUsed?.includes("EXT_meshopt_compression"))
  throw new Error("Rebuild the uncompressed Blender GLB before compressing.");
fs.copyFileSync(file, source);
const input = raw.subarray(28 + jsonLength),
  parts = [];
let offset = 0,
  fallbackBytes = 0,
  compressedViews = 0,
  verifiedViews = 0;
const append = (bytes) => {
  const padding = (4 - (offset % 4)) % 4;
  if (padding) {
    parts.push(Buffer.alloc(padding));
    offset += padding;
  }
  const start = offset;
  parts.push(Buffer.from(bytes));
  offset += bytes.byteLength;
  return start;
};
const componentBytes = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const components = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};
const indices = new Set(
  document.meshes
    .flatMap((m) => m.primitives.map((p) => p.indices))
    .filter((i) => i !== undefined),
);
for (let i = 0; i < document.bufferViews.length; i++) {
  const view = document.bufferViews[i],
    bytes = input.subarray(
      view.byteOffset || 0,
      (view.byteOffset || 0) + view.byteLength,
    );
  const matching = document.accessors
    .map((a, index) => ({ a, index }))
    .filter(({ a }) => a.bufferView === i);
  const entry = matching[0];
  let encoded, stride, count, mode;
  if (entry) {
    stride =
      view.byteStride ||
      componentBytes[entry.a.componentType] * components[entry.a.type];
    count = view.byteLength / stride;
    mode = indices.has(entry.index) ? "INDICES" : "ATTRIBUTES";
    if (
      Number.isInteger(count) &&
      ((mode === "ATTRIBUTES" && stride % 4 === 0 && stride <= 256) ||
        (mode === "INDICES" && [2, 4].includes(stride)))
    ) {
      encoded = MeshoptEncoder.encodeGltfBuffer(bytes, count, stride, mode);
      const decoded = new Uint8Array(bytes.length);
      MeshoptDecoder.decodeGltfBuffer(
        decoded,
        count,
        stride,
        encoded,
        mode,
        "NONE",
      );
      if (!Buffer.from(decoded).equals(bytes))
        throw new Error(`Lossless verification failed for bufferView ${i}`);
      verifiedViews++;
    }
  }
  if (encoded && encoded.length < bytes.length) {
    const position = append(encoded);
    fallbackBytes = (fallbackBytes + 3) & ~3;
    view.buffer = 1;
    view.byteOffset = fallbackBytes;
    fallbackBytes += view.byteLength;
    view.extensions = {
      ...view.extensions,
      EXT_meshopt_compression: {
        buffer: 0,
        byteOffset: position,
        byteLength: encoded.length,
        byteStride: stride,
        count,
        mode,
        filter: "NONE",
      },
    };
    compressedViews++;
  } else {
    view.buffer = 0;
    view.byteOffset = append(bytes);
  }
}
document.buffers = [
  { byteLength: offset },
  {
    byteLength: fallbackBytes,
    extensions: { EXT_meshopt_compression: { fallback: true } },
  },
];
document.extensionsUsed = [
  ...(document.extensionsUsed || []),
  "EXT_meshopt_compression",
];
document.extensionsRequired = [
  ...(document.extensionsRequired || []),
  "EXT_meshopt_compression",
];
document.asset.extras = {
  ...document.asset.extras,
  compression:
    "Lossless Meshopt; all decoded attributes and indices byte-verified",
};
const binary = Buffer.concat(parts);
let json = Buffer.from(JSON.stringify(document));
json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 32)]);
const bin = Buffer.concat([
    binary,
    Buffer.alloc((4 - (binary.length % 4)) % 4),
  ]),
  total = 12 + 8 + json.length + 8 + bin.length;
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(total, 8);
header.writeUInt32LE(json.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(bin.length, 0);
binHeader.writeUInt32LE(0x004e4942, 4);
fs.writeFileSync(file, Buffer.concat([header, json, binHeader, bin]));
const report = {
  format: "glTF 2.0 binary",
  extension: "EXT_meshopt_compression",
  originalBytes: raw.length,
  compressedBytes: total,
  compressedViews,
  verifiedViews,
  lossless: true,
};
fs.writeFileSync(
  path.join(project, "assets/source/compression-report.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(report);
