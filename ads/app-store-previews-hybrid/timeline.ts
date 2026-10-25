// The App Store previews, hybrid (2026-10-24): the moments, in seconds, and the cuts of the real build-284
// recordings that play in the phone. Pure data, shared by the picture and the shot list.
//
// Every film: an opener in the header's world with the phone already standing in it (the app is on
// screen from frame 0) → one camera push into the phone (GLIDE_DUR) → the real app at hero size → a pan
// through the light to the lockup (OUT_DUR) → the lockup's hold.

export const W = 886;
export const H = 1920;
export const FPS = 30;

/** The phone at hero size (its body ends 64 px above the bottom edge, as the screen-recording cuts),
 *  and in the opener: smaller, whole, in the lower right (or centred, under the rail). */
export const HERO_W = 712;
export const OPEN_W = 410;

/** The push into the phone, and the pan to the lockup: the camera spring, normalised to land exactly. */
export const GLIDE_DUR = 1.8;
export const OUT_DUR = 1.8;

/** One cut of a recording: from → to in the clip's seconds; xf = the cross-fade into it (s). */
export type Cut = { id: string; from: number; to: number; xf?: number };

export type FilmN = 1 | 2 | 3;
export type Film = {
  n: FilmN;
  name: string;
  /** The opener's line (up at once, drops as the camera goes in) and the app's (rises as the phone lands). */
  line1: string;
  line2: string;
  /** The push into the phone starts; the pan to the lockup starts; the film ends. */
  glide: number;
  out: number;
  total: number;
  /** The opener phone's centre (width OPEN_W). */
  open: { x: number; y: number };
  cuts: Cut[];
};

export const SCAN = "footage.curate.b284-scan-sort-land.v2";
export const STUDIO = "footage.emma.b284-studio-tryon-b284.v3";
export const TODAY = "footage.emma.b284-today-look-scroll.v2";
export const CHAT = "footage.emma.b284-chat-art-fair.v2";

/** The opener phone: 410 wide, its body ending 64 px above the bottom edge. */
const OPEN_Y = 1856 - (OPEN_W * (2959 / 1428)) / 2;

export const FILMS: Film[] = [
  {
    n: 1,
    name: "closet",
    line1: "Your closet,\n*from your photos.*",
    line2: "Every item,\n*found and sorted.*",
    glide: 2.5,
    out: 13.0,
    total: 16.9,
    open: { x: 650, y: OPEN_Y },
    // the scan (read at exact seeks: the sort from 2.7, "14 found" by 14.6, the landing 15.8–17.0): the
    // Extract card, the sort, then the found photos and the landing in her rails (film 9.5–10.7)
    cuts: [
      { id: SCAN, from: 0.9, to: 8.8 },
      { id: SCAN, from: 14.0, to: 21.5, xf: 0.2 },
    ],
  },
  {
    n: 2,
    name: "see-it-on-you",
    line1: "See it\n*on you.*",
    line2: "Before you\n*wear it.*",
    glide: 2.4,
    out: 12.6,
    total: 16.5,
    open: { x: 650, y: OPEN_Y },
    // Studio (marks, read at exact seeks: Try it on 6.65, the shimmer to 13.6, she's in it 13.75, the
    // full-screen try-on opens 15.4, whole by 16.0): the board (its scene settled by 2.3), Try it
    // on (film 4.25) and the start of the shimmer, its end, she's in it (film 7.15, the set warms), then her
    // try-on full screen (from film 9.4)
    cuts: [
      { id: STUDIO, from: 2.4, to: 9.0 },
      { id: STUDIO, from: 12.9, to: 23.0, xf: 0.3 },
    ],
  },
  {
    n: 3,
    name: "what-to-wear",
    line1: "A look for\n*every day.*",
    line2: "Always know\n*what to wear.*",
    glide: 2.5,
    out: 12.6,
    total: 16.5,
    open: { x: W / 2, y: OPEN_Y },
    // Today (the drag at 4.89 scrolls to For work), then Chat (read at exact seeks: her question 3.9,
    // "Looking through your wardrobe", Zee's ring 7–10.5 with his line from 8.5, the look 11–12): the clip
    // runs until the phone has panned out, ≈1.2 s after `out`
    cuts: [
      { id: TODAY, from: 0.5, to: 7.4 },
      { id: CHAT, from: 3.2, to: 5.6, xf: 0.25 },
      { id: CHAT, from: 9.0, to: 14.04, xf: 0.25 },
    ],
  },
];

export const filmOf = (n: number): Film => FILMS.find((f) => f.n === n) ?? FILMS[0];

/** Where each cut starts on the film's clock (each overlaps the one before by its xf). */
export const cutStarts = (f: Film) => {
  const out: number[] = [];
  let at = 0;
  for (const c of f.cuts) {
    at -= c.xf ?? 0;
    out.push(Math.max(0, at));
    at += c.to - c.from;
  }
  return out;
};
