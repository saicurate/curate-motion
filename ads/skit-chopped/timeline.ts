// Skit "you're chopped": the clock (pure data, no React; Node runs it for the sound and the voice mix too).
// 60 fps. Jake's voiceover (ElevenLabs Will v4) plays at RATE (pitch kept: ffmpeg atempo in vo.ts), each line placed at
// its start; the picture hangs off the words (WORDS: whisper word times of each clip, ÷ RATE).
// Music: A = Gummies (Mixkit, 120 BPM) under the ghosting, cut dead by the record scratch on "chopped";
// B = In My Back (Pixabay, 130 BPM) from the search, placed so its drop (22.175 s in the track) lands on the reveal.

export const FPS = 60;
export const RATE = 1.15;

/** Whisper word starts (s, in the ORIGINAL clip) of the words the picture syncs to; clip speech end. */
export const CLIP = {
  l01: { end: 5.28, words: { number: 3.38, grocery: 4.58 } },
  l02: { end: 4.66, words: { hours: 0.7, sent: 3.52, hey: 4.28 } },
  l03: { end: 2.82, words: { oneDay: 0.0, twoDays: 1.12, nothing: 2.36 } },
  l04: { end: 2.96, words: { hours: 0.5, hey: 1.8, you: 2.78 } },
  l05: { end: 0.36, words: {} },
  l06: { end: 4.2, words: { hey: 0.92, handsome: 2.24, me: 4.04 } },
  l07: { end: 2.14, words: { replies: 1.68 } },
  l08: { end: 0.52, words: {} },
  l09: { end: 4.22, words: { mad: 0.74, looked: 1.6, found: 2.56, curate: 3.58 } },
  l10: { end: 2.38, words: { clothes: 0.9, roll: 2.02 } },
  l11: { end: 2.0, words: { zee: 0.6, drinks: 1.72 } },
  l12: { end: 1.7, words: { pic: 0.42, sent: 1.18 } },
  l13: { end: 1.32, words: { back: 0.88 } },
} as const;
export type LineId = keyof typeof CLIP;

/** When each line starts in the ad (s). */
export const LINE_AT: Record<LineId, number> = {
  l01: 0.12,
  l02: 5.05,
  l03: 9.25,
  l04: 12.35,
  l05: 15.45,
  l06: 16.0,
  l07: 20.3,
  l08: 24.4,
  l09: 27.15,
  l10: 31.1,
  l11: 33.6,
  l12: 38.6,
  l13: 41.4,
};

/** The ad time of a word in a line. */
export const word = <L extends LineId>(l: L, w: keyof (typeof CLIP)[L]["words"]) => LINE_AT[l] + ((CLIP[l].words as Record<string, number>)[w as string] ?? 0) / RATE;
export const lineEnd = (l: LineId) => LINE_AT[l] + CLIP[l].end / RATE;

/** The moments (s). */
export const T = {
  // HOOK: the grocery-store video, cringe-proud
  hookOut: 4.9,
  // HEY: the couch
  couch: 4.9,
  threadIn: 4.95,
  twoHours: LINE_AT.l02 + 0.95,
  heyTypeFrom: word("l02", "sent") - 0.55,
  heySent: word("l02", "hey"),
  heyDelivered: word("l02", "hey") + 0.28,
  oneDay: word("l03", "oneDay"),
  heySeen: word("l03", "oneDay") + 0.5,
  twoDays: word("l03", "twoDays"),
  facepalm: word("l03", "nothing") - 0.06,
  // HOW ARE YOU: pacing
  pacing: 12.3,
  twoMoreHours: LINE_AT.l04,
  hayTypeFrom: word("l04", "hey") - 0.3,
  haySent: word("l04", "you") + 0.32,
  hayDelivered: word("l04", "you") + 0.55,
  nothing2: LINE_AT.l05,
  // HANDSOME: desperate typing
  typingStill: 16.0,
  handsomeTypeFrom: word("l06", "hey") - 0.1,
  handsomeSent: lineEnd("l06") + 0.05,
  handsomeDelivered: lineEnd("l06") + 0.25,
  handsomeSeen: lineEnd("l06") + 0.6,
  // CHOPPED
  twoDaysLater: LINE_AT.l07,
  herTypingFrom: word("l07", "replies") - 0.3,
  chopped: 22.55, // her bubble + the record scratch; music A dies
  jawDrop: 23.9, // the jaw-drop video
  // CURATE
  search: 27.1,
  searchTypeFrom: word("l09", "looked"),
  searchTypeTo: word("l09", "looked") + 0.95,
  curateTap: word("l09", "curate") + 0.45,
  app: 30.9, // the real app on the real iPhone (fade)
  wardrobe: 33.3,
  chat: 34.2,
  // GLOW-UP
  reveal: 36.9, // music B's drop
  photoSent: word("l12", "sent"),
  replyThread: 39.3,
  herReplyTypingFrom: 40.05,
  herReply: 40.75,
  beaming: 41.1,
  // END
  end: 43.4,
  total: 46.2,
} as const;

export const TOTAL_SEC = T.total;

/** Music. A from the top until the scratch; B from the search, its drop on the reveal. */
export const MUSIC_A = { id: "music.mixkit.gummies-michael-ramir-c.v1", fromSec: 0.313, at: 0, until: T.chopped };
const B_DROP = 22.175;
export const MUSIC_B = { id: "music.pixabay.in-my-back-kontraa.v1", fromSec: B_DROP - (T.reveal - T.search), at: T.search, until: T.total };

/** A cross-fade between shots (s); hard cuts elsewhere (TikTok grammar). Fades only on Apple's bezel. */
export const FADE = 0.36;
