/** Build the user-requested reference brain from the reference's public data.
 * Run from the project root: node scripts/build_brain_asset.mjs
 * See assets/source/brain/PROVENANCE.md for sources and rights information.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { FloatType } from "three";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "assets/source/brain");
const exr = await fs.readFile(path.join(src, "pos-33.exr"));
const decoded = new EXRLoader()
  .setDataType(FloatType)
  .parse(exr.buffer.slice(exr.byteOffset, exr.byteOffset + exr.byteLength));
const pixels = await sharp(path.join(src, "sc-33.png"))
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const colorPixels = await sharp(path.join(src, "cd-33.png"))
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const glb = await fs.readFile(path.join(src, "py-lod7.glb"));
const jsonLength = glb.readUInt32LE(12),
  json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString());
const binary = glb.subarray(28 + jsonLength);
const positionAccessor =
  json.accessors[json.meshes[0].primitives[0].attributes.POSITION];
const indexAccessor = json.accessors[json.meshes[0].primitives[0].indices];
const positionView = json.bufferViews[positionAccessor.bufferView],
  indexView = json.bufferViews[indexAccessor.bufferView];
const count = 10000,
  positions = new Float32Array(count * 3),
  scales = new Float32Array(count),
  colors = new Float32Array(count * 3),
  globe = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
  const row = Math.floor(i / 100),
    col = i % 100;
  // EXRLoader returns vertically inverted scanlines; the source EXR texture uses flipY=true.
  const p = ((199 - row) * 200 + col) * 4;
  for (let k = 0; k < 3; k++)
    positions[i * 3 + k] = (decoded.data[p + k] - 0.5) * 8.7;
  for (let k = 0; k < 3; k++) {
    colors[i * 3 + k] =
      colorPixels.data[(row * 200 + col) * colorPixels.info.channels + k] / 255;
    globe[i * 3 + k] =
      (decoded.data[((99 - row) * 200 + col) * 4 + k] - 0.5) * 8.7;
  }
  scales[i] = pixels.data[(row * 200 + col) * pixels.info.channels] / 255;
}
const header = Buffer.alloc(32);
[
  0x4f435442,
  2,
  count,
  positionAccessor.count,
  indexAccessor.count,
  0,
  0,
  0,
].forEach((n, i) => header.writeUInt32LE(n, i * 4));
const output = Buffer.concat([
  header,
  Buffer.from(positions.buffer),
  Buffer.from(scales.buffer),
  Buffer.from(colors.buffer),
  binary.subarray(
    positionView.byteOffset,
    positionView.byteOffset + positionView.byteLength,
  ),
  binary.subarray(
    indexView.byteOffset,
    indexView.byteOffset + indexView.byteLength,
  ),
]);
const dest = path.join(root, "public/assets/models/brain-reference.bin");
await fs.mkdir(path.dirname(dest), { recursive: true });
await fs.writeFile(dest, output);
await fs.writeFile(
  path.join(root, "public/assets/models/brain-globe-target.bin"),
  Buffer.from(globe.buffer),
);
const bounds = [0, 1, 2].map((k) => [
  Math.min(...positions.filter((_, i) => i % 3 === k)),
  Math.max(...positions.filter((_, i) => i % 3 === k)),
]);
console.log(
  JSON.stringify({
    file: dest,
    bytes: output.length,
    particles: count,
    vertices: positionAccessor.count,
    triangles: indexAccessor.count / 3,
    bounds,
  }),
);
