type Point = readonly [x: number, z: number];

const entryZ = 1.02;
const buildZ = 2.53;
const exitX = 5.33;
export const deckHeight = .62;
export const trackWidth = 1.27;
const inputStart = -8.22;
export const portalMouth = -4.09;
export const portalEnd = -5.25;
export const portalHeight = deckHeight + .60;
export const stationsOnTrack = [
  [-5.93, entryZ], [-3.08, entryZ], [.70, buildZ], [exitX, .08], [exitX, -2.25],
] as const satisfies readonly Point[];

function grade(z: number) {
  const t = Math.max(0, Math.min(1, (-z - 1.03) / 2.42));
  return deckHeight + (portalHeight - deckHeight) * t * t * (3 - 2 * t);
}

const interp = ([ax, az]: Point, [bx, bz]: Point, t: number): Point => [ax + (bx - ax) * t, az + (bz - az) * t];
function cubic(a: Point, b: Point, c: Point, d: Point) {
  return Array.from({ length: 36 }, (_, i) => {
    const t = (i + 1) / 36;
    return interp(interp(interp(a, b, t), interp(b, c, t), t), interp(interp(b, c, t), interp(c, d, t), t), t);
  });
}

function track(points: Point[]) {
  const distance = [0];
  for (let i = 1; i < points.length; i++) {
    const [x, z] = points[i], [px, pz] = points[i - 1];
    distance.push(distance[i - 1] + Math.hypot(x - px, z - pz, grade(z) - grade(pz)));
  }
  return { points, distance, length: distance.at(-1)! };
}

type Track = ReturnType<typeof track>;
const ramp = Array.from({ length: 22 }, (_, i): Point => [exitX, -.88 - i * .145]);
const dispatchRamp = [...ramp.filter(point => point[1] > -2.25), stationsOnTrack[4], ...ramp.filter(point => point[1] < -2.25)];
export const mainTrack = track([
  [inputStart, entryZ], stationsOnTrack[0], stationsOnTrack[1], [-2.12, entryZ],
  ...cubic([-2.12, entryZ], [-1.25, entryZ], [-1.24, buildZ], [-.10, buildZ]),
  stationsOnTrack[2], [3.77, buildZ],
  ...cubic([3.77, buildZ], [4.68, buildZ], [exitX, 1.90], [exitX, .98]),
  stationsOnTrack[3], ...dispatchRamp, [exitX, portalMouth], [exitX, portalEnd],
]);
export const stationDistances = stationsOnTrack.map(station => mainTrack.distance[mainTrack.points.indexOf(station)]);

function sample(path: Track, distance: number): Point {
  const at = Math.max(0, Math.min(path.length, distance));
  let first = 0, last = path.points.length - 1;
  while (last - first > 1) {
    const middle = (first + last) >> 1;
    if (path.distance[middle] <= at) first = middle;
    else last = middle;
  }
  const t = (at - path.distance[first]) / (path.distance[first + 1] - path.distance[first]);
  return interp(path.points[first], path.points[first + 1], t);
}

export function trackPose(distance: number, path: Track = mainTrack) {
  const [x, z] = sample(path, distance);
  const [ax, az] = sample(path, distance - .10), [bx, bz] = sample(path, distance + .10);
  return {
    x, y: grade(z), z, angle: Math.atan2(az - bz, bx - ax),
    pitch: Math.atan2(grade(bz) - grade(az), Math.hypot(bx - ax, bz - az)),
  };
}

// Sweep each section along an open rail, using the same curve as the carrier.
export function sweepTrack(path: Track, profile: Point[]) {
  const positions: number[] = [], faces: number[] = [];
  const sides = profile.length, end = path.points.length - 1;
  path.points.forEach(([x, z], index) => {
    const [prevX, prevZ] = path.points[Math.max(0, index - 1)];
    const [nextX, nextZ] = path.points[Math.min(end, index + 1)];
    const dx = nextX - prevX, dz = nextZ - prevZ, length = Math.hypot(dx, dz);
    profile.forEach(([outward, y], side) => {
      positions.push(x + dz / length * outward, y + grade(z), z - dx / length * outward);
      if (index === end) return;
      const a = index * sides + side, b = index * sides + (side + 1) % sides;
      faces.push(a, b, b + sides, a, b + sides, a + sides);
    });
  });
  for (let i = 1; i < sides - 1; i++) {
    faces.push(0, i + 1, i, end * sides, end * sides + i, end * sides + i + 1);
  }
  return { positions, faces };
}
