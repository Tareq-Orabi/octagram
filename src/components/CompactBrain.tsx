"use client";

import { useEffect, useRef } from "react";
import { compactMotionQuery } from "@/lib/experience-preferences";
import { heroPaletteEvent } from "@/lib/hero-palettes";
import type { ArtworkFrame, CompactBrainLayout } from "@/three/compact-brain";

type Renderer = typeof import("@/three/compact-brain");

function artworkFrame(image: HTMLImageElement, top: number, aspect = 1): ArtworkFrame {
  const rect = image.getBoundingClientRect();
  const style = getComputedStyle(image);
  const left = parseFloat(style.paddingLeft) || 0, right = parseFloat(style.paddingRight) || 0;
  const start = parseFloat(style.paddingTop) || 0, end = parseFloat(style.paddingBottom) || 0;
  const width = rect.width - left - right, height = rect.height - start - end;
  return {
    x: rect.left + left + width * .5,
    y: rect.top - top + start + height * .5,
    size: Math.max(1, Math.min(width, height * aspect)),
  };
}

export default function CompactBrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = document.getElementById("home"), about = document.getElementById("about");
    const manifesto = document.getElementById("manifesto"), vision = document.getElementById("vision");
    const visionFrame = vision?.querySelector<HTMLElement>(".vision-frame");
    const heroPoster = hero?.querySelector<HTMLImageElement>(".brain-poster");
    const aboutPoster = about?.querySelector<HTMLImageElement>(".intro-poster");
    const logoPoster = visionFrame?.querySelector<HTMLImageElement>(".logo-poster");
    if (!canvas || !hero || !about || !manifesto || !vision || !heroPoster || !aboutPoster || !visionFrame || !logoPoster) return;

    const compact = matchMedia(compactMotionQuery), reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const controller = new AbortController(), { signal } = controller;
    const root = document.documentElement;
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    let engine: Renderer | undefined;
    let layout: CompactBrainLayout | undefined;
    let painter: ReturnType<Renderer["createCompactBrain"]> = null;
    let loading = false, failed = false, pageHidden = false;
    let frame = 0, timer = 0, lastPaint = 0, nextPaint = 0;
    let seconds = 0, cost = 0, lightweight = false, logoOpacity = "";
    let targetScroll = Math.max(0, window.scrollY), scroll = targetScroll;
    let logoReady = logoPoster.naturalWidth > 0;

    function eligible() {
      return compact.matches && !reduced.matches && !connection?.saveData &&
        !pageHidden && !document.hidden && !document.body.classList.contains("menu-open") &&
        !root.classList.contains("journey-paused") && root.dataset.heroVisible === "true";
    }

    function release() {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      frame = timer = lastPaint = nextPaint = 0;
      if (!painter) return;
      painter.dispose();
      painter = null;
      delete root.dataset.compactBrain;
      delete canvas!.dataset.brainRunning;
      logoPoster!.style.removeProperty("--compact-logo-opacity");
      logoOpacity = "";
    }

    function requestFrame() {
      if (!painter || frame || timer) return;
      const delay = nextPaint - performance.now() - 8;
      if (delay > 4 && Math.abs(targetScroll - scroll) < .4) {
        timer = window.setTimeout(() => {
          timer = 0;
          frame = requestAnimationFrame(paint);
        }, delay);
      } else frame = requestAnimationFrame(paint);
    }

    function paint(now: number) {
      frame = 0;
      if (!painter || !layout || !engine || !eligible()) { sync(); return; }
      if (now + 2 < nextPaint) { requestFrame(); return; }
      const elapsed = lastPaint ? (now - lastPaint) / 1000 : 1 / 24;
      const dt = Math.min(.12, elapsed);
      lastPaint = now;
      seconds += dt;
      // Native scrolling selects the pose. A short ease lets the artwork settle after a flick.
      const remaining = targetScroll - scroll;
      scroll += Math.abs(remaining) < .4 ? remaining : remaining * (1 - Math.exp(-10 * elapsed));

      const start = performance.now();
      const pose = engine.compactBrainPose(layout, scroll, targetScroll);
      painter.draw(pose, seconds, dt, scroll, lightweight, logoReady);
      cost = cost * .82 + (performance.now() - start) * .18;
      if (cost > 7) lightweight = true;
      nextPaint = now + (lightweight ? 58 : 36);

      const opacity = logoReady ? pose.logoOpacity.toFixed(3) : "0";
      if (opacity !== logoOpacity) {
        logoOpacity = opacity;
        logoPoster!.style.setProperty("--compact-logo-opacity", opacity);
      }
      if (!root.dataset.compactBrain) {
        root.dataset.compactBrain = "true";
        canvas!.dataset.brainRunning = "true";
      }
      requestFrame();
    }

    async function prepare() {
      loading = true;
      try { engine = await import("@/three/compact-brain"); }
      catch { failed = true; }
      finally {
        loading = false;
        if (!signal.aborted) sync();
      }
    }

    function sync() {
      const near = layout && targetScroll < layout.visionTop + layout.visionHeight;
      if (failed || !eligible() || !near) { release(); return; }
      if (!engine) {
        if (!loading) void prepare();
        return;
      }
      if (!painter && layout) {
        painter = engine.createCompactBrain(canvas!, hero!.dataset.heroPalette ?? "original");
        if (!painter) { failed = true; return; }
        scroll = targetScroll;
        painter.resize(layout.width, layout.height);
      }
      requestFrame();
    }

    // Read geometry together when the layout changes. Scroll and paint use the cached coordinates.
    function measure() {
      if (signal.aborted || !compact.matches) return;
      const documentScroll = window.scrollY;
      targetScroll = Math.max(0, documentScroll);
      const viewport = canvas!.getBoundingClientRect();
      if (!viewport.width || !viewport.height) return;
      const heroBox = hero!.getBoundingClientRect(), aboutBox = about!.getBoundingClientRect();
      const visionBox = vision!.getBoundingClientRect(), readingBox = visionFrame!.getBoundingClientRect();
      const stickyVision = getComputedStyle(visionFrame!).position === "sticky";
      const previous = layout;
      layout = {
        width: viewport.width, height: viewport.height,
        homeTop: heroBox.top + documentScroll, aboutTop: aboutBox.top + documentScroll,
        manifestoTop: manifesto!.getBoundingClientRect().top + documentScroll,
        visionTop: visionBox.top + documentScroll, visionHeight: visionBox.height,
        readingHeight: readingBox.height, stickyVision,
        hero: artworkFrame(heroPoster!, heroBox.top, 108 / 102),
        about: artworkFrame(aboutPoster!, aboutBox.top, 108 / 102),
        logo: artworkFrame(logoPoster!, readingBox.top),
      };
      if (painter && (previous?.width !== layout.width || previous?.height !== layout.height))
        painter.resize(layout.width, layout.height);
      sync();
    }

    const observer = new ResizeObserver(measure);
    for (const element of [canvas, hero, about, manifesto, vision, visionFrame]) observer.observe(element);
    const onScroll = () => {
      const next = Math.max(0, window.scrollY);
      if (next === targetScroll) return;
      targetScroll = next;
      clearTimeout(timer);
      timer = 0;
      sync();
    };
    const onProfile = () => { measure(); sync(); };
    logoPoster.addEventListener("load", () => { logoReady = logoPoster.naturalWidth > 0; }, { signal });
    window.addEventListener("scroll", onScroll, { passive: true, signal });
    window.addEventListener(heroPaletteEvent, (event: Event) => painter?.setPalette((event as CustomEvent<string>).detail), { signal });
    window.addEventListener("octagram:entered", sync, { signal });
    window.addEventListener("octagram:hero-visible", sync, { signal });
    window.addEventListener("octagram:motion", sync, { signal });
    window.addEventListener("octagram:menu", sync, { signal });
    window.addEventListener("pagehide", () => { pageHidden = true; sync(); }, { signal });
    window.addEventListener("pageshow", () => { pageHidden = false; onProfile(); }, { signal });
    document.addEventListener("visibilitychange", sync, { signal });
    compact.addEventListener("change", onProfile, { signal });
    reduced.addEventListener("change", sync, { signal });
    connection?.addEventListener?.("change", sync, { signal });
    void document.fonts.ready.then(measure);
    return () => {
      controller.abort();
      observer.disconnect();
      release();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="compact-brain-canvas" width={1} height={1} />;
}
