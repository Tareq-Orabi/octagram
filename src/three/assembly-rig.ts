import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { LOGO_MODULES } from "./brand-paths";
import { assemblyReadout, assemblyView } from "./assembly-layout";
import { assemblyDuration, assemblyStations, assemblyStep, assemblyTime, carrierVariants, conveyorSpeed, exitTime, launchTime } from "./assembly-motion";
import {
  deckHeight, mainTrack, portalEnd, portalHeight, portalMouth,
  stationDistances, stationsOnTrack, sweepTrack, trackPose, trackWidth,
} from "./assembly-track";

type Parent = THREE.Object3D;
type Position = readonly [x: number, y: number, z: number];
const white = new THREE.Color(0xfff3f2);
const stationColors = assemblyStations.map(station => new THREE.Color(station.color));
const carrierLift = .024;
const carrierLength = .84;
const carrierWidth = .62;
const moduleOffsets = [-.238, 0, .238];
const mix = THREE.MathUtils.lerp;
const ease = THREE.MathUtils.smoothstep;
const turn = Math.PI * 2;
const spacing = assemblyDuration / carrierVariants.length;
const scanRadius = .83;

function roundedPath(path: THREE.Path, width: number, height: number, round: number) {
  const l = -width / 2, r = width / 2, b = -height / 2, t = height / 2;
  path.moveTo(l + round, b);
  path.lineTo(r - round, b);
  path.quadraticCurveTo(r, b, r, b + round);
  path.lineTo(r, t - round);
  path.quadraticCurveTo(r, t, r - round, t);
  path.lineTo(l + round, t);
  path.quadraticCurveTo(l, t, l, t - round);
  path.lineTo(l, b + round);
  path.quadraticCurveTo(l, b, l + round, b);
  return path;
}

function logoGeometry(wire = false) {
  const paths = LOGO_MODULES.flatMap(module => module.paths.map(path => {
    const shape = new THREE.Shape();
    const tokens = path.d.match(/[MCLZ]|-?(?:\d+(?:\.\d*)?|\.\d+)/g) ?? [];
    let index = 0;
    const x = () => Number(tokens[index++]) - 150;
    const y = () => 150 - Number(tokens[index++]);
    while (index < tokens.length) {
      switch (tokens[index++]) {
        case "M": shape.moveTo(x(), y()); break;
        case "L": shape.lineTo(x(), y()); break;
        case "C": shape.bezierCurveTo(x(), y(), x(), y(), x(), y()); break;
        case "Z": shape.closePath(); break;
      }
    }
    if (wire) {
      const points = shape.getPoints(4);
      const count = points.length - 1;
      const vertices: number[] = [];
      const indices: number[] = [];
      for (let i = 0; i < count; i++) {
        const [a, b, c] = [points[(i + count - 1) % count], points[i], points[(i + 1) % count]];
        const dx = c.x - a.x, dy = c.y - a.y, size = Math.hypot(dx, dy) || 1;
        vertices.push((b.x - dy / size) / 300, (b.y + dx / size) / 300, 0,
          (b.x + dy / size) / 300, (b.y - dx / size) / 300, 0);
        const v = i * 2, next = (i + 1) % count * 2;
        indices.push(v, v + 1, next, v + 1, next + 1, next);
      }
      const stroke = new THREE.BufferGeometry();
      stroke.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      stroke.setIndex(indices);
      stroke.computeVertexNormals();
      return stroke;
    }
    const source = new THREE.ShapeGeometry(shape, 5);
    const geometry = (source.index ? source.toNonIndexed() : source.clone()).scale(1 / 300, 1 / 300, 1);
    source.dispose();
    {
      const position = geometry.getAttribute("position");
      const from = new THREE.Color(path.color).multiplyScalar(.59);
      const color = new THREE.Color(), to = new THREE.Color(path.color).lerp(white, .23);
      const colors = new Float32Array(3 * position.count);
      for (let i = 0; i < position.count; i++) {
        const level = THREE.MathUtils.clamp(.52 + .76 * (position.getY(i) - .38 * position.getX(i)), 0, 1);
        color.copy(from).lerp(to, level).toArray(colors, i * 3);
      }
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    }
    return geometry;
  }));
  const geometry = mergeGeometries(paths)!;
  paths.forEach(path => path.dispose());
  return geometry;
}

export function frameAssembly(camera: THREE.OrthographicCamera, aspect: number) {
  const { width } = assemblyView;
  const height = width / aspect;
  camera.left = -width / 2;
  camera.right = width / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  camera.updateProjectionMatrix();
}

export function createAssemblyRig() {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-8, 8, 4, -4, .1, 120);
  const target = new THREE.Vector3(...assemblyView.target);
  camera.position.copy(target).add(new THREE.Vector3(...assemblyView.offset));
  camera.lookAt(target);
  frameAssembly(camera, assemblyView.aspect);

  const geometryPool = new Set<THREE.BufferGeometry>();
  const materialPool = new Set<THREE.Material>();
  const boxes = new Map<string, THREE.BufferGeometry>();
  const fixtures = new THREE.Group();
  const moving = new THREE.Group();
  scene.add(moving);

  function register<T extends THREE.BufferGeometry>(geometry: T) {
    geometryPool.add(geometry);
    return geometry;
  }
  function material(value: THREE.MeshBasicMaterial) {
    materialPool.add(value);
    return value;
  }
  const ink = (color = 0xffffff) => material(new THREE.MeshBasicMaterial({ color, toneMapped: false }));
  const shell = ink(0x080808), shadow = ink(0x020202), casing = ink(0x131314);
  const seam = ink(0x3c3c3e), brightEdge = ink(0x545457), faint = ink(0x232325), grid = ink(0x1b1c1e);
  const tread = ink(0x1d1d1e);
  const emblem = register(logoGeometry());
  const tube = register(new THREE.CylinderGeometry(1, 1, 1, 28));
  const halo = register(new THREE.RingGeometry(.001, 1, 36, 9));
  const points = halo.getAttribute("position");
  const fade = new Float32Array(points.count * 4);
  for (let i = 0; i < points.count; i++) {
    const distance = Math.hypot(points.getX(i), points.getY(i));
    fade.set([1, 1, 1, Math.max(0, 1 - distance) ** 2.45], i * 4);
  }
  halo.setAttribute("color", new THREE.BufferAttribute(fade, 4));

  function mesh(parent: Parent, geometry: THREE.BufferGeometry, skin: THREE.MeshBasicMaterial, [x, y, z]: Position) {
    const part = new THREE.Mesh(geometry, skin);
    part.position.set(x, y, z);
    parent.add(part);
    return part;
  }
  function mount(parent: Parent, [x, y, z]: Position, angle = 0) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = angle;
    parent.add(group);
    return group;
  }
  function block(parent: Parent, at: Position, [w, h, d]: Position, skin: THREE.MeshBasicMaterial, round = .025) {
    const key = `${w}/${h}/${d}/${round}`;
    if (!boxes.has(key)) {
      const shape = round <= .026 ? new THREE.BoxGeometry(w, h, d)
        : new RoundedBoxGeometry(w, h, d, round > .1 ? 3 : 1, round);
      boxes.set(key, register(shape));
    }
    return mesh(parent, boxes.get(key)!, skin, at);
  }
  function roundBar(parent: Parent, at: Position, radius: number, height: number, skin: THREE.MeshBasicMaterial) {
    const part = mesh(parent, tube, skin, at);
    part.scale.set(radius, height, radius);
    return part;
  }

  function ring(parent: Parent, at: Position, radius: number, thickness: number, skin: THREE.MeshBasicMaterial, arc = turn) {
    return mesh(parent, register(new THREE.RingGeometry(radius - thickness, radius, 48, 1, 0, arc)), skin, at);
  }
  function outline(parent: Parent, at: Position, width: number, height: number, radius: number, thickness: number, skin: THREE.MeshBasicMaterial) {
    const limit = roundedPath(new THREE.Shape(), width, height, radius) as THREE.Shape;
    limit.holes.push(roundedPath(new THREE.Path(), width - thickness * 2, height - thickness * 2, Math.max(.014, radius - thickness)));
    return mesh(parent, register(new THREE.ExtrudeGeometry(limit, {
      depth: .014, bevelEnabled: false, curveSegments: 8,
    })), skin, at);
  }
  function housing(parent: Parent, at: Position, [w, h, d]: Position, round: number, skin = shell) {
    const part = block(parent, at, [w, h, d], skin, round);
    for (const side of [-1, 1]) {
      const trim = outline(part, [0, side * (h / 2 - round * .26), 0], w - round * .33, d - round * .33, round * .90, .018, side > 0 ? brightEdge : faint);
      trim.rotation.x = -Math.PI / 2;
    }
    outline(part, [0, 0, d / 2 + .003], w - round * .47, h - round * .48, round * .72, .015, seam);
    return part;
  }
  function glow(parent: Parent, at: Position, width: number, height: number, rotation?: Position) {
    const skin = material(new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, vertexColors: true, depthWrite: false,
      toneMapped: false, blending: THREE.AdditiveBlending, opacity: 0,
    }));
    const bloom = mesh(parent, halo, skin, at);
    bloom.scale.set(width / 2, height / 2, 1);
    if (rotation) bloom.rotation.set(rotation[0], rotation[1], rotation[2]);
    return skin;
  }
  function luminous(index: number) {
    const light = ink();
    light.color.copy(stationColors[index]);
    return light;
  }
  function shade(light: THREE.MeshBasicMaterial, index: number, strength: number) {
    light.color.copy(stationColors[index]).multiplyScalar(strength);
  }

  const cold = new THREE.Color(0x5555ff), warm = new THREE.Color(0xffd993);
  function energyPane(parent: Parent, at: Position, width: number, height: number, radius: number) {
    const shape = roundedPath(new THREE.Shape(), width, height, radius) as THREE.Shape;
    const geometry = register(new THREE.ShapeGeometry(shape, 7));
    const vertices = geometry.getAttribute("position");
    const stops = new Float32Array(vertices.count * 4);
    const color = new THREE.Color();
    for (let i = 0; i < vertices.count; i++) {
      const direction = .50 + vertices.getY(i) / height * .63 - vertices.getX(i) / width * .27;
      color.copy(cold).lerp(warm, direction).lerp(white, .34);
      stops.set([color.r, color.g, color.b, .66 + direction * .33], i * 4);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(stops, 4));
    const skin = material(new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, side: THREE.DoubleSide, forceSinglePass: true,
      depthWrite: false, opacity: 0, toneMapped: false,
    }));
    return mesh(parent, geometry, skin, at);
  }

  const floorHaze = glow(fixtures, [-.78, -.102, -.04], 22, 13, [-Math.PI / 2, 0, 0]);
  floorHaze.color.setHex(0x58585a);
  floorHaze.opacity = .25;

  type BeltProfile = readonly [outward: number, y: number, gray: number][];
  const railSkin = ink();
  railSkin.vertexColors = true;
  function trackStrip(profile: BeltProfile, sheen = 0) {
    const { positions, faces } = sweepTrack(mainTrack, profile.map(([across, height]) => [across, height]));
    const geometry = register(new THREE.BufferGeometry());
    const colors: number[] = [];
    const gray = new THREE.Color();
    for (const distance of mainTrack.distance) {
      const position = distance / mainTrack.length;
      const reflection = Math.max(0, Math.cos(position * turn * 2.5 + .42)) ** 4;
      for (const [, , tone] of profile) {
        gray.setHex(Math.round(tone + reflection * sheen) * 0x010101);
        colors.push(gray.r, gray.g, gray.b);
      }
    }
    geometry.setIndex(faces);
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(positions.length / 3 * 2), 2));
    geometry.computeVertexNormals();
    mesh(fixtures, geometry, railSkin, [0, 0, 0]);
  }

  const edge = trackWidth / 2;
  trackStrip([
    [-edge, -.230, 3], [edge, -.230, 3], [edge + .017, -.181, 9], [edge + .012, -.035, 18],
    [edge - .034, .001, 10], [edge - .19, .001, 6], [-edge + .19, .001, 6], [-edge + .034, .001, 10],
    [-edge - .012, -.035, 15], [-edge - .017, -.181, 8],
  ], 2);
  for (const side of [-1, 1]) {
    const rail = side * (edge - .031);
    trackStrip([
      [rail - .045, -.199, 5], [rail + .045, -.199, 6], [rail + .059, .039, 24],
      [rail + .032, .085, 34], [rail - .027, .085, 32], [rail - .055, .040, 18],
    ], 8);
    trackStrip([
      [rail - .018, .080, 33], [rail + .018, .080, 34], [rail + .021, .099, 53], [rail - .021, .099, 52],
    ], 11);
    const lip = rail + side * .050;
    trackStrip([
      [lip - .008, -.182, 13], [lip + .008, -.182, 17], [lip + .008, -.162, 29], [lip - .008, -.162, 19],
    ], 9);
  }
  function sitOnBelt(part: Parent, distance: number, height = 0, across = 0) {
    const pose = trackPose(distance);
    part.position.set(pose.x + Math.sin(pose.angle) * across, pose.y + height, pose.z + Math.cos(pose.angle) * across);
    part.rotation.set(0, pose.angle, pose.pitch, "YXZ");
  }

  const beltLength = assemblyDuration * conveyorSpeed;
  const tiles = Array.from({ length: 18 }, (_, i) => {
    const tile = mount(moving, [0, 0, 0]);
    tile.name = `Conveyor panel ${i + 1}`;
    block(tile, [0, .004, 0], [.018, .011, .96], tread);
    if (i % 3 === 0) {
      const mark = mount(tile, [.36, .007, .29]);
      block(mark, [0, .004, 0], [.36, .014, .233], shell, .028);
      const border = outline(mark, [0, .012, 0], .353, .223, .105, .011, faint);
      border.rotation.x = -Math.PI / 2;
      const glyph = ring(mark, [0, .014, 0], .067, .014, tread, Math.PI * 1.6);
      glyph.rotation.x = -Math.PI / 2;
      glyph.rotation.z += i * .69;
      block(mark, [.033, .017, -.018], [.034, .009, .025], seam);
    }
    return tile;
  });
  for (const t of [.026, .184, .305, .467, .625, .744, .833, .923]) {
    const pose = trackPose(mainTrack.length * t);
    const stand = mount(fixtures, [pose.x, 0, pose.z], pose.angle);
    block(stand, [0, .056, 0], [.70, .11, .86], casing, .053);
    block(stand, [0, (pose.y - .18) / 2, 0], [.24, pose.y - .18, .51], shell, .041);
    block(stand, [0, .122, .269], [.129, .16, .027], seam);
    for (const side of [-1, 1]) roundBar(stand, [side * .246, .119, .31], .031, .018, faint);
  }

  const railSignal = Array.from({ length: 4 }, (_, i) =>
    block(moving, [0, 0, 0], [.19 - i * .024, .013, .027], luminous(0)));
  const returnPath = new THREE.CurvePath<THREE.Vector3>();
  const conduitBends = [[5.7, -4.89], [4.91, -5.42], [-5.57, -5.42], [-6.53, -4.78], [-6.73, -2.82]];
  for (let i = 1; i < conduitBends.length; i++) {
    const [x, z] = conduitBends[i - 1], [ex, ez] = conduitBends[i];
    const from = new THREE.Vector3(x, .071, z), to = new THREE.Vector3(ex, .071, ez);
    returnPath.add(new THREE.LineCurve3(from, to));
    const duct = block(fixtures, [(x + ex) / 2, .041, (z + ez) / 2], [from.distanceTo(to), .056, .088], shell);
    duct.rotation.y = Math.atan2(z - ez, ex - x);
  }
  const returnSignal = Array.from({ length: 4 }, (_, i) =>
    block(moving, [0, 0, 0], [.19 - i * .024, .019, .054], luminous(4)));
  const returnPoint = new THREE.Vector3(), returnHeading = new THREE.Vector3();

  // The readout is recessed in a low deck. Its text uses the camera's exact floor plane.
  const panel = assemblyReadout;
  const readout = mount(fixtures, [panel.left + panel.width / 2, 0, panel.near + panel.depth / 2]);
  block(readout, [0, .018, 0], [panel.width + .17, .071, panel.depth + .14], shadow, .10);
  block(readout, [0, .092, 0], [panel.width + .075, .14, panel.depth + .071], casing, .118);
  block(readout, [0, .149, 0], [panel.width - .105, .031, panel.depth - .110], shell, .091);
  const bezel = outline(readout, [0, .162, 0], panel.width - .053, panel.depth - .052, .13, .026, seam);
  bezel.rotation.x = -Math.PI / 2;
  const readoutAccent = luminous(0);
  block(readout, [0, .170, -panel.depth / 2 + .137], [panel.width - .32, .014, .034], readoutAccent);
  for (const side of [-1, 1]) roundBar(readout, [side * (panel.width / 2 - .145), .171, panel.depth / 2 - .119], .025, .017, faint);

  const liquidShape = register(new THREE.CylinderGeometry(.449, .439, 1, 48, 8));
  const liquidPositions = liquidShape.getAttribute("position");
  const liquidColors = new Float32Array(liquidPositions.count * 3);
  for (let i = 0; i < liquidPositions.count; i++) {
    const y = liquidPositions.getY(i) + .5;
    const x = liquidPositions.getX(i), z = liquidPositions.getZ(i);
    const angle = Math.atan2(z, x);
    const surface = (Math.sin(angle * 2) * .056 + Math.cos(angle * 3 + .65) * .025) * Math.hypot(x, z) / .449;
    liquidPositions.setY(i, y + y ** 3 * surface);
    const sheen = .44 + .25 * y + .24 * Math.max(0, Math.cos(angle - 1.14)) ** 8;
    liquidColors.set([sheen, sheen * (.81 + .26 * y), sheen * (1.19 - .21 * y)], i * 3);
  }
  liquidShape.setAttribute("color", new THREE.BufferAttribute(liquidColors, 3));
  liquidShape.computeBoundingSphere();

  const vesselGlass = register(new THREE.CylinderGeometry(.523, .523, 1.46, 48, 4, true));
  const glassPoints = vesselGlass.getAttribute("position");
  const glassColors = new Float32Array(glassPoints.count * 4);
  for (let i = 0; i < glassPoints.count; i++) {
    const angle = Math.atan2(glassPoints.getX(i), glassPoints.getZ(i));
    const reflection = .12 + .54 * Math.max(0, Math.cos(angle + .22)) ** 120
      + .39 * Math.max(0, Math.cos(angle - .96)) ** 196;
    glassColors.set([.89, .95, 1, reflection], i * 4);
  }
  vesselGlass.setAttribute("color", new THREE.BufferAttribute(glassColors, 4));
  const glassSkin = material(new THREE.MeshBasicMaterial({
    color: 0xa9b2d6, opacity: .37, transparent: true, vertexColors: true, depthWrite: false, toneMapped: false,
  }));
  const dropShape = register(new THREE.SphereGeometry(1, 16, 11));

  function reservoir(x: number, z: number, phase: number) {
    const base = mount(fixtures, [x, .018, z], .11);
    for (const [y, radius, height] of [[.12, .642, .23], [.257, .529, .095], [1.77, .567, .19], [1.885, .442, .050]]) {
      roundBar(base, [0, y, 0], radius, height, y < .30 ? casing : shell);
      ring(base, [0, y + height / 2 + .007, 0], radius - .006, .018, y < .3 ? seam : brightEdge).rotation.x = -Math.PI / 2;
    }
    for (const side of [-1, 1]) {
      block(base, [side * .464, 1.013, .239], [.064, 1.47, .078], casing, .027);
      block(base, [side * .473, 1.013, .282], [.017, 1.42, .013], seam);
    }
    block(base, [0, 1.918, 0], [.052, .021, .57], seam).rotation.y = .46;
    roundBar(base, [0, 1.354, -.044], .127, .758, shell);
    mesh(base, dropShape, shell, [.022, 1.173, .068]).scale.set(.162, .256, .125);
    roundBar(base, [0, .317, 0], .472, .044, shadow);
    mesh(base, vesselGlass, glassSkin, [0, 1.027, 0]);

    const animated = mount(moving, [x, .018, z]);
    const pigment = material(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
    const liquid = mesh(animated, liquidShape, pigment, [0, .298, 0]);
    liquid.name = phase === 0 ? "Intake coolant" : "Dispatch coolant";
    const strip = ring(animated, [0, .316, 0], .518, .026, luminous(0));
    strip.rotation.x = -Math.PI / 2;
    const bubbles = Array.from({ length: 5 }, (_, i) => {
      const bubble = mesh(animated, dropShape, luminous(0), [0, 0, 0]);
      bubble.scale.setScalar(.022 + (i % 3) * .009);
      return bubble;
    });
    const aura = glow(animated, [0, .97, .54], 2.8, 3.15);
    const reflection = glow(animated, [0, .019, 0], 2.75, 2.58, [-Math.PI / 2, 0, 0]);
    return { liquid, strip, bubbles, aura, reflection, phase };
  }
  const reservoirs = [reservoir(-6.53, -2.15, 0), reservoir(3.59, -2.49, .39)];

  // A low projector draws the Octagram wireframe and its launch rings in the air.
  const corner = mount(fixtures, [3.06, .015, -4.48], .23);
  housing(corner, [0, .168, 0], [1.82, .34, 1.16], .148);
  roundBar(corner, [0, .397, 0], .405, .148, casing);
  ring(corner, [0, .478, 0], .392, .024, brightEdge).rotation.x = -Math.PI / 2;
  const projector = ring(corner, [0, .481, 0], .351, .038, luminous(4));
  projector.rotation.x = -Math.PI / 2;
  for (const x of [-.64, .64]) block(corner, [x, .352, .214], [.14, .029, .078], seam, .018);
  const projection = mount(moving, [3.06, 2.03, -4.48], .316);
  projection.name = "Launch halo";
  const standFace = material(new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, opacity: .18,
  }));
  mesh(projection, emblem, standFace, [0, 0, -.017]).scale.setScalar(1.28);
  const wireInk = material(new THREE.MeshBasicMaterial({
    color: 0x9468ff, side: THREE.DoubleSide, forceSinglePass: true, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: .55, toneMapped: false,
  }));
  mesh(projection, register(logoGeometry(true)), wireInk, [0, 0, .006]).scale.setScalar(1.28);
  const ringsOnHalo = Array.from({ length: 3 }, (_, i) => {
    const skin = material(new THREE.MeshBasicMaterial({
      color: 0x9468ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      opacity: .13, toneMapped: false,
    }));
    return ring(projection, [0, 0, -.036 - i * .035], .94 + i * .139, i ? .015 : .024, skin, turn * (.96 - i * .089));
  });
  const standShine = glow(projection, [0, 0, -.12], 3.6, 3.6);
  const standFoot = glow(corner, [0, .498, 0], 2.89, 2.73, [-Math.PI / 2, 0, 0]);

  function evolutionMonitor() {
    const base = mount(fixtures, [1.36, .028, -1.24], .12);
    housing(base, [0, .144, 0], [3.46, .29, 1.51], .16);
    housing(base, [0, 1.33, -.10], [3.21, 2.29, 1.20], .23);
    const topSeam = outline(base, [0, 2.48, -.10], 2.73, .82, .147, .016, faint);
    topSeam.rotation.x = -Math.PI / 2;
    const serviceHatch = outline(base, [1.612, 1.13, -.13], .70, .59, .102, .018, faint);
    serviceHatch.rotation.y = Math.PI / 2;
    for (let i = -2; i <= 2; i++) block(base, [1.615, 1.13 + i * .079, -.13], [.017, .018, .46], seam);
    const window = mount(base, [0, 1.48, .527]);
    const chrome = luminous(0);
    block(window, [0, 0, -.011], [2.74, 1.63, .109], shadow, .106);
    outline(window, [0, 0, .046], 2.76, 1.67, .139, .038, seam);
    outline(window, [0, 0, .061], 2.61, 1.53, .109, .016, chrome);
    for (let i = -5; i <= 5; i++) block(window, [i * .205, 0, .056], [.008, 1.36, .007], grid);
    for (let i = -3; i <= 3; i++) block(window, [0, i * .197, .056], [2.38, .008, .007], grid);
    for (const side of [-1, 1]) {
      block(window, [side * 1.12, -.693, .077], [.120, .021, .013], seam);
      block(window, [side * 1.12, .693, .077], [.120, .021, .013], seam);
    }
    const pins = assemblyStations.map((_, i) => {
      const pin = luminous(i);
      block(window, [i * .183 - .366, -1.00, .015], [.101, .039, .033], pin, .016);
      return pin;
    });
    const active = mount(moving, [1.36, 1.508, -1.24], .12);
    const display = mount(active, [0, -.006, .621]);
    const stock = mount(display, [0, 0, 0]);
    stock.name = "Evolution display product";
    block(stock, [0, 0, .014], [1.27, .84, .059], shell, .06);
    const rimInk = luminous(0);
    outline(stock, [0, 0, .046], 1.29, .86, .105, .023, rimInk);
    const sections = moduleOffsets.map((x, i) => {
      const width = .272, ink = luminous(i + 1);
      const part = mount(stock, [x * 1.46, 0, .054]);
      block(part, [0, 0, .023], [width, .58, .045], ink, .041);
      outline(part, [0, 0, .051], width - .054, .529, .038, .013, faint);
      return { part, ink, x: x * 1.46 };
    });
    const stencil = outline(stock, [0, 0, .113], .81, .635, .074, .020, chrome);
    const markInk = material(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
    const mark = mesh(stock, emblem, markInk, [0, 0, .130]);
    mark.scale.setScalar(.45);
    const beam = block(display, [0, 0, .168], [1.57, .028, .018], luminous(3));
    beam.name = "Evolution display scan";
    const faceGlow = glow(display, [0, 0, .16], 2.48, 1.74);
    const output = glow(display, [1.01, 0, .16], .77, .93);
    return { rimInk, stock, sections, stencil, chrome, pins, mark, markInk, beam, faceGlow, output };
  }
  const evolution = evolutionMonitor();

  function atStation(index: number, parent: Parent = fixtures) {
    const [x, z] = stationsOnTrack[index];
    return mount(parent, [x, deckHeight, z], index >= 3 ? Math.PI / 2 : 0);
  }

  // Feed tunnel. A fresh tray emerges while the outgoing one disappears.
  const feed = mount(fixtures, [-7.78, deckHeight, stationsOnTrack[0][1]]);
  for (const side of [-1, 1]) block(feed, [0, .27, side * .69], [.91, .72, .16], casing, .071);
  housing(feed, [0, .66, 0], [.96, .23, 1.59], .11);
  const feedRim = outline(feed, [.49, .30, 0], 1.39, .68, .12, .016, faint);
  feedRim.rotation.y = Math.PI / 2;
  const feedStatus = ink(0x946ec9);
  block(feed, [.503, .70, .38], [.023, .037, .25], feedStatus);

  function scannerAt(index: number) {
    const base = atStation(index);
    const action = atStation(index, moving);
    const status = luminous(index), beamInk = luminous(index);
    const verify = index === 3;
    const roof = verify ? 1.63 : 1.94;
    const span = verify ? 1.43 : .92;
    for (const side of [-1, 1]) {
      const z = side * .83;
      housing(base, [0, -.47, z], [span + .16, .22, .36], .09);
      for (const leg of [-1, 1]) {
        const x = leg * (span / 2 - .10);
        housing(base, [x, (roof - .42) / 2, z], [.19, roof + .42, .26], .083);
        block(base, [x, roof * .49, z + .139], [.027, roof * .67, .018], status);
      }
    }
    housing(base, [0, roof, 0], [span + .09, .28, 1.82], .12);
    const railLight = outline(base, [.03, roof + .144, 0], span * .72, 1.19, .15, .021, status);
    railLight.rotation.x = -Math.PI / 2;
    const field = mount(action, [0, 0, 0]);
    field.name = verify ? "Inspection sweep" : "Intake sweep";
    const fieldHeight = verify ? 1.08 : 1.34;
    const curtain = energyPane(field, [0, .23 + fieldHeight / 2, 0], 1.32, fieldHeight, .115);
    curtain.rotation.y = Math.PI / 2;
    const head = block(field, [0, .28, 0], [.040, .032, 1.30], beamInk);
    const filaments = Array.from({ length: 5 }, (_, i) =>
      block(field, [0, .38 + i * .20, 0], [.025, .013, .94 + i * .071], status));
    const sensor = glow(field, [0, .29, 0], .49, 1.48, [-Math.PI / 2, 0, 0]);
    const indicator = energyPane(action, [0, roof - .205, -.650], span * .90, .241, .065);
    indicator.rotation.y = Math.PI;
    const glowPane = glow(action, [0, 1.08, .988], span * 2.0, 1.72);
    const floorGlow = glow(action, [0, .022, 0], 1.77, 1.25, [-Math.PI / 2, 0, 0]);
    const passLight = ink(0x10252a);
    if (verify) {
      const panel = mount(base, [0, 1.11, .985]);
      block(panel, [0, 0, 0], [.84, .55, .079], shadow, .035);
      outline(panel, [0, 0, .049], .85, .56, .065, .014, seam);
      block(panel, [-.150, -.046, .056], [.174, .026, .014], passLight).rotation.z = -.74;
      block(panel, [.032, -.011, .056], [.332, .026, .014], passLight).rotation.z = .76;
      block(panel, [.258, .15, .055], [.077, .061, .017], status, .018);
    }
    return { status, beamInk, field, curtain, head, filaments, indicator, glowPane, floorGlow, sensor, passLight };
  }
  const intake = scannerAt(0);
  const inspection = scannerAt(3);

  // Planning console faces the camera, with a visible blueprint drawn as a carrier rolls past.
  const planX = stationsOnTrack[1][0];
  const console = mount(fixtures, [planX, .10, -.66]);
  housing(console, [0, .18, 0], [2.59, .46, 1.36], .14);
  housing(console, [0, 1.24, 0], [2.34, 1.66, 1.02], .17);
  housing(console, [0, 2.06, -.032], [2.27, .215, .99], .098);
  const planDisplay = mount(moving, [planX, 1.45, -.108]);
  const planLight = luminous(1), drawing = luminous(1), planLock = luminous(1);
  outline(planDisplay, [0, 0, .03], 2.03, 1.31, .13, .025, planLight);
  block(planDisplay, [0, 0, 0], [1.98, 1.25, .049], shadow, .029);
  for (let i = -4; i <= 4; i++) block(planDisplay, [i * .20, 0, .031], [.010, 1.13, .009], grid);
  for (let i = -2; i <= 2; i++) block(planDisplay, [0, i * .22, .031], [1.82, .010, .009], grid);
  const drawingLines = [
    [-.79, .31, -.24, .31], [-.24, .31, -.24, -.28], [-.24, -.28, -.79, -.28], [-.79, -.28, -.79, .31],
    [-.51, .31, -.51, -.28], [-.24, .016, .25, .016], [.25, .016, .25, .34], [.25, .34, .75, .34],
    [.75, .34, .75, -.24], [.75, -.24, .25, -.24], [.25, -.24, .25, .016], [.51, .34, .51, -.24],
  ].map(([x, y, ex, ey]) => {
    const hinge = mount(planDisplay, [x, y, .051]);
    hinge.rotation.z = Math.atan2(ey - y, ex - x);
    const length = Math.hypot(ey - y, ex - x);
    block(hinge, [length / 2, 0, 0], [length + .008, .022, .012], drawing);
    return hinge;
  });
  const planShine = glow(planDisplay, [-.48, .24, .085], 2.19, 1.31);
  block(planDisplay, [.795, -.46, .052], [.13, .058, .023], planLock, .02);
  // The articulated laser marks a passing product and retracts between carriers.
  const armMount = [-.47, 0, .64] as const;
  const armBase = mount(fixtures, armMount);
  housing(armBase, [0, .155, 0], [1.27, .31, 1.07], .153);
  roundBar(armBase, [0, .350, 0], .385, .169, casing);
  ring(armBase, [0, .438, 0], .386, .022, brightEdge).rotation.x = -Math.PI / 2;
  for (const side of [-1, 1]) roundBar(armBase, [side * .455, .319, .376], .058, .022, seam);
  const arm = mount(moving, armMount);
  const shoulder = new THREE.Vector3(0, .699, 0);
  const elbow = new THREE.Vector3(), tip = new THREE.Vector3(), point = new THREE.Vector3();
  const bend = new THREE.Vector3(), axis = new THREE.Vector3(), jointAxis = new THREE.Vector3();
  const unitX = new THREE.Vector3(1, 0, 0), unitY = new THREE.Vector3(0, 1, 0);
  const elbowDirection = new THREE.Vector3(-.32, 1, 0).normalize();
  const armLengths = [1.2, 1.16] as const;
  const hingeLight = luminous(2);
  roundBar(armBase, [0, .543, 0], .276, .235, shell);
  ring(armBase, [0, .665, 0], .271, .016, seam).rotation.x = -Math.PI / 2;
  const links = armLengths.map((length, i) => {
    const link = mount(arm, [0, 0, 0]);
    const radius = i === 0 ? .157 : .123;
    housing(link, [length / 2, 0, 0], [length + .18, radius * 2, i === 0 ? .33 : .257], radius * .75);
    outline(link, [length / 2, 0, i === 0 ? .174 : .136], length - .19, radius * .83, .051, .013, faint);
    block(link, [length / 2 - .036, .012, i === 0 ? .177 : .139], [length * .54, .034, .015], seam, .018);
    return link;
  });
  const bearings = [0, 1].map(i => {
    const hinge = mount(arm, [0, 0, 0]);
    roundBar(hinge, [0, 0, 0], i ? .182 : .228, .37, casing);
    for (const side of [-1, 1]) {
      const rim = ring(hinge, [0, side * .192, 0], i ? .170 : .215, .032, hingeLight);
      rim.rotation.x = -side * Math.PI / 2;
    }
    roundBar(hinge, [0, .208, 0], .093, .035, shell);
    return hinge;
  });
  const emitter = mount(arm, [0, 0, 0]);
  emitter.name = "Articulated laser head";
  block(emitter, [0, .059, 0], [.216, .217, .222], casing, .068);
  roundBar(emitter, [0, -.063, 0], .102, .112, shell);
  roundBar(emitter, [0, -.124, 0], .068, .026, hingeLight);
  const ray = roundBar(arm, [0, 0, 0], .011, 1, luminous(2));
  ray.name = "Laser beam";
  const rayAura = material(new THREE.MeshBasicMaterial({
    color: 0x65ffcf, blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
  }));
  const wideRay = roundBar(arm, [0, 0, 0], .037, 1, rayAura);
  const impact = mount(arm, [0, 0, 0]);
  const impactGlow = glow(impact, [0, .005, 0], .71, .71, [-Math.PI / 2, 0, 0]);
  const sparks = Array.from({ length: 6 }, (_, i) => {
    const spark = block(impact, [0, 0, 0], [.04 + i * .007, .011, .015], luminous(2));
    spark.rotation.y = i * turn / 6;
    return spark;
  });

  // Rising rails feed directly into the dark launch chamber.
  const portalX = stationsOnTrack[4][0];
  const portal = mount(fixtures, [portalX, portalHeight, portalMouth], Math.PI / 2);
  const portalAction = mount(moving, [portalX, portalHeight, portalMouth], Math.PI / 2);
  const portalBase = housing(portal, [.47, -.55, 0], [1.36, .46, 2.13], .123);
  block(portalBase, [0, .244, .77], [1.11, .034, .093], seam, .016);
  for (const side of [-1, 1]) housing(portal, [.53, .54, side * .91], [1.33, 1.42, .29], .12);
  housing(portal, [.52, 1.24, 0], [1.32, .30, 2.05], .129);
  block(portal, [1.34, .59, 0], [.037, 1.28, 1.61], ink(0x000000));
  const rings = Array.from({ length: 5 }, (_, index) => {
    const light = luminous(4);
    const frame = outline(portalAction, [.192 * index - .11, .53 - index * .040, 0], 1.75 - index * .11,
      1.34 - index * .079, .24 - index * .027, .032, light);
    frame.rotation.y = -Math.PI / 2;
    return light;
  });
  const portalHalo = glow(portalAction, [-.155, .57, 0], 3.11, 2.64, [0, -Math.PI / 2, 0]);
  const portalFloor = glow(portalAction, [-.42, .027, 0], 2.20, 1.37, [-Math.PI / 2, 0, 0]);

  const prism = register(new THREE.CylinderGeometry(.115, .237, .248, 6));
  const loopShape = register(new THREE.TorusGeometry(.161, .034, 9, 36));
  for (const shape of [prism, loopShape]) {
    const normals = shape.getAttribute("normal"), colors = new Float32Array(normals.count * 3);
    for (let i = 0; i < normals.count; i++) {
      const light = .43 + .56 * Math.max(0, normals.getX(i) * .40 + normals.getY(i) * .66 + normals.getZ(i) * .49);
      colors.set([light, light, light], i * 3);
    }
    shape.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }
  const trayDark = new THREE.Color(0x0a0a0b), trayTrim = new THREE.Color(0x272729);

  function carrier(variant: typeof carrierVariants[number], index: number) {
    const tray = mount(moving, [0, 0, 0]);
    tray.name = `Carrier ${variant.name}`;
    const hull = ink(), trim = ink(), led = luminous(0), product = ink(), accent = ink();
    const tone = new THREE.Color(variant.color), highlight = new THREE.Color(variant.highlight);
    block(tray, [0, .081, 0], [carrierLength, .16, carrierWidth], hull, .072);
    block(tray, [0, .146, 0], [.758, .083, .537], trim, .042);
    const rim = outline(tray, [0, .185, 0], .742, .51, .082, .018, led);
    rim.rotation.x = -Math.PI / 2;
    for (const x of [-.31, .31]) block(tray, [x, .112, .315], [.088, .034, .017], led);
    const part = mount(tray, [0, .195, 0]);
    if (index === 0) {
      product.vertexColors = true;
      mesh(part, prism, product, [0, .143, 0]).rotation.y = .12;
      roundBar(part, [0, .274, 0], .077, .014, accent);
      ring(part, [0, .024, 0], .251, .015, accent).rotation.x = -Math.PI / 2;
    } else if (index === 1) {
      block(part, [0, .043, 0], [.551, .084, .355], product, .046);
      block(part, [0, .136, 0], [.229, .107, .189], accent, .03);
      for (const side of [-1, 1]) for (let i = -1; i <= 1; i++) {
        block(part, [side * .171, .091, i * .065], [.074, .019, .027], trim);
      }
    } else {
      accent.vertexColors = true;
      roundBar(part, [0, .050, 0], .213, .094, product);
      mesh(part, loopShape, accent, [0, .133, 0]).rotation.x = -Math.PI / 2;
      roundBar(part, [0, .093, 0], .061, .081, led);
    }
    const trail = glow(tray, [0, -.006, 0], 1.68, 1.23, [-Math.PI / 2, 0, 0]);
    return { tray, hull, trim, led, product, accent, tone, highlight, trail, time: 0, distance: 0 };
  }
  const pieces = carrierVariants.map(carrier);

  // Merge the opaque static fixtures by material. Lit parts keep their own transforms.
  fixtures.updateMatrixWorld(true);
  const batches = new Map<THREE.MeshBasicMaterial, THREE.BufferGeometry[]>();
  const matte = new Set([shell, casing, shadow]);
  fixtures.traverse(object => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
    const skin = object.material as THREE.MeshBasicMaterial;
    if (skin.transparent) {
      const pane = object.clone();
      pane.applyMatrix4(object.parent!.matrixWorld);
      scene.add(pane);
      return;
    }
    const geometry = (object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone()).applyMatrix4(object.matrixWorld);
    if (matte.has(skin)) {
      const normals = geometry.getAttribute("normal");
      const values = new Float32Array(normals.count * 3);
      for (let i = 0; i < normals.count; i++) {
        const above = Math.max(0, normals.getY(i));
        const bevel = (1 - Math.abs(normals.getY(i))) * Math.max(0, normals.getX(i) * .44 + normals.getZ(i) * .66);
        values.fill(.37 + above * .72 + bevel * .47, i * 3, i * 3 + 3);
      }
      geometry.setAttribute("color", new THREE.BufferAttribute(values, 3));
    }
    const batch = batches.get(skin) ?? [];
    batch.push(geometry);
    batches.set(skin, batch);
  });
  for (const [skin, geometries] of batches) {
    const bakedSkin = matte.has(skin) ? material(skin.clone()) : skin;
    if (matte.has(skin)) bakedSkin.vertexColors = true;
    mesh(scene, register(mergeGeometries(geometries)!), bakedSkin, [0, 0, 0]);
    geometries.forEach(geometry => geometry.dispose());
  }
  fixtures.clear();

  const sectionHue = new THREE.Color(), focusHue = new THREE.Color(), chargeHue = new THREE.Color();
  const sweepHue = new THREE.Color(), pulseHue = new THREE.Color();
  const pass = (delta: number, span: number) => 1 - ease(Math.abs(delta), span * .31, span);
  const offset = (index: number, center: number) => pieces[index].distance - center;

  function nearest(distance: number) {
    let selected = 0;
    for (let i = 1; i < pieces.length; i++) {
      if (Math.abs(offset(i, distance)) < Math.abs(offset(selected, distance))) selected = i;
    }
    return selected;
  }

  function updateConveyor(time: number) {
    tiles.forEach((tile, i) => {
      const distance = (time * conveyorSpeed + i * beltLength / tiles.length) % beltLength;
      tile.visible = distance > .22 && distance < mainTrack.length - .34;
      if (tile.visible) sitOnBelt(tile, distance);
    });
    pieces.forEach((piece, i) => {
      const phase = assemblyTime(time + i * spacing);
      const distance = phase * conveyorSpeed;
      piece.time = phase;
      piece.distance = distance;
      piece.tray.visible = distance > .29 && phase < exitTime;
      if (!piece.tray.visible) return;
      sitOnBelt(piece.tray, distance, carrierLift);
      const appearing = ease(distance, .34, 1.16);
      // The trailing edge has cleared the outer portal rim before the light fades.
      const hidden = ease(distance, launchTime * conveyorSpeed + .48, mainTrack.length - .02);
      const visibility = appearing * (1 - hidden);
      const local = pass(distance - stationDistances[2], 1.05);
      const checked = pass(distance - stationDistances[3], .98);
      const marked = ease(distance, stationDistances[2] + .13, stationDistances[2] + .78);
      const folded = Math.min(1, visibility * 2);
      piece.hull.color.copy(trayDark).multiplyScalar(folded);
      piece.trim.color.copy(trayTrim).multiplyScalar(folded);
      piece.led.color.copy(piece.tone).lerp(piece.highlight, .31 + marked * .52).multiplyScalar(visibility * (1.08 + local * .75 + checked * .66));
      piece.product.color.copy(piece.tone).lerp(piece.highlight, local * .45).multiplyScalar(visibility * (.26 + marked * .85));
      piece.accent.color.copy(piece.highlight).lerp(white, local * .52).multiplyScalar(visibility * (.46 + marked * .98));
      piece.trail.color.copy(piece.highlight);
      piece.trail.opacity = visibility * (.41 + local * .47 + checked * .34);
    });

    railSignal.forEach((dash, i) => {
      const distance = (time * conveyorSpeed * 2 + i * beltLength / railSignal.length) % beltLength;
      dash.visible = distance > 1.14 && distance < mainTrack.length - .78;
      if (!dash.visible) return;
      sitOnBelt(dash, distance, .018, -.505);
      dash.material.color.setHSL((time / assemblyDuration + i * .243) % 1, 1, .60).multiplyScalar(.97);
    });

    const pressure = pass(offset(nearest(.81), .81), .93);
    feedStatus.color.copy(stationColors[0]).multiplyScalar(.46 + pressure * 1.54);
  }

  function updateScanner(scanner: ReturnType<typeof scannerAt>, step: number) {
    const distance = stationDistances[step];
    const variant = nearest(distance);
    const delta = offset(variant, distance);
    const piece = pieces[variant];
    const power = pass(delta, scanRadius);
    const sweep = THREE.MathUtils.clamp(.5 + delta / (scanRadius * 2), 0, 1);
    const vertical = ease(sweep, 0, 1);
    sweepHue.copy(stationColors[step]).lerp(piece.highlight, vertical * .63);
    scanner.field.visible = power > .002 && piece.tray.visible;
    scanner.field.position.x = delta * .73;
    scanner.status.color.copy(sweepHue).multiplyScalar(.225 + power * 1.74);
    scanner.beamInk.color.copy(sweepHue).lerp(white, .56).multiplyScalar(.82 + power * .65);
    scanner.curtain.material.color.copy(sweepHue);
    scanner.curtain.material.opacity = power * (.57 + variant * .045);
    scanner.indicator.material.color.copy(sweepHue);
    scanner.indicator.material.opacity = .10 + power * .68;
    scanner.head.position.y = .33 + vertical * .22;
    scanner.filaments.forEach((bar, i) => {
      bar.position.y = .37 + i * .158 + vertical * (.09 + variant * .041);
      bar.scale.z = .87 + .13 * Math.cos(sweep * turn + i * .72);
    });
    scanner.glowPane.color.copy(sweepHue);
    scanner.glowPane.opacity = .09 + power * .79;
    scanner.floorGlow.color.copy(sweepHue);
    scanner.floorGlow.opacity = .07 + power * .65;
    scanner.sensor.color.copy(sweepHue);
    scanner.sensor.opacity = power * .90;
    shade(scanner.passLight, 2, .10 + 2.25 * pass(delta - .72, .50));
  }

  function updatePlanner() {
    const distance = stationDistances[1];
    const variant = nearest(distance);
    const delta = offset(variant, distance);
    const power = pass(delta, 1.37);
    const progress = ease(delta, -.96, .16);
    const lock = pass(delta - .64, .58);
    planLight.color.copy(stationColors[1]).lerp(pieces[variant].tone, power * .41).multiplyScalar(.39 + power * 1.15);
    drawing.color.copy(planLight.color).multiplyScalar(.64 + progress * .47);
    shade(planLock, 1, .19 + lock * 2.04);
    drawingLines.forEach((segment, i) => {
      const reveal = ease(progress, i / drawingLines.length, (i + 1) / drawingLines.length);
      segment.scale.x = Math.max(.001, reveal);
      segment.visible = power > .02;
    });
    planShine.color.copy(planLight.color);
    planShine.opacity = .10 + power * .55;
  }

  function aimLaser(time: number) {
    const distance = stationDistances[2];
    const variant = nearest(distance), piece = pieces[variant], delta = offset(variant, distance);
    const power = pass(delta, .96);
    const following = pass(delta, 1.51);
    const engraving = Math.max(0, Math.min(1, (delta + .96) / 1.92));
    const cycle = engraving * turn;
    const x = variant === 2 ? .161 * Math.cos(cycle) : .053 * Math.sin(cycle * (variant + 1));
    const z = variant === 2 ? .161 * Math.sin(cycle) : .050 * Math.cos(cycle * (variant + 1));
    const height = variant === 0 ? .479 : variant === 1 ? .388 : .365;
    // Working stretch lies on the straight rail, so the nozzle follows the top face.
    point.set(piece.tray.position.x - arm.position.x + x, piece.tray.position.y + height, piece.tray.position.z - arm.position.z + z);
    tip.set(mix(.68, point.x, following), 1.65 + .04 * Math.sin(time / assemblyDuration * turn * 3), mix(1.24, point.z - .25, following));
    axis.subVectors(tip, shoulder);
    const reach = Math.min(axis.length(), armLengths[0] + armLengths[1] - .002);
    axis.normalize();
    tip.copy(shoulder).addScaledVector(axis, reach);
    bend.copy(elbowDirection).addScaledVector(axis, -elbowDirection.dot(axis)).normalize();
    const along = (armLengths[0] ** 2 - armLengths[1] ** 2 + reach ** 2) / (2 * reach);
    elbow.copy(shoulder).addScaledVector(axis, along).addScaledVector(bend, Math.sqrt(Math.max(0, armLengths[0] ** 2 - along ** 2)));
    jointAxis.crossVectors(axis, bend).normalize();
    links[0].position.copy(shoulder);
    links[0].quaternion.setFromUnitVectors(unitX, axis.subVectors(elbow, shoulder).normalize());
    links[1].position.copy(elbow);
    links[1].quaternion.setFromUnitVectors(unitX, axis.subVectors(tip, elbow).normalize());
    bearings[0].position.copy(shoulder);
    bearings[1].position.copy(elbow);
    bearings.forEach(hub => hub.quaternion.setFromUnitVectors(unitY, jointAxis));

    emitter.position.copy(tip);
    const firing = power > .022 && piece.tray.visible;
    const beamLength = axis.subVectors(tip, point).length();
    if (firing) emitter.quaternion.setFromUnitVectors(unitY, axis.normalize());
    else emitter.rotation.set(0, 0, 0);
    ray.visible = wideRay.visible = impact.visible = firing;
    hingeLight.color.copy(stationColors[2]).lerp(piece.highlight, power * .75).multiplyScalar(.36 + 2.31 * power);
    if (!firing) return;
    hingeLight.color.lerp(white, .10);
    const beamStart = .135;
    for (const beam of [ray, wideRay]) {
      beam.rotation.copy(emitter.rotation);
      beam.position.copy(tip).addScaledVector(axis, -(beamLength + beamStart) * .5);
      beam.scale.y = Math.max(.02, beamLength - beamStart);
    }
    ray.material.color.copy(piece.highlight).lerp(white, .62).multiplyScalar(.88 + power * .79);
    rayAura.color.copy(piece.highlight).lerp(stationColors[2], .25);
    rayAura.opacity = power * .39;
    impact.position.copy(point);
    impactGlow.color.copy(piece.highlight);
    impactGlow.opacity = power * .95;
    sparks.forEach((spark, i) => {
      const spread = .052 + ((engraving * (variant + 2) + i * .16) % 1) * .19;
      const angle = i * turn / sparks.length + cycle * .54;
      spark.position.set(Math.cos(angle) * spread, .022 + spread * .15, Math.sin(angle) * spread);
      spark.rotation.y = -angle;
      spark.material.color.copy(piece.highlight).lerp(white, 1 - spread * 3).multiplyScalar(power * (1.27 - spread));
    });
  }

  function updateLaunch(time: number) {
    const variant = nearest(launchTime * conveyorSpeed + .75);
    const piece = pieces[variant];
    const age = piece.time - launchTime;
    const burst = pass(age - .38, .95);
    const haloLife = ease(age, -.27, .30) * (1 - ease(age, .47, 1.63));
    pulseHue.copy(piece.highlight).lerp(stationColors[4], .17);
    lightHalo(haloLife);
    projection.position.y = 2.03 + .08 * Math.sin(time / assemblyDuration * turn * 2) + haloLife * .16;
    projection.rotation.y = .316 + Math.sin(time / assemblyDuration * turn * 2) * .11;
    projector.material.color.copy(stationColors[4]).lerp(pulseHue, haloLife).multiplyScalar(.33 + haloLife * 2.17);
    ringsOnHalo.forEach((ring, i) => {
      const wave = ease(age, -.24 + i * .18, .14 + i * .18) * (1 - ease(age, .51 + i * .18, 1.1 + i * .18));
      ring.material.color.copy(pulseHue).lerp(stationColors[0], .24 * i);
      ring.material.opacity = .14 + wave * .74;
      ring.rotation.z = i * 1.27 + time / assemblyDuration * turn * (i % 2 ? -1 : 1);
      ring.scale.setScalar(.94 + .19 * ease(age, -.09 + i * .16, .98 + i * .16) * haloLife);
    });
    portalHalo.color.copy(pulseHue);
    portalHalo.opacity = .19 + .88 * burst;
    portalFloor.color.copy(pulseHue);
    portalFloor.opacity = .10 + .67 * burst;
    rings.forEach((light, i) => {
      const wave = pass(age - i * .125, .48);
      light.color.copy(stationColors[4]).lerp(pulseHue, burst * (.39 + i * .12)).multiplyScalar(.30 + burst * .38 + wave * 2.12);
    });
    const sequence = (age - .29) / 1.63;
    returnSignal.forEach((dash, i) => {
      const at = sequence - i * .022;
      dash.visible = at > 0 && at < 1;
      if (!dash.visible) return;
      returnPoint.copy(returnPath.getPoint(at));
      returnHeading.subVectors(returnPath.getPoint(Math.min(1, at + .020)), returnPoint);
      dash.position.copy(returnPoint);
      dash.rotation.y = Math.atan2(-returnHeading.z, returnHeading.x);
      const envelope = ease(at, 0, .13) * (1 - ease(at, .90, 1));
      dash.material.color.copy(pulseHue).lerp(stationColors[0], at).multiplyScalar(envelope * (2.2 - i * .39));
    });
    return { burst, intakeWake: pass(sequence - .92, .16) };
  }

  function lightHalo(power: number) {
    wireInk.color.copy(stationColors[0]).lerp(pulseHue, power);
    wireInk.opacity = .47 + power * .53;
    standFace.opacity = .16 + power * .78;
    standShine.color.copy(stationColors[0]).lerp(pulseHue, power);
    standShine.opacity = .15 + power * .79;
    standFoot.color.copy(standShine.color);
    standFoot.opacity = .20 + power * .78;
  }

  function updateTanks(time: number, intakePower: number, launchPower: number) {
    const clock = time / assemblyDuration;
    reservoirs.forEach(({ liquid, bubbles, strip, aura, reflection, phase }, i) => {
      const current = i === 0 ? intakePower : launchPower;
      const wave = .5 + .5 * Math.sin((clock * 3 + phase) * turn);
      const level = .92 + wave * .21 + current * .15;
      chargeHue.setHSL((clock * 2 + phase + .72) % 1, 1, .57);
      chargeHue.lerp(i === 0 ? stationColors[0] : pulseHue, current * .38);
      liquid.scale.y = level;
      liquid.rotation.y = clock * turn * (i === 0 ? 2 : -2) + phase;
      liquid.material.color.copy(chargeHue).multiplyScalar(1.05 + current * .77);
      strip.material.color.copy(chargeHue).lerp(white, .11).multiplyScalar(1.17 + current * 1.22);
      bubbles.forEach((bubble, j) => {
        const flow = (clock * (2 + j % 2) + j * .226 + phase) % 1;
        const circle = (clock * 3 + j * .29) * turn;
        bubble.position.set(Math.cos(circle) * .276, .34 + flow * (level - .09), Math.sin(circle) * .276);
        bubble.material.color.copy(chargeHue).lerp(white, .63).multiplyScalar(.30 + Math.sin(flow * Math.PI));
      });
      aura.color.copy(chargeHue);
      aura.opacity = .62 + current * .53;
      reflection.color.copy(chargeHue);
      reflection.opacity = .44 + current * .44;
    });
  }

  function updateReadouts(time: number, index: number) {
    const phase = assemblyStations[index];
    const work = pass(time - phase.arrive, index === 4 ? 1.23 : .84);
    const blend = ease(time, phase.start, phase.start + .44);
    sectionHue.copy(stationColors[Math.max(0, index - 1)]).lerp(stationColors[index], blend)
      .lerp(stationColors[0], ease(time, assemblyDuration - .52, assemblyDuration));
    focusHue.copy(sectionHue).lerp(pieces[0].tone, .11);
    readoutAccent.color.copy(sectionHue).multiplyScalar(.74 + work * .75);
    const launched = ease(time, launchTime, exitTime);
    const enter = ease(time, .00, .64);
    evolution.stock.visible = time < exitTime;
    evolution.stock.position.x = mix(-.21 * (1 - enter), .99, launched);
    evolution.stock.scale.setScalar(mix(.82 + .18 * enter, .09, launched));
    const planned = ease(time, assemblyStations[1].arrive - .55, assemblyStations[1].arrive + .29);
    evolution.chrome.color.copy(focusHue).multiplyScalar(.35 + work * .90);
    evolution.rimInk.color.copy(focusHue).multiplyScalar((.95 + work * .83) * (1 - launched));
    evolution.stencil.visible = planned > .01;
    evolution.stencil.scale.setScalar(mix(.61, 1, planned));
    evolution.sections.forEach(({ part, ink, x }, i) => {
      const mark = assemblyStations[2].arrive - .29 + i * .175;
      const build = ease(time, mark, mark + .36);
      part.position.x = x * mix(1.67, 1, build);
      part.position.y = (1 - build) * (i - 1) * .21;
      part.scale.setScalar(.82 + build * .18);
      part.visible = planned > .01;
      ink.color.copy(focusHue).multiplyScalar((.14 * planned + .95 * build) * (1 - launched * .92));
    });
    evolution.mark.visible = time >= assemblyStations[2].done - .22 && launched < .76;
    evolution.markInk.color.copy(white).lerp(focusHue, .19).multiplyScalar(1 - launched);
    const scan = assemblyStations[3];
    evolution.beam.visible = time >= scan.arrive - .41 && time < scan.done;
    evolution.beam.position.y = mix(.43, -.43, ease(time, scan.arrive - .41, scan.done));
    evolution.beam.material.color.copy(white).lerp(stationColors[3], .56);
    evolution.faceGlow.color.copy(focusHue);
    evolution.faceGlow.opacity = .17 + work * .51;
    evolution.output.color.copy(stationColors[4]);
    evolution.output.opacity = Math.sin(launched * Math.PI) * .91;
    evolution.pins.forEach((pin, i) => shade(pin, i, time >= assemblyStations[i].done ? 1.15 : i === index ? .42 + work * .48 : .065));
  }

  function update(seconds: number) {
    const time = assemblyTime(seconds);
    const index = assemblyStep(time);
    updateConveyor(time);
    updateScanner(intake, 0);
    updatePlanner();
    aimLaser(time);
    updateScanner(inspection, 3);
    const { burst, intakeWake } = updateLaunch(time);
    updateTanks(time, Math.max(intakeWake, pass(offset(nearest(stationDistances[0]), stationDistances[0]), 1.17)), burst);
    updateReadouts(time, index);
    return index;
  }

  return {
    scene, camera, update,
    dispose() {
      geometryPool.forEach(geometry => geometry.dispose());
      materialPool.forEach(skin => skin.dispose());
      scene.clear();
    },
  };
}
