// motion/beatmap.ts: an ad's window onto a track's measured beat map (decisions/0011, proposed).
// Pure data and functions, no Remotion import, so an ad's index.tsx (picture) and sound.ts
// (designed sound, run by Node) read the same clock.
//
// Make one with `tools/beats clip <music-id> --from <s> --length <s> --fps 60 --out ads/<ad>/beatmap.ts`:
// it writes the beats, downbeats and hits that fall inside the ad, in seconds from frame 0.
//
// The rules it serves: state changes go ON BEATS, big moments ON DOWNBEATS, clicks and whooshes ON
// HITS. Place things with these helpers, never with hand-typed frames.

export type AdBeatMap = {
  track: string;
  /** Seconds into the track file at frame 0. */
  fromSec: number;
  lengthSec: number;
  fps: number;
  bpm: number;
  /** Seconds from frame 0. beats[0] is the first beat at or after frame 0. */
  beats: number[];
  downbeats: number[];
  /** [seconds from frame 0, strength 0..1] */
  hits: [number, number][];
  /** Loudness (dB) of each bar that starts inside the ad, and the measured sections. */
  bars: { t: number; db: number }[];
  sections: { t: number; kind: string; db: number }[];
};

export const beatClockOf = (m: AdBeatMap) => {
  const spb = 60 / m.bpm;
  /** Seconds of beat n (fractional n = between beats, on the measured grid). */
  const beat = (n: number) => {
    const i = Math.floor(n);
    const f = n - i;
    const at = (k: number) => (k >= 0 && k < m.beats.length ? m.beats[k] : m.beats[0] + k * spb);
    return f === 0 ? at(i) : at(i) + f * (at(i + 1) - at(i));
  };
  /** Index of the beat that is downbeat number b (bar b's beat 1) in `beats`. */
  const barBeat = (b: number) => {
    const t = m.downbeats[b];
    if (t === undefined) throw new Error(`bar ${b} is outside the ad (it has ${m.downbeats.length} bars)`);
    let best = 0;
    for (let k = 0; k < m.beats.length; k++) if (Math.abs(m.beats[k] - t) < Math.abs(m.beats[best] - t)) best = k;
    return best;
  };
  return {
    spb,
    fps: m.fps,
    beat,
    /** Seconds of bar b, beat n within it (bars counted from the first downbeat in the ad). */
    bar: (b: number, n = 0) => beat(barBeat(b) + n),
    /** Frame (rounded) of a time in seconds. */
    frame: (sec: number) => Math.round(sec * m.fps),
    /** Seconds → nearest beat index (float, from the grid). */
    beatAt: (sec: number) => (sec - m.beats[0]) / spb,
    /** The strongest hit within ±tol s of t, or null. */
    hitNear: (t: number, tol = 0.06) => {
      let best: [number, number] | null = null;
      for (const h of m.hits) if (Math.abs(h[0] - t) <= tol && (!best || h[1] > best[1])) best = h;
      return best;
    },
    /** Is t on a beat (within tol s)? On a downbeat? */
    onBeat: (t: number, tol = 1 / 60) => m.beats.some((b) => Math.abs(b - t) <= tol),
    onDownbeat: (t: number, tol = 1 / 60) => m.downbeats.some((b) => Math.abs(b - t) <= tol),
  };
};
export type AdClock = ReturnType<typeof beatClockOf>;
