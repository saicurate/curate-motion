// The App Store header, the one film: the moments, in seconds. Pure data. One 30 s loop (the App
// Store allows one header video, 5–30 s, muted, looping; the last frame runs into frame 0).

export const FPS = 60;
export const TOTAL = 30;

/** A, a faster cut of A2's picture: the whole idea lands inside 5 s (most people won't watch further).
 *  The line at 0.35 s; the coat, jacket and scarf lift one at a time; they gather beside her Wardrobe. */
export const A = { hook: 0.35, lift: [0.8, 1.55, 2.3], gather: 3.1, phone: 3.35, line: 3.7, back: 1e3, settle: 1e3 } as const;

/** The glides between beats: the camera trucks right on its own spring (C's rail camera) through a soft
 *  column of light; each lasts GLIDE_DUR (normalised so it lands exactly). The last one lands on frame 0. */
export const GLIDE = { ab: 6.3, bc: 13.0, cl: 24.3, la: 27.8 } as const;
export const GLIDE_DUR = 1.9;
/** How far the camera trucks in a glide (× H). */
export const PAN = 0.9;

/** Where B3 (ads/app-store-header-tryon, look "tonal") is when its glide starts: at rest, the tee
 *  hovering and "See it on you." up; the tee lifts (B's 1.6 s) as the glide settles. */
export const B0 = 0.4;
/** C2 subtle (ads/app-store-header-week, variant c2): Monday at its glide; its first step (C's 1.4 s)
 *  once the glide has settled; the week settled (C's ≈10.9 s) before the glide out. Its own small lockup
 *  (C's 10.3 s, the serif splash lockup) is covered by C itself at C_CLEAR, just after its lockup has
 *  faded out (C's 12.75–13.05 s) and before the row has moved (≈1.5% of its way back): the same stage, grain
 *  and shadow tails as the settled week. From C_EASE its clock eases out toward C_HOLD (before its line
 *  leaves at C's 12.68 s): a slow stop. */
export const C0 = 0.0;
export const C_CLEAR = 13.06;
export const C_EASE = 11.4;
export const C_HOLD = 12.3;

/** The lockup: the mark and "Curate" arrive on the glide; the app's own line rises once it has settled. */
export const LOCK = { line: 25.3 } as const;
