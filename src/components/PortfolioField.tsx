"use client";

import { useEffect, useRef, type ReactNode } from "react";

const dotSpacing = 22;
const controls = "a,button,summary,input,textarea,select,dialog,[contenteditable=true]";
const railPositions = [5, 15, 34, 66, 85, 95];

export default function PortfolioField({ children }: { children: ReactNode }) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current!;
    const glow = glowRef.current!;
    const ripple = waveRef.current!;
    const bottom = bottomRef.current!;
    const abort = new AbortController(), { signal } = abort;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let pointer: { x: number; y: number } | undefined;
    let wave: Animation | undefined;
    let edgeObserver: IntersectionObserver | undefined;
    const motionAllowed = () => !reduced.matches && !document.hidden && !document.body.classList.contains("menu-open");

    function observeBottomEdge() {
      edgeObserver?.disconnect();
      const crossing = new Set<Element>();
      edgeObserver = new IntersectionObserver(entries => {
        entries.forEach(({ target, isIntersecting }) => {
          if (isIntersecting) crossing.add(target);
          else crossing.delete(target);
        });
        bottom.dataset.visible = String(crossing.size > 0);
      }, { rootMargin: `-${Math.max(0, window.innerHeight - 24)}px 0px 0px` });
      field.querySelectorAll(":scope > :is(#work, #innovation, #approach)").forEach(section => edgeObserver?.observe(section));
    }
    observeBottomEdge();
    window.addEventListener("resize", observeBottomEdge, { passive: true, signal });

    function placeDots(layer: HTMLElement, x: number, y: number, size: number) {
      const radius = size / 2;
      const left = Math.floor((x - radius) / dotSpacing) * dotSpacing;
      const top = Math.floor((y - radius) / dotSpacing) * dotSpacing;
      layer.style.transform = `translate(${left}px, ${top}px)`;
      layer.style.setProperty("--field-x", `${x - left}px`);
      layer.style.setProperty("--field-y", `${y - top}px`);
    }

    function drawGlow() {
      frame = 0;
      if (!pointer || !motionAllowed()) return;
      const rect = field.getBoundingClientRect();
      const x = pointer.x - rect.left, y = pointer.y - rect.top;
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) { clearGlow(); return; }
      placeDots(glow, x, y, 374);
      glow.dataset.lit = "true";
    }
    function schedule() { if (!frame && pointer) frame = requestAnimationFrame(drawGlow); }
    function clearGlow() {
      pointer = undefined;
      delete glow.dataset.lit;
    }
    function stopMotion() {
      if (motionAllowed()) return;
      clearGlow();
      wave?.cancel();
      delete ripple.dataset.waving;
    }
    field.addEventListener("pointermove", event => {
      if (event.pointerType === "touch" || !motionAllowed()) return;
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    }, { passive: true, signal });
    field.addEventListener("pointerleave", clearGlow, { signal });
    field.addEventListener("click", event => {
      if (!motionAllowed() || event.detail === 0 || (event.target as Element).closest(controls)) return;
      const rect = field.getBoundingClientRect();
      const edgeX = Math.max(event.clientX, innerWidth - event.clientX);
      const edgeY = Math.max(event.clientY, innerHeight - event.clientY);
      const distance = Math.ceil(Math.min(1920, Math.hypot(edgeX, edgeY))) + dotSpacing;
      const size = Math.ceil((2 * distance + 184) / dotSpacing) * dotSpacing;
      ripple.style.width = ripple.style.height = `${size}px`;
      placeDots(ripple, event.clientX - rect.left, event.clientY - rect.top, size);
      wave?.cancel();
      ripple.dataset.waving = "true";
      const animation = ripple.animate([
        { "--field-wave": "0px", opacity: 0.92 },
        { "--field-wave": `${distance * 0.52}px`, opacity: 0.68, offset: 0.41 },
        { "--field-wave": `${distance}px`, opacity: 0 },
      ], { duration: 1530, easing: "cubic-bezier(.21,.65,.31,1)" });
      wave = animation;
      void animation.finished.then(() => {
        if (wave === animation) delete ripple.dataset.waving;
      }).catch(() => {});
    }, { signal });
    window.addEventListener("scroll", schedule, { passive: true, signal });
    window.addEventListener("resize", schedule, { passive: true, signal });
    document.addEventListener("visibilitychange", stopMotion, { signal });
    window.addEventListener("octagram:menu", stopMotion, { signal });
    reduced.addEventListener("change", stopMotion, { signal });
    return () => {
      abort.abort();
      edgeObserver?.disconnect();
      cancelAnimationFrame(frame);
      wave?.cancel();
    };
  }, []);

  return <div className="work-portfolio-field" ref={fieldRef} data-motion-scene data-running="false">
    <div className="portfolio-through-lines" aria-hidden="true">
      <div className="portfolio-field-base"/>
      <div className="portfolio-field-current">
        {railPositions.map((left, index) => <i className="portfolio-line-light" key={left}
          style={{ left: `${left}%`, animationDelay: `${-1.4 - index * 2.75}s` }}/>)}
        <svg className="portfolio-field-mark portfolio-field-mark--arc" viewBox="0 0 96 85">
          <path d="M0 66h19V16h63v46H54v22"/><path d="M19 42h26v23h25"/><circle cx="82" cy="16" r="3"/>
        </svg>
        <svg className="portfolio-field-mark portfolio-field-mark--branch" viewBox="0 0 86 92">
          <path d="M1 15h52v31h26M79 46v45M31 46H12v27h41V46"/>
          <circle cx="31" cy="46" r="3"/><rect x="75" y="42" width="8" height="8" rx="1"/>
        </svg>
        <svg className="portfolio-field-mark portfolio-field-mark--node" viewBox="0 0 53 68">
          <path d="M24 0v21L5 34l19 16 19-16-19-13m0 29v18"/><circle cx="24" cy="34" r="4"/>
        </svg>
      </div>
      <div className="portfolio-dot-layer portfolio-dot-glow" ref={glowRef}/>
      <div className="portfolio-dot-layer portfolio-dot-wave" ref={waveRef}/>
    </div>
    {children}
    <div className="portfolio-bottom-blur" ref={bottomRef} aria-hidden="true"/>
  </div>;
}
