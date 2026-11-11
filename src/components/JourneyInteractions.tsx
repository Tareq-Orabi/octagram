"use client";

import { useEffect } from "react";
import { evaluateNarrative, narrativeProgress, type NarrativeBounds } from "@/three/choreography";
export default function JourneyInteractions() {
  useEffect(() => {
    const root = document.documentElement;
    const controller = new AbortController(),
      { signal } = controller;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    // Fonts and measured line wraps can move an initial hash target after the
    // browser's first anchor scroll. Correct it once, unless the visitor acts.
    const initialHash = location.hash;
    let interacted = false,
      anchorFrame = 0;
    for (const event of ["wheel", "touchstart", "pointerdown", "keydown"])
      window.addEventListener(
        event,
        () => {
          interacted = true;
        },
        { once: true, passive: true, signal },
      );
    void document.fonts.ready.then(() => {
      if (signal.aborted || !initialHash) return;
      anchorFrame = requestAnimationFrame(() => {
        anchorFrame = requestAnimationFrame(() => {
          if (signal.aborted || interacted || location.hash !== initialHash)
            return;
          document
            .getElementById(initialHash.slice(1))
            ?.scrollIntoView({ behavior: "instant", block: "start" });
        });
      });
    });

    let userPaused = false;
    const sync = () =>
      root.classList.toggle("journey-paused", userPaused || media.matches);
    sync();
    media.addEventListener("change", sync, { signal });
    window.addEventListener(
      "octagram:motion",
      ((e: CustomEvent<boolean>) => {
        userPaused = e.detail;
        sync();
      }) as EventListener,
      { signal },
    );
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".team-window, .project-showcase, .principle-column, .engineering-stage, .commitment-card",
      ),
    );
    const intro = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".portfolio-intro, .commitment-intro, .engineering-intro, .team-head, .service-gallery, .contact-context, .contact-panel",
      ),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          e.target.classList.toggle("journey-visible", e.isIntersecting);
          if (e.isIntersecting) e.target.classList.add("journey-revealed");
        });
      },
      { threshold: 0.08 },
    );
    [...cards, ...intro].forEach((el) => {
      if (el.parentElement) {
        const siblings = [...el.parentElement.children];
        el.style.setProperty("--arrival-delay", `${Math.min(siblings.indexOf(el) % 6, 4) * 65}ms`);
      }
      observer.observe(el);
    });
    root.classList.add("journey-ready");

    const vision = document.getElementById("vision");
    const visionFrame = vision?.querySelector<HTMLElement>(".vision-frame");
    const roots = document.querySelector<HTMLElement>(".roots-handoff > .jordan");
    const wrapper = roots?.closest<HTMLElement>(".roots-handoff");
    const heading = document.getElementById("jordan-title");
    let measured: NarrativeBounds | undefined;
    let sceneFrame = 0, headingVisible = false;
    let headingAnimation: Animation | undefined;
    const settleHeading = () => {
      headingAnimation?.cancel();
      headingAnimation = undefined;
      if (heading?.dataset.brandCuePlayed) heading.dataset.brandCue = "settled";
    };
    function cueHeading(progress: number) {
      if (!heading || !headingVisible || heading.dataset.brandCuePlayed || progress < 3.98 ||
        media.matches || root.classList.contains("journey-paused") || document.hidden) return;
      heading.dataset.brandCuePlayed = "true";
      if (typeof heading.animate !== "function") return;
      const styles = getComputedStyle(root);
      const palette = ["peach", "coral", "orange", "yellow", "mint", "teal"]
        .map((color) => styles.getPropertyValue(`--brand-${color}`).trim()).filter(Boolean);
      for (let i = palette.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [palette[i], palette[j]] = [palette[j], palette[i]];
      }
      heading.dataset.brandCue = "running";
      headingAnimation = heading.animate([
        { color: palette[0], offset: 0 },
        { color: palette[1], offset: .33 },
        { color: palette[2], offset: .66 },
        { color: getComputedStyle(heading).color, offset: 1 },
      ], { duration: 1800, easing: "ease-in-out" });
      headingAnimation.onfinish = () => { heading.dataset.brandCue = "settled"; headingAnimation = undefined; };
    }
    function paintScene() {
      sceneFrame = 0;
      if (signal.aborted || !measured) return;
      const progress = narrativeProgress(window.scrollY, measured, innerHeight);
      const scene = evaluateNarrative(progress, innerWidth < 768);
      cueHeading(progress);
      vision?.style.setProperty("--vision-copy-opacity", scene.visionOpacity.toFixed(4));
      roots?.style.setProperty("--roots-copy-opacity", scene.rootsOpacity.toFixed(4));
    }
    function scheduleScene() {
      if (!sceneFrame && !signal.aborted) sceneFrame = requestAnimationFrame(paintScene);
    }
    function measureScene() {
      if (signal.aborted) return;
      const result = {} as NarrativeBounds;
      for (const id of ["home", "about", "manifesto", "vision", "jordan", "team", "contact"] as const) {
        const section = id === "jordan" ? roots : document.getElementById(id);
        const anchor = id === "jordan" ? wrapper ?? section : section;
        result[id] = {
          top: anchor ? anchor.getBoundingClientRect().top + window.scrollY : Number.MAX_SAFE_INTEGER,
          height: section?.offsetHeight ?? innerHeight,
        };
      }
      result.vision.readHeight = visionFrame?.offsetHeight;
      measured = result;
      scheduleScene();
    }
    const headingObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        headingVisible = entry.isIntersecting && entry.intersectionRatio >= .65;
        if (!headingVisible) settleHeading();
      }
      scheduleScene();
    }, { threshold: [.0, .65], rootMargin: "0px 0px -8% 0px" });
    if (heading) headingObserver.observe(heading);
    const geometryObserver = new ResizeObserver(measureScene);
    if (visionFrame) geometryObserver.observe(visionFrame);
    if (roots) geometryObserver.observe(roots);
    const main = document.querySelector("main");
    if (main) geometryObserver.observe(main);
    const motionChanged = () => {
      if (media.matches || root.classList.contains("journey-paused")) settleHeading();
      scheduleScene();
    };
    window.addEventListener("scroll", scheduleScene, { passive: true, signal });
    window.addEventListener("resize", measureScene, { passive: true, signal });
    window.addEventListener("pageshow", measureScene, { signal });
    window.addEventListener("octagram:motion", motionChanged, { signal });
    media.addEventListener("change", motionChanged, { signal });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) settleHeading(); else scheduleScene();
    }, { signal });
    void document.fonts.ready.then(measureScene);
    measureScene();
    return () => {
      controller.abort();
      observer.disconnect();
      cancelAnimationFrame(anchorFrame);
      cancelAnimationFrame(sceneFrame);
      geometryObserver.disconnect();
      headingObserver.disconnect();
      settleHeading();
      vision?.style.removeProperty("--vision-copy-opacity");
      roots?.style.removeProperty("--roots-copy-opacity");
      root.classList.remove("journey-ready", "journey-paused");
      [...cards, ...intro].forEach((e) =>
        e.classList.remove(
          "journey-visible",
          "journey-revealed",
          "pointer-lit",
        ),
      );
    };
  }, []);
  return null;
}
