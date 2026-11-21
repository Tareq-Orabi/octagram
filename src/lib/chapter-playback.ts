export type PassageFrame = {
  progress: number;
  owns: boolean;
  running: boolean;
  visionReveal?: number;
  phase: "native" | "arriving" | "reading" | "passing" | "complete";
};

const HOLD = 3.18, CLEAR = 4.08;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Scroll chooses a chapter; its finite playhead then advances without scrolling. */
export class PassagePlayback {
  private value = 0;
  private from = 0;
  private target = 0;
  private elapsed = 0;
  private duration = 0;
  private initialized = false;
  private phase: PassageFrame["phase"] = "native";

  startPassage(duration = 4.2) {
    if (!this.initialized || this.value >= CLEAR) this.value = HOLD;
    this.initialized = true;
    this.begin(CLEAR, duration * Math.min(1, (CLEAR - this.value) / (CLEAR - HOLD)), "passing");
  }

  settleVision() {
    this.initialized = true; this.value = this.from = this.target = HOLD;
    this.duration = 0; this.phase = "reading";
  }

  finishPassage() {
    this.initialized = true; this.value = this.from = this.target = CLEAR;
    this.duration = 0; this.phase = "complete";
  }

  update(input: { raw: number; delta: number; active: boolean; pass: boolean; direct: boolean; enabled: boolean }): PassageFrame {
    const { raw, active, pass, direct, enabled } = input;
    if (!enabled || (!active && !this.duration)) {
      this.initialized = false; this.duration = 0; this.value = raw; this.phase = "native";
      return { progress: raw, owns: false, running: false, phase: "native" };
    }
    const target = !active && this.duration ? this.target : pass ? CLEAR : HOLD;
    if ((direct && pass) || (!this.initialized && pass && raw >= CLEAR)) {
      this.initialized = true; this.value = this.from = this.target = CLEAR; this.duration = 0; this.phase = "complete";
    } else if (!this.initialized) {
      this.initialized = true; this.value = Math.min(HOLD, Math.max(2.6, raw));
      this.begin(target, pass ? 4.2 : 1.45, pass ? "passing" : "arriving");
    } else if (target !== this.target) {
      if (pass) this.begin(target, 4.2, "passing");
      else this.settleVision();
    }
    if (this.duration) {
      this.elapsed += Math.max(0, input.delta);
      const t = clamp(this.elapsed / this.duration);
      // The camera path already supplies the acceleration; avoid easing it twice.
      const amount = this.phase === "arriving" ? ease(t) : t;
      this.value = this.from + (this.target - this.from) * amount;
      if (t === 1) { this.duration = 0; this.value = this.target; }
    }
    if (!this.duration) this.phase = this.value >= CLEAR ? "complete" : "reading";
    return {
      progress: this.phase === "complete" ? Math.max(CLEAR, raw) : this.value,
      owns: true, running: this.duration > 0, phase: this.phase,
    };
  }

  private begin(target: number, duration: number, phase: PassageFrame["phase"]) {
    this.from = this.value; this.target = target; this.elapsed = 0;
    this.duration = Math.abs(target - this.value) < .00001 ? 0 : duration;
    this.phase = phase;
  }
}

let frame: PassageFrame | undefined;
const listeners = new Set<() => void>();
export const readPassageFrame = () => frame;
export function publishPassageFrame(next: PassageFrame | undefined) {
  if (frame?.progress === next?.progress && frame?.phase === next?.phase && frame?.owns === next?.owns && frame?.running === next?.running && frame?.visionReveal === next?.visionReveal) return;
  frame = next; listeners.forEach(listener => listener());
}
export function subscribePassageFrame(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
