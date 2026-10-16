// Shared data for the concept animatics: Emma's pieces by colour family, her camera roll, and the
// app's real looks (read off the look-card screenshots, build 262). Pure data, no React.

const g = (n: string) => `garment.emma.${n}.v1`;

/** Colour families in display order (light → dark), for the colour-sorted closet. */
export const FAMILIES = ["white", "camel", "green", "blue", "grey", "black"] as const;
export type Family = (typeof FAMILIES)[number];

export const BY_FAMILY: Record<Family, string[]> = {
  white: ["shirt-linen-white", "tee-white", "sneakers-leather-white", "sweater-cable-knit-cream", "beanie-cream", "cardigan-oatmeal", "dress-slip-champagne", "tee-long-sleeve-striped"].map(g),
  camel: ["coat-trench-khaki", "coat-wool-camel", "skirt-midi-satin-camel", "scarf-plaid-camel", "bag-crossbody-tan", "sandals-tan", "boots-cowboy-tan", "belt-leather-brown", "earrings-hoops-gold", "necklace-pendant-gold"].map(g),
  green: ["leggings-sage", "sports-bra-sage", "shirt-flannel-plaid"].map(g),
  blue: ["jeans-straight-light-wash", "shirt-oxford-blue", "shorts-denim-cutoff", "jacket-denim", "jeans-straight-dark-wash", "jacket-varsity-navy-cream", "sweater-crewneck-navy", "hoodie-navy", "cap-baseball-navy"].map(g),
  grey: ["sweatshirt-crewneck-grey", "sweatpants-grey", "tank-running-grey", "sneakers-retro-runner-grey-navy"].map(g),
  black: ["tee-black", "tank-ribbed-black", "turtleneck-black", "camisole-satin-black", "dress-little-black", "blazer-black", "jacket-leather-black", "jacket-puffer-black", "trousers-black", "heels-black", "flats-ballet-black", "loafers-black", "boots-ankle-black", "bag-mini-black", "bag-tote-leather-black", "sunglasses-black"].map(g),
};

/** Every piece (50), sorted by colour family. */
export const SORTED: string[] = FAMILIES.flatMap((f) => BY_FAMILY[f]);
export const familyOf = (id: string): Family => FAMILIES.find((f) => BY_FAMILY[f].includes(id))!;

/** Her 30 camera-roll photos, in roll order. */
export const PHOTOS: string[] = [
  "r01-coffee-shop", "r02-subway-platform", "r03-brooklyn-street", "r04-park-autumn", "r05-office", "r06-farmers-market",
  "r07-rooftop-golden-hour", "r08-beach-day", "r09-mirror-selfie-weekend", "r10-night-out", "r11-mirror-selfie-work", "r12-dumbo-walk",
  "r13-winter-street", "r14-sunday-errands", "r15-hudson-run", "r16-bookstore", "r17-brunch", "r18-office-lobby",
  "r19-fall-game-day", "r20-country-night", "r21-museum-steps", "r22-stoop", "r23-rainy-day", "r24-dinner",
  "r25-cafe-laptop", "r26-ferry", "r27-chelsea-market", "r28-couch-cozy", "r29-gym-mirror", "r30-walk-to-work",
].map((n) => `photo.emma.${n}.v1`);

/** A deterministic shuffle (seeded LCG), so a "random" pile is the same every frame and every run. */
export const shuffled = <T,>(xs: T[], seed: number): T[] => {
  const a = [...xs];
  let s = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** The app's real looks (Emma's account, build 262), as library pieces. */
export const LOOKS = {
  dateNight: {
    name: "Date night",
    shot: "screenshot.emma.look-card.v1",
    pieces: [
      { id: g("blazer-black"), role: "outer" },
      { id: g("camisole-satin-black"), role: "top" },
      { id: g("skirt-midi-satin-camel"), role: "bottom" },
      { id: g("boots-ankle-black"), role: "shoes" },
      { id: g("bag-mini-black"), role: "bag" },
    ],
  },
  coatDress: {
    name: "Look 3 of 3: coat + mini dress",
    shot: "screenshot.emma.multiple-looks-2.v1",
    pieces: [
      { id: g("coat-wool-camel"), role: "outer" },
      { id: g("dress-little-black"), role: "dress" },
      { id: g("heels-black"), role: "shoes" },
      { id: g("bag-mini-black"), role: "bag" },
    ],
  },
  work: {
    name: "Work, drizzly tomorrow",
    shot: "screenshot.emma.work-look.v1",
    pieces: [
      { id: g("blazer-black"), role: "outer" },
      { id: g("camisole-satin-black"), role: "top" },
      { id: g("trousers-black"), role: "bottom" },
      { id: g("loafers-black"), role: "shoes" },
      { id: g("bag-tote-leather-black"), role: "bag" },
    ],
  },
  lazy: {
    name: "Her pick: hoodie + sweats",
    shot: "",
    pieces: [
      { id: g("hoodie-navy"), role: "top" },
      { id: g("sweatpants-grey"), role: "bottom" },
      { id: g("sneakers-retro-runner-grey-navy"), role: "shoes" },
    ],
  },
} as const;
