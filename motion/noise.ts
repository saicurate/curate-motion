// motion/noise.ts: seeded randomness for pictures and sound. The render contract (decisions/0011):
// every frame comes from time alone, so there is no Math.random, no Date, no timers. Anything that
// should look random is a pure function of (seed, index) or (seed, time).

/** A 32-bit integer hash of (seed, i): the same inputs give the same output, everywhere. */
export const hash = (seed: number, i: number): number => {
  let h = (Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(i | 0, 0x85ebca77)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
};

/** A float in [0, 1) from (seed, i). */
export const rand01 = (seed: number, i: number) => hash(seed, i) / 4294967296;
/** A float in [-1, 1) from (seed, i). */
export const randSigned = (seed: number, i: number) => rand01(seed, i) * 2 - 1;

/** A stream of floats in [0, 1) (mulberry32), for code that draws many numbers in a fixed order. */
export const stream = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10); // quintic: C2-smooth

/** Smooth 1D value noise in [-1, 1] at time t (one feature per unit of t). Pure. */
export const noise1 = (seed: number, t: number) => {
  const i = Math.floor(t);
  const u = fade(t - i);
  const a = randSigned(seed, i);
  const b = randSigned(seed, i + 1);
  return a + (b - a) * u;
};

/** Fractal noise: `octaves` layers of noise1, each twice as fast and half as strong. */
export const fbm1 = (seed: number, t: number, octaves = 3) => {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise1(seed + o * 101, t * f);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
};
