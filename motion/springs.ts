// motion/springs.ts: motion with mass. Closed-form damped springs: every value is a pure function
// of time, so frame N is the same on every render, in any order, at any fps (the render contract).
//
// STATUS: proposed (the motion studio process, decisions/0011), pending the founder's OK after
// Pop out v3. New ads use it; nothing here is a house rule in RULES.md yet.
//
// A spring is the step response of a damped harmonic oscillator, released at rest from 0 toward 1:
//   ω0 = 2π / response            (response = the period it would ring at with no damping, seconds)
//   ζ  = damping ratio            (1 = critically damped: the fastest arrival with no overshoot)
//   ζ < 1:  x(t) = 1 − e^(−ζω0 t) (cos ωd t + (ζω0/ωd) sin ωd t),   ωd = ω0 √(1 − ζ²)
//   ζ = 1:  x(t) = 1 − e^(−ω0 t) (1 + ω0 t)
//   ζ > 1:  x(t) = 1 − (r2 e^(r1 t) − r1 e^(r2 t)) / (r2 − r1),   r1,2 = −ω0 (ζ ∓ √(ζ² − 1))
// Overshoot (ζ < 1) = e^(−πζ / √(1 − ζ²)). Velocities are analytic too (for motion blur).
//
// STACKING (a value that changes target several times stays smooth):
//   track(t) = v0 + Σ (v_i − v_{i−1}) × spring(t − t_i)
// Each retarget adds a new spring for the difference, so position and velocity stay continuous
// through every change: no jump, no restart, no "ease from zero" hitch.
//
// The presets are per OBJECT CLASS. Pick by what is moving, never by taste per shot:
//   ui        a button, chip, card or caption: snaps, a hair of overshoot (≈3%) gives it mass
//   panel     a sheet, phone, big surface: settles, no overshoot
//   camera    the virtual camera: glides, long and critically damped, almost invisible
//   headline  on-screen words: land hard (≈0.4%), then HOLD long enough to read (readHold)
//   mascot    Zee only: bounces on purpose (≈23%). The ONLY preset allowed to bounce
//   piece     a garment: has mass, a slight settle (≈1%)
// "Bouncy easing" stays banned everywhere except `mascot`. Measured numbers: tools/motion-check.

export type Spring = {
  /** Damping ratio ζ. 1 = critical; < 1 overshoots; > 1 is slower still. */
  zeta: number;
  /** Seconds: the undamped period 2π/ω0. Bigger = slower. */
  response: number;
};

export const PRESETS = {
  /** Buttons, chips, cards, captions. Overshoot 2.8%; within 2% in 0.29 s. */
  ui: { zeta: 0.75, response: 0.32 },
  /** Sheets, phones, big surfaces. No overshoot; 99% in 0.42 s. */
  panel: { zeta: 1, response: 0.4 },
  /** The camera. No overshoot; 99% in 1.69 s. A glide you feel more than see. */
  camera: { zeta: 1, response: 1.6 },
  /** Headlines. Overshoot 0.3% (lands hard, no wobble); 99% in 0.17 s. Hold with readHold(). */
  headline: { zeta: 0.88, response: 0.22 },
  /** Zee only. Overshoot 23%, two visible bounces; within 2% in 0.56 s. */
  mascot: { zeta: 0.42, response: 0.42 },
  /** Garments. Overshoot 1.1%; within 2% in 0.31 s, 1% in 0.48 s: it has weight. */
  piece: { zeta: 0.82, response: 0.5 },
} as const satisfies Record<string, Spring>;
export type MotionClass = keyof typeof PRESETS;
export const MOTION_CLASSES = Object.keys(PRESETS) as MotionClass[];

const resolve = (s: Spring | MotionClass): Spring => (typeof s === "string" ? PRESETS[s] : s);

/** Spring position 0 → 1 at t seconds after release (0 before it). Pure. */
export const spring = (t: number, s: Spring | MotionClass): number => {
  if (t <= 0) return 0;
  const { zeta: z, response } = resolve(s);
  const w0 = (2 * Math.PI) / response;
  if (Math.abs(z - 1) < 1e-6) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }
  const q = Math.sqrt(z * z - 1);
  const r1 = -w0 * (z - q);
  const r2 = -w0 * (z + q);
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
};

/** Spring velocity (units of the 0 → 1 span per second) at t seconds. Pure, analytic. */
export const springVel = (t: number, s: Spring | MotionClass): number => {
  if (t <= 0) return 0;
  const { zeta: z, response } = resolve(s);
  const w0 = (2 * Math.PI) / response;
  if (Math.abs(z - 1) < 1e-6) return w0 * w0 * t * Math.exp(-w0 * t);
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return ((w0 * w0) / wd) * Math.exp(-z * w0 * t) * Math.sin(wd * t);
  }
  const q = Math.sqrt(z * z - 1);
  const r1 = -w0 * (z - q);
  const r2 = -w0 * (z + q);
  return (-(r1 * r2) * (Math.exp(r1 * t) - Math.exp(r2 * t))) / (r2 - r1);
};

/** The spring's overshoot past its target, as a fraction (0 when ζ ≥ 1). */
export const overshoot = (s: Spring | MotionClass) => {
  const { zeta: z } = resolve(s);
  return z >= 1 ? 0 : Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z));
};

/** Seconds until the spring stays within `band` of its target for good (numeric, 1 ms steps). */
export const settleTime = (s: Spring | MotionClass, band = 0.02) => {
  let last = 0;
  for (let t = 0; t < 10; t += 0.001) if (Math.abs(1 - spring(t, s)) > band) last = t;
  return last;
};

// ── stacking: one value, many targets ──

/** A target change: at time `t` (s) the value heads for `v`, moving like `spring` (default: the track's). */
export type Key = { t: number; v: number; spring?: Spring | MotionClass };

/**
 * A value that starts at `v0` and changes target at each key, smoothly:
 * track(t) = v0 + Σ (v_i − v_{i−1}) × spring(t − t_i). Keys must be in time order.
 */
export const track = (t: number, v0: number, keys: readonly Key[], s: Spring | MotionClass = "ui"): number => {
  let out = v0;
  let prev = v0;
  for (const k of keys) {
    out += (k.v - prev) * spring(t - k.t, k.spring ?? s);
    prev = k.v;
  }
  return out;
};

/** The stacked value's velocity (units per second). */
export const trackVel = (t: number, v0: number, keys: readonly Key[], s: Spring | MotionClass = "ui"): number => {
  let out = 0;
  let prev = v0;
  for (const k of keys) {
    out += (k.v - prev) * springVel(t - k.t, k.spring ?? s);
    prev = k.v;
  }
  return out;
};

/** A 2D/3D/nD value with stacked targets (each axis is a track). */
export type VecKey = { t: number; v: readonly number[]; spring?: Spring | MotionClass };
export const trackVec = (t: number, v0: readonly number[], keys: readonly VecKey[], s: Spring | MotionClass = "ui"): number[] =>
  v0.map((x0, i) => track(t, x0, keys.map((k) => ({ t: k.t, v: k.v[i], spring: k.spring })), s));
export const trackVecVel = (t: number, v0: readonly number[], keys: readonly VecKey[], s: Spring | MotionClass = "ui"): number[] =>
  v0.map((x0, i) => trackVel(t, x0, keys.map((k) => ({ t: k.t, v: k.v[i], spring: k.spring })), s));

/** Frames → seconds helpers, so ads stay in frames and springs stay in seconds. */
export const sec = (frame: number, fps: number) => frame / fps;
/** spring() released at frame `at`, read at frame `frame`. */
export const springAt = (frame: number, at: number, fps: number, s: Spring | MotionClass) => spring((frame - at) / fps, s);

// ── headlines: hold long enough to read ──

/**
 * Seconds a line must hold, fully landed, before it may move again: 0.6 s to find it plus
 * 0.24 s a word (≈250 wpm, a phone held at arm's length), never under 1.2 s.
 */
export const readHold = (text: string) => Math.max(1.2, 0.6 + 0.24 * text.trim().split(/\s+/).filter(Boolean).length);

// ── exponential easing (for opacity, colour, blur amounts: things that are not objects) ──

const c01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const E = 1 - Math.pow(2, -10);
/** Exponential ease-out, exactly 0 at 0 and 1 at 1. */
export const expoOut = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : (1 - Math.pow(2, -10 * t)) / E);
/** Exponential ease-in, exactly 0 at 0 and 1 at 1. */
export const expoIn = (t: number) => 1 - expoOut(1 - c01(t));
/** Exponential ease-in-out, exactly 0, ½ and 1 at 0, ½ and 1. */
export const expoInOut = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? expoIn(2 * t) / 2 : 0.5 + expoOut(2 * t - 1) / 2);
/** An exponential approach with time constant tau (s): 63% at tau, 95% at 3 tau. Never arrives. */
export const expApproach = (t: number, tau: number) => (t <= 0 ? 0 : 1 - Math.exp(-t / tau));
/** 0..1 progress of x through [a, a + d], clamped. */
export const progress = (x: number, a: number, d: number) => c01((x - a) / d);
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
