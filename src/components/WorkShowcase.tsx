"use client";

import { useEffect, useRef, type ReactNode } from "react";

const route = "M72 58H216V174H489.6V96H950.4V174H1224V58H1368V734H1224V782H1016V724H424V782H216V734H72Z";
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => value * value * (3 - 2 * value);

export default function WorkShowcase({ children, count }: { children: ReactNode; count: number }) {
  const scene = useRef<HTMLDivElement>(null);
  const deck = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = scene.current;
    const aperture = deck.current;
    if (!viewport || !aperture) return;

    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let nearby = false, frame = 0;
    let target = 0, position: number | undefined;
    let measure = true, lastFrame = 0, previous = -1;

    function paint(timestamp: number) {
      frame = 0;
      if (!viewport || !aperture) return;
      if (!nearby) { position = undefined; lastFrame = 0; return; }
      if (preference.matches) {
        delete viewport.dataset.workMotion;
        delete viewport.dataset.workProgress;
        position = undefined;
        lastFrame = 0;
        return;
      }

      if (measure) {
        const top = aperture.getBoundingClientRect().top;
        target = clamp((.68 - top / innerHeight) / .52);
        measure = false;
      }

      const elapsed = lastFrame ? Math.min(timestamp - lastFrame, 90) : 16;
      position = position === undefined ? target : position + (target - position) * (1 - Math.exp(-elapsed / 128));
      const settling = Math.abs(target - position) > .002;
      if (!settling) position = target;
      const motion = Math.round(position * 1000) / 1000;
      if (motion !== previous || !viewport.dataset.workMotion) {
        previous = motion;
        viewport.style.setProperty("--work-arrival", (1 - smooth(motion)).toFixed(3));
        viewport.style.setProperty("--work-title-reveal", smooth(clamp((motion - .06) / .58)).toFixed(3));
        viewport.style.setProperty("--work-outline-reveal", smooth(clamp((motion - .30) / .64)).toFixed(3));
        viewport.dataset.workMotion = "true";
        viewport.dataset.workProgress = motion.toFixed(3);
      }
      lastFrame = settling ? timestamp : 0;
      if (settling) frame = requestAnimationFrame(paint);
    }

    function schedule() {
      measure = true;
      if (nearby && !frame) frame = requestAnimationFrame(paint);
    }

    const proximity = new IntersectionObserver(([entry]) => {
      nearby = entry.isIntersecting;
      if (nearby) schedule();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
        position = undefined;
        lastFrame = 0;
      }
    }, { rootMargin: "100% 0px 100% 0px" });
    proximity.observe(viewport);
    const resize = new ResizeObserver(schedule);
    resize.observe(aperture);
    preference.addEventListener("change", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      proximity.disconnect();
      resize.disconnect();
      preference.removeEventListener("change", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="work-showcase">
    <div className="work-showcase-scene" ref={scene}>
      <div className="work-backdrop" aria-hidden="true">
        <svg className="work-grid" viewBox="0 0 1440 840" preserveAspectRatio="none">
          <path className="work-grid-guide" d="M216 174H1224V734H216ZM72 434H216V608H72ZM1224 434H1368V608H1224Z"/>
          <path className="work-grid-route" d={route} pathLength="100"/>
        </svg>
      </div>
      <header className="work-showcase-header">
        <h2 id="work-title">Built for the real world.</h2>
        <p>{count} featured projects in healthcare and fitness</p>
      </header>
      <div className="work-showcase-aperture" ref={deck}>
        <div className="work-showcase-outline" aria-hidden="true">
          <span>{String(count).padStart(2, "0")}</span><span>projects</span>
        </div>
        <div className="work-showcase-deck">{children}</div>
      </div>
    </div>
  </div>;
}
