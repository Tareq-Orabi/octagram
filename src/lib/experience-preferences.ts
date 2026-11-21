/**
 * Kept as the shared clock interface so the service wheel and scene controllers
 * retain their existing behavior. Manual pause storage is no longer consulted;
 * each controller responds directly to the device reduced-motion preference.
 */
export function readMotionPreference(): boolean {
  return false;
}

export const compactMotionQuery = "(max-width: 800px), (hover: none) and (pointer: coarse)";
