/** Shared typography and spacing; each section owns its composition. */
export function SectionBar({
  label,
  count,
}: {
  label: string;
  count?: string;
}) {
  return (
    <div className="section-topline">
      <span>OCTAGRAM / {label}</span>
      <span>{count || "DESIGNING IMPACT"}</span>
    </div>
  );
}
