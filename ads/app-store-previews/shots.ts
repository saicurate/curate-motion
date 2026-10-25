// The three App Previews as data: each one's headline and its cuts from the build-284 recordings
// (seconds in the source clip). Cuts were picked from timestamped frame sheets of each take
// (research/app-store-previews/frames, the takes' marks in the footage manifest).

export type Cut = { id: string; from: number; to: number };
export type Preview = { n: 1 | 2 | 3; name: string; a: string; b: string; cuts: readonly Cut[] };

const SCAN = "footage.curate.b284-scan-sort-land.v1";
const TRYONS = "footage.curate.b284-tryons-flow.v1";
const TODAY = "footage.emma.b284-today-look-scroll.v1";
const CHAT = "footage.emma.b284-chat-art-fair.v1";

export const PREVIEWS: readonly Preview[] = [
  {
    n: 1,
    name: "closet",
    a: "Your closet,",
    b: "from your photos.",
    cuts: [
      // critic round 1: the opening empty Wardrobe held 1.8 s with nothing moving (now 0.9 s), and the
      // found-items fan sat still 4.5 s (now 3.8 s); cuts that run on in the source are one cut.
      { id: SCAN, from: 1.9, to: 8.2 }, // the empty Wardrobe, then the sort: her photos to one pile, the rest to the other
      { id: SCAN, from: 12.6, to: 20.0 }, // Finding your wardrobe items: 14 found; the landing: Added 14 wardrobe items from 7 photos (round 3: 0.8 s off the fan)
    ],
  },
  {
    n: 2,
    name: "see-it-on-you",
    a: "See it on you,",
    b: "before you wear it.",
    cuts: [
      // critic round 2: the opening held 2.5 s (now 1.2 s); the trousers cut now ends once the sheet has
      // closed, so it meets the Try on cut on the same screen (no sheet ghosting over her photo).
      { id: TRYONS, from: 9.8, to: 11.0 }, // her photo, the whole screen: Add up to 4 items
      { id: TRYONS, from: 15.6, to: 17.8 }, // a shop link: Which one is the piece? the knit
      { id: TRYONS, from: 19.6, to: 21.6 }, // in the dock: Add another item. They go on together.
      { id: TRYONS, from: 24.6, to: 28.8 }, // from her wardrobe: the navy trousers; the sheet closes on Try on 2 items
      { id: TRYONS, from: 35.9, to: 39.2 }, // Try on: the curtain, Zee: Trying on your 2 items
      { id: TRYONS, from: 42.6, to: 49.4 }, // the reveal: her in the knit and the trousers, Here you are, wearing both
      { id: TRYONS, from: 54.2, to: 57.2 }, // hold to see the before, and back
    ],
  },
  {
    n: 3,
    name: "what-to-wear",
    a: "Always know",
    b: "what to wear.",
    cuts: [
      // critic round 5: Today held 5 s before the scroll (now 2 s), "Looking through your wardrobe" left the
      // screen near empty 2.5 s (now under 1 s) and the look held 5.5 s at the end (now 3.5 s).
      { id: TODAY, from: 3.0, to: 7.8 }, // Today: the art fair look tonight, then scrolled to For work
      { id: CHAT, from: 1.6, to: 5.3 }, // Chat: Hey Emma, the question typed and sent
      { id: CHAT, from: 6.6, to: 16.2 }, // Zee thinking with her closet orbiting, It drops to 57°F after sunset, the look
    ],
  },
];

/** Seconds of the end card (the Curate lockup) after the last cut. */
export const END = 2.0;
/** Seconds of a cross-fade between two cuts (they overlap by this much). */
export const XF = 0.2;

/** The preview's length in seconds: its cuts end to end, less the overlaps, plus the end card. */
export const lengthOf = (p: Preview) => p.cuts.reduce((s, c) => s + (c.to - c.from), 0) - XF * (p.cuts.length - 1) + END;
