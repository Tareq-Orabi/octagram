import type { Group } from "three";
import type { PaletteColors } from "./palette-shader";

export interface ScenePointer {
  x: number;
  y: number;
}

export interface SceneModel {
  group: Group;
  update: (
    time?: number,
    progress?: number,
    pointer?: ScenePointer,
    reduced?: boolean,
  ) => void;
  dispose?: () => void;
  ready?: Promise<unknown>;
  setPalette?: (colors: PaletteColors, weight: number) => void;
  setOpacity?: (opacity: number) => void;
  setSpread?: (spread: number) => void;
  setTunnel?: (amount: number) => void;
  setService?: (index: number | null) => void;
  setQuality?: (quality: number) => void;
  setReveal?: (reveal: number) => void;
  setPassage?: (progress: number) => void;
  setMorph?: (targets: Float32Array, mix: number) => void;
  setViewport?: (width: number, height: number) => void;
}

export type SceneName = "brain" | "modules" | "logo" | "globe";
