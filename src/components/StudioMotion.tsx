"use client";

import { useEffect } from "react";

/** CSS owns the scene clocks. JS only handles visibility, focus and batched pointer input. */
export default function StudioMotion() {
  useEffect(() => {
    const abort = new AbortController(), { signal } = abort;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const scenes = [...document.querySelectorAll<HTMLElement>("[data-motion-scene]")];
    const regions = [...document.querySelectorAll<HTMLElement>("[data-motion-region]")];
    const items = [...document.querySelectorAll<HTMLElement>("[data-reveal-item]")];
    const visible = new Set<Element>();
    let menu = false, frame = 0;
    const poses = new Map<HTMLElement, { x: number; y: number; rect?: DOMRect }>();
    const enabled = () => !document.hidden && !menu && !media.matches;
    const sync = () => {
      if (media.matches) items.forEach(item => { item.dataset.revealed = "true"; });
      [...scenes, ...regions].forEach(scene => {
        scene.dataset.running = String(enabled() && visible.has(scene));
        if (media.matches) scene.dataset.arrived = "true";
      });
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          visible.add(element); element.dataset.arrived = "true";
        } else visible.delete(element);
      }
      sync();
    }, { threshold: .08 });
    const reveals = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        (entry.target as HTMLElement).dataset.revealed = "true";
        reveals.unobserve(entry.target);
      }
    }, { threshold: .18 });
    scenes.forEach(scene => {
      observer.observe(scene);
      const choose = (event: Event) => {
        const choice = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-scene-choice]") : null;
        if (choice && scene.contains(choice)) scene.dataset.active = choice.dataset.sceneChoice;
      };
      scene.addEventListener("pointerover", choose, { passive: true, signal });
      scene.addEventListener("focusin", choose, { signal });
      scene.addEventListener("click", choose, { signal });
    });
    regions.forEach(region => observer.observe(region));
    items.forEach(item => { if (media.matches) item.dataset.revealed = "true"; else reveals.observe(item); });
    const flush = () => {
      frame = 0;
      if (!enabled()) { poses.clear(); return; }
      // Read every needed rectangle before writing any custom properties.
      const reads = [...poses].map(([element, pose]) => ({ element, pose, rect: pose.rect ?? element.getBoundingClientRect() }));
      for (const { element, pose, rect } of reads) {
        pose.rect = rect;
        const x = Math.max(-1, Math.min(1, (pose.x - rect.left) / Math.max(1, rect.width) * 2 - 1));
        const y = Math.max(-1, Math.min(1, (pose.y - rect.top) / Math.max(1, rect.height) * 2 - 1));
        const strength = Math.min(4,Math.max(.2,Number(element.dataset.tiltStrength)||1));
        element.style.setProperty("--tilt-x", `${(-y * 2.6 * strength).toFixed(2)}deg`);
        element.style.setProperty("--tilt-y", `${(x * 3.4 * strength).toFixed(2)}deg`);
        element.style.setProperty("--light-x", `${(x * 35 + 50).toFixed(1)}%`);
        element.style.setProperty("--light-y", `${(y * 35 + 50).toFixed(1)}%`);
      }
    };
    const targets = [...document.querySelectorAll<HTMLElement>("[data-tilt]")];
    targets.forEach(element => {
      element.addEventListener("pointermove", event => {
        if (!enabled() || event.pointerType !== "mouse") return;
        const pose = poses.get(element) ?? { x: event.clientX, y: event.clientY };
        pose.x = event.clientX; pose.y = event.clientY; poses.set(element, pose);
        if (!frame) frame = requestAnimationFrame(flush);
      }, { passive: true, signal });
      element.addEventListener("pointerleave", () => {
        poses.delete(element);
        element.style.setProperty("--tilt-x", "0deg"); element.style.setProperty("--tilt-y", "0deg");
        element.style.setProperty("--light-x", "50%"); element.style.setProperty("--light-y", "50%");
      }, { signal });
    });
    window.addEventListener("scroll", () => poses.forEach(pose => { pose.rect = undefined; }), { passive: true, signal });
    window.addEventListener("resize", () => poses.forEach(pose => { pose.rect = undefined; }), { passive: true, signal });
    document.addEventListener("focusin", event => {
      const item = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-reveal-item]") : null;
      if (item) item.dataset.revealed = "true";
    }, { signal });
    window.addEventListener("octagram:menu", event => { menu = Boolean((event as CustomEvent<boolean>).detail); sync(); }, { signal });
    media.addEventListener("change", sync, { signal });
    document.addEventListener("visibilitychange", sync, { signal });
    sync();
    return () => {
      abort.abort(); observer.disconnect(); reveals.disconnect(); cancelAnimationFrame(frame);
      [...scenes, ...regions].forEach(scene => { scene.dataset.running = "false"; });
      poses.clear();
    };
  }, []);
  return null;
}
