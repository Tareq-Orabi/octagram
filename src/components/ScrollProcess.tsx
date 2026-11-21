"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { assemblyStations } from "@/three/assembly-motion";
import AssemblyMachine, { type AssemblyClock } from "./AssemblyMachine";

type Stage = { number: string; title: string; description: string; deliverable: string; clientDecision: string };

export default function AssemblyProcess({ stages }: { stages: Stage[] }) {
  const [active, setActive] = useState(0);
  const clock = useRef<AssemblyClock>({ time: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const stage = stages[active];

  useEffect(() => {
    function readHash() {
      const index = stages.findIndex(item => location.hash === `#process-step-${item.number}`);
      if (index < 0) return;
      const time = assemblyStations[index].start;
      clock.current.time = time;
      clock.current.seek?.(time);
      setActive(index);
    }
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, [stages]);

  function select(index: number) {
    const time = assemblyStations[index].start;
    clock.current.time = time;
    clock.current.seek?.(time);
    setActive(index);
    const machine = containerRef.current?.querySelector(".assembly-viewport");
    if (machine) {
      const { top, bottom, height } = machine.getBoundingClientRect();
      const visible = Math.min(window.innerHeight, bottom) - Math.max(0, top);
      if (visible < height * .5) {
        machine.scrollIntoView({
          block: "center",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        });
      }
    }
  }

  function moveSelection(event: KeyboardEvent<HTMLDivElement>) {
    const key = event.key;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) return;
    event.preventDefault();
    const focused = buttons.current.indexOf(event.target as HTMLButtonElement);
    const current = focused < 0 ? active : focused;
    const next = key === "Home" ? 0 : key === "End" ? stages.length - 1
      : (current + (key === "ArrowRight" ? 1 : -1) + stages.length) % stages.length;
    buttons.current[next]?.focus({ preventScroll: true });
    select(next);
  }

  return <div className="assembly-process" ref={containerRef} data-build-step={active}
    style={{ "--assembly-accent": assemblyStations[active].color, "--assembly-progress": active / (stages.length - 1) } as CSSProperties}>
    {stages.map(item => <span className="assembly-step-anchor" key={item.number} id={`process-step-${item.number}`} aria-hidden="true"/>)}
    <AssemblyMachine clock={clock} onStep={setActive}/>
    <div className="assembly-controls">
      <div className="assembly-selector" role="group" aria-label="How we work steps" onKeyDown={moveSelection}>
        <div className="assembly-selector-line" aria-hidden="true"/>
        {stages.map((item, index) => <button type="button" key={item.number}
          ref={node => { buttons.current[index] = node; }}
          aria-pressed={index === active} aria-controls="process-current-stage" onClick={() => select(index)}
        ><i aria-hidden="true"/><span>{item.title}</span></button>)}
      </div>
    </div>
    <div id="process-current-stage" className="assembly-caption">
      <div>
        <p>{stage.description}</p>
        <small>{stage.deliverable}</small>
      </div>
      <details key={stage.number}><summary>Your input</summary><p>{stage.clientDecision}</p></details>
    </div>
  </div>;
}
