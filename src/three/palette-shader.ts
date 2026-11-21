import type * as Three from "three";

export type PaletteColors = { shadow: Three.Color; mid: Three.Color; light: Three.Color };

export function createPaletteUniforms(THREE: typeof Three) {
  return {
    uPaletteShadow: { value: new THREE.Color() },
    uPaletteMid: { value: new THREE.Color() },
    uPaletteLight: { value: new THREE.Color() },
    uPaletteWeight: { value: 0 },
  };
}

export function setPaletteUniforms(uniforms: ReturnType<typeof createPaletteUniforms>, colors: PaletteColors, weight: number) {
  uniforms.uPaletteShadow.value.copy(colors.shadow);
  uniforms.uPaletteMid.value.copy(colors.mid);
  uniforms.uPaletteLight.value.copy(colors.light);
  uniforms.uPaletteWeight.value = weight;
}

export const paletteShader = `
uniform vec3 uPaletteShadow, uPaletteMid, uPaletteLight;
uniform float uPaletteWeight;
vec3 octagramTint(vec3 source) {
  if (uPaletteWeight <= 0.) return source;
  float luminance = dot(source, vec3(.2126, .7152, .0722));
  float intensity = pow(clamp(luminance, 0., 1.), .46);
  vec3 shade = mix(uPaletteShadow, uPaletteMid, smoothstep(.06, .59, intensity));
  shade = mix(shade, uPaletteLight, .72 * smoothstep(.62, 1., intensity));
  return mix(source, shade, uPaletteWeight);
}
`;
