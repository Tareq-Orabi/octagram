import type { ReactNode } from "react";

/** Two equal cycles let the tracks loop without a gap or a layout read. */
export default function RoleReel({ frames, isWorkflow = false }: {
  frames: ReactNode[];
  isWorkflow?: boolean;
}) {
  const repeats = isWorkflow ? 1 : Math.ceil(4 / frames.length);

  return <div className="role-reel-track">
    {[0, 1].map(cycle => (
      <div className="role-reel-cycle" key={cycle} aria-hidden={cycle === 1 || undefined}>
        {Array.from({ length: repeats }, (_, repeat) => frames.map((frame, index) => (
          <div className="role-reel-frame" key={`${repeat}-${index}`} aria-hidden={repeat > 0 || undefined}>
            {frame}
          </div>
        )))}
      </div>
    ))}
  </div>;
}
