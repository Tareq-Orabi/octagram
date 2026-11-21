import { SRGBColorSpace, WebGLRenderer } from "three";
import { createAssemblyRig, frameAssembly } from "./assembly-rig";

export function createAssemblyRenderer(canvas: HTMLCanvasElement, context: WebGL2RenderingContext) {
  const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const rig = createAssemblyRig();
  let viewport = { width: 0, height: 0, ratio: 0 };

  return {
    resize(width: number, height: number, ratio: number) {
      if (width === viewport.width && height === viewport.height && ratio === viewport.ratio) return;
      viewport = { width, height, ratio };
      renderer.setDrawingBufferSize(width, height, ratio);
      frameAssembly(rig.camera, width / height);
    },
    draw(seconds: number) {
      const step = rig.update(seconds);
      renderer.render(rig.scene, rig.camera);
      return step;
    },
    dispose() {
      rig.dispose();
      renderer.dispose();
    },
  };
}
