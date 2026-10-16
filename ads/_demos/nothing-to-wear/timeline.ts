// Demo 1 · "Nothing to wear": beats, sound cues and timing (pure data, shared by index.tsx and ../sound.ts).
import type { Beat } from "../kit";

export const LENGTH = 12;
export const TRACK = "music.incompetech.voxel-revolution-kevin-macleod.v1";
/** A downbeat (5.909 s in the track) lands on the burst at 4.6 s. */
export const FROM = 5.909 - 4.6;

export const T = { hook: 0, sigh: 1.5, phone: 3.2, tap: 4.0, burst: 4.6, launchEvery: 0.22, sorted: 8.6, close: 10 };

export const BEATS: Beat[] = [
  { from: 0, to: 1.5, label: "HOOK" },
  { from: 1.5, to: 3.2, label: "PROBLEM: she sighs" },
  { from: 3.2, to: 4.6, label: "SHE OPENS CURATE", transition: "phone rises into her hand, one tap" },
  { from: 4.6, to: 8.6, label: "THE MAGIC", transition: "clothes fly OUT of the phone and hang themselves on a rail" },
  { from: 8.6, to: 10, label: "PAYOFF: the sorted rail" },
  { from: 10, to: 12, label: "CLOSE" },
];

/** 14 pieces: 7 on the rail (they hang), 7 on the shelf below (they land). */
export const RAIL = ["blazer-black", "coat-trench-khaki", "jacket-denim", "dress-slip-champagne", "shirt-oxford-blue", "sweater-cable-knit-cream", "dress-little-black"].map((n) => `garment.emma.${n}.v1`);
export const SHELF = ["jeans-straight-light-wash", "skirt-midi-satin-camel", "trousers-black", "boots-ankle-black", "sneakers-leather-white", "bag-crossbody-tan", "heels-black"].map((n) => `garment.emma.${n}.v1`);
export const FLY = [...RAIL, ...SHELF].map((id, i) => ({ id, i, at: T.burst + 0.1 + i * T.launchEvery, rail: i < RAIL.length, slot: i < RAIL.length ? i : i - RAIL.length }));
export const FLIGHT = 0.55;

/** Music: quiet and flat under the problem, it kicks in when the app opens. */
export const musicGain = (t: number) => (t < T.burst ? 0.32 : 1);

export const CUES = [
  { t: 0.15, kind: "thud" },
  { t: 0.75, kind: "thud" },
  { t: 1.5, kind: "swish" },
  { t: 1.75, kind: "glide", gain: 1.2 },
  { t: 3.2, kind: "whoosh", gain: 0.7 },
  { t: 3.62, kind: "settle" },
  { t: T.tap, kind: "tick", gain: 1.4 },
  { t: T.burst, kind: "flood", gain: 1.2 },
  ...FLY.flatMap((f) => [
    { t: f.at, kind: "pop", gain: 0.7 },
    { t: f.at + FLIGHT, kind: f.rail ? "snap" : "land", gain: 0.8 },
  ]),
  { t: T.close, kind: "land" },
  { t: T.close + 0.35, kind: "chime" },
] as const;
