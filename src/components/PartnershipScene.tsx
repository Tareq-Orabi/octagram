"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { clamp01 } from "@/lib/scroll-math";
import { compactMotionQuery } from "@/lib/experience-preferences";
import type { TitledDescription } from "@/lib/company-content";
import PartnershipCircuit from "./PartnershipCircuit";

const accents = ["#f4ad83", "#a9e6c4", "#cfeb92", "#ffac79", "#ff947e", "#7de1d0"] as const;
const proximity = 176;

function motionOn() {
  return !matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !document.documentElement.classList.contains("journey-paused");
}

type Spot = { card: number; connected: boolean };
type Drag = { from: number; id: number; x: number; y: number; gripX: number; gripY: number; moved: boolean };

function homeSpots(points: TitledDescription[]): Spot[] {
  return points.map((_, card) => ({ card, connected: false }));
}

export default function PartnershipScene({ points }: { points: TitledDescription[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const spots = useRef<(HTMLLIElement | null)[]>([]);
  const covers = useRef<(HTMLDivElement | null)[]>([]);
  const controls = useRef<(HTMLButtonElement | null)[]>([]);
  const ports = useRef<(HTMLButtonElement | null)[]>([]);
  const resetButton = useRef<HTMLButtonElement>(null);
  const drag = useRef<Drag | null>(null);
  const animation = useRef<Animation[]>([]);
  const landing = useRef(false);
  const hovered = useRef(-1);
  const dragFrame = useRef(0);
  const suppressClick = useRef(false);
  const [layout, setLayout] = useState(() => homeSpots(points));
  const [selected, setSelected] = useState<number | null>(null);
  const [assembled, setAssembled] = useState(false);
  const [message, setMessage] = useState("");
  const connections = useMemo(() => layout.map(spot => spot.connected ? accents[spot.card] : null), [layout]);
  const connected = layout.filter(spot => spot.connected).length;

  function hover(index: number) {
    if (hovered.current === index) return;
    const previous = spots.current[hovered.current];
    if (previous) delete previous.dataset.dragOver;
    hovered.current = index;
    const next = spots.current[index];
    if (next) next.dataset.dragOver = "true";
  }

  function spotAt(x: number, y: number) {
    return spots.current.findIndex(element => {
      if (!element || element.dataset.connected === "true") return false;
      const rect = element.getBoundingClientRect();
      return x >= rect.left - 8 && x <= rect.right + 8 && y >= rect.top - 5 && y <= rect.bottom + 5;
    });
  }

  function positionDrag() {
    dragFrame.current = 0;
    const active = drag.current;
    const area = stage.current;
    if (!active?.moved || !area) return;
    const cover = covers.current[active.from];
    const home = spots.current[active.from]?.getBoundingClientRect();
    if (!cover || !home) return;
    const bounds = area.getBoundingClientRect();
    const x = Math.min(bounds.right - home.width, Math.max(bounds.left, active.x - active.gripX));
    const y = Math.min(bounds.bottom - home.height, Math.max(bounds.top, active.y - active.gripY));
    const destination = spotAt(active.x, active.y);
    cover.style.setProperty("--drag-x", `${x - home.left}px`);
    cover.style.setProperty("--drag-y", `${y - home.top}px`);
    hover(destination);
  }

  function clearCover(index: number) {
    const cover = covers.current[index];
    cover?.style.removeProperty("--drag-x");
    cover?.style.removeProperty("--drag-y");
    if (cover) delete cover.dataset.lifted;
  }

  function land(from: number, to: number | null, keyboard = false) {
    if (landing.current || layout[from].connected || (to !== null && layout[to].connected)) return;
    const cover = covers.current[from], start = spots.current[from]?.getBoundingClientRect();
    const target = spots.current[to ?? from]?.getBoundingClientRect();
    if (!cover || !start || !target) return;
    landing.current = true;

    function finish() {
      if (!landing.current) return;
      landing.current = false;
      animation.current.forEach(item => item.cancel());
      animation.current = [];
      clearCover(from);
      if (to !== null) clearCover(to);
      setSelected(null);
      if (to === null) return;
      const next = layout.slice();
      if (from !== to) next[from] = layout[to];
      next[to] = { card: layout[from].card, connected: true };
      setLayout(next);
      setMessage(next.every(spot => spot.connected) ? "All six cards connected. Octagram is assembling." : `${points[layout[from].card].title} connected.`);
      if (!keyboard && next.every(spot => spot.connected) && matchMedia("(max-width: 820px)").matches) {
        stage.current?.querySelector(".partnership-mark")?.scrollIntoView({ block: "center", behavior: motionOn() ? "smooth" : "instant" });
      }
      if (keyboard) {
        const open = next.findIndex(spot => !spot.connected);
        requestAnimationFrame(() => (open < 0 ? resetButton.current : controls.current[open])?.focus());
      }
    }

    if (!motionOn() || !cover.animate) { finish(); return; }

    function move(index: number, destination: number, x: number, y: number, seats: boolean) {
      const element = covers.current[index], receiving = covers.current[destination];
      if (!element || !receiving) return;
      element.dataset.lifted = "true";
      const float = getComputedStyle(receiving);
      const finishAt = seats ? [0, 0] : [
        Number.parseFloat(float.getPropertyValue("--rest-x")) || 0,
        Number.parseFloat(float.getPropertyValue("--rest-y")) || 0,
      ];
      const motion = element.animate([
        { transform: getComputedStyle(element).transform },
        { transform: `translate3d(${x + finishAt[0]}px,${y + finishAt[1]}px,0)` },
      ], { duration: seats ? 305 : 310, easing: "cubic-bezier(.21,.75,.22,1)", fill: "both" });
      animation.current.push(motion);
      return motion;
    }

    const x = target.left - start.left, y = target.top - start.top;
    if (to !== null && to !== from) move(to, from, -x, -y, false);
    const leading = move(from, to ?? from, x, y, to !== null);
    if (leading) leading.onfinish = finish;
    else finish();
  }

  function pickUp(event: ReactPointerEvent<HTMLButtonElement>, from: number) {
    if (event.pointerType === "touch" || event.button !== 0 || !event.isPrimary || landing.current || drag.current) return;
    const box = covers.current[from]?.getBoundingClientRect();
    if (!box || layout[from].connected) return;
    drag.current = {
      from, id: event.pointerId, x: event.clientX, y: event.clientY,
      gripX: event.clientX - box.left, gripY: event.clientY - box.top, moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function follow(event: ReactPointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (!active || event.pointerId !== active.id) return;
    if (!active.moved && Math.hypot(event.clientX - active.x, event.clientY - active.y) < 6) return;
    if (!active.moved) {
      active.moved = true;
      const cover = covers.current[active.from];
      if (cover) cover.dataset.lifted = "true";
      setSelected(active.from);
    }
    active.x = event.clientX;
    active.y = event.clientY;
    if (!dragFrame.current) dragFrame.current = requestAnimationFrame(positionDrag);
  }

  function release(event: ReactPointerEvent<HTMLButtonElement> | null, cancelled = false) {
    const active = drag.current;
    if (!active || (event && active.id !== event.pointerId)) return;
    cancelAnimationFrame(dragFrame.current);
    dragFrame.current = 0;
    if (active.moved && event && !cancelled) {
      active.x = event.clientX;
      active.y = event.clientY;
      positionDrag();
    }
    drag.current = null;
    const button = controls.current[active.from];
    if (button?.hasPointerCapture(active.id)) button.releasePointerCapture(active.id);
    hover(-1);
    if (!active.moved) return;
    suppressClick.current = true;
    requestAnimationFrame(() => { suppressClick.current = false; });
    const to = cancelled ? -1 : spotAt(active.x, active.y);
    land(active.from, to < 0 ? null : to);
  }

  function reset() {
    landing.current = false;
    animation.current.forEach(item => item.cancel());
    animation.current = [];
    const active = drag.current;
    drag.current = null;
    if (active && controls.current[active.from]?.hasPointerCapture(active.id))
      controls.current[active.from]?.releasePointerCapture(active.id);
    cancelAnimationFrame(dragFrame.current);
    dragFrame.current = 0;
    covers.current.forEach((_, index) => clearCover(index));
    hover(-1);
    setSelected(null);
    setLayout(homeSpots(points));
    setAssembled(false);
    setMessage("Connections reset.");
  }

  useEffect(() => {
    const surface = stage.current;
    const section = surface?.closest<HTMLElement>(".working-together");
    const title = section?.querySelector<HTMLElement>(".partnership-title");
    if (!surface || !section || !title) return;
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const compact = matchMedia(compactMotionQuery);
    const abort = new AbortController(), { signal } = abort;
    let pointer: { x: number; y: number } | undefined;
    let frame = 0;

    function clearEdges() {
      pointer = undefined;
      cancelAnimationFrame(frame);
      frame = 0;
      for (const card of covers.current) {
        card?.style.removeProperty("--edge-intensity");
        if (card) delete card.dataset.edgeNear;
      }
    }

    function paintEdges() {
      frame = 0;
      if (!pointer) return;
      const { x, y } = pointer;
      const measured = covers.current.flatMap(card => card ? [{ card, rect: card.getBoundingClientRect() }] : []);
      for (const { card, rect } of measured) {
        const localX = x - rect.left, localY = y - rect.top;
        const px = Math.max(0, Math.min(rect.width, localX));
        const py = Math.max(0, Math.min(rect.height, localY));
        const outside = Math.hypot(localX - px, localY - py);
        const inside = Math.min(px, py, rect.width - px, rect.height - py);
        const light = clamp01(1 - (outside + inside) / proximity);
        card.style.setProperty("--edge-intensity", (light ** 1.09).toFixed(3));
        if (light > 0) {
          card.style.setProperty("--edge-x", `${px}px`);
          card.style.setProperty("--edge-y", `${py}px`);
          card.dataset.edgeNear = "true";
        } else delete card.dataset.edgeNear;
      }
    }

    function aim(event: PointerEvent) {
      if (!fine.matches || compact.matches || reduced.matches || event.pointerType === "touch" ||
          document.documentElement.classList.contains("journey-paused")) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(paintEdges);
    }

    const arrival = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      section.dataset.boardEntered = "true";
      arrival.disconnect();
    }, { threshold: .35 });
    arrival.observe(title);
    if (location.hash === "#why-octagram") section.dataset.boardEntered = "true";

    section.addEventListener("pointermove", aim, { passive: true, signal });
    section.addEventListener("pointerleave", clearEdges, { signal });
    reduced.addEventListener("change", clearEdges, { signal });
    document.addEventListener("visibilitychange", clearEdges, { signal });
    window.addEventListener("scroll", () => {
      if (drag.current?.moved && !dragFrame.current) dragFrame.current = requestAnimationFrame(positionDrag);
      if (pointer && !frame) frame = requestAnimationFrame(paintEdges);
    }, { passive: true, signal });

    return () => {
      abort.abort();
      arrival.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(dragFrame.current);
      animation.current.forEach(item => item.cancel());
    };
  }, []);

  return (
    <div className="partnership-stage" ref={stage} data-picking={selected !== null} data-assembled={assembled}
      onKeyDown={event => {
        if (event.key !== "Escape") return;
        release(null, true);
        setSelected(null);
        setMessage("");
      }}>
      <PartnershipCircuit field={stage} spots={spots} connections={connections}
        complete={connected === layout.length} onAssembled={setAssembled} />
      <ol className="partnership-points" aria-label="Working together">
        {layout.map(({ card, connected: inPlace }, index) => {
          const point = points[card];
          const current = selected === index;
          return (
            <li className="partnership-point" key={index} data-connected={inPlace} data-selected={current}
              ref={node => { spots.current[index] = node; }}
              style={{
                "--point-accent": accents[card], "--point-index": index,
                gridColumn: index % 2 ? 3 : 1, gridRow: Math.floor(index / 2) + 1,
              } as CSSProperties}>
              <span className="partnership-spot" aria-hidden="true"><i /><i /><i /><i /></span>
              <div className="partnership-keycap" ref={node => { covers.current[index] = node; }}>
                <div className="partnership-key-face">
                  <span className="partnership-key-icon" aria-hidden="true" />
                  <h3 id={`partnership-title-${card}`}>{point.title}</h3>
                  <p id={`partnership-copy-${card}`}>{point.description}</p>
                </div>
                {!inPlace && <button type="button" className="partnership-key-button"
                  ref={node => { controls.current[index] = node; }}
                  aria-labelledby={`partnership-title-${card}`} aria-describedby={`partnership-copy-${card}`}
                  aria-pressed={current}
                  onPointerDown={event => pickUp(event, index)} onPointerMove={follow}
                  onPointerUp={event => release(event)} onPointerCancel={event => release(event, true)}
                  onLostPointerCapture={event => release(event, true)}
                  onClick={event => {
                    if (suppressClick.current || landing.current) return;
                    setSelected(current ? null : index);
                    setMessage(current ? "" : `${point.title} picked up. Choose any open spot.`);
                    if (!current && event.detail === 0) requestAnimationFrame(() => ports.current[index]?.focus());
                  }} />}
              </div>
              <button type="button" className="partnership-port" ref={node => { ports.current[index] = node; }}
                disabled={inPlace || selected === null}
                aria-label={`Connect at the ${["upper", "middle", "lower"][Math.floor(index / 2)]} ${index % 2 ? "right" : "left"} spot`}
                onClick={event => { if (selected !== null) land(selected, index, event.detail === 0); }}>
                <span aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ol>
      <div className="partnership-actions" data-has-connections={connected > 0}>
        <button type="button" className="partnership-reset" ref={resetButton} onClick={reset}>Reset connections</button>
      </div>
      <p className="sr-only" role="status">{assembled ? "Octagram assembled." : message}</p>
    </div>
  );
}
