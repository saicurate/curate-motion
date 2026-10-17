// Skit "you're chopped": every piece of media, by catalog id, and the shot list as data (tools/stills --shots).
import { T } from "./timeline.ts";

type Still = { id: string; plate: string; cut: string; dims: { w: number; h: number }; note: string; far?: number; align?: { x?: number; y?: number } };
const still = (stem: string, note: string, extra: Partial<Still> = {}): Still => ({
  id: `photo.jake-skit.${stem}.v1`,
  plate: `photo.jake-skit.${stem}-plate.v1`,
  cut: `photo.jake-skit.${stem}-cutout.v1`,
  dims: { w: 1536, h: 2752 },
  note,
  ...extra,
});

/** The skit's stills (9:16, Nano Banana Pro, his face locked), each a 2.5D shot. */
export const STILL = {
  s02: still("s02-couch-staring", "on the couch, staring at his phone for hours"),
  s03: still("s03-facepalm", "face-palm: no reply"),
  s04: still("s04-pacing", "pacing the living room"),
  s05: still("s05-desperate-typing", "desperate typing in bed at night"),
  s07: still("s07-angry-search", "angry searching at his desk"),
  s08: still("s08-mirror-selfie", "styled in the new look: the mirror selfie he sends"),
  s09: still("s09-beaming", "beaming at her reply, styled"),
} as const;

/** The three AI video shots (Veo 3.1 Fast, 720p, image-to-video from his stills). */
export const VIDEO = {
  hook: { id: "stock.veo.jake-hook-grocery.v1", from: 0, note: "HOOK video: proud in the grocery aisle, phone up" },
  jaw: { id: "stock.veo.jake-jaw-drop.v1", from: 0, note: "VIDEO: his jaw drops at 'you're chopped'" },
  reveal: { id: "stock.veo.jake-reveal-mirror.v1", from: 0, note: "VIDEO: styled, he turns to the mirror" },
} as const;

/** The real app, Jake's account (build 262), in order: [clip id, ad time it starts, seconds into the clip]. */
export const APP_CLIPS = [
  { id: "footage.jake.photo-scan-b262.v1", at: T.app, from: 0, note: "the photo scan + pieces arriving" },
  { id: "footage.jake.wardrobe-b262.v1", at: T.wardrobe, from: 0, note: "his Wardrobe" },
  { id: "footage.jake.ask-zee-drinks-b262.v1", at: T.chat, from: 0, note: "asking Zee; thinking; the look card lands" },
] as const;

export const VO = "voice.skit-chopped.mix-eleven-will-v4.v1";
export const SFX = "sfx.curate.skit-chopped-sound.v1";

/** One still per shot, at its key moment (s). */
export const SHOTS = [
  { id: "hook", key: 1.2 },
  { id: "couch-two-hours", key: T.twoHours + 0.3 },
  { id: "hey-sent", key: T.heySent + 0.4 },
  { id: "two-days", key: T.twoDays + 0.4 },
  { id: "facepalm", key: T.facepalm + 0.5 },
  { id: "how-are-you", key: T.haySent + 0.4 },
  { id: "handsome", key: T.handsomeSeen + 0.1 },
  { id: "her-typing", key: T.chopped - 0.3 },
  { id: "chopped", key: T.chopped + 0.6 },
  { id: "jaw-drop", key: T.jawDrop + 1.0 },
  { id: "search", key: T.curateTap },
  { id: "app-scan", key: T.app + 1.2 },
  { id: "app-look", key: T.chat + 2.0 },
  { id: "reveal", key: T.reveal + 1.2 },
  { id: "reply", key: T.herReply + 0.3 },
  { id: "beaming", key: T.beaming + 1.0 },
  { id: "end", key: T.end + 1.6 },
] as const;
