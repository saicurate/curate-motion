// Demo 2 · "Your camera roll is secretly a closet": beats, cues, timing (pure data).
import type { Beat } from "../kit";

export const LENGTH = 11;
export const TRACK = "music.incompetech.kick-shock-kevin-macleod.v1";
/** The freeze (3.6 s) sits on a downbeat (9.57 s in the track); the music comes back 7 beats later. */
export const FROM = 9.57 - 3.6;

export const T = { freeze: 3.6, zoomed: 3.95, peel: 4.1, fly: 6.64, slot: 7.1, count: 8.1, close: 8.9 };

export const BEATS: Beat[] = [
  { from: 0, to: 1, label: "HOOK" },
  { from: 1, to: T.freeze, label: "THE SCROLL", transition: "speed-ramped thumb scroll, motion blur" },
  { from: T.freeze, to: T.peel, label: "FREEZE", transition: "hard stop on the beat, music cut, flash, punch-in" },
  { from: T.peel, to: T.fly, label: "THE PEEL", transition: "her jacket peels off her into 3D" },
  { from: T.fly, to: T.close, label: "INTO THE CLOSET", transition: "it flies into an empty slot; the grid fills" },
  { from: T.close, to: LENGTH, label: "CLOSE" },
];

/** Scroll offset (px in the 1080-wide frame) at t: accelerating, landing exactly with her ferry photo centred. */
export const ROW = 360;
export const TARGET_TILE = 85; // tile 85 = photo 25 (r26-ferry), row 28, middle column
export const scrollAt = (t: number) => {
  const x = Math.min(t, T.freeze);
  const raw = 800 * x + (5200 * x * x * x) / (3 * T.freeze * T.freeze);
  const rawEnd = 800 * T.freeze + (5200 * T.freeze) / 3;
  return (raw / rawEnd) * (28 * ROW + ROW / 2 - 960);
};
export const scrollSpeed = (t: number) => (t >= T.freeze ? 0 : (scrollAt(t + 1 / 60) - scrollAt(t)) * 60);

/** Thumb flicks: faster and faster. */
export const FLICKS = [0.1, 0.55, 0.95, 1.3, 1.6, 1.88, 2.13, 2.36, 2.57, 2.76, 2.94, 3.1, 3.25, 3.38, 3.5];

export const musicGain = (t: number) => (t >= T.freeze && t < T.fly ? 0 : 1);

export const CUES = [
  ...FLICKS.map((t) => ({ t, kind: "swish", gain: 0.8 })),
  { t: T.freeze - 0.02, kind: "impact", gain: 1.1 },
  { t: T.freeze, kind: "snap", gain: 1.2 },
  { t: T.zoomed, kind: "settle" },
  { t: T.peel + 0.2, kind: "rise", gain: 1.3 },
  { t: T.peel + 0.9, kind: "draw" },
  { t: T.peel + 1.6, kind: "pop" },
  { t: T.fly, kind: "whoosh" },
  { t: T.slot, kind: "land", gain: 1.2 },
  ...Array.from({ length: 12 }, (_, i) => ({ t: T.slot + 0.1 + i * 0.07, kind: "pop", gain: 0.5 })),
  { t: T.count, kind: "land" },
  { t: T.close, kind: "land" },
  { t: T.close + 0.35, kind: "chime" },
] as const;
