"use client";

import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import type { CompanyService } from "@/lib/company-content";

const palettes = [
  ["teal", "orange", "peach"],
  ["orange", "mint", "teal"],
  ["teal", "peach", "yellow"],
  ["coral", "teal", "mint"],
  ["mint", "orange", "peach"],
  ["teal", "yellow", "mint"],
  ["orange", "peach", "yellow"],
  ["mint", "teal", "yellow"],
];

/** The reference's flat geometric prints, drawn in the existing brand palette. */
const CardPrint = memo(function CardPrint({ index }: { index: number }) {
  const id = `service-ink-${index}`;
  return (
    <svg
      className="service-print"
      viewBox="0 0 360 520"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="var(--card-b)" />
          <stop offset="1" stopColor="var(--card-c)" />
        </linearGradient>
        <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--card-a)" />
          <stop offset="1" stopColor="var(--page-bg)" />
        </linearGradient>
      </defs>
      <rect width="360" height="520" fill={`url(#${id}-base)`} />
      <g fill={`url(#${id})`} stroke="var(--card-c)" strokeWidth="1">
        {index === 0 && (
          <circle
            cx="112"
            cy="245"
            r="174"
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth="92"
          />
        )}
        {index === 1 && (
          <path d="M-45 100C130-70 190 310 410 170V295C180 435 120 75-45 230Z" />
        )}
        {index === 2 && (
          <>
            <circle cx="180" cy="218" r="145" />
            <path d="M-20 300H380V540H-20Z" fill={`url(#${id}-base)`} />
          </>
        )}
        {index === 3 && (
          <>
            <path d="M-30 0H390V190L-30 360Z" />
            <path d="M-30 410 390 230V350L-30 530Z" opacity=".7" />
          </>
        )}
        {index === 4 && (
          <>
            <path d="M0 80H150V190H250V300H360V520H0Z" />
            <path d="M0 175H85V285H185V395H285V520H0Z" fill="var(--card-a)" />
          </>
        )}
        {index === 5 && (
          <>
            <circle
              cx="15"
              cy="180"
              r="190"
              fill="none"
              stroke={`url(#${id})`}
              strokeWidth="68"
            />
            <circle
              cx="345"
              cy="360"
              r="190"
              fill="none"
              stroke={`url(#${id})`}
              strokeWidth="68"
            />
          </>
        )}
        {index === 6 && (
          <>
            {[0, 1, 2].map((row) =>
              [0, 1, 2].map((col) => (
                <rect
                  key={`${row}-${col}`}
                  x={col * 133 - 20}
                  y={row * 133 + 65}
                  width="110"
                  height="110"
                  rx="55"
                  opacity={1 - (row + col) * 0.09}
                />
              )),
            )}
          </>
        )}
        {index === 7 && (
          <>
            <path d="M-60 200Q180-60 420 200Q180 460-60 200Z" />
            <circle cx="180" cy="200" r="90" fill="var(--card-a)" />
            <circle cx="180" cy="200" r="36" fill="var(--card-c)" />
          </>
        )}
      </g>
    </svg>
  );
});

export default function ServiceCards({
  services,
}: {
  services: CompanyService[];
}) {
  const [enhanced, setEnhanced] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [inView, setInView] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [globalPaused, setGlobalPaused] = useState(false);
  const [width, setWidth] = useState(1100);
  const viewport = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef<{ id: number; x: number; rotation: number } | null>(null);
  const dragged = useRef(false);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setEnhanced(!preference.matches);
    sync();
    preference.addEventListener("change", sync);
    const element = viewport.current!;
    const resize = new ResizeObserver(() => setWidth(element.clientWidth));
    resize.observe(element);
    const visibility = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    );
    visibility.observe(element);
    const onMotion = (event: Event) =>
      setGlobalPaused(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener("octagram:motion", onMotion);
    return () => {
      preference.removeEventListener("change", sync);
      resize.disconnect();
      visibility.disconnect();
      window.removeEventListener("octagram:motion", onMotion);
    };
  }, []);

  useEffect(() => {
    if (!enhanced || selected === null || !detail.current) return;
    const panel = detail.current;
    panel.focus({ preventScroll: true });
    const bounds = panel.getBoundingClientRect();
    if (bounds.top < 120 || bounds.bottom > window.innerHeight - 20)
      panel.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selected, enhanced]);

  useEffect(() => {
    if (!enhanced || !inView || globalPaused || dragging) return;
    let frame = 0;
    let previous = 0;
    const tick = (now: number) => {
      if (previous && now - previous >= 32) {
        const delta = Math.min(now - previous, 64);
        if (!document.hidden)
          setRotation((value) => (value + delta * 0.006) % 360);
        previous = now;
      } else if (!previous) previous = now;
      frame = requestAnimationFrame(tick);
    };
    // Keep the orbit running while a visitor hovers, focuses, or reads a service.
    // Details have their own stationary surface so the text stays easy to read.
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enhanced, inView, globalPaused, dragging]);

  const choose = (index: number) => setSelected(index);
  const back = () => {
    const previous = selected;
    setSelected(null);
    if (previous !== null)
      requestAnimationFrame(() =>
        triggers.current[previous]?.focus({ preventScroll: true }),
      );
  };
  const move = (direction: number) =>
    setSelected(
      (current) =>
        ((current ?? 0) + direction + services.length) % services.length,
    );
  const small = width < 600;
  const cardWidth = Math.min(348, width - 54);
  const radius = Math.min(width * 0.39, 280);
  const overviewScale = small
    ? width < 350
      ? 0.13
      : 0.15
    : Math.min(0.29, width * 0.00038);
  const current = selected === null ? null : services[selected];

  return (
    <div
      className={`service-gallery${enhanced ? " is-enhanced is-spinning" : ""}${selected !== null ? " is-focused" : ""}`}
      onKeyDown={(event) => {
        if (!enhanced || event.target instanceof HTMLAnchorElement) return;
        if (event.key === "Escape" && selected !== null) {
          event.preventDefault();
          back();
        }
        if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          if (event.key === "Home") choose(0);
          else if (event.key === "End") choose(services.length - 1);
          else move(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
      <div className="service-gallery-topline">
        <span>WHAT WE DO</span>
        <span>01 — 08</span>
      </div>
      <div
        className="service-viewport"
        ref={viewport}
        style={{ "--card-width": `${cardWidth}px` } as CSSProperties}
        onPointerDown={(event) => {
          if (
            !enhanced ||
            selected !== null ||
            event.button !== 0 ||
            (event.target as HTMLElement).closest(".service-gallery-controls")
          )
            return;
          dragged.current = false;
          setDragging(true);
          drag.current = { id: event.pointerId, x: event.clientX, rotation };
        }}
        onPointerMove={(event) => {
          const currentDrag = drag.current;
          if (!currentDrag || currentDrag.id !== event.pointerId) return;
          const delta = event.clientX - currentDrag.x;
          if (Math.abs(delta) > 8) {
            dragged.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            setRotation(currentDrag.rotation + delta * 0.3);
          }
        }}
        onPointerUp={(event) => {
          if (drag.current?.id !== event.pointerId) return;
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
          drag.current = null;
          setDragging(false);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
        }}
        onLostPointerCapture={() => {
          drag.current = null;
          setDragging(false);
        }}
      >
        <div className="service-wheel-heading">
          <h2 id="expertise-title">
            Our <span>Services.</span>
          </h2>
          <p>
            From a first idea
            <br />
            to a working product.
          </p>
        </div>
        <div
          className="service-orbit"
          role="group"
          aria-label="Octagram service cards"
        >
          {services.map((service, index) => {
            const radians =
              ((index * (360 / services.length) + rotation) * Math.PI) / 180;
            const active = index === selected;
            const palette = palettes[index % palettes.length];
            const style = {
              "--card-a": `var(--brand-${palette[0]})`,
              "--card-b": `var(--brand-${palette[1]})`,
              "--card-c": `var(--brand-${palette[2]})`,
              transform: enhanced
                ? `translate(-50%, -50%) translate3d(${Math.sin(radians) * radius}px, ${-Math.cos(radians) * radius}px, 0) scale(${overviewScale})`
                : undefined,
            } as CSSProperties;
            return (
              <article
                className={`service-card${active ? " is-selected" : ""}`}
                style={style}
                key={service.id}
                data-service={index}
              >
                <div className="service-cover">
                  <CardPrint index={index} />
                  <span className="service-card-number">
                    {service.number} / OCTAGRAM
                  </span>
                </div>
                <button
                  type="button"
                  className="service-card-trigger"
                  ref={(element) => {
                    triggers.current[index] = element;
                  }}
                  aria-label={`Explore ${service.title}`}
                  aria-expanded={enhanced && active}
                  aria-controls={
                    enhanced ? "service-detail" : `service-${service.id}`
                  }
                  tabIndex={enhanced ? 0 : -1}
                  onClick={(event) => {
                    if (event.detail === 0 || !dragged.current) choose(index);
                    dragged.current = false;
                  }}
                >
                  <span>{service.title}</span>
                </button>
                <div
                  className="service-card-content"
                  id={`service-${service.id}`}
                  aria-hidden={enhanced}
                  inert={enhanced}
                >
                  <h3>{service.title}</h3>
                  <ul>
                    {service.offerings.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <a href="#contact" className="service-enquire">
                    Let’s build together
                  </a>
                </div>
              </article>
            );
          })}
        </div>
        {enhanced && (
          <>
            <section
              id="service-detail"
              className="service-detail-panel"
              hidden={!current}
              ref={detail}
              tabIndex={-1}
              aria-labelledby={current ? "service-detail-title" : undefined}
            >
              {current && (
                <>
                  <span className="service-detail-number">
                    {current.number} / OUR SERVICES
                  </span>
                  <h3 id="service-detail-title">{current.title}</h3>
                  <ul>
                    {current.offerings.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <a href="#contact" className="service-enquire">
                    Let’s build together <span aria-hidden="true">↗</span>
                  </a>
                </>
              )}
            </section>
            <div className="service-gallery-controls">
              {selected === null ? (
                <>
                  <p>Select a card to explore · Drag to rotate</p>
                  <div className="service-wheel-actions">
                    <button
                      type="button"
                      className="service-explore"
                      onClick={() => choose(0)}
                    >
                      Explore services
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="service-pagination">
                    <button
                      type="button"
                      aria-label="Previous service"
                      onClick={() => move(-1)}
                    >
                      ← Previous
                    </button>
                    <span aria-live="polite" aria-atomic="true">
                      {String(selected + 1).padStart(2, "0")} /{" "}
                      {String(services.length).padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      aria-label="Next service"
                      onClick={() => move(1)}
                    >
                      Next →
                    </button>
                  </div>
                  <button type="button" className="service-back" onClick={back}>
                    All services
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
      <p className="service-gallery-note">
        From the first idea to the systems behind it.
      </p>
    </div>
  );
}
