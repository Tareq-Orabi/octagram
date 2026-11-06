"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import type { SceneModel, SceneName, ScenePointer } from "@/three/types";
import {
  evaluateNarrative,
  narrativeProgress,
  type ShotPose,
} from "@/three/choreography";
import CinematicPost from "./CinematicPost";

type Surface = THREE.Material & {
  uniforms?: Record<string, { value: unknown }>;
};
type SavedSurface = { material: Surface; opacity: number; depthWrite: boolean };
type ManagedModel = {
  name: SceneName;
  model: SceneModel;
  surfaces: SavedSurface[];
};
type SectionId =
  | "home"
  | "about"
  | "manifesto"
  | "vision"
  | "jordan"
  | "team"
  | "expertise"
  | "work"
  | "contact";
type Bounds = Record<SectionId, { top: number; height: number }>;
const sectionIds: SectionId[] = [
  "home",
  "about",
  "manifesto",
  "vision",
  "jordan",
  "team",
  "expertise",
  "work",
  "contact",
];
const clearSceneFlags = () =>
  document.documentElement.classList.remove(
    "has-webgl",
    "has-brain",
    "has-modules",
    "has-logo",
    "has-globe",
  );

function captureSurfaces(model: SceneModel): SavedSurface[] {
  const materials = new Set<Surface>();
  model.group.traverse((object) => {
    if (!("material" in object)) return;
    const material = (object as THREE.Mesh).material;
    (Array.isArray(material) ? material : [material]).forEach((entry) =>
      materials.add(entry),
    );
  });
  return [...materials].map((material) => ({
    material,
    opacity:
      typeof material.uniforms?.uOpacity?.value === "number"
        ? material.uniforms.uOpacity.value
        : material.opacity,
    depthWrite: material.depthWrite,
  }));
}

function fade(entry: ManagedModel | undefined, opacity: number) {
  if (!entry) return;
  const { model, surfaces } = entry;
  model.group.visible = opacity > 0.002;
  for (const surface of surfaces)
    surface.material.depthWrite = opacity > 0.98 && surface.depthWrite;
  if (model.setOpacity) {
    model.setOpacity(opacity);
    return;
  }
  for (const surface of surfaces) {
    surface.material.transparent = true;
    if (surface.material.uniforms?.uOpacity)
      surface.material.uniforms.uOpacity.value = surface.opacity * opacity;
    else surface.material.opacity = surface.opacity * opacity;
  }
}

function pose(entry: ManagedModel | undefined, shot: ShotPose) {
  if (!entry) return;
  entry.model.group.position.set(shot.x, shot.y, shot.z);
  entry.model.group.scale.setScalar(shot.scale);
  entry.model.group.rotation.set(shot.pitch, shot.yaw, 0, "YXZ");
}

class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    clearSceneFlags();
    window.dispatchEvent(
      new CustomEvent("octagram:ready", { detail: "fallback" }),
    );
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function SceneDirector({ quality }: { quality: number }) {
  const { gl, camera, invalidate, size } = useThree();
  const [loaded, setLoaded] = useState<ManagedModel[]>([]);
  const models = useRef<Partial<Record<SceneName, ManagedModel>>>({});
  const pending = useRef(new Set<SceneName>());
  const bounds = useRef<Bounds>({} as Bounds);
  const scrolling = useRef({ position: 0 });
  const pointer = useRef<ScenePointer>({ x: 0, y: 0 });
  const smoothedPointer = useRef<ScenePointer>({ x: 0, y: 0 });
  const pointerActive = useRef(false);
  const entrance = useRef({ progress: 0 });
  const menuOpen = useRef(false);
  const hidden = useRef(false);
  const lost = useRef(false);
  const alive = useRef(true);
  const generation = useRef(0);
  const qualityRef = useRef(quality);
  const lightRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);

  const ensure = useCallback(
    async (name: SceneName) => {
      if (models.current[name] || pending.current.has(name)) return;
      pending.current.add(name);
      const startedInGeneration = generation.current;
      let model: SceneModel | undefined;
      try {
        if (name === "brain")
          model = (await import("@/three/organic-scenes")).createBrain(THREE);
        else if (name === "globe")
          model = (await import("@/three/globe-scene")).createGlobe(THREE);
        else if (name === "logo")
          model = await (await import("@/three/logo-scene")).createLogoAsset();
        else
          model = await (
            await import("@/three/modular-scenes")
          ).createModules(THREE);
        if (model.ready) await model.ready;
        if (!alive.current || startedInGeneration !== generation.current) {
          model.dispose?.();
          return;
        }
        model.setViewport?.(
          gl.domElement.clientWidth,
          gl.domElement.clientHeight,
        );
        model.group.visible = false;
        model.setQuality?.(qualityRef.current);
        const entry: ManagedModel = {
          name,
          model,
          surfaces: captureSurfaces(model),
        };
        models.current[name] = entry;
        setLoaded(
          Object.values(models.current).filter((value): value is ManagedModel =>
            Boolean(value),
          ),
        );
        document.documentElement.classList.add(`has-${name}`);
        document.documentElement.classList.remove(`fallback-${name}`);
        if (models.current.brain && !lost.current)
          document.documentElement.classList.add("has-webgl");
        if (name === "brain")
          window.dispatchEvent(
            new CustomEvent("octagram:ready", { detail: "brain" }),
          );
        invalidate();
      } catch (error) {
        model?.dispose?.();
        if (!alive.current || startedInGeneration !== generation.current)
          return;
        document.documentElement.classList.add(`fallback-${name}`);
        if (name === "brain")
          window.dispatchEvent(
            new CustomEvent("octagram:ready", { detail: "fallback" }),
          );
        console.warn(`Octagram: ${name} uses its static artwork.`, error);
      }
    },
    [gl, invalidate],
  );

  useEffect(() => {
    qualityRef.current = quality;
    Object.values(models.current).forEach((entry) =>
      entry?.model.setQuality?.(quality),
    );
    invalidate();
  }, [quality, invalidate]);

  useEffect(() => {
    Object.values(models.current).forEach((entry) =>
      entry?.model.setViewport?.(size.width, size.height),
    );
    invalidate();
  }, [size.width, size.height, invalidate]);

  useEffect(() => {
    generation.current += 1;
    alive.current = true;
    hidden.current = document.hidden;
    const measure = () => {
      for (const id of sectionIds) {
        const section = document.getElementById(id);
        bounds.current[id] = {
          top: section
            ? section.getBoundingClientRect().top + window.scrollY
            : Number.MAX_SAFE_INTEGER,
          height: section?.offsetHeight ?? innerHeight,
        };
      }
      invalidate();
    };
    measure();
    scrolling.current.position = window.scrollY;
    entrance.current.progress = document.documentElement.classList.contains(
      "experience-entered",
    )
      ? 1
      : 0;
    const enter = () => {
      gsap.killTweensOf(entrance.current);
      gsap.to(entrance.current, {
        progress: 1,
        duration: 3,
        ease: "none",
        onUpdate: invalidate,
      });
      invalidate();
    };
    // Native scrolling owns document position. Only the sculpture camera is damped;
    // measuring an expanding card must never reset an anchor or the viewport.
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerActive.current = true;
      pointer.current.x = (event.clientX / innerWidth - 0.5) * 2;
      pointer.current.y = (event.clientY / innerHeight - 0.5) * 2;
    };
    const onPointerLeave = () => {
      pointerActive.current = false;
      pointer.current = { x: 0, y: 0 };
    };
    const onMenu = (event: Event) => {
      menuOpen.current = Boolean((event as CustomEvent<boolean>).detail);
      if (!menuOpen.current) invalidate();
    };
    const onVisibility = () => {
      hidden.current = document.hidden;
      if (!hidden.current) invalidate();
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      lost.current = true;
      clearSceneFlags();
      window.dispatchEvent(
        new CustomEvent("octagram:ready", { detail: "fallback" }),
      );
    };
    const onRestored = () => {
      lost.current = false;
      Object.keys(models.current).forEach((name) =>
        document.documentElement.classList.add(`has-${name}`),
      );
      if (models.current.brain)
        document.documentElement.classList.add("has-webgl");
      gl.toneMappingExposure = 1.12;
      invalidate();
    };
    const onPageShow = () => {
      scrolling.current.position = window.scrollY;
      measure();
      invalidate();
    };
    // Re-measure geometry only; never write scroll position during layout changes.
    let refreshTimer: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(measure, 80);
    });
    const main = document.querySelector("main");
    if (main) resizeObserver.observe(main);
    void document.fonts.ready.then(() => {
      if (alive.current) measure();
    });
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("octagram:entered", enter);
    window.addEventListener("octagram:menu", onMenu);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    gl.domElement.addEventListener("webglcontextlost", onLost);
    gl.domElement.addEventListener("webglcontextrestored", onRestored);
    gl.toneMappingExposure = 1.12;
    void ensure("brain");
    void ensure("modules");
    return () => {
      alive.current = false;
      generation.current += 1;
      gsap.killTweensOf(entrance.current);
      resizeObserver.disconnect();
      clearTimeout(refreshTimer);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("octagram:entered", enter);
      window.removeEventListener("octagram:menu", onMenu);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.domElement.removeEventListener("webglcontextlost", onLost);
      gl.domElement.removeEventListener("webglcontextrestored", onRestored);
      Object.values(models.current).forEach((entry) =>
        entry?.model.dispose?.(),
      );
      models.current = {};
      pending.current.clear();
      clearSceneFlags();
      setLoaded([]);
    };
  }, [ensure, gl, invalidate]);

  useFrame(({ clock }, delta) => {
    if (hidden.current || lost.current || menuOpen.current) return;
    const b = bounds.current;
    if (!b.vision) return;
    const h = size.height,
      mobile = size.width < 768;
    scrolling.current.position = THREE.MathUtils.damp(
      scrolling.current.position,
      window.scrollY,
      2.4,
      Math.min(delta, 0.06),
    );
    const y = scrolling.current.position,
      time = clock.elapsedTime * 0.65;
    const actualScroll = window.scrollY;
    const progress = narrativeProgress(y, b, h);
    if (progress > 1.7 || actualScroll + h * 2 > b.vision.top)
      void ensure("logo");
    if (progress > 2.7 || actualScroll + h * 2 > b.jordan.top)
      void ensure("globe");
    const current = evaluateNarrative(progress, mobile);
    const damping = 1 - Math.exp(-4 * Math.min(delta, 0.06));
    const input = smoothedPointer.current;
    input.x += (pointer.current.x - input.x) * damping;
    input.y += (pointer.current.y - input.y) * damping;
    const m = models.current;

    m.brain?.model.setReveal?.(entrance.current.progress);
    if (current.brain.opacity > 0.002)
      m.brain?.model.update(
        time,
        progress,
        pointerActive.current ? input : { x: 20, y: 20 },
        false,
      );
    pose(m.brain, current.brain);
    fade(m.brain, current.brain.opacity);

    m.logo?.model.update(time, current.assembly, input, false);
    pose(m.logo, current.logo);
    fade(m.logo, current.logo.opacity * (actualScroll < b.team.top ? 1 : 0));

    m.globe?.model.update(time, progress, input, false);
    pose(m.globe, current.globe);
    const narrativeExit = THREE.MathUtils.clamp(
      (b.team.top - h * 0.1 - actualScroll) / (h * 0.4),
      0,
      1,
    );
    fade(m.globe, current.globe.opacity * narrativeExit);

    if (m.modules) {
      m.modules.model.setTunnel?.(current.tunnel);
      m.modules.model.update(time, progress, input, false);
      m.modules.model.group.position.set(0, 0, 0);
      fade(
        m.modules,
        current.ambientOpacity *
          entrance.current.progress *
          (actualScroll >= b.team.top - h * 0.3 ? 0.16 : 1),
      );
    }
    // Suppress camera tilt while the upright mark is visible.
    const cameraMotion = Math.max(0, 1 - current.logo.opacity * 4);
    camera.rotation.y +=
      (-0.025 * input.x * cameraMotion - camera.rotation.y) * damping;
    camera.rotation.x +=
      (-0.018 * input.y * cameraMotion - camera.rotation.x) * damping;
    camera.position.z = current.cameraZ;
    const canvas = gl.domElement;
    canvas.dataset.progress = progress.toFixed(3);
    canvas.dataset.brainParticles = String(
      m.brain?.model.group.userData.particleCount ?? 0,
    );
    if (m.logo)
      canvas.dataset.logoRotation = m.logo.model.group.rotation
        .toArray()
        .slice(0, 3)
        .join(",");
    canvas.dataset.choreography = "cinematic-turn";
    canvas.dataset.brainYaw = current.brain.yaw.toFixed(3);
    canvas.dataset.scrollScrub = "native-damped";
    canvas.dataset.logoAssembly = current.assembly.toFixed(3);
    canvas.dataset.brainDepth = current.brain.z.toFixed(3);
    canvas.dataset.globeDepth = current.globe.z.toFixed(3);
    // Keep the existing living materials and ambient pieces animated. Pausing,
    // reduced motion, hidden documents and the menu still suspend this loop.
    invalidate();
  });

  return (
    <>
      <ambientLight ref={lightRef} color="#ffffff" intensity={1.7} />
      <directionalLight
        ref={keyRef}
        color="#ffeadb"
        intensity={3}
        position={[3, 4, 6]}
      />
      <directionalLight
        ref={rimRef}
        color="#9ec6b4"
        intensity={1.25}
        position={[-4, -1, 3]}
      />
      {loaded.map(({ name, model }) => (
        <primitive key={name} object={model.group} dispose={null} />
      ))}
    </>
  );
}

function FrameMetrics({ onSample }: { onSample: (fps: number) => void }) {
  const sample = useRef({ elapsed: 0, frames: 0 });
  useFrame((_state, delta) => {
    if (delta <= 0 || delta > 0.1) return;
    sample.current.elapsed += delta;
    sample.current.frames += 1;
    if (sample.current.elapsed >= 1) {
      onSample(sample.current.frames / sample.current.elapsed);
      sample.current = { elapsed: 0, frames: 0 };
    }
  });
  return null;
}

export default function Experience({ onFailure }: { onFailure: () => void }) {
  const maximumDpr = Math.min(
    window.devicePixelRatio || 1,
    innerWidth < 600 ? 1.35 : 1.75,
  );
  const [dpr, setDpr] = useState(maximumDpr);
  const [quality, setQuality] = useState(1);
  const stage = useRef<HTMLDivElement>(null);
  const performance = useCallback(
    ({ fps, factor }: { fps: number; factor: number }) => {
      if (stage.current) {
        stage.current.dataset.fps = fps.toFixed(1);
        stage.current.dataset.quality = factor.toFixed(2);
      }
    },
    [],
  );
  const sample = useCallback((fps: number) => {
    if (stage.current) stage.current.dataset.fps = fps.toFixed(1);
  }, []);
  return (
    <div
      ref={stage}
      className="experience-stage"
      aria-hidden="true"
      data-renderer="webgl2"
      data-quality={quality}
    >
      <SceneBoundary onFailure={onFailure}>
        <Canvas
          id="experience-canvas"
          frameloop="demand"
          dpr={dpr}
          camera={{ fov: 50, near: 0.1, far: 80, position: [0, 0, 10] }}
          gl={{
            alpha: true,
            antialias: innerWidth > 600,
            powerPreference:
              innerWidth < 768 ? "low-power" : "high-performance",
          }}
          fallback={<span />}
          onCreated={({ gl }) => {
            gl.setClearColor(0, 0);
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
          }}
        >
          <PerformanceMonitor
            bounds={() => [36, 55]}
            flipflops={3}
            onIncline={performance}
            onDecline={performance}
            onChange={(api) => {
              performance(api);
              setQuality(0.55 + api.factor * 0.45);
              setDpr(Math.min(maximumDpr, 0.9 + api.factor * 0.85));
            }}
            onFallback={(api) => {
              performance(api);
              setQuality(0.5);
              setDpr(1);
            }}
          >
            <SceneDirector quality={quality} />
            <FrameMetrics onSample={sample} />
            <CinematicPost quality={quality} />
          </PerformanceMonitor>
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
