// One ad, many lengths. An ad is a list of scenes; each scene says which length variants it
// appears in and how many beats it lasts. planScenes() lays the kept scenes end to end on the
// beat clock and returns <Sequence> offsets. The hook and the end card are in every length.

export type Scene<K extends string = string> = {
  key: K;
  /** Length variants (seconds) this scene is in. */
  in: number[];
  /** Duration in beats (on the ad's BeatClock). */
  beats: number;
};

export type Planned<K extends string = string> = { key: K; from: number; durationInFrames: number };

export const planScenes = <K extends string>(scenes: Scene<K>[], lengthSec: number, perBeat: number, fps = 30): Planned<K>[] => {
  const kept = scenes.filter((s) => s.in.includes(lengthSec));
  const total = lengthSec * fps;
  let at = 0;
  const out: Planned<K>[] = [];
  kept.forEach((s, i) => {
    if (at >= total) return; // over-long plans are cut, never stretched past the length
    const last = i === kept.length - 1;
    const d = last ? total - at : Math.min(total - at, Math.round(s.beats * perBeat));
    out.push({ key: s.key, from: at, durationInFrames: d });
    at += d;
  });
  return out;
};
