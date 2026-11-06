"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/** One adaptive optical pass. HTML stays untouched, and alpha preserves the dark page background. */
export default function CinematicPost({ quality }: { quality: number }) {
  const { gl, size, viewport } = useThree();
  const optics = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
      depthBuffer: true,
      stencilBuffer: false,
    });
    target.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
    const material = new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      transparent: false,
      blending: THREE.NoBlending,
      uniforms: {
        tColor: { value: target.texture },
        tDepth: { value: target.depthTexture },
        uTexel: { value: new THREE.Vector2(1, 1) },
        uNear: { value: 0.1 },
        uFar: { value: 80 },
        uFocus: { value: 10 },
        uTime: { value: 0 },
        uQuality: { value: 1 },
      },
      vertexShader: `varying vec2 vUv;
        void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D tColor;
        uniform sampler2D tDepth;
        uniform vec2 uTexel;
        uniform float uNear,uFar,uFocus,uTime,uQuality;
        float cameraDepth(float depth){return (uNear*uFar)/(uFar-depth*(uFar-uNear));}
        float grain(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+floor(uTime*18.)*.37)*43758.5453);}
        void main(){
          vec4 source=texture2D(tColor,vUv);
          float rawDepth=texture2D(tDepth,vUv).r;
          float depth=cameraDepth(rawDepth);
          // The complete brain stays inside a generous sharp focal band.
          // Defocus is reserved for the close ambient shapes and distant layers.
          float defocus=max(0.,abs(depth-uFocus)-4.);
          float coc=rawDepth>.9999?0.:clamp(defocus/max(depth,1.)*1.8,0.,2.5);
          vec4 color=source*2.;
          float total=2.;
          vec3 glow=vec3(0.);
          for(int i=0;i<6;i++){
            float angle=float(i)*1.04719755;
            vec2 offset=vec2(cos(angle),sin(angle))*uTexel;
            vec4 tap=texture2D(tColor,vUv+offset*coc*uQuality);
            color+=tap;total+=1.;
            vec3 halo=texture2D(tColor,vUv+offset*2.5).rgb;
            glow+=max(halo-vec3(.82),vec3(0.));
          }
          color/=total;
          color.rgb+=glow*.018*color.a;
          color.rgb+=(grain(gl_FragCoord.xy)-.5)*.006*color.a;
          // The transparent scene target stores premultiplied color. Optical
          // output transforms operate on straight color, then restore coverage.
          gl_FragColor=vec4(max(color.rgb,vec3(0.))/max(color.a,.0001),color.a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          gl_FragColor.rgb*=gl_FragColor.a;
        }`,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, material);
    quad.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(quad);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    return { target, material, geometry, scene, camera };
  }, []);

  useEffect(() => {
    const width = Math.max(1, Math.round(size.width * viewport.dpr));
    const height = Math.max(1, Math.round(size.height * viewport.dpr));
    const samples =
      quality >= 0.8 && size.width >= 800
        ? Math.min(2, gl.capabilities.maxSamples)
        : 0;
    if (optics.target.samples !== samples) {
      optics.target.dispose();
      optics.target.samples = samples;
    }
    optics.target.setSize(width, height);
    optics.material.uniforms.uTexel.value.set(1 / width, 1 / height);
  }, [optics, gl, quality, size.width, size.height, viewport.dpr]);

  useEffect(
    () => () => {
      optics.target.dispose();
      optics.target.depthTexture?.dispose();
      optics.material.dispose();
      optics.geometry.dispose();
    },
    [optics],
  );

  useFrame(({ scene, camera, clock }) => {
    // This frame is requested by the scene director. No independent render loop.
    if (size.width < 800 || quality < 0.68) {
      gl.render(scene, camera);
      return;
    }
    const uniforms = optics.material.uniforms;
    uniforms.uNear.value = (camera as THREE.PerspectiveCamera).near;
    uniforms.uFar.value = (camera as THREE.PerspectiveCamera).far;
    uniforms.uFocus.value = camera.position.z;
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uQuality.value = quality;
    const previousTarget = gl.getRenderTarget();
    gl.setRenderTarget(optics.target);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(previousTarget);
    gl.clear();
    gl.render(optics.scene, optics.camera);
  }, 1);

  return null;
}
