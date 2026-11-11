/** Keep the reference data intact while adding a second, evenly distributed layer. */
export const REFERENCE_PARTICLE_COUNT = 10_000;
export const BRAIN_PARTICLE_COUNT = 20_000;
export function referenceParticleIndex(index: number) {
  return index < REFERENCE_PARTICLE_COUNT ? index : ((index - REFERENCE_PARTICLE_COUNT) * 7919 + 37) % REFERENCE_PARTICLE_COUNT;
}
export function expandReferencePositions(reference: Float32Array) {
  if (reference.length !== REFERENCE_PARTICLE_COUNT * 3) throw new Error("Unexpected reference particle count");
  const positions = new Float32Array(BRAIN_PARTICLE_COUNT * 3);
  positions.set(reference);
  // Small deterministic offsets preserve the anatomical folds and avoid
  // coincident particles. The same mapping expands the globe morph target.
  for (let index = REFERENCE_PARTICLE_COUNT; index < BRAIN_PARTICLE_COUNT; index++) {
    const source = referenceParticleIndex(index) * 3;
    for (let axis = 0; axis < 3; axis++) {
      const phase = (index + 1) * (axis + 1) * 0.61803398875;
      const offset = (phase - Math.floor(phase) - 0.5) * 0.08;
      positions[index * 3 + axis] = reference[source + axis] + offset;
    }
  }
  return positions;
}
