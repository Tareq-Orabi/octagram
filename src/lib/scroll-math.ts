export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const smooth01 = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
export function processFrame(scroll: number, starts: readonly number[]) {
  const first = starts[0] ?? 0, last = starts.at(-1) ?? first;
  let active = 0;
  for (let index = 0; index < starts.length; index++) if (scroll >= starts[index] - 1) active = index;
  return { progress: clamp01((scroll - first) / Math.max(1, last - first)), active };
}
export function partnershipReveal(progress: number, index: number) {
  return smooth01((progress - (.025 + index * .112)) / .18);
}
