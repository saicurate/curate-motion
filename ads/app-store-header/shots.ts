// App Store header: the shot list as data (shotlist.md is its readable form). One list per film;
// `key` is the still's moment (s). tools/stills app-store-header --times <keys> --props '{"film":"…"}'.
import { ROLL, TRYON, ZEE } from "./timeline.ts";

export type Shot = { id: string; film: "roll" | "tryon" | "zee"; part: "HOOK" | "REVEAL" | "PROOF" | "LOOP"; from: number; to: number; key: number; focal: string; motion: string[] };

export const SHOTS: Shot[] = [
  { id: "a1-hook", film: "roll", part: "HOOK", from: 0, to: ROLL.lift[0], key: 0.6, focal: "her three photos, lit, on the stage", motion: ["camera (a 3.5% push)"] },
  { id: "a2-lift", film: "roll", part: "REVEAL", from: ROLL.lift[0], to: ROLL.gather, key: 3.6, focal: "the coat, jacket and scarf lifting off her photos (rack focus)", motion: ["piece (lift)", "expo (dim, blur)"] },
  { id: "a3-wardrobe", film: "roll", part: "PROOF", from: ROLL.gather, to: ROLL.back, key: 9.0, focal: "the pieces in a row beside her real Wardrobe", motion: ["piece (gather)", "fade (the phone)", "headline (the line)"] },
  { id: "a4-loop", film: "roll", part: "LOOP", from: ROLL.back, to: 15, key: 13.4, focal: "the pieces going back into her photos", motion: ["piece", "expo"] },
  { id: "b1-hook", film: "tryon", part: "HOOK", from: 0, to: TRYON.fly, key: 1.8, focal: "her photo and the black tee", motion: ["headline", "noise (the tee hovering)"] },
  { id: "b2-sweep", film: "tryon", part: "REVEAL", from: TRYON.fly, to: TRYON.slide, key: 4.5, focal: "the try-on wiping down over her", motion: ["spring (the tee flies)", "camera (centring)", "expo (the sweep)"] },
  { id: "b3-after", film: "tryon", part: "REVEAL", from: TRYON.sweep + TRYON.sweepDur, to: TRYON.slide, key: 5.8, focal: "her, in the black tee", motion: [] },
  { id: "b4-studio", film: "tryon", part: "PROOF", from: TRYON.slide, to: TRYON.back, key: 9.0, focal: "the photo beside Studio showing the same try-on", motion: ["panel (the slide)", "fade (the phone)", "headline"] },
  { id: "c1-hook", film: "zee", part: "HOOK", from: 0, to: ZEE.phone, key: 1.8, focal: "Zee waving in a pool of light", motion: ["Zee's clip (hello)", "headline"] },
  { id: "c2-chat", film: "zee", part: "PROOF", from: ZEE.phone, to: ZEE.look, key: 5.5, focal: "his real chat planning Monday", motion: ["fade (the phone)", "Zee (listening)"] },
  { id: "c3-look", film: "zee", part: "REVEAL", from: ZEE.look, to: ZEE.back, key: 9.2, focal: "the coat, tee and trousers he named, rising beside him", motion: ["piece (rise)", "Zee (happy)"] },
  { id: "c4-loop", film: "zee", part: "LOOP", from: ZEE.hello2, to: 15, key: 13.4, focal: "Zee waves again, ending on his rest pose (= frame 0)", motion: ["Zee (hello → outro)"] },
];
