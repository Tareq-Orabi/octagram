"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { compactMotionQuery, readMotionPreference } from "@/lib/experience-preferences";

const Experience = dynamic(() => import("./Experience"), { ssr: false });
const CompactBrain = dynamic(() => import("./CompactBrain"), { ssr: false });

type Mode = "webgl" | "compact-webgl" | "canvas";
type NetworkPreferences = EventTarget & { saveData?: boolean };

/** Load one renderer at a time and release its resources when the narrative leaves view. */
export default function ExperienceLoader() {
  const [mode, setMode] = useState<Mode>();
  const [failed, setFailed] = useState(false);
  const fallback = useCallback(() => setFailed(true), []);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const compact = matchMedia(compactMotionQuery);
    const connection = (navigator as Navigator & { connection?: NetworkPreferences }).connection;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const controller = new AbortController(), { signal } = controller;
    const root = document.documentElement;
    const visible = new Set<Element>();
    const roots = document.getElementById("roots-scene"), team = document.getElementById("team");
    let paused = readMotionPreference(), pageHidden = false;
    let teamTop = Infinity, rootsCovered = false;

    function sync() {
      root.dataset.motionProfile = compact.matches ? "compact" : "full";
      const rootsOnly = roots !== null && visible.size === 1 && visible.has(roots);
      if (!visible.size || (rootsOnly && rootsCovered) || preference.matches || paused ||
        connection?.saveData || pageHidden || document.hidden) {
        setMode(undefined);
        return;
      }
      if (failed || (compact.matches && memory !== undefined && memory <= 2)) {
        setMode(compact.matches && !rootsOnly ? "canvas" : undefined);
      } else setMode(compact.matches ? "compact-webgl" : "webgl");
    }

    function updateCoverage() {
      const covered = window.scrollY >= teamTop;
      if (covered !== rootsCovered) { rootsCovered = covered; sync(); }
    }
    const geometry = new ResizeObserver(() => {
      if (team) teamTop = team.getBoundingClientRect().top + window.scrollY;
      updateCoverage();
    });
    const main = document.getElementById("main");
    if (main) geometry.observe(main);
    window.addEventListener("scroll", updateCoverage, { passive: true, signal });

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      sync();
    });
    document.querySelectorAll("#home, #about, #manifesto, .scene-transition, #vision, #roots-scene")
      .forEach(section => observer.observe(section));
    preference.addEventListener("change", sync, { signal });
    compact.addEventListener("change", sync, { signal });
    connection?.addEventListener?.("change", sync, { signal });
    document.addEventListener("visibilitychange", sync, { signal });
    window.addEventListener("pagehide", () => { pageHidden = true; sync(); }, { signal });
    window.addEventListener("pageshow", () => { pageHidden = false; sync(); }, { signal });
    window.addEventListener("octagram:motion", event => {
      paused = Boolean((event as CustomEvent<boolean>).detail);
      sync();
    }, { signal });
    sync();
    return () => { controller.abort(); observer.disconnect(); geometry.disconnect(); };
  }, [failed]);

  if (mode === "canvas") return <CompactBrain />;
  if (mode && !failed) return <Experience key={mode} compact={mode === "compact-webgl"} onFailure={fallback} />;
  return null;
}
