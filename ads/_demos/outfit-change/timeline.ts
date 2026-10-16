// Demo 5 · "Outfit-change trend": beats, cues, timing (pure data).
import type { Beat } from "../kit";

export const LENGTH = 12;
export const TRACK = "music.incompetech.overcast-kevin-macleod.v1";
/** 120 bpm; from 0.51 s the changes (1.5, 4.5, 7.5 s) sit on beats, the last on a downbeat. */
export const FROM = 0.51;

/** The beat each hand-over-lens change lands on. */
export const CHANGES = [1.5, 4.5, 7.5];
export const COVER = 0.22; // the hand takes this long to cover the lens
export const T = { close: 10.2 };

export const BEATS: Beat[] = [
  { from: 0, to: CHANGES[0], label: "HOOK" },
  { from: CHANGES[0] - COVER, to: CHANGES[0] + 0.35, label: "CHANGE 1", transition: "hand over the lens, on the beat" },
  { from: CHANGES[0] + 0.35, to: CHANGES[1] - COVER, label: "LOOK 1: Date night (Zee's pick)" },
  { from: CHANGES[1] - COVER, to: CHANGES[1] + 0.35, label: "CHANGE 2", transition: "hand over the lens, on the beat" },
  { from: CHANGES[1] + 0.35, to: CHANGES[2] - COVER, label: "LOOK 2: coat + mini dress" },
  { from: CHANGES[2] - COVER, to: CHANGES[2] + 0.35, label: "CHANGE 3", transition: "hand over the lens, on the downbeat" },
  { from: CHANGES[2] + 0.35, to: T.close, label: "LOOK 3: work, drizzly tomorrow" },
  { from: T.close, to: LENGTH, label: "CLOSE" },
];

export const musicGain = () => 1;

export const CUES = [
  { t: 0.1, kind: "land" },
  ...CHANGES.flatMap((c) => [
    { t: c - COVER, kind: "whoosh", gain: 0.9 },
    { t: c, kind: "thud", gain: 1.2 },
    { t: c + 0.05, kind: "impact", gain: 0.6 },
    { t: c + 0.5, kind: "pop", gain: 0.7 },
  ]),
  { t: T.close, kind: "land" },
  { t: T.close + 0.35, kind: "chime" },
] as const;
