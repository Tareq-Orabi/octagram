"use client";

import { useEffect, useRef } from "react";
import { createAsciiEye } from "@/lib/ascii-eye";

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};

/** The opening's camera move in reverse, followed by a living, resting gaze. */
export default function EyeOutro() {
  const track = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = track.current,
      host = art.current;
    if (!section || !host) return;
    const canvas = document.createElement("canvas");
    canvas.className = "eye-outro-canvas";
    host.appendChild(canvas);
    const painter = createAsciiEye(canvas, {
      background: "#080909",
      maxDpr: 1.25,
      size: () => ({ width: host.clientWidth, height: host.clientHeight }),
    });
    if (!painter) {
      canvas.remove();
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      previous = 0,
      lastDraw = 0,
      elapsed = 0;
    let visible = false,
      menuOpen = false,
      globalPaused = false;
    let progress = 0,
      camera = 0,
      start = 0,
      distance = 1;
    let pointer = false,
      pointerX = 0,
      pointerY = 0,
      gazeX = 0,
      gazeY = 0;
    let blinkAt = 2600,
      blinkCount = 0;

    const measure = () => {
      const rect = section.getBoundingClientRect();
      const lead = window.innerHeight * 0.45;
      start = rect.top + window.scrollY - lead;
      const end = Math.min(
        rect.top +
          window.scrollY +
          section.offsetHeight -
          host.offsetHeight -
          90,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      distance = Math.max(1, end - start);
      progress = clamp((window.scrollY - start) / distance);
      painter.resize();
    };
    const paint = (dt = 0) => {
      const still = reduced.matches || globalPaused;
      camera = still
        ? 1
        : camera + (progress - camera) * (1 - Math.exp(-dt / 180));
      if (Math.abs(camera - progress) < 0.0001 && !still) camera = progress;
      // Exact inverse of EyeIntro's exponential dive. The pupil becomes an eye.
      const zoom = 1.13 * Math.exp(Math.pow(1 - camera, 2.35) * 4.6);
      const resting = camera > 0.96 && !still;
      let opening = 1;
      if (resting) {
        elapsed += dt;
        const gazeTime = elapsed % 12000;
        const targetX = pointer
          ? pointerX
          : 0.18 * ease((gazeTime - 700) / 850) -
            0.36 * ease((gazeTime - 3700) / 1000) +
            0.18 * ease((gazeTime - 7700) / 1100);
        const targetY = pointer ? pointerY : -0.025 * Math.sin(elapsed / 2200);
        const damping = 1 - Math.exp(-dt / 190);
        gazeX += (targetX - gazeX) * damping;
        gazeY += (targetY - gazeY) * damping;
        const blink = elapsed - blinkAt;
        if (blink >= 0 && blink < 390) {
          opening =
            blink < 140 ? 1 - ease(blink / 140) : ease((blink - 140) / 250);
        } else if (blink >= 390) {
          blinkCount++;
          blinkAt = elapsed + [4300, 5900, 3700, 6700][blinkCount % 4];
        }
      } else {
        gazeX = gazeY = 0;
      }
      painter.draw(opening, zoom, gazeX, gazeY);
      section.dataset.eyePhase = still
        ? "paused"
        : camera < 0.96
          ? "emerging"
          : opening < 0.95
            ? "blinking"
            : "watching";
    };
    const tick = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || menuOpen) {
        previous = 0;
        return;
      }
      // The character texture is cached; idle gaze is capped at 24 frames/sec.
      if (now - lastDraw >= 1000 / 24 || reduced.matches || globalPaused) {
        const dt = previous ? Math.min(now - previous, 80) : 34;
        previous = lastDraw = now;
        paint(dt);
      }
      if (!reduced.matches && !globalPaused)
        frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      if (visible && !document.hidden && !menuOpen)
        frame = requestAnimationFrame(tick);
    };
    const syncMotion = wake;
    reduced.addEventListener("change", syncMotion, { signal });
    window.addEventListener(
      "octagram:motion",
      ((event: CustomEvent<boolean>) => {
        globalPaused = event.detail;
        syncMotion();
      }) as EventListener,
      { signal },
    );
    window.addEventListener(
      "octagram:menu",
      ((event: CustomEvent<boolean>) => {
        menuOpen = event.detail;
        wake();
      }) as EventListener,
      { signal },
    );
    window.addEventListener(
      "scroll",
      () => {
        progress = clamp((window.scrollY - start) / distance);
        const bounds = host.getBoundingClientRect();
        visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
        if (!frame) wake();
      },
      { passive: true, signal },
    );
    document.addEventListener("visibilitychange", wake, { signal });
    host.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType !== "mouse") return;
        const rect = host.getBoundingClientRect();
        pointer = true;
        pointerX =
          (clamp((event.clientX - rect.left) / rect.width) - 0.5) * 0.36;
        pointerY =
          (clamp((event.clientY - rect.top) / rect.height) - 0.5) * 0.1;
      },
      { passive: true, signal },
    );
    host.addEventListener(
      "pointerleave",
      () => {
        pointer = false;
      },
      { signal },
    );

    const resize = new ResizeObserver(() => {
      measure();
      const bounds = host.getBoundingClientRect();
      visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
      if (visible) paint(34);
      wake();
    });
    resize.observe(host);
    // Earlier disclosures change the track's document position without resizing it.
    resize.observe(document.body);
    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        wake();
      },
      { threshold: 0 },
    );
    intersection.observe(host);
    section.dataset.eyeReady = "true";
    measure();
    camera = progress;
    paint();
    syncMotion();

    return () => {
      controller.abort();
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      painter.dispose();
      delete section.dataset.eyeReady;
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
