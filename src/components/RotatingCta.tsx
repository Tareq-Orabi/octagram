"use client";

import { useEffect, useRef, useState } from "react";

const invitations = ["Let’s build together", "Make your idea real", "Build what comes next", "Start something meaningful"];

/** The destination and accessible label stay stable while the invitation changes. */
export default function RotatingCta() {
  const anchor = useRef<HTMLAnchorElement>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("rest");
  useEffect(() => {
    const element = anchor.current!;
    const abort = new AbortController(), { signal } = abort;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false, menu = false, timer = 0, swap = 0;
    const stop = () => { clearTimeout(timer); clearTimeout(swap); setPhase("rest"); };
    const schedule = () => {
      stop();
      if (!visible || document.hidden || menu || media.matches) return;
      timer = window.setTimeout(() => {
        setPhase("out");
        swap = window.setTimeout(() => {
          setIndex(previous => (previous + 1 + Math.floor(Math.random() * (invitations.length - 1))) % invitations.length);
          setPhase("in"); schedule();
        }, 240);
      }, 7200 + Math.random() * 1400);
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); });
    observer.observe(element);
    document.addEventListener("visibilitychange", schedule, { signal });
    media.addEventListener("change", schedule, { signal });
    window.addEventListener("octagram:menu", event => { menu = Boolean((event as CustomEvent<boolean>).detail); schedule(); }, { signal });
    return () => { clearTimeout(timer); clearTimeout(swap); observer.disconnect(); abort.abort(); };
  }, []);
  return <a ref={anchor} className="button primary hero-cta rotating-cta" href="#contact" aria-label="Let’s build together — start a project" data-copy-phase={phase}>
    <span className="rotating-cta-window" aria-hidden="true"><span className="rotating-cta-reserve">Start something meaningful</span><span className="rotating-cta-copy" key={index}>{invitations[index]}</span></span>
    <span className="kinetic-arrow" aria-hidden="true"><svg viewBox="0 0 16 16" width="17" height="17" fill="none"><path d="M3 13 13 3M3 3h10v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
  </a>;
}
