import { assemblyOffset } from "./choreography";
import * as Three from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import {
  LOGO_MODULES,
  LOGO_GRADIENTS,
  type LogoPath,
  type LogoGradient,
} from "./brand-paths";
import type { SceneModel, ScenePointer } from "./types";

// All outlines and gradient placements come from the owner's original PDF.
// The four small internal pieces stay attached to their respective outer module.
const clamp = (value: number, low = 0, high = 1) =>
  Math.min(high, Math.max(low, value));
const smooth = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

function gradientTexture(THREE: typeof Three, definition: LogoGradient) {
  const size = 256;
  const bytes = new Uint8Array(size * 4);
  const stops = definition.stops;
  let nextStop = 1;
  for (let index = 0; index < size; index++) {
    const t = index / (size - 1);
    while (nextStop < stops.length - 1 && t > stops[nextStop].offset)
      nextStop++;
    const a = stops[nextStop - 1];
    const b = stops[nextStop];
    const amount = clamp(
      (t - a.offset) / Math.max(0.0001, b.offset - a.offset),
    );
    const colorA = Number.parseInt(a.color.slice(1), 16);
    const colorB = Number.parseInt(b.color.slice(1), 16);
    for (let channel = 0; channel < 3; channel++) {
      const shift = (2 - channel) * 8;
      const start = (colorA >> shift) & 255;
      const end = (colorB >> shift) & 255;
      bytes[index * 4 + channel] = Math.round(start + (end - start) * amount);
    }
    bytes[index * 4 + 3] = 255;
  }
  const texture = new THREE.DataTexture(bytes, size, 1, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function createSurfaceFactory(THREE: typeof Three) {
  const materials: Three.MeshPhysicalMaterial[] = [];
  const textures = new Map<string, Three.DataTexture>();

  function materialFor(path: LogoPath) {
    const definition = LOGO_GRADIENTS[path.gradientId];
    if (!textures.has(path.gradientId))
      textures.set(path.gradientId, gradientTexture(THREE, definition));
    const gradient = textures.get(path.gradientId);
    const isRadial = definition.type === "radial";
    const shaderUniforms = {
      octagramGradient: { value: gradient },
      octagramStart: {
        value: new THREE.Vector2(
          isRadial ? definition.cx : definition.x1,
          isRadial ? definition.cy : definition.y1,
        ),
      },
      octagramDirection: {
        value: new THREE.Vector2(
          isRadial ? definition.r : definition.x2 - definition.x1,
          isRadial ? 0 : definition.y2 - definition.y1,
        ),
      },
      octagramRadial: { value: isRadial ? 1 : 0 },
      octagramEdgeShade: { value: 0.82 },
    };
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.46,
      metalness: 0.12,
      clearcoat: 0.15,
      clearcoatRoughness: 0.55,
    });
    // Evaluate the gradient per fragment; the source radial fills must not be
    // approximated by a few vertex colors across the large triangulated faces.
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, shaderUniforms);
      shader.vertexShader = `attribute vec2 brandPosition;
attribute float brandFace;
varying vec2 vBrandPosition;
varying float vBrandFace;
${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vBrandPosition = brandPosition;
vBrandFace = brandFace;`,
      );
      shader.fragmentShader = `uniform sampler2D octagramGradient;
uniform vec2 octagramStart;
uniform vec2 octagramDirection;
uniform float octagramRadial;
uniform float octagramEdgeShade;
varying vec2 vBrandPosition;
varying float vBrandFace;
${shader.fragmentShader}`.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
vec2 octagramDelta = vBrandPosition - octagramStart;
float octagramLinearT = dot(octagramDelta, octagramDirection) / dot(octagramDirection, octagramDirection);
float octagramRadialT = length(octagramDelta) / length(octagramDirection);
float octagramT = clamp(mix(octagramLinearT, octagramRadialT, octagramRadial), 0.0, 1.0);
vec3 octagramColor = texture2D(octagramGradient, vec2(octagramT, 0.5)).rgb;
diffuseColor.rgb *= octagramColor * mix(octagramEdgeShade, 1.0, vBrandFace);`,
      );
    };
    material.customProgramCacheKey = () => "octagram-source-gradient-v1";
    materials.push(material);
    return material;
  }

  return {
    materialFor,
    dispose() {
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
    },
  };
}

function extrudePath(
  THREE: typeof Three,
  path: LogoPath,
  center: readonly number[],
  scale: number,
  depth: number,
  bevel = 0.012,
) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><path fill="#ffffff" d="${path.d}"/></svg>`;
  const parsed = new SVGLoader().parse(svg);
  const shapes = parsed.paths.flatMap((entry) => SVGLoader.createShapes(entry));
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: depth / scale,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: bevel / scale,
    bevelThickness: bevel / scale,
    curveSegments: 12,
  });
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const sourceCoordinates = new Float32Array(position.count * 2);
  const frontWeight = new Float32Array(position.count);
  for (let index = 0; index < position.count; index++) {
    sourceCoordinates[index * 2] = position.getX(index);
    sourceCoordinates[index * 2 + 1] = position.getY(index);
    frontWeight[index] = Math.abs(normal.getZ(index));
  }
  geometry.setAttribute(
    "brandPosition",
    new THREE.BufferAttribute(sourceCoordinates, 2),
  );
  geometry.setAttribute("brandFace", new THREE.BufferAttribute(frontWeight, 1));
  geometry.translate(-center[0], -center[1], -depth / scale / 2);
  // A rotation preserves winding and normals while converting SVG's Y-down
  // coordinates; a negative Y scale alone would reverse front-face winding.
  geometry.rotateX(Math.PI);
  geometry.scale(scale, scale, scale);
  geometry.computeBoundingSphere();
  return geometry;
}

function sceneDisposer(
  group: Three.Group,
  surfaces: ReturnType<typeof createSurfaceFactory>,
) {
  return () => {
    const geometries = new Set<Three.BufferGeometry>();
    group.traverse((object) => {
      if (
        "geometry" in object &&
        object.geometry instanceof Three.BufferGeometry
      )
        geometries.add(object.geometry);
    });
    geometries.forEach((geometry) => geometry.dispose());
    surfaces.dispose();
    group.clear();
  };
}

export async function createLogo(
  THREE: typeof Three = Three,
): Promise<SceneModel> {
  const group = new THREE.Group();
  group.name = "Octagram — eight exact brand modules";
  const surfaces = createSurfaceFactory(THREE);
  const minX = Math.min(...LOGO_MODULES.map((module) => module.bounds[0]));
  const maxX = Math.max(...LOGO_MODULES.map((module) => module.bounds[2]));
  const scale = 3.5 / (maxX - minX);
  const modules = LOGO_MODULES.map((source, index) => {
    const module = new THREE.Group();
    module.name = `Octagram ${source.id}`;
    for (const path of source.paths) {
      const mesh = new THREE.Mesh(
        extrudePath(THREE, path, source.centroid, scale, 0.22),
        surfaces.materialFor(path),
      );
      module.add(mesh);
    }
    const home = new THREE.Vector3(
      (source.centroid[0] - 150) * scale,
      (150 - source.centroid[1]) * scale,
      0,
    );
    module.position.copy(home);
    module.userData = { index, home };
    group.add(module);
    return module;
  });

  const update = (
    _time = 0,
    progress = 1,
    _pointer: ScenePointer = { x: 0, y: 0 },
    reduced = false,
  ) => {
    group.rotation.set(0, 0, 0);
    for (const module of modules) {
      const { home, index } = module.userData;
      const offset = assemblyOffset(reduced ? 1 : progress, index);
      module.position.set(
        home.x + offset.x,
        home.y + offset.y,
        home.z + offset.z,
      );
      module.rotation.set(0, 0, 0);
    }
  };
  update(0, 0.5, { x: 0, y: 0 }, true);
  return {
    group,
    update,
    dispose: sceneDisposer(group, surfaces),
  };
}

/** 250 ambient units share 16 draw calls: eight satin batches and eight contours. */
export async function createModules(
  THREE: typeof Three = Three,
): Promise<SceneModel> {
  const group = new THREE.Group();
  group.name = "Octagram — three depths of floating source modules";
  const surfaces = createSurfaceFactory(THREE);
  const materials: Three.LineBasicMaterial[] = [];
  const count = 250,
    goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const fraction = (value: number) => value - Math.floor(value);
  let selectedService = -1,
    transitionElapsed = 1,
    previousTime: number | null = null;
  let aspect = 1.6,
    mobile = false,
    quality = 1;
  type WireBatch = {
    object: Three.LineSegments<
      Three.InstancedBufferGeometry,
      Three.LineBasicMaterial
    >;
    position: Three.InstancedBufferAttribute;
    quaternion: Three.InstancedBufferAttribute;
    scale: Three.InstancedBufferAttribute;
  };
  type SolidBatch = {
    object: Three.InstancedMesh<
      Three.ExtrudeGeometry,
      Three.MeshPhysicalMaterial
    >;
  };
  type Unit = {
    index: number;
    source: number;
    solid: boolean;
    slot: number;
    phase: number;
    depth: number;
    width: number;
    ux: number;
    uy: number;
    opacity: number;
    position: Three.Vector3;
    quaternion: Three.Quaternion;
    scale: number;
    fromPosition: Three.Vector3;
    fromQuaternion: Three.Quaternion;
    fromScale: number;
  };
  const wires: WireBatch[] = [],
    solids: SolidBatch[] = [];
  const units: Unit[] = Array.from({ length: count }, (_, index) => {
    const layer = index % 10 < 5 ? 0 : index % 10 < 9 ? 1 : 2;
    const depth =
      [-2.5, 2.2, 6.2][layer] +
      fraction(index * 0.438579 + 0.31) * [3, 2.3, 2.2][layer];
    return {
      index,
      source: index % 8,
      solid: [1, 4, 8].includes(index % 10),
      slot: 0,
      phase: index * goldenAngle,
      depth,
      width: (layer === 2 ? 0.075 : 0.055) + fraction(index * 0.33115) * 0.065,
      ux: (fraction((index + 0.5) * 0.754877666) * 2 - 1) * 1.12,
      uy: (fraction((index + 0.5) * 0.569840296) * 2 - 1) * 1.12,
      opacity:
        (layer === 2 ? 0.18 : layer === 1 ? 0.35 : 0.24) +
        fraction(index * 0.8371) * 0.3,
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      scale: 1,
      fromPosition: new THREE.Vector3(),
      fromQuaternion: new THREE.Quaternion(),
      fromScale: 1,
    };
  });

  function outlineGeometry(
    path: LogoPath,
    center: readonly number[],
    scale: number,
  ) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="${path.d}"/></svg>`;
    const shapes = new SVGLoader()
      .parse(svg)
      .paths.flatMap((entry) => SVGLoader.createShapes(entry));
    const coordinates: number[] = [];
    const add = (
      a: Three.Vector2,
      b: Three.Vector2,
      front: number,
      back = front,
    ) =>
      coordinates.push(
        (a.x - center[0]) * scale,
        (center[1] - a.y) * scale,
        front,
        (b.x - center[0]) * scale,
        (center[1] - b.y) * scale,
        back,
      );
    for (const shape of shapes) {
      const contour = shape.getPoints(10);
      for (let index = 0; index < contour.length; index++) {
        const a = contour[index],
          b = contour[(index + 1) % contour.length];
        if (a.distanceToSquared(b) < 0.00001) continue;
        add(a, b, 0.12);
        add(a, b, -0.12);
      }
      const [x0, y0, x1, y1] = path.bounds;
      const connectorIndices = new Set<number>();
      for (const corner of [
        [x0, y0],
        [x0, y1],
        [x1, y0],
        [x1, y1],
      ]) {
        let closest = 0,
          distance = Infinity;
        contour.forEach((point, index) => {
          const next = (point.x - corner[0]) ** 2 + (point.y - corner[1]) ** 2;
          if (next < distance) {
            distance = next;
            closest = index;
          }
        });
        connectorIndices.add(closest);
      }
      for (const index of connectorIndices)
        add(contour[index], contour[index], -0.12, 0.12);
    }
    return new THREE.InstancedBufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(coordinates, 3),
    );
  }

  for (let sourceIndex = 0; sourceIndex < 8; sourceIndex++) {
    const source = LOGO_MODULES[sourceIndex].paths[0];
    const center = [
      (source.bounds[0] + source.bounds[2]) / 2,
      (source.bounds[1] + source.bounds[3]) / 2,
    ];
    const scale =
      1 /
      Math.max(
        source.bounds[2] - source.bounds[0],
        source.bounds[3] - source.bounds[1],
      );
    const lineUnits = units.filter(
      (unit) => unit.source === sourceIndex && !unit.solid,
    );
    const geometry = outlineGeometry(source, center, scale);
    const position = new THREE.InstancedBufferAttribute(
      new Float32Array(lineUnits.length * 3),
      3,
    ).setUsage(THREE.DynamicDrawUsage);
    const quaternion = new THREE.InstancedBufferAttribute(
      new Float32Array(lineUnits.length * 4),
      4,
    ).setUsage(THREE.DynamicDrawUsage);
    const size = new THREE.InstancedBufferAttribute(
      new Float32Array(lineUnits.length),
      1,
    ).setUsage(THREE.DynamicDrawUsage);
    const alpha = new THREE.InstancedBufferAttribute(
      new Float32Array(lineUnits.map((unit) => unit.opacity)),
      1,
    );
    geometry.setAttribute("instanceTranslation", position);
    geometry.setAttribute("instanceQuaternion", quaternion);
    geometry.setAttribute("instanceScale", size);
    geometry.setAttribute("instanceOpacity", alpha);
    geometry.instanceCount = lineUnits.length;
    const material = new THREE.LineBasicMaterial({
      color: source.color,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
    material.userData.sourceColor = source.color;
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = `attribute vec3 instanceTranslation;
attribute vec4 instanceQuaternion;
attribute float instanceScale;
attribute float instanceOpacity;
varying float vAmbientOpacity;
${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        `vec3 p = position * instanceScale;
vec3 transformed = p + 2.0 * cross(instanceQuaternion.xyz, cross(instanceQuaternion.xyz, p) + instanceQuaternion.w * p) + instanceTranslation;
vAmbientOpacity = instanceOpacity;`,
      );
      shader.fragmentShader = `varying float vAmbientOpacity;
${shader.fragmentShader}`.replace(
        "#include <color_fragment>",
        "#include <color_fragment>\ndiffuseColor.a *= vAmbientOpacity;",
      );
    };
    material.customProgramCacheKey = () => "octagram-instanced-contour-v1";
    materials.push(material);
    const object = new THREE.LineSegments(geometry, material);
    object.frustumCulled = false;
    object.name = `Instanced outlined ${LOGO_MODULES[sourceIndex].id}`;
    group.add(object);
    wires.push({ object, position, quaternion, scale: size });
    lineUnits.forEach((unit, slot) => {
      unit.slot = slot;
    });

    const solidUnits = units.filter(
      (unit) => unit.source === sourceIndex && unit.solid,
    );
    const solidMaterial = surfaces.materialFor(source);
    solidMaterial.transparent = true;
    const solidGeometry = extrudePath(
      THREE,
      source,
      center,
      scale,
      0.24,
      0.018,
    );
    const solidObject = new THREE.InstancedMesh(
      solidGeometry,
      solidMaterial,
      solidUnits.length,
    );
    solidObject.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    solidObject.frustumCulled = false;
    solidObject.name = `Instanced satin ${LOGO_MODULES[sourceIndex].id}`;
    solidUnits.forEach((unit, slot) => {
      unit.slot = slot;
      solidObject.setColorAt(
        slot,
        new THREE.Color().setScalar(0.48 + unit.opacity * 0.6),
      );
    });
    group.add(solidObject);
    solids.push({ object: solidObject });
  }

  // Service order follows the six expertise accordions: web, custom software,
  // AI, UI/UX, mobile, then IT infrastructure.
  function servicePose(index: number, service: number, target: Three.Vector3) {
    if (service === 0)
      target.set(
        ((index % 8) - 3.5) * 0.43,
        (2 - Math.floor(index / 8)) * 0.45,
        ((index % 3) - 1) * 0.12,
      );
    else if (service === 4) {
      const panel = Math.floor(index / 20),
        inner = index % 20;
      target.set(
        (panel - 0.5) * 1.7 + ((inner % 4) - 1.5) * 0.27,
        (2 - Math.floor(inner / 4)) * 0.54,
        (panel - 0.5) * 0.35,
      );
    } else if (service === 2) {
      const angle = (index / 20) * Math.PI * 2;
      target.set(
        Math.cos(angle) * 1.46,
        Math.sin(angle) * 1.12,
        Math.sin(angle * 2) * 0.47 + (index < 20 ? -0.37 : 0.37),
      );
    } else if (service === 3) {
      const layer = Math.floor(index / 20),
        inner = index % 20;
      target.set(
        ((inner % 5) - 2) * 0.53 + (layer - 0.5) * 0.28,
        (1.5 - Math.floor(inner / 5)) * 0.49 + (layer - 0.5) * 0.2,
        (layer - 0.5) * 1.07,
      );
    } else if (service === 1) {
      const angle = ((index % 8) / 8) * Math.PI * 2,
        layer = Math.floor(index / 8),
        radius = 0.88 + layer * 0.12;
      target.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        (layer - 2) * 0.36,
      );
    } else {
      // A central core connects four edge clusters through visible bridge units.
      // All forty pieces participate: eight core, twenty-four edge, eight links.
      if (index < 8) {
        target.set(
          ((index % 2) - 0.5) * 0.36,
          ((Math.floor(index / 2) % 2) - 0.5) * 0.36,
          (Math.floor(index / 4) - 0.5) * 0.36,
        );
      } else {
        const bridge = index >= 32;
        const cluster = Math.floor(
          (index - (bridge ? 32 : 8)) / (bridge ? 2 : 6),
        );
        const x = (cluster % 2 === 0 ? -1 : 1) * 1.3;
        const y = (cluster < 2 ? 1 : -1) * 0.82;
        const z = (cluster % 2 === 0 ? -1 : 1) * 0.36;
        if (bridge) {
          const distance = index % 2 === 0 ? 0.4 : 0.7;
          target.set(x * distance, y * distance, z * distance);
        } else {
          const rack = (index - 8) % 6;
          target.set(
            x + ((rack % 2) - 0.5) * 0.32,
            y + (Math.floor(rack / 2) - 1) * 0.32,
            z,
          );
        }
      }
    }
  }
  let tunnel = 0;
  const tunnelPosition = new THREE.Vector3();
  const target = new THREE.Vector3(),
    rotation = new THREE.Euler(),
    quaternion = new THREE.Quaternion();
  const matrix = new THREE.Matrix4(),
    scaleVector = new THREE.Vector3();
  const update = (
    time = 0,
    _progress = 0.5,
    pointer: ScenePointer = { x: 0, y: 0 },
    reduced = false,
  ) => {
    const t = reduced ? 0 : time;
    const delta =
      previousTime === null ? 1 / 60 : clamp(time - previousTime, 0, 0.05);
    previousTime = time;
    transitionElapsed = reduced
      ? 1
      : Math.min(1, transitionElapsed + delta / 0.9);
    const transition = smooth(0, 1, transitionElapsed),
      serviceActive = selectedService !== -1;
    const pointerX = reduced ? 0 : clamp(pointer.x || 0, -1, 1),
      pointerY = reduced ? 0 : clamp(pointer.y || 0, -1, 1);
    const visibleCount = Math.round(count * (0.48 + quality * 0.52));
    for (const unit of units) {
      const { index, phase, depth } = unit;
      let targetScale: number;
      if (serviceActive) {
        servicePose(index % 40, selectedService, target);
        rotation.set(0, 0, 0);
        targetScale = index < 40 ? 0.25 : 0;
      } else {
        const halfHeight = (10 - depth) * Math.tan((25 * Math.PI) / 180);
        target.set(unit.ux * halfHeight * aspect, unit.uy * halfHeight, depth);
        target.x += Math.sin(t * 0.055 + phase) * 0.06 + pointerX * 0.12;
        target.y += Math.cos(t * 0.04 + phase) * 0.05 - pointerY * 0.12;
        if (tunnel > 0) {
          const angle = phase + _progress * 0.9;
          const radius = 3.4 + (index % 5) * 0.35;
          tunnelPosition.set(
            Math.cos(angle) * radius * Math.min(aspect, 1.5),
            Math.sin(angle) * radius,
            -14 + (index % 13) * 1.2 + Math.sin(_progress * Math.PI) * 1.8,
          );
          target.lerp(tunnelPosition, tunnel);
        }
        rotation.set(0, 0, 0);
        targetScale =
          index < visibleCount ? unit.width * (mobile ? 0.7 : 1) : 0;
      }
      quaternion.setFromEuler(rotation);
      unit.position.lerpVectors(unit.fromPosition, target, transition);
      unit.quaternion.slerpQuaternions(
        unit.fromQuaternion,
        quaternion,
        transition,
      );
      unit.scale = unit.fromScale + (targetScale - unit.fromScale) * transition;
      if (unit.solid) {
        scaleVector.setScalar(unit.scale);
        matrix.compose(unit.position, unit.quaternion, scaleVector);
        solids[unit.source].object.setMatrixAt(unit.slot, matrix);
      } else {
        const batch = wires[unit.source];
        batch.position.setXYZ(
          unit.slot,
          unit.position.x,
          unit.position.y,
          unit.position.z,
        );
        batch.quaternion.setXYZW(
          unit.slot,
          unit.quaternion.x,
          unit.quaternion.y,
          unit.quaternion.z,
          unit.quaternion.w,
        );
        batch.scale.setX(unit.slot, unit.scale);
      }
    }
    for (const batch of wires) {
      batch.position.needsUpdate = true;
      batch.quaternion.needsUpdate = true;
      batch.scale.needsUpdate = true;
    }
    for (const batch of solids) batch.object.instanceMatrix.needsUpdate = true;
  };
  const setService = (index: number | null) => {
    const next =
      typeof index === "number" &&
      Number.isInteger(index) &&
      index >= 0 &&
      index < 6
        ? index
        : -1;
    if (next === selectedService) return;
    for (const unit of units) {
      unit.fromPosition.copy(unit.position);
      unit.fromQuaternion.copy(unit.quaternion);
      unit.fromScale = unit.scale;
    }
    selectedService = next;
    transitionElapsed = 0;
  };
  const disposeScene = sceneDisposer(group, surfaces);
  update(0, 0.5, { x: 0, y: 0 }, true);
  group.userData.instanceCount = count;
  group.userData.drawCalls = 16;
  return {
    group,
    update,
    setService,
    setTunnel(value: number) {
      tunnel = clamp(value);
    },
    setQuality(value: number) {
      quality = clamp(value);
    },
    setViewport(width: number, height: number) {
      aspect = width / Math.max(1, height);
      mobile = width < 768;
    },
    dispose() {
      disposeScene();
      materials.forEach((material) => material.dispose());
    },
  };
}
