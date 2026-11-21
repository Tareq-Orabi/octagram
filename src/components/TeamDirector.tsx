"use client";

import { useEffect, type RefObject } from "react";
import { teamChapterProgress, teamFrame } from "@/lib/team-scenes";

/** Native scroll owns the sequence. Nothing intercepts wheels, touch or browser navigation. */
export function useTeamSequence(reference: RefObject<HTMLDivElement | null>, onActive: (index: number) => void) {
  useEffect(() => {
    const root = reference.current;
    if (!root) return;
    const stage = root.querySelector<HTMLElement>("[data-team-stage]")!;
    const profiles = [...root.querySelectorAll<HTMLElement>("[data-team-profile]")];
    const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-team-select]")];
    const counter = root.querySelector<HTMLElement>("[data-team-counter]");
    const abort = new AbortController(), { signal } = abort;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, mode = false, start = 0, travel = 1, current = -1, visible = false, menu = false;
    const awake = () => visible && !document.hidden && !menu && !media.matches;
    const sync = () => { root.dataset.teamRunning = String(awake()); };
    const select = (index: number) => {
      if (current === index) return;
      current = index; root.dataset.teamActive = String(index);
      profiles.forEach((profile, n) => {
        profile.dataset.current = String(n === index);
        if (mode) { profile.inert = n !== index; profile.setAttribute("aria-hidden", String(n !== index)); }
        else { profile.inert = false; profile.removeAttribute("aria-hidden"); }
      });
      buttons.forEach((button, n) => button.setAttribute("aria-pressed", String(n === index)));
      if (counter) counter.textContent = String(index + 1).padStart(2,"0");
      onActive(index);
    };
    const paint = () => {
      frame = 0;
      if (signal.aborted || document.hidden) return;
      if (!visible && current !== -1) return;
      if (mode) {
        root.dataset.teamPinned = String(scrollY >= start - 1 && scrollY <= start + travel + 1);
        const pose = teamFrame((scrollY - start) / travel, profiles.length);
        profiles.forEach((profile, index) => {
          const outgoing = index === pose.from, incoming = index === pose.to && pose.to !== pose.from;
          const y = outgoing ? -pose.blend * 100 : incoming ? (1 - pose.blend) * 100 : 115;
          const turn = outgoing ? pose.blend * 6 : incoming ? (pose.blend - 1) * 6 : 0;
          profile.style.transform = `translate3d(0,${y.toFixed(4)}%,0) rotateX(${turn.toFixed(3)}deg)`;
          profile.style.visibility = outgoing || incoming ? "visible" : "hidden";
          profile.dataset.nameArrived = String((outgoing && pose.blend < .06) || (incoming && pose.blend > .94));
        });
        select(pose.active);
        root.style.setProperty("--team-progress", Math.max(0,Math.min(1,(scrollY-start)/travel)).toFixed(4));
      } else if (visible) {
        const midpoint = innerHeight * .5;
        let nearest = 0, distance = Infinity;
        for (let index = 0; index < profiles.length; index++) {
          const rect = profiles[index].getBoundingClientRect(), d = Math.abs(rect.top + Math.min(rect.height,innerHeight) * .5 - midpoint);
          if (d < distance) { distance = d; nearest = index; }
        }
        select(nearest);
        profiles.forEach((profile,index) => { profile.dataset.nameArrived = String(index === nearest); });
      }
    };
    const schedule = () => { if (!frame && !signal.aborted) frame = requestAnimationFrame(paint); };
    const measure = () => {
      if (signal.aborted) return;
      const nextMode = innerWidth >= 960 && innerHeight >= 740 && !media.matches;
      mode = nextMode;
      root.dataset.teamMode = mode ? "cinematic" : "stacked";
      if (!mode) root.dataset.teamPinned = "false";
      root.style.setProperty("--team-travel", `${innerHeight * profiles.length * .85}px`);
      const rect = root.getBoundingClientRect();
      start = rect.top + scrollY - 104;
      travel = Math.max(1, root.offsetHeight - stage.offsetHeight - 76);
      profiles.forEach(profile => {
        if (!mode) { profile.style.removeProperty("transform"); profile.style.removeProperty("visibility"); profile.inert = false; profile.removeAttribute("aria-hidden"); }
      });
      current = -1; schedule(); sync();
    };
    buttons.forEach((button, index) => button.addEventListener("click", () => {
      if (mode) window.scrollTo({ top: start + teamChapterProgress(index,profiles.length) * travel, behavior: "smooth" });
      else profiles[index].scrollIntoView({ block: "start", behavior: media.matches ? "instant" : "smooth" });
    }, { signal }));
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting); sync(); if (visible) schedule();
    }, { rootMargin: "100px 0px", threshold: 0 });
    observer.observe(root);
    window.addEventListener("scroll", schedule, { passive: true, signal });
    window.addEventListener("resize", measure, { passive: true, signal });
    window.addEventListener("pageshow", measure, { signal });
    window.addEventListener("octagram:menu", event => { menu = Boolean((event as CustomEvent<boolean>).detail); sync(); }, { signal });
    document.addEventListener("visibilitychange", () => { sync(); if (!document.hidden) schedule(); }, { signal });
    media.addEventListener("change", measure, { signal });
    const geometry = new ResizeObserver(() => { const rect = root.getBoundingClientRect(); start = rect.top + scrollY - 104; travel = Math.max(1,root.offsetHeight-stage.offsetHeight-76); schedule(); });
    geometry.observe(root); geometry.observe(stage);
    void document.fonts.ready.then(measure);
    measure();
    return () => { abort.abort(); observer.disconnect(); geometry.disconnect(); cancelAnimationFrame(frame); root.dataset.teamRunning = "false"; profiles.forEach(profile => { profile.inert = false; profile.removeAttribute("aria-hidden"); }); };
  }, [reference, onActive]);
}
