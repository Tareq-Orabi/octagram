"use client";

import { useEffect } from "react";
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
        ".portfolio-intro, .commitment-intro, .engineering-intro",
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
    [...cards, ...intro].forEach((el) => observer.observe(el));
    root.classList.add("journey-ready");
    return () => {
      controller.abort();
      observer.disconnect();
      cancelAnimationFrame(anchorFrame);
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
