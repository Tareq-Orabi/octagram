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
import { measureArtwork } from "@/lib/scene-layout";
import { brainRevealSeconds, initialBrainRevealTime } from "@/lib/experience-preferences";
import type { SceneModel, SceneName, ScenePointer } from "@/three/types";
import {
  framedNarrative,
  sceneProgress,
  rootsGlobePose,
  type ArtworkFrame,
  type VisionWindow,
  type ShotPose,
} from "@/three/choreography";
import CinematicPost from "./CinematicPost";
import { readPassageFrame, subscribePassageFrame } from "@/lib/chapter-playback";
import { sampleLogoSurface } from "@/three/morph-targets";
import { heroPalettes, heroPaletteEvent } from "@/lib/hero-palettes";

const paletteColors = heroPalettes.map(({ tint }) => tint && ({
  shadow: new THREE.Color(tint[0]), mid: new THREE.Color(tint[1]), light: new THREE.Color(tint[2]),
}));

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
type Bounds = Record<SectionId, { top: number; height: number; readHeight?: number }>;
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

function SceneDirector({ quality, compact, onFailure }: { quality: number; compact: boolean; onFailure: () => void }) {
  const { gl, camera, invalidate, size } = useThree();
  const [loaded, setLoaded] = useState<ManagedModel[]>([]);
  const models = useRef<Partial<Record<SceneName, ManagedModel>>>({});
  const logoTargets = useRef<Float32Array | null>(null);
  const solidMix = useRef(0);
  const paletteIndex = useRef(0);
  const paletteMix = useRef(0);
  const [tint] = useState(() => ({
    shadow: new THREE.Color(), mid: new THREE.Color(), light: new THREE.Color(),
  }));
  const pending = useRef(new Set<SceneName>());
  const bounds = useRef<Bounds>({} as Bounds);
  const heroFrame = useRef<ArtworkFrame>(undefined);
  const visionWindow = useRef<VisionWindow>(undefined);
  const rootsFrame = useRef({ offset: 0, left: 0, height: 200, width: 1, sticky: false });
  const stageElement = useRef<HTMLElement | null>(null);
  const clip = useRef("");
  const scrolling = useRef({ position: 0 });
  const pointer = useRef<ScenePointer>({ x: 0, y: 0 });
  const smoothedPointer = useRef<ScenePointer>({ x: 0, y: 0 });
  const pointerActive = useRef(false);
  const entrance = useRef({ elapsed: 0, progress: 0, started: false });
  const heroVisible = useRef(false);
  const nextFrame = useRef(0);
  const debug = useRef(false);
  const globeScene = useRef({ elapsed: 0, visible: false });
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
          model = (await import("@/three/organic-scenes")).createBrain(THREE, compact);
        else if (name === "globe")
          model = (await import("@/three/globe-scene")).createGlobe(THREE);
        else if (name === "logo")
          model = await (await import("@/three/logo-scene")).createLogoAsset(THREE, compact);
        else
          model = await (
            await import("@/three/modular-scenes")
          ).createModules(THREE, compact);
        if (model.ready) await model.ready;
        if (!alive.current || startedInGeneration !== generation.current) {
          model.dispose?.();
          return;
        }
        if (name === "logo") {
          // Sample the original, fully assembled extrusion once. Both particle
          // and solid representations then share the same local coordinates.
          model.update(0, 1, { x: 0, y: 0 }, true);
          logoTargets.current = sampleLogoSurface(model.group, compact ? 10_000 : undefined, 1);
        }
        const viewport = gl.getSize(new THREE.Vector2());
        model.setViewport?.(viewport.x, viewport.y);
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
        window.dispatchEvent(new CustomEvent("octagram:ready", { detail: name }));
        invalidate();
      } catch (error) {
        model?.dispose?.();
        if (!alive.current || startedInGeneration !== generation.current)
          return;
        document.documentElement.classList.add(`fallback-${name}`);
        if (name === "brain") {
          window.dispatchEvent(new CustomEvent("octagram:ready", { detail: "fallback" }));
          if (compact) onFailure();
        }
        console.warn(`Octagram: ${name} uses its static artwork.`, error);
      }
    },
    [compact, gl, invalidate, onFailure],
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

  useEffect(() => subscribePassageFrame(invalidate), [invalidate]);

  useEffect(() => {
    function setPalette(id: string | undefined) {
      paletteIndex.current = Math.max(0, heroPalettes.findIndex(item => item.id === id));
      invalidate();
    }
    function receivePalette(event: Event) {
      setPalette((event as CustomEvent<string>).detail);
    }
    setPalette(document.getElementById("home")?.dataset.heroPalette);
    window.addEventListener(heroPaletteEvent, receivePalette);
    return () => window.removeEventListener(heroPaletteEvent, receivePalette);
  }, [invalidate]);

  useEffect(() => {
    generation.current += 1;
    alive.current = true;
    hidden.current = document.hidden;
    const measure = () => {
      for (const id of sectionIds) {
        const section = id === "jordan"
          ? document.querySelector<HTMLElement>(".roots-handoff > .jordan")
          : document.getElementById(id);
        // A sticky section's live rect moves with the viewport. Its wrapper
        // retains the original document position, including on deep links.
        const anchor =
          id === "jordan"
            ? section?.closest(".roots-handoff") ?? section
            : section;
        bounds.current[id] = {
          top: anchor
            ? anchor.getBoundingClientRect().top + window.scrollY
            : Number.MAX_SAFE_INTEGER,
          height: section?.offsetHeight ?? innerHeight,
          readHeight: id === "vision" ? section?.querySelector<HTMLElement>(".vision-frame")?.offsetHeight : undefined,
        };
      }
      if (compact) {
        const heroPoster = document.querySelector<HTMLElement>(".brain-poster");
        const vision = document.querySelector<HTMLElement>(".vision-frame");
        const poster = vision?.querySelector<HTMLElement>(".logo-poster");
        heroFrame.current = heroPoster ? measureArtwork(heroPoster, -window.scrollY, 108 / 102) : undefined;
        visionWindow.current = vision && poster ? {
          ...measureArtwork(poster, vision.getBoundingClientRect().top),
          ...bounds.current.vision,
          readingHeight: bounds.current.vision.readHeight ?? innerHeight,
          sticky: getComputedStyle(vision).position === "sticky",
        } : undefined;
      }
      const roots = document.querySelector<HTMLElement>(".roots-handoff > .jordan");
      const planetWindow = roots?.querySelector<HTMLElement>(".roots-planet-window");
      if (roots && planetWindow) {
        const rect = planetWindow.getBoundingClientRect();
        rootsFrame.current = {
          offset: rect.top - roots.getBoundingClientRect().top,
          left: rect.left,
          height: rect.height,
          width: rect.width,
          sticky: getComputedStyle(roots).position === "sticky",
        };
      }
      invalidate();
    };
    stageElement.current = gl.domElement.closest<HTMLElement>(".experience-stage");
    measure();
    scrolling.current.position = window.scrollY;
    const root = document.documentElement;
    debug.current = new URLSearchParams(location.search).has("debugmotion");
    heroVisible.current = root.dataset.heroVisible === "true";
    const revealHero = () => {
      heroVisible.current = true;
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
      if (!compact) event.preventDefault();
      lost.current = true;
      clearSceneFlags();
      window.dispatchEvent(
        new CustomEvent("octagram:ready", { detail: "fallback" }),
      );
      if (compact) onFailure();
    };
    const onRestored = () => {
      lost.current = false;
      Object.keys(models.current).forEach((name) =>
        document.documentElement.classList.add(`has-${name}`),
      );
      if (heroVisible.current && entrance.current.started && models.current.brain)
        root.classList.add("has-webgl");
      gl.toneMappingExposure = 1.12;
      invalidate();
    };
    const onPageShow = () => {
      scrolling.current.position = window.scrollY;
      measure();
      invalidate();
    };
    const onScroll = () => {
      clearTimeout(nextFrame.current);
      nextFrame.current = 0;
      if (heroVisible.current) invalidate();
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
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("octagram:hero-visible", revealHero);
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
      clearTimeout(nextFrame.current);
      resizeObserver.disconnect();
      clearTimeout(refreshTimer);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("octagram:hero-visible", revealHero);
      window.removeEventListener("octagram:menu", onMenu);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.domElement.removeEventListener("webglcontextlost", onLost);
      gl.domElement.removeEventListener("webglcontextrestored", onRestored);
      Object.values(models.current).forEach((entry) =>
        entry?.model.dispose?.(),
      );
      models.current = {};
      logoTargets.current = null;
      pending.current.clear();
      clearSceneFlags();
      if (stageElement.current) stageElement.current.style.clipPath = "";
      setLoaded([]);
    };
  }, [compact, ensure, gl, invalidate, onFailure]);

  useFrame(({ clock }, delta) => {
    if (!heroVisible.current || hidden.current || lost.current || menuOpen.current) return;
    const b = bounds.current;
    if (!b.vision) return;
    const h = size.height, actualScroll = Math.max(0, window.scrollY);
    const dt = Math.min(delta, .12), time = clock.elapsedTime * .65;
    scrolling.current.position = THREE.MathUtils.damp(
      scrolling.current.position, actualScroll, compact ? 8 : 2.4, dt,
    );
    const playback = readPassageFrame();
    const progress = sceneProgress(actualScroll, scrolling.current.position, b, h, playback);
    if (actualScroll >= b.team.top && actualScroll + h < b.contact.top) {
      if (!camera.userData.sceneIdle) {
        Object.values(models.current).forEach((entry) => fade(entry, 0));
        globeScene.current.visible = false;
        camera.userData.sceneIdle = true;
      }
      return; // Native scroll/resize/visibility listeners wake the demand loop.
    }
    camera.userData.sceneIdle = false;
    if (progress > .8 || actualScroll + h * 2 > b.vision.top)
      void ensure("logo");
    if (progress > 2.7 || actualScroll + h * 2 > b.jordan.top)
      void ensure("globe");
    const current = framedNarrative(progress, actualScroll, {
      ...size, hero: heroFrame.current, vision: visionWindow.current,
    }, scrolling.current.position);
    const root = document.documentElement;
    const reveal = entrance.current;
    if (models.current.brain) {
      if (!reveal.started) {
        reveal.started = true;
        reveal.elapsed = initialBrainRevealTime(root.dataset, progress);
        root.classList.add("has-webgl");
      }
      if (reveal.progress < 1) {
        reveal.elapsed = Math.min(brainRevealSeconds, reveal.elapsed + Math.min(dt, .065));
        const t = reveal.elapsed / brainRevealSeconds;
        reveal.progress = t * t * (3 - 2 * t);
        if (t === 1) root.dataset.brainRevealed = "true";
      }
    }
    const damping = 1 - Math.exp(-4 * Math.min(delta, 0.06));
    const input = smoothedPointer.current;
    input.x += (pointer.current.x - input.x) * damping;
    input.y += (pointer.current.y - input.y) * damping;
    const m = models.current;
    const nextTint = paletteColors[paletteIndex.current];
    if (nextTint) {
      if (paletteMix.current < .001) {
        tint.shadow.copy(nextTint.shadow);
        tint.mid.copy(nextTint.mid);
        tint.light.copy(nextTint.light);
      } else {
        tint.shadow.lerp(nextTint.shadow, damping);
        tint.mid.lerp(nextTint.mid, damping);
        tint.light.lerp(nextTint.light, damping);
      }
    }
    paletteMix.current += ((nextTint ? 1 : 0) - paletteMix.current) * damping;
    const paletteWeight = paletteMix.current;
    m.brain?.model.setPalette?.(tint, paletteWeight);
    m.modules?.model.setPalette?.(tint, paletteWeight * (1 - current.brainMorph));
    // A timed dissolve survives a quick scroll or direct entry into the reading
    // hold. Both representations keep the same world transform throughout it.
    const materializing = Boolean(logoTargets.current) && progress >= 2.94 && progress <= 3.32;
    if (materializing) solidMix.current = THREE.MathUtils.damp(solidMix.current, current.logo.opacity, 3.2, Math.min(delta, .1));
    else solidMix.current = progress < 2.94 ? 0 : 1;
    const brainOpacity = materializing ? 1 - solidMix.current : current.brain.opacity;
    const logoOpacity = (materializing ? solidMix.current : current.logo.opacity) * (playback?.visionReveal ?? 1);

    m.brain?.model.setReveal?.(entrance.current.progress);
    m.brain?.model.setSpread?.(logoTargets.current ? current.brainSpread : 0);
    if (logoTargets.current) m.brain?.model.setMorph?.(logoTargets.current, current.brainMorph);
    if (brainOpacity > 0.002)
      m.brain?.model.update(
        time,
        progress,
        pointerActive.current ? input : { x: 20, y: 20 },
        false,
      );
    pose(m.brain, current.brain);
    fade(m.brain, brainOpacity);

    m.logo?.model.setPassage?.(current.passage);
    if (logoOpacity > 0.002) m.logo?.model.update(time, current.assembly, input, false);
    pose(m.logo, current.logo);
    fade(m.logo, logoOpacity * (actualScroll < b.team.top ? 1 : 0));

    const frame = rootsFrame.current;
    const sectionTop = frame.sticky ? Math.max(0, b.jordan.top - actualScroll) : b.jordan.top - actualScroll;
    const globeWindow = { top: sectionTop + frame.offset, height: frame.height, width: frame.width, left: frame.left };
    const globeVisible = Boolean(
      m.globe &&
      current.globe.opacity > 0.01 &&
      globeWindow.top < h && globeWindow.top + globeWindow.height > 0 &&
      actualScroll < b.team.top,
    );
    const scene = globeScene.current;
    if (globeVisible) {
      if (!scene.visible) scene.elapsed = 0;
      scene.elapsed += Math.min(delta, 0.06);
      m.globe?.model.setReveal?.(Math.min(1, scene.elapsed / 3.2));
      m.globe?.model.update(scene.elapsed, progress, input, false);
    }
    scene.visible = globeVisible;
    pose(m.globe, rootsGlobePose(size.width, h, globeWindow, current.cameraZ));
    // The DOM panel supplies the wipe: do not dissolve or push the globe
    // towards the camera while it is still visible below the panel's edge.
    fade(m.globe, current.globe.opacity * (actualScroll < b.team.top ? 1 : 0));
    const nextClip = actualScroll < b.team.top && current.globe.opacity > 0.002 && current.logo.opacity <= 0.002
      ? `inset(${Math.min(h, Math.max(0, globeWindow.top))}px ${Math.max(0, size.width - frame.left - frame.width)}px ${Math.max(0, h - Math.max(0, globeWindow.top + globeWindow.height))}px ${Math.max(0, frame.left)}px)`
      : "";
    if (nextClip !== clip.current && stageElement.current) {
      stageElement.current.style.clipPath = nextClip;
      clip.current = nextClip;
    }

    if (m.modules) {
      m.modules.model.setTunnel?.(current.tunnel);
      if (current.ambientOpacity > 0.002) m.modules.model.update(time, progress, input, false);
      m.modules.model.group.position.set(0, 0, 0);
      fade(
        m.modules,
        current.ambientOpacity * (1 + .22 * paletteWeight) *
        (1 - current.framing * .5) *
        entrance.current.progress *
        (actualScroll >= b.team.top - h * 0.3 ? 0.16 : 1),
      );
    }
    // Suppress camera tilt while the upright mark is visible.
    const preciseCamera = progress >= 3.25 && progress <= 5;
    const cameraMotion = preciseCamera ? 0 : Math.max(0, 1 - current.logo.opacity * 4);
    camera.rotation.y +=
      (-0.025 * input.x * cameraMotion - camera.rotation.y) * damping;
    camera.rotation.x +=
      (-0.018 * input.y * cameraMotion - camera.rotation.x) * damping;
    camera.position.z = current.cameraZ;
    camera.userData.brandHold = progress >= 2.96 && progress <= 3.33 && logoOpacity > .7;
    camera.userData.opticalFocus = progress >= 3.86 && progress < 5.7
      ? 10 : Math.max(.25, current.cameraZ);
    if (preciseCamera) camera.rotation.set(0, 0, 0);
    if (debug.current) {
      const canvas = gl.domElement;
      canvas.dataset.progress = progress.toFixed(3);
      canvas.dataset.brainParticles = String(
        m.brain?.model.group.userData.particleCount ?? 0,
      );
      canvas.dataset.brainMorph = (logoTargets.current ? current.brainMorph : 0).toFixed(3);
      canvas.dataset.brainSpread = (logoTargets.current ? current.brainSpread : 0).toFixed(3);
      if (m.logo)
        canvas.dataset.logoRotation = m.logo.model.group.rotation
          .toArray()
          .slice(0, 3)
          .join(",");
      canvas.dataset.choreography = "logo-passage-roots";
      canvas.dataset.cameraDepth = current.cameraZ.toFixed(3);
      canvas.dataset.logoPassage = current.passage.toFixed(3);
      canvas.dataset.ambientFlow = progress >= 2.6 && progress < 3.85 ? "logo-axis" : "ambient";
      canvas.dataset.brainYaw = current.brain.yaw.toFixed(3);
      canvas.dataset.scrollScrub = playback?.owns ? "chapter-playback" : "native-damped";
      canvas.dataset.passagePhase = playback?.phase ?? "native";
      canvas.dataset.logoAssembly = current.assembly.toFixed(3);
      canvas.dataset.brainDepth = current.brain.z.toFixed(3);
      canvas.dataset.globeDepth = current.globe.z.toFixed(3);
      canvas.dataset.globeReveal = Math.min(1, scene.elapsed / 3.2).toFixed(3);
      canvas.dataset.globeActive = String(globeVisible);
      canvas.dataset.brainReveal = reveal.progress.toFixed(3);
    }
    if (!models.current.brain && !models.current.globe) return;
    if (compact && Math.abs(actualScroll - scrolling.current.position) < 1 && !playback?.running && reveal.progress === 1) {
      clearTimeout(nextFrame.current);
      nextFrame.current = window.setTimeout(() => {
        nextFrame.current = 0;
        invalidate();
      }, 30);
    } else invalidate();
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

export default function Experience({ compact, onFailure }: { compact: boolean; onFailure: () => void }) {
  const maximumDpr = Math.min(
    window.devicePixelRatio || 1,
    compact ? Math.min(1.1, Math.sqrt(625_000 / (innerWidth * innerHeight))) : 1.75,
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
            antialias: !compact && innerWidth > 600,
            powerPreference: compact ? "low-power" : "high-performance",
          }}
          fallback={<span />}
          onCreated={({ gl }) => {
            gl.setClearColor(0, 0);
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
          }}
        >
          <PerformanceMonitor
            bounds={() => compact ? [18, 35] : [36, 55]}
            flipflops={3}
            onIncline={performance}
            onDecline={performance}
            onChange={(api) => {
              performance(api);
              setQuality(0.55 + api.factor * 0.45);
              setDpr(Math.min(maximumDpr, compact ? 0.7 + api.factor * .4 : .9 + api.factor * .85));
            }}
            onFallback={(api) => {
              performance(api);
              setQuality(0.5);
              setDpr(compact ? .75 : 1);
            }}
          >
            <SceneDirector quality={quality} compact={compact} onFailure={onFailure} />
            {new URLSearchParams(location.search).has("debugmotion") && <FrameMetrics onSample={sample} />}
            {!compact && <CinematicPost quality={quality} />}
          </PerformanceMonitor>
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
