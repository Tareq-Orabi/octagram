"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Props = { id: string; label: string; labels: string[]; colors: string[]; children: ReactNode[]; className?: string; navigation?: "edges" | "projects"; sharedTilt?: boolean };

/** One viewport, explicit navigation, and a center-out reveal shared by Team and Projects. */
export default function StageDeck({ id, label, labels, colors, children, className = "", navigation = "edges", sharedTilt = false }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const choices = useRef<(HTMLButtonElement | null)[]>([]);
  const current = useRef(0), busy = useRef(false), queued = useRef<number | null>(null), alive = useRef(true);
  const reveal = useRef<Animation | null>(null), pointerFrame = useRef(0), nextFrame = useRef(0);
  const [active, setActive] = useState(0);
  const [incoming, setIncoming] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const beginRef = useRef<(index: number) => void>(() => {});
  const count = children.length;
  const begin = useCallback((target: number) => {
    const index = (target + count) % count;
    if (busy.current) { queued.current = index; return; }
    if (index === current.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = index; setActive(index); return;
    }
    busy.current = true; current.current = index; setIncoming(index);
  }, [count]);
  beginRef.current = begin;

  useEffect(() => {
    if (incoming === null) return;
    const panel = panels.current[incoming];
    if (!panel) return;
    const animation = panel.animate(navigation === "projects" ? [
      { clipPath: "ellipse(0% 0% at 50% 54%)", transform: "scale(1.025)" },
      { clipPath: "ellipse(65% 12% at 50% 52%)", transform: "scale(1.012)", offset: .42 },
      { clipPath: "ellipse(150% 150% at 50% 50%)", transform: "scale(1)" },
    ] : [
      { clipPath: "circle(0% at 50% 50%)" },
      { clipPath: "circle(150% at 50% 50%)" },
    ], { duration: navigation === "projects" ? 1150 : 1050, easing: "cubic-bezier(.76,0,.24,1)", fill: "both" });
    reveal.current = animation;
    if (document.hidden) animation.pause();
    const finish = () => {
      if (!alive.current) return;
      setActive(incoming); setIncoming(null); busy.current = false; reveal.current = null;
      const pending = queued.current; queued.current = null;
      if (pending !== null && pending !== incoming) nextFrame.current = requestAnimationFrame(() => beginRef.current(pending));
    };
    void animation.finished.then(finish).catch(() => {});
    return () => { animation.cancel(); };
  }, [incoming, navigation]);

  useEffect(() => {
    alive.current = true;
    const element = root.current!;
    const abort = new AbortController(), { signal } = abort;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false, menu = false;
    const sync = () => setRunning(visible && !document.hidden && !menu && !media.matches);
    const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); }, { threshold: .04 });
    observer.observe(element);
    const fit = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) (entry.target as HTMLElement).style.setProperty("--demo-scale",String(entry.contentRect.width/640));
      }
    });
    element.querySelectorAll<HTMLElement>("[data-fit-demo]").forEach(demo=>fit.observe(demo));
    document.addEventListener("visibilitychange", () => {
      sync(); if (document.hidden) reveal.current?.pause(); else if (reveal.current?.playState === "paused") reveal.current.play();
    }, { signal });
    media.addEventListener("change", () => { sync(); if (media.matches) reveal.current?.finish(); }, { signal });
    window.addEventListener("octagram:menu", event => { menu = Boolean((event as CustomEvent<boolean>).detail); sync(); }, { signal });
    element.addEventListener("keydown", event => {
      if ((event.target as Element).closest("input,textarea,select,dialog[open],details[open],[contenteditable=true]")) return;
      if ((event.target as Element).closest(".deck-project-dock")) return;
      if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
      event.preventDefault();
      beginRef.current(event.key === "Home" ? 0 : event.key === "End" ? count - 1 : (queued.current ?? current.current) + (event.key === "ArrowRight" ? 1 : -1));
    }, { signal });
    element.addEventListener("click", event => {
      const opener = (event.target as Element).closest<HTMLElement>("[data-open-stage-dialog]");
      if (opener) {
        const dialog = document.getElementById(opener.dataset.openStageDialog!) as HTMLDialogElement | null;
        dialog?.showModal();
      }
      if ((event.target as Element).closest("[data-close-stage-dialog]")) (event.target as Element).closest<HTMLDialogElement>("dialog")?.close();
    }, { signal });
    const hash = location.hash.slice(1);
    if (hash) {
      const target = panels.current.findIndex(panel => panel?.querySelector(`#${CSS.escape(hash)}`));
      if (target > 0) { current.current = target; setActive(target); }
    }
    return () => { alive.current = false; abort.abort(); observer.disconnect(); fit.disconnect(); reveal.current?.cancel(); cancelAnimationFrame(pointerFrame.current); cancelAnimationFrame(nextFrame.current); };
  }, [count]);

  const track = (event: React.PointerEvent<HTMLButtonElement>, side: number) => {
    if (event.pointerType !== "mouse") return;
    const button = event.currentTarget, bounds = button.getBoundingClientRect();
    const y = Math.max(28,Math.min(bounds.height - 28,event.clientY - bounds.top));
    const angle = Math.atan2(bounds.height / 2 - y,side * 36) * 180 / Math.PI;
    cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = requestAnimationFrame(() => { button.style.setProperty("--edge-y",`${y}px`); button.style.setProperty("--edge-angle",`${angle}deg`); });
  };
  const reset = (event: React.PointerEvent<HTMLButtonElement>, side: number) => {
    cancelAnimationFrame(pointerFrame.current); event.currentTarget.style.setProperty("--edge-y","50%"); event.currentTarget.style.setProperty("--edge-angle",side === 1 ? "0deg" : "180deg");
  };
  const themeIndex = incoming ?? active;
  return <div className={`stage-deck ${className}`} id={id} ref={root} role="region" aria-roledescription="carousel" aria-label={label} tabIndex={0}
    data-deck-index={active} data-deck-phase={incoming === null ? "idle" : "revealing"} data-deck-running={running} data-navigation={navigation}
    data-tilt={sharedTilt ? "" : undefined} data-tilt-strength={sharedTilt ? "3.2" : undefined}
    style={{ "--deck-color": colors[themeIndex], "--dock-index": themeIndex, "--dock-count": count } as CSSProperties}>
    <div className="deck-viewport" inert={incoming !== null}>{children.map((child,index) => <div className={`deck-slide ${incoming === index ? "deck-slide--arriving" : ""}`} key={labels[index]}
      ref={node => { panels.current[index] = node; }} hidden={index !== active && index !== incoming} data-current={incoming === null && index === active} style={{ "--slide-color": colors[index] } as CSSProperties}>{child}</div>)}</div>
    {navigation === "edges" && [-1,1].map(side => <button type="button" className={`deck-edge deck-edge--${side === 1 ? "next" : "previous"}`} key={side}
      aria-label={`${side === 1 ? "Next" : "Previous"} ${label.toLowerCase()}`} aria-controls={id} onClick={() => begin((queued.current ?? current.current) + side)}
      onPointerMove={event => track(event,side)} onPointerLeave={event => reset(event,side)} style={{ "--edge-angle": side === 1 ? "0deg" : "180deg" } as CSSProperties}>
      <span className="deck-edge-bubble"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
      <span className="deck-edge-label">{side === 1 ? "Next" : "Previous"}</span>
    </button>)}
    {navigation === "projects" ? <div className="deck-project-dock" role="group" aria-label="Project selection" onKeyDown={event => {
      if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      const target = event.key === "Home" ? 0 : event.key === "End" ? count - 1 : ((queued.current ?? current.current) + (event.key === "ArrowRight" ? 1 : -1) + count) % count;
      begin(target); choices.current[target]?.focus();
    }}><span className="deck-dock-highlight" aria-hidden="true"/>{labels.map((name,index) => <button type="button" className="deck-project-choice" key={name} ref={node => { choices.current[index] = node; }} aria-label={`Show ${name}`} aria-pressed={index === themeIndex} aria-controls={id} onClick={() => begin(index)}>
      <span className="deck-project-mark" aria-hidden="true"><svg viewBox="0 0 28 28" fill="none">{index === 0 ? <path d="M14 22S4 16 4 9.5C4 3.5 12 3 14 8c2-5 10-4.5 10 1.5C24 16 14 22 14 22Z M8 13h4l2-4 2 8 2-4h3"/> : <path d="M3 10v8m4-11v14m14-14v14m4-11v8M7 14h14"/>}</svg></span><span className="deck-project-label"><span>{name}</span></span>
    </button>)}</div> : <div className="deck-pagination" aria-label={`${label} selection`}>{labels.map((name,index) => <button type="button" key={name} aria-label={`Show ${name}`} aria-pressed={index === active} onClick={() => begin(index)}><i /></button>)}</div>}
    <span className={navigation === "projects" ? "sr-only" : "deck-count"} aria-live="polite" aria-atomic="true"><b>{String(active + 1).padStart(2,"0")}</b><span>/ {String(count).padStart(2,"0")}</span><span className="sr-only"> {labels[active]}</span></span>
  </div>;
}
