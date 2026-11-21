"use client";

import { useState, type MouseEvent } from "react";
import { heroPalettes, heroPaletteEvent } from "@/lib/hero-palettes";

export default function HeroPalette() {
  const [index, setIndex] = useState(0);

  function cycle(event: MouseEvent<HTMLButtonElement>) {
    const nextIndex = (index + 1) % heroPalettes.length;
    const next = heroPalettes[nextIndex];
    const hero = event.currentTarget.closest<HTMLElement>("#home");
    if (hero) hero.dataset.heroPalette = next.id;
    setIndex(nextIndex);
    window.dispatchEvent(new CustomEvent(heroPaletteEvent, { detail: next.id }));
  }

  return <div className="hero-palette">
    <div className="hero-palette-specks" aria-hidden="true"/>
    <button className="hero-palette-target" type="button" onClick={cycle}
      aria-label="Change brain color palette"/>
    <span className="sr-only" aria-live="polite">{heroPalettes[index].label} palette</span>
  </div>;
}
