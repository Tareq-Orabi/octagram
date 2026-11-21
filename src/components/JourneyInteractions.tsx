"use client";

import { useEffect, useRef } from "react";
import { evaluateNarrative, narrativeProgress, type NarrativeBounds } from "@/three/choreography";
import { PassagePlayback, publishPassageFrame, type PassageFrame } from "@/lib/chapter-playback";
import { createPassageScrollGate } from "@/lib/passage-scroll";
import { readMotionPreference } from "@/lib/experience-preferences";
export default function JourneyInteractions() {
  const skipControl = useRef<HTMLButtonElement>(null);
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
      // Home is already at the document origin; correcting it can undo an early scroll.
      if (signal.aborted || !initialHash || initialHash === "#home") return;
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

    let userPaused = readMotionPreference();
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
        ".team-window, .project-showcase, .principle-column:not(.principle-token-item), .engineering-stage, .commitment-card",
      ),
    );
    const intro = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".portfolio-intro, .commitment-intro, .engineering-intro, .team-head, .contact-context, .contact-panel",
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
    const playback = new PassagePlayback();
    const gate = createPassageScrollGate({
      bounds: () => measured ? { vision: measured.vision.top, roots: measured.jordan.top, height: innerHeight } : undefined,
      enabled: () => !media.matches && !root.classList.contains("journey-paused") && root.classList.contains("experience-entered") && !root.classList.contains("site-entering") && !document.body.classList.contains("menu-open"),
      start: keyboard => {
        passRequested = true; directEntry = false; lastTick = 0;
        const fullScene = root.classList.contains("has-webgl") && root.classList.contains("has-logo");
        playback.startPassage(fullScene ? 4.2 : 2.2);
        if (skipControl.current) { skipControl.current.hidden = false; if (keyboard) skipControl.current.focus({ preventScroll: true }); }
        scheduleScene();
      },
      skip: arrive => finishPassage(arrive),
    });
    let lastPhase: PassageFrame["phase"] = "native";
    let returning = false, returnElapsed = 0;
    let lastTick = 0, lastScroll = window.scrollY, passRequested = false, menuOpen = false, directEntry = Boolean(initialHash);
    function hideSkip(arrive = true) {
      const destination = heading;
      if (arrive && document.activeElement === skipControl.current && destination) { destination.tabIndex = -1; destination.focus({ preventScroll: true }); }
      if (skipControl.current) skipControl.current.hidden = true;
    }
    function finishPassage(arrive = true) {
      if (arrive) playback.finishPassage();
      else {
        playback.settleVision();
        passRequested = false;
      }
      hideSkip(arrive); gate.release(arrive);
      lastTick = 0; scheduleScene();
    }
    let headingAnimation: Animation | undefined;
    const settleHeading = () => {
      headingAnimation?.cancel();
      headingAnimation = undefined;
      if (heading?.dataset.brandCuePlayed) {
        heading.dataset.brandCue = "settled";
        if (roots) roots.dataset.rootsSignal = "settled";
        const word = heading.querySelector<HTMLElement>(".roots-origin"); if (word) word.dataset.flagCue = "settled";
      }
    };
    function cueHeading(progress: number) {
      if (!heading || !headingVisible || heading.dataset.brandCuePlayed || progress < 3.98 ||
        media.matches || root.classList.contains("journey-paused") || document.hidden) return;
      heading.dataset.brandCuePlayed = "true";
      if (roots) roots.dataset.rootsSignal = "arriving";
      if (typeof heading.animate !== "function") return;
      const word = heading.querySelector<HTMLElement>(".roots-origin");
      if (!word) return;
      heading.dataset.brandCue = "running";
      word.dataset.flagCue = "running";
      headingAnimation = word.animate([
        { filter: "brightness(.7)", transform: "translateY(5px)", offset: 0 },
        { filter: "brightness(1.4)", transform: "translateY(0)", offset: .4 },
        { filter: "brightness(1)", transform: "translateY(0)", offset: 1 },
      ], { duration: 2600, easing: "ease-in-out" });
      headingAnimation.onfinish = () => { word.dataset.flagCue = "settled"; heading.dataset.brandCue = "settled"; if (roots) roots.dataset.rootsSignal = "settled"; headingAnimation = undefined; };
    }
    function paintScene(now: number) {
      sceneFrame = 0;
      if (signal.aborted || !measured) return;
      const scroll = window.scrollY, height = innerHeight;
      const raw = narrativeProgress(scroll, measured, height);
      // Hysteresis chooses a complete clip, not a frame for every scroll pixel.
      const goingUp = scroll < lastScroll;
      lastScroll = scroll;
      if (gate.locked || scroll >= measured.jordan.top - height * .28) passRequested = true;
      else if (scroll <= measured.jordan.top - height * .65) passRequested = false;
      const paused = document.hidden || menuOpen;
      const frame = playback.update({
        raw, delta: paused || !lastTick ? 0 : (now - lastTick) / 1000,
        // Native momentum and a resize can briefly report the previous scroll
        // position. The gate owns this clip until it finishes or is skipped.
        active: gate.locked || (scroll >= measured.vision.top - height * .12 && scroll < measured.team.top),
        pass: passRequested, direct: directEntry || (!gate.locked && goingUp),
        enabled: !media.matches && !root.classList.contains("journey-paused"),
      });
      directEntry = false;
      if (frame.phase === "reading" && lastPhase === "complete" && goingUp) {
        returning = true;
        returnElapsed = 0;
      }
      lastPhase = frame.phase;
      if (frame.phase !== "reading") returning = false;
      if (returning) {
        returnElapsed += paused || !lastTick ? 0 : now - lastTick;
        const amount = Math.min(1, returnElapsed / 680);
        frame.visionReveal = amount * amount * (3 - 2 * amount);
        returning = amount < 1;
      }
      vision?.toggleAttribute("data-vision-return", returning);
      vision?.style.setProperty("--vision-return-opacity", String(frame.visionReveal ?? 1));
      publishPassageFrame(frame);
      root.dataset.passagePhase = frame.phase;
      root.dataset.passageProgress = frame.progress.toFixed(4);
      root.style.setProperty("--passage-amount", Math.max(0, Math.min(1, (frame.progress - 3.18) / .9)).toFixed(5));
      const progress = frame.progress;
      const scene = evaluateNarrative(progress, innerWidth < 768);
      cueHeading(progress);
      vision?.style.setProperty("--vision-copy-opacity", scene.visionOpacity.toFixed(4));
      roots?.style.setProperty("--roots-copy-opacity", scene.rootsOpacity.toFixed(4));
      if (gate.locked && (!frame.running || media.matches || root.classList.contains("journey-paused"))) {
        hideSkip();
        gate.release();
      }
      const playing = (frame.running || returning) && !paused;
      lastTick = playing ? now : 0;
      if (playing) scheduleScene();
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
      gate.refresh();
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
    window.addEventListener("hashchange", () => { directEntry = location.hash !== "#vision"; scheduleScene(); }, { signal });
    window.addEventListener("octagram:menu", ((event: CustomEvent<boolean>) => { menuOpen = event.detail; lastTick = 0; scheduleScene(); }) as EventListener, { signal });
    window.addEventListener("octagram:ready", scheduleScene, { signal });
    window.addEventListener("octagram:motion", motionChanged, { signal });
    window.addEventListener("octagram:passage-skip", () => finishPassage(), { signal });
    media.addEventListener("change", motionChanged, { signal });
    document.addEventListener("visibilitychange", () => {
      lastTick = 0;
      if (document.hidden) settleHeading(); else scheduleScene();
    }, { signal });
    void document.fonts.ready.then(measureScene);
    measureScene();
    return () => {
      controller.abort();
      gate.dispose();
      observer.disconnect();
      cancelAnimationFrame(anchorFrame);
      cancelAnimationFrame(sceneFrame);
      publishPassageFrame(undefined);
      delete root.dataset.passagePhase;
      delete root.dataset.passageProgress;
      root.style.removeProperty("--passage-amount");
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
  return <>
    <div className="passage-fallback" aria-hidden="true"><img src="/assets/brand/logo.svg" width="480" height="480" alt="" /></div>
    <button ref={skipControl} className="passage-skip" type="button" hidden onClick={() => window.dispatchEvent(new Event("octagram:passage-skip"))}>Skip transition <span aria-hidden="true">↠</span></button>
  </>;
}
