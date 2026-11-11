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
      <span>{label}</span>
      {count && <span>{count}</span>}
    </div>
  );
}
