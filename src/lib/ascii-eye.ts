/** Character-rendered eye, reconstructed from the supplied filmed reference.
 * No video frame, surrounding desktop, watermark, or audio is used by the site.
 * Coordinates and noise are stable: the lid, gaze and camera move independently.
 */
const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const smooth = (a: number, b: number, n: number) => {
  const t = clamp((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
const noise = (x: number, y: number) => {
  const ix = Math.floor(x),
    iy = Math.floor(y);
  const fx = smooth(0, 1, x - ix),
    fy = smooth(0, 1, y - iy);
  return (
    (hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx) * (1 - fy) +
    (hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx) * fy
  );
};

const glyphs = "octagram";
const cellW = 8;
const cellH = 12;

type Cell = {
  x: number;
  y: number;
  grain: number;
  curve: number;
};

type EyeOptions = {
  background?: string;
  maxDpr?: number;
  size?: () => { width: number; height: number };
};

export function createAsciiEye(
  canvas: HTMLCanvasElement,
  options: EyeOptions = {},
) {
  const background = options.background ?? "#030303";
  const transparent = background === "transparent";
  const columns = window.innerWidth < 600 ? 96 : 160;
  const rows = Math.round((columns * 96) / 190);
  const context = canvas.getContext("2d", { alpha: transparent });
  if (!context) return null;
  const texture = document.createElement("canvas");
  texture.width = columns * cellW;
  texture.height = rows * cellH;
  const ink = texture.getContext("2d", { alpha: transparent });
  if (!ink) return null;
  const cells: Cell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = ((col + 0.5) / columns - 0.5) * 2.7;
      const y = ((row + 0.5) / rows - 0.5) * 2.046;
      cells.push({
        x,
        y,
        grain: hash(col, row),
        curve: Math.pow(Math.max(0, 1 - x * x), 0.7),
      });
    }
  }

  let width = 0,
    height = 0,
    dpr = 1,
    lastOpening = -1,
    lastGazeX = Infinity,
    lastGazeY = Infinity;
  const resize = () => {
    const size = options.size?.();
    width = size?.width ?? window.innerWidth;
    height = size?.height ?? window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr ?? 2);
    const pixelWidth = Math.round(width * dpr),
      pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  };
  resize();

  function paintEye(opening: number, gazeX: number, gazeY: number) {
    if (
      !ink ||
      (Math.abs(lastOpening - opening) < 0.002 &&
        Math.abs(lastGazeX - gazeX) < 0.001 &&
        Math.abs(lastGazeY - gazeY) < 0.001)
    )
      return;
    lastOpening = opening;
    lastGazeX = gazeX;
    lastGazeY = gazeY;
    ink.globalAlpha = 1;
    if (transparent) ink.clearRect(0, 0, texture.width, texture.height);
    else {
      ink.fillStyle = background;
      ink.fillRect(0, 0, texture.width, texture.height);
    }
    ink.font = "bold 12px 'Courier New', monospace";
    ink.textAlign = "center";
    ink.textBaseline = "middle";
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (Math.abs(c.x) >= 1.025) continue;
      const seam = 0.065 * c.curve + 0.015 * c.x;
      const top = seam - opening * 0.465 * c.curve;
      const bottom = seam + opening * 0.255 * c.curve;
      const inside = Math.abs(c.x) < 1 && c.y < bottom && c.y > top;
      let brightness = 0;
      let palette = 0;
      let coverage = 1;
      if (inside) {
        const lidShadow = smooth(0, 0.07, c.y - top);
        // Translate iris, pupil, fibers and reflections together under fixed lids.
        const irisX = c.x - gazeX;
        const irisY = c.y - gazeY;
        const radius = Math.hypot(irisX, irisY + 0.015);
        if (radius < 0.355) {
          palette = 1;
          const pupil = smooth(0.103, 0.121, radius);
          const rim = 1 - smooth(0.31, 0.356, radius) * 0.84;
          const angle = Math.atan2(irisY + 0.015, irisX);
          const fibers =
            noise(angle * 83, radius * 13) * 0.47 +
            noise(angle * 173, radius * 28) * 0.33 +
            noise(angle * 291, radius * 9) * 0.2;
          const streak = Math.sin(
            angle * 169 + Math.sin(radius * 39 + angle * 11) * 1.5,
          );
          const collarette = Math.exp(
            -(((radius - 0.185 - 0.008 * Math.sin(angle * 23)) / 0.023) ** 2),
          );
          const iris = clamp(
            0.08 +
              Math.pow(fibers, 1.7) * 0.95 +
              streak * 0.12 +
              collarette * 0.22,
          );
          brightness = iris * pupil * rim * (0.35 + 0.65 * lidShadow);
          // Two small broken reflections, still drawn entirely as characters.
          const glint = Math.exp(
            -(((irisX + 0.095) / 0.032) ** 2 + ((irisY + 0.125) / 0.047) ** 2),
          );
          const glint2 = Math.exp(
            -(((irisX - 0.062) / 0.016) ** 2 + ((irisY - 0.065) / 0.023) ** 2),
          );
          if (radius > 0.112 && glint + glint2 > 0.15) {
            brightness = Math.max(brightness, (glint + glint2) * 0.87);
            palette = 2;
          }
        } else {
          palette = 2;
          const roundness = 1 - Math.pow(Math.abs(c.x), 1.8) * 0.72;
          brightness =
            (0.62 + c.grain * 0.12) * roundness * (0.4 + lidShadow * 0.6);
          brightness *= 0.75 + 0.25 * smooth(0, 0.05, bottom - c.y);
        }
      } else {
        // Only a narrow curved lid rim remains outside the almond-shaped eye.
        // No skin field, brow or rectangular character grid is painted.
        const distance = Math.min(Math.abs(c.y - top), Math.abs(c.y - bottom));
        if (distance > 0.035) continue;
        coverage =
          (1 - smooth(0.008, 0.035, distance)) *
          (1 - smooth(0.93, 1.025, Math.abs(c.x)));
        brightness = (0.3 + c.grain * 0.1) * coverage;
      }
      brightness = clamp(brightness * (palette === 1 ? 1.2 : 1));
      if (brightness < 0.025) continue;
      // Every visible mark belongs to the brand name, in repeated readable rows.
      const index = (i % columns) % glyphs.length;
      const light = Math.min(
        255,
        Math.round(40 + Math.pow(brightness, 0.65) * 255),
      );
      ink.fillStyle =
        palette === 2
          ? `rgb(${light},${Math.round(light * 0.98)},${Math.round(light * 0.92)})`
          : palette === 1
            ? `rgb(${Math.min(255, Math.round(light * 1.22))},${Math.round(light * 0.71)},${Math.round(light * 0.23)})`
            : `rgb(${Math.round(light * 0.94)},${Math.round(light * 0.72)},${Math.round(light * 0.52)})`;
      ink.globalAlpha = coverage;
      ink.fillText(
        glyphs[index],
        ((i % columns) + 0.5) * cellW,
        (Math.floor(i / columns) + 0.5) * cellH,
      );
    }
  }

  return {
    resize,
    dispose() {
      texture.width = texture.height = 1;
      canvas.width = canvas.height = 1;
      canvas.remove();
    },
    draw(opening: number, zoom: number, gazeX = 0, gazeY = 0) {
      paintEye(opening, gazeX, gazeY);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (transparent) context.clearRect(0, 0, width, height);
      else {
        context.fillStyle = background;
        context.fillRect(0, 0, width, height);
      }
      // Keep the whole eye visible on portrait screens; then travel into its pupil.
      const base = Math.min(
        width * (width < 600 ? 1.15 : 0.86),
        height * 1.6,
        1440,
      );
      const w = base * zoom,
        h = (w * texture.height) / texture.width;
      const x = (width - w) / 2;
      const y = height / 2 - h * (0.5 - 0.015 / 2.046);
      // Crop the source first: a deep pupil zoom must not rasterize a giant
      // offscreen image. The visible camera framing stays exactly the same.
      const dx = Math.max(0, x),
        dy = Math.max(0, y);
      const dw = Math.min(width, x + w) - dx;
      const dh = Math.min(height, y + h) - dy;
      if (dw <= 0 || dh <= 0) return;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        texture,
        ((dx - x) / w) * texture.width,
        ((dy - y) / h) * texture.height,
        (dw / w) * texture.width,
        (dh / h) * texture.height,
        dx,
        dy,
        dw,
        dh,
      );
    },
  };
}
