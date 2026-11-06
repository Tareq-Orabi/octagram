# Reference brain provenance

The user explicitly requested the original brain appearance from https://dala.craftedbygc.com/, with Octagram colors and the other specified brand changes. The runtime brain uses that site's publicly served brain position/scale atlas and original hollow particle geometry. It is not a newly modeled anatomical approximation.

Retrieved 2026-10-24:

- https://dala.craftedbygc.com/images/pos-33.exr — 200×200 RGBA floating-point position atlas.
- https://dala.craftedbygc.com/images/sc-33.png — particle scale atlas.
- https://dala.craftedbygc.com/images/cd-33.png — per-particle color atlas, remapped to Octagram hue families at runtime.
- https://dala.craftedbygc.com/models/py-lod7.glb — original 20-vertex, 48-triangle hollow particle mesh. The glTF metadata identifies Blender glTF I/O v1.6.16 as its generator.

No asset reuse license was included in these files or established from the reference site. Public availability is not a claim that the assets are public domain. Source attribution is preserved here; rights remain with the relevant original rightsholder. No original company copy, Dala logo, or bulb model is included in the deployed brain asset.

## Extraction

Run `node scripts/build_brain_asset.mjs` from the project directory. The Three.js EXRLoader reads the floating-point atlas. The first 100×100 quadrant is the brain's 10,000 points, with source shader conversion `(rgb - 0.5) * 8.7`. EXR rows are inverted after decoding to match the original `flipY=true` setting. PNG scale and color rows retain their order. The third quadrant supplies the spherical morph target only; the website's independently constructed geographic globe marks Jordan.

`public/assets/models/brain-reference.bin` version 2 has a 32-byte little-endian uint32 header (`OCTB`, version, particle count, mesh vertex count, mesh index count, three reserved fields), followed by float32 xyz centers, float32 scales, float32 original RGB colors, float32 mesh xyz vertices, and uint16 triangle indices. The geometry and anatomical point layout are unchanged. All final rendered color families are remapped to coral, peach, orange, lime, mint, and teal. Depth fading and local cursor motion are implemented in the new TypeScript renderer.

`brain-globe-target.bin` contains 10,000 float32 xyz spherical positions in the same world scale. The original reference website's JavaScript bundle is retained only in the working reference-analysis directory, not shipped as application code.

The simplex GLSL noise utility embedded in the renderer is by Ian McEwan / Ashima Arts and Stefan Gustavson, under the MIT license in `LICENSE-noise.txt`.
