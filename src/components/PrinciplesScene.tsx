"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import BrandModule from "./BrandModule";

type Principle = { title: string; description: string };
const modules = [5, 0, 4, 3, 2];
const delays = [90, 0, 140, 45, 115];

/** Each arrival runs to completion once triggered; scroll never scrubs its pose. */
export default function PrinciplesScene({ principles }: { principles: Principle[] }) {
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const element = list.current;
    if (!element) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const items = [...element.querySelectorAll<HTMLElement>(".principle-token-item")];
    const abort = new AbortController(), { signal } = abort;
    let visible = false, menu = false;
    const syncLife = () => { element.dataset.principlesRunning = String(visible && !document.hidden && !menu && !media.matches); };
    const life = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncLife(); }, { threshold: .04 });
    life.observe(element);
    document.addEventListener("visibilitychange", syncLife, { signal });
    window.addEventListener("octagram:menu", event => { menu = Boolean((event as CustomEvent<boolean>).detail); syncLife(); }, { signal });
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-token-state", "emerging");
        observer.unobserve(entry.target);
      }
    }, { threshold: .24, rootMargin: "0px 0px -3% 0px" });
    const sync = () => {
      syncLife();
      observer.disconnect();
      for (const item of items) {
        if (media.matches) item.dataset.tokenState = "settled";
        else if (item.dataset.tokenState !== "emerging" && item.dataset.tokenState !== "settled") {
          item.dataset.tokenState = "waiting";
          observer.observe(item);
        }
      }
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      life.disconnect(); abort.abort();
      media.removeEventListener("change", sync);
    };
  }, []);

  return <ul ref={list} className="principles-editorial principles-scene" aria-label="What matters to us">
    {principles.map((principle, index) => <li
      className="principle-column principle-token-item" key={principle.title}
      style={{ "--token-delay": `${delays[index % delays.length]}ms`, "--token-turn": `${index % 2 ? -1 : 1}`, "--color-delay": `${index * -5.8}s` } as CSSProperties}
    >
      <div className="principle-emblem" aria-hidden="true">
        <i className="principle-contact" />
        <div className="principle-ground-window">
          <div className="principle-token">
            <BrandModule index={modules[index % modules.length]} className="token-edge" />
            <BrandModule index={modules[index % modules.length]} className="token-face" />
          </div>
        </div>
        <i className="principle-seam" /><i className="principle-ripple" />
        <span className="principle-dust"><i /><i /><i /></span>
      </div>
      <div className="principle-copy"><h3>{principle.title}</h3><p>{principle.description}</p></div>
    </li>)}
  </ul>;
}
