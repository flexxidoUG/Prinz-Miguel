import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Procedural reconstruction of the reference scepter (single photo → hand-modelled).
 * Hidden back sides are completed symmetrically. Units: scepter ≈ 4.2 tall, centred on y = 0.
 */
const V = (x: number, y: number) => new THREE.Vector2(x, y);

function taperedTube(curve: THREE.Curve<THREE.Vector3>, r0: number, r1: number, seg = 48, radial = 12) {
  const frames = curve.computeFrenetFrames(seg, false);
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= seg; i++) {
    const p = curve.getPointAt(i / seg), N = frames.normals[i], B = frames.binormals[i];
    const r = r0 + (r1 - r0) * (i / seg) ** 0.9;
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      pos.push(p.x + r * (c * N.x + s * B.x), p.y + r * (c * N.y + s * B.y), p.z + r * (c * N.z + s * B.z));
    }
  }
  for (let i = 0; i < seg; i++)
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Brilliant-cut gem: few lathe segments + flat shading gives sparkling facets. */
const gemGeo = (() => {
  const g = new THREE.LatheGeometry([V(0, -0.62), V(0.62, -0.06), V(1, 0), V(0.98, 0.1), V(0.62, 0.32), V(0, 0.34)], 8);
  g.rotateX(Math.PI / 2); // table faces +z
  return g.toNonIndexed();
})();

export type ScepterApi = {
  setProgress(p: number): void;
  setChapter(i: number): void;
  dispose(): void;
};

export async function createScepter(canvas: HTMLCanvasElement, opts: { modelUrl?: string; mobile: boolean; onPick: () => void }): Promise<ScepterApi> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: devicePixelRatio < 2, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, opts.mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environment = envTex;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  // ---------- materials ----------
  const gold = new THREE.MeshStandardMaterial({ color: 0xe9b54e, metalness: 1, roughness: 0.2, envMapIntensity: 1.35 });
  const goldSoft = new THREE.MeshStandardMaterial({ color: 0xd9a443, metalness: 1, roughness: 0.34, envMapIntensity: 1.2 });
  const ruby = new THREE.MeshPhysicalMaterial({ color: 0xc8102c, roughness: 0.04, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0, emissive: 0x4a0010, emissiveIntensity: 0.6, envMapIntensity: 2.6, flatShading: true });
  const diamond = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0.25, clearcoat: 1, envMapIntensity: 3.2, flatShading: true, iridescence: 0.6 });
  const velvet = new THREE.MeshPhysicalMaterial({ color: 0x5e0712, roughness: 0.85, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(0xb02236), envMapIntensity: 0.6 });
  const ivory = new THREE.MeshPhysicalMaterial({ color: 0xf4ebdc, roughness: 0.7, sheen: 1, sheenRoughness: 0.4, sheenColor: new THREE.Color(0xffffff), envMapIntensity: 0.7 });
  const satinRed = new THREE.MeshPhysicalMaterial({ color: 0xb0122a, roughness: 0.32, sheen: 1, sheenColor: new THREE.Color(0xff8a9a), side: THREE.DoubleSide, envMapIntensity: 0.9 });
  const satinWhite = new THREE.MeshPhysicalMaterial({ color: 0xf6efe4, roughness: 0.3, sheen: 1, sheenColor: new THREE.Color(0xfff3d6), side: THREE.DoubleSide, envMapIntensity: 0.9 });
  const satinGold = new THREE.MeshStandardMaterial({ color: 0xe0b04c, metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide });

  const scepter = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D = scepter) => {
    const m = new THREE.Mesh(geo, mat);
    parent.add(m);
    return m;
  };
  const lathe = (pts: [number, number][], mat: THREE.Material, seg = 48) => add(new THREE.LatheGeometry(pts.map(([x, y]) => V(x, y)), seg), mat);
  /** Ring of instanced gems around the y-axis, facing outward. */
  const gemRing = (y: number, radius: number, count: number, size: number, mat: THREE.Material, offset = 0, tilt = 0) => {
    const im = new THREE.InstancedMesh(gemGeo, mat, count);
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + offset;
      o.position.set(Math.sin(a) * radius, y, Math.cos(a) * radius);
      o.rotation.set(tilt, a, 0);
      o.scale.setScalar(size);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    }
    scepter.add(im);
    return im;
  };
  const gemsAlong = (pts: THREE.Vector3[], normals: THREE.Vector3[], size: number, mat: THREE.Material) => {
    const im = new THREE.InstancedMesh(gemGeo, mat, pts.length);
    const o = new THREE.Object3D();
    pts.forEach((p, i) => {
      o.position.copy(p);
      o.lookAt(p.clone().add(normals[i]));
      o.scale.setScalar(size);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    scepter.add(im);
    return im;
  };

  // ---------- pommel (bottom) ----------
  lathe([[0, -2.18], [0.05, -2.16], [0.07, -2.1], [0.05, -2.04], [0.1, -2.0], [0.13, -1.98], [0.1, -1.95]], gold);
  add(new THREE.SphereGeometry(0.2, 40, 28), gold).position.y = -1.78;
  gemRing(-1.78, 0.19, 6, 0.06, ruby);
  gemRing(-1.67, 0.15, 14, 0.018, diamond, 0.2, -0.5);
  gemRing(-1.89, 0.15, 14, 0.018, diamond, 0.2, 0.5);
  lathe([[0.1, -1.6], [0.13, -1.59], [0.14, -1.55], [0.1, -1.52], [0.085, -1.5], [0.11, -1.46], [0.11, -1.42], [0.082, -1.4]], gold);
  gemRing(-1.44, 0.112, 12, 0.017, diamond);

  // ---------- shaft: velvet with jewelled gold spiral ----------
  const shaftLen = 2.1, shaftY0 = -1.4;
  add(new THREE.CylinderGeometry(0.075, 0.08, shaftLen, 32, 1, true), velvet).position.y = shaftY0 + shaftLen / 2;
  const turns = 4.5;
  class Helix extends THREE.Curve<THREE.Vector3> {
    constructor() { super(); }
    getPoint(t: number, target = new THREE.Vector3()) {
      const a = t * turns * Math.PI * 2;
      return target.set(Math.sin(a) * 0.083, shaftY0 + t * shaftLen, Math.cos(a) * 0.083);
    }
  }
  const helix = new Helix();
  add(new THREE.TubeGeometry(helix, 360, 0.022, 8, false), gold);
  {
    const pts: THREE.Vector3[] = [], ns: THREE.Vector3[] = [];
    const n = opts.mobile ? 60 : 110;
    for (let i = 0; i < n; i++) {
      const p = helix.getPoint((i + 0.5) / n);
      pts.push(p.clone().multiplyScalar(1).setY(p.y).add(new THREE.Vector3(p.x, 0, p.z).multiplyScalar(0.25)));
      ns.push(new THREE.Vector3(p.x, 0, p.z).normalize());
    }
    gemsAlong(pts, ns, 0.017, diamond);
  }

  // ---------- collar ----------
  lathe([[0.082, 0.7], [0.11, 0.71], [0.12, 0.75], [0.1, 0.78], [0.13, 0.8], [0.18, 0.86], [0.19, 0.93], [0.16, 0.97], [0.22, 1.0], [0.24, 1.05], [0.2, 1.08]], gold);
  gemRing(0.9, 0.185, 10, 0.034, ruby);
  gemRing(0.9, 0.185, 10, 0.016, diamond, Math.PI / 10);
  gemRing(1.03, 0.236, 22, 0.017, diamond);
  gemRing(0.755, 0.12, 12, 0.015, diamond);

  // ---------- crown head ----------
  lathe([[0.2, 1.08], [0.26, 1.12], [0.32, 1.22], [0.34, 1.3], [0.335, 1.34], [0.3, 1.34], [0.29, 1.3]], goldSoft, 64);
  gemRing(1.25, 0.33, 12, 0.03, ruby, 0, -0.35);
  gemRing(1.32, 0.33, 24, 0.014, diamond, 0, -0.2);
  const dome = add(new THREE.SphereGeometry(0.28, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), velvet);
  dome.position.y = 1.3;
  dome.scale.y = 0.85;
  // arches with pearls
  for (let i = 0; i < 4; i++) {
    const arch = add(new THREE.TorusGeometry(0.3, 0.024, 10, 48, Math.PI), gold);
    arch.position.y = 1.32;
    arch.rotation.y = (i * Math.PI) / 4;
    arch.scale.y = 0.9;
    const pts: THREE.Vector3[] = [], ns: THREE.Vector3[] = [];
    for (let k = 1; k < 12; k++) {
      const a = (k / 12) * Math.PI;
      const local = new THREE.Vector3(Math.cos(a) * 0.3, Math.sin(a) * 0.3 * 0.9 + 0.03, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), (i * Math.PI) / 4);
      local.y += 1.32;
      pts.push(local);
      ns.push(new THREE.Vector3(0, 1, 0));
    }
    gemsAlong(pts, ns, 0.014, diamond);
  }
  // fleur-de-lis ornaments on the rim (front/back/left/right)
  const curl = (pts: [number, number, number][], r0: number, r1: number) =>
    taperedTube(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), r0, r1, 32, 8);
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group();
    g.rotation.y = (i * Math.PI) / 2;
    scepter.add(g);
    const place = (geo: THREE.BufferGeometry) => add(geo, gold, g);
    place(curl([[0, 1.33, 0.33], [0, 1.45, 0.35], [0, 1.56, 0.34], [0, 1.62, 0.33]], 0.035, 0.004));
    place(curl([[0.01, 1.34, 0.33], [0.08, 1.42, 0.35], [0.14, 1.5, 0.34], [0.12, 1.56, 0.32], [0.08, 1.53, 0.33]], 0.026, 0.006));
    place(curl([[-0.01, 1.34, 0.33], [-0.08, 1.42, 0.35], [-0.14, 1.5, 0.34], [-0.12, 1.56, 0.32], [-0.08, 1.53, 0.33]], 0.026, 0.006));
    const band = place(new THREE.TorusGeometry(0.035, 0.012, 8, 20));
    band.position.set(0, 1.4, 0.345);
    const gem = new THREE.Mesh(gemGeo, ruby);
    gem.position.set(0, 1.22, 0.36);
    gem.scale.setScalar(i === 0 ? 0.075 : 0.05);
    g.add(gem);
  }

  // ---------- jester cap on top ----------
  const capBand = add(new THREE.TorusGeometry(0.17, 0.035, 12, 48), gold);
  capBand.rotation.x = Math.PI / 2;
  capBand.position.y = 1.62;
  gemRing(1.62, 0.2, 16, 0.018, diamond);
  const capBase = lathe([[0.17, 1.62], [0.16, 1.7], [0.12, 1.78], [0.05, 1.82], [0, 1.83]], velvet);
  capBase.castShadow = false;
  const horns: THREE.Mesh[] = [];
  [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].forEach((a, i) => {
    const d = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    const P = (r: number, y: number) => d.clone().multiplyScalar(r).setY(y);
    const curve = new THREE.CatmullRomCurve3([P(0.06, 1.68), P(0.22, 1.98), P(0.46, 2.08), P(0.62, 1.94), P(0.66, 1.78)]);
    const horn = add(taperedTube(curve, 0.13, 0.03, 56, 18), i === 1 ? ivory : velvet);
    horns.push(horn);
    const trim = add(taperedTube(new THREE.CatmullRomCurve3([P(0.06, 1.68), P(0.22, 1.98), P(0.46, 2.08), P(0.62, 1.94), P(0.66, 1.78)].map((p) => p.add(new THREE.Vector3(0, 0.004, 0)))), 0.02, 0.008, 56, 6), gold);
    trim.scale.set(1.02, 1.02, 1.02);
    const bell = add(new THREE.SphereGeometry(0.065, 24, 16), gold);
    bell.position.copy(P(0.67, 1.71));
    const tipRing = add(new THREE.TorusGeometry(0.04, 0.012, 8, 20), gold);
    tipRing.position.copy(P(0.665, 1.77));
    tipRing.rotation.x = Math.PI / 2;
  });
  add(new THREE.SphereGeometry(0.055, 20, 14), gold).position.y = 1.86;

  // ---------- ribbons (simulated satin) ----------
  type Ribbon = { mesh: THREE.Mesh; base: Float32Array; len: number; phase: number; dir: THREE.Vector3 };
  const ribbons: Ribbon[] = [];
  const tieY = 0.66;
  const ribbonDefs: [THREE.Material, number, number, number][] = [
    [satinRed, 1.7, 0.6, 0], [satinWhite, 1.55, -0.5, 1.3], [satinRed, 1.35, 2.4, 2.1], [satinWhite, 1.8, -2.2, 3.4], [satinGold, 1.2, 1.4, 4.2],
  ];
  for (const [mat, len, ang, phase] of ribbonDefs) {
    const geo = new THREE.PlaneGeometry(mat === satinGold ? 0.03 : 0.085, len, 1, opts.mobile ? 24 : 44);
    geo.translate(0, -len / 2, 0);
    const mesh = add(geo, mat);
    mesh.position.y = tieY;
    const dir = new THREE.Vector3(Math.sin(ang), 0, Math.cos(ang));
    ribbons.push({ mesh, base: (geo.attributes.position.array as Float32Array).slice(), len, phase, dir });
  }
  // bow loops
  for (const [m, s] of [[satinRed, 1], [satinWhite, -1]] as const) {
    const loop = add(new THREE.TorusGeometry(0.11, 0.022, 6, 24), m);
    loop.position.set(0.13 * s, tieY + 0.03, 0.06);
    loop.scale.set(1, 0.55, 0.3);
    loop.rotation.z = 0.5 * s;
  }
  add(new THREE.TorusGeometry(0.088, 0.03, 8, 24), satinRed).rotation.x = Math.PI / 2;
  scepter.children[scepter.children.length - 1].position.y = tieY;

  // optional uploaded GLB replaces the procedural model
  let custom: THREE.Object3D | null = null;
  if (opts.modelUrl) {
    try {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const gltf = await new GLTFLoader().loadAsync(opts.modelUrl);
      custom = gltf.scene;
      const box = new THREE.Box3().setFromObject(custom);
      const size = box.getSize(new THREE.Vector3());
      custom.scale.setScalar(4.2 / Math.max(size.x, size.y, size.z));
      box.setFromObject(custom);
      custom.position.sub(box.getCenter(new THREE.Vector3()));
    } catch {
      custom = null;
    }
  }
  const pivot = new THREE.Group();
  pivot.add(custom ?? scepter);
  scene.add(pivot);

  // ---------- light & atmosphere ----------
  scene.add(new THREE.AmbientLight(0x3a1015, 0.6));
  const key = new THREE.SpotLight(0xffe2a8, 60, 20, 0.5, 0.6, 1.4);
  key.position.set(0.5, 7, 3);
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xff5a4a, 1.6);
  rim.position.set(-4, 2, -3);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffd9a0, 0.8);
  fill.position.set(3, 1, 4);
  scene.add(fill);
  const sweep = new THREE.PointLight(0xfff1cc, 0, 4, 1.5);
  scene.add(sweep);

  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uOpacity: { value: 0 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform float uOpacity; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float edge=pow(abs(dot(vN,vV)),1.6); float a=smoothstep(0.,0.85,vUv.y)*edge*uOpacity*0.32; gl_FragColor=vec4(1.,.86,.55,a); }',
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 2.1, 12, 48, 1, true), beamMat);
  beam.position.y = 3.5;
  scene.add(beam);

  const sprite = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,240,200,1)');
    gr.addColorStop(0.25, 'rgba(255,210,120,.8)');
    gr.addColorStop(1, 'rgba(255,200,100,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const NP = opts.mobile ? 160 : 380;
  const pg = new THREE.BufferGeometry();
  const pp = new Float32Array(NP * 3), seeds = new Float32Array(NP);
  for (let i = 0; i < NP; i++) {
    pp.set([(Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 4], i * 3);
    seeds[i] = Math.random() * 100;
  }
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const dust = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.06, map: sprite, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  scene.add(dust);

  // ---------- state ----------
  let progress = 0, chapter = -1;
  const cur = { y: -4, x: 0, rotY: 0, tiltZ: -0.42, tiltX: 0.08, camZ: 8.5, camY: 0, lookY: 0, beam: 0, sweepX: -3, scale: 1 };
  let userYaw = 0, yawVel = 0, dragging = false, lastX = 0, downX = 0, downY = 0, hoverX = 0, hoverY = 0;
  let prevRot = 0, swing = 0, swingVel = 0;

  const target = () => {
    const p = progress, ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
    const enter = ease(p / 0.14), zoom = ease((p - 0.14) / 0.16), out = ease((p - 0.3) / 0.1);
    const side = opts.mobile ? 0 : -1.25 * out;
    const t = {
      y: -4 + 4 * enter + (opts.mobile ? 0.95 * out - 0.75 * (1 - out) : 0),
      x: side,
      rotY: p * Math.PI * 2.4,
      tiltZ: -0.42 * (1 - zoom) + (-0.18) * zoom,
      tiltX: 0.08,
      camZ: 8.5 - 4.2 * zoom + (opts.mobile ? 4.6 : 6) * out,
      camY: 1.35 * zoom * (1 - out),
      lookY: 1.4 * zoom * (1 - out) + (opts.mobile ? 0.95 * out : 0),
      beam: enter,
      sweepX: -3 + 6 * ease((p - 0.16) / 0.14),
      scale: opts.mobile ? 1 - 0.3 * out : 1,
    };
    // chapter poses
    if (chapter === 0) { t.tiltZ = -0.28; t.rotY += 0.4; }
    if (chapter === 1) { t.tiltZ = 0.32; t.tiltX = -0.2; t.rotY += 1.2; }
    if (chapter === 2) { t.tiltZ = 0; t.tiltX = 0; }
    return t;
  };

  // ---------- interaction ----------
  const onDown = (e: PointerEvent) => { dragging = true; lastX = downX = e.clientX; downY = e.clientY; yawVel = 0; };
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    hoverX = ((e.clientX - r.left) / r.width - 0.5) * 2;
    hoverY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    yawVel = dx * 0.012;
    userYaw += yawVel;
  };
  const onUp = (e: PointerEvent) => {
    if (dragging && Math.hypot(e.clientX - downX, e.clientY - downY) < 6) {
      // clicks on the scepter itself open the next chapter
      const r = canvas.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      if (ray.intersectObject(pivot, true).length) opts.onPick();
    }
    dragging = false;
  };
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 42 : 32;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let raf = 0, running = false, last = performance.now();
  const ribbonVec = new THREE.Vector3();
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    const tg = target();
    const k = 1 - Math.exp(-dt * 3.2);
    for (const key of Object.keys(cur) as (keyof typeof cur)[]) cur[key] += (tg[key] - cur[key]) * k;
    if (!dragging) { yawVel *= Math.exp(-dt * 2.2); userYaw += yawVel; }
    const idleSpin = t * 0.12;

    pivot.position.set(cur.x, cur.y + Math.sin(t * 0.9) * 0.06, 0);
    pivot.scale.setScalar(cur.scale);
    pivot.rotation.set(cur.tiltX + hoverY * 0.06, cur.rotY + userYaw + idleSpin, cur.tiltZ - hoverX * 0.05, 'ZXY');
    camera.position.set(0, cur.camY, cur.camZ);
    camera.lookAt(0, cur.lookY, 0);
    beamMat.uniforms.uOpacity.value = cur.beam;
    (dust.material as THREE.PointsMaterial).opacity = cur.beam * 0.85;
    key.intensity = 15 + 55 * cur.beam;
    key.target.position.set(cur.x, cur.y + 1, 0);
    sweep.position.set(cur.sweepX, 1.4 + cur.y * 0.2, 1.2);
    sweep.intensity = Math.max(0, 1 - Math.abs(cur.sweepX) / 3) * 18;

    // dust drifts upward in the beam
    const arr = pg.attributes.position.array as Float32Array;
    for (let i = 0; i < NP; i++) {
      arr[i * 3 + 1] += dt * (0.08 + (seeds[i] % 1) * 0.12);
      arr[i * 3] += Math.sin(t * 0.5 + seeds[i]) * dt * 0.05;
      if (arr[i * 3 + 1] > 3.5) arr[i * 3 + 1] = -3.5;
    }
    pg.attributes.position.needsUpdate = true;

    // ribbons: spring-driven swing from the angular velocity + travelling wave
    const rot = pivot.rotation.y;
    const angVel = (rot - prevRot) / Math.max(dt, 1e-3);
    prevRot = rot;
    swingVel += (-angVel * 0.18 - swing) * dt * 9;
    swingVel *= Math.exp(-dt * 2.5);
    swing += swingVel * dt * 4;
    for (const r of ribbons) {
      const pos = r.mesh.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length; i += 3) {
        const s = Math.max(0, -r.base[i + 1] / r.len); // 0 at the knot, 1 at the tip
        const wave = Math.sin(t * 2.1 + s * 6 + r.phase) * 0.07 * s + Math.sin(t * 1.3 + s * 3 + r.phase * 2) * 0.04 * s;
        const out = 0.25 * s ** 1.2 + swing * s * s * 0.6;
        ribbonVec.copy(r.dir).multiplyScalar(out + wave);
        pos[i] = r.base[i] * Math.cos(s * 1.4 + r.phase) + ribbonVec.x + Math.cos(r.phase) * wave * 0.4;
        pos[i + 1] = r.base[i + 1] * (1 - 0.08 * s) + Math.sin(t * 1.7 + s * 4 + r.phase) * 0.02 * s;
        pos[i + 2] = r.base[i] * Math.sin(s * 1.4 + r.phase) * 0.6 + ribbonVec.z;
      }
      r.mesh.geometry.attributes.position.needsUpdate = true;
      r.mesh.geometry.computeVertexNormals();
    }
    horns.forEach((h, i) => (h.rotation.y = Math.sin(t * 1.4 + i) * 0.015));
    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(tick); }
    if (!e.isIntersecting) { running = false; cancelAnimationFrame(raf); }
  });
  io.observe(canvas);

  return {
    setProgress: (p) => (progress = p),
    setChapter: (i) => (chapter = i),
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      renderer.dispose();
      envTex.dispose();
      pmrem.dispose();
    },
  };
}
