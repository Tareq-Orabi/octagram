"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
  const [inView, setInView] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [globalPaused, setGlobalPaused] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [width, setWidth] = useState(1100);
  const [height, setHeight] = useState(860);
  const viewport = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const rotation = useRef(0);
  const resumeAt = useRef(0);
  const contents = useRef<(HTMLDivElement | null)[]>([]);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef<{
    id: number;
    x: number;
    rotation: number;
    moved: boolean;
    target: HTMLElement;
  } | null>(null);
  const dragged = useRef(false);

  const small = width <= 600;
  const cardWidth = Math.min(348, width - 54);
  const radius = small
    ? Math.min(width * 0.37, height * 0.42 - 62, 220)
    : Math.min(width * 0.39, 280);
  const overviewScale = small
    ? Math.max(0.2, 52 / cardWidth)
    : Math.min(0.29, width * 0.00038);

  // Only transforms change per frame; the eight cards do not re-render to orbit.
  const positionCards = useCallback(() => {
    cards.current.forEach((card, index) => {
      if (!card) return;
      if (!enhanced) {
        card.style.removeProperty("transform");
        return;
      }
      const angle =
        ((index * (360 / services.length) + rotation.current) * Math.PI) / 180;
      const delta =
        selected === null
          ? 0
          : ((index - selected + services.length + services.length / 2) %
              services.length) -
            services.length / 2;
      const active = index === selected;
      const focusAngle = delta * 0.53;
      const x =
        selected === null
          ? Math.sin(angle) * radius
          : Math.sin(focusAngle) * (small ? 610 : 880);
      const y =
        selected === null
          ? -Math.cos(angle) * radius
          : (1 - Math.cos(focusAngle)) * 360;
      const scale = selected === null ? overviewScale : active ? 1 : 0.82;
      card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${active && !small ? 60 : 0}px) rotate(0deg) scale(${scale})`;
    });
  }, [enhanced, selected, services.length, radius, small, overviewScale]);

  useLayoutEffect(positionCards, [positionCards]);

  const finishDrag = useCallback(() => {
    const current = drag.current;
    drag.current = null;
    setDragging(false);
    if (current?.target.hasPointerCapture(current.id))
      current.target.releasePointerCapture(current.id);
  }, []);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setEnhanced(!preference.matches);
      setSelected(null);
      setFocusPaused(false);
      finishDrag();
    };
    sync();
    preference.addEventListener("change", sync);
    const element = viewport.current!;
    const resize = new ResizeObserver(() => {
      setWidth(element.clientWidth);
      setHeight(element.clientHeight);
    });
    resize.observe(element);
    const visibility = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (!entry.isIntersecting) {
          // A detail view or interrupted gesture must not strand the wheel.
          resumeAt.current = 0;
          setSelected(null);
          setFocusPaused(false);
          finishDrag();
        }
      },
      { threshold: 0 },
    );
    visibility.observe(element);
    const onMotion = (event: Event) =>
      setGlobalPaused(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener("octagram:motion", onMotion);
    const releasePointer = (event: PointerEvent) => {
      if (event.pointerId === drag.current?.id) finishDrag();
    };
    const leaveWindow = () => {
      finishDrag();
      setFocusPaused(false);
    };
    window.addEventListener("pointerup", releasePointer);
    window.addEventListener("pointercancel", releasePointer);
    window.addEventListener("blur", leaveWindow);
    document.addEventListener("visibilitychange", leaveWindow);
    return () => {
      preference.removeEventListener("change", sync);
      resize.disconnect();
      visibility.disconnect();
      window.removeEventListener("octagram:motion", onMotion);
      window.removeEventListener("pointerup", releasePointer);
      window.removeEventListener("pointercancel", releasePointer);
      window.removeEventListener("blur", leaveWindow);
      document.removeEventListener("visibilitychange", leaveWindow);
    };
  }, [finishDrag]);

  useEffect(() => {
    if (!enhanced || selected === null) return;
    const hashAtSelection = location.hash;
    const timer = window.setTimeout(() => {
      const element = viewport.current;
      const card = cards.current[selected];
      if (small && element && card && location.hash === hashAtSelection) {
        const headerBottom =
          document.querySelector(".header")?.getBoundingClientRect().bottom ??
          76;
        // The explore button sits below the wheel. Bring the opened card back
        // below the phone's fixed navigation instead of opening it off-screen.
        const top =
          element.getBoundingClientRect().top +
          element.clientHeight * 0.42 -
          card.offsetHeight / 2;
        window.scrollTo({
          top: Math.max(0, scrollY + top - headerBottom - 12),
          behavior: "smooth",
        });
      }
      contents.current[selected]?.focus({ preventScroll: true });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [selected, enhanced, small]);

  useEffect(() => {
    setSpinning(false);
    if (
      !enhanced ||
      selected !== null ||
      globalPaused ||
      (focusPaused && inView) ||
      dragging
    )
      return;
    let frame = 0;
    let previous = 0;
    const tick = (now: number) => {
      if (previous) {
        const delta = Math.min(now - previous, 64);
        if (!document.hidden) {
          rotation.current = (rotation.current + delta * 0.006) % 360;
          positionCards();
        }
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    // Let the selected card return to the wheel before starting its orbit.
    const timer = window.setTimeout(
      () => {
        setSpinning(true);
        frame = requestAnimationFrame(tick);
      },
      Math.max(0, resumeAt.current - performance.now()),
    );
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [
    enhanced,
    inView,
    selected,
    globalPaused,
    focusPaused,
    dragging,
    positionCards,
  ]);

  const choose = (index: number) => {
    finishDrag();
    setFocusPaused(false);
    setSelected(index);
  };
  const back = (restoreFocus: boolean) => {
    const previous = selected;
    resumeAt.current = performance.now() + 1050;
    setFocusPaused(false);
    setSelected(null);
    if (restoreFocus && previous !== null)
      requestAnimationFrame(() =>
        triggers.current[previous]?.focus({ preventScroll: true }),
      );
  };
  const move = (direction: number) =>
    setSelected(
      (current) =>
        ((current ?? 0) + direction + services.length) % services.length,
    );

  return (
    <div
      className={`service-gallery${enhanced ? " is-enhanced" : ""}${selected !== null ? " is-focused" : ""}${selected === null && (spinning || dragging) ? " is-spinning" : ""}`}
      onFocusCapture={(event) =>
        setFocusPaused(
          Boolean(
            (event.target as HTMLElement).closest(
              ".service-card-trigger:focus-visible",
            ),
          ),
        )
      }
      onBlurCapture={(event) =>
        setFocusPaused(
          Boolean(
            (event.relatedTarget as HTMLElement | null)?.closest?.(
              ".service-card-trigger:focus-visible",
            ),
          ),
        )
      }
      onKeyDown={(event) => {
        if (!enhanced || event.target instanceof HTMLAnchorElement) return;
        if (event.key === "Escape" && selected !== null) {
          event.preventDefault();
          back(true);
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
            !event.isPrimary
          )
            return;
          const control = (event.target as HTMLElement).closest<HTMLElement>(
            "button, a",
          );
          if (control && !control.classList.contains("service-card-trigger"))
            return;
          const target = control || event.currentTarget;
          dragged.current = false;
          setDragging(true);
          drag.current = {
            id: event.pointerId,
            x: event.clientX,
            rotation: rotation.current,
            moved: false,
            target,
          };
          // Capture on the actual trigger so a tap still dispatches its click.
          target.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const current = drag.current;
          if (!current || current.id !== event.pointerId) return;
          const delta = event.clientX - current.x;
          if (Math.abs(delta) > 8) {
            current.moved = true;
            dragged.current = true;
            rotation.current = current.rotation + delta * 0.3;
            positionCards();
          }
        }}
        onPointerUp={(event) => {
          if (drag.current?.id !== event.pointerId) return;
          finishDrag();
        }}
        onPointerCancel={finishDrag}
        onLostPointerCapture={finishDrag}
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
            const delta =
              selected === null
                ? 0
                : ((index - selected + services.length + services.length / 2) %
                    services.length) -
                  services.length / 2;
            const active = index === selected;
            const palette = palettes[index % palettes.length];
            const style = {
              "--card-a": `var(--brand-${palette[0]})`,
              "--card-b": `var(--brand-${palette[1]})`,
              "--card-c": `var(--brand-${palette[2]})`,
              zIndex: active ? 12 : 8 - Math.abs(delta),
            } as CSSProperties;
            return (
              <article
                ref={(element) => {
                  cards.current[index] = element;
                }}
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
                  aria-expanded={active}
                  aria-controls={`service-${service.id}`}
                  tabIndex={!enhanced || active ? -1 : 0}
                  onClick={(event) => {
                    if (event.detail === 0 || !dragged.current) choose(index);
                    dragged.current = false;
                  }}
                >
                  <span>{service.title}</span>
                </button>
                <div
                  className="service-card-content"
                  tabIndex={-1}
                  ref={(element) => {
                    contents.current[index] = element;
                  }}
                  id={`service-${service.id}`}
                  aria-hidden={enhanced && !active}
                  inert={enhanced && !active}
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
                    Previous
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
                    Next
                  </button>
                </div>
                <button
                  type="button"
                  className="service-back"
                  onClick={(event) => back(event.detail === 0)}
                >
                  All services
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <p className="service-gallery-note">
        From the first idea to the systems behind it.
      </p>
    </div>
  );
}
