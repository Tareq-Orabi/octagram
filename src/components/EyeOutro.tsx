"use client";

import { useEffect, useRef } from "react";
import { createAsciiEye } from "@/lib/ascii-eye";
import { compactMotionQuery, readMotionPreference } from "@/lib/experience-preferences";
import { clamp01, smooth01 } from "@/lib/scroll-math";

export default function EyeOutro() {
  const track = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!track.current || !art.current) return;
    const section = track.current, host = art.current;

    const closing = section.closest<HTMLElement>(".closing-scene") ?? section;
    const controller = new AbortController(), { signal } = controller;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const compact = matchMedia(compactMotionQuery).matches;
    const interval = 1000 / (compact ? 18 : 24);
    let frame = 0, lastDraw = 0, elapsed = 0;
    let visible = false, menuOpen = false, paused = readMotionPreference(), failed = false;
    let progress = 0, camera = 0, start = 0, distance = 1;
    let gazeX = 0, gazeY = 0, blinkAt = 2600, blinkCount = 0;
    let pointer: { x: number; y: number } | undefined, pointerBox: DOMRect | undefined;
    let dimensions = { width: 0, height: 0 };
    let painter: ReturnType<typeof createAsciiEye>;
    const resting = () => reduced.matches || paused;

    function measure() {
      if (!visible) return;
      const scroll = window.scrollY, height = window.innerHeight;
      start = closing.getBoundingClientRect().top + scroll - height * .7;
      distance = Math.max(1, height * .45);
      progress = clamp01((scroll - start) / distance);
    }

    function release() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastDraw = 0;
      painter?.dispose();
      painter = null;
      delete section.dataset.eyeReady;
    }

    function prepare() {
      if (painter || failed || !dimensions.width || !dimensions.height) return;
      const canvas = document.createElement("canvas");
      canvas.className = "eye-outro-canvas";
      painter = createAsciiEye(canvas, { size: () => dimensions, maxDpr: compact ? 1 : 1.25, columns: compact ? 76 : undefined });
      if (!painter) { failed = true; return; }
      host.appendChild(canvas);
      section.dataset.eyeReady = "true";
      camera = progress;
    }

    function paint(dt: number) {
      const still = resting();
      camera = still ? 1 : camera + (progress - camera) * (1 - Math.exp(-dt / 180));
      if (Math.abs(camera - progress) < .0001 && !still) camera = progress;
      const zoom = 1.13 * Math.exp((1 - camera) ** 2.35 * 4.6);
      let opening = 1;
      if (camera > .96 && !still) {
        elapsed += dt;
        const t = elapsed % 12000;
        const x = pointer?.x ?? .18 * smooth01((t - 700) / 850) - .36 * smooth01((t - 3700) / 1000) + .18 * smooth01((t - 7700) / 1100);
        const y = pointer?.y ?? -.025 * Math.sin(elapsed / 2200);
        const settle = 1 - Math.exp(-dt / 190);
        gazeX += (x - gazeX) * settle;
        gazeY += (y - gazeY) * settle;
        const blink = elapsed - blinkAt;
        if (blink >= 0 && blink < 390) opening = blink < 140 ? 1 - smooth01(blink / 140) : smooth01((blink - 140) / 250);
        else if (blink >= 390) blinkAt = elapsed + [4300, 5900, 3700, 6700][++blinkCount % 4];
      } else gazeX = gazeY = 0;
      painter?.draw(opening, zoom, gazeX, gazeY);
      const phase = still ? "paused" : camera < .96 ? "emerging" : opening < .95 ? "blinking" : "watching";
      if (section.dataset.eyePhase !== phase) section.dataset.eyePhase = phase;
    }

    function tick(now: number) {
      frame = 0;
      if (!visible || document.hidden || menuOpen || !painter) { lastDraw = 0; return; }
      if (!lastDraw || now - lastDraw >= interval - 2 || resting()) {
        const dt = lastDraw ? Math.min(now - lastDraw, 100) : interval;
        lastDraw = now;
        paint(dt);
      }
      if (!resting() && (camera > .96 || Math.abs(progress - camera) > .0001)) frame = requestAnimationFrame(tick);
    }

    function wake() {
      if (document.hidden || menuOpen || !visible) {
        cancelAnimationFrame(frame);
        frame = 0;
        lastDraw = 0;
        return;
      }
      prepare();
      if (painter && !frame) frame = requestAnimationFrame(tick);
    }

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) { release(); return; }
      measure();
      wake();
    });
    intersection.observe(host);

    const resize = new ResizeObserver(entries => {
      const windowRect = entries.find(entry => entry.target === host)?.contentRect;
      if (windowRect) dimensions = { width: windowRect.width, height: windowRect.height };
      if (!visible) return;
      measure();
      if (windowRect && painter) { painter.resize(); lastDraw = 0; }
      wake();
    });
    resize.observe(host);
    resize.observe(closing);
    const main = document.getElementById("main");
    if (main) resize.observe(main);

    window.addEventListener("scroll", () => {
      if (!visible) return;
      progress = clamp01((window.scrollY - start) / distance);
      wake();
    }, { passive: true, signal });
    window.addEventListener("resize", () => { measure(); wake(); }, { passive: true, signal });
    window.addEventListener("pagehide", release, { signal });
    window.addEventListener("pageshow", wake, { signal });
    window.addEventListener("octagram:motion", event => {
      paused = Boolean((event as CustomEvent<boolean>).detail);
      wake();
    }, { signal });
    window.addEventListener("octagram:menu", event => {
      menuOpen = Boolean((event as CustomEvent<boolean>).detail);
      wake();
    }, { signal });
    document.addEventListener("visibilitychange", wake, { signal });
    reduced.addEventListener("change", wake, { signal });

    if (!compact) {
      host.addEventListener("pointerenter", event => {
        if (event.pointerType === "mouse") pointerBox = host.getBoundingClientRect();
      }, { passive: true, signal });
      host.addEventListener("pointermove", event => {
        if (!pointerBox || event.pointerType !== "mouse") return;
        pointer = {
          x: (clamp01((event.clientX - pointerBox.left) / pointerBox.width) - .5) * .36,
          y: (clamp01((event.clientY - pointerBox.top) / pointerBox.height) - .5) * .10,
        };
      }, { passive: true, signal });
      host.addEventListener("pointerleave", () => { pointer = pointerBox = undefined; }, { signal });
    }

    return () => {
      controller.abort();
      intersection.disconnect();
      resize.disconnect();
      release();
      delete section.dataset.eyePhase;
    };
  }, []);

  return (
    <div className="eye-outro" id="closing-eye" ref={track}>
      <div className="eye-outro-stage">
        <div className="eye-outro-art" ref={art} aria-hidden="true" />
      </div>
    </div>
  );
}
