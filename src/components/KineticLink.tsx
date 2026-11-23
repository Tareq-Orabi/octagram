import type { ReactNode } from "react";

export function AnimatedLabel({ children }: { children: string }) {
  return <span className="kinetic-label"><span>{children}</span><span aria-hidden="true">{children}</span></span>;
}

export function ArrowIcon({ direction = "diagonal" }: { direction?: "diagonal" | "up" }) {
  return <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
    <path d={direction === "up" ? "M8 13V3M3.5 7.5 8 3l4.5 4.5" : "M3 13 13 3M3 3h10v10"}
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export default function KineticLink({ href, children, className = "", external = false, ariaLabel, arrow = true }: {
  href: string; children: string; className?: string; external?: boolean; ariaLabel?: string; arrow?: boolean;
}) {
  return <a className={`kinetic-link ${className}`} href={href} aria-label={ariaLabel}
    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
    <AnimatedLabel>{children}</AnimatedLabel>{arrow && <span className="kinetic-arrow" aria-hidden="true"><ArrowIcon /></span>}
  </a>;
}

export function SceneAtmosphere({ children }: { children?: ReactNode }) {
  return <div className="scene-atmosphere" aria-hidden="true"><i /><i /><i /><div className="scene-fine-grid" />{children}</div>;
}
