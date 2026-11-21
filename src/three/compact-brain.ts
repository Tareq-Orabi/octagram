import { heroPalettes } from "@/lib/hero-palettes";
import { evaluateNarrative, ramp } from "./choreography";
import { compactBrainSample } from "./compact-brain-sample";

export type ArtworkFrame = { x: number; y: number; size: number };
export type CompactBrainLayout = {
  width: number;
  height: number;
  homeTop: number;
  aboutTop: number;
  manifestoTop: number;
  visionTop: number;
  visionHeight: number;
  readingHeight: number;
  stickyVision: boolean;
  hero: ArtworkFrame;
  about: ArtworkFrame;
  logo: ArtworkFrame;
};

const originals = [0xec746c, 0xf38e57, 0xfab754, 0xf2e77b, 0xa3d4b3, 0x5ab5b1, 0xc4ded1, 0xf4c6a2];
const stride = 7;
const pixelBudget = 192_000;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const fraction = (value: number) => value - Math.floor(value);
function smooth(value: number, from: number, to: number) {
  const t = ramp(value, from, to);
  return t * t * (3 - 2 * t);
}

export function compactBrainPose(layout: CompactBrainLayout, scroll: number, actualScroll: number) {
  const { width, height, homeTop, aboutTop, manifestoTop, visionTop, visionHeight, readingHeight } = layout;
  let progress = 3 + .32 * ramp(scroll, visionTop, visionTop + height * .32);
  if (scroll < aboutTop) progress = ramp(scroll, homeTop, aboutTop);
  else if (scroll < manifestoTop) progress = 1 + ramp(scroll, aboutTop, manifestoTop);
  else if (scroll < visionTop) progress = 2 + ramp(scroll, manifestoTop, visionTop);

  const story = evaluateNarrative(progress, true);
  const travel = smooth(progress, .12, 1.08);
  const scatterTravel = smooth(progress, 1.42, 2.16);
  const heroY = layout.hero.y - Math.max(0, Math.min(height * .28, (scroll - homeTop) * .62));
  const aboutY = layout.about.y + Math.max(-.11, Math.min(.12, (aboutTop - scroll) / height * .23)) * height;
  const visionOffset = visionTop - actualScroll;
  const logoTop = layout.stickyVision
    ? Math.min(Math.max(0, visionOffset), visionOffset + visionHeight - readingHeight)
    : visionOffset;
  const logoY = logoTop + layout.logo.y;
  const logoApproach = Math.max(height * .24, Math.min(height * .56, logoY));
  return {
    x: mix(mix(layout.hero.x, layout.about.x, travel), width * .5, scatterTravel),
    y: mix(mix(heroY, aboutY, travel), height * .47, scatterTravel),
    size: mix(mix(layout.hero.size, layout.about.size, travel), Math.min(width * .91, height * .63), scatterTravel),
    logoX: layout.logo.x,
    logoY: mix(logoApproach, logoY, smooth(progress, 2.87, 3.12)),
    logoSize: layout.logo.size,
    logoOpacity: smooth(progress, 2.99, 3.17),
    ambientOpacity: story.ambientOpacity * (1 - smooth(-visionOffset, height * .46, visionHeight)),
    yaw: story.brain.yaw,
    morph: story.brainMorph,
    spread: story.brainSpread,
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

  function drawFragments(pose: ReturnType<typeof compactBrainPose>, seconds: number, scroll: number, lightweight: boolean) {
    const halo = smooth(pose.morph, .12, 1);
    const spread = Math.min(width, height) * .48;
    context.lineWidth = .92;
    for (let group = 0; group < fragments.length; group++) {
      context.strokeStyle = context.fillStyle = colors[group];
      const solid = group % 3 === 0;
      context.globalAlpha = pose.ambientOpacity * (solid ? .54 : .88);
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

  function drawBrain(pose: ReturnType<typeof compactBrainPose>, seconds: number, lightweight: boolean, logoReady: boolean) {
    context.globalAlpha = logoReady ? 1 - pose.logoOpacity : 1;
    if (context.globalAlpha < .015) return;
    const { x: midX, y: midY, size, morph, spread } = pose;
    const swing = pose.yaw + (.065 + .20 * Math.sin(seconds * .68)) * (1 - morph);
    const nod = (-.05 + .12 * Math.sin(seconds * .53 + .38)) * (1 - morph);
    const cos = Math.cos(swing), sin = Math.sin(swing), tilt = Math.sin(nod), upright = Math.cos(nod);
    const waveX = Math.sin(seconds * 1.5), waveY = Math.cos(seconds * 1.5);
    const breath = size / 9.55 * (1 + .023 * Math.sin(seconds * .94));
    const pointScale = Math.max(.66, size / 350);

    for (let group = 0; group < particles.length; group++) {
      const points = particles[group];
      context.fillStyle = colors[group];
      context.beginPath();
      for (let at = 0; at < points.length; at += 8) {
        if (lightweight && at % 24 === 0) continue;
        const x = points[at], y = points[at + 1], z = points[at + 2];
        const depth = z * cos - x * sin;
        const cameraZ = depth * upright + y * tilt;
        const sway = waveX * points[at + 4] + waveY * points[at + 5];
        const lens = breath * (1 + cameraZ * .038) * (1 + spread * (1.1 + points[at + 4] * .64));
        const px = mix(midX + (x * cos + z * sin + sway * .047) * lens,
          pose.logoX + points[at + 6] * pose.logoSize, morph);
        const py = mix(midY - (y * upright - depth * tilt + sway * .057) * lens,
          pose.logoY + points[at + 7] * pose.logoSize, morph);
        if (px < -2 || py < -2 || px > width + 2 || py > height + 2) continue;
        const radius = pointScale * (.41 + points[at + 3] * .91) * (.85 + cameraZ * .082 + sway * .09);
        if (radius < .96) context.rect(px - radius * .66, py - radius * .66, radius * 1.32, radius * 1.32);
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
    draw(pose: ReturnType<typeof compactBrainPose>, seconds: number, dt: number, scroll: number, lightweight: boolean, logoReady: boolean) {
      context.clearRect(0, 0, width, height);
      colorFrame(dt, pose.morph);
      drawFragments(pose, seconds, scroll, lightweight);
      drawBrain(pose, seconds, lightweight, logoReady);
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
