import type { CSSProperties, ReactNode } from "react";

/** Equal cycles let the tracks loop without a gap or a layout read. */
export default function RoleReel({ frames, isWorkflow = false, cycles = 2 }: {
  frames: ReactNode[];
  isWorkflow?: boolean;
  cycles?: number;
}) {
  const repeats = isWorkflow ? 1 : Math.ceil(4 / frames.length);

  return <div className="role-reel-track" style={{ "--reel-step": `${-100 / cycles}%` } as CSSProperties}>
    {Array.from({ length: cycles }, (_, cycle) => (
      <div className="role-reel-cycle" key={cycle} aria-hidden={cycle > 0 || undefined}>
        {Array.from({ length: repeats }, (_, repeat) => frames.map((frame, index) => (
          <div className="role-reel-frame" key={`${repeat}-${index}`} aria-hidden={repeat > 0 || undefined}>
            {frame}
          </div>
        )))}
      </div>
    ))}
  </div>;
}
