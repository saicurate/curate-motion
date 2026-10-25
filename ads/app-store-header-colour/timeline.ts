// App Store header, direction D "Colour story": the two variants' moments, in seconds. Pure data,
// shared by the picture and shots.ts. Each variant is one 15 s loop (muted; its last frame is its first).

export const FPS = 60;
export const TOTAL = 15;

/** D1 "Colour rooms": a dolly through six lit colour rooms of her own clothes, then the six rooms become
 *  a palette beside her real Wardrobe. */
export const ROOMS = {
  /** "Your wardrobe, in every colour." over the cream room. */
  hook: 0.55,
  hookOut: 2.05,
  /** The dolly from one room to the next (cream → camel → sage → denim → navy → black). */
  moves: [2.4, 4.0, 5.6, 7.2, 8.8] as const,
  /** The black room shrinks into the sixth tile; the other five fly in beside it. */
  gather: 10.0,
  /** The phone fades up with her real Wardrobe (build 284). */
  phone: 10.5,
  /** "Every colour you own, in one place." */
  line: 10.75,
  /** Back: the line drops, the phone fades, five tiles leave, the cream tile opens into the cream room. */
  back: 13.25,
  /** The cream tile opens (eased, exact): whole again at 14.45, ≈0.55 s of rest before the loop point. */
  open: 13.5,
  openDur: 0.95,
} as const;

/** D2 "Colour wheel": her clothes on a slow carousel; the room's light takes the colour of whatever
 *  comes to the front; then they line up by colour beside her real Wardrobe. */
export const WHEEL = {
  hook: 0.55,
  hookOut: 2.05,
  /** The carousel steps one colour (two pieces, 60°) forward at each of these. */
  steps: [2.2, 3.7, 5.2, 6.7, 8.2] as const,
  /** The ring opens into two rows, by colour. */
  gather: 9.7,
  phone: 10.2,
  line: 10.45,
  back: 13.0,
  /** The rows fold back into the ring (eased, exact) and it takes its last step (300° → 360°). */
  ring: 13.35,
  ringDur: 1.2,
} as const;

/** D2 (quiet) "Tonal row": one hero at a time on a tonal sweep; as the next arrives, the last steps aside
 *  into a small row; then the six stand on their colour chips beside her real Wardrobe. */
export const ROW = {
  hook: 0.55,
  hookOut: 2.05,
  /** Room names in the left column from here. */
  labelFrom: 2.3,
  /** The next hero arrives (oat → sand → blush → sage → dusty blue → stone). */
  changes: [2.4, 4.0, 5.6, 7.2, 8.8] as const,
  /** The stone hero steps into the row; the chips rise; the stage turns Mist. */
  gather: 10.2,
  phone: 10.6,
  line: 10.85,
  back: 13.25,
  /** The oat knit comes back to the stage (eased, exact), whole by 14.5. */
  open: 13.5,
  openDur: 1.0,
} as const;
