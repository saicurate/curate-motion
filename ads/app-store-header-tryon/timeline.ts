// App Store header, film B "See it on you" (v2 of ads/app-store-header's tryon): the moments, in seconds.
// Pure data, shared by the picture and shots.ts. One 15 s loop: the last frame is the first (the header
// plays muted and loops).

export const FPS = 60;
export const TOTAL = 15;

export const T = {
  /** "See it *on you.*": up at the loop point (frame 0 is the poster frame) and through the reveal; it
   *  hands over to the second line as the phone rises, and lands again while the edge runs back up. */
  line1Out: 5.0,
  line1Back: 11.05,
  /** The tee gathers itself (a small lift), then flies into her photo and lands on her. */
  lift: 1.6,
  fly: 1.86,
  /** The camera starts its push into the photo as the tee goes. */
  push: 1.86,
  /** The light edge runs down the print: before → after. */
  sweep: 2.16,
  sweepDur: 1.12,
  /** The print slides aside; the phone rises with Studio showing that very try-on. */
  slide: 5.0,
  line2: 5.32,
  /** Back: the line drops, the phone sinks, the print returns. */
  back: 10.6,
  printBack: 10.9,
  /** The light edge runs back up: after → before. */
  unsweep: 11.45,
  unsweepDur: 1.05,
  /** Her stripes are back: the tee floats in from the right to its place beside her (rest = frame 0 by ≈13.1 s). */
  teeBack: 12.5,
} as const;
