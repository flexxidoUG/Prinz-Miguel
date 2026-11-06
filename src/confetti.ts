import confetti from 'canvas-confetti';

export const COLORS = ['#f3d48a', '#d4a64a', '#fff1c4', '#b5162b', '#ffffff', '#8e1020', '#f6c453', '#3a8be0', '#36b37e', '#f08a24'];
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Page-wide burst (guestbook, finale). */
export function celebrate(origin = { x: 0.5, y: 0.6 }, scale = 1) {
  if (reducedMotion()) return;
  const base = { colors: COLORS, disableForReducedMotion: true, zIndex: 60 };
  confetti({ ...base, particleCount: Math.round(90 * scale), spread: 80, startVelocity: 45, origin });
  setTimeout(() => confetti({ ...base, particleCount: Math.round(60 * scale), spread: 120, startVelocity: 30, scalar: 0.8, origin }), 180);
}

export { confetti };
