// Hook A, "Zee the critic": the clock (pure data, no React; Node runs it for the sound too).
// 8 s at 60 fps on the measured beat map of In My Back (kontraa, Pixabay; 130 BPM, grid fit ±7 ms):
// `tools/beats clip music.pixabay.in-my-back-kontraa.v1 --from 19.175 --length 8 --fps 60` (beatmap.ts).
// Frame 0 = 19.175 s in the track, so its drop (22.175 s) lands on 3.0 s. One beat 0.4615 s.
// Downbeats: 1.165 (the track's break: near-silence to ≈2.5 s, then a swell), 3.0 (THE DROP), 4.863, 6.704.
// Rules: state changes on beats, big moments on downbeats.
import { beatClockOf } from "../../motion/beatmap.ts";
import { BEATMAP } from "./beatmap.ts";

export const FPS = 60;
export const LENGTH = 8;
export const TOTAL = FPS * LENGTH;
export const TRACK = BEATMAP.track;
export const FROM_SEC = BEATMAP.fromSec;
export const clock = beatClockOf(BEATMAP);
const DROP = 3.0;
const BEAT = 60 / 130;
/** Seconds of beat n counted from the drop (n may be negative or fractional). */
export const b = (n: number) => DROP + n * BEAT;

/** The moments, in seconds. */
export const T = {
  // S1 the couch photo comes alive (from frame 0: no still first frame)
  title: b(-6), // 0.231: "POV: your cat has opinions about your outfit." rises, BEHIND her
  zeeJump: 1.165, // the break's downbeat: the music falls away and Zee hops up from behind her knee
  zeeLand: 1.48,
  stare: b(-2), // 2.077: Zee goes deadpan (focused, half-lidded)
  vertigoFrom: b(-2), // the reverse dolly-zoom builds under the track's swell
  titleOut: b(-1), // 2.538
  drop: DROP, // THE DROP: "girl… no."; the camera stops dead
  // S2 the real app, in the real iPhone (fades only: Apple's rules)
  toPhone: b(3), // 4.385
  footageFrom: 3.45, // seconds into footage.emma.look-card-landing.v1: the orbit settles, the card lands
  toSlay: b(7), // 6.231
  // S3 SLAY on the downbeat
  slay: 6.704,
  zeeCheer: b(9), // 7.154
  end: LENGTH,
};

/** Seconds a cross-fade takes (exponential, never a wipe or a push: Apple allows fades on its devices). */
export const FADE = 0.36;

/** The music under the picture: full, but it breathes out under the last 0.3 s (the ad carries on). */
export const musicGain = (t: number) => (t > LENGTH - 0.3 ? Math.max(0, (LENGTH - t) / 0.3) * 0.5 + 0.5 : 1);

/** The designed sound (sound.ts), on the same clock. */
export const CUES = [
  { t: T.title, kind: "land", gain: 0.5 },
  { t: T.zeeJump + 0.02, kind: "pop", gain: 0.9 },
  { t: T.zeeLand, kind: "thud", gain: 0.55 },
  { t: T.stare, kind: "tick", gain: 0.8 },
  { t: T.titleOut, kind: "swish", gain: 0.4 },
  { t: T.drop - 0.02, kind: "impact", gain: 1.1 },
  { t: T.drop + 0.2, kind: "land", gain: 0.8 },
  { t: T.toPhone, kind: "glide", gain: 0.7 },
  { t: T.toPhone + 0.45, kind: "settle", gain: 0.7 },
  { t: T.toSlay, kind: "whoosh", gain: 0.7 },
  { t: T.slay, kind: "impact", gain: 0.75 },
  { t: T.zeeCheer, kind: "pop", gain: 0.8 },
  { t: T.zeeCheer + 0.08, kind: "chime", gain: 0.8 },
] as const;
/** A low riser under the vertigo, cut dead on the drop. */
export const RISER: [number, number, number] = [T.vertigoFrom, T.drop, 0.32];
