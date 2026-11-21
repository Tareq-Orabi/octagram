"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import poster from "@/assets/assembly/machine.webp";
import film from "@/assets/assembly/machine-loop.mp4";
import compactFilm from "@/assets/assembly/machine-loop-mobile.mp4";
import { assemblyReadoutStyle } from "@/three/assembly-layout";
import { assemblyDuration, assemblyStations, assemblyStep, assemblyTime } from "@/three/assembly-motion";

export type AssemblyClock = {
  time: number;
  seek?: (time: number) => void;
};
const readoutLength = assemblyStations.map(station => station.readout.reduce((total, line) => total + line.length + 2, 1));

export default function AssemblyMachine({ clock, onStep }: {
  clock: RefObject<AssemblyClock>;
  onStep: (step: number) => void;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLCanvasElement>(null);
  const recording = useRef<HTMLVideoElement>(null);
  const readout = useRef<HTMLDivElement>(null);
  const [note, setNote] = useState<number | null>(null);

  useEffect(() => {
    const host = stage.current!;
    const view = viewport.current!;
    const canvas = surface.current!;
    const movie = recording.current!;
    const desk = readout.current!;
    const rows = Array.from(desk.querySelectorAll<HTMLElement>(".assembly-readout-row"));
    const state = clock.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const abort = new AbortController();
    const { signal } = abort;
    let renderer: ReturnType<typeof import("@/three/assembly-renderer").createAssemblyRenderer> | undefined;
    let loading = false, failed = false, contextLost = false, videoStarted = false, videoFailed = false;
    let nearby = false, visible = false;
    let writing = false, written = -1, writtenStep = -1;
    let frame = 0, lastDraw = 0, step = -1;
    let lastNote: number | null = null;

    function allowed() {
      return !reduced.matches && !connection?.saveData &&
        !document.documentElement.classList.contains("journey-paused");
    }

    function paintReadout(time: number) {
      const station = assemblyStations[step];
      const chars = writing
        ? Math.min(readoutLength[step], Math.max(0, Math.floor((time - station.start - .16) * 43)))
        : readoutLength[step];
      if (writtenStep === step && written === chars) return;
      writtenStep = step;
      written = chars;
      let remaining = chars;
      let cursor = 0;
      station.readout.forEach((line, i) => {
        rows[i].textContent = line.slice(0, remaining);
        if (remaining > 0) cursor = i;
        remaining = Math.max(0, remaining - line.length - 2);
      });
      desk.dataset.cursor = String(cursor);
      desk.dataset.typed = String(remaining > 0);
    }

    function draw() {
      const time = assemblyTime(state.time);
      const next = renderer && !contextLost ? renderer.draw(time) : assemblyStep(time);
      if (next !== step) {
        step = next;
        host.dataset.machineStep = String(step);
        onStep(step);
      }
      paintReadout(time);
      const result = time >= assemblyStations[step].done ? step : null;
      if (result !== lastNote) {
        lastNote = result;
        setNote(result);
      }
    }

    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      if (lastDraw && now - lastDraw < 32) return;
      if (renderer && !contextLost) {
        if (lastDraw) state.time = (state.time + Math.min(.18, (now - lastDraw) / 1000)) % assemblyDuration;
      } else if (!movie.seeking) {
        state.time = movie.currentTime;
      }
      lastDraw = now;
      draw();
    }

    function sync() {
      const enabled = allowed();
      const live = Boolean(renderer && !contextLost);
      if (nearby && enabled && !live) {
        if (failed || contextLost) prepareVideo();
        else if (!loading) void prepare();
      }
      const visibleAndPlaying = visible && enabled && !document.hidden && !document.body.classList.contains("menu-open");
      const video = enabled && !live && !videoFailed && movie.readyState >= 2;
      const playingCanvas = visibleAndPlaying && live;
      const playingVideo = visibleAndPlaying && video;
      const running = playingCanvas || (playingVideo && !movie.paused);
      host.dataset.machineMode = live ? "canvas" : video ? "video" : "poster";
      host.dataset.machineRunning = String(running);
      const animateReadout = enabled && (live || video);
      if (animateReadout !== writing) {
        writing = animateReadout;
        if (step >= 0) paintReadout(assemblyTime(state.time));
      }

      if (running && !frame) frame = requestAnimationFrame(tick);
      if (!running) {
        cancelAnimationFrame(frame);
        frame = 0;
        lastDraw = 0;
      }
      if (playingVideo && movie.paused) {
        void movie.play().catch(error => {
          if (signal.aborted || error?.name === "AbortError") return;
          videoFailed = true;
          sync();
        });
      } else if (!playingVideo && !movie.paused) {
        movie.pause();
      }
    }

    function resize() {
      if (!renderer || !nearby || contextLost) return;
      const { width, height } = view.getBoundingClientRect();
      if (!width || !height) return;
      renderer.resize(width, height, Math.min(devicePixelRatio || 1, width > 650 ? 1.35 : 1.5));
      draw();
    }

    async function prepare() {
      loading = true;
      try {
        const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" });
        if (!context) {
          failed = true;
          return;
        }
        const { createAssemblyRenderer } = await import("@/three/assembly-renderer");
        if (signal.aborted) return;
        renderer = createAssemblyRenderer(canvas, context);
        resize();
      } catch {
        renderer?.dispose();
        renderer = undefined;
        failed = true;
      } finally {
        loading = false;
        if (!signal.aborted) sync();
      }
    }

    function prepareVideo() {
      if (videoStarted || !movie.canPlayType("video/mp4")) return;
      videoStarted = true;
      movie.src = matchMedia("(max-width: 720px)").matches ? compactFilm : film;
    }

    state.seek = time => {
      state.time = allowed() ? time : assemblyStations[assemblyStep(time)].done;
      if ((!renderer || contextLost) && movie.readyState >= 1) movie.currentTime = state.time;
      draw();
    };

    const preload = new IntersectionObserver(([entry]) => {
      nearby = entry.isIntersecting;
      if (nearby && renderer) resize();
      sync();
    }, { rootMargin: "220px 0px" });
    const viewing = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= .18;
      sync();
    }, { threshold: .18 });
    const size = new ResizeObserver(resize);
    size.observe(view);
    preload.observe(host);
    viewing.observe(host);
    reduced.addEventListener("change", sync, { signal });
    document.addEventListener("visibilitychange", sync, { signal });
    movie.addEventListener("loadedmetadata", () => { movie.currentTime = state.time; }, { signal });
    movie.addEventListener("loadeddata", sync, { signal });
    movie.addEventListener("playing", sync, { signal });
    movie.addEventListener("pause", sync, { signal });
    movie.addEventListener("error", () => {
      videoFailed = true;
      sync();
    }, { signal });
    movie.addEventListener("seeked", () => {
      if ((renderer && !contextLost) || movie.seeking || movie.readyState < 2) return;
      state.time = movie.currentTime;
      draw();
    }, { signal });
    canvas.addEventListener("webglcontextlost", event => {
      event.preventDefault();
      contextLost = true;
      host.dataset.machineMode = "poster";
      sync();
    }, { signal });
    canvas.addEventListener("webglcontextrestored", () => {
      queueMicrotask(() => {
        if (signal.aborted) return;
        contextLost = false;
        resize();
        sync();
      });
    }, { signal });
    window.addEventListener("octagram:menu", sync, { signal });
    window.addEventListener("octagram:motion", sync, { signal });
    draw();

    return () => {
      abort.abort();
      preload.disconnect();
      viewing.disconnect();
      size.disconnect();
      cancelAnimationFrame(frame);
      renderer?.dispose();
      movie.pause();
      movie.removeAttribute("src");
      state.seek = undefined;
    };
  }, [clock, onStep]);

  return <div className="assembly-stage" ref={stage} data-machine-mode="poster" data-machine-running="false" aria-hidden="true">
    <div className="assembly-viewport" ref={viewport}>
      <Image className="assembly-poster" src={poster} alt="" sizes="100vw" draggable={false} />
      <video className="assembly-film" ref={recording} muted loop playsInline preload="auto" />
      <canvas className="assembly-canvas" ref={surface} />
      <div className="assembly-readout" ref={readout} style={assemblyReadoutStyle} data-cursor="2" data-typed="true">
        {assemblyStations[0].readout.map(line => <span key={line} className="assembly-readout-row">{line}</span>)}
      </div>
      {note !== null && <div className="assembly-note" key={note} data-station={note + 1}
        style={{ "--note-accent": assemblyStations[note].color } as CSSProperties}>
        <span className="assembly-note-dot"></span>{assemblyStations[note].note}
      </div>}
    </div>
  </div>;
}
