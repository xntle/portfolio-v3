import * as THREE from "three";
import { NAV, ROOM, type Thing, type ThingId } from "./room";
import { BOARD_MM, dartsAllowed, ORDER, scoreDart, type DartHit, type DartsState } from "./darts";
import { createAudio } from "./audio";

// The white room: a first-person walk through stippled furniture.
// The room is plain white. Only the items exist, and they are made of dust:
// loose motes that gather where a surface turns from the light and drift a little.

export type GameState = "title" | "intro" | "play";

export type GameOptions = {
  app: HTMLElement;
  canvas: HTMLCanvasElement;
  /** Touch joystick ring; its first child is the knob. */
  stick: HTMLElement;
  onState: (s: GameState) => void;
  onFocus: (id: ThingId | null) => void;
  onOpen: (id: ThingId) => void;
  /** The mouse has been captured (true) or released (false). */
  onLock: (locked: boolean) => void;
  /** The dart game at the dartboard: its score while you are playing, null once you leave. */
  onDarts: (darts: DartsState | null) => void;
  /** You went through the door into the closet (true) or came back out (false). */
  onCloset: (inside: boolean) => void;
};

export type Game = {
  start: () => void;
  walkTo: (id: ThingId) => void;
  /** Freeze movement and input. `sheet` says a sheet is covering part of the view. */
  setPaused: (paused: boolean, sheet?: boolean) => void;
  /** The host says something (the shoes-off rule). */
  say: () => void;
  /** Step away from the dartboard. */
  leaveDarts: () => void;
  /** Come back out of the closet behind the door. */
  leaveCloset: () => void;
  /** Leave your shoes at the entrance. */
  takeShoesOff: () => void;
  setMuted: (muted: boolean) => void;
  dispose: () => void;
};

type Live = Thing & { ap: { x: number; z: number } };
type Mat = THREE.Material;
type Builder = (g: THREE.Group, m: Mat, ex: number[]) => void;

const PAPER = 0xf8f8f7;
const INK = 0x141413;
const EYE = 1.62;
const SPEED = 3.3;
const XH = 10;
const ZMIN = -10;
const ZMAX = 13;
const START_Z = 8;
const TAU = Math.PI * 2;
const REACH = 2.3; // metres from an item's edge within which it opens without walking
// the year grid on the wall: spacing between days and months, height of January
const YEAR_DX = 0.1;
const YEAR_DY = 0.13;
const YEAR_TOP = 2.3;
const BOARD_Y = 1.7; // height of the dartboard's centre
const BOARD_R = 0.34; // its radius, to the outside of the double ring
const BOARD_OUT = 0.02; // how far it stands off the wall

/** What is left of the current year. */
export function yearLeft(now = new Date()) {
  const year = now.getFullYear();
  const ms = Math.max(0, new Date(year + 1, 0, 1).getTime() - now.getTime());
  const s = Math.floor(ms / 1000);
  return { year, days: Math.floor(s / 86400), hours: Math.floor(s / 3600) % 24, minutes: Math.floor(s / 60) % 60, seconds: s % 60 };
}

export function createGame(opts: GameOptions): Game | null {
  const { app, canvas } = opts;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    return null;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LIGHT = new THREE.Vector3(-0.7, 0.6, -0.25).normalize();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(PAPER, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.05, 90);
  camera.rotation.order = "YXZ";

  /* seeded so the grain lands in the same place every visit */
  let seed = 20261119;
  const rnd = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(TAU * rnd());

  /* Dust: soft round motes of uneven size and weight, flickering like TV static
     while the forms they make sway as if in a dream. They thin out with distance
     instead of fogging, because the room behind them is just white. */
  const shared = { uTime: { value: 0 }, uScale: { value: 1 }, uMaxPx: { value: 6 } };
  const dustMat = (size: number) =>
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: shared.uTime,
        uScale: shared.uScale,
        uMaxPx: shared.uMaxPx,
        uSize: { value: size },
        uOpacity: { value: 1 },
        uColor: { value: new THREE.Color(INK) },
      },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime, uScale, uSize, uOpacity, uMaxPx;
        varying float vAlpha;
        float hash(vec2 v) { return fract(sin(dot(v, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
          // TV static: every mote jumps to a new spot near its home a dozen times a
          // second, each on its own beat, and some frames it is simply not there
          float tick = floor(uTime * 13.0 + aSeed * 7.0);
          vec3 jump = vec3(hash(vec2(aSeed, tick)), hash(vec2(aSeed + 3.1, tick)), hash(vec2(aSeed + 6.7, tick))) - 0.5;
          float loose = pow(fract(aSeed * 7.13), 6.0);
          vec3 p = position + jump * uSize * (0.9 + 6.0 * loose);
          // dream: the whole form swims slowly, like looking at it through water
          vec4 w = modelMatrix * vec4(p, 1.0);
          float sway = uTime * 0.55;
          w.x += 0.035 * sin(sway + w.y * 2.3 + w.z * 0.6);
          w.z += 0.035 * cos(sway * 0.8 + w.y * 1.9 + w.x * 0.5);
          w.y += 0.012 * sin(sway * 1.3 + w.x * 1.7) * step(0.03, position.y);
          vec4 mv = viewMatrix * w;
          gl_Position = projectionMatrix * mv;
          float px = uSize * (0.5 + 1.0 * fract(aSeed * 13.7)) * uScale / -mv.z;
          gl_PointSize = clamp(px, 1.5, uMaxPx); // stays fine dust up close, never blobs
          float far = 1.0 - smoothstep(9.0, 30.0, -mv.z);
          float flicker = 0.25 + 0.75 * step(0.3, hash(vec2(aSeed + 1.7, tick)));
          vAlpha = (0.4 + 0.6 * fract(aSeed * 3.3)) * flicker * uOpacity * far * min(1.0, px * px / 2.25);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float a = smoothstep(0.5, 0.18, length(gl_PointCoord - 0.5)) * vAlpha;
          if (a < 0.01) discard;
          gl_FragColor = vec4(uColor, a);
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
  const dust = (positions: number[], size: number) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const seeds = new Float32Array(positions.length / 3);
    for (let i = 0; i < seeds.length; i++) seeds[i] = rnd();
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return new THREE.Points(geo, dustMat(size));
  };
  /* The solids are only scaffolding to sample dust from; they are never drawn. */
  const scaffold = new THREE.MeshBasicMaterial();
  const solidMat = (): Mat => scaffold;

  /* Scatter dust over every mesh in a group. `extra` is hand-placed dust in the
     group's local space: the drawings on the whiteboard, the clock's ticks. */
  const done = new WeakSet<THREE.Object3D>();
  function stipple(group: THREE.Group, density: number, size: number, extra?: number[]) {
    group.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
    const out = extra ? extra.slice() : [];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    const na = new THREE.Vector3(), nb = new THREE.Vector3(), nc = new THREE.Vector3();
    const ab = new THREE.Vector3(), ac = new THREE.Vector3(), cr = new THREE.Vector3();
    const p = new THREE.Vector3(), n = new THREE.Vector3();
    const nm = new THREE.Matrix3();
    group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || done.has(m)) return;
      done.add(m);
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
      const pos = g.attributes.position as THREE.BufferAttribute;
      const nor = g.attributes.normal as THREE.BufferAttribute;
      nm.getNormalMatrix(m.matrixWorld);
      for (let i = 0; i < pos.count; i += 3) {
        a.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        b.fromBufferAttribute(pos, i + 1).applyMatrix4(m.matrixWorld);
        c.fromBufferAttribute(pos, i + 2).applyMatrix4(m.matrixWorld);
        na.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
        nb.fromBufferAttribute(nor, i + 1).applyMatrix3(nm).normalize();
        nc.fromBufferAttribute(nor, i + 2).applyMatrix3(nm).normalize();
        ab.subVectors(b, a);
        ac.subVectors(c, a);
        const want = cr.crossVectors(ab, ac).length() * 0.5 * density;
        const count = Math.floor(want) + (rnd() < want % 1 ? 1 : 0);
        for (let k = 0; k < count; k++) {
          let r1 = rnd(), r2 = rnd();
          if (r1 + r2 > 1) {
            r1 = 1 - r1;
            r2 = 1 - r2;
          }
          n.set(0, 0, 0).addScaledVector(na, 1 - r1 - r2).addScaledVector(nb, r1).addScaledVector(nc, r2).normalize();
          p.copy(a).addScaledVector(ab, r1).addScaledVector(ac, r2);
          if (n.y < -0.85 && p.y < 0.03) continue; // undersides resting on the floor
          const dark = (1 - n.dot(LIGHT)) / 2;
          if (rnd() > 0.12 + 0.88 * Math.pow(dark, 1.5)) continue;
          // dust does not sit exactly on the surface, and some of it has come loose
          const fuzz = size * (rnd() < 0.06 ? 2.2 : 0.3);
          p.addScaledVector(n, gauss() * fuzz);
          p.x += gauss() * fuzz * 0.5;
          p.y += gauss() * fuzz * 0.5;
          p.z += gauss() * fuzz * 0.5;
          p.applyMatrix4(inv);
          out.push(p.x, p.y, p.z);
        }
      }
      if (g !== m.geometry) g.dispose();
    });
    const pts = dust(out, size);
    group.add(pts);
    return pts;
  }

  /* ---------- shape helpers ---------- */
  const put = (g: THREE.Object3D, geo: THREE.BufferGeometry, m: Mat, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(geo, m);
    o.visible = false;
    o.position.set(x, y, z);
    g.add(o);
    return o;
  };
  const box = (g: THREE.Object3D, m: Mat, w: number, h: number, d: number, x: number, y: number, z: number) =>
    put(g, new THREE.BoxGeometry(w, h, d), m, x, y, z);
  const cyl = (g: THREE.Object3D, m: Mat, rt: number, rb: number, h: number, x: number, y: number, z: number, seg = 20) =>
    put(g, new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y, z);
  const sph = (g: THREE.Object3D, m: Mat, r: number, x: number, y: number, z: number) =>
    put(g, new THREE.SphereGeometry(r, 20, 14), m, x, y, z);
  const UP = new THREE.Vector3(0, 1, 0);
  const stick = (g: THREE.Object3D, m: Mat, ax: number, ay: number, az: number, bx: number, by: number, bz: number, r: number) => {
    const A = new THREE.Vector3(ax, ay, az);
    const d = new THREE.Vector3(bx, by, bz).sub(A);
    const len = d.length();
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), m);
    o.visible = false;
    o.position.copy(A).addScaledVector(d, 0.5);
    o.quaternion.setFromUnitVectors(UP, d.normalize());
    g.add(o);
    return o;
  };
  /* ink drawn on a flat face (the XY plane at depth z) */
  const inkLine = (ex: number[], x1: number, y1: number, x2: number, y2: number, z: number) => {
    const n = Math.max(4, Math.round(Math.hypot(x2 - x1, y2 - y1) * 260));
    for (let i = 0; i < n; i++) {
      const u = rnd();
      ex.push(x1 + (x2 - x1) * u + gauss() * 0.003, y1 + (y2 - y1) * u + gauss() * 0.003, z);
    }
  };
  const inkRect = (ex: number[], cx: number, cy: number, w: number, h: number, z: number, fill = 0) => {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    inkLine(ex, x0, y0, x1, y0, z);
    inkLine(ex, x1, y0, x1, y1, z);
    inkLine(ex, x1, y1, x0, y1, z);
    inkLine(ex, x0, y1, x0, y0, z);
    const n = Math.round(w * h * fill);
    for (let i = 0; i < n; i++) ex.push(x0 + rnd() * w, y0 + rnd() * h, z);
  };
  const inkRing = (ex: number[], cx: number, cy: number, r: number, z: number, n: number, fill = false) => {
    for (let i = 0; i < n; i++) {
      const an = rnd() * TAU;
      const rr = fill ? r * Math.sqrt(rnd()) : r + gauss() * 0.003;
      ex.push(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr, z);
    }
  };

  /* move ink drawn flat (from index `from` on) onto a tilted part */
  const onto = (ex: number[], from: number, part: THREE.Object3D) => {
    part.updateMatrix();
    const v = new THREE.Vector3();
    for (let i = from; i < ex.length; i += 3) {
      v.set(ex[i], ex[i + 1], ex[i + 2]).applyMatrix4(part.matrix);
      ex[i] = v.x;
      ex[i + 1] = v.y;
      ex[i + 2] = v.z;
    }
  };
  /* dust that has settled on the floor around an item */
  const settle = (ex: number[], r: number) => {
    const n = Math.round(420 * r * r) + 120;
    for (let i = 0; i < n; i++) ex.push(gauss() * r * 0.6, Math.abs(gauss()) * 0.012, gauss() * r * 0.6);
  };

  /* the grainy figure on the title screen: that's the player */
  const figure = new THREE.Group();
  let figureDust: THREE.ShaderMaterial;
  {
    const m = solidMat();
    put(figure, new THREE.SphereGeometry(0.115, 24, 18), m, 0, 1.63, 0);
    put(figure, new THREE.CylinderGeometry(0.045, 0.052, 0.1, 12), m, 0, 1.49, 0);
    put(figure, new THREE.SphereGeometry(0.175, 20, 12), m, 0, 1.4, 0).scale.set(1.08, 0.36, 0.6);
    put(figure, new THREE.CylinderGeometry(0.175, 0.13, 0.54, 20), m, 0, 1.14, 0).scale.z = 0.6;
    put(figure, new THREE.SphereGeometry(0.14, 18, 12), m, 0, 0.86, 0).scale.set(1, 0.6, 0.68);
    for (const s of [-1, 1]) {
      put(figure, new THREE.CylinderGeometry(0.068, 0.048, 0.86, 14), m, s * 0.082, 0.43, 0);
      put(figure, new THREE.CylinderGeometry(0.046, 0.036, 0.64, 12), m, s * 0.232, 1.1, 0).rotation.z = s * 0.075;
    }
    const ex: number[] = [];
    settle(ex, 0.3);
    figureDust = stipple(figure, 7000, 0.024, ex).material;
  }

  /* ---------- the furniture, modelled on the pixel sprites in /public/pixel/items ---------- */
  const BUILD: Record<ThingId, Builder> = {
    desk(g, m, ex) {
      box(g, m, 1.7, 0.05, 0.8, 0, 0.75, 0);
      for (const [x, z] of [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]]) box(g, m, 0.05, 0.73, 0.05, x, 0.365, z);
      box(g, m, 1.6, 0.04, 0.04, 0, 0.3, -0.35);
      // monitor, with a window open on it
      box(g, m, 0.26, 0.02, 0.18, 0.28, 0.785, -0.22);
      box(g, m, 0.06, 0.22, 0.05, 0.28, 0.89, -0.24);
      box(g, m, 0.8, 0.47, 0.035, 0.28, 1.21, -0.22);
      const sz = -0.198;
      inkRect(ex, 0.28, 1.21, 0.72, 0.39, sz);
      inkLine(ex, -0.08, 1.36, 0.64, 1.36, sz);
      inkRect(ex, 0.02, 1.27, 0.16, 0.04, sz, 9000);
      inkRect(ex, 0.3, 1.27, 0.08, 0.04, sz, 9000);
      inkRect(ex, 0, 1.19, 0.12, 0.04, sz, 9000);
      inkRect(ex, 0.2, 1.19, 0.1, 0.04, sz, 16000);
      inkRect(ex, -0.02, 1.11, 0.08, 0.04, sz, 9000);
      inkRect(ex, 0.2, 1.11, 0.1, 0.04, sz, 16000);
      inkLine(ex, 0.42, 1.36, 0.42, 1.02, sz);
      inkLine(ex, 0.47, 1.25, 0.6, 1.25, sz);
      inkLine(ex, 0.47, 1.17, 0.6, 1.17, sz);
      // laptop
      box(g, m, 0.38, 0.018, 0.26, -0.22, 0.787, 0.14);
      box(g, m, 0.38, 0.25, 0.012, -0.22, 0.905, -0.02).rotation.x = -0.28;
      // desk lamp
      cyl(g, m, 0.07, 0.08, 0.02, -0.68, 0.785, -0.2);
      stick(g, m, -0.68, 0.79, -0.2, -0.74, 1.08, -0.2, 0.012);
      stick(g, m, -0.74, 1.08, -0.2, -0.52, 1.27, -0.2, 0.012);
      put(g, new THREE.ConeGeometry(0.1, 0.15, 20, 1, true), m, -0.47, 1.24, -0.2).rotation.z = -0.9;
      // mug and the rubber duck
      cyl(g, m, 0.04, 0.035, 0.09, -0.56, 0.82, 0.2);
      sph(g, m, 0.06, 0.7, 0.83, 0.22).scale.set(1.15, 0.85, 1);
      sph(g, m, 0.038, 0.735, 0.9, 0.22);
      put(g, new THREE.ConeGeometry(0.014, 0.035, 8), m, 0.78, 0.895, 0.22).rotation.z = -Math.PI / 2;
    },

    whiteboard(g, m, ex) {
      box(g, m, 2.0, 1.25, 0.04, 0, 1.45, 0);
      box(g, m, 2.08, 0.04, 0.06, 0, 2.09, 0);
      box(g, m, 2.08, 0.04, 0.06, 0, 0.81, 0);
      for (const s of [-1, 1]) {
        box(g, m, 0.04, 1.32, 0.06, s * 1.02, 1.45, 0);
        box(g, m, 0.05, 0.8, 0.05, s * 0.92, 0.4, -0.03);
        box(g, m, 0.05, 0.04, 0.62, s * 0.92, 0.02, -0.03);
      }
      box(g, m, 1.5, 0.025, 0.09, 0, 0.845, 0.06);
      box(g, m, 0.16, 0.03, 0.03, -0.4, 0.872, 0.06);
      box(g, m, 0.16, 0.03, 0.03, -0.1, 0.872, 0.06);
      box(g, m, 0.2, 0.05, 0.06, 0.45, 0.88, 0.06);
      const z = 0.025;
      // sticky notes
      const notes = [[-0.74, 1.82], [-0.4, 1.76], [0.12, 1.82], [0.72, 1.8], [-0.72, 1.14], [0.7, 1.16]];
      notes.forEach(([x, y], i) => {
        inkRect(ex, x, y, 0.27, 0.25, z, 2600);
        inkRect(ex, x, y + 0.115, 0.05, 0.035, z, 30000);
        inkLine(ex, x - 0.08, y + 0.03, x + 0.08, y + 0.03, z);
        inkLine(ex, x - 0.08, y - 0.03, x + 0.05, y - 0.03, z);
        if (i > 3) inkLine(ex, x - 0.08, y - 0.08, x + 0.02, y - 0.08, z);
      });
      // a list, a flow arrow, "x + 1 =", a check
      for (const y of [1.5, 1.43, 1.36]) {
        inkRect(ex, -0.84, y, 0.025, 0.025, z, 40000);
        inkLine(ex, -0.78, y, -0.56, y, z);
      }
      inkRect(ex, -0.22, 1.34, 0.22, 0.09, z, 14000);
      inkRect(ex, -0.22, 1.12, 0.2, 0.08, z, 5000);
      inkLine(ex, -0.22, 1.29, -0.22, 1.16, z);
      inkLine(ex, -0.22, 1.385, -0.22, 1.5, z);
      inkLine(ex, -0.22, 1.5, 0, 1.5, z);
      inkLine(ex, -0.05, 1.545, 0, 1.5, z);
      inkLine(ex, -0.05, 1.455, 0, 1.5, z);
      inkLine(ex, 0.16, 1.53, 0.24, 1.45, z);
      inkLine(ex, 0.16, 1.45, 0.24, 1.53, z);
      inkLine(ex, 0.29, 1.49, 0.37, 1.49, z);
      inkLine(ex, 0.33, 1.53, 0.33, 1.45, z);
      inkLine(ex, 0.43, 1.53, 0.43, 1.45, z);
      inkLine(ex, 0.49, 1.51, 0.57, 1.51, z);
      inkLine(ex, 0.49, 1.47, 0.57, 1.47, z);
      inkLine(ex, 0.68, 1.47, 0.73, 1.42, z);
      inkLine(ex, 0.73, 1.42, 0.84, 1.55, z);
      inkRect(ex, 0.22, 1.2, 0.16, 0.2, z, 4000);
      inkLine(ex, 0.17, 1.23, 0.27, 1.23, z);
      inkLine(ex, 0.17, 1.17, 0.27, 1.17, z);
    },

    bookshelf(g, m) {
      const W = 0.98, HT = 1.78, D = 0.34;
      for (const s of [-1, 1]) box(g, m, 0.04, HT, D, s * (W / 2 - 0.02), HT / 2, 0);
      box(g, m, W, HT, 0.02, 0, HT / 2, -D / 2 + 0.01);
      box(g, m, W + 0.06, 0.05, D + 0.04, 0, HT + 0.02, 0);
      box(g, m, W, 0.34, D, 0, HT - 0.19, 0);
      for (const y0 of [0.07, 0.5, 0.93]) {
        box(g, m, W, 0.04, D, 0, y0 - 0.02, 0);
        let x = -W / 2 + 0.06;
        while (x < W / 2 - 0.1) {
          const w = 0.035 + rnd() * 0.04;
          const hh = 0.26 + rnd() * 0.12;
          if (rnd() < 0.12) {
            x += 0.05; // a gap where a book is out on loan
            continue;
          }
          box(g, m, w, hh, 0.22, x + w / 2, y0 + hh / 2, 0.03 - rnd() * 0.03);
          x += w + 0.004;
        }
      }
    },

    passport(g, m, ex) {
      // lying on the floor, propped up a little so the cover faces you
      const book = new THREE.Group();
      book.position.set(0, 0.12, 0);
      book.rotation.x = -Math.PI / 2 + 0.38;
      g.add(book);
      box(book, m, 0.4, 0.56, 0.04, 0, 0, 0);
      box(book, m, 0.016, 0.56, 0.05, -0.2, 0, 0);
      const from = ex.length, z = 0.026;
      inkRing(ex, 0, 0.03, 0.095, z, 340);
      inkRing(ex, 0, 0.03, 0.06, z, 120);
      inkLine(ex, -0.095, 0.03, 0.095, 0.03, z);
      inkLine(ex, 0, -0.065, 0, 0.125, z);
      inkLine(ex, -0.12, 0.2, 0.12, 0.2, z);
      inkLine(ex, -0.08, -0.16, 0.08, -0.16, z);
      inkLine(ex, -0.05, -0.2, 0.05, -0.2, z);
      onto(ex, from, book);
    },

    door(g, m) {
      for (const s of [-1, 1]) box(g, m, 0.09, 2.2, 0.14, s * 0.56, 1.1, 0);
      box(g, m, 1.21, 0.09, 0.14, 0, 2.2, 0);
      const hinge = new THREE.Group();
      hinge.position.set(-0.5, 0, 0);
      hinge.rotation.y = 0.55;
      put(hinge, new THREE.BoxGeometry(1.0, 2.12, 0.05), m, 0.5, 1.06, 0);
      put(hinge, new THREE.SphereGeometry(0.035, 10, 8), m, 0.9, 1.02, 0.06);
      g.add(hinge);
      // doormat, and the shoes you were told to take off
      box(g, m, 0.9, 0.015, 0.5, 0.1, 0.008, 1.0);
      for (const [x, z, turn] of [[0.86, 0.95, 0.1], [1.0, 1.02, -0.15]]) {
        box(g, m, 0.095, 0.07, 0.26, x, 0.035, z).rotation.y = turn;
        box(g, m, 0.09, 0.06, 0.1, x, 0.095, z - 0.07).rotation.y = turn;
      }
    },

    monstera(g, m) {
      cyl(g, m, 0.21, 0.15, 0.3, 0, 0.15, 0);
      cyl(g, m, 0.225, 0.225, 0.04, 0, 0.3, 0);
      // angle, reach, height, tilt
      const leaves = [[0, 0.34, 1.55, 0.2], [1.1, 0.42, 1.25, -0.3], [2.2, 0.38, 1.5, 0.25], [3.2, 0.46, 1.15, -0.2], [4.3, 0.36, 1.42, 0.3], [5.3, 0.44, 0.98, -0.35], [0.6, 0.2, 1.72, 0.1]];
      for (const [an, reach, y, tilt] of leaves) {
        const cx = Math.cos(an), cz = Math.sin(an);
        const x = cx * reach, z = cz * reach;
        stick(g, m, cx * 0.05, 0.3, cz * 0.05, x * 0.75, y - 0.04, z * 0.75, 0.012);
        const leaf = sph(g, m, 1, x, y, z);
        leaf.scale.set(0.25, 0.018, 0.21);
        leaf.rotation.set(tilt, -an, 0.35);
        const lobe = sph(g, m, 1, x + cx * 0.12, y - 0.03, z + cz * 0.12);
        lobe.scale.set(0.17, 0.016, 0.15);
        lobe.rotation.set(-tilt, -an + 0.5, 0.5);
      }
    },

    ukulele(g, m, ex) {
      // standing on the floor, with a prop behind it
      const y0 = 0.02;
      stick(g, m, 0, 0, -0.32, 0, y0 + 0.62, -0.05, 0.012);
      cyl(g, m, 0.2, 0.2, 0.1, 0, y0 + 0.2, 0, 28).rotation.x = Math.PI / 2;
      cyl(g, m, 0.15, 0.15, 0.1, 0, y0 + 0.47, 0, 28).rotation.x = Math.PI / 2;
      box(g, m, 0.055, 0.5, 0.04, 0, y0 + 0.82, 0.03);
      box(g, m, 0.09, 0.17, 0.035, 0, y0 + 1.15, 0.02);
      for (const [s, y] of [[-1, 1.11], [1, 1.11], [-1, 1.19], [1, 1.19]]) box(g, m, 0.04, 0.028, 0.028, s * 0.062, y0 + y, 0.02);
      box(g, m, 0.13, 0.025, 0.02, 0, y0 + 0.1, 0.058);
      const z = 0.056;
      inkRing(ex, 0, y0 + 0.4, 0.05, z, 500, true);
      for (const x of [-0.018, -0.006, 0.006, 0.018]) inkLine(ex, x, y0 + 0.1, x, y0 + 0.55, z);
      // the stickers: star, smiley, heart, flower
      inkRing(ex, -0.1, y0 + 0.5, 0.028, z, 70);
      inkRing(ex, 0.1, y0 + 0.5, 0.028, z, 70);
      inkRing(ex, -0.11, y0 + 0.16, 0.032, z, 160, true);
      inkRing(ex, 0.11, y0 + 0.16, 0.03, z, 70);
      inkRing(ex, 0.11, y0 + 0.16, 0.01, z, 40, true);
    },

    clock(g, _m, ex) {
      // the year as a grid of circles: a row per month, a circle per day.
      // Days that are gone are filled in, today is the heavy one, the rest are rings.
      const now = new Date(), year = now.getFullYear();
      for (let month = 0; month < 12; month++) {
        const days = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= days; day++) {
          const x = (day - 16) * YEAR_DX, y = YEAR_TOP - month * YEAR_DY;
          const date = new Date(year, month, day);
          const isToday = month === now.getMonth() && day === now.getDate();
          if (isToday) inkRing(ex, x, y, 0.044, 0.02, 220, true);
          else if (date < now) inkRing(ex, x, y, 0.034, 0.02, 70, true);
          else inkRing(ex, x, y, 0.034, 0.02, 26);
        }
      }
    },

    darts(g, _m, ex) {
      // a dartboard on the wall: wires, every other wedge filled in. The darts are yours to throw.
      const Y = BOARD_Y, Z = BOARD_OUT, R = BOARD_R;
      const ring = (r: number, n: number) => inkRing(ex, 0, Y, r, Z, n);
      ring(R, 900);
      ring(R * 0.95, 700);
      ring(R * 0.63, 520);
      ring(R * 0.58, 480);
      ring(R * 0.095, 110);
      inkRing(ex, 0, Y, R * 0.04, Z, 60, true);
      for (let i = 0; i < 20; i++) {
        const a = ((i * 18 + 9) * Math.PI) / 180;
        inkLine(ex, Math.sin(a) * R * 0.095, Y + Math.cos(a) * R * 0.095, Math.sin(a) * R, Y + Math.cos(a) * R, Z);
        if (i % 2) continue;
        // shade this wedge between the bull and the triple ring
        for (let k = 0; k < 150; k++) {
          const an = ((i * 18 - 9 + rnd() * 18) * Math.PI) / 180, rr = R * (0.1 + 0.48 * Math.sqrt(rnd()));
          ex.push(Math.sin(an) * rr, Y + Math.cos(an) * rr, Z);
        }
      }
    },

    celsius(g, m) {
      // crushed, on its side on the floor where it was left
      const geo = new THREE.CylinderGeometry(0.055, 0.055, 0.2, 24, 10);
      const p = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        const k = Math.exp(-Math.pow((y - 0.015) / 0.04, 2)); // the crush
        p.setX(i, p.getX(i) * (1 - 0.42 * k) + 0.013 * Math.sin(y * 46));
        p.setZ(i, p.getZ(i) * (1 - 0.12 * k));
      }
      geo.computeVertexNormals();
      put(g, geo, m, 0, 0.056, 0).rotation.set(0.5, 0, Math.PI / 2 - 0.08);
      put(g, new THREE.TorusGeometry(0.014, 0.004, 6, 12), m, 0.14, 0.03, 0.05).rotation.x = Math.PI / 2;
    },

    bed(g, m) {
      box(g, m, 2.1, 0.2, 1.08, 0, 0.28, 0);
      for (const [x, z] of [[-0.95, -0.46], [0.95, -0.46], [-0.95, 0.46], [0.95, 0.46]]) box(g, m, 0.09, 0.18, 0.09, x, 0.09, z);
      box(g, m, 2.0, 0.17, 1.0, 0, 0.46, 0);
      box(g, m, 0.07, 0.78, 1.08, 1.06, 0.57, 0);
      box(g, m, 0.07, 0.3, 1.08, -1.06, 0.4, 0);
      box(g, m, 0.42, 0.11, 0.7, 0.72, 0.6, 0).rotation.z = 0.08;
      box(g, m, 0.5, 0.03, 1.02, -0.1, 0.555, 0);
      // the two plushies
      for (const [x, z] of [[-0.42, 0.08], [-0.08, -0.06]]) {
        sph(g, m, 0.17, x, 0.68, z).scale.set(1.05, 0.82, 1);
        for (const s of [-1, 1]) {
          put(g, new THREE.ConeGeometry(0.04, 0.08, 8), m, x + s * 0.09, 0.835, z);
          sph(g, m, 0.04, x + s * 0.09, 0.575, z + 0.13);
        }
      }
    },
  };

  const things: Live[] = ROOM.map((t) => {
    const g = new THREE.Group();
    const ex: number[] = [];
    const [x, z] = t.at;
    g.position.set(x, 0, z);
    g.rotation.y = t.rot;
    BUILD[t.id](g, solidMat(), ex);
    if (!t.noShadow) settle(ex, t.r);
    stipple(g, t.dens ?? 2600, t.dot ?? 0.03, ex);
    scene.add(g);

    const d = t.r + (t.stand ?? 1.9); // where you stand to look at it
    return { ...t, ap: { x: x + Math.sin(t.rot) * d, z: z + Math.cos(t.rot) * d } };
  });
  const byId = new Map(things.map((t) => [t.id, t]));

  // the ukulele sings and the bed snores as you get close, like in the my-room game
  const at = (id: ThingId) => byId.get(id)?.at ?? [0, 0];
  const audio = createAudio([
    { at: at("ukulele"), src: "/audio/singing.mp3", max: 0.4 },
    { at: at("bed"), src: "/audio/snore.mp3", max: 0.4 },
  ]);

  /* The room itself is nothing: no floor, no walls, just white. The one thing
     lying in the middle of it is the 8-ball mat. */
  {
    const mat: number[] = [];
    const mx = 0, mz = 2.4;
    for (let i = 0; i < 5200; i++) {
      const an = rnd() * TAU, rr = 1.15 * Math.sqrt(rnd());
      if (rr < 0.5) continue;
      mat.push(mx + Math.cos(an) * rr, 0.005, mz + Math.sin(an) * rr);
    }
    for (let i = 0; i < 1500; i++) {
      const an = rnd() * TAU, rr = 1.15 + gauss() * 0.012;
      mat.push(mx + Math.cos(an) * rr, 0.005, mz + Math.sin(an) * rr);
    }
    for (let i = 0; i < 700; i++) {
      const an = rnd() * TAU, rr = 0.1 + gauss() * 0.012, low = i & 1;
      mat.push(mx + Math.cos(an) * rr, 0.005, mz + (low ? 0.13 : -0.11) + Math.sin(an) * rr * (low ? 1.15 : 1));
    }
    scene.add(dust(mat, 0.036));
  }

  /* your shoes, left where you came in once you have taken them off */
  const shoes = new THREE.Group();
  let shoesDust: THREE.ShaderMaterial;
  {
    const m = solidMat();
    // a pair of sneakers, toes pointing away from you
    for (const [x, z, turn] of [[-0.1, 0, 0.14], [0.1, 0.03, -0.1]]) {
      const shoe = new THREE.Group();
      shoe.position.set(x, 0, z);
      shoe.rotation.y = turn;
      shoes.add(shoe);
      box(shoe, m, 0.105, 0.03, 0.29, 0, 0.015, 0); // sole
      box(shoe, m, 0.1, 0.05, 0.17, 0, 0.055, 0.05); // upper
      sph(shoe, m, 0.05, 0, 0.045, -0.09).scale.set(1, 0.75, 1.25); // toe
      box(shoe, m, 0.1, 0.05, 0.09, 0, 0.1, 0.09); // collar round the ankle
    }
    const ex: number[] = [];
    for (let i = 0; i < 90; i++) ex.push(gauss() * 0.16, Math.abs(gauss()) * 0.008, gauss() * 0.16);
    shoesDust = stipple(shoes, 26000, 0.011, ex).material;
  }
  shoes.visible = false;
  scene.add(shoes);

  figure.position.set(0, 0, START_Z);
  scene.add(figure);

  /* ---------- state ---------- */
  let state: GameState = "title";
  let paused = false;
  let sheetOpen = false;
  /* taking your shoes off: look down at your feet, the shoes slide out from
     under you, look back up. `from` is where you were looking before. */
  let cine: { t: number; from: number } | null = null;
  const LOOK_DOWN = -1.12;
  const ease = (u: number) => {
    const c = Math.max(0, Math.min(1, u));
    return c * c * (3 - 2 * c);
  };
  function placeShoes(k: number) {
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const d = 0.2 + 0.5 * k; // metres in front of your feet
    shoes.position.set(pos.x + fx * d, 0, pos.z + fz * d);
    shoes.rotation.y = yaw;
    shoesDust.uniforms.uOpacity.value = k;
    shoes.visible = k > 0;
  }
  let disposed = false;
  let introT = 0, clockT = 0;
  const pos = { x: 0, z: START_Z };
  let yaw = 0, pitch = 0, bob = 0;
  let keys: Record<string, boolean> = {};
  const joy = { x: 0, y: 0 };
  let focus: Live | null = null; // what the Open prompt names: under the cursor, else nearest in reach
  let near: Live | null = null;
  let auto: { id: ThingId; t: number } | null = null;
  const qA = new THREE.Quaternion(), qB = new THREE.Quaternion();
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(0, EYE, START_Z);
  const tmp = new THREE.Vector3(), tmpCam = new THREE.PerspectiveCamera();
  let W = 1, H = 1;

  const setState = (s: GameState) => {
    state = s;
    opts.onState(s);
  };

  /* When a sheet covers the right side, slide the view so the item you walked
     up to sits in the space that is left. */
  const SHEET_W = 460;
  let shift = 0, shiftY = 0;
  function applyShift() {
    if (shift < 0.5 && shiftY < 0.5) camera.clearViewOffset();
    else camera.setViewOffset(W, H, shift, shiftY, W, H);
  }

  function titlePose() {
    const wide = W / H > 1;
    vA.set(wide ? -1.5 : 0, wide ? 1.3 : 1.45, START_Z + (wide ? 3.8 : 3.7));
    tmpCam.position.copy(vA);
    // wide: stand to the figure's left and aim at the middle of the room, so the
    // room is centred and the figure stands off to the right
    if (wide) tmpCam.lookAt(0, 0.2, -2);
    else tmpCam.lookAt(0, 1.2, START_Z);
    qA.copy(tmpCam.quaternion);
    // where the top of the figure's head is on screen: the words sit on it
    tmpCam.fov = camera.fov;
    tmpCam.aspect = camera.aspect;
    tmpCam.updateProjectionMatrix();
    tmpCam.updateMatrixWorld();
    tmp.set(0, 1.8, START_Z);
    tmp.project(tmpCam);
    app.style.setProperty("--px", `${((tmp.x * 0.5 + 0.5) * W).toFixed(1)}px`);
    app.style.setProperty("--py", `${((-tmp.y * 0.5 + 0.5) * H).toFixed(1)}px`);
    app.classList.toggle("wr-tall", !wide);
  }
  let dartsOn = false; // at the dartboard, throwing
  const baseFov = () => (W / H < 1 ? 74 : 58);
  function resize() {
    W = app.clientWidth || 1;
    H = app.clientHeight || 1;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    if (!dartsOn) camera.fov = baseFov();
    camera.updateProjectionMatrix();
    shared.uScale.value = H * renderer.getPixelRatio() * 0.5;
    shared.uMaxPx.value = 5.5 * renderer.getPixelRatio();
    applyShift();
    titlePose();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(app);
  resize();

  /* ---------- input ---------- */
  function walkTo(id: ThingId) {
    if (state !== "play") return;
    paused = false;
    auto = { id, t: 0 };
  }
  /** Open an item if you are standing at it, otherwise walk over to it first. */
  /* ---------- darts ----------
     Opening the dartboard does not open a sheet. The view zooms in on the board
     and you throw at it: the aim follows the mouse (or your finger), your hand
     is never quite still, and a click lets the dart go. */
  const board = byId.get("darts")!;
  // the board's centre in the room, and the directions across it and out of it
  const bOut = new THREE.Vector3(Math.sin(board.rot), 0, Math.cos(board.rot));
  const bRight = new THREE.Vector3(Math.cos(board.rot), 0, -Math.sin(board.rot)); // your right as you face it
  const bC = new THREE.Vector3(board.at[0], BOARD_Y, board.at[1]).addScaledVector(bOut, BOARD_OUT);
  const bPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(bOut, bC);
  const MM = BOARD_R / BOARD_MM; // metres per millimetre of board
  const AIM_MAX = BOARD_R * 1.5;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitP = new THREE.Vector3();
  let dartHits: DartHit[] = [];
  const aimAt = { u: 0, v: 0 }; // metres across and up from the centre of the board
  const shake = { u: 0, v: 0 };
  let dartsT = 0;
  type Dart = { obj: THREE.Points; from: THREE.Vector3; to: THREE.Vector3; t: number; hit: DartHit };
  let darts: Dart[] = [];
  const dartShape: number[] = [];
  {
    // point at the origin, shaft and flights trailing back toward the thrower
    for (let i = 0; i < 90; i++) dartShape.push(gauss() * 0.003, gauss() * 0.003, rnd() * 0.15);
    for (let i = 0; i < 80; i++) {
      const z = 0.11 + rnd() * 0.05, w = (z - 0.1) * 0.5;
      if (i % 2) dartShape.push((rnd() * 2 - 1) * w, gauss() * 0.002, z);
      else dartShape.push(gauss() * 0.002, (rnd() * 2 - 1) * w, z);
    }
  }
  // The numbers round the board. Dust is too coarse to read as digits, so these
  // are plain text placed over the board while you are zoomed in on it.
  const numbers = document.createElement("div");
  numbers.className = "wr-nums";
  numbers.setAttribute("aria-hidden", "true");
  const numberEls = ORDER.map((n) => {
    const el = document.createElement("span");
    el.textContent = String(n);
    numbers.appendChild(el);
    return el;
  });
  app.appendChild(numbers);
  /** The dust swims (see the shader). Anything drawn over it has to swim the same way. */
  function swim(w: THREE.Vector3) {
    const sway = shared.uTime.value * 0.55;
    w.x += 0.035 * Math.sin(sway + w.y * 2.3 + w.z * 0.6);
    w.z += 0.035 * Math.cos(sway * 0.8 + w.y * 1.9 + w.x * 0.5);
    w.y += 0.012 * Math.sin(sway * 1.3 + w.x * 1.7);
    return w;
  }
  function placeNumbers() {
    numberEls.forEach((el, i) => {
      const a = (i * 18 * Math.PI) / 180;
      hitP.copy(bC).addScaledVector(bRight, Math.sin(a) * BOARD_R * 1.14);
      hitP.y += Math.cos(a) * BOARD_R * 1.14;
      swim(hitP).project(camera);
      el.style.transform = `translate(${((hitP.x * 0.5 + 0.5) * W).toFixed(1)}px,${((-hitP.y * 0.5 + 0.5) * H).toFixed(1)}px) translate(-50%,-50%)`;
    });
  }
  const dartsLeft = () => dartsAllowed(dartHits.map((h) => h.points)) - dartHits.length;
  const sendDarts = () =>
    opts.onDarts(
      dartsOn
        ? { hits: dartHits.slice(), total: dartHits.reduce((sum, h) => sum + h.points, 0), left: dartsLeft() }
        : null,
    );
  function clearDarts() {
    for (const d of darts) {
      scene.remove(d.obj);
      d.obj.geometry.dispose();
      (d.obj.material as THREE.Material).dispose();
    }
    darts = [];
    dartHits = [];
  }
  function enterDarts() {
    if (dartsOn || paused || state !== "play") return;
    dartsOn = true;
    clearDarts();
    aimAt.u = aimAt.v = 0;
    keys = {};
    auto = null;
    app.classList.add("wr-darts-on");
    sendDarts();
  }
  function leaveDarts() {
    if (!dartsOn) return;
    dartsOn = false;
    app.classList.remove("wr-darts-on");
    sendDarts();
  }
  /** Aim at where a point on the screen falls on the board. */
  function aimFromScreen(x: number, y: number) {
    ndc.set((x / W) * 2 - 1, -(y / H) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(bPlane, hitP)) return;
    hitP.sub(bC);
    aimAt.u = Math.max(-AIM_MAX, Math.min(AIM_MAX, hitP.dot(bRight)));
    aimAt.v = Math.max(-AIM_MAX, Math.min(AIM_MAX, hitP.y));
  }
  function throwDart() {
    if (!dartsOn || darts.some((d) => d.t < 1)) return;
    if (dartsLeft() <= 0) {
      // round over: the next click starts a new one
      clearDarts();
      sendDarts();
      return;
    }
    const u = aimAt.u + shake.u, v = aimAt.v + shake.v;
    const to = bC.clone().addScaledVector(bRight, u).add(new THREE.Vector3(0, v, 0));
    const obj = dust(dartShape, 0.012);
    obj.rotation.y = board.rot;
    const from = camera.position.clone().add(new THREE.Vector3(0, -0.28, 0)).addScaledVector(bRight, 0.12);
    obj.position.copy(from);
    scene.add(obj);
    darts.push({ obj, from, to, t: reduced ? 1 : 0, hit: scoreDart(u / MM, v / MM) });
    if (reduced) landDart(darts[darts.length - 1]);
  }
  function landDart(d: Dart) {
    d.obj.position.copy(d.to);
    dartHits.push(d.hit);
    sendDarts();
    // round over: hand the cursor back so a name can be typed for the leaderboard
    if (dartsLeft() <= 0 && locked) document.exitPointerLock();
  }
  /** Each frame while you are at the board: hold the view on it, shake, fly the darts. */
  function playDarts(dt: number) {
    dartsT += dt;
    shake.u = (Math.sin(dartsT * 3.1) * 16 + Math.sin(dartsT * 7.3) * 7) * MM;
    shake.v = (Math.cos(dartsT * 2.3) * 16 + Math.sin(dartsT * 6.1) * 7) * MM;
    // stand square in front of the board and look straight at it
    const sx = board.at[0] + bOut.x * 2.7, sz = board.at[1] + bOut.z * 2.7;
    const k = Math.min(1, dt * 6);
    pos.x += (sx - pos.x) * k;
    pos.z += (sz - pos.z) * k;
    yaw += turnTo(board.rot, yaw) * k;
    pitch += (Math.atan2(BOARD_Y - EYE, 2.7) - pitch) * k;
    for (const d of darts) {
      if (d.t >= 1) continue;
      d.t = Math.min(1, d.t + dt / 0.24);
      d.obj.position.lerpVectors(d.from, d.to, d.t);
      d.obj.position.y += Math.sin(d.t * Math.PI) * 0.06; // a little arc
      if (d.t >= 1) landDart(d);
    }
    if (!locked && mouse.over) aimFromScreen(mouse.x, mouse.y);
    camera.position.set(pos.x, EYE, pos.z);
    camera.rotation.set(pitch, yaw, 0);
    camera.updateMatrixWorld();
    placeNumbers();
    // the aim, shake and all, on screen
    hitP.copy(bC).addScaledVector(bRight, aimAt.u + shake.u);
    hitP.y += aimAt.v + shake.v;
    swim(hitP).project(camera);
    app.style.setProperty("--ax", `${((hitP.x * 0.5 + 0.5) * W).toFixed(1)}px`);
    app.style.setProperty("--ay", `${((-hitP.y * 0.5 + 0.5) * H).toFixed(1)}px`);
  }
  /** Ease the lens: long for the dartboard, normal everywhere else. */
  function zoom(dt: number) {
    const want = dartsOn ? (W / H < 1 ? 40 : 29) : baseFov();
    if (Math.abs(camera.fov - want) < 0.05) return;
    camera.fov += (want - camera.fov) * Math.min(1, dt * 5);
    camera.updateProjectionMatrix();
    // keep the dust the same size on screen as the lens changes
    const t = (f: number) => Math.tan((f * Math.PI) / 360);
    shared.uScale.value = (H * renderer.getPixelRatio() * 0.5 * t(58)) / t(camera.fov) * (t(baseFov()) / t(58));
  }
  /** Shortest way round from angle `b` to angle `a`. */
  const turnTo = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  /* ---------- the closet behind the door ----------
     The door does not open a sheet either. Behind it the room is black and the
     dust is white, and the thing in there is the AI: it got this big from being
     fed too much data. The page lays the contacts and the chat over it. */
  const closet = new THREE.Scene();
  const monster = new THREE.Group();
  closet.add(monster);
  {
    const m = solidMat();
    const ex: number[] = [];
    // tall, thin and too big for the closet: his head is bent over under the rail
    for (const side of [-1, 1]) {
      sph(monster, m, 0.3, side * 0.4, 0.16, 0.35).scale.set(0.8, 0.5, 1.7); // feet
      stick(monster, m, side * 0.4, 0.2, 0, side * 0.42, 2.4, 0.1, 0.19); // shins
      stick(monster, m, side * 0.42, 2.4, 0.1, side * 0.3, 4.6, 0, 0.24); // thighs
      sph(monster, m, 0.2, 0.05 + side * 0.72, 7.25, 0); // narrow shoulders
      // arms that hang to his knees, the near one a little forward
      const f = side < 0 ? 0.35 : 0.1;
      stick(monster, m, 0.05 + side * 0.76, 7.25, 0, side * 0.98, 4.9, f * 0.5, 0.14);
      stick(monster, m, side * 0.98, 4.9, f * 0.5, side * 0.92, 2.9, f, 0.11);
      for (let k = 0; k < 4; k++) {
        const fx = side * 0.92 + (k - 1.5) * 0.085;
        stick(monster, m, fx, 2.95, f, fx + (k - 1.5) * 0.05, 2.0 + Math.abs(k - 1.5) * 0.12, f + 0.08, 0.035);
      }
    }
    sph(monster, m, 0.5, 0, 4.7, 0).scale.set(1.05, 0.85, 0.75); // hips
    stick(monster, m, 0, 4.7, 0, 0.06, 6.4, 0, 0.4); // a long waist
    sph(monster, m, 0.55, 0.05, 6.75, 0).scale.set(1.25, 1.25, 0.7); // chest
    stick(monster, m, 0.05, 7.3, 0, -0.34, 8.05, 0.1, 0.17); // the neck, bent
    const HX = -0.82, HY = 8.38, TILT = 0.9;
    const head = sph(monster, m, 0.52, HX, HY, 0.15);
    head.scale.set(0.85, 1.2, 0.9);
    head.rotation.z = TILT;
    // two small eyes, packed solid so they read as lit; nothing else on the face
    for (const side of [-1, 1]) {
      const cx = HX - Math.sin(TILT) * 0.12 + side * Math.cos(TILT) * 0.2;
      const cy = HY + Math.cos(TILT) * 0.12 + side * Math.sin(TILT) * 0.2;
      for (let i = 0; i < 420; i++) {
        const an = rnd() * TAU, rr = 0.075 * Math.sqrt(rnd());
        ex.push(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr, 0.66);
      }
    }
    // the data he is still being fed, drifting in from all round
    for (let i = 0; i < 2600; i++) {
      const an = rnd() * TAU, far = 2 + rnd() * rnd() * 9, y = 0.4 + rnd() * 8.5;
      ex.push(Math.cos(an) * far * 1.25, y, Math.sin(an) * far - 0.5);
    }
    // the rail and hangers over his head: this is a closet, after all
    for (let i = 0; i < 1800; i++) ex.push(-14 + rnd() * 28, 9.1 + gauss() * 0.02, -1.6);
    for (const hx of [-10.5, -9.2, -5.6, -4.3, 3.9, 5.2, 6.1]) {
      for (let k = 0; k < 260; k++) {
        const u = rnd(), sideK = rnd() < 0.5 ? -1 : 1;
        if (rnd() < 0.3) ex.push(hx + (rnd() * 2 - 1) * 0.5, 8.45 + gauss() * 0.01, -1.6);
        else ex.push(hx + sideK * 0.5 * u, 9.0 - 0.55 * u, -1.6);
      }
    }
    const pts = stipple(monster, 2600, 0.045, ex);
    (pts.material as THREE.ShaderMaterial).uniforms.uColor.value.set(0xf8f8f7);
  }
  let closetOn = false;
  let closetT = 0;
  function enterCloset() {
    if (closetOn || paused || state !== "play") return;
    leaveDarts();
    closetOn = true;
    closetT = 0;
    keys = {};
    auto = null;
    mouse.down = false;
    renderer.setClearColor(0x000000, 1);
    if (locked) document.exitPointerLock(); // the contacts and the chat need a cursor
    opts.onCloset(true);
  }
  function leaveCloset() {
    if (!closetOn) return;
    closetOn = false;
    renderer.setClearColor(PAPER, 1);
    opts.onCloset(false);
  }
  /** Each frame in the closet: stand at his feet and look up; he breathes. */
  function playCloset(dt: number) {
    closetT += dt;
    const tall = W / H < 1;
    const back = tall ? 14 : 10.5;
    // wide screens: he stands off to one side, clear of the chat
    monster.position.x = tall ? 0 : 4.2;
    const px = mouse.over ? mouse.nx : 0, py = mouse.over ? mouse.ny : 0;
    camera.position.set(px * 0.5, EYE, back);
    camera.lookAt(px * -0.4, (tall ? 3.4 : 4.9) - py * 0.35, 0);
    if (!reduced) {
      const breath = Math.sin(closetT * 1.1);
      monster.scale.set(1 + breath * 0.01, 1 + breath * 0.006, 1 + breath * 0.01);
      monster.rotation.y = Math.sin(closetT * 0.3) * 0.04;
    }
  }
  const open = (id: ThingId) => (id === "darts" ? enterDarts() : id === "door" ? enterCloset() : opts.onOpen(id));

  function activate(t: Live) {
    if (state !== "play" || paused) return;
    if (Math.hypot(pos.x - t.at[0], pos.z - t.at[1]) - t.r < REACH) open(t.id);
    else walkTo(t.id);
  }
  const angDiff = (a: number, b: number) => {
    let d = (a - b + Math.PI) % TAU;
    if (d < 0) d += TAU;
    return d - Math.PI;
  };
  const keyName = (e: KeyboardEvent) => (e.key.length === 1 ? e.key.toLowerCase() : e.key);

  const typing = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
  const onKeyDown = (e: KeyboardEvent) => {
    if (state !== "play" || paused || typing(e)) return;
    const k = keyName(e);
    if (closetOn) {
      // walking is how you leave
      if (/^(w|a|s|d|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/.test(k)) leaveCloset();
      return;
    }
    if (dartsOn) {
      if (k === " " || k === "Enter") {
        throwDart();
        e.preventDefault();
        return;
      }
      leaveDarts(); // any other key, walking included, steps away from the board
    }
    const n = NAV[Number(k) - 1];
    if (n) {
      walkTo(n.id);
      return;
    }
    if (k === "e" || k === "x") {
      if (focus) activate(focus);
      return;
    }
    if (/^(w|a|s|d|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/.test(k)) {
      keys[k] = true;
      auto = null;
      if (k.startsWith("Arrow")) e.preventDefault();
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys[keyName(e)] = false;
  };
  const onBlur = () => {
    keys = {};
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  /* Mouse: the mouse IS the centre of the view. Clicking the room captures it
     (pointer lock), after which moving it looks around, the crosshair in the
     middle is what you are pointing at, clicking an item walks you to it,
     holding the button walks forward and the wheel steps. Esc lets go.
     If the browser refuses to capture the mouse, the view follows the cursor
     toward the screen edges instead. Touch keeps the thumb stick below. */
  let locked = false;
  let everLocked = false;
  const CEILING = 0.62; // radians: how far up you can look
  const PUSH_FREE = 0.3; // radians of pushing past the ceiling before the mouse is freed
  let pushedUp = 0;
  let lockFailed = typeof canvas.requestPointerLock !== "function";
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const lock = () => {
    if (locked || lockFailed || !finePointer) return;
    try {
      const r = canvas.requestPointerLock() as unknown as Promise<void> | undefined;
      r?.catch?.(() => {});
    } catch {
      lockFailed = true;
    }
  };
  const onLockChange = () => {
    locked = document.pointerLockElement === canvas;
    if (locked) everLocked = true;
    mouse.down = false;
    app.classList.toggle("wr-locked", locked);
    opts.onLock(locked);
  };
  const onLockError = () => {
    // refused before it ever worked (an embedded frame, say): fall back for good.
    // After it has worked once, a refusal is just the browser's cool-down.
    if (!everLocked) lockFailed = true;
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!locked || state !== "play" || paused || auto || cine) return;
    if (dartsOn) {
      // at the board the mouse moves the aim, not the view
      aimAt.u = Math.max(-AIM_MAX, Math.min(AIM_MAX, aimAt.u + e.movementX * 0.0009));
      aimAt.v = Math.max(-AIM_MAX, Math.min(AIM_MAX, aimAt.v - e.movementY * 0.0009));
      return;
    }
    yaw -= e.movementX * 0.0022;
    const want = pitch - e.movementY * 0.0022;
    pitch = Math.max(-1.2, Math.min(CEILING, want));
    // The ceiling is as far up as you can look. Keep pushing against it and the
    // mouse is let go, so it can reach the links at the top. While it is free
    // the view follows the cursor (see play()), so you are never stuck.
    if (want > CEILING) {
      pushedUp += want - CEILING;
      if (pushedUp > PUSH_FREE) {
        pushedUp = 0;
        document.exitPointerLock();
      }
    } else if (e.movementY > 0) pushedUp = 0;
  };
  document.addEventListener("pointerlockchange", onLockChange);
  document.addEventListener("pointerlockerror", onLockError);
  document.addEventListener("mousemove", onMouseMove);
  /** Where the mouse is pointing: dead centre when captured. */
  const aim = () => (locked ? { x: W / 2, y: H / 2 } : { x: mouse.x, y: mouse.y });

  const mouse = { over: false, x: 0, y: 0, nx: 0, ny: 0, down: false, held: 0, downX: 0, downY: 0, dragged: false };
  let wheelPush = 0;
  let hover: Live | null = null;
  let lastCx = -1, lastCy = -1;
  const DEAD = 0.66; // how far toward a side the free cursor has to be before the view turns

  const center = new THREE.Vector3();
  /* Where an item is on screen: its centre and half its size, in pixels. */
  const rect = { x: 0, y: 0, rx: 0, ry: 0, dist: 0 };
  function onScreen(t: Live): boolean {
    const k = H / 2 / Math.tan((camera.fov * Math.PI) / 360);
    center.set(t.at[0], t.look ?? Math.max(0.15, t.h * 0.5), t.at[1]);
    rect.dist = center.distanceTo(camera.position);
    center.project(camera);
    if (center.z > 1) return false;
    rect.x = (center.x * 0.5 + 0.5) * W;
    rect.y = (-center.y * 0.5 + 0.5) * H;
    rect.rx = Math.max(30, ((t.r + 0.15) * k) / rect.dist);
    rect.ry = Math.max(30, ((t.h * 0.55 + 0.15) * k) / rect.dist);
    return true;
  }
  /** The item under a point on screen. */
  function pick(x: number, y: number): Live | null {
    let best: Live | null = null, bestDepth = Infinity;
    for (const t of things) {
      if (onScreen(t) && Math.abs(x - rect.x) < rect.rx && Math.abs(y - rect.y) < rect.ry && rect.dist < bestDepth) {
        best = t;
        bestDepth = rect.dist;
      }
    }
    return best;
  }
  function placePrompt() {
    // the Open prompt rides on the cursor: dead centre when the mouse is captured
    const at = aim();
    const pointing = locked || mouse.over;
    const cx = Math.round(pointing ? at.x : W / 2), cy = Math.round(pointing ? at.y : H / 2);
    if (cx !== lastCx || cy !== lastCy) {
      lastCx = cx;
      lastCy = cy;
      app.style.setProperty("--cx", `${cx}px`);
      app.style.setProperty("--cy", `${cy}px`);
    }
  }
  const trackMouse = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.nx = (mouse.x / r.width) * 2 - 1;
    mouse.ny = (mouse.y / r.height) * 2 - 1;
    mouse.over = true;
  };
  const onPointerLeave = () => {
    mouse.over = false;
    mouse.down = false;
  };
  const onWheel = (e: WheelEvent) => {
    if (state !== "play" || paused || closetOn || dartsOn) return;
    e.preventDefault();
    auto = null;
    wheelPush = Math.max(-1.5, Math.min(1.5, wheelPush - e.deltaY * 0.004));
  };

  type Ptr = { x: number; y: number; ox: number; oy: number; stick: boolean };
  const ptrs = new Map<number, Ptr>();
  let stickId: number | null = null;
  const knob = opts.stick.firstElementChild as HTMLElement | null;

  const onPointerDown = (e: PointerEvent) => {
    if (state !== "play" || paused || closetOn) return;
    if (dartsOn) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      // aim where you pressed (unless the mouse is captured, then it is already aimed)
      if (!locked) {
        const r = canvas.getBoundingClientRect();
        aimFromScreen(e.clientX - r.left, e.clientY - r.top);
        if (e.pointerType === "mouse") trackMouse(e);
      }
      throwDart();
      return;
    }
    if (e.pointerType === "mouse") {
      if (e.button !== 0) return;
      if (!locked && !lockFailed) {
        lock(); // first click just takes the mouse
        return;
      }
      if (!locked) trackMouse(e);
      mouse.down = true;
      mouse.held = 0;
      mouse.dragged = false;
      mouse.downX = mouse.x;
      mouse.downY = mouse.y;
      return;
    }
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* capture is a nicety */
    }
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    // touch: left side of the screen is the move stick, the rest looks around
    const isStick = e.pointerType === "touch" && stickId === null && x < r.width * 0.45;
    ptrs.set(e.pointerId, { x, y, ox: x, oy: y, stick: isStick });
    if (isStick) {
      stickId = e.pointerId;
      opts.stick.hidden = false;
      opts.stick.style.transform = `translate(${x}px,${y}px)`;
      if (knob) knob.style.transform = "";
    }
    auto = null;
  };
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "mouse") {
      if (locked) return;
      trackMouse(e);
      if (mouse.down && Math.hypot(mouse.x - mouse.downX, mouse.y - mouse.downY) > 8) mouse.dragged = true;
      return;
    }
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (p.stick) {
      let dx = (x - p.ox) / 44, dy = (y - p.oy) / 44;
      const l = Math.hypot(dx, dy);
      if (l > 1) {
        dx /= l;
        dy /= l;
      }
      joy.x = dx;
      joy.y = dy;
      if (knob) knob.style.transform = `translate(${dx * 30}px,${dy * 30}px)`;
    } else {
      yaw -= (x - p.x) * 0.0045;
      pitch = Math.max(-0.7, Math.min(CEILING, pitch - (y - p.y) * 0.0045));
      p.x = x;
      p.y = y;
    }
  };
  const onPointerEnd = (e: PointerEvent) => {
    if (dartsOn || closetOn) return;
    if (e.pointerType === "mouse") {
      // a quick click (not a hold) on an item walks you to it
      if (mouse.down && mouse.held < 0.3 && !mouse.dragged && state === "play" && !paused) {
        const at = aim();
        const t = pick(at.x, at.y);
        if (t) activate(t);
      }
      mouse.down = false;
      return;
    }
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    if (p.stick) {
      stickId = null;
      joy.x = joy.y = 0;
      opts.stick.hidden = true;
    }
    ptrs.delete(e.pointerId);
  };
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerEnd);
  canvas.addEventListener("pointercancel", onPointerEnd);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  /* ---------- loop ---------- */

  function collide() {
    for (const t of things) {
      const dx = pos.x - t.at[0], dz = pos.z - t.at[1];
      const d = Math.hypot(dx, dz), min = t.r + 0.35;
      if (d < min && d > 1e-4) {
        pos.x = t.at[0] + (dx / d) * min;
        pos.z = t.at[1] + (dz / d) * min;
      }
    }
    pos.x = Math.max(-XH + 0.6, Math.min(XH - 0.6, pos.x));
    pos.z = Math.max(ZMIN + 0.6, Math.min(ZMAX - 0.6, pos.z));
  }

  function play(dt: number) {
    let moving = 0;
    zoom(dt);
    if (closetOn) {
      playCloset(dt);
      return;
    }
    if (dartsOn && !paused) {
      playDarts(dt);
    } else if (cine) {
      cine.t += dt;
      const t = cine.t;
      if (t < 1.9) pitch = cine.from + (LOOK_DOWN - cine.from) * ease(t / 0.7);
      else pitch = LOOK_DOWN * (1 - ease((t - 1.9) / 0.7));
      placeShoes(ease((t - 0.55) / 0.9));
      if (t >= 2.6) cine = null;
    } else if (!paused) {
      const target = auto ? byId.get(auto.id) : undefined;
      if (auto && target) {
        // walk to the spot in front of the object, then turn to face it
        const ax = target.ap.x - pos.x, az = target.ap.z - pos.z, d = Math.hypot(ax, az);
        const faceThing = Math.atan2(-(target.at[0] - pos.x), -(target.at[1] - pos.z));
        let want = faceThing;
        if (d > 0.12) {
          const step = Math.min(d, SPEED * 1.2 * dt);
          pos.x += (ax / d) * step;
          pos.z += (az / d) * step;
          moving = 1;
          if (d > 1.3) want = Math.atan2(-ax, -az);
        }
        yaw += angDiff(want, yaw) * Math.min(1, dt * 5);
        const lookY = target.look ?? target.h * 0.55;
        const wantPitch = d > 2.5 ? 0 : Math.max(-0.7, Math.atan2(lookY - EYE, Math.hypot(target.at[0] - pos.x, target.at[1] - pos.z)));
        pitch += (wantPitch - pitch) * Math.min(1, dt * 4);
        auto.t += dt;
        if ((d <= 0.12 && Math.abs(angDiff(faceThing, yaw)) < 0.07) || auto.t > 12) {
          const id = auto.id;
          auto = null;
          open(id);
        }
      } else {
        if (mouse.down) {
          mouse.held += dt;
          if (mouse.held > 0.3) auto = null;
        }
        // a free cursor still steers: toward the sides turns you, up and down tilts
        if (mouse.over && !locked) {
          const ax = Math.sign(mouse.nx) * Math.max(0, Math.abs(mouse.nx) - DEAD) / (1 - DEAD);
          yaw -= ax * Math.abs(ax) * 2.0 * dt;
          pitch += (Math.min(CEILING, -mouse.ny * 0.5) - pitch) * Math.min(1, dt * 4);
        }
        const walking = mouse.down && mouse.held > 0.3 ? 1 : 0;
        const push = wheelPush * Math.min(1, dt * 8);
        wheelPush -= push;
        let f = walking + push / (SPEED * dt || 1) + (keys.w || keys.ArrowUp ? 1 : 0) - (keys.s || keys.ArrowDown ? 1 : 0) - joy.y;
        let s = (keys.d ? 1 : 0) - (keys.a ? 1 : 0) + joy.x;
        yaw += ((keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0)) * 1.9 * dt;
        let l = Math.hypot(f, s);
        if (l > 0.05) {
          if (l > 1.6) {
            f = (f / l) * 1.6;
            s = (s / l) * 1.6;
          }
          l = Math.min(1, l);
          const sn = Math.sin(yaw), cs = Math.cos(yaw);
          pos.x += (-sn * f + cs * s) * SPEED * dt;
          pos.z += (-cs * f - sn * s) * SPEED * dt;
          moving = l;
        }
      }
      collide();
    }
    audio.update(pos.x, pos.z, moving, dt);
    if (moving && !reduced) bob += dt * 9 * moving;
    camera.position.set(pos.x, EYE + (reduced ? 0 : Math.sin(bob) * 0.022), pos.z);
    camera.rotation.set(pitch, yaw, 0);

    // nearest object in reach
    let best = things[0], bestD = Infinity;
    for (const t of things) {
      const d = Math.hypot(pos.x - t.at[0], pos.z - t.at[1]) - t.r;
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    near = bestD < REACH ? best : null;
  }

  let raf = 0;
  let last = performance.now();
  function frame(now: number) {
    if (disposed) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clockT += dt;
    if (!reduced) shared.uTime.value = clockT;
    if (state === "title") {
      if (!reduced) figure.rotation.y = Math.sin(clockT * 0.45) * 0.4;
      camera.position.copy(vA);
      camera.quaternion.copy(qA);
    } else if (state === "intro") {
      // push the camera into the figure's head, fading the figure out as we arrive
      introT += dt / (reduced ? 0.01 : 2.6);
      const u = Math.min(1, introT);
      const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      camera.position.lerpVectors(vA, vB, e);
      camera.quaternion.slerpQuaternions(qA, qB, e);
      const fade = 1 - Math.max(0, Math.min(1, (e - 0.45) / 0.4));
      figureDust.uniforms.uOpacity.value = fade;
      if (u >= 1) {
        figure.visible = false;
        yaw = 0;
        pitch = 0;
        pos.x = 0;
        pos.z = START_Z;
        setState("play");
        canvas.focus();
      }
    } else {
      play(dt);
      if (!paused) {
        const at = aim();
        const h = dartsOn || closetOn ? null : mouse.down ? hover : locked || mouse.over ? pick(at.x, at.y) : null;
        if (h !== hover) {
          hover = h;
          canvas.style.cursor = h && !locked ? "pointer" : "";
          app.classList.toggle("wr-aim", !!h);
        }
        const f = dartsOn || closetOn ? null : hover ?? near;
        if (f !== focus) {
          focus = f;
          opts.onFocus(f ? f.id : null);
        }
        placePrompt();
      }
      // side sheet on wide screens, bottom sheet (72% tall) on narrow ones
      const want = sheetOpen && W > 640 ? Math.min(SHEET_W, W) / 2 : 0;
      const wantY = sheetOpen && W <= 640 ? H * 0.34 : 0;
      if (Math.abs(want - shift) > 0.5 || Math.abs(wantY - shiftY) > 0.5) {
        const k = reduced ? 1 : Math.min(1, dt * 7);
        shift += (want - shift) * k;
        shiftY += (wantY - shiftY) * k;
        if (Math.abs(want - shift) <= 0.5) shift = want;
        if (Math.abs(wantY - shiftY) <= 0.5) shiftY = wantY;
        applyShift();
      }
    }
    renderer.render(closetOn ? closet : scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    start() {
      if (state !== "title") return;
      audio.unlock(); // we are inside the Start click, so the browser allows it
      lock();
      introT = 0;
      setState("intro");
    },
    walkTo(id) {
      leaveDarts();
      leaveCloset();
      walkTo(id);
    },
    leaveDarts,
    leaveCloset,
    say() {
      audio.say();
    },
    takeShoesOff() {
      if (reduced) placeShoes(1);
      else cine = { t: 0, from: pitch };
    },
    setPaused(p, sheet = p) {
      paused = p;
      sheetOpen = p && sheet;
      // hand the cursor back for reading a sheet, take it again afterwards
      if (p && locked) document.exitPointerLock();
      if (!p && state === "play" && everLocked) lock();
      if (p) {
        keys = {};
        joy.x = joy.y = 0;
        mouse.down = false;
        wheelPush = 0;
      }
    },
    setMuted(m) {
      audio.setMuted(m);
    },
    dispose() {
      disposed = true;
      numbers.remove();
      audio.dispose();
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerEnd);
      canvas.removeEventListener("pointercancel", onPointerEnd);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("pointerlockerror", onLockError);
      document.removeEventListener("mousemove", onMouseMove);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      app.classList.remove("wr-locked", "wr-aim");
      scene.traverse((o) => {
        const m = o as THREE.Mesh | THREE.Points;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else if (mat) mat.dispose();
      });
      renderer.dispose();
    },
  };
}
