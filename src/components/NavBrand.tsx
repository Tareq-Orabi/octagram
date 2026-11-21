"use client";

import { useEffect, useRef } from "react";

export default function NavBrand() {
  const link = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const element = link.current;
    if (!element) return;
    const abort = new AbortController(), { signal } = abort;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const icon = element.querySelector<HTMLElement>(".nav-brand-icon")!;
    const letters = [...element.querySelectorAll<HTMLElement>(".nav-brand-letter")];
    let animations: Animation[] = [], last = -10000, initialized = false, introTimer = 0;
    if (!media.matches) element.dataset.brandPhase = "waiting";
    const stop = () => { clearTimeout(introTimer); animations.forEach(animation => animation.cancel()); animations = []; element.dataset.brandPhase = "settled"; };
    const play = () => {
      if (media.matches || document.hidden || document.documentElement.classList.contains("journey-paused") || performance.now() - last < 4000) return;
      stop(); last = performance.now(); initialized = true; element.dataset.brandPhase = "energizing";
      const spin = icon.animate([
        { transform: "rotate(0deg)", offset: 0, easing: "cubic-bezier(.65,0,.9,.35)" },
        { transform: "rotate(660deg)", offset: .68, easing: "cubic-bezier(.1,.7,.2,1)" },
        { transform: "rotate(1080deg)", offset: 1 },
      ], { duration: 1200 });
      animations.push(spin);
      letters.forEach((letter, index) => animations.push(letter.animate([
        { opacity: 0, transform: "translate(8px, 5px)", filter: "blur(2px)" },
        { opacity: 1, transform: "translate(0, 0)", filter: "blur(0px)" },
      ], { duration: 530, delay: 620 + index * 38, easing: "cubic-bezier(.18,.8,.2,1)", fill: "both" })));
      animations.at(-1)!.onfinish = stop;
    };
    const entered = () => {
      if (initialized) return;
      if (document.documentElement.classList.contains("site-entering")) {
        clearTimeout(introTimer); introTimer = window.setTimeout(entered, 900);
      } else play();
    };
    element.addEventListener("pointerenter", play, { signal });
    element.addEventListener("focus", play, { signal });
    window.addEventListener("octagram:entered", entered, { signal });
    window.addEventListener("octagram:hero-prepare", play, { signal });
    window.addEventListener("octagram:motion", stop, { signal });
    media.addEventListener("change", stop, { signal });
    document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); }, { signal });
    if (media.matches || document.documentElement.classList.contains("journey-paused") || document.documentElement.dataset.introTimedOut) stop();
    else if (document.documentElement.dataset.heroPrepared) play();
    else if (document.documentElement.classList.contains("experience-entered")) entered();
    return () => { abort.abort(); stop(); };
  }, []);

  return <a ref={link} className="brand nav-brand" data-brand-phase="waiting" href="#home" aria-label="Octagram home">
    <span className="nav-brand-icon" aria-hidden="true"><img src="/assets/brand/logo.svg" width="34" height="34" alt="" loading="lazy" /></span>
    <span className="nav-brand-word" aria-hidden="true">{[..."OCTAGRAM"].map((letter, index) => <span className="nav-brand-letter" key={index}>{letter}</span>)}</span>
  </a>;
}
