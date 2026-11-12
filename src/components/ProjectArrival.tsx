"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

/** One finite arrival per card. The grid and the independent flip never move. */
export default function ProjectArrival({ children, id = "project-list" }: { children: ReactNode; id?: string }) {
  const gallery = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = gallery.current;
    if (!element) return;
    const abort = new AbortController();
    const { signal } = abort;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const cards = [...element.querySelectorAll<HTMLElement>(".flip-card")];
    const timelines = new Map<HTMLElement, gsap.core.Timeline>();
    let observer: IntersectionObserver;
    const paused = () => media.matches || document.documentElement.classList.contains("journey-paused");

    const settle = (card: HTMLElement) => {
      timelines.get(card)?.kill();
      timelines.delete(card);
      card.dataset.arrival = "settled";
      observer?.unobserve(card);
      const layer = card.querySelector<HTMLElement>(".project-arrival-layer");
      if (layer) gsap.set(layer, { clearProps: "transform,opacity,visibility,willChange" });
      gsap.set(card.querySelectorAll(".project-comet, .project-impact"), { clearProps: "all" });
    };

    const arrive = (card: HTMLElement) => {
      if (card.dataset.arrival !== "waiting") return;
      if (paused()) { settle(card); return; }
      const index = cards.indexOf(card);
      const layer = card.querySelector<HTMLElement>(".project-arrival-layer");
      if (!layer) return;
      const narrow = innerWidth < 768;
      const side = index % 3 === 0 ? -1 : index % 3 === 1 ? .18 : 1;
      card.dataset.arrival = "flying";
      const trail = card.querySelector(".project-comet");
      const impact = card.querySelector(".project-impact");
      gsap.set(layer, {
        x: side * Math.min(innerWidth * .55, 650), y: narrow ? -160 : -240 - index * 40,
        z: -1050, rotationX: 34 + index * 23, rotationY: side * 145,
        rotationZ: side * 26, scale: .48, opacity: 0, willChange: "transform,opacity",
        transformPerspective: 1200,
      });
      const timeline = gsap.timeline({ onComplete: () => settle(card) });
      timelines.set(card, timeline);
      timeline
        .to(layer, { opacity: 1, duration: .16 }, 0)
        .to(trail, { opacity: .65, scaleX: 1, duration: .2 }, .04)
        .to(layer, {
          x: 0, y: -30, z: 24, rotationX: -5, rotationY: -side * 4,
          rotationZ: side * 1.7, scale: 1, duration: .82, ease: "power3.out",
        }, 0)
        .to(trail, { opacity: 0, scaleX: .2, duration: .3 }, .36)
        .to(layer, {
          y: 6, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0,
          scaleX: 1.012, scaleY: .986, duration: .16, ease: "power2.in",
        }, .82)
        .fromTo(impact, { opacity: .65, scaleX: .3, scaleY: .65 },
          { opacity: 0, scaleX: 1.25, scaleY: 1.4, duration: .5, ease: "power2.out" }, .96)
        .to(layer, { y: -5, scaleX: 1, scaleY: 1, duration: .17, ease: "power2.out" }, .98)
        .to(layer, { y: 0, duration: .2, ease: "power2.inOut" }, 1.15);
      if (document.hidden) timeline.pause();
    };

    cards.forEach((card) => {
      card.dataset.arrival = paused() ? "settled" : "waiting";
      // Keyboard and pointer access always win over the decorative entrance.
      card.addEventListener("focusin", () => settle(card), { signal });
      card.addEventListener("pointerdown", () => settle(card), { passive: true, signal });
    });
    const watch = () => {
      observer?.disconnect();
      const tallest = Math.max(1, ...cards.map((card) => card.offsetHeight));
      const threshold = Math.min(.36, innerHeight / tallest * .55);
      observer = new IntersectionObserver((entries) => {
        if (signal.aborted) return;
        for (const entry of entries) {
          const card = entry.target as HTMLElement;
          // isIntersecting alone also becomes true for a one-pixel sliver.
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) arrive(card);
          else if (!entry.isIntersecting && card.dataset.arrival === "flying") settle(card);
        }
      }, { threshold: [0, threshold], rootMargin: "0px 0px -4% 0px" });
      cards.filter((card) => card.dataset.arrival === "waiting").forEach((card) => observer.observe(card));
    };
    watch();

    const motionChanged = (event: Event) => {
      if (paused() || (event.type === "octagram:motion" && (event as CustomEvent<boolean>).detail)) cards.forEach(settle);
    };
    media.addEventListener("change", motionChanged, { signal });
    window.addEventListener("octagram:motion", motionChanged, { signal });
    window.addEventListener("resize", () => {
      cards.filter((card) => card.dataset.arrival === "flying").forEach(settle);
      watch();
    }, { passive: true, signal });
    document.addEventListener("visibilitychange", () => {
      for (const timeline of timelines.values()) {
        if (document.hidden) timeline.pause(); else timeline.resume();
      }
    }, { signal });

    return () => {
      abort.abort(); observer.disconnect();
      cards.forEach((card) => { settle(card); delete card.dataset.arrival; });
    };
  }, []);

  return <div ref={gallery} id={id} className="project-gallery project-arrivals">{children}</div>;
}
