import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as THREE from "three";

// Exercise the real geometry and morph buffers without needing a GPU.
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const exports = {};
  const code = ts.transpileModule(
    readFileSync(new URL(`../src/three/${name}.ts`, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText;
  vm.runInNewContext(code, {
    exports,
    require: (specifier) =>
      specifier === "three" ? THREE : load(specifier.replace("./", "")),
    fetch: async (url) => {
      const bytes = readFileSync(new URL(`../public${url}`, import.meta.url));
      return {
        ok: true,
        arrayBuffer: async () =>
          bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength,
          ),
      };
    },
  });
  cache.set(name, exports);
  return exports;
}

const { createBrain, loadReferenceGlobePositions } = load("organic-scenes");
const { sphereTargets, sampleLogoSurface } = load("morph-targets");
const { evaluateNarrative, assemblyOffset, rootsGlobePose } = load("choreography");
const brain = createBrain(THREE);
await brain.ready;
const mesh = brain.group.children[0];
assert.equal(mesh.geometry.instanceCount, 20_000);
for (const attribute of ["aCenter", "aColor", "aRandom", "aScale"]) {
  const data = mesh.geometry.getAttribute(attribute);
  assert.equal(data.count, 20_000, attribute);
  assert([...data.array].every(Number.isFinite), attribute);
}
const positions = mesh.geometry.getAttribute("aCenter").array;
const originalPositions = positions.slice();
const unique = new Set();
for (let i = 0; i < positions.length; i += 3)
  unique.add(`${positions[i]},${positions[i + 1]},${positions[i + 2]}`);
assert(
  unique.size > 19_900,
  "The density increase must not be coincident copies",
);
const globe = await loadReferenceGlobePositions();
const group = new THREE.Group();
group.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.2)));
for (const target of [globe, sphereTargets(), sampleLogoSurface(group)]) {
  assert.equal(target.length, 60_000);
  assert([...target].every(Number.isFinite));
  brain.setMorph(target, 1);
  brain.update(1, 3, { x: 0, y: 0 }, true);
  assert(
    [...mesh.geometry.getAttribute("aCenter").array].every(Number.isFinite),
  );
}
brain.setQuality(0.1);
assert.equal(mesh.geometry.instanceCount, 14_000);
brain.setQuality(1);
assert.equal(mesh.geometry.instanceCount, 20_000);
// Rotation must leave the original local anatomy unchanged throughout scroll.
brain.setMorph(originalPositions, 0);
brain.setReveal(1);
for (let step = 0; step <= 12; step++) {
  const progress = step / 4;
  const shot = evaluateNarrative(progress).brain;
  brain.group.rotation.set(shot.pitch, shot.yaw, 0);
  brain.update(step / 60, progress, { x: 20, y: 20 }, true);
  assert.deepEqual(
    positions,
    originalPositions,
    "Scroll deformed the brain anatomy",
  );
}
let lastYaw = 0;
for (let step = 0; step <= 300; step++) {
  const yaw = evaluateNarrative(step / 100).brain.yaw;
  assert(yaw <= lastYaw + 1e-9, "Brain rotation reversed unexpectedly");
  lastYaw = yaw;
}
assert(lastYaw < -Math.PI, "Brain should show a sustained turn before exit");

const flatten = (pose) =>
  Object.values(pose).flatMap((value) =>
    typeof value === "number" ? [value] : Object.values(value),
  );
for (const mobile of [false, true]) {
  let previous = flatten(evaluateNarrative(0, mobile));
  for (let step = 0; step <= 6000; step++) {
    const progress = step / 1000;
    const pose = evaluateNarrative(progress, mobile);
    const values = flatten(pose);
    assert(values.every(Number.isFinite), `Non-finite pose at ${progress}`);
    for (let i = 0; i < values.length; i++)
      assert(Math.abs(values[i] - previous[i]) < 0.15, `Jump at ${progress}`);
    for (const model of [pose.brain, pose.logo, pose.globe]) {
      assert(model.opacity >= 0 && model.opacity <= 1);
      assert(model.scale > 0);
    }
    const earth = rootsGlobePose(mobile ? 390 : 1440, 844, { top: 80, height: 500, width: mobile ? 390 : 1440 }, pose.cameraZ);
    assert(
      pose.cameraZ - earth.z - 2.04 * earth.scale > 0.5,
      "Globe must not cross the camera near plane",
    );
    assert.equal(pose.logo.pitch, 0, "Logo is tilted");
    assert.equal(pose.logo.yaw, 0, "Logo is turned away");
    previous = values;
  }
  for (const [progress, name] of [
    [0, "brain"],
    [1.2, "brain"],
    [3.2, "logo"],
    [4.2, "globe"],
  ])
    assert.equal(
      evaluateNarrative(progress, mobile)[name].opacity,
      1,
      `${name} hold`,
    );
  const forward = Array.from({ length: 61 }, (_, i) =>
    JSON.stringify(evaluateNarrative(i / 10, mobile)),
  );
  for (let i = 60; i >= 0; i--)
    assert.equal(
      JSON.stringify(evaluateNarrative(i / 10, mobile)),
      forward[i],
      "Reverse scroll pose changed",
    );
}
for (let i = 0; i < 8; i++) {
  const home = assemblyOffset(1, i),
    separated = assemblyOffset(0, i);
  assert(
    Object.values(home).every((value) => Math.abs(value) < 1e-9),
    "Logo cannot assemble exactly",
  );
  assert(
    Math.hypot(separated.x, separated.y) > 3,
    "Logo rail separation missing",
  );
}
// The visible particle logo and the solid logo must coincide at the handoff.
for (const [mobile, portrait] of [[false, false], [true, true], [false, true]]) {
  for (const progress of [2.98, 3.08, 3.14, 3.2]) {
    const pose = evaluateNarrative(progress, mobile, portrait);
    for (const axis of ["x", "y", "z", "scale"])
      assert.equal(pose.brain[axis], pose.logo[axis], `Mismatched ${axis} at handoff`);
    assert(Math.abs(Math.sin(pose.brain.yaw)) < 1e-9);
    assert.equal(pose.brainMorph, 1);
    assert.equal(pose.brainSpread, 0);
    assert(Math.abs(pose.brain.opacity + pose.logo.opacity - 1) < 1e-9);
  }
  const opening = evaluateNarrative(0, mobile, portrait);
  assert.equal(opening.brainSpread, 0);
  assert.equal(opening.brainMorph, 0);
  const cloud = evaluateNarrative(2.2, mobile, portrait);
  assert.equal(cloud.brainSpread, 1);
  const passage = evaluateNarrative(3.8, mobile, portrait);
  assert.equal(passage.logo.x, 0);
  assert.equal(passage.logo.y, 0);
  assert(passage.cameraZ < evaluateNarrative(3.53, mobile, portrait).cameraZ);
}
// Render buffers, not only the pose function, must reverse without hysteresis.
const target = sampleLogoSurface(group, undefined, 1);
brain.setMorph(target, 0);
const snapshots = [];
for (const amount of [0, .25, .5, .75, 1]) {
  brain.setMorph(target, amount);
  brain.setSpread(Math.sin(Math.PI * amount));
  brain.update(20 + amount, 0, { x: 20, y: 20 }, false);
  snapshots.push(positions.slice());
}
for (let i = 4; i >= 0; i--) {
  brain.setMorph(target, i / 4);
  brain.setSpread(Math.sin(Math.PI * i / 4));
  brain.update(30 + i, 0, { x: 20, y: 20 }, false);
  assert.deepEqual(positions, snapshots[i], "Particle path changed on reverse scroll");
}
brain.dispose();
group.children[0].geometry.dispose();
group.children[0].material.dispose();
console.log(
  "PASS: 20,000 distinct particles, 14,000 adaptive minimum, matching finite morph targets, intact rotating brain, continuous depth paths, reversible particle morph and aligned logo passage.",
);
