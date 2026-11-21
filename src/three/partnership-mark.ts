import { LOGO_GRADIENTS, LOGO_MODULES, type LogoPath } from "./brand-paths";
import { clamp01, smooth01 } from "@/lib/scroll-math";

export const partnershipModules = [
  "north-west", "west", "south-west", "north-east", "east", "south-east",
] as const;

type Point = { x: number; y: number };
type Frame = { levels: number[]; assembly: number; charge: number; seconds: number | null };
const view = 360;
const thickness = 13;
const edgeColors = ["#ffc09c", "#a2ecd2", "#ffc779", "#ffa7b8", "#a1d8ec", "#e6ef98"];

// The owner’s paths contain one closed outline apiece. Sample the cubic edges
// for the extrusion walls and keep the original Bézier curves for the faces.
function contour(path: string): Point[] {
  const tokens = path.match(/[MCLZ]|-?(?:\d+(?:\.\d*)?|\.\d+)/g) ?? [];
  const points: Point[] = [];
  for (let at = 0; at < tokens.length;) {
    const command = tokens[at++];
    if (command === "Z") break;
    if (command === "M" || command === "L") {
      points.push({ x: Number(tokens[at++]), y: Number(tokens[at++]) });
      continue;
    }
    const from = points.at(-1)!;
    const x1 = Number(tokens[at++]), y1 = Number(tokens[at++]);
    const x2 = Number(tokens[at++]), y2 = Number(tokens[at++]);
    const endX = Number(tokens[at++]), endY = Number(tokens[at++]);
    for (let step = 1; step <= 9; step++) {
      const t = step / 9, s = 1 - t;
      points.push({
        x: s ** 3 * from.x + 3 * s * s * t * x1 + 3 * s * t * t * x2 + t ** 3 * endX,
        y: s ** 3 * from.y + 3 * s * s * t * y1 + 3 * s * t * t * y2 + t ** 3 * endY,
      });
    }
  }
  return points;
}

function material(ink: CanvasRenderingContext2D, path: LogoPath) {
  const paint = LOGO_GRADIENTS[path.gradientId];
  const gradient = paint.type === "radial"
    ? ink.createRadialGradient(paint.cx, paint.cy, 0, paint.cx, paint.cy, paint.r)
    : ink.createLinearGradient(paint.x1, paint.y1, paint.x2, paint.y2);
  for (const stop of paint.stops) gradient.addColorStop(stop.offset, stop.color);
  return gradient;
}

export function createPartnershipMark(canvas: HTMLCanvasElement) {
  const ink = canvas.getContext("2d", { alpha: true });
  if (!ink) throw new Error("Canvas 2D is unavailable");
  const modules = LOGO_MODULES.map(module => {
    const [x, y] = module.centroid;
    const radius = Math.hypot(x - 150, y - 150);
    return {
      x, y, direction: { x: (x - 150) / radius, y: (y - 150) / radius },
      index: partnershipModules.findIndex(id => id === module.id),
      phase: Math.random() * Math.PI * 2,
      rate: 1.7 + Math.random() * .5,
      glintCycle: 5.4 + Math.random() * 4.9,
      glintColor: Math.floor(Math.random() * edgeColors.length),
      paths: module.paths.map(path => ({
        face: new Path2D(path.d), wall: contour(path.d), paint: material(ink, path), color: path.color,
      })),
    };
  });

  return function draw(frame: Frame): Point[] {
    const scale = Math.min(canvas.width, canvas.height) / view;
    const insetX = (canvas.width - view * scale) / 2;
    const insetY = (canvas.height - view * scale) / 2;
    const anchors: Point[] = [];
    const assemble = smooth01(frame.assembly);
    const released = 1 - assemble;

    ink.resetTransform();
    ink.clearRect(0, 0, canvas.width, canvas.height);
    ink.setTransform(scale, 0, 0, scale, insetX, insetY);

    for (const module of modules) {
      const linked = module.index >= 0 ? frame.levels[module.index] ?? 0 : 0;
      const light = Math.max(linked, assemble);
      const space = (13 + 3 * (1 - linked)) * released;
      const sway = frame.seconds === null ? 0 : Math.sin(frame.seconds * module.rate + module.phase);
      const rise = frame.seconds === null ? 0 : Math.sin(frame.seconds * 1.46) * 2.5;
      const cx = module.x + 30 + module.direction.x * space;
      const cy = module.y + 30 + module.direction.y * space + sway * 4.1 * released + rise * assemble;
      const cycle = frame.seconds === null ? 0 : frame.seconds / module.glintCycle + module.phase;
      const glow = frame.seconds === null ? 0 : Math.sin(Math.PI * (cycle % 1)) ** 14 * .82;
      const tint = edgeColors[(module.glintColor + Math.floor(cycle)) % edgeColors.length];

      // These are the orthographic projections of the piece’s rotated X, Y
      // and Z axes. Its back and front faces sit at ±thickness / 2.
      const pitch = (-.29 + module.direction.y * .10 + sway * .034) * released;
      const yaw = module.direction.x * .32 * released;
      const sinX = Math.sin(pitch), cosX = Math.cos(pitch);
      const sinY = Math.sin(yaw), cosY = Math.cos(yaw);
      const axisX = cosY, axisYX = sinX * sinY, axisY = cosX;
      const depthX = cosX * sinY * thickness / 2, depthY = -sinX * thickness / 2;
      const tx = cx - axisX * module.x - axisYX * module.y;
      const ty = cy - axisY * module.y;
      if (module.index >= 0) anchors[module.index] = { x: (cx + depthX) / view, y: (cy + depthY) / view };

      for (const path of module.paths) {
        // The visible sidewalls are the quads joining equal points along the
        // raised front face and the solid backing face.
        ink.beginPath();
        for (let index = 0; index < path.wall.length; index++) {
          const a = path.wall[index], b = path.wall[(index + 1) % path.wall.length];
          const ax = tx + a.x * axisX + a.y * axisYX, ay = ty + a.y * axisY;
          const bx = tx + b.x * axisX + b.y * axisYX, by = ty + b.y * axisY;
          ink.moveTo(ax - depthX, ay - depthY);
          ink.lineTo(bx - depthX, by - depthY);
          ink.lineTo(bx + depthX, by + depthY);
          ink.lineTo(ax + depthX, ay + depthY);
          ink.closePath();
        }
        ink.fillStyle = "#101014";
        ink.fill();
        ink.fillStyle = path.color;
        ink.globalAlpha = .1 + light * .43;
        ink.fill();
        ink.globalAlpha = 1;
        ink.lineWidth = .75;
        ink.strokeStyle = `rgba(209,190,181,${(.16 + light * .13) * released})`;
        ink.stroke();

        ink.save();
        ink.transform(axisX, 0, axisYX, axisY, tx + depthX, ty + depthY);
        ink.fillStyle = path.paint;
        ink.fill(path.face);
        ink.fillStyle = `rgba(10,10,13,${clamp01(.84 * (1 - light))})`;
        ink.fill(path.face);
        if (frame.charge > .005) {
          ink.fillStyle = `rgba(255,232,207,${frame.charge * .16})`;
          ink.fill(path.face);
        }
        ink.lineWidth = .85;
        ink.strokeStyle = `rgba(221,203,193,${(.31 + light * .18) * released})`;
        ink.stroke(path.face);
        if (glow > .023) {
          ink.strokeStyle = tint;
          ink.lineWidth = 3.0;
          ink.globalAlpha = glow * .18;
          ink.stroke(path.face);
          ink.lineWidth = 1.2;
          ink.globalAlpha = glow;
          ink.stroke(path.face);
        }
        ink.restore();
      }
    }
    return anchors;
  };
}
