"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { clamp01, smooth01 } from "@/lib/scroll-math";

type Point = { x: number; y: number };
type DrawMark = ReturnType<typeof import("@/three/partnership-mark").createPartnershipMark>;
type Layout = {
  field: RefObject<HTMLDivElement | null>;
  spots: RefObject<(HTMLLIElement | null)[]>;
  connections: (string | null)[];
  complete: boolean;
  onAssembled: (value: boolean) => void;
};

const idle = [
  { x: .26, y: .28 }, { x: .19, y: .52 }, { x: .26, y: .76 },
  { x: .74, y: .28 }, { x: .81, y: .52 }, { x: .74, y: .76 },
];
const destinations = [0, 3, 1, 4, 2, 5];

export default function PartnershipCircuit({ field, spots, connections, complete, onAssembled }: Layout) {
  const housing = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLCanvasElement>(null);
  const links = useRef<SVGSVGElement>(null);
  const refresh = useRef<() => void>(() => {});
  const intent = useRef({ connections, complete });

  useEffect(() => {
    const stage = field.current, mark = housing.current, canvas = surface.current, wires = links.current;
    if (!stage || !mark || !canvas || !wires) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = matchMedia("(max-width: 820px)");
    const abort = new AbortController(), { signal } = abort;
    const branches = Array.from(wires.querySelectorAll<SVGGElement>("g"));
    const motion = () => !reduced.matches && !document.documentElement.classList.contains("journey-paused");
    let frame = 0, lastPaint = -Infinity, active = false, started = false;
    let draw: DrawMark | undefined;
    let assembled = 0, charge = 0, levels = idle.map(() => 0);
    let markBox = { x: 0, y: 0, size: 0 }, outlets: Point[] = [];
    let animate: ((now: number) => boolean) | undefined;

    function paint(now: number, drift = true) {
      if (!mark || !markBox.size) return;
      const anchors = draw?.({ levels, assembly: assembled, charge, seconds: drift && motion() ? now / 1000 : null }) ?? idle;
      branches.forEach((branch, index) => {
        const outlet = outlets[index], point = anchors[destinations[index]];
        if (!outlet || !point) return;
        const x = markBox.x + point.x * markBox.size;
        const y = markBox.y + point.y * markBox.size;
        const bend = outlet.x + (x - outlet.x) * .52;
        const side = outlet.x + (index % 2 ? 1 : -1) * (8 + Math.floor(index / 2) * 2);
        const joinY = markBox.y + markBox.size * .92;
        const path = narrow.matches
          ? `M${outlet.x} ${outlet.y} Q${side} ${outlet.y} ${side} ${outlet.y - 8} V${joinY} Q${side} ${y} ${x} ${y}`
          : `M${outlet.x} ${outlet.y} C${bend} ${outlet.y},${bend} ${y},${x} ${y}`;
        for (const line of branch.children) line.setAttribute("d", path);
      });
      mark.style.setProperty("--mark-charge", charge.toFixed(3));
    }

    function tick(now: number) {
      frame = 0;
      if (now - lastPaint >= 31) {
        lastPaint = now;
        if (animate?.(now)) animate = undefined;
        paint(now);
      }
      schedule();
    }

    function schedule() {
      if (!frame && !document.hidden && (animate || (draw && active && motion())))
        frame = requestAnimationFrame(tick);
    }

    function measure() {
      if (!stage || !mark || !canvas || !wires) return;
      const base = stage.getBoundingClientRect(), plate = mark.getBoundingClientRect();
      if (!base.width || !base.height || !plate.width) return;

      wires.setAttribute("viewBox", `0 0 ${base.width} ${base.height}`);
      markBox = { x: plate.left - base.left, y: plate.top - base.top, size: plate.width };
      outlets = spots.current.map((spot, index) => {
        const box = spot?.getBoundingClientRect();
        if (!box) return { x: 0, y: 0 };
        const side = Boolean(index % 2) !== narrow.matches;
        return {
          x: (side ? box.left : box.right) - base.left,
          y: box.top + box.height / 2 - base.top,
        };
      });
      const pixels = Math.max(1, Math.round(plate.width * Math.min(devicePixelRatio || 1, narrow.matches ? 1.4 : 1.65)));
      if (canvas.width !== pixels) canvas.width = canvas.height = pixels;
      paint(performance.now());
    }

    function prepare() {
      if (started || !canvas || !mark) return;
      started = true;
      near.disconnect();
      void import("@/three/partnership-mark").then(({ createPartnershipMark }) => {
        if (signal.aborted) return;
        draw = createPartnershipMark(canvas);
        measure();
        mark.dataset.markReady = "true";
        schedule();
      }).catch(() => {
        // The circuit remains interactive with the static mark.
      });
    }

    function change() {
      const target = intent.current;
      const byModule = idle.map((_, index) => Number(Boolean(target.connections[destinations.indexOf(index)])));
      const goal = Number(target.complete);
      if (target.connections.some(Boolean)) prepare();
      if (!animate && assembled === goal && byModule.every((level, i) => level === levels[i])) {
        paint(performance.now());
        schedule();
        return;
      }
      const duration = motion() ? target.complete ? 1600 : 630 : 0;
      const before = levels.slice(), previous = assembled, start = performance.now();
      if (!goal) onAssembled(false);

      animate = now => {
        const time = duration ? clamp01((now - start) / duration) : 1;
        const fill = duration ? smooth01((now - start) / Math.min(650, duration)) : 1;
        levels = byModule.map((level, index) => before[index] + (level - before[index]) * fill);
        const gather = goal && duration ? clamp01(((now - start) - 375) / 1050) : time;
        assembled = previous + (goal - previous) * gather;
        charge = goal && duration ? Math.sin(time * Math.PI) ** 2 * .9 : 0;
        if (time === 1 && goal) onAssembled(true);
        return time === 1;
      };
      if (animate(start)) animate = undefined;
      paint(start, Boolean(duration));
      schedule();
    }

    const near = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) prepare();
    }, { rootMargin: "180px 0px" });
    const inView = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active) schedule();
    });
    near.observe(mark);
    inView.observe(mark);

    const initial = mark.getBoundingClientRect();
    active = initial.bottom >= 0 && initial.top <= innerHeight;
    if (location.hash === "#why-octagram" || (initial.bottom >= -180 && initial.top <= innerHeight + 180)) prepare();

    const resize = new ResizeObserver(measure);
    resize.observe(stage);
    resize.observe(mark);
    refresh.current = change;
    reduced.addEventListener("change", change, { signal });
    addEventListener("octagram:motion", change, { signal });
    document.addEventListener("visibilitychange", schedule, { signal });
    measure();
    change();

    return () => {
      abort.abort();
      near.disconnect();
      inView.disconnect();
      resize.disconnect();
      cancelAnimationFrame(frame);
      refresh.current = () => {};
    };
  }, [field, spots, onAssembled]);

  useEffect(() => {
    intent.current = { connections, complete };
    refresh.current();
  }, [connections, complete]);

  return (
    <>
      <svg className="partnership-circuit" ref={links} aria-hidden="true">
        {connections.map((accent, index) => (
          <g key={index} style={{ "--link-accent": accent ?? "#d2a490" } as CSSProperties} data-charged={Boolean(accent)}>
            <path pathLength={1} className="partnership-circuit-line" />
            <path pathLength={1} className="partnership-circuit-charge" />
            <path pathLength={1} className="partnership-circuit-surge" />
          </g>
        ))}
      </svg>
      <div className="partnership-mark" ref={housing} aria-hidden="true">
        <Image src="/assets/brand/logo.svg" className="partnership-mark-fallback" width={300} height={300} alt="" draggable={false} />
        <canvas ref={surface} />
      </div>
    </>
  );
}
