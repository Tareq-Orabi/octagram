"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Direction = "left" | "right" | "up" | "down";
const directions: readonly Direction[] = ["left", "right", "up", "down"];

/** The front alone establishes the card's intrinsic responsive dimensions. */
export default function ProjectFlipCard({
  id, className, title, front, children,
}: {
  id?: string;
  className: string;
  title: string;
  front: ReactNode;
  children: ReactNode;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<Direction>("right");
  const [busy, setBusy] = useState(false);
  const card = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const backHeader = useRef<HTMLElement>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const locked = useRef(false), previousOpen = useRef(false), reduced = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const unlock = () => {
    window.clearTimeout(timer.current);
    locked.current = false;
    setBusy(false);
  };
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { reduced.current = media.matches; if (media.matches) unlock(); };
    sync();
    media.addEventListener("change", sync);
    return () => { media.removeEventListener("change", sync); window.clearTimeout(timer.current); };
  }, []);

  useLayoutEffect(() => {
    if (previousOpen.current === open) return;
    previousOpen.current = open;
    if (open && scrollArea.current) scrollArea.current.scrollTop = 0;
    (open ? backButton.current : trigger.current)?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!card.current || !backHeader.current) return;
      const rect = card.current.getBoundingClientRect();
      const siteHeader = document.querySelector<HTMLElement>(".header")?.getBoundingClientRect();
      const barHeight = backHeader.current.offsetHeight;
      const top = Math.max(12, (siteHeader?.bottom ?? 0) + 12);
      const shift = Math.max(0, Math.min(rect.height - barHeight, top - rect.top));
      backHeader.current.style.setProperty("--return-shift", `${shift.toFixed(2)}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    if (card.current) observer.observe(card.current);
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [open]);

  const turn = (next: boolean) => {
    if (locked.current || next === open) return;
    // Move focus before making its previous face inert and aria-hidden.
    card.current?.focus({ preventScroll: true });
    if (next) setDirection(directions[Math.floor(Math.random() * directions.length)]);
    setOpen(next);
    if (!reduced.current && !document.documentElement.classList.contains("journey-paused")) {
      locked.current = true;
      setBusy(true);
      timer.current = window.setTimeout(unlock, 800);
    }
  };

  return (
    <article
      ref={card}
      id={id}
      className={`${className} flip-card`}
      aria-label={`${title} project`}
      tabIndex={-1}
      data-open={open}
      data-direction={direction}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) { event.preventDefault(); turn(false); }
      }}
    >
      <div className="project-arrival-layer">
      <span className="project-comet" aria-hidden="true" />
      <div
        className="flip-card__rotor"
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && event.propertyName === "transform") unlock();
        }}
      >
        <div className="flip-card__face flip-card__front" aria-hidden={open} inert={open}>
          {front}
          <button
            ref={trigger}
            className="flip-card__open"
            type="button"
            aria-label={`Explore ${title}`}
            aria-expanded={open}
            aria-controls={`${uid}-details`}
            aria-disabled={busy || undefined}
            onClick={() => turn(true)}
          ><span aria-hidden="true">+</span></button>
        </div>
        <div className="flip-card__face flip-card__back" aria-hidden={!open} inert={!open}>
          <header ref={backHeader} className="flip-card__back-header">
            <h3 id={`${uid}-title`}>{title}</h3>
            <button
              ref={backButton}
              type="button"
              className="flip-card__return"
              aria-label={`Return to ${title} front`}
              aria-disabled={busy || undefined}
              onClick={() => turn(false)}
            ><span aria-hidden="true">↶</span> Back</button>
          </header>
          <div
            ref={scrollArea}
            id={`${uid}-details`}
            className="flip-card__scroll showcase-detail-content"
            role="region"
            aria-labelledby={`${uid}-title`}
            tabIndex={open ? 0 : -1}
          >{children}</div>
        </div>
      </div>
      </div>
      <span className="project-impact" aria-hidden="true" />
    </article>
  );
}
