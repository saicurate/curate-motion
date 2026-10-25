// App Store header, direction C "A week of looks": the week's colour sets and the house tones.
// Two tones, both kept (keep every version):
//   subtle (the default; the founder, 2026-10-24, on the colourful set: "feeling cheap… subtle colours"):
//          each day's set is a pale tone taken from that look's own palette and pushed toward Mist
//          (dusty blue, sand, warm stone, oat, soft blush, pale sage, soft clay); dark type; soft shadows.
//   bold   (the first pass, "a bit more colorful"): fashion-campaign paper colours, light type.
// Every colour lives here, as tokens (RULES.md §8: never inline hex in the composition).

/** House tones (motion/theme.ts and library/brand/BRAND.md). */
export const INK = "#181818"; // Primary Black: the key words
export const BODY = "#656565"; // Winter Gray: the rest
export const MIST = { top: "#FAFAFA", mid: "#F6F6F6", low: "#F0F0EF", floor: "#E8E8E7" } as const;

export type Role = "outer" | "top" | "bottom" | "short" | "dress" | "shoes" | "bag" | "acc" | "acc2";
export type Tone = "subtle" | "bold";
export type SetColours = {
  /** The paper: the set's colour. */
  paper: string;
  /** The deeper tone behind a card (C2's field) and in the paper's fall-off. */
  deep: string;
  /** The day's name, and the occasion under it. */
  text: string;
  sub: string;
};
export type Day = {
  day: string;
  occ: string;
  /** Both tones of this day's set. */
  tones: Record<Tone, SetColours>;
  look: { id: string; role: Role }[];
};

/** Monday to Sunday: a look from Emma's own wardrobe each day, on its own paper. */
export const DAYS: Day[] = [
  {
    day: "Mon",
    occ: "Work",
    tones: {
      subtle: { paper: "#DEE4EA", deep: "#C9D2DC", text: INK, sub: BODY }, // dusty blue, from the oxford shirt
      bold: { paper: "#4D6CBF", deep: "#2C4482", text: "#EEF2FB", sub: "#EEF2FB" }, // cobalt
    },
    look: [
      { id: "garment.emma.blazer-black.v1", role: "outer" },
      { id: "garment.emma.shirt-oxford-blue.v1", role: "top" },
      { id: "garment.emma.trousers-black.v1", role: "bottom" },
      { id: "garment.emma.loafers-black.v1", role: "shoes" },
      { id: "garment.emma.bag-tote-leather-black.v1", role: "bag" },
    ],
  },
  {
    day: "Tue",
    occ: "Coffee",
    tones: {
      subtle: { paper: "#ECE5D8", deep: "#DCD1BF", text: INK, sub: BODY }, // sand, from the trench
      bold: { paper: "#B85E40", deep: "#7E3A26", text: "#FCEFE8", sub: "#FCEFE8" }, // terracotta
    },
    look: [
      { id: "garment.emma.coat-trench-khaki.v1", role: "outer" },
      { id: "garment.emma.tee-white.v1", role: "top" },
      { id: "garment.emma.jeans-straight-dark-wash.v1", role: "bottom" },
      { id: "garment.emma.sneakers-leather-white.v1", role: "shoes" },
    ],
  },
  {
    day: "Wed",
    occ: "Gallery",
    tones: {
      subtle: { paper: "#E8E1D9", deep: "#D6CDC3", text: INK, sub: BODY }, // warm stone, from the knit and the satin
      bold: { paper: "#A84556", deep: "#6E2532", text: "#FBEAEC", sub: "#FBEAEC" }, // berry
    },
    look: [
      { id: "garment.emma.sweater-cable-knit-cream.v1", role: "top" },
      { id: "garment.emma.skirt-midi-satin-camel.v1", role: "bottom" },
      { id: "garment.emma.boots-ankle-black.v1", role: "shoes" },
      { id: "garment.emma.bag-mini-black.v1", role: "bag" },
    ],
  },
  {
    day: "Thu",
    occ: "Errands",
    tones: {
      subtle: { paper: "#EEEADF", deep: "#DDD6C6", text: INK, sub: BODY }, // oat, from the tan bag and the stripe
      bold: { paper: "#C99A34", deep: "#8A661C", text: "#FFF7E3", sub: "#FFF7E3" }, // ochre
    },
    look: [
      { id: "garment.emma.jacket-denim.v1", role: "outer" },
      { id: "garment.emma.tee-long-sleeve-striped.v1", role: "top" },
      { id: "garment.emma.trousers-black.v1", role: "bottom" },
      { id: "garment.emma.flats-ballet-black.v1", role: "shoes" },
      { id: "garment.emma.bag-crossbody-tan.v1", role: "bag" },
    ],
  },
  {
    day: "Fri",
    occ: "Dinner",
    tones: {
      subtle: { paper: "#EFE3DE", deep: "#E0CDC5", text: INK, sub: BODY }, // soft blush, from the champagne slip
      bold: { paper: "#7D5FA0", deep: "#4D3866", text: "#F3EDF9", sub: "#F3EDF9" }, // plum
    },
    look: [
      { id: "garment.emma.jacket-leather-black.v1", role: "outer" },
      { id: "garment.emma.dress-slip-champagne.v1", role: "dress" },
      { id: "garment.emma.heels-black.v1", role: "shoes" },
      { id: "garment.emma.earrings-hoops-gold.v1", role: "acc" },
    ],
  },
  {
    day: "Sat",
    occ: "Market",
    tones: {
      subtle: { paper: "#E2E8E0", deep: "#CDD7CB", text: INK, sub: BODY }, // pale sage, against the grey and denim
      bold: { paper: "#3F8B70", deep: "#225846", text: "#E7F5EF", sub: "#E7F5EF" }, // jade
    },
    look: [
      { id: "garment.emma.sweatshirt-crewneck-grey.v1", role: "top" },
      { id: "garment.emma.shorts-denim-cutoff.v1", role: "short" },
      { id: "garment.emma.sneakers-retro-runner-grey-navy.v1", role: "shoes" },
      { id: "garment.emma.cap-baseball-navy.v1", role: "acc" },
      { id: "garment.emma.sunglasses-black.v1", role: "acc2" },
    ],
  },
  {
    day: "Sun",
    occ: "Slow day",
    tones: {
      subtle: { paper: "#ECE1DA", deep: "#DCCDC3", text: INK, sub: BODY }, // soft clay, from the oatmeal and the sandals
      bold: { paper: "#C98F87", deep: "#93625B", text: "#FFF3F0", sub: "#FFF3F0" }, // rose clay
    },
    look: [
      { id: "garment.emma.cardigan-oatmeal.v1", role: "outer" },
      { id: "garment.emma.tank-ribbed-black.v1", role: "top" },
      { id: "garment.emma.leggings-sage.v1", role: "bottom" },
      { id: "garment.emma.sandals-tan.v1", role: "shoes" },
    ],
  },
];

/** "#rrggbb" → [r, g, b]. */
export const rgbOf = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const hexOf = (c: number[]) => "#" + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
/** a → b by k (clamped), as "#rrggbb". */
export const mixHex = (a: string, b: string, k: number) => {
  const A = rgbOf(a);
  const B = rgbOf(b);
  const kk = Math.min(1, Math.max(0, k));
  return hexOf(A.map((v, i) => v + (B[i] - v) * kk));
};
/** Lighter (k > 0, towards white) or darker (k < 0, towards black), as "#rrggbb". */
export const shade = (h: string, k: number) => (k >= 0 ? mixHex(h, "#FFFFFF", k) : mixHex(h, "#000000", -k));
/** "#rrggbb" at alpha a, as rgba(). */
export const rgba = (h: string, a: number) => {
  const [r, g, b] = rgbOf(h);
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
};
