/** Scroll positions are measured from the actual accessible document. */
export interface NarrativeBounds {
  home: { top: number; height: number };
  about: { top: number; height: number };
  manifesto: { top: number; height: number };
  vision: { top: number; height: number };
  jordan: { top: number; height: number };
  team: { top: number; height: number };
  contact: { top: number; height: number };
}

const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
export const ramp = (value: number, start: number, end: number) =>
  clamp((value - start) / Math.max(0.0001, end - start));
export function narrativeProgress(
  scroll: number,
  bounds: NarrativeBounds,
  height: number,
): number {
  const sections = [
    bounds.home,
    bounds.about,
    bounds.manifesto,
    bounds.vision,
    bounds.jordan,
  ];
  for (let index = sections.length - 1; index >= 0; index--) {
    const section = sections[index];
    if (scroll >= section.top && scroll < bounds.team.top) {
      return (
        index + clamp((scroll - section.top) / Math.max(1, section.height))
      );
    }
  }
  if (scroll < bounds.team.top) return 0;
  // The two additional Octagram content sections retain the dispersed state;
  // the final reassembly is tied to the contact section, not document length.
  const teamEnd = Math.min(
    bounds.team.top + bounds.team.height,
    bounds.contact.top - height,
  );
  if (scroll < teamEnd) return 5 + 0.7 * ramp(scroll, bounds.team.top, teamEnd);
  return (
    5.7 +
    0.3 * ramp(scroll, bounds.contact.top - height * 0.8, bounds.contact.top)
  );
}

export interface ShotPose {
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  yaw: number;
  pitch: number;
}
type Shot = [number, number, number, number, number, number, number?, number?];
const ease = (value: number) =>
  value * value * value * (value * (value * 6 - 15) + 10);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function track(progress: number, frames: readonly Shot[]): ShotPose {
  let end = frames.findIndex(([at]) => at >= progress);
  if (end < 0) end = frames.length - 1;
  const a = frames[Math.max(0, end - 1)],
    b = frames[end];
  const t = ease(ramp(progress, a[0], b[0]));
  return {
    x: mix(a[1], b[1], t),
    y: mix(a[2], b[2], t),
    z: mix(a[3], b[3], t),
    scale: mix(a[4], b[4], t),
    opacity: mix(a[5], b[5], t),
    yaw: mix(a[6] ?? 0, b[6] ?? 0, t),
    pitch: mix(a[7] ?? 0, b[7] ?? 0, t),
  };
}
function curve(
  progress: number,
  frames: readonly (readonly [number, number])[],
) {
  let end = frames.findIndex(([at]) => at >= progress);
  if (end < 0) end = frames.length - 1;
  const a = frames[Math.max(0, end - 1)],
    b = frames[end];
  return mix(a[1], b[1], ease(ramp(progress, a[0], b[0])));
}

// Independent depth paths replace the shared sideways morph. Each shot includes
// a readable hold, then a spatial handoff; all values depend only on scroll.
const BRAIN: readonly Shot[] = [
  [0, 3.2, -1, 0, 1, 1],
  [0.18, 3.2, -1, 0, 1, 1],
  [1.12, -3.3, -0.7, -0.55, 0.96, 1],
  [1.5, -3.3, -0.7, -0.55, 0.96, 1],
  [2.15, -0.8, 0.25, -0.8, 0.82, 0.38],
  [2.45, -0.4, 0.4, -1.8, 0.78, 0.3],
  [2.98, 0, 0.6, -7, 0.6, 0],
  [6, 0, 0.6, -7, 0.6, 0],
];
const LOGO: readonly Shot[] = [
  [0, -3.4, -0.3, -8, 0.9, 0],
  [2.18, -3.4, -0.3, -8, 0.9, 0],
  [2.6, -3.4, -0.3, -3.5, 1.35, 0.18],
  [3.08, -3.4, -0.3, 0, 1.72, 1],
  [3.58, -3.4, -0.3, 0, 1.72, 1],
  [4.06, -3.8, 2.4, -6, 1.28, 0],
  [5.7, -4, 0.1, -5, 1.05, 0],
  [5.85, -4, 0.1, -2, 1.2, 0.12],
  [6, -4, 0.1, -0.3, 1.35, 0.28],
];
const GLOBE: readonly Shot[] = [
  [0, 3.4, -3.8, -5.5, 1.4, 0, -0.4],
  [3.4, 3.4, -3.8, -5.5, 1.4, 0, -0.4],
  [3.72, 3.4, -2.3, -2.8, 1.6, 0.25, -0.2],
  [4.12, 3.1, -0.8, 0, 1.8, 1],
  [4.5, 3.1, -0.8, 0, 1.8, 1],
  [4.8, 3.3, 0, 0.85, 1.98, 0.5, 0.2],
  [5.04, 3.25, 0.4, 1.7, 2.15, 0, 0.4],
  [6, 3.25, 0.4, 1.7, 2.15, 0, 0.4],
];

export function evaluateNarrative(progress: number, mobile = false) {
  const p = clamp(progress, 0, 6);
  const brain = track(p, BRAIN),
    logo = track(p, LOGO),
    globe = track(p, GLOBE);
  // Restore the original leftward turn, then continue it gently through the
  // handoff. Only the parent rotates: the 20,000-particle anatomy stays intact.
  brain.yaw = curve(p, [
    [0, 0],
    [1.12, -Math.PI * 0.5],
    [2.15, -Math.PI * 0.92],
    [2.98, -Math.PI * 1.25],
    [6, -Math.PI * 1.25],
  ]);
  if (mobile) {
    brain.x *= 0.42;
    brain.y = 0.8 + brain.y * 0.35;
    brain.scale *= 0.6;
    logo.x = 0;
    logo.y = 0.9 + logo.y * 0.3;
    logo.scale *= 0.62;
    globe.x *= 0.12;
    globe.y = 0.8 + globe.y * 0.45;
    globe.scale *= 0.6;
    if (p > 5.7) logo.opacity *= 0.65;
  }
  return {
    brain,
    logo,
    globe,
    assembly: curve(p, [
      [0, 0],
      [2.18, 0],
      [3.08, 1],
      [3.58, 1],
      [4.06, 0.2],
      [5.7, 0],
      [6, 1],
    ]),
    tunnel: curve(p, [
      [0, 0],
      [1.5, 0],
      [2.35, 0.65],
      [3.18, 0],
      [4.5, 0],
      [5.04, 0.6],
      [5.4, 0.15],
      [5.7, 0],
      [6, 0.65],
    ]),
    ambientOpacity: curve(p, [
      [0, 0.55],
      [2.35, 0.5],
      [3.18, 0.4],
      [4.5, 0.45],
      [5.04, 0.5],
      [5.35, 0.2],
      [5.7, 0.2],
      [6, 0.35],
    ]),
    cameraZ: curve(p, [
      [0, 10],
      [0.65, 10.45],
      [1.12, 10],
      [2.35, 10.2],
      [3.18, 10],
      [4.5, 10],
      [5.04, 10.35],
      [6, 10],
    ]),
  };
}

/** Alternating straight rails assemble the eight original logo modules. */
export function assemblyOffset(progress: number, index: number) {
  const stagger = (index % 4) * 0.055;
  const remaining =
    1 - ease(ramp(progress, stagger, 1 - (3 - (index % 4)) * 0.035));
  const angle = (index % 4) * Math.PI * 0.5;
  return {
    x: Math.cos(angle) * remaining * 3.4,
    y: Math.sin(angle) * remaining * 3.4,
    z: -remaining * (2.5 + (index % 3) * 0.45),
  };
}
