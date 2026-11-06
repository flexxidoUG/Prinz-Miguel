import { kf, env, osc, pulse, win, lerp, E, warp, type Key } from './anim';
import { P, px, star } from './Stage';

/** Design-time anchors measured from the supplied MP3 (Whisper transcription with word timestamps). */
const DESIGN = [0, 21.4, 23.4, 26.6, 27.3, 30.1, 33.2, 34.5, 35.64];
export const SHOW_END = 39; // design time after which the stage is static
export type Cues = { miguel: number; paginnen: number; laura: number; louisa: number; konfetti: number; dreimal: number; alaaf: number };
export type ShowEvent = { kind: 'test' | 'alaaf' | 'alaaf2'; x: number; y: number; angle: number };

type St = {
  x: number; y: number; f: number; s: number; lean: number; bob: number; legL: number; legR: number;
  armF: number; armB: number; armFs: number; pole: number; head: number; blink: number; mouth: number;
  sway: number; vis: number; shadow: number;
};
const DEG = Math.PI / 180;
const base = (x: number, y: number, f: number): St => ({
  x, y, f, s: 1, lean: 0, bob: 0, legL: 0, legR: 0, armF: 6, armB: -6, armFs: 1, pole: 200, head: 0, blink: 0,
  mouth: 0, sway: 0, vis: 1, shadow: 1,
});
const sortK = (k: Key[]) => k.sort((a, b) => a[0] - b[0]);

export function toWorld(st: St, lx: number, ly: number): [number, number] {
  const L = st.lean * DEG, c = Math.cos(L), s = Math.sin(L);
  return [st.x + st.f * st.s * (lx * c - ly * s), st.y + st.s * (lx * s + ly * c)];
}
function hand(st: St, r: number, front = true): [number, number] {
  const th = (front ? st.armF : st.armB) * DEG, sx = front ? 14 : -14;
  const rr = front ? r * st.armFs : r;
  return toWorld(st, sx - rr * Math.sin(th), -94 + st.bob + rr * Math.cos(th));
}
/** Local arm angle that points a helper's arm at a world target. */
function aimAt(st: St, tx: number, ty: number) {
  const [sx, sy] = toWorld(st, 14, -94);
  return Math.atan2(-st.f * (tx - sx), ty - sy) / DEG;
}
function walk(st: St, t: number, a: number, b: number, rate = 2.4, arms = true) {
  const e = env(t, a, b, 0.12);
  if (!e) return;
  const s = Math.sin((t - a) * rate * Math.PI * 2);
  st.legL += 26 * s * e;
  st.legR -= 26 * s * e;
  st.bob -= Math.abs(Math.cos((t - a) * rate * Math.PI * 2)) * 4 * e;
  st.sway += 6 * s * e;
  if (arms) { st.armB += 22 * s * e; st.armF -= 22 * s * e; }
}
function idle(st: St, t: number, seed: number) {
  st.bob += Math.sin(t * 2.3 + seed) * 0.9;
  st.sway += Math.sin(t * 1.7 + seed) * 3;
  st.blink = (t * 0.29 + seed * 0.13) % 1 < 0.035 ? 1 : 0;
  st.head += Math.sin(t * 0.9 + seed) * 2;
}
// Group photo, left → right: Louisa · Miguel I. · Laura
const FACES = { louisa: px(205, 340), miguel: px(510, 320), laura: px(805, 345) } as const;
const K = P.w / 420; // scale of the portrait relative to the first layout

/** Shared reactions to the announcer. `freeF` = front arm is not holding a tool. */
function react(st: St, t: number, freeF: boolean, jumpable = true, point = true) {
  const w = env(t, 16.85, 17.95, 0.18); // "Seid ihr bereit?" → wave to the audience
  if (w) { st.armB = lerp(st.armB, -165 + Math.sin(t * 15) * 18, w); st.head = lerp(st.head, -6, w); st.mouth = Math.max(st.mouth, w * 0.6); }
  const m = env(t, 21.45, 22.8, 0.18); // "Kinderprinz Miguel der Erste" → joy
  if (m) {
    st.armB = lerp(st.armB, -168, m);
    if (freeF) st.armF = lerp(st.armF, -168, m);
    st.mouth = Math.max(st.mouth, m);
    if (jumpable) st.y -= 22 * Math.sin(win(t, 21.5, 21.95) * Math.PI);
  }
  for (const [name, a, b] of [['laura', 26.62, 27.25], ['louisa', 27.32, 28.2]] as const) {
    const p = point ? env(t, a, b, 0.12) : 0;
    if (!p) continue;
    const [fx, fy] = FACES[name];
    const [sx, sy] = toWorld(st, -14, -94);
    st.armB = lerp(st.armB, Math.atan2(-st.f * (fx - sx), fy - sy) / DEG, p);
    st.head = lerp(st.head, fy < sy ? -10 : 6, p);
  }
  for (const c of [33.2, 33.7, 34.2]) { // "Drei-mal kräf-tig"
    const p = pulse(t, c + 0.06, 0.1, 0.3);
    st.armB = lerp(st.armB, -178, p);
    if (freeF) st.armF = lerp(st.armF, -178, p);
    st.bob -= 4 * p;
  }
  const al = env(t, 34.5, 35.9, 0.1); // "Alaaf!"
  if (al) {
    st.armB = lerp(st.armB, -160 + Math.sin(t * 18) * 10, al);
    if (freeF) st.armF = lerp(st.armF, -160 - Math.sin(t * 18) * 10, al);
    st.mouth = Math.max(st.mouth, al);
    if (jumpable) st.y -= 34 * Math.abs(Math.sin(win(t, 34.5, 35.9) * Math.PI * 2));
  }
  const bow = env(t, 36.0, 37.2, 0.3);
  if (bow) { st.lean = lerp(st.lean, 32, bow); st.armB = lerp(st.armB, 20, bow); st.head += 10 * bow; }
}

// ---------- paint sweeps: arm angle and reveal stroke share the same parameterisation ----------
type Sweep = { t0: number; t1: number; a1: number; a2: number; r: number; w: number };
const A_TIP = 120; // painter: arm + brush length (local units)
const LADDER = { x: 250, y: 900, ang: 10.4 };
const LDIR = [Math.sin(LADDER.ang * DEG), -Math.cos(LADDER.ang * DEG)];
const sw = (t0: number, t1: number, a1: number, a2: number, r: number, w: number): Sweep => ({ t0, t1, a1, a2, r, w });
const A_SW: Sweep[] = [
  sw(5.0, 5.85, -150, -40, 1.0, 74), sw(5.95, 6.8, -40, -150, 0.78, 70), sw(6.9, 7.75, -150, -45, 1.22, 74),
  sw(10.75, 11.6, -160, -40, 1.05, 74), sw(11.7, 12.6, -40, -155, 1.3, 74), sw(12.7, 13.6, -155, -50, 0.8, 70),
  sw(18.75, 19.6, -165, -35, 1.1, 76), sw(19.7, 20.6, -35, -160, 1.4, 76),
  sw(23.5, 24.4, -170, -40, 0.85, 72), sw(24.5, 25.4, -40, -165, 1.6, 80),
  sw(28.5, 29.4, -150, -30, 1.8, 84), sw(29.5, 30.4, -30, -140, 2.0, 84), sw(31.0, 31.9, -120, -20, 1.9, 84),
];
const B_SW: Sweep[] = [
  sw(5.4, 6.3, -165, -105, 230, 92), sw(6.4, 7.3, -105, -165, 290, 92),
  sw(18.1, 19.0, -172, -118, 340, 96), sw(19.1, 20.0, -118, -172, 395, 96), sw(20.1, 21.0, -175, -135, 450, 96),
  sw(23.5, 24.4, -150, -110, 420, 96), sw(24.5, 25.4, -110, -160, 360, 96),
  sw(28.5, 29.4, -178, -140, 520, 100), sw(29.5, 30.4, -140, -100, 480, 100), sw(31.0, 31.9, -100, -150, 330, 100),
];
const sweepKeys = (s: Sweep[], v: (x: Sweep) => [number, number]) =>
  s.flatMap((x) => [[x.t0, v(x)[0]], [x.t1, v(x)[1]]] as Key[]);

// ---------- helpers ----------
const ladderH = (t: number) => kf(t, [[3.5, 0], [4.8, 180], [10.0, 180], [10.7, 330], [18.0, 330], [18.7, 460]]);
const A_ARM = sortK([[0, -170], [2.6, -170], [3.3, -150], [4.8, -120], ...sweepKeys(A_SW, (x) => [x.a1, x.a2])]);
const A_SCALE = sortK([[0, 1], [4.9, 1], ...sweepKeys(A_SW, (x) => [x.r, x.r]), [32.2, 1], [33, 1]]);

function stA(t: number): St {
  const st = base(0, 900, 1);
  if (t < 3.3) st.x = kf(t, [[0.3, -140], [2.6, 215, 'l'], [3.3, 215]]);
  else if (t < 3.5) st.x = lerp(215, LADDER.x, E.io(win(t, 3.3, 3.5)));
  else {
    const h = ladderH(t);
    st.x = LADDER.x + h * LDIR[0];
    st.y = LADDER.y + h * LDIR[1];
    st.shadow = 0;
  }
  walk(st, t, 0.3, 2.6, 2.4, false);
  for (const [a, b] of [[3.5, 4.8], [10.0, 10.7], [18.0, 18.7]]) {
    const e = env(t, a, b, 0.1);
    st.legL += osc(t, a, b, 18, 0.33);
    st.legR -= osc(t, a, b, 18, 0.33);
    st.armB = lerp(st.armB, -150 + osc(t, a, b, 20, 0.33), e);
  }
  st.armF = kf(t, A_ARM);
  st.armFs = kf(t, A_SCALE);
  if (t < 3.3) st.armB = -170 + (t < 2.6 ? 0 : 20 * win(t, 2.6, 3.3));
  idle(st, t, 1);
  st.head += -14 * env(t, 7.9, 10.1, 0.3); // watches the frame come down
  st.lean += osc(t, 10.15, 11.0, 7 * (1 - win(t, 10.15, 11)), 0.28); // ladder wobble when the frame lands
  st.head += 14 * env(t, 14.55, 16.4, 0.2);
  if (env(t, 14.6, 16.2)) { st.armB = lerp(st.armB, -150, env(t, 14.6, 16.2, 0.2)); st.mouth = env(t, 14.6, 16.2, 0.2); }
  react(st, t, false, false);
  return st;
}

const B_ARM = sortK([[0, 150], [3.6, 150], [4.3, -140], ...sweepKeys(B_SW, (x) => [x.a1, x.a2]), [10.6, -148], [14.0, -148], [17.9, -150], [32.2, -120], [33, -110]]);
const B_POLE = sortK([[0, 200], [4.3, 200], ...sweepKeys(B_SW, (x) => [x.r, x.r]), [10.6, 115], [14.0, 115], [17.9, 260], [32.2, 220], [33, 200]]);

function stB(t: number): St {
  const st = base(kf(t, [[1.2, 1150], [3.6, 800, 'l']]), 900, -1);
  walk(st, t, 1.2, 3.6, 2.3, false);
  st.armF = kf(t, B_ARM) + osc(t, 10.7, 14.0, 10, 0.5);
  st.pole = kf(t, B_POLE) + osc(t, 10.7, 14.0, 12, 0.5, Math.PI / 2);
  st.armB = -10 + osc(t, 1.2, 3.6, 18, 0.42);
  idle(st, t, 2.2);
  const duck = env(t, 9.5, 10.6, 0.2); // the frame lands right next to her
  if (duck) { st.lean = lerp(st.lean, -10, duck); st.armB = lerp(st.armB, -175, duck); st.mouth = duck; st.y += 6 * duck; }
  st.head -= 12 * env(t, 7.9, 9.5, 0.3);
  const laugh = env(t, 14.7, 16.4, 0.2);
  if (laugh) { st.armB = lerp(st.armB, -150, laugh); st.bob += Math.abs(Math.sin(t * 20)) * 3 * laugh; st.mouth = laugh; st.head += 8 * laugh; }
  const sh = env(t, 32.0, 33.1, 0.15); // hip sway before the countdown
  if (sh) { st.lean += Math.sin(t * 7) * 8 * sh; st.armB = lerp(st.armB, -130 + Math.sin(t * 7) * 25, sh); }
  react(st, t, false);
  return st;
}

const LAMP_X = 135;
function stC(t: number): St {
  const x = kf(t, [[0.2, -120], [1.3, 85, 'l'], [28.4, 85], [29.1, 24], [29.2, 24]]);
  const st = base(x, 900, t > 28.4 && t < 29.15 ? -1 : 1);
  walk(st, t, 0.2, 1.3, 3, false);
  walk(st, t, 28.4, 29.15, 2.8);
  st.armF = t < 1.3 ? -78 : kf(t, [[1.3, -78], [1.45, -95], [1.75, 6], [7.9, 6], [8.3, -112], [9.3, -112], [9.6, 6], [17.9, 6], [18.1, -118], [19.2, -142, 'b'], [19.6, 6]]);
  st.armB = t < 1.3 ? -72 : -6;
  if (t > 29.2) st.armF = kf(t, [[29.2, 6], [29.6, -60], [34.4, -60], [34.55, 18, 'o'], [35, -20]]);
  idle(st, t, 3.4);
  const jump = pulse(t, 14.75, 0.12, 0.35);
  st.y -= 26 * jump;
  st.mouth = Math.max(st.mouth, jump);
  st.y -= 20 * pulse(t, 30.15, 0.1, 0.3);
  st.head += -10 * env(t, 7.9, 9.5, 0.2) - 16 * env(t, 18, 19.8, 0.2);
  const jig = env(t, 2.2, 4.6, 0.2); // little jig once the light is on
  if (jig) { st.y -= Math.abs(Math.sin(t * 9)) * 16 * jig; st.armB = lerp(st.armB, -150 + Math.sin(t * 9) * 30, jig); st.legL += Math.sin(t * 9) * 20 * jig; st.legR -= Math.sin(t * 9) * 20 * jig; st.mouth = Math.max(st.mouth, jig * 0.7); }
  const clap = env(t, 11.0, 13.9, 0.2); // claps along with the music
  if (clap) { const c = Math.abs(Math.sin(t * 8)); st.armF = lerp(st.armF, -80 + 25 * c, clap); st.armB = lerp(st.armB, -80 - 25 * c, clap); st.head += 6 * Math.sin(t * 4) * clap; }
  const dance = env(t, 23.4, 26.4, 0.2); // "bezaubernde Paginnen": swaying dance
  if (dance) { st.lean += Math.sin(t * 5) * 9 * dance; st.armB = lerp(st.armB, -140 + Math.sin(t * 5) * 30, dance); st.armF = lerp(st.armF, -140 - Math.sin(t * 5) * 30, dance); st.y -= Math.abs(Math.sin(t * 5)) * 8 * dance; }
  react(st, t, t < 29.2 || t > 34.55);
  return st;
}

function stD(t: number): St {
  let x = kf(t, [[0.6, 1150], [3.0, 905, 'l'], [4.6, 905], [5.4, 880, 'l'], [11.0, 880], [11.5, 915], [11.8, 915], [14.55, 560, 'l'], [14.9, 540, 'o'], [17.9, 540], [19.4, 875, 'l'], [28.4, 875], [29.3, 896, 'l']]);
  const f = (t > 17.9 && t < 19.4) || t > 29.3 ? 1 : -1;
  x -= 16 * pulse(t, 30.2, 0.1, 0.5) * f;
  const st = base(x, 900, f);
  walk(st, t, 0.6, 3.0, 2.4, false);
  walk(st, t, 4.6, 5.4, 2.4);
  walk(st, t, 11.0, 11.5, 2.4);
  walk(st, t, 11.8, 14.55, 2.6, false);
  walk(st, t, 17.9, 19.4, 2.6);
  walk(st, t, 28.4, 29.3, 2.4);
  // arms: bucket → rope pulling → bucket → fall → cannon lever
  st.armF = kf(t, [[0, -14], [3.0, -14], [3.3, -40], [3.5, 6], [7.4, 6], [7.6, -160], [10.1, -160], [10.4, -120], [11.5, -40], [11.8, -18], [14.55, -18], [14.7, -120, 'o'], [16.3, -120], [16.6, 6], [29.3, 6], [29.7, -60], [34.4, -60], [34.55, 18, 'o'], [35, -20]]);
  st.armB = kf(t, [[7.4, -6], [7.6, -160], [10.1, -160], [10.4, -175], [11.0, -175], [11.2, -6]]);
  const pull = env(t, 7.6, 10.1, 0.15);
  st.armF += 32 * Math.sin((t - 7.6) * 11) * pull;
  st.armB -= 32 * Math.sin((t - 7.6) * 11) * pull;
  st.lean -= 9 * pull;
  st.lean += 22 * env(t, 3.0, 3.5, 0.2) + 24 * env(t, 11.4, 11.85, 0.15);
  // the stumble
  st.lean += kf(t, [[14.55, 0], [14.9, 78, 'i'], [15.5, 86], [15.9, 86], [16.4, 0, 'b']]);
  st.legL += kf(t, [[14.55, 0], [14.8, -38], [15.9, -20], [16.4, 0]]);
  st.legR += kf(t, [[14.55, 0], [14.8, 22], [15.9, 30], [16.4, 0]]);
  st.mouth = Math.max(env(t, 14.55, 15.2, 0.1), pulse(t, 30.2, 0.1, 0.6));
  st.head += osc(t, 16.3, 16.9, 14, 0.18);
  st.y -= 26 * pulse(t, 30.2, 0.1, 0.35);
  const jug = env(t, 19.6, 21.3, 0.15) + env(t, 24.0, 26.4, 0.15); // juggling gold bells
  if (jug) { st.armF = lerp(st.armF, -120 + Math.sin(t * 12) * 22, jug); st.armB = lerp(st.armB, -120 - Math.sin(t * 12) * 22, jug); st.head -= 12 * jug; }
  idle(st, t, 4.1);
  react(st, t, t < 29.3 || t > 34.55);
  return st;
}

/** Each helper pops into a puff of gold after the bow. */
const VANISH = [37.6, 37.75, 37.9, 38.05];
function vanish(st: St, t: number, i: number) {
  const p = win(t, VANISH[i], VANISH[i] + 0.18);
  st.vis = 1 - p;
  st.s = 1 + 0.25 * p;
}

// ---------- DOM binding ----------
function binder() {
  const cache = new WeakMap<Element, Record<string, string>>();
  return (el: Element | null, attr: string, v: string) => {
    if (!el) return;
    let c = cache.get(el);
    if (!c) cache.set(el, (c = {}));
    if (c[attr] !== v) { c[attr] = v; el.setAttribute(attr, v); }
  };
}
const n1 = (v: number) => (Math.round(v * 10) / 10).toString();

export type Crew = { svg: SVGSVGElement; lines: HTMLElement[]; text: HTMLElement };

export function createShow(svg: SVGSVGElement, cues: Cues, onEvent: (e: ShowEvent) => void, crew?: Crew) {
  const set = binder();
  const $ = (s: string) => svg.querySelector(s) as SVGGraphicsElement;
  const elf = (id: string, root: Element = svg) => {
    const r = root.querySelector(id) as SVGGraphicsElement;
    const g = (c: string) => r.querySelector('.' + c);
    return { r, pos: g('pos'), shadow: g('shadow'), lean: g('lean'), legL: g('legL'), legR: g('legR'), bob: g('bob'), armF: g('armF'), armB: g('armB'), head: g('head'), eyes: g('eyes'), smile: g('smile'), mouthO: g('mouthO'), cap: g('cap'), pole: g('pole'), cloth: g('cloth') };
  };
  const elves = [[elf('#elfA'), stA], [elf('#elfB'), stB], [elf('#elfC'), stC], [elf('#elfD'), stD]] as const;
  const drawElf = (e: ReturnType<typeof elf>, st: St) => {
    set(e.pos, 'transform', `translate(${n1(st.x)} ${n1(st.y)}) scale(${n1(st.f * st.s)} ${n1(st.s)})`);
    set(e.lean, 'transform', `rotate(${n1(st.lean)})`);
    set(e.legL, 'transform', `rotate(${n1(st.legL)})`);
    set(e.legR, 'transform', `rotate(${n1(st.legR)})`);
    set(e.bob, 'transform', `translate(0 ${n1(st.bob)})`);
    set(e.armF, 'transform', `rotate(${n1(st.armF)}) scale(1 ${st.armFs.toFixed(3)})`);
    set(e.armB, 'transform', `rotate(${n1(st.armB)})`);
    set(e.head, 'transform', `rotate(${n1(st.head)})`);
    set(e.cap, 'transform', `rotate(${n1(st.sway)} 0 -12)`);
    set(e.eyes, 'transform', `translate(0 -1.5) scale(1 ${st.blink ? 0.12 : 1}) translate(0 1.5)`);
    set(e.smile, 'opacity', n1(1 - st.mouth));
    set(e.mouthO, 'opacity', n1(st.mouth));
    set(e.shadow, 'opacity', n1(0.35 * st.shadow));
    set(e.r, 'opacity', st.vis.toFixed(2));
    if (e.pole) {
      set(e.pole, 'height', n1(st.pole - 30));
      set(e.cloth, 'transform', `translate(0 ${n1(st.pole)})`);
    }
  };

  // reveal mask elements
  const NS = 'http://www.w3.org/2000/svg';
  const reveal = $('#hs-reveal');
  const mk = (tag: string, attrs: Record<string, string | number>, parent: Element = reveal) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, String(attrs[k]));
    parent.appendChild(el);
    return el;
  };
  type Stroke = { el: SVGPathElement; len: number; t0: number; t1: number };
  const strokes: Stroke[] = [];
  const addSweeps = (list: Sweep[], fn: (t: number) => St, tip: (s: Sweep) => number, scale: boolean) => {
    for (const s of list) {
      const st0 = fn(s.t0);
      const pts: string[] = [];
      let len = 0, px = 0, py = 0;
      for (let i = 0; i <= 28; i++) {
        const st = { ...st0, armF: lerp(s.a1, s.a2, i / 28), armFs: scale ? s.r : 1 };
        const [x, y] = hand(st, tip(s));
        if (i) len += Math.hypot(x - px, y - py);
        pts.push(`${n1(x)} ${n1(y)}`);
        px = x; py = y;
      }
      const el = mk('path', { d: 'M' + pts.join(' L'), fill: 'none', 'stroke-width': s.w, 'stroke-dasharray': `${len} ${len + 10}`, 'stroke-dashoffset': len }) as SVGPathElement;
      strokes.push({ el, len, t0: s.t0, t1: s.t1 });
    }
  };
  addSweeps(A_SW, stA, () => A_TIP, true);
  addSweeps(B_SW, stB, (s) => s.r, false);

  const splatD = $('#hs-splat path').getAttribute('d')!;
  const splat = [mk('path', { d: splatD }), mk('circle', { cx: 610, cy: 620, r: 14 }), mk('circle', { cx: 395, cy: 720, r: 11 }), mk('circle', { cx: 540, cy: 580, r: 9 })];
  const blobs = [
    { c: FACES.miguel, r: 128 * K, t: 21.45, ry: 1 }, { c: px(510, 840), r: 105 * K, t: 21.9, ry: 2.3 },
    { c: FACES.laura, r: 120 * K, t: 26.62, ry: 1 }, { c: px(815, 860), r: 80 * K, t: 26.9, ry: 2.6 },
    { c: FACES.louisa, r: 120 * K, t: 27.32, ry: 1 }, { c: px(210, 860), r: 80 * K, t: 27.6, ry: 2.6 },
  ].map((b) => ({ ...b, el: mk('ellipse', { cx: b.c[0], cy: b.c[1], rx: 0, ry: 0 }) }));
  const sweepRect = $('#hs-sweeprect');
  const full = $('#hs-full');

  // gold rings at the name reveals
  const ringG = $('#hs-rings');
  const rings = blobs.filter((b) => b.ry === 1).map((b) => ({ ...b, el: mk('circle', { cx: b.c[0], cy: b.c[1], r: 0 }, ringG) }));

  // sparkles: frame polishing, name reveals, finale
  const sparkG = $('#hs-sparkles');
  const sparks: { el: Element; x: number; y: number; t: number; s: number }[] = [];
  const addSpark = (x: number, y: number, t: number, s = 1) => sparks.push({ el: mk('path', { d: star, opacity: 0 }, sparkG), x, y, t, s });
  for (let t = 10.9; t < 13.9; t += 0.32) { const [x, y] = hand(stB(t), stB(t).pole); addSpark(x + 10, y - 10, t, 1.2); }
  for (const b of rings) for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + b.t; addSpark(b.c[0] + Math.cos(a) * 120 * K, b.c[1] + Math.sin(a) * 120 * K, b.t + 0.2 + i * 0.05, 1.3); }
  for (let i = 0; i < 16; i++) { const a = i * 2.4; addSpark(500 + Math.cos(a) * 0.64 * P.w, P.y + P.h / 2 + Math.sin(a) * 0.6 * P.h, 34.55 + (i % 5) * 0.12, 1.8); }
  for (let i = 0; i < 10; i++) addSpark(P.x - 10 + i * ((P.w + 20) / 9), (i % 2 ? P.y + P.h + 14 : P.y + 60), 12.2 + i * 0.09, 1);

  const starG = $('#hs-stars');
  const dizzy = [0, 1, 2].map(() => mk('path', { d: star, opacity: 0 }, starG));
  const puffG = $('#hs-puffs');
  const puffs = VANISH.map(() => Array.from({ length: 9 }, () => mk('circle', { r: 0 }, puffG)));
  const lastPos: [number, number][] = [[0, 0], [0, 0], [0, 0], [0, 0]];

  // extra stage life: streamers at "Bühne frei", hearts at "Herzen höher schlagen", juggling bells
  const fxG = document.createElementNS(NS, 'g');
  svg.insertBefore(fxG, $('#hs-dark'));
  const PALETTE = ['#f3d48a', '#b5162b', '#fff4dc', '#3a8be0', '#36b37e', '#f08a24', '#d4a64a'];
  const streamers = Array.from({ length: 12 }, (_, i) => {
    let d = 'M0 0';
    for (let k = 0; k < 6; k++) d += ` c ${k % 2 ? -22 : 22} 12 ${k % 2 ? -22 : 22} 34 0 ${40 + (i % 3) * 6}`;
    return { el: mk('path', { d, fill: 'none', stroke: PALETTE[i % PALETTE.length], 'stroke-width': 5, 'stroke-linecap': 'round' }, fxG), x: 30 + i * 85 + (i % 2) * 20, t: 18.0 + (i % 6) * 0.07, drop: 40 + (i * 37) % 90 };
  });
  const HEART = 'M0 4 C-7 -5 -16 3 0 15 C16 3 7 -5 0 4Z';
  const hearts = Array.from({ length: 16 }, (_, i) => ({ el: mk('path', { d: HEART, fill: i % 3 ? '#e0284a' : '#f3d48a', opacity: 0 }, fxG), who: i % 4, t: 28.45 + i * 0.09, dx: ((i * 53) % 40) - 20 }));
  const heartFrom = [stA, stB, stC, stD].map((fn) => toWorld(fn(28.4), 0, -140));
  const balls = [0, 1, 2].map(() => mk('circle', { r: 7, fill: 'url(#hs-gold)', opacity: 0 }, fxG));

  // ---------- crew on the text column: a rope-climber polishes the letters, a sign bearer cheers ----------
  type Box = { x: number; y: number; w: number; h: number; m: number; r: number };
  let B: Box[] = [], floorY = 0, signX = 0, W = 0;
  const ES = 0.62, FS = 0.6;
  const cr = crew && { e: elf('#elfE', crew.svg), f: elf('#elfF', crew.svg), rope: crew.svg.querySelector('#cr-rope')!, sign: crew.svg.querySelector('#cr-sign')!, signText: crew.svg.querySelector('#cr-sign text')!, sparkG: crew.svg.querySelector('#cr-sparks')! };
  const crewSparks = cr ? Array.from({ length: 6 }, () => mk('path', { d: star, opacity: 0 }, cr.sparkG)) : [];
  const layout = () => {
    if (!crew) return;
    const c = crew.svg.getBoundingClientRect();
    W = c.width;
    crew.svg.setAttribute('viewBox', `0 0 ${c.width.toFixed(0)} ${c.height.toFixed(0)}`);
    B = crew.lines.map((el) => {
      const r = el.getBoundingClientRect(), pr = el.parentElement!.getBoundingClientRect();
      const x = r.left - c.left, y = pr.top - c.top;
      return { x, y, w: r.width, h: pr.height, m: y + pr.height * 0.56, r: x + r.width };
    });
    const tr = crew.text.getBoundingClientRect();
    floorY = tr.bottom - c.top;
    signX = Math.min(c.width - 50, tr.right - c.left + 70);
  };
  const POLISH: [number, number][] = [[3.0, 7.5], [10.6, 14.0], [18.8, 22.6]];
  const clothAt = (t: number): [number, number] => {
    const [l0, l1, l2] = B;
    return [
      kf(t, [[0, l0.r + 40], [1.8, l0.r + 40], [3.0, l0.r - 6], [7.5, l0.x + 6], [9.5, l0.x + 6], [10.6, l1.x + 6], [14.0, l1.r - 6], [18.0, l1.r - 6], [18.8, l2.r - 6], [22.6, l2.x + 6], [23.4, l2.x + 6], [25.5, (l2.x + l2.r) / 2]]),
      kf(t, [[0, -280], [1.8, -280], [3.0, l0.m, 'o'], [9.5, l0.m], [10.6, l1.m], [18.0, l1.m], [18.8, l2.m], [25.5, l2.m - 10]]),
    ];
  };
  const stE = (t: number): St => {
    const f = t < 9.5 ? -1 : t < 18 ? 1 : t < 23.4 ? -1 : 1;
    const st = base(0, 0, f);
    st.s = ES; st.shadow = 0; st.pole = 46;
    const [cx, cy] = clothAt(t);
    st.x = cx - f * 60 * ES;
    st.y = cy + 94 * ES;
    const pol = POLISH.reduce((a, [p0, p1]) => Math.max(a, env(t, p0, p1, 0.2)), 0);
    st.armF = lerp(-55, -90 + Math.sin(t * 19) * 22, pol);
    st.pole += Math.cos(t * 19) * 8 * pol;
    st.armB = -172;
    st.legL = 18 + Math.sin(t * 2.2) * 12;
    st.legR = 4 + Math.sin(t * 2.2 + 1.2) * 12;
    st.lean += osc(t, 14.6, 16.6, 14, 0.9) + osc(t, 34.5, 37, 20, 1.1) + Math.sin(t * 1.3) * 2;
    st.mouth = Math.max(env(t, 14.6, 16.2, 0.2), pulse(t, 7.95, 0.2, 1.2));
    st.head += -12 * env(t, 7.9, 9.4, 0.3); // peeks over at the frame
    idle(st, t, 5.3);
    react(st, t, false, false, false);
    st.vis = 1 - win(t, 38.2, 38.5);
    return st;
  };
  const SIGNS: [number, string][] = [[0, ''], [5.0, 'Psst …'], [16.8, 'Bereit?'], [18.0, 'Bühne frei!'], [21.4, 'Miguel I.'], [23.4, '♥ Paginnen ♥'], [26.6, 'Laura'], [27.3, 'Louisa'], [28.4, '♥ ♥ ♥'], [30.1, 'Konfetti!'], [33.2, '3 ×'], [34.5, 'ALAAF!']];
  const stF = (t: number): St => {
    const st = base(kf(t, [[3.6, W + 90], [5.0, signX, 'l']]), floorY, -1);
    st.s = FS;
    walk(st, t, 3.6, 5.0, 2.6, false);
    st.armF = -170; st.armB = -166;
    for (const [c] of SIGNS.slice(1)) { const p = pulse(t, c + 0.05, 0.08, 0.3); st.y -= 16 * p; st.mouth = Math.max(st.mouth, p); }
    for (const c of [33.2, 33.7, 34.2]) st.y -= 10 * pulse(t, c + 0.06, 0.1, 0.25);
    const al = env(t, 34.5, 36.2, 0.1);
    st.y -= 22 * Math.abs(Math.sin(win(t, 34.5, 36.2) * Math.PI * 3)) * al;
    st.lean += Math.sin(t * 9) * 8 * al + 10 * env(t, 14.7, 16.2, 0.2) * Math.sin(t * 20);
    idle(st, t, 6.1);
    st.vis = 1 - win(t, 38.35, 38.65);
    return st;
  };
  const drawCrew = (t: number) => {
    if (!cr || !B.length) return;
    const e = stE(t);
    drawElf(cr.e, e);
    const [rx, ry] = hand(e, 35, false);
    set(cr.rope, 'x1', n1(rx)); set(cr.rope, 'y1', n1(ry)); set(cr.rope, 'x2', n1(rx)); set(cr.rope, 'y2', '-600');
    set(cr.rope, 'opacity', e.vis.toFixed(2));
    crew!.lines.forEach((el, i) => {
      const w = POLISH[i] ? env(t, POLISH[i][0], POLISH[i][1], 0.25) : 0;
      const [cx] = clothAt(t);
      el.style.setProperty('--so', w.toFixed(2));
      el.style.setProperty('--sx', `${(((cx - B[i].x) / B[i].w) * 100).toFixed(1)}%`);
    });
    crewSparks.forEach((el, j) => {
      const tk = Math.floor(t / 0.25) * 0.25 - (j % 3) * 0.25 - (j >= 3 ? 0.12 : 0);
      const on = POLISH.some(([a, b]) => tk > a && tk < b);
      const p = (t - tk) / 0.75;
      set(el, 'opacity', on && p < 1 ? '1' : '0');
      if (!on) return;
      const [x, y] = clothAt(tk);
      const jx = ((tk * 97) % 1) * 40 - 20, jy = ((tk * 61) % 1) * 24 - 12;
      set(el, 'transform', `translate(${n1(x + jx)} ${n1(y + jy)}) rotate(${n1(p * 90)}) scale(${(Math.sin(p * Math.PI) * 0.9).toFixed(2)})`);
    });
    const f = stF(t);
    drawElf(cr.f, f);
    const [hx, hy] = hand(f, 36);
    const idx = SIGNS.reduce((a, [c], i) => (t >= c ? i : a), 0);
    const flip = Math.max(...SIGNS.slice(1).map(([c]) => pulse(t, c, 0.1, 0.12)));
    if (cr.signText.textContent !== SIGNS[idx][1]) cr.signText.textContent = SIGNS[idx][1];
    const wave = Math.sin(t * 9) * 8 * env(t, 34.5, 36.2, 0.1) + (pulse(t, 33.26, 0.1, 0.3) + pulse(t, 33.76, 0.1, 0.3) + pulse(t, 34.26, 0.1, 0.3)) * -12;
    set(cr.sign, 'transform', `translate(${n1(hx)} ${n1(hy + wave * 0.5)}) rotate(${n1(wave)}) scale(${(1 - flip).toFixed(2)} 1)`);
    set(cr.sign, 'opacity', (idx ? 1 : 0) * f.vis + '');
  };
  layout();

  const frame = $('#hs-frame'), ropes = [$('#hs-ropes1'), $('#hs-ropes2')], shine = $('#hs-shinepath');
  const shineGrad = svg.querySelector('#hs-shine')!;
  const ladder = $('#hs-ladder'), lamp = $('#hs-lamp'), lampHead = $('#hs-lamphead'), coneWrap = $('#hs-conewrap'), cone = $('#hs-cone'), lens = $('#hs-lens');
  const bucket = $('#hs-bucket'), rope = $('#hs-rope'), splatVis = $('#hs-splat');
  const cannons = [$('#hs-cannonL'), $('#hs-cannonR')];
  const dark = $('#hs-dark'), top = $('#hs-topspots'), foot = $('#hs-foot');
  const pl = { laura: $('#hs-pl-laura'), miguel: $('#hs-pl-miguel'), louisa: $('#hs-pl-louisa') };

  // time warp from actual audio time to design time
  const act = [0, cues.miguel, cues.paginnen, cues.laura, cues.louisa, cues.konfetti, cues.dreimal, cues.alaaf, cues.alaaf + 1.14];
  const ok = act.every((v, i) => i === 0 || v > act[i - 1]);
  const toDesign = (t: number) => (ok ? warp(t, act, DESIGN) : t);
  let prev = -1;

  function render(actualT: number) {
    const t = toDesign(actualT);
    // events (only on forward play, not on big seeks)
    if (t > prev && t - prev < 0.6) {
      const fire = (at: number, kind: ShowEvent['kind']) => {
        if (prev < at && t >= at) {
          onEvent({ kind, x: 99, y: 814, angle: 48 });
          onEvent({ kind, x: 901, y: 814, angle: 132 });
        }
      };
      fire(30.15, 'test');
      fire(34.55, 'alaaf');
      fire(35.1, 'alaaf2');
    }
    prev = t;

    // helpers
    elves.forEach(([e, fn], i) => {
      const st = fn(t);
      vanish(st, t, i);
      drawElf(e, st);
      if (st.vis > 0.01) lastPos[i] = toWorld(st, 0, -70);
      if (i === 3) { // D: rope, bucket, dizzy stars
        const [hx, hy] = hand(st, 38);
        const ropeOn = t > 4.9 && t < 10.3;
        set(rope, 'opacity', ropeOn ? '1' : '0');
        if (ropeOn) { set(rope, 'x1', n1(hx)); set(rope, 'y1', n1(hy + 6)); set(rope, 'x2', n1(hx)); set(rope, 'y2', '-60'); }
        let bx: number, by: number, br = 0;
        if (t < 3.3 || (t > 11.7 && t < 14.6)) { bx = hx; by = hy + 4; }
        else if (t < 11.7) { bx = 930; by = 866; }
        else if (t < 14.95) {
          const [h0x, h0y] = hand(stD(14.6), 38);
          const p = win(t, 14.6, 14.95), q = 1 - p;
          bx = q * q * h0x + 2 * q * p * 540 + p * p * 500;
          by = q * q * h0y + 2 * q * p * 540 + p * p * 660;
          br = -210 * p;
        } else { const p = E.bo(win(t, 14.95, 15.5)); bx = lerp(500, 470, p); by = lerp(660, 900, p); br = lerp(-210, -180, p); }
        set(bucket, 'transform', `translate(${n1(bx)} ${n1(by)}) rotate(${n1(br)})`);
        const [kx, ky] = toWorld(st, 0, -150);
        const jug = env(t, 19.6, 21.3, 0.15) + env(t, 24.0, 26.4, 0.15);
        balls.forEach((b, j) => {
          const ph = t * 6 + j * 2.09;
          set(b, 'opacity', n1(jug));
          if (jug) { set(b, 'cx', n1(kx + Math.cos(ph) * 24)); set(b, 'cy', n1(ky - 10 - Math.abs(Math.sin(ph)) * 46)); }
        });
        const dz = env(t, 15.0, 16.7, 0.2);
        dizzy.forEach((d, j) => {
          const a = t * 6 + (j * Math.PI * 2) / 3;
          set(d, 'opacity', n1(dz));
          set(d, 'transform', `translate(${n1(kx + Math.cos(a) * 30)} ${n1(ky + Math.sin(a) * 9)}) scale(.9)`);
        });
      }
    });
    const propsVis = (1 - win(t, 38.0, 38.8)).toFixed(2);
    for (const st of streamers) {
      const p = E.bo(win(t, st.t, st.t + 1.1));
      set(st.el, 'opacity', p > 0 ? '1' : '0');
      if (p > 0) set(st.el, 'transform', `translate(${st.x} ${n1(-320 + (320 - st.drop) * p)}) rotate(${n1(Math.sin(t * 1.6 + st.x) * 6)})`);
    }
    for (const h of hearts) {
      const p = win(t, h.t, h.t + 2.3);
      set(h.el, 'opacity', p > 0 && p < 1 ? n1(1 - p * p) : '0');
      if (p > 0 && p < 1) {
        const [x0, y0] = heartFrom[h.who];
        set(h.el, 'transform', `translate(${n1(x0 + h.dx + Math.sin(p * 7 + h.dx) * 22)} ${n1(y0 - 300 * p)}) scale(${(0.8 + 0.8 * Math.sin(p * Math.PI)).toFixed(2)})`);
      }
    }
    drawCrew(t);

    // ladder
    let lx = LADDER.x, ly = LADDER.y, la = LADDER.ang;
    if (t < 3.3) {
      const a = stA(t);
      const p = E.io(win(t, 2.6, 3.3));
      lx = lerp(a.x - 250, LADDER.x, p); ly = lerp(768, LADDER.y, p); la = lerp(90, LADDER.ang, p);
    }
    set(ladder, 'transform', `translate(${n1(lx)} ${n1(ly)}) rotate(${n1(la)})`);
    set(ladder, 'opacity', propsVis);

    // lamp
    const c = stC(t);
    const lampX = t < 1.3 ? c.x + 48 : LAMP_X, lampY = t < 1.3 ? 890 : 900;
    const aim = kf(t, [[0, -20], [7.9, -20], [8.5, -40], [8.8, -31], [9.2, -35], [18.0, -35], [19.2, -40, 'b'], [34.4, -40], [34.6, -34, 'o']]);
    const on = t < 1.5 ? 0 : kf(t, [[1.5, 0], [1.56, 0.85, 'l'], [1.62, 0.2, 'l'], [1.7, 0.9, 'l'], [1.78, 0.45, 'l'], [1.95, 0.8, 'l'], [21.4, 0.7], [28.4, 0.75], [35.5, 0.75], [36.5, 0.45], [38.0, 0.45], [38.8, 0]]);
    set(lamp, 'transform', `translate(${n1(lampX)} ${n1(lampY)})`);
    set(lamp, 'opacity', propsVis);
    set(lampHead, 'transform', `translate(0 -104) rotate(${n1(aim)})`);
    set(coneWrap, 'transform', `translate(${n1(lampX)} ${n1(lampY - 104)}) rotate(${n1(aim)})`);
    set(cone, 'opacity', (on * (1 + 0.3 * pulse(t, 34.55, 0.1, 1))).toFixed(2));
    set(lens, 'fill', on > 0.3 ? '#fff4cc' : '#5a4a3a');

    // frame
    const fy = kf(t, [[7.6, -1100], [10.2, 0, 'bo']]);
    set(frame, 'transform', `translate(0 ${n1(fy)})`);
    ropes.forEach((r) => set(r, 'opacity', n1(1 - win(t, 10.6, 11.4))));
    const sh = Math.max(env(t, 12.1, 13.3, 0.2), env(t, 34.5, 35.6, 0.2));
    set(shine, 'opacity', n1(sh));
    const sx = t < 20 ? lerp(160, 820, win(t, 12.1, 13.3)) : lerp(160, 820, win(t, 34.5, 35.6));
    set(shineGrad, 'gradientTransform', `translate(${n1(sx)} 0) skewX(-20)`);
    set(pl.miguel, 'opacity', n1(win(t, 21.45, 21.9)));
    set(pl.laura, 'opacity', n1(win(t, 26.62, 27.0)));
    set(pl.louisa, 'opacity', n1(win(t, 27.32, 27.7)));

    // reveal
    for (const s of strokes) set(s.el, 'stroke-dashoffset', n1(s.len * (1 - E.io(win(t, s.t0, s.t1)))));
    const sp = E.o(win(t, 14.95, 15.2));
    splat.forEach((el) => set(el, 'transform', `translate(500 660) scale(${(0.2 + 0.8 * sp).toFixed(3)}) translate(-500 -660)`));
    splat.forEach((el) => set(el, 'opacity', sp ? '1' : '0'));
    set(splatVis, 'opacity', n1(t < 14.95 ? 0 : 1 - win(t, 15.1, 15.9)));
    set(splatVis, 'transform', `translate(500 660) scale(${(0.2 + 0.8 * sp).toFixed(3)}) translate(-500 -660)`);
    for (const b of blobs) {
      const p = E.o(win(t, b.t, b.t + 0.7));
      set(b.el, 'rx', n1(b.r * p)); set(b.el, 'ry', n1(b.r * b.ry * p));
    }
    for (const r of rings) {
      const p = win(t, r.t, r.t + 1);
      set(r.el, 'r', n1(lerp(20, 190, E.o(p))));
      set(r.el, 'opacity', p > 0 && p < 1 ? n1(1 - p) : '0');
      set(r.el, 'stroke-width', n1(7 * (1 - p)));
    }
    set(sweepRect, 'width', n1(K * kf(t, [[31.6, 0], [33.0, 380], [34.5, 400], [34.95, 560]])));
    set(full, 'opacity', n1(win(t, 34.5, 35.1)));
    for (const s of sparks) {
      const p = win(t, s.t, s.t + 0.75);
      set(s.el, 'opacity', p > 0 && p < 1 ? '1' : '0');
      if (p > 0 && p < 1) set(s.el, 'transform', `translate(${n1(s.x)} ${n1(s.y + fy)}) rotate(${n1(p * 120)}) scale(${(Math.sin(p * Math.PI) * s.s).toFixed(2)})`);
    }

    // cannons: test puff wiggle + recoil
    cannons.forEach((cn, i) => {
      const k = pulse(t, 30.15, 0.05, 0.3) * 0.5 + pulse(t, 34.55, 0.05, 0.5);
      const bx = (i ? 948 : 52) - (i ? -1 : 1) * 10 * k;
      set(cn, 'transform', `translate(${n1(bx)} 900) scale(${i ? -1 : 1} 1)`);
      set(cn.querySelector('.barrel'), 'transform', `translate(0 -34) rotate(${n1(-48 - 8 * k)})`);
      set(cn, 'opacity', propsVis);
    });
    set(bucket, 'opacity', propsVis);

    // puffs when helpers vanish
    puffs.forEach((list, i) => {
      const p = win(t, VANISH[i], VANISH[i] + 0.7);
      const [x, y] = lastPos[i];
      list.forEach((el, j) => {
        const a = (j / list.length) * Math.PI * 2 + i;
        set(el, 'cx', n1(x + Math.cos(a) * 70 * E.o(p)));
        set(el, 'cy', n1(y + Math.sin(a) * 60 * E.o(p) - 30 * p));
        set(el, 'r', n1(p > 0 && p < 1 ? 9 * (1 - p) + 2 : 0));
      });
    });

    // light
    const darkness = kf(t, [[0, 0.82], [1.5, 0.62, 'l'], [1.9, 0.46], [18, 0.42], [19.2, 0.26], [21.4, 0.18], [28.4, 0.12], [34.5, 0]]);
    set(dark, 'opacity', darkness.toFixed(3));
    set(top, 'opacity', n1(kf(t, [[1.6, 0], [2.4, 0.35], [18.0, 0.4], [18.7, 0.9, 'o'], [34.4, 0.9], [34.6, 1], [36, 0.85]])));
    set(foot, 'opacity', n1(kf(t, [[0, 0], [1.6, 0.25], [18.0, 0.3], [18.5, 0.95], [34.5, 1]])));
    return { t, glow: 1 - darkness };
  }
  return Object.assign(render, { layout });
}
