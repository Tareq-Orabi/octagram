import type * as Three from "three";
import {
  clamp,
  mix,
  pointInRing,
  disposeGroup,
  type Point3,
  type Ring,
} from "./scene-utils";
type ThreeModule = typeof Three;
type LandPolygon = {
  rings: Ring[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};
type GeoData = {
  features: Array<{
    geometry:
      | { type: "Polygon"; coordinates: Ring[] }
      | { type: "MultiPolygon"; coordinates: Ring[][] };
  }>;
};
const rad = (n: number) => (n * Math.PI) / 180;
// Lazy geographic scene. +Y north, +Z longitude zero; Jordan stays in view.
function pointMaterial(
  THREE: ThreeModule,
  { opacity = 0.95, scale = 1, additive = false } = {},
) {
  return new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: opacity }, uSize: { value: scale } },
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: `attribute float pointSize; varying vec3 vColor; varying float vDepth;
      uniform float uSize;
      void main(){vColor=color; vec4 mv=modelViewMatrix*vec4(position,1.); vDepth=clamp((mv.z+9.)/5.,.35,1.);
      gl_PointSize=clamp(pointSize*uSize*(7./-mv.z),1.,7.); gl_Position=projectionMatrix*mv;}`,
    fragmentShader:
      `uniform float uOpacity; varying vec3 vColor; varying float vDepth;
      void main(){float d=length(gl_PointCoord-.5); float a=1.-smoothstep(.32,.5,d); if(a<.02) discard;
      gl_FragColor=vec4(vColor,a*uOpacity*vDepth); #include <tonemapping_fragment>
      #include <colorspace_fragment>}`.replace("; #include", ";\n#include"),
  });
}
function spherePoint(lat: number, lon: number, r = 2): Point3 {
  const la = rad(lat),
    lo = rad(lon);
  return [
    r * Math.cos(la) * Math.sin(lo),
    r * Math.sin(la),
    r * Math.cos(la) * Math.cos(lo),
  ];
}
function landPolygons(data: GeoData) {
  const polygons: LandPolygon[] = [];
  for (const feature of data.features) {
    const geometry = feature.geometry;
    const rings =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.type === "MultiPolygon"
          ? geometry.coordinates
          : [];
    for (const polygon of rings) {
      const outer = polygon[0];
      polygons.push({
        rings: polygon,
        minX: Math.min(...outer.map((p) => p[0])),
        maxX: Math.max(...outer.map((p) => p[0])),
        minY: Math.min(...outer.map((p) => p[1])),
        maxY: Math.max(...outer.map((p) => p[1])),
      });
    }
  }
  return polygons;
}
function isLand(lon: number, lat: number, polygons: LandPolygon[]) {
  for (const p of polygons)
    if (
      lon >= p.minX &&
      lon <= p.maxX &&
      lat >= p.minY &&
      lat <= p.maxY &&
      pointInRing(lon, lat, p.rings[0]) &&
      !p.rings.slice(1).some((r) => pointInRing(lon, lat, r))
    )
      return true;
  return false;
}
export function createGlobe(THREE: ThreeModule) {
  const group = new THREE.Group(),
    earth = new THREE.Group();
  group.add(earth);
  let destroyed = false;
  const globeMaterial = new THREE.MeshStandardMaterial({
    color: "#10251f",
    roughness: 0.94,
    metalness: 0.1,
  });
  const ocean = new THREE.Mesh(
    new THREE.SphereGeometry(2, 72, 48),
    globeMaterial,
  );
  earth.add(ocean);
  const grid = [];
  for (let lat = -60; lat <= 75; lat += 15)
    for (let lon = -180; lon < 180; lon += 3)
      grid.push(
        ...spherePoint(lat, lon, 2.004),
        ...spherePoint(lat, lon + 3, 2.004),
      );
  for (let lon = -180; lon < 180; lon += 20)
    for (let lat = -90; lat < 90; lat += 3)
      grid.push(
        ...spherePoint(lat, lon, 2.004),
        ...spherePoint(lat + 3, lon, 2.004),
      );
  const gridGeometry = new THREE.BufferGeometry();
  gridGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(grid, 3),
  );
  const gridMaterial = new THREE.LineBasicMaterial({
    color: "#7fa393",
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
  });
  earth.add(new THREE.LineSegments(gridGeometry, gridMaterial));
  const rimMaterial = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color("#41978b") },
      uOpacity: { value: 0.3 },
    },
    vertexShader:
      "varying vec3 vNormal;varying vec3 vView;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-p.xyz);gl_Position=projectionMatrix*p;}",
    fragmentShader:
      "varying vec3 vNormal;varying vec3 vView;uniform vec3 uColor;uniform float uOpacity;void main(){float a=pow(1.-abs(dot(vNormal,vView)),3.);gl_FragColor=vec4(uColor,a*uOpacity);}",
  });
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.038, 64, 48),
    rimMaterial,
  );
  earth.add(atmosphere);
  const markerPos = new THREE.Vector3(...spherePoint(31.9539, 35.9106, 2.025));
  const marker = new THREE.Group();
  marker.position.copy(markerPos);
  marker.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    markerPos.clone().normalize(),
  );
  earth.add(marker);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: "#fd987a" });
  marker.add(
    new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 12), markerMaterial),
  );
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: "#fd987a",
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.065, 0.074, 48),
    haloMaterial,
  );
  halo.position.z = 0.008;
  marker.add(halo);
  const haloOuter = new THREE.Mesh(
    new THREE.RingGeometry(0.098, 0.102, 48),
    new THREE.MeshBasicMaterial({
      color: "#fd987a",
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  haloOuter.position.z = 0.006;
  marker.add(haloOuter);
  // The focus is 20°N 28°E. Jordan initially projects above/right of center,
  // with Africa, Europe, the Arabian Peninsula, and western Asia all readable.
  const qYaw = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    rad(-28),
  );
  const qPitch = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    rad(20),
  );
  const orientation = qPitch.clone().multiply(qYaw);
  earth.quaternion.copy(orientation);
  let landCloud:
      Three.Points<Three.BufferGeometry, Three.ShaderMaterial> | undefined,
    coast:
      | Three.LineSegments<Three.BufferGeometry, Three.LineBasicMaterial>
      | undefined;
  const controller = new AbortController();
  const ready = fetch("/assets/earth-land.geojson", {
    signal: controller.signal,
  })
    .then((r) => {
      if (!r.ok) throw new Error("Earth geography unavailable");
      return r.json();
    })
    .then((data) => {
      if (destroyed) return;
      const polygons = landPolygons(data),
        positions = [],
        pointSizes = [],
        coastPoints = [];
      // Equal angular rows with longitude spacing adjusted to produce near-uniform dot area.
      for (let lat = -80; lat < 84; lat += 1.65) {
        const step = 1.65 / Math.max(0.15, Math.cos(rad(lat)));
        for (
          let lon = -180 + ((Math.floor(lat / 1.65) % 2) * step) / 2;
          lon < 180;
          lon += step
        )
          if (isLand(lon, lat, polygons)) {
            positions.push(...spherePoint(lat, lon, 2.014));
            pointSizes.push(1.65);
          }
      }
      for (const p of polygons)
        for (const ring of p.rings)
          for (let j = 0; j < ring.length - 1; j++) {
            const a = ring[j],
              b = ring[j + 1];
            if (Math.abs(a[0] - b[0]) > 180) continue;
            const steps = Math.max(
              1,
              Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) / 2),
            );
            for (let k = 0; k < steps; k++)
              coastPoints.push(
                ...spherePoint(
                  mix(a[1], b[1], k / steps),
                  mix(a[0], b[0], k / steps),
                  2.018,
                ),
                ...spherePoint(
                  mix(a[1], b[1], (k + 1) / steps),
                  mix(a[0], b[0], (k + 1) / steps),
                  2.018,
                ),
              );
          }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute(
        "pointSize",
        new THREE.Float32BufferAttribute(pointSizes, 1),
      );
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(
          new Float32Array(positions.length).fill(1),
          3,
        ),
      );
      landCloud = new THREE.Points(
        geometry,
        pointMaterial(THREE, { opacity: 0.95, scale: 1.1 }),
      );
      earth.add(landCloud);
      const cGeometry = new THREE.BufferGeometry();
      cGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(coastPoints, 3),
      );
      coast = new THREE.LineSegments(
        cGeometry,
        new THREE.LineBasicMaterial({
          color: "#9ec6b4",
          transparent: true,
          opacity: 0.55,
        }),
      );
      earth.add(coast);
      applyBrandColors();
    })
    .catch((error) => {
      if (error.name !== "AbortError") throw error;
    });
  function applyBrandColors() {
    globeMaterial.color.set("#10251f");
    globeMaterial.roughness = 0.94;
    gridMaterial.color.set("#7fa393");
    gridMaterial.opacity = 0.13;
    rimMaterial.uniforms.uColor.value.set("#41978b");
    rimMaterial.uniforms.uOpacity.value = 0.26;
    markerMaterial.color.set("#fdaa7d");
    haloMaterial.color.set("#fd987a");
    haloOuter.material.color.set("#fd987a");
    if (coast) {
      coast.material.color.set("#9ec6b4");
      coast.material.opacity = 0.54;
    }
    if (landCloud) {
      const p = landCloud.geometry.attributes.position,
        c = landCloud.geometry.attributes.color;
      for (let i = 0; i < p.count; i++) {
        const color = new THREE.Color("#91b9a4");
        color.lerp(
          new THREE.Color("#cac56a"),
          clamp((p.getY(i) + 1) / 4) * 0.24,
        );
        c.setXYZ(i, color.r, color.g, color.b);
      }
      c.needsUpdate = true;
    }
  }
  function update(
    time = 0,
    progress = 0,
    pointer = { x: 0, y: 0 },
    reduced = false,
  ) {
    const motion = reduced ? 0 : Math.sin(time * 0.13) * 0.055,
      px = reduced ? 0 : pointer?.x || 0,
      py = reduced ? 0 : pointer?.y || 0;
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(py * 0.012, motion + px * 0.026, 0),
    );
    earth.quaternion.copy(q).multiply(orientation);
    const pulse = reduced ? 1 : 1 + Math.sin(time * 1.7) * 0.08;
    halo.scale.setScalar(pulse);
    haloOuter.scale.setScalar(
      reduced ? 1 : 1 + Math.sin(time * 1.7 - 0.45) * 0.05,
    );
  }
  applyBrandColors();
  update();
  return {
    group,
    update,
    ready,
    markerPosition: markerPos.clone(),
    dispose: () => {
      destroyed = true;
      controller.abort();
      disposeGroup(group);
    },
  };
}
