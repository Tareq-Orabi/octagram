export const heroPalettes = [
  { id: "original", label: "Original", tint: null },
  { id: "green", label: "Green", tint: ["#045b32", "#10f578", "#a8ff9b"] },
  { id: "orange", label: "Orange", tint: ["#9a2910", "#ff590b", "#ffc45f"] },
  { id: "blue", label: "Blue", tint: ["#142a9e", "#277fff", "#7edbff"] },
] as const;

export const heroPaletteEvent = "octagram:hero-palette";
