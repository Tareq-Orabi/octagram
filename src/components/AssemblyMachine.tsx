"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import poster from "@/assets/assembly/machine.webp";
import film from "@/assets/assembly/machine-loop.mp4";
import compactFilm from "@/assets/assembly/machine-loop-mobile.mp4";
import { compactMotionQuery } from "@/lib/experience-preferences";
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
    const host = stage.current!, view = viewport.current!, canvas = surface.current!;
    const movie = recording.current!, desk = readout.current!;
    const rows = Array.from(desk.querySelectorAll<HTMLElement>(".assembly-readout-row"));
    const state = clock.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const compact = matchMedia(compactMotionQuery);
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const abort = new AbortController(), { signal } = abort;
    const decodedFrames = typeof movie.requestVideoFrameCallback === "function";
    let renderer: ReturnType<typeof import("@/three/assembly-renderer").createAssemblyRenderer> | undefined;
    let loading = false, failed = false, contextLost = false, videoStarted = false, videoFailed = false, playPending = false;
    let nearby = false, visible = false, pageHidden = false;
    let width = 0, height = 0, pixelRatio = 0;
    let writing = false, written = -1, writtenStep = -1;
    let canvasFrame = 0, videoFrame = 0, lastCanvas = 0, lastVideo = -Infinity, step = -1;
    let lastNote: number | null = null;

    const allowed = () => !reduced.matches && !connection?.saveData &&
      !document.documentElement.classList.contains("journey-paused");
    const foreground = () => !pageHidden && !document.hidden && !document.body.classList.contains("menu-open");
    const live = () => Boolean(renderer && !contextLost && !compact.matches);

    function paintReadout(time: number) {
      const station = assemblyStations[step];
      const chars = writing
        ? Math.min(readoutLength[step], Math.max(0, Math.floor((time - station.start - .16) * 43)))
        : readoutLength[step];
      if (writtenStep === step && written === chars) return;
      writtenStep = step;
      written = chars;
      let remaining = chars, cursor = 0;
      station.readout.forEach((line, i) => {
        const text = line.slice(0, remaining);
        if (rows[i].textContent !== text) rows[i].textContent = text;
        if (remaining > 0) cursor = i;
        remaining = Math.max(0, remaining - line.length - 2);
      });
      const typed = String(remaining > 0);
      if (desk.dataset.cursor !== String(cursor)) desk.dataset.cursor = String(cursor);
      if (desk.dataset.typed !== typed) desk.dataset.typed = typed;
    }

    function draw(render = false) {
      const time = assemblyTime(state.time);
      const next = render && live() ? renderer!.draw(time) : assemblyStep(time);
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

    function tickCanvas(now: number) {
      canvasFrame = requestAnimationFrame(tickCanvas);
      if (lastCanvas && now - lastCanvas < 31) return;
      if (lastCanvas) state.time = (state.time + Math.min(.18, (now - lastCanvas) / 1000)) % assemblyDuration;
      lastCanvas = now;
      draw(true);
    }

    function readVideo(time: number) {
      if (live() || movie.seeking || movie.readyState < 2) return;
      state.time = time;
      draw();
    }

    function tickVideo(now: number, metadata: VideoFrameCallbackMetadata) {
      videoFrame = 0;
      if (movie.paused || live() || !foreground() || !visible || !allowed()) return;
      // The decoder drives playback. Update the overlay only on decoded frames.
      if (now - lastVideo >= 46 || assemblyStep(assemblyTime(metadata.mediaTime)) !== step) {
        lastVideo = now;
        readVideo(metadata.mediaTime);
      }
      videoFrame = movie.requestVideoFrameCallback(tickVideo);
    }

    function sync() {
      const enabled = allowed(), hasCanvas = live(), onScreen = foreground() && visible && enabled;
      if (nearby && enabled && foreground() && !hasCanvas) {
        if (compact.matches || failed || contextLost) prepareVideo();
        else if (!loading) void prepare();
      }
      const hasVideo = enabled && !hasCanvas && !videoFailed && movie.readyState >= 2;
      const playingCanvas = onScreen && hasCanvas;
      const playingVideo = onScreen && hasVideo;
      const mode = hasCanvas ? "canvas" : hasVideo ? "video" : "poster";
      if (host.dataset.machineMode !== mode) host.dataset.machineMode = mode;
      const running = String(playingCanvas || (playingVideo && !movie.paused));
      if (host.dataset.machineRunning !== running) host.dataset.machineRunning = running;
      const animateReadout = enabled && (hasCanvas || hasVideo);
      if (animateReadout !== writing) {
        writing = animateReadout;
        if (step >= 0) paintReadout(assemblyTime(state.time));
      }

      if (playingCanvas) {
        if (!canvasFrame) canvasFrame = requestAnimationFrame(tickCanvas);
      } else if (canvasFrame) {
        cancelAnimationFrame(canvasFrame);
        canvasFrame = 0;
        lastCanvas = 0;
      }
      if (playingVideo && !movie.paused && decodedFrames) {
        if (!videoFrame) videoFrame = movie.requestVideoFrameCallback(tickVideo);
      } else if (videoFrame) {
        movie.cancelVideoFrameCallback(videoFrame);
        videoFrame = 0;
        lastVideo = -Infinity;
      }
      if (playingVideo && movie.paused && !playPending) {
        playPending = true;
        void movie.play().catch(error => {
          if (!signal.aborted && error?.name !== "AbortError") videoFailed = true;
        }).finally(() => {
          playPending = false;
          if (!signal.aborted) sync();
        });
      } else if (!playingVideo && !movie.paused) movie.pause();
    }

    function resize() {
      if (!live() || !nearby || !width || !height) return;
      const ratio = Math.min(devicePixelRatio || 1, Math.sqrt(1_400_000 / (width * height)), 1.35);
      renderer!.resize(width, height, ratio);
      pixelRatio = ratio;
      if (visible && foreground()) draw(true);
    }

    async function prepare() {
      loading = true;
      try {
        const { createAssemblyRenderer } = await import("@/three/assembly-renderer");
        if (signal.aborted || !nearby || !foreground() || !allowed() || compact.matches) return;
        const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" });
        if (!context) { failed = true; return; }
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
      movie.src = compact.matches ? compactFilm : film;
    }

    function compactChanged() {
      if (compact.matches && renderer) {
        const previous = renderer;
        renderer = undefined;
        failed = true;
        previous.dispose();
        canvas.width = canvas.height = 1;
      }
      sync();
    }

    state.seek = time => {
      state.time = allowed() ? time : assemblyStations[assemblyStep(time)].done;
      if (!live() && movie.readyState >= 1) movie.currentTime = state.time;
      draw(visible && foreground());
    };

    const preload = new IntersectionObserver(([entry]) => {
      nearby = entry.isIntersecting;
      if (nearby && live() && !pixelRatio) resize();
      sync();
    }, { rootMargin: "220px 0px" });
    const viewing = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= .18;
      sync();
    }, { threshold: .18 });
    const size = new ResizeObserver(([entry]) => {
      const next = entry.contentRect;
      if (width === next.width && height === next.height) return;
      width = next.width;
      height = next.height;
      pixelRatio = 0;
      resize();
    });
    size.observe(view);
    preload.observe(host);
    viewing.observe(host);
    reduced.addEventListener("change", sync, { signal });
    compact.addEventListener("change", compactChanged, { signal });
    document.addEventListener("visibilitychange", sync, { signal });
    window.addEventListener("pagehide", () => { pageHidden = true; sync(); }, { signal });
    window.addEventListener("pageshow", () => { pageHidden = false; sync(); }, { signal });
    movie.addEventListener("loadedmetadata", () => { if (state.time > 0) movie.currentTime = state.time; }, { signal });
    for (const event of ["loadeddata", "playing", "pause"]) movie.addEventListener(event, sync, { signal });
    movie.addEventListener("error", () => { videoFailed = true; sync(); }, { signal });
    movie.addEventListener("seeked", () => readVideo(movie.currentTime), { signal });
    if (!decodedFrames) movie.addEventListener("timeupdate", () => readVideo(movie.currentTime), { signal });
    canvas.addEventListener("webglcontextlost", event => {
      if (!renderer) return;
      event.preventDefault();
      contextLost = true;
      sync();
    }, { signal });
    canvas.addEventListener("webglcontextrestored", () => {
      if (!renderer) return;
      queueMicrotask(() => {
        if (signal.aborted) return;
        contextLost = false;
        pixelRatio = 0;
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
      cancelAnimationFrame(canvasFrame);
      if (videoFrame) movie.cancelVideoFrameCallback(videoFrame);
      renderer?.dispose();
      movie.pause();
      movie.removeAttribute("src");
      movie.load();
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
