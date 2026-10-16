// Demo 6 · "Satisfying sort": beats, cues, timing (pure data).
import type { Beat } from "../kit";

export const LENGTH = 11;
export const TRACK = "music.incompetech.chill-wave-kevin-macleod.v1";
/** 100 bpm; a downbeat (1.213 s in the track) lands on the first snap at 1.0 s. */
export const FROM = 0.213;

export const N = 49;
export const T = { first: 1.0, last: 7.9, shine: 8.1, close: 9.0 };
export const FLIGHT = 0.3;
/** Piece k lands at: slow at first, faster and faster, quantised to 16th notes (0.15 s) so the snaps groove. */
export const snapAt = (k: number) => {
  const raw = T.first + (T.last - T.first) * Math.pow(k / (N - 1), 0.62);
  return T.first + Math.round((raw - T.first) / 0.15) * 0.15;
};

export const BEATS: Beat[] = [
  { from: 0, to: T.first, label: "HOOK: the pile" },
  { from: T.first, to: T.shine, label: "THE SORT", transition: "each piece snaps into its colour slot, accelerating" },
  { from: T.shine, to: T.close, label: "PERFECT", transition: "shine sweep" },
  { from: T.close, to: LENGTH, label: "CLOSE" },
];

export const musicGain = (t: number) => (t < T.first ? 0.4 : 0.55);

const snaps = Array.from({ length: N }, (_, k) => snapAt(k));
export const CUES = [
  { t: 0.08, kind: "thud", gain: 0.8 },
  ...[...new Set(snaps)].flatMap((t) => [
    { t: t - FLIGHT, kind: "tick", gain: 0.35 },
    { t, kind: "snap", gain: 1.3 },
  ]),
  { t: T.shine, kind: "chime" },
  { t: T.close, kind: "land" },
] as const;
