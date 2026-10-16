// Demo 3 · "Zee the critic": beats, cues, timing (pure data).
import type { Beat } from "../kit";

export const LENGTH = 12;
export const TRACK = "music.incompetech.sneaky-snitch-kevin-macleod.v1";
/** A downbeat (4.139 s in the track) lands on the reaction at 3.0 s; the beat is 0.69 s. */
export const FROM = 4.139 - 3.0;

export const T = { walk: 0.05, scan: 1.0, react: 3.0, swap: 4.38, taps: [5.07, 5.75, 6.44, 7.13], slay: 7.82, proof: 8.4, close: 9.9 };

export const BEATS: Beat[] = [
  { from: 0, to: T.scan, label: "HOOK", transition: "Zee walks in" },
  { from: T.scan, to: T.react, label: "ZEE LOOKS HER UP AND DOWN" },
  { from: T.react, to: T.swap, label: "MEME REACTION", transition: "punch-in + shake + record-scratch stop" },
  { from: T.swap, to: T.slay, label: "THE SWAP", transition: "paw tap: the piece flips out, Zee's pick flips in (×4, on the beat)" },
  { from: T.slay, to: T.close, label: "SLAY + PROOF", transition: "the real look card slides in" },
  { from: T.close, to: LENGTH, label: "CLOSE" },
];

/** Music stops dead for the deadpan. */
export const musicGain = (t: number) => (t >= T.react && t < T.swap ? 0 : t >= T.close ? 0.8 : 1);

export const CUES = [
  { t: 0.15, kind: "pop", gain: 0.5 },
  { t: 0.45, kind: "pop", gain: 0.5 },
  { t: 0.75, kind: "pop", gain: 0.5 },
  { t: T.scan + 0.1, kind: "draw" },
  { t: T.scan + 1.0, kind: "draw" },
  { t: T.react - 0.02, kind: "suck", gain: 1.2 },
  { t: T.react, kind: "impact", gain: 1.1 },
  { t: T.react + 0.15, kind: "land" },
  ...T.taps.flatMap((t) => [
    { t, kind: "tick", gain: 1.4 },
    { t: t + 0.12, kind: "flips", gain: 0.7 },
    { t: t + 0.3, kind: "snap", gain: 1.0 },
  ]),
  { t: T.slay, kind: "impact", gain: 0.8 },
  { t: T.slay + 0.05, kind: "chime" },
  { t: T.proof, kind: "swish" },
  { t: T.close, kind: "land" },
  { t: T.close + 0.35, kind: "chime" },
] as const;
