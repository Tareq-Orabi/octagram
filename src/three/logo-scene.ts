import { assemblyOffset, logoPassagePose } from "./choreography";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import type { SceneModel, ScenePointer } from "./types";

/** Loads the Blender export lazily, retaining the exact vector extrusion fallback. */
export async function createLogoAsset(): Promise<SceneModel> {
  try {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const asset = await loader.loadAsync("/assets/models/octagram.glb");
    const group = new THREE.Group();
    group.name = "Octagram Blender asset";
    group.add(asset.scene);
    const materials = new Set<THREE.MeshStandardMaterial>();
    const textures = new Set<THREE.Texture>();
    let passage = 0;
    const modules: Array<{ node: THREE.Object3D; home: THREE.Vector3; rotation: THREE.Quaternion; index: number }> = [];
    const tilt = new THREE.Quaternion(), angles = new THREE.Euler();
    asset.scene.traverse((object) => {
      if (object.name.startsWith("module-")) modules.push({ node: object, home: object.position.clone(), rotation: object.quaternion.clone(), index: modules.length });
      if (!(object instanceof THREE.Mesh)) return;
      const entries = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of entries) if (material instanceof THREE.MeshStandardMaterial) {
        materials.add(material);
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      }
    });
    materials.forEach((material) => { material.roughness = 0.46; material.metalness = 0.12; });
    const update = (_time = 0, progress = 1, _pointer: ScenePointer = { x: 0, y: 0 }, reduced = false) => {
      group.rotation.set(0, 0, 0);
      for (const { node, home, rotation, index } of modules) {
        const offset = assemblyOffset(reduced ? 1 : progress, index);
        const travel = logoPassagePose(reduced ? 0 : passage, index, home.x, home.y);
        node.position.set(home.x + offset.x + travel.x, home.y + offset.y + travel.y, home.z + offset.z + travel.z);
        angles.set(travel.pitch, travel.yaw, travel.roll);
        tilt.setFromEuler(angles);
        node.quaternion.copy(rotation).multiply(tilt);
      }
    };
    update();
    return {
      group, update, setPassage(value) { passage = value; }, dispose() {
        group.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
        materials.forEach((material) => material.dispose());
        textures.forEach((texture) => texture.dispose());
        group.clear();
      }    
};
  } catch (error) {
    console.warn("Octagram: using the exact vector logo extrusion.", error);
    return (await import("./modular-scenes")).createLogo(THREE);
  }
}
