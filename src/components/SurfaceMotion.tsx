"use client";
import { useEffect } from "react";

/** Event-driven motion. Layout is read in one batch before any style writes. */
export default function SurfaceMotion() {
  useEffect(() => {
    const abort = new AbortController(),
      { signal } = abort;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const cards = [
      ...document.querySelectorAll<HTMLElement>(
        ".project-showcase, .principle-column, .engineering-stage",
      ),
    ];
    const sections = [
      ...document.querySelectorAll<HTMLElement>("main > section"),
    ];
    const steps = [
      ...document.querySelectorAll<HTMLElement>(".engineering-stage"),
    ];
    const visibleSections = new Set<HTMLElement>();
    const moving = new Set<HTMLElement>();
    const poses = new Map(
      cards.map((el) => [el, { x: 0, y: 0, tx: 0, ty: 0 }]),
    );
    let paused = false,
      menu = false,
      frame = 0,
      scrollDirty = true,
      previous = 0;
    const stopped = () => paused || menu || document.hidden || media.matches;
    const schedule = () => {
      if (!frame && !stopped()) frame = requestAnimationFrame(tick);
    };
    function tick(now: number) {
      frame = 0;
      if (stopped()) return;
      const dt = previous ? Math.min(now - previous, 64) : 16;
      previous = now;
      // All geometry reads precede writes; idle pages schedule no JS frames.
      const sectionReads = scrollDirty
        ? [...visibleSections].map((el) => ({
            el,
            rect: el.getBoundingClientRect(),
          }))
        : [];
      const stepReads = scrollDirty
        ? steps.map((el) => ({ el, top: el.getBoundingClientRect().top }))
        : [];
      scrollDirty = false;
      sectionReads.forEach(({ el, rect }) => {
        const t = Math.max(
          0,
          Math.min(
            1,
            (innerHeight * 0.8 - rect.top) / (rect.height + innerHeight * 0.5),
          ),
        );
        el.style.setProperty("--section-progress", t.toFixed(3));
        el.style.setProperty(
          "--section-drift",
          `${((t - 0.5) * 22).toFixed(2)}px`,
        );
      });
      stepReads.forEach(({ el, top }) =>
        el.classList.toggle("stage-current", top < innerHeight * 0.65),
      );
      moving.forEach((el) => {
        const p = poses.get(el)!;
        const d = 1 - Math.exp(-dt / 110);
        p.x += (p.tx - p.x) * d;
        p.y += (p.ty - p.y) * d;
        if (Math.abs(p.x - p.tx) + Math.abs(p.y - p.ty) < 0.005) {
          p.x = p.tx;
          p.y = p.ty;
          moving.delete(el);
        }
        el.style.setProperty("--surface-rx", `${(-p.y * 4).toFixed(2)}deg`);
        el.style.setProperty("--surface-ry", `${(p.x * 5).toFixed(2)}deg`);
      });
      if (moving.size) schedule();
      else previous = 0;
    }
    cards.forEach((el) => {
      el.classList.add("motion-surface");
      let bounds: DOMRect | undefined;
      el.addEventListener(
        "pointerenter",
        () => {
          bounds = el.getBoundingClientRect();
        },
        { passive: true, signal },
      );
      el.addEventListener(
        "pointermove",
        (e) => {
          if (stopped() || e.pointerType !== "mouse" || !bounds) return;
          const p = poses.get(el)!;
          p.tx = Math.max(
            -1,
            Math.min(1, ((e.clientX - bounds.left) / bounds.width) * 2 - 1),
          );
          p.ty = Math.max(
            -1,
            Math.min(1, ((e.clientY - bounds.top) / bounds.height) * 2 - 1),
          );
          moving.add(el);
          schedule();
        },
        { passive: true, signal },
      );
      el.addEventListener(
        "pointerleave",
        () => {
          const p = poses.get(el)!;
          p.tx = p.ty = 0;
          moving.add(el);
          schedule();
        },
        { signal },
      );
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        el.classList.toggle("motion-visible", entry.isIntersecting);
        if (el.tagName === "SECTION") {
          if (entry.isIntersecting) visibleSections.add(el);
          else visibleSections.delete(el);
        }
      });
      scrollDirty = true;
      schedule();
    });
    [...cards, ...sections].forEach((el) => observer.observe(el));
    const onScroll = () => {
      scrollDirty = true;
      schedule();
    };
    window.addEventListener("scroll", onScroll, { passive: true, signal });
    window.addEventListener("resize", onScroll, { passive: true, signal });
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      document.documentElement.classList.toggle(
        "surfaces-paused",
        paused || media.matches || document.hidden,
      );
      scrollDirty = true;
      schedule();
    };
    window.addEventListener(
      "octagram:motion",
      ((e: CustomEvent<boolean>) => {
        paused = e.detail;
        sync();
      }) as EventListener,
      { signal },
    );
    window.addEventListener(
      "octagram:menu",
      ((e: CustomEvent<boolean>) => {
        menu = e.detail;
        sync();
      }) as EventListener,
      { signal },
    );
    document.addEventListener("visibilitychange", sync, { signal });
    media.addEventListener("change", sync, { signal });
    sync();
    return () => {
      abort.abort();
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove("surfaces-paused");
      [...cards, ...sections].forEach((el) => {
        el.classList.remove(
          "motion-surface",
          "motion-visible",
          "stage-current",
        );
        [
          "--surface-rx",
          "--surface-ry",
          "--section-progress",
          "--section-drift",
        ].forEach((k) => el.style.removeProperty(k));
      });
    };
  }, []);
  return null;
}
