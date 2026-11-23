"use client";

import { useEffect, useRef } from "react";
import { heroPaletteEvent } from "@/lib/hero-palettes";
import { measureArtwork } from "@/lib/scene-layout";
import { brainRevealSeconds, initialBrainRevealTime } from "@/lib/experience-preferences";
import { readPassageFrame, subscribePassageFrame } from "@/lib/chapter-playback";
import type { NarrativeBounds } from "@/three/choreography";
import { compactBrainPose, createCompactBrain, type CompactBrainLayout } from "@/three/compact-brain";

const sceneIds = ["home", "about", "manifesto", "vision", "jordan", "team", "contact"] as const;

export default function CompactBrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = document.getElementById("home");
    const heroPoster = hero?.querySelector<HTMLImageElement>(".brain-poster");
    const vision = document.getElementById("vision");
    const visionFrame = vision?.querySelector<HTMLElement>(".vision-frame");
    const logoPoster = visionFrame?.querySelector<HTMLImageElement>(".logo-poster");
    if (!canvas || !hero || !heroPoster || !vision || !visionFrame || !logoPoster) return;

    const controller = new AbortController(), { signal } = controller;
    const root = document.documentElement, debug = new URLSearchParams(location.search).has("debugmotion");
    const sections = sceneIds.map(id => [id, document.getElementById(id)] as const);
    const painter = createCompactBrain(canvas, hero.dataset.heroPalette ?? "original");
    if (!painter) return;

    let layout: CompactBrainLayout;
    let frame = 0, timer = 0, lastPaint = 0, nextPaint = 0;
    let seconds = 0, reveal = 0, entrance: number | undefined, cost = 0, lightweight = false;
    let solid = 0, logoOpacity = "", logoScale = "";
    let target = Math.max(0, window.scrollY), scroll = target;
    let logoReady = logoPoster.naturalWidth > 0;

    function suspend() {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      frame = timer = lastPaint = nextPaint = 0;
    }

    function detach() {
      suspend();
      delete root.dataset.compactBrain;
      delete canvas!.dataset.brainRunning;
      logoPoster!.style.removeProperty("--compact-logo-opacity");
      logoPoster!.style.removeProperty("--compact-logo-scale");
      logoOpacity = logoScale = "";
    }

    function eligible() {
      return layout && target < layout.bounds.jordan.top && !document.hidden &&
        root.dataset.heroVisible === "true" && !document.body.classList.contains("menu-open");
    }

    function requestFrame() {
      if (signal.aborted || frame || timer || !eligible()) return;
      const delay = nextPaint - performance.now() - 8;
      if (delay > 4 && Math.abs(target - scroll) < .5) {
        timer = window.setTimeout(() => {
          timer = 0;
          frame = requestAnimationFrame(paint);
        }, delay);
      } else frame = requestAnimationFrame(paint);
    }

    function paint(now: number) {
      frame = 0;
      if (!eligible()) { detach(); return; }
      if (now + 2 < nextPaint && Math.abs(target - scroll) < .5) {
        requestFrame();
        return;
      }

      const elapsed = lastPaint ? (now - lastPaint) / 1000 : 1 / 30;
      const dt = Math.min(.1, elapsed), start = performance.now();
      lastPaint = now;
      seconds += dt;
      const remaining = target - scroll;
      scroll += Math.abs(remaining) < .4 ? remaining : remaining * (1 - Math.exp(-8 * elapsed));
      const pose = compactBrainPose(layout, scroll, target, readPassageFrame());

      entrance ??= initialBrainRevealTime(root.dataset, pose.progress);
      if (reveal < 1) {
        entrance = Math.min(brainRevealSeconds, entrance + Math.min(dt, .065));
        const t = entrance / brainRevealSeconds;
        reveal = t * t * (3 - 2 * t);
        if (t === 1) root.dataset.brainRevealed = "true";
      }
      const dissolving = pose.progress >= 2.94 && pose.progress <= 3.32;
      solid = dissolving ? solid + (pose.logoOpacity - solid) * (1 - Math.exp(-7 * dt)) : pose.logoOpacity;
      const brainOpacity = !logoReady && pose.progress <= 3.32 ? 1 : dissolving ? 1 - solid : pose.brainOpacity;
      painter!.draw(pose, seconds, dt, scroll, reveal, brainOpacity, lightweight);
      cost = cost * .8 + (performance.now() - start) * .2;
      if (cost > 6.5) lightweight = true;
      nextPaint = now + (lightweight ? 36 : 26);

      const opacity = logoReady ? solid.toFixed(3) : "0", scale = (1 + pose.passage * 2.5).toFixed(4);
      if (opacity !== logoOpacity) {
        logoOpacity = opacity;
        logoPoster!.style.setProperty("--compact-logo-opacity", opacity);
      }
      if (scale !== logoScale) {
        logoScale = scale;
        logoPoster!.style.setProperty("--compact-logo-scale", scale);
      }
      if (!root.dataset.compactBrain) {
        root.dataset.compactBrain = "true";
        canvas!.dataset.brainRunning = "true";
      }
      if (debug) {
        canvas!.dataset.brainReveal = reveal.toFixed(3);
        canvas!.dataset.brainProgress = pose.progress.toFixed(3);
        canvas!.dataset.brainMorph = pose.morph.toFixed(3);
        canvas!.dataset.brainYaw = pose.yaw.toFixed(3);
      }
      requestFrame();
    }

    function wake() {
      if (signal.aborted || !layout) return;
      if (eligible()) requestFrame();
      else detach();
    }

    // Measurements run after layout changes. Swipes only update the cached scroll target.
    function measure() {
      if (signal.aborted) return;
      const y = window.scrollY, viewport = canvas!.getBoundingClientRect();
      if (!viewport.width || !viewport.height) return;
      const readBox = visionFrame!.getBoundingClientRect();
      const bounds = {} as NarrativeBounds;
      for (const [id, node] of sections) {
        const box = node?.getBoundingClientRect();
        bounds[id] = { top: box ? box.top + y : Number.MAX_SAFE_INTEGER, height: box?.height ?? viewport.height };
      }
      bounds.vision.readHeight = readBox.height;
      const sizeChanged = viewport.width !== layout?.width || viewport.height !== layout?.height;
      layout = {
        width: viewport.width, height: viewport.height, bounds,
        hero: measureArtwork(heroPoster!, -y, 108 / 102),
        vision: {
          ...measureArtwork(logoPoster!, readBox.top),
          ...bounds.vision, readingHeight: readBox.height,
          sticky: getComputedStyle(visionFrame!).position === "sticky",
        },
      };
      if (sizeChanged) painter!.resize(layout.width, layout.height);
      wake();
    }

    function onScroll() {
      target = Math.max(0, window.scrollY);
      clearTimeout(timer);
      timer = 0;
      wake();
    }

    const observer = new ResizeObserver(measure);
    for (const element of [canvas, hero, visionFrame, ...sections.map(([, node]) => node)]) {
      if (element) observer.observe(element);
    }
    const unsubscribe = subscribePassageFrame(wake);
    logoPoster.addEventListener("load", () => { logoReady = true; wake(); }, { signal });
    window.addEventListener("scroll", onScroll, { passive: true, signal });
    window.addEventListener(heroPaletteEvent, event => painter.setPalette((event as CustomEvent<string>).detail), { signal });
    window.addEventListener("octagram:hero-visible", wake, { signal });
    window.addEventListener("octagram:menu", wake, { signal });
    void document.fonts.ready.then(measure);
    return () => {
      controller.abort();
      observer.disconnect();
      unsubscribe();
      detach();
      painter.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="compact-brain-canvas" width={1} height={1} />;
}
