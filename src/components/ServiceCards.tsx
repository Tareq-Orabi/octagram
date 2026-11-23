"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent } from "react";
import type { CompanyService } from "@/lib/company-content";
import { serviceArtwork } from "@/lib/service-artwork";
import ExploreText from "./ExploreText";

export default function ServiceCards({ services }: { services: CompanyService[] }) {
  const runway = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const travel = useRef({ horizontal: 0, vertical: 0, top: 0, left: 0 });
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const scene = runway.current;
    const gallery = stage.current;
    const view = viewport.current;
    const track = rail.current;
    if (!scene || !gallery || !view || !track) return;

    const desktop = matchMedia("(min-width: 1050px) and (hover: hover) and (pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const abort = new AbortController();
    const { signal } = abort;
    let frame = 0;
    let nearby = false;

    function paint() {
      frame = 0;
      const metrics = travel.current;
      if (!scene || !metrics.vertical) return;
      const progress = Math.max(0, Math.min(1, (metrics.top - scene.getBoundingClientRect().top) / metrics.vertical));
      const left = progress * metrics.horizontal;
      if (Math.abs(left - metrics.left) < .1) return;
      metrics.left = left;
      scene.style.setProperty("--service-offset", `${-left}px`);
      scene.style.setProperty("--service-progress", String(progress));
    }

    function schedule() {
      if (nearby && travel.current.vertical && !frame) frame = requestAnimationFrame(paint);
    }

    function measure() {
      if (!scene || !gallery || !view || !track) return;
      const first = track.firstElementChild as HTMLElement | null;
      const last = track.lastElementChild as HTMLElement | null;
      if (!first || !last) return;
      const horizontal = Math.max(0, last.offsetLeft + last.offsetWidth + first.offsetLeft - view.clientWidth);
      const height = gallery.offsetHeight;
      const available = document.documentElement.clientHeight - height - 94;
      const canPin = desktop.matches && !reduced.matches && !document.documentElement.classList.contains("journey-paused");
      const vertical = canPin && available >= 0 ? Math.round(horizontal * .79) : 0;
      const top = 77 + Math.round(Math.max(0, available) * .32);

      if (vertical && !travel.current.vertical) view.scrollLeft = 0;
      travel.current = { horizontal, vertical, top, left: -1 };
      scene.toggleAttribute("data-service-scroll", vertical > 0);
      scene.style.setProperty("--service-stage", `${height}px`);
      scene.style.setProperty("--service-travel", `${vertical}px`);
      scene.style.setProperty("--service-top", `${top}px`);
      schedule();
    }

    const visibility = new IntersectionObserver(([entry]) => {
      nearby = entry.isIntersecting;
      schedule();
    }, { rootMargin: "240px 0px" });
    visibility.observe(scene);

    const size = new ResizeObserver(measure);
    size.observe(gallery);

    addEventListener("scroll", schedule, { passive: true, signal });
    addEventListener("resize", measure, { passive: true, signal });
    addEventListener("octagram:motion", measure, { signal });
    desktop.addEventListener("change", measure, { signal });
    reduced.addEventListener("change", measure, { signal });
    measure();

    return () => {
      abort.abort();
      cancelAnimationFrame(frame);
      visibility.disconnect();
      size.disconnect();
    };
  }, [services.length]);

  function move(left: number) {
    const scene = runway.current;
    const { horizontal, vertical, top } = travel.current;
    const offset = Math.max(0, Math.min(horizontal, left));
    if (scene && vertical && horizontal) {
      const start = scrollY + scene.getBoundingClientRect().top - top;
      window.scrollTo({ top: start + offset / horizontal * vertical, behavior: "instant" });
    } else viewport.current?.scrollTo({ left: offset, behavior: "instant" });
  }

  function handleRailKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || !rail.current) return;
    const { key } = event;
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(key)) return;
    event.preventDefault();

    const items = Array.from(rail.current.children) as HTMLElement[];
    const { horizontal, vertical, left } = travel.current;
    const viewed = vertical ? left : event.currentTarget.scrollLeft;
    const start = items[0]?.offsetLeft ?? 0;
    const stops = items.map(item => Math.min(horizontal, item.offsetLeft - start));
    const target = key === "Home" ? 0 : key === "End" ? horizontal : key === "ArrowRight"
      ? stops.find(stop => stop > viewed + 3) ?? horizontal
      : stops.findLast(stop => stop < viewed - 3) ?? 0;
    move(target);
  }

  function revealFocus(event: FocusEvent<HTMLDivElement>) {
    const { vertical, left } = travel.current;
    if (!vertical || !event.target.matches(":focus-visible")) return;
    const card = event.target.closest<HTMLElement>(".service-rail-item");
    const first = rail.current?.firstElementChild as HTMLElement | null;
    if (!card || !first) return;
    const start = card.offsetLeft - first.offsetLeft;
    const end = start + card.offsetWidth;
    const visible = event.currentTarget.clientWidth - first.offsetLeft;
    if (start < left - 3 || end > left + visible - 3) move(start);
  }

  return (
    <div className="service-gallery-runway" ref={runway}>
      <div className="service-gallery" ref={stage}>
        <header className="service-rail-heading">
          <h2 id="expertise-title">Our <span>Services.</span></h2>
        </header>
        <div className="service-rail-frame">
          <div className="service-rail-shell" ref={viewport} tabIndex={0} role="region" aria-label="Services"
            onKeyDown={handleRailKey} onFocusCapture={revealFocus}>
            <div className="service-rail" id="service-rail" ref={rail}>
              {services.map((service, index) => {
                const art = serviceArtwork[service.id];
                const open = expanded === service.id;
                const title = `service-title-${service.id}`;
                const details = `service-details-${service.id}`;

                return (
                  <article className="service-rail-item" id={`service-${service.id}`} key={service.id}
                    style={{ "--service-accent": art?.accent, "--service-ink": art?.ink } as CSSProperties}
                    aria-labelledby={title}>
                    <div className="service-rail-rank" aria-hidden="true"><span>{index + 1}</span><span>{index + 1}</span></div>
                    <div className="service-feature" data-expanded={open}>
                      <div className="service-feature-art">
                        {art && <Image src={art.image} alt="" draggable={false}
                          sizes="(max-width: 599px) 76vw, (max-width: 1049px) 37vw, 24vw" />}
                      </div>
                      <div className="service-feature-panel">
                        <div className="service-feature-heading">
                          <h3 id={title}><ExploreText>{service.title}</ExploreText></h3>
                          <button type="button" className="service-feature-toggle" aria-expanded={open} aria-controls={details}
                            aria-label={`${open ? "Hide" : "Show"} ${service.title} details`}
                            onClick={() => setExpanded(current => current === service.id ? null : service.id)}>
                            <span aria-hidden="true" />
                          </button>
                        </div>
                        <div className="service-feature-disclosure" id={details} inert={!open}>
                          <div className="service-feature-offerings">
                            <ul>{service.offerings.map(offering => <li key={offering}>{offering}</li>)}</ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
        <div className="service-scroll-progress" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}
