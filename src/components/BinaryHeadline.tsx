"use client";

import { useEffect, useRef } from "react";

/** Real words reserve the layout; code resolves only after the intro clears. */
export default function BinaryHeadline({ lines, id }: { lines: string[]; id: string }) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = title.current;
    if (!element) return;
    const abort = new AbortController(), { signal } = abort;
    const root = document.documentElement;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const compact = root.dataset.motionProfile === "compact";
    const rows = [...element.querySelectorAll<HTMLElement>(".decode-row")];
    const codes = rows.map(row => row.querySelector<HTMLElement>(".decode-code"));
    let visible = false, played = false, fontsReady = false, menuOpen = false;
    let heroVisible = root.dataset.heroVisible === "true";
    let frame = 0, started = 0, lastCode = -1;
    const staticMotion = () => media.matches || root.classList.contains("journey-paused");
    const syncLetters = () => { element.dataset.letterMotion = String(!compact && visible && played && element.dataset.decode === "settled" && !document.hidden && !menuOpen && !staticMotion()); };
    element.querySelectorAll<HTMLElement>(".hero-glyph").forEach(glyph => {
      glyph.style.setProperty("--glyph-duration", `${9 + Math.random() * 10}s`);
      glyph.style.setProperty("--glyph-delay", `${-Math.random() * 18}s`);
    });
    const finish = () => {
      cancelAnimationFrame(frame); frame = 0;
      element.dataset.decode = "settled";
      rows.forEach(row => { row.dataset.signal = "settled"; row.style.setProperty("--decode-reveal", "1"); });
      root.dataset.heroTextReady = "true";
      syncLetters();
    };
    const duration = 220 + Math.max(0, rows.length - 1) * 100 + 760 + 550;
    const tick = (now: number) => {
      if (!visible || document.hidden || staticMotion()) { finish(); return; }
      const elapsed = now - started, step = Math.floor(elapsed / 80);
      rows.forEach((row, index) => {
        const progress = Math.max(0, Math.min(1, (elapsed - 220 - index * 100) / 760));
        row.style.setProperty("--decode-reveal", progress.toFixed(4));
        const code = codes[index];
        if (step !== lastCode && code && progress < 1)
          code.textContent = Array.from({ length: 32 }, (_, at) => `${((step * 17 + at * 7 + index * 11) % 13) % 2}${at % 4 === 3 ? " " : ""}`).join("");
        if (progress === 1 && row.dataset.signal !== "locked") row.dataset.signal = "locked";
      });
      lastCode = step;
      if (elapsed < duration) frame = requestAnimationFrame(tick); else finish();
    };
    const start = () => {
      if (signal.aborted || played || !fontsReady || !visible || !heroVisible || document.hidden) return;
      played = true;
      if (staticMotion() || root.dataset.introTimedOut || root.dataset.introRecovered) { finish(); return; }
      started = performance.now(); element.dataset.decode = "decoding";
      rows.forEach(row => { row.dataset.signal = "decoding"; });
      frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) start(); else if (played) finish();
      syncLetters();
    }, { threshold: .2 });
    if (staticMotion() || root.dataset.introTimedOut || root.dataset.introRecovered) { played = true; finish(); }
    void document.fonts.ready.then(() => {
      if (signal.aborted) return;
      fontsReady = true;
      root.dataset.heroLayoutReady = "true";
      window.dispatchEvent(new Event("octagram:hero-layout-ready"));
      start();
    });
    observer.observe(element);
    window.addEventListener("octagram:hero-visible", () => { heroVisible = true; start(); }, { signal });
    window.addEventListener("octagram:hero-settle", () => { played = true; finish(); }, { signal });
    window.addEventListener("octagram:motion", event => {
      if ((event as CustomEvent<boolean>).detail || staticMotion()) { played = true; finish(); } else start();
      syncLetters();
    }, { signal });
    media.addEventListener("change", () => { if (media.matches) { played = true; finish(); } else start(); }, { signal });
    document.addEventListener("visibilitychange", () => { if (document.hidden && played) finish(); else start(); syncLetters(); }, { signal });
    window.addEventListener("octagram:menu", event => { menuOpen = Boolean((event as CustomEvent<boolean>).detail); syncLetters(); }, { signal });
    return () => { abort.abort(); observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);

  return <h1 ref={title} id={id} className="binary-headline" data-decode="waiting" aria-label={lines.join(" ")}>
    {lines.map(line => <span className="hero-line decode-row" key={line} aria-hidden="true">
      <span className="decode-ink"><span className="decode-word">{[...line].map((letter,index)=>letter === " " ? <span className="hero-glyph-space" key={index}>&nbsp;</span> : <span className="hero-glyph-cell" key={index}><span className="hero-glyph-reserve">{letter}</span><span className="hero-glyph">{letter}</span></span>)}</span><span className="decode-code">0101 0010 0110 1010 1100 0101 0010</span></span>
    </span>)}
  </h1>;
}
