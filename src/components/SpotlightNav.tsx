"use client";

import { useEffect, useRef } from "react";

const items = [
  { id: "about", label: "About", path: "M6 19v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2 M12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6" },
  { id: "team", label: "Team", path: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87" },
  { id: "expertise", label: "Services", path: "m12 3 9 5-9 5-9-5z M3 12l9 5 9-5 M3 16l9 5 9-5" },
  { id: "work", label: "Work", path: "M3 7h18v13H3z M8 7V4h8v3 M3 12h18 M10 12v3h4v-3" },
  { id: "innovation", label: "Products", path: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z" },
  { id: "contact", label: "Let's talk", path: "M4 5h16v11H9l-5 4z M8 9h8 M8 12h5" },
];

/** A light previews hover/focus, then returns to the current document section. */
export default function SpotlightNav() {
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = nav.current;
    if (!element) return;
    const abort = new AbortController(), { signal } = abort;
    const light = element.querySelector<HTMLElement>(".nav-spotlight")!;
    const links = [...element.querySelectorAll<HTMLAnchorElement>("a")];
    const compact = matchMedia("(max-width: 800px)");
    let targets: Array<{ id: string; top: number }> = [], boxes: Array<{ x: number; width: number }> = [];
    let active = "", preview = "", frame = 0, lockedUntil = 0;
    const draw = () => {
      const id = preview || active, index = items.findIndex(item => item.id === id), box = boxes[index];
      light.style.opacity = box?.width ? "1" : "0";
      element.dataset.activeSection = active;
      links.forEach(link => { link.dataset.spotlit = String(link.hash === `#${id}`); });
      if (!box?.width) return;
      light.style.width = `${box.width}px`;
      light.style.transform = `translate3d(${box.x}px,0,0)`;
    };
    const select = (id: string) => {
      active = id;
      for (const link of links) {
        if (link.hash === `#${id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
      draw();
    };
    const paint = () => {
      frame = 0;
      if (performance.now() < lockedUntil) return;
      const line = scrollY + Math.min(210, innerHeight * .32);
      let id = "";
      for (const target of targets) if (line >= target.top) id = target.id;
      if (!compact.matches && id === "contact") id = "";
      if (id !== active) select(id);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const measure = () => {
      if (signal.aborted) return;
      const rect = element.getBoundingClientRect();
      boxes = links.map(link => { const box = link.getBoundingClientRect(); return { x: box.left - rect.left, width: box.width }; });
      targets = items.filter(item => !compact.matches || item.id !== "innovation")
        .map(item => ({ id: item.id, top: (document.getElementById(item.id)?.getBoundingClientRect().top ?? Infinity) + scrollY }))
        .sort((a, b) => a.top - b.top);
      if (!boxes[items.findIndex(item => item.id === preview)]?.width) preview = "";
      draw(); schedule();
    };
    links.forEach((link, index) => {
      const show = () => { preview = items[index].id; draw(); };
      link.addEventListener("pointerenter", event => { if (event.pointerType !== "touch") show(); }, { signal });
      link.addEventListener("focus", show, { signal });
      link.addEventListener("click", () => { preview = ""; lockedUntil = performance.now() + 1500; select(items[index].id); }, { signal });
    });
    const restore = () => {
      const focused = element.querySelector<HTMLAnchorElement>("a:focus-visible")?.hash.slice(1);
      preview = focused || ""; draw();
    };
    element.addEventListener("pointerleave", restore, { signal });
    element.addEventListener("focusout", event => {
      if (!element.contains(event.relatedTarget as Node | null)) { preview = ""; draw(); }
    }, { signal });
    window.addEventListener("scroll", schedule, { passive: true, signal });
    window.addEventListener("resize", measure, { passive: true, signal });
    compact.addEventListener("change", () => { lockedUntil = 0; measure(); }, { signal });
    window.addEventListener("wheel", () => { lockedUntil = 0; }, { passive: true, signal });
    window.addEventListener("touchstart", () => { lockedUntil = 0; }, { passive: true, signal });
    window.addEventListener("hashchange", () => {
      const id = location.hash.slice(1);
      if (!items.some(item => item.id === id)) { lockedUntil = 0; preview = ""; schedule(); }
    }, { signal });
    const resize = new ResizeObserver(measure); resize.observe(element);
    const main = document.querySelector("main"); if (main) resize.observe(main);
    void document.fonts.ready.then(measure);
    measure();
    return () => { abort.abort(); resize.disconnect(); cancelAnimationFrame(frame); };
  }, []);

  return <nav ref={nav} className="desktop-nav spotlight-nav" aria-label="Main navigation">
    <span className="nav-spotlight" aria-hidden="true" />
    {items.map(item => <a href={`#${item.id}`} key={item.id} data-tab={item.id}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={item.path} /></svg>
      <span>{item.label}</span>
    </a>)}
  </nav>;
}
