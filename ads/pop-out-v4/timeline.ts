// Pop out v4: the moments, in seconds, on Cat Walk's measured beat map (beatmap.ts: 130 BPM, from its drop;
// bars at 0, 1.846, 3.703, 5.532, 7.384, 9.23, 11.064, 12.927, 14.762). Pure data, shared by the picture,
// the shot list and (at G5) the sound.
//
// The header's world (ads/app-store-header-all, the founder: "perfect the header video is soo good") in 9:16:
// her photos on a tonal ground give up what she's wearing; her camera roll; the phone with the REAL build-284
// scan (her photos sorted, her items found, the landing in her rails); the pan through the light to the
// lockup; her photos glide back in, so the last frame is the first.

export const W = 1080;
export const H = 1920;
export const FPS = 60;
export const TOTAL = 15;

export const T = {
  // HOOK (bar 1): the three pieces lift off her three photos, one a beat, the ground warming to each photo's tone
  lift: [0.0, 0.47, 0.923] as const,
  line1: 0.923,
  // PROBLEM (bar 2): the camera glides back; her three photos are three of thirty in her camera roll
  pull: 1.846,
  // REVEAL (bars 3–4): the pieces glide to rest at the left; the roll recedes; then the phone fades up with the real scan
  phone: 3.703,
  /** The pieces leave their cells on the hit before the bar, so they are clear of the phone's place before it fades up. */
  rest: 3.471,
  line2: 4.168,
  // PROOF (bars 5–6): the camera pushes into the phone; the landing; "Added 14 wardrobe items from 7 photos"
  push: 7.384,
  line3: 9.23,
  // CLOSE (bars 7–8): the pan through the light to the lockup; the line; the CTA held; her photos glide back
  out: 11.064,
  lockLine: 11.552,
  /** "On the App Store" is held 2.19 s before the glide back (the process: a readable CTA ≥ 2 s). */
  cta: 12.01,
  back: 14.2,
} as const;

/** The camera moves: the camera spring, normalised so each lands exactly at its length. */
export const PULL_DUR = 1.4;
export const PUSH_DUR = 1.8;
export const OUT_DUR = 1.8;
export const BACK_DUR = 0.8;

export const SCAN = "footage.emma.b284-scan-sort-fan-land.v1";

/** One cut of the recording: from → to in the clip's seconds; xf = the cross-fade into it (s). */
export type Cut = { id: string; from: number; to: number; xf?: number };
/** The scan at real speed (read from its frames, 0.5 s apart): the sort (her photos to the right-hand pile,
 *  everyday photos to the left), her photos fanned while her items are found, then the landing: the card
 *  sinks, her rails rise, "Added 14 wardrobe items from 7 photos". */
export const CUTS: Cut[] = [
  { id: SCAN, from: 2.0, to: 4.3 },
  { id: SCAN, from: 8.75, to: 10.25, xf: 0.2 },
  { id: SCAN, from: 13.2, to: 17.6, xf: 0.2 },
];

/** Where each cut starts on the film's clock: the first at T.phone, each overlapping the one before by its xf. */
export const cutStarts = () => {
  const out: number[] = [];
  let at = T.phone;
  for (const c of CUTS) {
    at -= c.xf ?? 0;
    out.push(at);
    at += c.to - c.from;
  }
  return out;
};
