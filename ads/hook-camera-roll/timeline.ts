// Hook B, "Your camera roll is secretly a closet": the clock (pure data; Node runs it for the sound too).
// 8 s at 60 fps on the measured beat map of Red Rabbit (Audiopanther, Pixabay; 124 BPM, grid fit ±9 ms):
// `tools/beats clip music.pixabay.red-rabbit-audiopanther.v1 --from 151.061 --length 8 --fps 60` (beatmap.ts).
// Two pieces of the one track: the DRIVE under the scroll (151.06 s on, its downbeat 152.961 lands on the
// freeze at 1.9 s, where the music cuts dead), then, from the peel, its BUILD (the bass-less break with rising
// hats), placed so the track's real drop (162.667 s) lands on 7.705 s, the window's last downbeat: the hook
// ends on the drop and the ad carries on. One beat 0.4839 s; downbeats 1.9, 3.839, 5.774, 7.705.
import { BEATMAP } from "./beatmap.ts";

export const FPS = 60;
export const LENGTH = 8;
export const TOTAL = FPS * LENGTH;
export const TRACK = BEATMAP.track;
/** Where the drive starts in the track (frame 0). */
export const FROM_SEC = BEATMAP.fromSec;
const BEAT = 60 / 124;
/** Beat n of the window's grid (beat 0 = the freeze's downbeat, 1.9 s). */
export const b = (n: number) => 1.9 + n * BEAT;

export const T = {
  // S1 THE SCROLL: her real camera roll, faster and faster
  scrollFrom: 0.0,
  topSpeedAt: 1.25, // the flick reaches full speed
  freeze: b(0), // 1.9, a downbeat: a hard stop ON her ferry photo; the music cuts dead
  dim: 1.98, // the other photos fall away
  zoomFrom: 2.15, // the ferry tile grows to fill the frame (matched to the 2.5D rest pose)
  zoomTo: b(2), // 2.868
  // S2 ALIVE: the photo becomes a place; the title rises BEHIND her
  title: b(2) + 0.04,
  titleOut: b(6), // 4.803: the line drops back into its masks as the peel takes the frame
  // S3 THE PEEL: her denim jacket lifts off her, slow, toward the camera; focus racks to it; the build rises
  peel: b(5), // 4.320
  peelTo: 7.6,
  drop: b(12), // 7.707: the track's real drop (the hook ends on it)
  end: 8.0,
};

/** The grid: 4 across, square tiles, 3 px gutters (the Photos app's own rhythm), full bleed. */
export const COLS = 4;
export const GAP = 3;
export const TILE = (1080 - GAP * (COLS - 1)) / COLS; // 267.75
export const ROW = TILE + GAP;
/** The row the ferry photo sits in, and where it stops on screen (its centre, px from the top). */
export const FERRY_ROW = 26;
export const FERRY_COL = 1;
export const STOP_Y = 860;
/** Total scroll distance (px) at the freeze: the ferry tile's centre lands on STOP_Y. */
export const TRAVEL = FERRY_ROW * ROW + TILE / 2 - STOP_Y;

const c01 = (x: number) => Math.max(0, Math.min(1, x));
// Speed shape 0..1: an accelerating flick (∝ t^2.2 up to full speed at topSpeedAt), full speed, nothing after
// the freeze. Its integral from 0 to T.freeze, in closed form (the ramp + the flat part):
const AREA = T.topSpeedAt / 3.2 + (T.freeze - T.topSpeedAt);
const integ = (t: number) => {
  const x = Math.min(t, T.freeze);
  if (x <= T.topSpeedAt) return (T.topSpeedAt * Math.pow(c01(x / T.topSpeedAt), 3.2)) / 3.2;
  return T.topSpeedAt / 3.2 + (x - T.topSpeedAt);
};
/** Scroll offset (px) at t, plus the catch: a 2.5% overshoot that springs back after the freeze. */
export const scrollAt = (t: number) => {
  const base = (integ(t) / AREA) * TRAVEL;
  if (t < T.freeze) return base;
  const k = t - T.freeze;
  return TRAVEL + 26 * Math.exp(-k / 0.06) * Math.sin(k * 26);
};
/** Speed (px per frame at 60 fps), for the motion blur's sample count. */
export const scrollSpeed = (t: number) => Math.abs(scrollAt(t + 1 / 120) - scrollAt(t - 1 / 120));

/** The second piece of the track: its build, from the peel, so its drop (162.667 s) lands on T.drop. */
export const BUILD = { at: T.peel, fromSec: 162.667 - (T.drop - T.peel) };

/** Music gains: the drive until the freeze (cut dead, 12 ms), silence, the build fading in from the peel. */
// (the drive is mastered hot: 0.75 keeps the true peak under −1 dBTP; the drop's transient is ducked for the same reason)
export const driveGain = (t: number) => 0.75 * (t < T.freeze ? 1 : Math.max(0, 1 - (t - T.freeze) / 0.012));
export const buildGain = (t: number) => (t < BUILD.at ? 0 : (1 - Math.exp(-(t - BUILD.at) / 0.35)) * (t >= T.drop - 0.02 ? 0.55 : 1));

/** Thumb flicks under the scroll, faster and faster (swishes), then the designed hits. */
export const FLICKS = [0.04, 0.46, 0.8, 1.06, 1.27, 1.44, 1.58, 1.69, 1.79];
export const CUES = [
  ...FLICKS.map((t, i) => ({ t, kind: "swish" as const, gain: 0.35 + 0.07 * i })),
  { t: T.freeze - 0.01, kind: "impact", gain: 1.0 },
  { t: T.freeze, kind: "snap", gain: 1.0 },
  { t: T.dim + 0.1, kind: "settle", gain: 0.6 },
  { t: T.zoomTo, kind: "glide", gain: 0.9 },
  { t: T.title, kind: "land", gain: 0.55 },
  { t: T.peel + 0.05, kind: "pop", gain: 0.5 },
  { t: T.peel + 0.55, kind: "whoosh", gain: 0.55 },
  { t: T.titleOut, kind: "swish", gain: 0.35 },
  { t: T.drop, kind: "impact", gain: 0.45 },
] as const;
