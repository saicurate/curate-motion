import { asset } from "./assets";

// BPM → frames. Every cut, pop and slam is placed on a beat, never on a hand-typed frame.
// A clock is built from a music asset (its bpm, first downbeat and named sections) plus the
// second of the track the ad starts at (`fromSec`), so "beat 0" is the first beat on screen.

export type BeatClock = {
  bpm: number;
  fps: number;
  /** Frames per beat (float). */
  perBeat: number;
  /** Video frame of beat n (n may be fractional: 0.5 = the off-beat). */
  frame: (n: number) => number;
  /** Video frame of bar b, beat n within it. */
  bar: (b: number, n?: number) => number;
  /** Beat index at a video frame (float). */
  beatAt: (frame: number) => number;
  /** Video frame of a named section of the track ("drop"), or null if it falls before the ad starts. */
  section: (name: string) => number | null;
  /** Seconds into the track file at video frame 0 (pass to <Track>). */
  fromSec: number;
};

type MusicLike = { bpm?: number; offsetSec: number; beatsPerBar?: number; sections?: Record<string, number>; beats?: number[] };

export const beatClock = (music: MusicLike, fromSec: number, fps = 30): BeatClock => {
  if (!music.bpm) throw new Error("This track has no bpm yet: measure it (tools/beats.py) and set bpm + beatGrid in its manifest.");
  const spb = 60 / music.bpm;
  const perBar = music.beatsPerBar ?? 4;
  // first beat at or after fromSec
  const k0 = Math.ceil((fromSec - music.offsetSec) / spb - 1e-6);
  const firstBeatSec = music.offsetSec + k0 * spb - fromSec; // video seconds
  const explicit = music.beats?.filter((t) => t >= fromSec).map((t) => t - fromSec);
  const frame = (n: number) => {
    if (explicit && Number.isInteger(n) && n >= 0 && n < explicit.length) return Math.round(explicit[n] * fps);
    return Math.round((firstBeatSec + n * spb) * fps);
  };
  return {
    bpm: music.bpm,
    fps,
    perBeat: spb * fps,
    frame,
    bar: (b, n = 0) => frame(b * perBar + n),
    beatAt: (f) => (f / fps - firstBeatSec) / spb,
    section: (name) => {
      const t = music.sections?.[name];
      if (t === undefined || t < fromSec) return null;
      return Math.round((t - fromSec) * fps);
    },
    fromSec,
  };
};

/** A clock straight from a music asset id. */
export const clockFor = (trackId: string, fromSec: number, fps = 30) => beatClock(asset<MusicLike>(trackId).asset, fromSec, fps);
