/** Scroll positions are measured from the actual accessible document. */
export interface NarrativeBounds {
  home: { top: number; height: number };
  about: { top: number; height: number };
  manifesto: { top: number; height: number };
  vision: { top: number; height: number; readHeight?: number };
  jordan: { top: number; height: number };
  team: { top: number; height: number };
  contact: { top: number; height: number };
}
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const ramp = (value: number, start: number, end: number) => clamp((value - start) / Math.max(0.0001, end - start));
export function narrativeProgress(scroll: number, bounds: NarrativeBounds, height: number): number {
  const sections = [bounds.home, bounds.about, bounds.manifesto];
  if (scroll >= bounds.vision.top && scroll < bounds.team.top) {
    const viewport = Math.max(1, height);
    const passageEnd = Math.max(bounds.vision.top + 1, bounds.jordan.top - viewport * 0.35);
    const readEnd = Math.min(
      passageEnd - 1,
      bounds.vision.top + Math.max(0, (bounds.vision.readHeight ?? viewport) - viewport) + viewport * 0.32,
    );
    if (scroll <= readEnd) return 3 + 0.32 * ramp(scroll, bounds.vision.top, readEnd);
    if (scroll < passageEnd) return 3.32 + 0.68 * ramp(scroll, readEnd, passageEnd);
    return 4 + ramp(scroll, passageEnd, bounds.team.top);
  }
  for (let index = sections.length - 1; index >= 0; index--) {
    const section = sections[index];
    if (scroll >= section.top && scroll < bounds.vision.top) return index + clamp((scroll - section.top) / Math.max(1, section.height));
  }
  if (scroll < bounds.team.top) return 0;
  // The two additional Octagram content sections retain the dispersed state;
  // the final reassembly is tied to the contact section, not document length.
  const teamEnd = Math.min(bounds.team.top + bounds.team.height, bounds.contact.top - height);
  if (scroll < teamEnd) return 5 + 0.7 * ramp(scroll, bounds.team.top, teamEnd);
  return 5.7 + 0.3 * ramp(scroll, bounds.contact.top - height * 0.8, bounds.contact.top);
}
export interface ShotPose {
  x: number; y: number; z: number; scale: number; opacity: number; yaw: number; pitch: number;
}
type Shot = [number, number, number, number, number, number, number?, number?];
const ease = (value: number) => value * value * value * (value * (value * 6 - 15) + 10);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
function track(progress: number, frames: readonly Shot[]): ShotPose {
  let end = frames.findIndex(([at]) => at >= progress);
  if (end < 0) end = frames.length - 1;
  const a = frames[Math.max(0, end - 1)], b = frames[end];
  const t = ease(ramp(progress, a[0], b[0]));
  return { x: mix(a[1], b[1], t), y: mix(a[2], b[2], t), z: mix(a[3], b[3], t), scale: mix(a[4], b[4], t), opacity: mix(a[5], b[5], t), yaw: mix(a[6] ?? 0, b[6] ?? 0, t), pitch: mix(a[7] ?? 0, b[7] ?? 0, t) };
}
function curve(progress: number, frames: readonly (readonly [number, number])[]) {
  let end = frames.findIndex(([at]) => at >= progress);
  if (end < 0) end = frames.length - 1;
  const a = frames[Math.max(0, end - 1)], b = frames[end];
  return mix(a[1], b[1], ease(ramp(progress, a[0], b[0])));
}
// A readable turn, a dispersed particle field, then the second sculpture.
// The final logo pose and center passage share the same coordinate space.
const BRAIN: readonly Shot[] = [
  [0, 3.2, -1, 0, 1, 1], [0.18, 3.2, -1, 0, 1, 1],
  [1.12, -3.3, -0.7, -0.55, 0.96, 1], [1.5, -3.3, -0.7, -0.55, 0.96, 1],
  [2.15, 0, 0, 0, 1, 1], [2.98, 0, 0, 0, 1, 1],
  [3.08, 0, 0, 0, 1, 1], [3.2, 0, 0, 0, 1, 0], [6, 0, 0, 0, 1, 0],
];
const LOGO: readonly Shot[] = [
  [0, -3.4, -0.3, -8, 0.9, 0], [2.18, -3.4, -0.3, -8, 0.9, 0],
  [2.6, -3.4, -0.3, -3.5, 1.35, 0], [2.98, -3.4, -0.3, 0, 1.72, 0],
  [3.08, -3.4, -0.3, 0, 1.72, 0], [3.2, -3.4, -0.3, 0, 1.72, 1],
  [3.32, -3.4, -0.3, 0, 1.72, 1], [3.53, 0, 0, 0, 1.72, 1],
  [3.75, 0, 0, 0, 1.72, 1], [3.85, 0, 0, 0, 1.72, 0],
  [4.1, 0, 0, 0, 1.72, 0],
  [5.7, -4, 0.1, -5, 1.05, 0], [5.85, -4, 0.1, -2, 1.2, 0.12],
  [6, -4, 0.1, -0.3, 1.35, 0.28],
];
const GLOBE: readonly Shot[] = [
  [0, 0, 0, 0, 1, 0], [3.86, 0, 0, 0, 1, 0],
  [4.08, 0, 0, 0, 1, 1], [6, 0, 0, 0, 1, 1],
];
export function evaluateNarrative(progress: number, mobile = false, portrait = mobile) {
  const p = clamp(progress, 0, 6);
  const brain = track(p, BRAIN), logo = track(p, LOGO), globe = track(p, GLOBE);
  // Keep the original anatomy through the turn. Complete the rotation while
  // dispersed so the reassembled mark is upright and matches the solid asset.
  brain.yaw = curve(p, [[0, 0], [1.12, -Math.PI * 0.5], [1.85, -Math.PI], [2.98, -Math.PI * 2], [6, -Math.PI * 2]]);
  if (mobile) {
    brain.x *= 0.42; brain.y = 0.8 + brain.y * 0.35; brain.scale *= 0.6;
    if (p > 5.7) logo.opacity *= 0.65;
  }
  if (portrait) {
    logo.x = 0;
    logo.y = (1.55 + logo.y * 0.3) * (1 - ease(ramp(p, 3.32, 3.53)));
    logo.scale *= mobile ? 0.62 : 0.82;
  }
  const handoff = ease(ramp(p, 2.3, 2.98));
  for (const axis of ["x", "y", "z", "scale"] as const)
    brain[axis] = mix(brain[axis], logo[axis], handoff);
  return {
    brain, logo, globe,
    brainSpread: curve(p, [[0, 0], [1.55, 0], [2.08, 1], [2.3, 1], [2.98, 0], [6, 0]]),
    brainMorph: ease(ramp(p, 2.18, 2.98)),
    passage: ease(ramp(p, 3.4, 3.86)),
    visionOpacity: 1 - ease(ramp(p, 3.26, 3.43)),
    rootsOpacity: ease(ramp(p, 3.78, 4.0)),
    assembly: curve(p, [[0, 0], [2.18, 0], [3.08, 1], [4.1, 1], [4.2, 0.2], [5.7, 0], [6, 1]]),
    tunnel: curve(p, [[0, 0], [1.5, 0], [2.35, 0.65], [3.18, 0], [4.5, 0], [5.04, 0.6], [5.4, 0.15], [5.7, 0], [6, 0.65]]),
    ambientOpacity: curve(p, [[0, 0.55], [2.35, 0.5], [3.18, 0.4], [3.5, 0.09], [3.86, 0.07], [4.08, 0], [5.7, 0], [6, 0.35]]),
    // The camera genuinely crosses the logo's z=0 plane. The Roots globe is
    // positioned relative to the new camera depth, so there is no camera reset.
    cameraZ: curve(p, [[0, 10], [0.65, 10.45], [1.12, 10], [2.35, 10.2], [3.32, 10], [3.53, 7.8], [3.73, 2.4], [3.86, -0.8], [4.08, -4], [5.7, -4], [6, 10]]),
  };
}
/** Alternating straight rails assemble the eight original logo modules. */
export function assemblyOffset(progress: number, index: number) {
  const stagger = (index % 4) * 0.055;
  const remaining = 1 - ease(ramp(progress, stagger, 1 - (3 - (index % 4)) * 0.035));
  const angle = (index % 4) * Math.PI * 0.5;
  return { x: Math.cos(angle) * remaining * 3.4, y: Math.sin(angle) * remaining * 3.4, z: -remaining * (2.5 + (index % 3) * 0.45) };
}

/** Small radial offsets preserve the opening and reverse exactly with scroll. */
export function logoPassagePose(amount: number, index: number, x: number, y: number) {
  const t = clamp(amount), length = Math.max(0.001, Math.hypot(x, y));
  return {
    x: x / length * t * 0.09,
    y: y / length * t * 0.09,
    z: (index % 2 ? -0.17 : 0.14) * t,
    pitch: y / length * t * 0.13,
    yaw: -x / length * t * 0.13,
    roll: (index % 2 ? -1 : 1) * t * 0.025,
  };
}

/** Fit a radius-two Earth to its measured DOM window without layout reads. */
export function rootsGlobePose(
  width: number,
  height: number,
  frame: { top: number; height: number; width: number; left?: number },
  cameraZ: number,
): ShotPose {
  const viewportHeight = Math.max(1, height), distance = 10;
  const focal = viewportHeight / (2 * Math.tan(25 * Math.PI / 180));
  const bottom = frame.top + frame.height;
  // Fill the vertical window. Narrow screens deliberately crop the sides of
  // the globe instead of shrinking its hemisphere to the viewport width.
  const radius = Math.max(1, frame.height);
  // Solve the projected sphere silhouette, rather than its center point: its
  // apparent equator remains at the section edge even at a very large radius.
  const center = (viewportHeight * .5 - bottom) / focal;
  const extent = radius / focal;
  const a = 1 + center * center + extent * extent;
  const ratio = 2 * extent * extent / (a + Math.sqrt(a * a - 4 * center * center * extent * extent));
  const x = ((frame.left ?? (width - frame.width) / 2) + frame.width / 2 - width / 2) * distance * (1 - ratio) / focal;
  const y = center * distance * (1 - ratio);
  return {
    x,
    y,
    z: cameraZ - distance,
    scale: distance * Math.sqrt(ratio) * 0.5,
    opacity: 1,
    yaw: -Math.atan2(x, distance),
    // Face the viewer from below the screen; Jordan and its connections stay
    // on the exposed hemisphere instead of disappearing under the crop.
    pitch: Math.atan2(y, Math.hypot(x, distance)),
  };
}
