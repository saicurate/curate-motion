// The six hook-first concepts (2026-10-16), as data: the one source for each demo's ad.json
// (make-specs.ts), its README and the founder's phone page. Pure data, no React.
import { PHOTOS, SORTED } from "./data.ts";

export type Concept = {
  n: number;
  slug: string;
  id: string;
  title: string;
  lengthSec: number;
  track: string;
  /** Why this temp track (and what the real one should be). */
  trackNote: string;
  sfxGain?: number;
  hook: string;
  story: string[];
  transitions: string[];
  aiVideo: string[];
  code: string[];
  appFootage: string[];
  music: string;
  why: string;
  extraAssets: string[];
};

const BASE = ["font.geist.regular.v1", "font.geist.medium.v1", "font.geist.semibold.v1", "brand.curate.logo-splash.v1"];
const zee = (...emos: string[]) => emos.flatMap((e) => [`zee.${e}.intro.v1`, `zee.${e}.loop.v1`]);

export const DEMOS: Concept[] = [
  {
    n: 1,
    slug: "nothing-to-wear",
    id: "demo-nothing-to-wear",
    title: "Nothing to wear",
    lengthSec: 12,
    track: "music.incompetech.voxel-revolution-kevin-macleod.v1",
    trackNote: "Voxel Revolution (Kevin MacLeod, Incompetech, CC BY 4.0, 122 bpm), held low under the problem, full when the app opens.",
    hook: "\"200 clothes. Nothing to wear.\" slams over an overflowing, messy closet.",
    story: [
      "0–1.5 s HOOK: the messy closet; \"200 clothes.\" then \"Nothing to wear.\" land on two kicks.",
      "1.5–3.2 s PROBLEM: she sighs and flops back; \"*sigh*\". Music is small and muffled.",
      "3.2–4.6 s: she lifts her phone, opens Curate, one tap on her Wardrobe.",
      "4.6–8.6 s MAGIC: the screen flashes; the room turns bright from the phone outwards; 14 of her pieces fly OUT of the phone, 7 hang themselves on a rail, 7 land on the shelf.",
      "8.6–10 s PAYOFF: the sorted rail sways and settles.",
      "10–12 s CLOSE: \"Your closet, finally sorted.\" + Curate.",
    ],
    transitions: [
      "Hard cut on the beat: mess to her sigh.",
      "Phone rises into her hand; a tap ring.",
      "Screen flash, then a circle wipe from the phone: dark bedroom to bright clean room.",
      "Pieces launch out of the screen in arcs, spinning, then swing on hangers and settle.",
    ],
    aiVideo: ["The overflowing closet (clothes spilling, she stares).", "She sighs and flops back on the bed, phone in hand.", "Optional: her hand holding the phone, as the plate the pieces fly out of."],
    code: ["Hook type and kicks", "the circle wipe", "pieces flying out of the phone onto the rail (her real cut-outs)", "rail swing physics", "end card"],
    appFootage: ["Her real Wardrobe screen on the phone (screenshot now; the real cold-launch footage later)."],
    music: "Starts muffled (low-pass) for the sigh, then a bright quirky pop drop exactly on the tap at 4.6 s. 115–125 bpm. Reference style: the \"whoops-to-wow\" glow-up trend sounds, playful bass + claps.",
    why: "\"Nothing to wear\" is the most relatable line in fashion; the viewer is nodding before the product appears. Clothes flying out of a phone is an impossible image, and the bright wipe is a visible before/after.",
    extraAssets: ["photo.emma.r28-couch-cozy.v1", "screenshot.emma.wardrobe-top.v1"],
  },
  {
    n: 2,
    slug: "camera-roll-closet",
    id: "demo-camera-roll-closet",
    title: "Your camera roll is secretly a closet",
    lengthSec: 11,
    track: "music.incompetech.kick-shock-kevin-macleod.v1",
    trackNote: "Kick Shock (Kevin MacLeod, Incompetech, CC BY 4.0, 138 bpm), cut dead on the freeze, back 7 beats later.",
    hook: "A thumb flicks through her REAL camera roll at speed under \"Your camera roll is secretly a closet.\"",
    story: [
      "0–1 s HOOK: her 30 real camera-roll photos scrolling fast under a thumb; the line lands.",
      "1–3.6 s: the scroll speeds up, blurring; a beat-synced flicker.",
      "3.6 s FREEZE: the music stops dead; a flash; the scroll slams to a stop on her ferry photo, which fills the screen.",
      "4.1–6.6 s PEEL: her denim jacket peels off her in 3D, lifts, turns, gets a white outline.",
      "6.6–8.9 s LAND: the music drops back in; the jacket flies down into an empty slot in her closet grid; the rest of the grid pops in; \"41 pieces, from your photos\".",
      "8.9–11 s CLOSE: \"Curate finds your closet in your camera roll.\" + Curate.",
    ],
    transitions: [
      "Speed-ramped scroll with motion blur.",
      "Hard freeze on the beat + music cut + flash (the record-stop moment).",
      "Punch-in from the grid tile to full screen.",
      "3D peel: the garment separates from the photo (later: AI video).",
      "Fly-to-slot into the closet grid.",
    ],
    aiVideo: ["The peel: the jacket lifting off her body in 3D, the photo behind staying still (image-to-video from her ferry photo, Kling / Veo first+last frame)."],
    code: ["the thumb scroll + speed ramp + blur", "the freeze, flash and music cut", "the closet grid filling"],
    appFootage: ["Her real camera-roll photos (the same 30 the app scans).", "The real review screen counting to 41 can replace the drawn grid."],
    music: "Fast trap / hyperpop scroll beat, 140–150 bpm, with a hard silence on the freeze and a re-entry drop when the jacket lands. Reference style: \"record scratch, freeze frame\" meme edits.",
    why: "Everyone has thousands of photos of themselves; the line reframes something they already own. The freeze is a pattern-break the thumb itself causes, so it stops the scroll by imitating one.",
    extraAssets: [...PHOTOS],
  },
  {
    n: 3,
    slug: "zee-critic",
    id: "demo-zee-critic",
    title: "Zee the critic",
    lengthSec: 12,
    track: "music.incompetech.sneaky-snitch-kevin-macleod.v1",
    trackNote: "Sneaky Snitch (Kevin MacLeod, Incompetech, CC BY 4.0, 87 bpm pizzicato, a classic meme bed), stopped dead for the deadpan.",
    hook: "\"POV: your cat has opinions about your outfit.\" Zee walks in and looks her outfit up and down.",
    story: [
      "0–1 s HOOK: her hoodie + sweats outfit; Zee walks in from the side; the POV line.",
      "1–3 s: Zee looks the outfit up and down (an eye-line scan).",
      "3–4.4 s REACTION: meme punch-in on Zee, deadpan; record scratch; \"girl… no.\"",
      "4.4–7.8 s SWAP: \"ok. let me fix this.\" Four paw taps on the beat: hoodie → blazer + cami, sweats → satin midi skirt, sneakers → ankle boots, + bag (the app's real Date night look).",
      "7.8–9.9 s SLAY: Zee cheers; \"SLAY.\"; the real look card from the app slides in as proof.",
      "9.9–12 s CLOSE: \"A stylist with opinions.\" + Curate.",
    ],
    transitions: [
      "Zee walk-in.",
      "Meme zoom punch-in + shake + record-scratch freeze.",
      "Paw tap → the piece flips away and the new one snaps in, one per beat.",
      "Slide-in of the real look card.",
    ],
    aiVideo: ["Optional: Emma in the hoodie in her mirror, and the same shot in the Date night look (she does a spin). The animatic uses flat-lay pieces instead."],
    code: ["Zee walking, scanning, reacting (her real Zee animations)", "meme zoom + captions", "the paw-tap swaps"],
    appFootage: ["The real Date night look card (screenshot; the real look-card-landing footage later)."],
    music: "Comedic, sassy: pizzicato or bouncy bass at ~100–120 bpm with a record scratch and a stop for the deadpan, then a confident beat for the slay. Reference style: pet-reaction meme sounds.",
    why: "Pet reaction memes are a native TikTok format, and Zee is a character people can share. It makes the product's job (\"tell me what works\") funny instead of a feature list.",
    extraAssets: [...zee("curious", "sleepy", "thinking", "cheer", "excited"), "zee.curious.still.v1", "screenshot.emma.look-card.v1"],
  },
  {
    n: 4,
    slug: "speed-run",
    id: "demo-speed-run",
    title: "Speed run",
    lengthSec: 12,
    track: "music.incompetech.laserpack-kevin-macleod.v1",
    trackNote: "Laserpack (Kevin MacLeod, Incompetech, CC BY 4.0, 128 bpm), from 80 s so its lift lands on the finish.",
    hook: "\"0 → 49 pieces in 3 minutes\" with a huge speedrun timer that starts on frame 1.",
    story: [
      "0–1.2 s HOOK: a speedrun HUD: a giant timer starts, \"0 → 49 pieces\", \"closet speedrun, any%\".",
      "1.2–9 s RUN: the timer races to 2:58 while her pieces rain into a 7 × 7 grid, one at a time at first, then faster and faster; the counter ticks up; the real app scanning plays in the corner.",
      "9–10.4 s FINISH: 49/49, the timer stops, \"NEW RECORD\" flash, the full closet.",
      "10.4–12 s CLOSE: \"Your whole closet, in minutes.\" + Curate.",
    ],
    transitions: [
      "Pieces raining into grid slots, accelerating with the music's build.",
      "Timer slam + flash on the finish, synced to the drop.",
    ],
    aiVideo: ["None needed. Optional: her hand speed-scrolling, for a human opening."],
    code: ["timer, counter, HUD", "the accelerating piece rain", "the finish flash"],
    appFootage: ["The real scan roll (Zee's magnifier going through her photos) in the corner, at about real speed."],
    music: "A build that accelerates (risers, ticking hats) and drops on the finish: 128–150 bpm electronic. Reference style: Minecraft-speedrun / timer TikToks.",
    why: "A visible timer creates a question (will it finish?) that holds attention to the end. Counting up is satisfying and proves speed without a claim in words. CHECK: the recorded scan took about 6 min to 40 pieces; the line must use the real time.",
    extraAssets: ["footage.emma.scan-roll.v1"],
  },
  {
    n: 5,
    slug: "outfit-change",
    id: "demo-outfit-change",
    title: "Outfit-change trend",
    lengthSec: 12,
    track: "music.incompetech.overcast-kevin-macleod.v1",
    trackNote: "Overcast (Kevin MacLeod, Incompetech, CC BY 4.0, 120 bpm disco beat), a change every 6 beats.",
    hook: "\"Letting my AI stylist pick my outfits\" over her mirror shot; a hand covers the lens on the beat.",
    story: [
      "0–1.6 s HOOK: her in the mirror in a plain outfit, the line.",
      "1.6 s CHANGE 1: a hand covers the lens on the beat → Date night (blazer, cami, satin midi skirt, ankle boots); chip \"Zee's pick: Date night\" + the real look card.",
      "4.6 s CHANGE 2: hand → coat + mini dress + pumps; \"Zee's pick: look 3 of 3\".",
      "7.6 s CHANGE 3: hand → work look (blazer, satin cami, trousers, loafers, tote); \"Zee's pick: work, drizzly tomorrow\".",
      "10.2–12 s CLOSE: \"Which one? It picks from YOUR closet.\" + Curate.",
    ],
    transitions: ["Hand-over-lens wipe, three times, each on a strong beat (the trend's own grammar)."],
    aiVideo: ["Each outfit worn by Emma in the same mirror, same pose (4 short shots: plain + the three real looks), plus the hand-over-lens moments. Generate from her try-on base photo + the garment images."],
    code: ["the hand wipe", "the pick chips + the real look-card inset", "the flat-lay outfits standing in for the AI shots"],
    appFootage: ["The three real look cards from the app (Date night, look 3 of 3, Work)."],
    music: "A punchy TikTok transition beat with three obvious hits: 120–128 bpm house or R&B with a bass drop on each change. Reference style: the \"outfit change transition\" trend sounds.",
    why: "It is a trend people already watch to the end (each change is a reveal), so the format carries retention; the app's picks are the payoff of every change.",
    extraAssets: ["tryon.emma.tryon-base-1.v1", "screenshot.emma.look-card.v1", "screenshot.emma.multiple-looks-2.v1", "screenshot.emma.work-look.v1", ...zee("hello")],
  },
  {
    n: 6,
    slug: "satisfying-sort",
    id: "demo-satisfying-sort",
    title: "Satisfying sort",
    lengthSec: 11,
    track: "music.incompetech.chill-wave-kevin-macleod.v1",
    trackNote: "Chill Wave (Kevin MacLeod, Incompetech, CC BY 4.0, 100 bpm), low under the snaps: the snaps are the music.",
    sfxGain: 1.3,
    hook: "A chaotic pile of her 49 pieces, then the first SNAP: one flies into a perfect colour-sorted closet.",
    story: [
      "0–1 s HOOK: the pile shakes; \"watch my closet sort itself\" 🔊.",
      "1–8 s SORT: pieces snap out of the pile into a colour-sorted grid (white → camel → green → blue → grey → black), slow at first, then faster, a crisp snap on every piece.",
      "8–9 s: the last piece; a shine sweeps across the perfect grid; colour labels.",
      "9–11 s CLOSE: \"Your closet, sorted.\" + Curate.",
    ],
    transitions: ["Each piece: pile → slot in an arc with a snap on landing, accelerating.", "Shine sweep on completion."],
    aiVideo: ["Optional: a real messy pile on a bed for the first second (then the code sort takes over)."],
    code: ["the whole sort (her real cut-outs)", "ASMR snaps (designed sound)"],
    appFootage: ["Optional end: the real Wardrobe scroll with her floating pieces."],
    music: "Sparse ASMR-ish lofi or minimal house, 90–110 bpm, so each snap reads; the snaps carry the rhythm. Reference style: \"oddly satisfying\" organising videos.",
    why: "\"Oddly satisfying\" is a scroll-stopping genre of its own; order out of chaos is the brand promise shown, not said.",
    extraAssets: [],
  },
];

export const assetsOf = (c: Concept) => [...new Set([c.track, ...BASE, ...SORTED, ...c.extraAssets])];
