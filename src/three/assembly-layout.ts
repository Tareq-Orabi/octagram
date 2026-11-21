const aspect = 16 / 9;
const offset = [10.3, 14.4, 21] as const;
const target = [-.36, .90, -.35] as const;
const width = 17.65;

export const assemblyView = { aspect, offset, target, width };
export const assemblyReadout = { left: -6.45, near: 2.96, top: .168, width: 4.92, depth: 2.34 };

// Project the deck's top left corner and its two axes through the orthographic camera.
// The HTML glyphs and the physical screen share this plane in both renderers.
const horizontal = Math.hypot(offset[0], offset[2]);
const sinYaw = offset[0] / horizontal;
const cosYaw = offset[2] / horizontal;
const distance = Math.hypot(horizontal, offset[1]);
const sinPitch = offset[1] / distance;
const cosPitch = horizontal / distance;
const x = assemblyReadout.left - target[0];
const y = assemblyReadout.top - target[1];
const z = assemblyReadout.near - target[2];
const a = cosYaw, b = sinYaw * sinPitch, c = -sinYaw, d = cosYaw * sinPitch;
const height = width / aspect;
const percent = (part: number) => `${part * 100}%`;

export const assemblyReadoutStyle = {
  left: percent(.5 + (a * x + c * z) / width),
  top: percent(.5 + (b * x + d * z - cosPitch * y) / height),
  width: percent(assemblyReadout.width / width),
  height: percent(assemblyReadout.depth / height),
  transform: `matrix(${a}, ${b}, ${c}, ${d}, 0, 0)`,
};
