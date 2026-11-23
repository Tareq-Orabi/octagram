import { heroPalettes } from "@/lib/hero-palettes";
import { framedNarrative, sceneProgress, ramp, type NarrativeBounds, type SceneViewport, type ShotPose } from "./choreography";
import type { PassageFrame } from "@/lib/chapter-playback";
import { compactBrainSample } from "./compact-brain-sample";

export type CompactBrainLayout = SceneViewport & {
  bounds: NarrativeBounds;
};

const originals = [0xec746c, 0xf38e57, 0xfab754, 0xf2e77b, 0xa3d4b3, 0x5ab5b1, 0xc4ded1, 0xf4c6a2];
const stride = 7;
const pixelBudget = 174_000;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const fraction = (value: number) => value - Math.floor(value);
function smooth(value: number, from: number, to: number) {
  const t = ramp(value, from, to);
  return t * t * (3 - 2 * t);
}

export function compactBrainPose(
  layout: CompactBrainLayout, scroll: number, actualScroll: number, playback?: PassageFrame,
) {
  const { width, height, bounds } = layout;
  const progress = sceneProgress(actualScroll, scroll, bounds, height, playback);
  const scene = framedNarrative(progress, actualScroll, layout, scroll);
  const focal = height / (2 * Math.tan(25 * Math.PI / 180));
  const project = (pose: ShotPose) => {
    const ratio = focal / Math.max(2, scene.cameraZ - pose.z);
    return { x: width / 2 + pose.x * ratio, y: height / 2 - pose.y * ratio, scale: pose.scale * ratio };
  };
  const brain = project(scene.brain), logo = project(scene.logo);
  return {
    ...brain, progress,
    logoX: logo.x, logoY: logo.y, logoSize: logo.scale * 3.7,
    logoOpacity: scene.logo.opacity * (playback?.visionReveal ?? 1),
    passage: scene.passage,
    ambientOpacity: scene.ambientOpacity * (1 - scene.framing * .5),
    yaw: scene.brain.yaw, pitch: scene.brain.pitch,
    morph: scene.brainMorph, spread: scene.brainSpread,
    brainOpacity: scene.brain.opacity,
  };
}

function rgb(hex: number) {
  return [hex >> 16 & 255, hex >> 8 & 255, hex & 255];
}

const tones = heroPalettes.map(({ tint }) => {
  const steps = tint?.map(hex => rgb(Number.parseInt(hex.slice(1), 16)));
  return Float32Array.from(originals.flatMap((hex, index) => [0, 1].flatMap(bright => {
    const base = rgb(hex);
    if (!steps) return base.map(channel => bright ? mix(channel, 255, .24) : channel * .73);
    const weight = (index % 4) * .15 + (bright ? .48 : .22);
    return steps[bright].map((channel, axis) => mix(channel, steps[bright + 1][axis], weight));
  })));
});

function groupParticles() {
  const records = atob(compactBrainSample);
  const buckets: number[][] = Array.from({ length: originals.length * 2 }, () => []);
  for (let at = 0; at < records.length; at += stride) {
    const size = records.charCodeAt(at + 4);
    const group = records.charCodeAt(at + 3) * 2 + (size >> 7);
    const point = (axis: number) => (records.charCodeAt(at + axis) / 255 - .5) * 8.7;
    const x = point(0), y = point(1), z = point(2);
    const phase = x * .9 + y * 1.2 + z * .72;
    buckets[group].push(x, y, z, (size & 127) / 127, Math.sin(phase), Math.cos(phase),
      records.charCodeAt(at + 5) / 255 - .5, records.charCodeAt(at + 6) / 255 - .5);
  }
  return buckets.map(points => Float32Array.from(points));
}

const particles = groupParticles();

const fragments = Array.from({ length: 16 }, (_, group) =>
  Array.from({ length: 7 }, (_, offset) => {
    const index = group * 7 + offset + .5;
    return {
      x: fraction(index * .754877666), y: fraction(index * .569840296),
      depth: fraction(index * .438579 + .31),
      phase: index * Math.PI * (3 - Math.sqrt(5)), shape: (group + offset) % 4,
    };
  }),
);

function addFragment(context: CanvasRenderingContext2D, x: number, y: number, radius: number, angle: number, shape: number) {
  const dx = Math.cos(angle) * radius, dy = Math.sin(angle) * radius;
  const skew = shape === 3 ? .57 : .83;
  context.moveTo(x - dx + dy * skew, y - dy - dx * skew);
  context.lineTo(x + dx + dy * skew, y + dy - dx * skew);
  if (shape !== 2) context.lineTo(x + dx - dy * skew, y + dy + dx * skew);
  context.lineTo(x - dx - dy * skew, y - dy + dx * skew);
  context.closePath();
}

export function createCompactBrain(canvas: HTMLCanvasElement, palette: string) {
  const surface = canvas.getContext("2d");
  if (!surface) return null;
  const context = surface;
  const initial = Math.max(0, heroPalettes.findIndex(item => item.id === palette));
  const current = tones[initial].slice();
  const colors = new Array<string>(particles.length);
  const previous = new Int32Array(particles.length).fill(-1);
  let destination = tones[initial];
  let width = 1, height = 1;

  function colorFrame(dt: number, morph: number) {
    const easing = 1 - Math.exp(-dt * 7.5);
    for (let group = 0; group < colors.length; group++) {
      let hex = 0;
      for (let channel = group * 3; channel < group * 3 + 3; channel++) {
        const difference = destination[channel] - current[channel];
        current[channel] += Math.abs(difference) < .6 ? difference : difference * easing;
        hex = (hex << 8) | Math.round(mix(current[channel], tones[0][channel], morph));
      }
      if (hex !== previous[group]) {
        colors[group] = "#" + hex.toString(16).padStart(6, "0");
        previous[group] = hex;
      }
    }
  }

  function drawFragments(pose: ReturnType<typeof compactBrainPose>, seconds: number, scroll: number, reveal: number, lightweight: boolean) {
    const halo = smooth(pose.morph, .12, 1);
    const spread = Math.min(width, height) * .48;
    context.lineWidth = .92;
    for (let group = 0; group < fragments.length; group++) {
      context.strokeStyle = context.fillStyle = colors[group];
      const solid = group % 3 === 0;
      context.globalAlpha = pose.ambientOpacity * reveal * (solid ? .66 : 1);
      context.beginPath();
      const pieces = fragments[group];
      for (let index = 0; index < (lightweight ? 5 : pieces.length); index++) {
        const unit = pieces[index];
        const phase = unit.phase + seconds * (.21 + .23 * unit.depth);
        const drift = Math.sin(phase) * (.012 + .026 * unit.depth);
        const level = fraction(unit.y - scroll * (.00011 + .00022 * unit.depth));
        const ring = unit.phase + seconds * .15 + scroll * .0011;
        const x = mix((unit.x * 1.14 - .07 + drift) * width,
          pose.logoX + Math.cos(ring) * spread * (.86 + unit.depth * .53), halo);
        const y = mix((level * 1.12 - .06 + drift) * height,
          pose.logoY + Math.sin(ring) * spread * (1.05 + unit.depth * .44), halo);
        const radius = (1.15 + unit.depth * unit.depth * 4.6) * (1 + Math.sin(phase) * .16);
        addFragment(context, x, y, radius, phase * .51, unit.shape);
      }
      if (solid) context.fill();
      else context.stroke();
    }
  }

  function drawBrain(
    pose: ReturnType<typeof compactBrainPose>, seconds: number, reveal: number,
    opacity: number, lightweight: boolean,
  ) {
    if (opacity < .01 || reveal < .005) return;
    context.globalAlpha = opacity;
    const { x: midX, y: midY, scale, morph, spread } = pose;
    const cos = Math.cos(pose.yaw), sin = Math.sin(pose.yaw);
    const tilt = Math.sin(pose.pitch), upright = Math.cos(pose.pitch);
    const waveX = Math.sin(seconds * 1.5), waveY = Math.cos(seconds * 1.5);
    const pointScale = Math.max(.59, scale / 36);
    const revealing = reveal < 1;

    for (let group = 0; group < particles.length; group++) {
      const points = particles[group];
      context.fillStyle = colors[group];
      context.beginPath();
      for (let at = 0; at < points.length; at += 8) {
        if (lightweight && at % 24 === 0) continue;
        const x = points[at], y = points[at + 1], z = points[at + 2], motion = points[at + 4];
        const show = revealing ? smooth(reveal, (motion + 1) * .25, (motion + 1) * .25 + .46) : 1;
        if (show < .025) continue;
        const depth = z * cos - x * sin;
        const cameraZ = depth * upright + y * tilt;
        const sway = (waveX * motion + waveY * points[at + 5]) * (1 - morph);
        const lens = scale * (1 + cameraZ * .038) * (1 + spread * (2.05 + motion * 1.5)) *
          (1 + (1 - show) * (.14 + motion * .48));
        const px = mix(midX + (x * cos + z * sin + sway * .043) * lens,
          pose.logoX + points[at + 6] * pose.logoSize, morph);
        const py = mix(midY - (y * upright - depth * tilt + sway * .053) * lens,
          pose.logoY + points[at + 7] * pose.logoSize, morph);
        if (px < -2 || py < -2 || px > width + 2 || py > height + 2) continue;
        const radius = pointScale * (.42 + points[at + 3] * .93) * (.85 + cameraZ * .082 + sway * .09) * show;
        if (radius < .92) context.rect(px - radius * .66, py - radius * .66, radius * 1.32, radius * 1.32);
        else {
          context.moveTo(px, py - radius);
          context.lineTo(px + radius * .81, py + radius * .64);
          context.lineTo(px - radius * .83, py + radius * .67);
          context.closePath();
        }
      }
      context.fill();
    }
  }

  return {
    resize(cssWidth: number, cssHeight: number) {
      width = cssWidth;
      height = cssHeight;
      const ratio = Math.min(devicePixelRatio || 1, 1.25, Math.sqrt(pixelBudget / (width * height)));
      const bufferWidth = Math.max(1, Math.floor(width * ratio)), bufferHeight = Math.max(1, Math.floor(height * ratio));
      if (canvas.width !== bufferWidth) canvas.width = bufferWidth;
      if (canvas.height !== bufferHeight) canvas.height = bufferHeight;
      context.setTransform(bufferWidth / width, 0, 0, bufferHeight / height, 0, 0);
    },
    setPalette(id: string) {
      destination = tones[Math.max(0, heroPalettes.findIndex(item => item.id === id))];
    },
    draw(
      pose: ReturnType<typeof compactBrainPose>, seconds: number, dt: number, scroll: number, reveal: number,
      brainOpacity: number, lightweight: boolean,
    ) {
      context.clearRect(0, 0, width, height);
      colorFrame(dt, pose.morph);
      if (pose.ambientOpacity > .005) drawFragments(pose, seconds, scroll, reveal, lightweight);
      drawBrain(pose, seconds, reveal, brainOpacity, lightweight);
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
