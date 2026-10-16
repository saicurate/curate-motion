// Demo 4 · "Speed run": beats, cues, timing (pure data).
import type { Beat } from "../kit";

export const LENGTH = 12;
export const TRACK = "music.incompetech.laserpack-kevin-macleod.v1";
/** The track's lift (89.08 s) lands on the finish (9.0 s). */
export const FROM = 89.083 - 9.0;

export const T = { start: 0.3, finish: 9.0, close: 10.4 };
export const N = 49;
/** The run's clock on screen: 0:00 → 2:58, accelerating (a time-lapse). */
export const GAME_END = 178;
export const runP = (t: number) => Math.max(0, Math.min(1, (t - T.start) / (T.finish - T.start)));
export const gameTime = (t: number) => GAME_END * Math.pow(runP(t), 1.8);
export const countAt = (t: number) => Math.min(N, Math.floor(N * Math.pow(runP(t), 1.6) + 1e-6));
/** When piece k (0-based) lands: the inverse of countAt. */
export const landAt = (k: number) => T.start + (T.finish - T.start) * Math.pow((k + 1) / N, 1 / 1.6);
export const FALL = 0.35;

export const BEATS: Beat[] = [
  { from: 0, to: 1.2, label: "HOOK" },
  { from: 1.2, to: T.finish, label: "THE RUN", transition: "pieces rain into the grid, faster and faster" },
  { from: T.finish, to: T.close, label: "FINISH", transition: "timer slam + flash on the drop" },
  { from: T.close, to: LENGTH, label: "CLOSE" },
];

export const musicGain = (t: number) => (t < T.finish ? 0.75 : 1);

export const CUES = [
  { t: 0.05, kind: "impact", gain: 0.8 },
  { t: T.start, kind: "tick", gain: 1.5 },
  ...Array.from({ length: N }, (_, k) => ({ t: landAt(k), kind: "tick", gain: 0.9 })),
  { t: T.finish - 0.02, kind: "impact", gain: 1.2 },
  { t: T.finish + 0.4, kind: "land" },
  { t: T.close, kind: "land" },
  { t: T.close + 0.35, kind: "chime" },
] as const;
