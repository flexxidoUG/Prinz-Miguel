// Tiny deterministic animation toolkit: every value is a pure function of time t (seconds),
// so the show can be seeked, paused and re-synced to the audio clock at any moment.
export type Ease = (x: number) => number;
export const E: Record<string, Ease> = {
  l: (x) => x,
  io: (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2),
  o: (x) => 1 - (1 - x) ** 3,
  i: (x) => x * x * x,
  b: (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2,
  bo: (x) => {
    const n = 7.5625, d = 2.75;
    if (x < 1 / d) return n * x * x;
    if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
    if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
    return n * (x -= 2.625 / d) * x + 0.984375;
  },
};
export type Key = [number, number] | [number, number, string];
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const win = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Piecewise keyframes; the ease of a key applies to the segment that ends at it. */
export function kf(t: number, keys: Key[]): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e = 'io'] = keys[i] as [number, number, string?];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      return v0 + (v1 - v0) * (E[e] || E.io)(t1 === t0 ? 1 : (t - t0) / (t1 - t0));
    }
  }
  return keys[keys.length - 1][1];
}

/** Envelope that is 1 inside [a,b] with soft edges of `fade` seconds. */
export const env = (t: number, a: number, b: number, fade = 0.15) =>
  t < a || t > b ? 0 : Math.min(1, (t - a) / fade, (b - t) / fade);

export const osc = (t: number, a: number, b: number, amp: number, period: number, phase = 0) =>
  env(t, a, b) * amp * Math.sin(((t - a) / period) * Math.PI * 2 + phase);

/** Short pulse 0→1→0 around time c. */
export const pulse = (t: number, c: number, up = 0.12, down = 0.25) =>
  t < c - up || t > c + down ? 0 : t < c ? E.o((t - c + up) / up) : 1 - E.io((t - c) / down);

/** Map show time through anchor pairs (design → actual) so admins can retime by editing cues. */
export function warp(t: number, actual: number[], design: number[]) {
  if (t <= actual[0]) return t;
  for (let i = 1; i < actual.length; i++)
    if (t <= actual[i]) return lerp(design[i - 1], design[i], (t - actual[i - 1]) / (actual[i] - actual[i - 1] || 1));
  return design[design.length - 1] + (t - actual[actual.length - 1]);
}
