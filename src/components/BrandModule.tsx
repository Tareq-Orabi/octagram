import { LOGO_MODULES } from "@/three/brand-paths";

/** A source path from the original mark, cropped without changing its shape. */
export default function BrandModule({ index, className = "" }: { index: number; className?: string }) {
  const module = LOGO_MODULES[index % LOGO_MODULES.length];
  const [left, top, right, bottom] = module.bounds;
  const padding = 7;
  return <svg className={`brand-module ${className}`} viewBox={`${left - padding} ${top - padding} ${right - left + padding * 2} ${bottom - top + padding * 2}`} aria-hidden="true" focusable="false">
    {module.paths.map((path, at) => <path key={at} d={path.d} fill={path.color} />)}
  </svg>;
}
