import type { ArtworkFrame } from "@/three/choreography";

export function measureArtwork(image: HTMLElement, origin: number, aspect = 1): ArtworkFrame {
  const box = image.getBoundingClientRect();
  const style = getComputedStyle(image);
  const left = parseFloat(style.paddingLeft) || 0;
  const right = parseFloat(style.paddingRight) || 0;
  const top = parseFloat(style.paddingTop) || 0;
  const bottom = parseFloat(style.paddingBottom) || 0;
  const width = image.offsetWidth - left - right;
  const height = image.offsetHeight - top - bottom;
  return {
    x: box.left + (box.width + left - right) / 2,
    y: box.top - origin + (box.height + top - bottom) / 2,
    size: Math.max(1, Math.min(width, height * aspect)),
  };
}
