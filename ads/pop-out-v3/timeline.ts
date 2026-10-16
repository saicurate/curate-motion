// Pop out v3: the clock. Every time here comes from the measured beat map (beatmap.ts, made by
// `tools/beats clip music.mixkit.cat-walk-arulo.v1 --from 29.536 --length 15 --fps 60`), so the
// picture (index.tsx), the stills (shots.ts) and the designed sound (sound.ts, at G5) agree.
// Pure data, no React or Remotion: Node runs it too.
//
// Cat Walk, 130.00 BPM (grid fit ±8 ms), frame 0 = the drop's downbeat at 29.536 s in the file.
// One beat 0.4615 s, one bar 1.846 s; 15 s = 32.5 beats. Downbeats (s): 0, 1.846, 3.703, 5.532,
// 7.384, 9.23, 11.064, 12.927, 14.762 (the track's own break, −7 dB: the loop's breath).
// Rules: state changes on beats, big moments on downbeats, whooshes on the bar-end hits
// (1.625, 3.471, 5.317, 7.163, 9.009, 10.855, 12.701, 14.547: the clap into each downbeat).
import { beatClockOf } from "../../motion/beatmap.ts";
import { BEATMAP } from "./beatmap.ts";

export const FPS = 60;
export const LENGTH = 15;
export const TOTAL = FPS * LENGTH; // 900
export const FROM_SEC = BEATMAP.fromSec;
export const clock = beatClockOf(BEATMAP);
/** Seconds of beat n (n may be fractional). */
export const b = (n: number) => clock.beat(n);
/** Seconds of downbeat (bar) k. */
export const D = (k: number) => BEATMAP.downbeats[k];

/** The moments, in seconds. Names say what changes; every one sits on a beat or a hit. */
export const T = {
  // S1 HOOK
  lift: D(0), // the denim jacket lifts out of her photo (piece)
  line1: b(2), // "Your closet is already in your camera roll." lands (headline)
  // S2 PROBLEM
  home: D(1), // the jacket settles home; the camera glides back: the photo is one of many (camera)
  // S3 REVEAL
  line1Out: D(2), // the line leaves; the camera glides into the market photo (camera)
  intoTile: D(2),
  phoneForms: b(9), // the tile becomes the app's photo card; the phone settles round it (panel)
  footageIn: b(10), // the real app takes over under matched geometry
  pulls: D(3), // the real app lifts her Ballet Flats out of the photo (the app's own moment)
  line2: b(13), // "Curate pulls it out." lands (headline)
  // S4 PROOF
  line2Out: b(17),
  screenChange: b(17), // the real review screen rises in the phone (panel)
  count41: D(5), // the real count lands on 41; the camera pushes in on it (camera)
  // S5 CLOSE
  phoneOut: D(6), // the phone leaves (panel); the mark arrives (ui)
  name: b(25), // "Curate" (headline)
  cta: b(26), // "On the App Store" (ui): the CTA, held 2.29 s
  zee: D(7), // Zee pops up and bounces (mascot)
  loopOut: b(31), // the lockup lifts; her ferry photo rises back into frame 0 (panel)
  breakdown: D(8), // the track breaks: −7 dB
} as const;

/** Real footage: which clip, from which source second, over which output seconds (real speed; past
 * the clip's end its last frame holds). */
export const FOOTAGE = [
  { id: "footage.emma.first-piece-lift.v1", from: 0.35, start: T.footageIn, end: T.screenChange + 0.45, durationSec: 4.7 },
  // the clip is 3.6 s: from 10.53 s its own last frame holds (the real screen, still)
  { id: "footage.emma.review-count-up.v1", from: 0.92, start: T.screenChange, end: T.phoneOut + 0.5, durationSec: 3.6 },
] as const;
/** Seconds of real app footage the viewer sees, big (the brief asks for ≥ 3 s). */
export const REAL_APP_SECONDS = T.phoneOut - T.footageIn; // ≈ 6.4 s

/** The designed sound's cues (motion/sound HIT_KINDS), for G5. Kicks go on every beat. */
export const CUES = [
  { t: T.lift, kind: "pop" },
  { t: T.line1, kind: "land" },
  { t: 1.625, kind: "glide" }, // the bar-end hit, into the glide back
  { t: T.home, kind: "settle" },
  { t: 3.471, kind: "glide" },
  { t: T.phoneForms, kind: "settle" },
  { t: T.pulls, kind: "pop" },
  { t: T.line2, kind: "land" },
  { t: T.screenChange, kind: "swish" },
  { t: T.count41, kind: "impact", gain: 1 }, // G5 (round 10): 0.6 → 1, so the proof's downbeat shows blindfolded
  { t: 10.855, kind: "whoosh" },
  { t: T.phoneOut + 0.15, kind: "settle", gain: 0.7 }, // G5: the mark lands as the phone has gone
  { t: T.name, kind: "land" },
  { t: T.cta, kind: "chime" },
  { t: T.zee, kind: "pop" },
  { t: T.loopOut + 0.18, kind: "glide" }, // G5: peaks as her photo rises back (it starts 0.13 s after the lockup leaves)
] as const;
/** A riser into the proof's downbeat (the big moment). */
export const RISER = [T.screenChange, T.count41] as const;
/** G5 (round 10): the riser's gain (0.42 → 0.75: the build must show in the waveform, the blindfold test). */
export const RISER_GAIN = 0.75;
/** G5 (rounds 10–11): the music's own gain over time (× the ad's volume), so the build into the
 * proof has a shape you can see blindfolded: from the review sheet (7.85 s) the music sinks 6 dB in
 * about 0.3 s (exponential) and the riser climbs alone over it; on the proof's downbeat (9.23 s) the
 * music is back in full with the impact. Pure function of t (seconds from frame 0). */
export const musicGain = (t: number) => {
  if (t >= T.count41 || t < T.screenChange) return 1;
  const k = 1 - Math.exp(-(t - T.screenChange) / 0.1); // 95% of the way down by 0.3 s
  return 1 - 0.5 * k;
};
