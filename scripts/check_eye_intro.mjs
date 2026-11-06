import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Inspect actual glyph draw commands without requiring WebGL or a browser.
// The former rectangular skin field fails the silhouette bounds below.
const source = readFileSync(
  new URL("../src/lib/ascii-eye.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

for (const width of [375, 1280]) {
  let marks = [];
  const ink = {
    fillStyle: "",
    globalAlpha: 1,
    fillRect() {
      marks = [];
    },
    fillText(char, x, y) {
      marks.push({ char, x, y, color: this.fillStyle });
    },
  };
  const surface = { width: 0, height: 0, getContext: () => ink };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    window: { innerWidth: width, innerHeight: 812, devicePixelRatio: 2 },
    document: { createElement: () => surface },
  });
  const canvas = {
    remove() {},
    getContext: () => ({ setTransform() {}, fillRect() {}, drawImage() {} }),
  };
  const eye = exports.createAsciiEye(canvas);
  const center = (gaze) => {
    eye.draw(1, 1, gaze, 0);
    assert(marks.length > 200);
    for (const mark of marks) {
      assert("octagram".includes(mark.char));
      const x = (mark.x / surface.width - 0.5) * 2.7;
      const y = (mark.y / surface.height - 0.5) * 2.046;
      assert(Math.abs(x) < 1.026, "Characters extend past the eye corners");
      assert(y > -0.45 && y < 0.37, "Rectangular character field returned");
    }
    const iris = marks.filter(({ color }) => {
      const [r, g] = color.match(/\d+/g).map(Number);
      return r / g > 1.5;
    });
    assert(iris.length > 50, "Iris is missing");
    return (
      iris.reduce((sum, m) => sum + (m.x / surface.width - 0.5) * 2.7, 0) /
      iris.length
    );
  };
  const left = center(-0.23),
    middle = center(0),
    right = center(0.23);
  assert(
    left < middle - 0.15 && right > middle + 0.15,
    "Iris does not travel with gaze",
  );
  eye.draw(0, 1);
  assert(marks.length > 20, "Closed lid disappeared");
  assert(
    new Set(marks.map(({ y }) => y)).size <= 5,
    "Closed eye paints a rectangular field",
  );
  eye.dispose();
  console.log(
    `PASS ${width}px: isolated silhouette, closed lid, octagram glyphs and left/right iris travel.`,
  );
}
