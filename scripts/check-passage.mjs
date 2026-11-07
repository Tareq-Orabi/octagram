import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync(
  new URL("../src/three/choreography.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;
const { evaluatePassage, passageOffset } = await import(
  "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
);
let previous = 10;
for (let i = 0; i <= 1000; i++) {
  const frame = evaluatePassage(i / 1000);
  assert(Object.values(frame).every(Number.isFinite));
  assert(
    frame.cameraZ <= previous + 1e-10,
    "Camera must move continuously through the aperture",
  );
  assert(
    !(frame.logoOpacity > 0.002 && frame.globeOpacity > 0.002),
    "Logo and globe cannot share a visible shot",
  );
  previous = frame.cameraZ;
}
assert.equal(evaluatePassage(0).cameraZ, 10);
assert(Math.abs(evaluatePassage(1).cameraZ + 3.2) < 1e-10);
assert.equal(evaluatePassage(0).globeOpacity, 0);
assert.equal(evaluatePassage(1).logoOpacity, 0);
const forward = Array.from({ length: 101 }, (_, i) => evaluatePassage(i / 100));
assert.deepEqual(
  Array.from({ length: 101 }, (_, i) =>
    evaluatePassage((100 - i) / 100),
  ).reverse(),
  forward,
);
for (let i = 0; i < 8; i++) {
  const angle = (i * Math.PI) / 4;
  const x = Math.cos(angle),
    y = Math.sin(angle);
  const d = passageOffset(0.14, x, y);
  assert(
    d.x * x + d.y * y >= 0,
    "Modules must move away from the original opening",
  );
  assert(
    Math.abs(d.pitch) <= 0.14 &&
      Math.abs(d.yaw) <= 0.14 &&
      Math.abs(d.z) <= 0.1681,
  );
}
console.log(
  "PASS: continuous reversible camera travel, separate logo/Earth shots, bounded radial module motion.",
);
