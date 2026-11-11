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
  { opacity = 0.95, scale = 1, beacon = false } = {},
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: opacity }, uSize: { value: scale },
      uTime: { value: 0 }, uReveal: { value: 0 },
      uMotion: { value: 1 }, uBeacon: { value: beacon ? 1 : 0 },
      uOrigin: { value: new THREE.Vector3(...spherePoint(31.9539, 35.9106, 1)) },
      uAccent: { value: new THREE.Color("#fdaa7d") },
    },
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute float pointSize, activationDelay;
      uniform float uSize, uTime, uReveal, uMotion, uBeacon;
      uniform vec3 uOrigin, uAccent;
      varying vec3 vColor;
      varying float vDepth, vActivation, vBeacon;
      void main() {
        float angle = acos(clamp(dot(normalize(position), uOrigin), -1., 1.));
        float phase = dot(position, vec3(7.3, 11.7, 5.1));
        float shimmer = pow(.5 + .5 * sin(uTime * .85 + phase), 8.) * uMotion;
        float wave = exp(-pow((angle - uReveal * 2.9) * 7., 2.));
        wave *= (1. - smoothstep(.88, 1., uReveal)) * uMotion;
        float pulse = .5 + .5 * sin(uTime * 1.35 - activationDelay * 9.);
        vActivation = mix(1., smoothstep(activationDelay, activationDelay + .14, uReveal), uBeacon);
        vColor = mix(color, uAccent, wave * .7) * (1. + shimmer * .22 + uBeacon * pulse * .3 * uMotion);
        vBeacon = uBeacon;
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        vDepth = clamp((mv.z + 9.) / 5., .35, 1.);
        gl_PointSize = clamp(pointSize * uSize * (7. / -mv.z)
          * (1. + uBeacon * pulse * .18 * uMotion), 1., mix(7., 16., uBeacon));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vDepth, vActivation, vBeacon;
      void main() {
        float d = length(gl_PointCoord - .5);
        float disc = 1. - smoothstep(.32, .5, d);
        float glow = exp(-d * d * 18.) * (1. - smoothstep(.38, .5, d));
        float a = mix(disc, glow, vBeacon) * vActivation * uOpacity * vDepth;
        if (a < .005) discard;
        gl_FragColor = vec4(vColor, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
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
// Small, geographically anchored signals. Geometry is allocated once; the
// arrival sequence and travelling highlights use uniforms on the existing loop.
function createConnections(THREE: ThreeModule) {
  const destinations = [
    [51.5072, -0.1276], // London
    [41.0082, 28.9784], // Istanbul
    [30.0444, 31.2357], // Cairo
    [25.2048, 55.2708], // Dubai
    [52.5200, 13.4050], // Berlin — keep every active connection above the horizon
  ] as const;
  const start = new THREE.Vector3(...spherePoint(31.9539, 35.9106, 1));
  const positions: number[] = [], along: number[] = [], delays: number[] = [];
  const beaconPositions: number[] = [], beaconColors: number[] = [], beaconDelays: number[] = [];
  for (const [index, destination] of destinations.entries()) {
    const end = new THREE.Vector3(...spherePoint(destination[0], destination[1], 1));
    const angle = Math.acos(clamp(start.dot(end), -1, 1));
    const sine = Math.sin(angle);
    const delay = .18 + index * .1;
    const segments = 48;
    const point = (t: number) => start.clone()
      .multiplyScalar(Math.sin((1 - t) * angle) / sine)
      .addScaledVector(end, Math.sin(t * angle) / sine)
      .multiplyScalar(2.028 + Math.sin(t * Math.PI) * .16);
    for (let step = 0; step < segments; step++) {
      const a = step / segments, b = (step + 1) / segments;
      positions.push(...point(a).toArray(), ...point(b).toArray());
      along.push(a, b);
      delays.push(delay, delay);
    }
    beaconPositions.push(...end.multiplyScalar(2.04).toArray());
    const color = new THREE.Color(index % 2 ? "#9ec6b4" : "#fdaa7d");
    beaconColors.push(color.r, color.g, color.b);
    beaconDelays.push(delay + .12);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("along", new THREE.Float32BufferAttribute(along, 1));
  geometry.setAttribute("activationDelay", new THREE.Float32BufferAttribute(delays, 1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 }, uReveal: { value: 0 }, uMotion: { value: 1 },
      uOpacity: { value: .7 }, uColor: { value: new THREE.Color("#9ec6b4") },
    },
    vertexShader: `
      attribute float along, activationDelay;
      varying float vAlong, vDelay;
      void main() {
        vAlong = along; vDelay = activationDelay;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }`,
    fragmentShader: `
      uniform float uTime, uReveal, uMotion, uOpacity;
      uniform vec3 uColor;
      varying float vAlong, vDelay;
      void main() {
        float activation = smoothstep(vDelay, vDelay + .14, uReveal);
        float drawn = clamp((uReveal - vDelay) * 2.8, 0., 1.);
        float edge = 1. - smoothstep(drawn - .04, drawn + .04, vAlong);
        float travel = fract(uTime * .14 - vDelay * .8);
        float signal = exp(-pow((vAlong - travel) * 18., 2.)) * uMotion;
        float alpha = (.12 + signal * .65) * activation * edge * uOpacity;
        gl_FragColor = vec4(uColor, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const routes = new THREE.LineSegments(geometry, material);
  routes.name = "Roots connections";
  const beaconGeometry = new THREE.BufferGeometry();
  beaconGeometry.setAttribute("position", new THREE.Float32BufferAttribute(beaconPositions, 3));
  beaconGeometry.setAttribute("color", new THREE.Float32BufferAttribute(beaconColors, 3));
  beaconGeometry.setAttribute("activationDelay", new THREE.Float32BufferAttribute(beaconDelays, 1));
  beaconGeometry.setAttribute("pointSize", new THREE.Float32BufferAttribute(new Float32Array(destinations.length).fill(10), 1));
  const beacons = new THREE.Points(beaconGeometry, pointMaterial(THREE, { opacity: .95, scale: 1.25, beacon: true }));
  beacons.name = "Roots beacons";
  return { routes, beacons };
}
function pulseMaterial(THREE: ThreeModule, opacity: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uOpacity: { value: opacity }, uPulse: { value: 0 },
      uColor: { value: new THREE.Color("#fd987a") },
    },
    vertexShader: "void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `
      uniform float uOpacity, uPulse;
      uniform vec3 uColor;
      void main() {
        gl_FragColor = vec4(uColor, uOpacity * uPulse);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}
export function createGlobe(THREE: ThreeModule) {
  const group = new THREE.Group(),
    earth = new THREE.Group();
  group.add(earth);
  group.name = "Octagram roots globe";
  let destroyed = false;
  let reveal = 0;
  const { routes, beacons } = createConnections(THREE);
  earth.add(routes, beacons);
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
  const haloMaterial = pulseMaterial(THREE, .75);
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.065, 0.074, 48),
    haloMaterial,
  );
  halo.position.z = 0.008;
  marker.add(halo);
  const haloOuter = new THREE.Mesh(
    new THREE.RingGeometry(0.098, 0.102, 48),
    pulseMaterial(THREE, .38),
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
        "activationDelay",
        new THREE.Float32BufferAttribute(new Float32Array(pointSizes.length), 1),
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
      landCloud.name = "Roots land points";
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
    haloMaterial.uniforms.uColor.value.set("#fd987a");
    haloOuter.material.uniforms.uColor.value.set("#fd987a");
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
  const pointerRotation = new THREE.Quaternion();
  const pointerEuler = new THREE.Euler();
  function update(
    time = 0,
    progress = 0,
    pointer = { x: 0, y: 0 },
    reduced = false,
  ) {
    const motion = reduced ? 0 : Math.sin(time * 0.13) * 0.055,
      px = reduced ? 0 : pointer?.x || 0,
      py = reduced ? 0 : pointer?.y || 0;
    pointerEuler.set(py * 0.012, motion + px * 0.026, 0);
    pointerRotation.setFromEuler(pointerEuler);
    earth.quaternion.copy(pointerRotation).multiply(orientation);
    const entrance = reduced ? 1 : reveal;
    for (const material of [landCloud?.material, beacons.material, routes.material]) {
      if (!material) continue;
      material.uniforms.uTime.value = reduced ? 0 : time;
      material.uniforms.uReveal.value = entrance;
      material.uniforms.uMotion.value = reduced ? 0 : 1;
    }
    // Outward rings originate at Jordan, with a quiet fade between pulses.
    const cycle = (time * .34) % 1;
    const outerCycle = (cycle + .45) % 1;
    const strength = Math.min(1, entrance * 5);
    halo.scale.setScalar(reduced ? 1 : .8 + cycle * 2.5);
    haloOuter.scale.setScalar(reduced ? 1 : .8 + outerCycle * 2.1);
    haloMaterial.uniforms.uPulse.value = reduced ? .6 : Math.sin(cycle * Math.PI) ** 2 * strength;
    haloOuter.material.uniforms.uPulse.value = reduced ? .3 : Math.sin(outerCycle * Math.PI) ** 2 * strength;
  }
  applyBrandColors();
  update();
  return {
    group,
    update,
    ready,
    setReveal(value: number) { reveal = clamp(value); },
    markerPosition: markerPos.clone(),
    dispose: () => {
      destroyed = true;
      controller.abort();
      disposeGroup(group);
    },
  };
}
