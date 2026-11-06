import type * as Three from "three";
import { clamp, disposeGroup } from "./scene-utils";

type ThreeModule = typeof Three;
import {
  BRAIN_PARTICLE_COUNT as PARTICLE_COUNT,
  REFERENCE_PARTICLE_COUNT,
  expandReferencePositions,
  referenceParticleIndex,
} from "./particle-density";

/** 20,000 particles retain the reference brain's anatomy and hollow mesh.
 * Coordinate scale is unchanged: (EXR.rgb - 0.5) * 8.7, +Y up.
 * The narrative director owns all parent transforms and scroll-driven depth paths.
 * Source URLs, extraction conventions and rights are recorded in assets/source/brain/PROVENANCE.md.
 */
const ASSET = "/assets/models/brain-reference.bin";
const POINTER_OFF = 20;
let assetPromise: Promise<ArrayBuffer> | undefined;
function loadAsset() {
  return (assetPromise ??= fetch(ASSET)
    .then((response) => {
      if (!response.ok) throw new Error(`Brain asset: HTTP ${response.status}`);
      return response.arrayBuffer();
    })
    .catch((error) => {
      assetPromise = undefined;
      throw error;
    }));
}
export async function loadReferenceGlobePositions() {
  const response = await fetch("/assets/models/brain-globe-target.bin");
  if (!response.ok)
    throw new Error(`Globe morph target: HTTP ${response.status}`);
  return expandReferencePositions(
    new Float32Array(await response.arrayBuffer()),
  );
}
function seededRandom(seed = 915709) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hsv(r: number, g: number, b: number) {
  const v = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = v - min;
  let h = 0;
  if (d)
    h =
      (v === r
        ? (g - b) / d + (g < b ? 6 : 0)
        : v === g
          ? (b - r) / d + 2
          : (r - g) / d + 4) / 6;
  return { h, s: v ? d / v : 0, v };
}

export function createBrain(THREE: ThreeModule) {
  const group = new THREE.Group();
  group.name = "reference-brain";
  let disposed = false,
    quality = 1,
    reveal = 1,
    spread = 0,
    morph = 0;
  let previousTime = 0,
    previousX = POINTER_OFF,
    previousY = POINTER_OFF;
  let source = new Float32Array(0),
    sourceColors = new Float32Array(0),
    centers = new Float32Array(0);
  let velocities = new Float32Array(0),
    randoms = new Float32Array(0),
    targets: Float32Array | null = null;
  let geometry: Three.InstancedBufferGeometry | null = null;
  let centerAttribute: Three.InstancedBufferAttribute | null = null;
  const viewport = new THREE.Vector2(1, 1);
  const uniforms = {
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uReveal: { value: 1 },
    uSpread: { value: 0 },
    uPointer: { value: new THREE.Vector2(POINTER_OFF, POINTER_OFF) },
    uVelocity: { value: new THREE.Vector2() },
    uAspect: { value: 1 },
    uInteractive: { value: 1 },
    uParticleScale: { value: 1.55 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: true,
    depthTest: true,
    vertexShader: `${SIMPLEX_NOISE}
      attribute vec3 aCenter;
      attribute vec3 aColor;
      attribute vec3 aRandom;
      attribute float aScale;
      uniform float uTime, uReveal, uSpread, uAspect, uInteractive, uParticleScale;
      uniform vec2 uPointer, uVelocity;
      varying vec3 vColor;
      varying float vDepth, vReveal;
      vec3 rotateParticle(vec3 p, float angle) {
        vec3 axis=normalize(vec3(0.,1.,1.));
        return p*cos(angle)+cross(axis,p)*sin(angle)+axis*dot(axis,p)*(1.-cos(angle));
      }
      void main() {
        vec4 centerView=modelViewMatrix*vec4(aCenter,1.);
        vec4 centerClip=projectionMatrix*centerView;
        vec2 distanceVector=(centerClip.xy/centerClip.w-uPointer)*vec2(uAspect,1.);
        float radius=.27+min(.15,length(uVelocity)*.04);
        float influence=(1.-smoothstep(0.,radius,length(distanceVector)))*uInteractive*(1.-uSpread);
        vec2 ripple=vec2(sin(uTime*(.2+aRandom.y*.8)),cos(uTime*(.2+aRandom.y*.8)));
        centerView.xy+=influence*(ripple*(.18+aRandom.z*.17)+uVelocity*.30);
        float stagger=clamp(uReveal*1.5-aRandom.x*.5,0.,1.);
        float show=stagger*stagger*(3.-2.*stagger);
        float scale=.1*(aScale*uParticleScale+influence*.75)*show;
        vec3 local=rotateParticle(position,snoise(aCenter*.619)+uTime)*scale;
        vec4 view=centerView+modelViewMatrix*vec4(local,0.);
        gl_Position=projectionMatrix*view;
        vColor=aColor;
        vDepth=view.z+10.;
        vReveal=show;
      }`,
    fragmentShader: `uniform float uOpacity;
      varying vec3 vColor;
      varying float vDepth, vReveal;
      void main(){
        float depthFade=smoothstep(-4.5,4.,vDepth);
        float alpha=depthFade*uOpacity*vReveal;
        if(alpha<.008)discard;
        gl_FragColor=vec4(vColor,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });

  function applyBrandColors() {
    if (!geometry || !sourceColors.length) return;
    const output = geometry.getAttribute(
      "aColor",
    ) as Three.InstancedBufferAttribute;
    // Preserve the source's per-particle clusters and brightness; only hue families change.
    const coral = new THREE.Color("#f5746f"),
      peach = new THREE.Color("#f9b096");
    const orange = new THREE.Color("#f38c31"),
      lime = new THREE.Color("#f4e96c");
    const mint = new THREE.Color("#9ac6b4"),
      teal = new THREE.Color("#3f8f91");
    const color = new THREE.Color();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const { h, s, v } = hsv(
        sourceColors[i * 3],
        sourceColors[i * 3 + 1],
        sourceColors[i * 3 + 2],
      );
      if (s < 0.17) {
        color.copy(i % 3 === 0 ? mint : peach);
        color.lerp(new THREE.Color("#fff2d5"), 0.48);
      } else if (h < 0.08) color.copy(coral).lerp(orange, h / 0.08);
      else if (h < 0.21) color.copy(orange).lerp(lime, (h - 0.08) / 0.13);
      else if (h < 0.4) color.copy(lime).lerp(mint, (h - 0.21) / 0.19);
      else if (h < 0.72) color.copy(mint).lerp(teal, clamp((h - 0.4) / 0.16));
      else color.copy(coral).lerp(peach, clamp((h - 0.72) / 0.28) * 0.45);
      // Source-color luminance is retained without importing the reference's purple hue.
      color.multiplyScalar((0.34 + Math.pow(v, 0.78) * 1.12) * 1.12);
      output.setXYZ(i, color.r, color.g, color.b);
    }
    output.needsUpdate = true;
  }

  const ready = loadAsset().then((buffer) => {
    if (disposed) return;
    const header = new Uint32Array(buffer, 0, 8);
    if (
      header[0] !== 0x4f435442 ||
      header[1] !== 2 ||
      header[2] !== REFERENCE_PARTICLE_COUNT
    )
      throw new Error("Invalid reference brain data");
    const referenceCount = header[2],
      count = PARTICLE_COUNT,
      vertexCount = header[3],
      indexCount = header[4];
    let offset = 32;
    source = expandReferencePositions(
      new Float32Array(buffer, offset, referenceCount * 3),
    );
    offset += referenceCount * 12;
    const referenceScales = new Float32Array(buffer, offset, referenceCount);
    offset += referenceCount * 4;
    const referenceColors = new Float32Array(
      buffer,
      offset,
      referenceCount * 3,
    );
    offset += referenceCount * 12;
    const scales = new Float32Array(count);
    sourceColors = new Float32Array(count * 3);
    for (let index = 0; index < count; index++) {
      const parent = referenceParticleIndex(index);
      scales[index] =
        referenceScales[parent] * (index < referenceCount ? 1 : 0.78);
      sourceColors.set(
        referenceColors.subarray(parent * 3, parent * 3 + 3),
        index * 3,
      );
    }
    const vertices = new Float32Array(buffer, offset, vertexCount * 3);
    offset += vertexCount * 12;
    const indices = new Uint16Array(buffer, offset, indexCount);
    centers = source.slice();
    velocities = new Float32Array(count * 3);
    randoms = new Float32Array(count * 3);
    const random = seededRandom();
    for (let i = 0; i < randoms.length; i++) randoms[i] = random();
    geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    centerAttribute = new THREE.InstancedBufferAttribute(centers, 3).setUsage(
      THREE.DynamicDrawUsage,
    );
    geometry.setAttribute("aCenter", centerAttribute);
    geometry.setAttribute(
      "aScale",
      new THREE.InstancedBufferAttribute(scales, 1),
    );
    geometry.setAttribute(
      "aRandom",
      new THREE.InstancedBufferAttribute(randoms, 3),
    );
    geometry.setAttribute(
      "aColor",
      new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3),
    );
    geometry.instanceCount = Math.round(count * quality);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "20000-hollow-brain-particles";
    group.userData.particleCount = count;
    mesh.frustumCulled = false;
    mesh.onBeforeRender = (renderer) => {
      renderer.getSize(viewport);
      uniforms.uAspect.value = viewport.x / Math.max(1, viewport.y);
      uniforms.uParticleScale.value = viewport.x < 640 ? 1.2 : 1.55;
    };
    group.add(mesh);
    applyBrandColors();
  });

  function update(
    time = 0,
    _progress = 0,
    pointer = { x: POINTER_OFF, y: POINTER_OFF },
    reduced = false,
  ) {
    uniforms.uTime.value = reduced ? 0 : time;
    uniforms.uInteractive.value = reduced ? 0 : 1;
    uniforms.uReveal.value = reduced ? 1 : reveal;
    uniforms.uSpread.value = spread;
    const px = reduced ? POINTER_OFF : pointer.x,
      py = reduced ? POINTER_OFF : -pointer.y;
    if (previousX !== POINTER_OFF && px !== POINTER_OFF) {
      uniforms.uVelocity.value.x +=
        (clamp((px - previousX) * 50, -2, 2) - uniforms.uVelocity.value.x) *
        0.14;
      uniforms.uVelocity.value.y +=
        (clamp((py - previousY) * 50, -2, 2) - uniforms.uVelocity.value.y) *
        0.14;
    }
    uniforms.uPointer.value.set(px, py);
    previousX = px;
    previousY = py;
    const frame = Math.min(2, Math.max(0.1, (time - previousTime) * 60 || 1));
    previousTime = time;
    if (!centerAttribute) return;
    const friction = Math.pow(0.892, frame),
      spring = 0.006 * frame;
    const targetLength = targets?.length ?? 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = i * 3,
        order = randoms[p],
        scatter = 1 + spread * (1 + randoms[p + 1] * 4);
      const enter = reduced ? 1 : clamp(reveal * 1.5 - order * 0.5);
      const radius = 1 + (1 - enter) * (randoms[p + 2] * 1.4 - 0.7);
      for (let k = 0; k < 3; k++) {
        const index = p + k;
        const target =
          targets && targetLength
            ? targets[index % targetLength]
            : source[index];
        const base = source[index] + (target - source[index]) * morph;
        const desired = base * scatter * radius;
        if (reduced) {
          centers[index] = desired;
          velocities[index] = 0;
        } else {
          velocities[index] =
            (velocities[index] + (desired - centers[index]) * spring) *
            friction;
          centers[index] += velocities[index] * frame;
        }
      }
    }
    centerAttribute.needsUpdate = true;
  }
  function setQuality(factor: number) {
    quality = clamp(factor, 0.7, 1);
    if (geometry) geometry.instanceCount = Math.round(PARTICLE_COUNT * quality);
  }
  return {
    group,
    ready,
    update,
    setQuality,
    setReveal: (value: number) => {
      reveal = clamp(value);
    },
    setSpread: (value: number) => {
      spread = clamp(value);
    },
    setOpacity: (value: number) => {
      const opacity = clamp(value);
      uniforms.uOpacity.value = opacity;
      material.depthWrite = opacity > 0.98;
    },
    // Retain the supplied buffer: the director can morph a reusable target without allocation.
    setMorph: (positions: Float32Array, value: number) => {
      targets = positions;
      morph = clamp(value);
    },
    dispose: () => {
      disposed = true;
      disposeGroup(group);
      material.dispose();
    },
  };
}

const SIMPLEX_NOISE = `#define GLSLIFY 1
//
// Description : Array and textureless GLSL 2D/3D/4D simplex 
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20201014 (stegu)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
// 

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+10.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  { 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
  }`;
