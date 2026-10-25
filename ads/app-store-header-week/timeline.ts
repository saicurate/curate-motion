// App Store header, direction C "A week of looks": the moments, in seconds. Pure data, shared by the
// picture and shots.ts. Each variant is one 15 s loop (the header plays muted and loops; its last frame
// is its first: Monday, full set, no line).

export const FPS = 60;
export const TOTAL = 15;

/** C1 "flip": each day is the whole frame, the next set pushes in from the right. */
export const FLIP = {
  /** "A look for every day." */
  line: 0.9,
  /** Mon→Tue … Sat→Sun: the strip glides the next set in (camera spring, ≈1.2 s to settle). */
  push: [1.4, 2.75, 4.1, 5.45, 6.8, 8.15] as const,
  /** Sunday shrinks into its card; the week rises around it. */
  week: 10.0,
  /** The Curate lockup under the week. */
  mark: 11.0,
  /** The line drops; the others leave; Monday grows back to the whole frame on the camera spring (settled ≈ 15). */
  back: 13.0,
} as const;

/** C2 "rail": the seven sets as cards on a rail; the camera glides a card a step. */
export const RAIL = {
  line: 0.9,
  /** Mon→Tue … Sat→Sun: the camera glides one card. */
  step: [1.4, 2.65, 3.9, 5.15, 6.4, 7.65] as const,
  /** The camera pulls back: the whole week, on the house Mist. */
  week: 9.2,
  mark: 10.3,
  /** The line drops; the camera pushes back into Monday (camera spring, settled ≈ 15). */
  back: 13.0,
} as const;
