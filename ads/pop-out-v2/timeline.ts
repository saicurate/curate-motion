// Pop out v2: the beat map, shared by the picture (index.tsx) and the designed sound (sound.ts),
// so every hit lands on the frame its transformation does. Pure data, no imports (Node runs it too).
//
// Cat Walk (music.mixkit.cat-walk-arulo.v1), measured 2026-10-15 over 29.3–44 s of the file:
// 130.00 BPM, the drop's kick onset at 29.545 s (comb fit of the kick band, then the transient
// itself read off the envelope). So frame 0 = beat 0 = the drop, and 15 s = 32.5 beats:
// 8 bars of 4 and half a beat. The track breaks down at 43.85 s (beat 31).

export const FPS = 30;
export const BPM = 130;
export const FROM_SEC = 29.545;
export const PER_BEAT = (FPS * 60) / BPM; // 13.846 frames
export const TOTAL = 450; // 15 s
export const LAST = TOTAL - 1;

/** Frame (float) of beat n. Beat 0 is frame 0. */
export const B = (n: number) => n * PER_BEAT;

/** The bars, in plain words (README › Beat map). */
export const BARS = [
  { bar: 1, beats: [0, 3], name: "Hook", what: "her pieces outline and pop out of her photos, one colour a beat" },
  { bar: 2, beats: [4, 7], name: "Kinetic type", what: "“Your closet / is already in / your / photos.” one beat a line" },
  { bar: 3, beats: [8, 11], name: "Shape morph", what: "type → one line; the sage outline → the scan's grid; the line → the phone" },
  { bar: 4, beats: [12, 15], name: "UI moment", what: "the real scan, entered through her photo's tiles; Zee's magnifier" },
  { bar: 5, beats: [16, 19], name: "2D → 3D", what: "the scan's tiles fold, lift and flip into the Wardrobe's tiles" },
  { bar: 6, beats: [20, 23], name: "UI moment", what: "her real Wardrobe, one scroll on every beat; the riser builds" },
  { bar: 7, beats: [24, 27], name: "Strongest", what: "the camera orbits forward; her pieces rise out of the screen, a row a beat" },
  { bar: 8, beats: [28, 32.5], name: "End title", what: "the denim jacket collapses into the star; the mark, Curate, On the App Store, Zee; through the star back to the first frame" },
] as const;

/** Designed sound: what plays where (beats). Kicks are added on every beat by sound.ts. */
export type Hit = { beat: number; kind: "pop" | "draw" | "flood" | "type" | "whoosh" | "snap" | "thud" | "flips" | "swish" | "impact" | "rise" | "suck" | "chime" | "tick" };
export const HITS: Hit[] = [
  // bar 1: outline (draw) on the beat, the pop on the and
  { beat: 0, kind: "draw" }, { beat: 0.5, kind: "pop" },
  { beat: 1, kind: "flood" }, { beat: 1.5, kind: "pop" },
  { beat: 2, kind: "flood" }, { beat: 2.5, kind: "pop" },
  { beat: 3, kind: "draw" }, { beat: 3.5, kind: "pop" },
  // bar 2: a line of type a beat
  { beat: 4, kind: "type" }, { beat: 5, kind: "type" }, { beat: 6, kind: "type" }, { beat: 7, kind: "type" },
  // bar 3
  { beat: 8, kind: "whoosh" }, { beat: 8, kind: "snap" }, { beat: 9, kind: "snap" }, { beat: 10, kind: "whoosh" }, { beat: 10.5, kind: "thud" }, { beat: 11, kind: "flips" },
  // bar 4: the scan's own moves
  { beat: 13, kind: "tick" }, { beat: 15, kind: "tick" },
  // bar 5: fold, lift, flip, land
  { beat: 16, kind: "snap" }, { beat: 16.5, kind: "whoosh" }, { beat: 17, kind: "flips" }, { beat: 18, kind: "thud" },
  // bars 5–6: a scroll on every beat
  { beat: 19, kind: "swish" }, { beat: 20, kind: "swish" }, { beat: 21, kind: "swish" }, { beat: 22, kind: "swish" }, { beat: 23, kind: "swish" },
  // bar 7: the strongest bar
  { beat: 24, kind: "impact" }, { beat: 25, kind: "whoosh" }, { beat: 26, kind: "whoosh" }, { beat: 27, kind: "rise" },
  // bar 8
  { beat: 28, kind: "suck" }, { beat: 28, kind: "impact" }, { beat: 28.5, kind: "draw" }, { beat: 29, kind: "type" }, { beat: 29.5, kind: "type" },
  { beat: 30, kind: "pop" }, { beat: 31, kind: "chime" }, { beat: 31.5, kind: "whoosh" },
];
/** The riser runs from RISER[0] to RISER[1] (beats), into the strongest bar. */
export const RISER = [20, 24] as const;
