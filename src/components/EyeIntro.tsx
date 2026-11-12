"use client";

import { useEffect, useRef } from "react";
import { createAsciiEye } from "@/lib/ascii-eye";

const smooth = (n: number) => {
  const t = Math.min(1, Math.max(0, n));
  return t * t * (3 - 2 * t);
};

export default function EyeIntro() {
  const art = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (
      preference.matches ||
      location.hash ||
      new URLSearchParams(location.search).has("skiploader")
    )
      return;
    const host = art.current;
    if (!host) return;
    const canvas = document.createElement("canvas");
    canvas.className = "eye-intro-canvas";
    host.append(canvas);
    const painter = createAsciiEye(canvas);
    if (!painter) {
      canvas.remove();
      // The coordinator may mount later in the same commit.
      const fallback = window.setTimeout(
        () => window.dispatchEvent(new Event("octagram:intro-complete")),
        0,
      );
      return () => clearTimeout(fallback);
    }
    const overlay = host.closest<HTMLElement>(".site-loader")!;
    let frame = 0;
    let stopped = false;
    let elapsed = 0;
    let previous = performance.now();
    let diveStarted = -1;
    let revealed = false;
    let lastPose = "";
    const pose = (name: string) => {
      if (lastPose !== name) overlay.dataset.eyePhase = lastPose = name;
    };
    const stop = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", painter.resize);
      painter.dispose();
    };
    const complete = () => {
      stop();
      window.dispatchEvent(new Event("octagram:intro-complete"));
    };
    const render = (now: number) => {
      if (stopped) return;
      // Do not skip the opening when switching back from a background tab.
      if (!document.hidden) elapsed += Math.min(now - previous, 64);
      previous = now;
      const opening = smooth((elapsed - 750) / 1900);
      if (
        diveStarted < 0 &&
        elapsed >= 4750 &&
        (overlay.dataset.eyeReady === "true" || elapsed > 5250)
      )
        diveStarted = elapsed;
      const dive =
        diveStarted < 0 ? 0 : Math.min(1, (elapsed - diveStarted) / 2300);
      // A slow dolly gives the opened eye weight before the accelerating plunge.
      const approach = 1 + smooth((elapsed - 1700) / 2200) * 0.13;
      const zoom = approach * Math.exp(Math.pow(dive, 2.35) * 4.6);
      pose(
        dive > 0
          ? "entering"
          : opening >= 1
            ? "open"
            : opening > 0
              ? "opening"
              : "closed",
      );
      // Short saccades, brief holds, then a settled central pupil before the dive.
      const gazeX =
        0.23 * smooth((elapsed - 2750) / 320) -
        0.46 * smooth((elapsed - 3300) / 480) +
        0.23 * smooth((elapsed - 4050) / 420);
      const gazeY =
        -0.025 * smooth((elapsed - 2750) / 320) +
        0.045 * smooth((elapsed - 3300) / 480) -
        0.02 * smooth((elapsed - 4050) / 420);
      const gaze = gazeX > 0.15 ? "right" : gazeX < -0.15 ? "left" : "center";
      if (overlay.dataset.eyeGaze !== gaze) overlay.dataset.eyeGaze = gaze;
      painter.draw(opening, zoom, gazeX, gazeY);
      // The pupil already fills the viewport before the site is revealed.
      if (dive > 0.94 && !revealed) {
        revealed = true;
        pose("revealing");
        complete();
        return;
      }
      frame = requestAnimationFrame(render);
    };
    painter.draw(0, 1);
    pose("closed");
    frame = requestAnimationFrame(render);
    window.addEventListener("resize", painter.resize);
    window.addEventListener("octagram:entered", stop);
    return () => {
      stop();
      window.removeEventListener("resize", painter.resize);
      window.removeEventListener("octagram:entered", stop);
      canvas.remove();
    };
  }, []);

  return (
    <div
      className="site-loader eye-intro"
      role="region"
      aria-label="Opening animation"
    >
      <div ref={art} className="eye-intro-art" aria-hidden="true" />
    </div>
  );
}
