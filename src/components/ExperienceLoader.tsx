"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Experience = dynamic(() => import("./Experience"), { ssr: false });

/** Static DOM posters are the first paint and the reduced-motion experience. */
export default function ExperienceLoader() {
  const [enabled, setEnabled] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let userPaused = false;
    let nearScene = false;
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let alive = true;
    const sync = () => {
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) clearTimeout(timer);
      if (preference.matches || userPaused || !nearScene) {
        setEnabled(false);
        return;
      }
      const start = () => {
        if (alive) setEnabled(true);
      };
      if ("requestIdleCallback" in window)
        idle = window.requestIdleCallback(start, { timeout: 800 });
      else timer = setTimeout(start, 80);
    };
    const onMotion = (event: Event) => {
      userPaused = Boolean((event as CustomEvent<boolean>).detail);
      sync();
    };
    const visibleScenes = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleScenes.add(entry.target);
          else visibleScenes.delete(entry.target);
        });
        const next = visibleScenes.size > 0;
        if (next !== nearScene) {
          nearScene = next;
          sync();
        }
      },
      { rootMargin: "200px 0px" },
    );
    document
      .querySelectorAll("main .stage")
      .forEach((el) => observer.observe(el));
    preference.addEventListener("change", sync);
    window.addEventListener("octagram:motion", onMotion);
    sync();
    return () => {
      alive = false;
      observer.disconnect();
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) clearTimeout(timer);
      preference.removeEventListener("change", sync);
      window.removeEventListener("octagram:motion", onMotion);
    };
  }, []);

  return enabled && !failed ? (
    <Experience onFailure={() => setFailed(true)} />
  ) : null;
}
