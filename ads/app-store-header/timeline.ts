// App Store header: the three films' moments, in seconds. Pure data, shared by the picture and shots.ts.
// Each film is one 15 s loop (the header plays muted and loops; its last frame is its first).

export const FPS = 60;
export const TOTAL = 15;

/** Film A, "roll": her photos give up what she's wearing; it becomes her wardrobe. */
export const ROLL = {
  /** "Your closet is already in your photos." */
  hook: 0.9,
  /** The three pieces lift off their photos, centre first. */
  lift: [1.2, 1.8, 2.4] as const,
  /** The photos leave; the pieces gather into a row. */
  gather: 5.4,
  /** The phone fades up with her real wardrobe. */
  phone: 5.65,
  /** "Every item you own, from your photos." */
  line: 6.05,
  /** Back to the start: the line drops, the phone fades, the photos return and take their pieces back. */
  back: 12.2,
  /** The pieces have melted back into their photos by here (≈0.6 s of rest before the loop). */
  settle: 13.7,
} as const;

/** Film B, "tryon": the black tee flies onto her walk-to-work photo and the try-on wipes over her. */
export const TRYON = {
  line1: 0.9,
  /** The tee flies into the photo. */
  fly: 3.4,
  /** The light sweep: before → after. */
  sweep: 3.85,
  sweepDur: 1.25,
  /** The photo glides left; the phone fades up with Studio's real try-on. */
  slide: 6.3,
  line2: 6.9,
  /** Back: the phone fades, the photo returns, the sweep runs back up, the tee floats in again. */
  back: 11.6,
  unsweep: 12.5,
  teeBack: 13.4,
} as const;

/** Film C, "zee": Zee waves; his real chat answers "what do I wear on Monday"; the look rises. */
export const ZEE = {
  line1: 0.9,
  phone: 3.8,
  listen: 3.8,
  look: 6.2,
  happy: 6.2,
  back: 12.0,
  /** The hello again, ending on the rest pose (= frame 0). */
  hello2: 12.6,
} as const;
