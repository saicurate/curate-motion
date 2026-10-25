// App Store header D "Colour story": the shot list as data (shotlist.md is its readable form). `key` is the
// still's moment (s). tools/stills app-store-header-colour --times <keys> --props '{"film":"d1"}'.
import { ROOMS, ROW, WHEEL } from "./timeline.ts";

export type Shot = { id: string; film: "d1" | "d2" | "d1-bold" | "d2-bold"; part: "HOOK" | "REVEAL" | "PROOF" | "LOOP"; from: number; to: number; key: number; focal: string; motion: string[] };

export const SHOTS: Shot[] = [
  // d1 · Tonal rooms (the hand-in)
  { id: "d1-1-oat", film: "d1", part: "HOOK", from: 0, to: ROOMS.moves[0], key: 1.6, focal: "the oat room, the knit, the line", motion: ["headline", "breath"] },
  { id: "d1-2-sand", film: "d1", part: "REVEAL", from: ROOMS.moves[0], to: ROOMS.moves[1], key: 3.6, focal: "the sand room, the coat", motion: ["dolly"] },
  { id: "d1-3-travel", film: "d1", part: "REVEAL", from: ROOMS.moves[1], to: ROOMS.moves[1] + 0.8, key: 4.35, focal: "between sand and blush: the light travelling", motion: ["dolly", "subframe blur"] },
  { id: "d1-4-blush", film: "d1", part: "REVEAL", from: ROOMS.moves[1], to: ROOMS.moves[2], key: 5.2, focal: "the blush room, the slip dress", motion: ["dolly"] },
  { id: "d1-5-sage", film: "d1", part: "REVEAL", from: ROOMS.moves[2], to: ROOMS.moves[3], key: 6.8, focal: "the sage room, the flannel", motion: ["dolly"] },
  { id: "d1-6-blue", film: "d1", part: "REVEAL", from: ROOMS.moves[3], to: ROOMS.moves[4], key: 8.4, focal: "the dusty-blue room, the denim jacket", motion: ["dolly"] },
  { id: "d1-7-stone", film: "d1", part: "REVEAL", from: ROOMS.moves[4], to: ROOMS.gather, key: 9.75, focal: "the stone room, the blazer", motion: ["dolly"] },
  { id: "d1-8-palette", film: "d1", part: "PROOF", from: ROOMS.gather, to: ROOMS.back, key: 12.2, focal: "six tonal tiles beside her real Wardrobe", motion: ["expo", "piece", "fade", "headline"] },
  { id: "d1-9-loop", film: "d1", part: "LOOP", from: ROOMS.back, to: 15, key: 14.3, focal: "the oat tile opening into the room", motion: ["panel", "expo"] },
  // d2 · Tonal row (the hand-in)
  { id: "d2-1-oat", film: "d2", part: "HOOK", from: 0, to: ROW.changes[0], key: 1.6, focal: "the oat knit, the line", motion: ["headline", "breath"] },
  { id: "d2-2-sand", film: "d2", part: "REVEAL", from: ROW.changes[0], to: ROW.changes[1], key: 3.4, focal: "the coat on stage, the knit in the row", motion: ["enter", "cross-fade"] },
  { id: "d2-3-blush", film: "d2", part: "REVEAL", from: ROW.changes[1], to: ROW.changes[2], key: 5.0, focal: "the slip dress", motion: ["enter"] },
  { id: "d2-4-sage", film: "d2", part: "REVEAL", from: ROW.changes[2], to: ROW.changes[3], key: 6.6, focal: "the flannel", motion: ["enter"] },
  { id: "d2-5-blue", film: "d2", part: "REVEAL", from: ROW.changes[3], to: ROW.changes[4], key: 8.2, focal: "the denim jacket", motion: ["enter"] },
  { id: "d2-6-stone", film: "d2", part: "REVEAL", from: ROW.changes[4], to: ROW.gather, key: 9.6, focal: "the blazer, the row of five", motion: ["enter"] },
  { id: "d2-7-chips", film: "d2", part: "PROOF", from: ROW.gather, to: ROW.back, key: 12.2, focal: "the six on their colour chips beside her real Wardrobe", motion: ["expo", "fade", "headline"] },
  { id: "d2-8-loop", film: "d2", part: "LOOP", from: ROW.back, to: 15, key: 14.0, focal: "the oat knit returning to the stage", motion: ["expo"] },
  // the kept bold versions
  { id: "d1b-1-cream", film: "d1-bold", part: "HOOK", from: 0, to: ROOMS.moves[0], key: 1.6, focal: "the cream room, three pieces", motion: ["headline"] },
  { id: "d1b-2-palette", film: "d1-bold", part: "PROOF", from: ROOMS.gather, to: ROOMS.back, key: 12.2, focal: "six colour tiles beside her real Wardrobe", motion: ["expo", "piece"] },
  { id: "d2b-1-wheel", film: "d2-bold", part: "REVEAL", from: WHEEL.steps[0], to: WHEEL.steps[1], key: 4.4, focal: "the colour carousel", motion: ["step"] },
  { id: "d2b-2-strips", film: "d2-bold", part: "PROOF", from: WHEEL.gather, to: WHEEL.back, key: 12.0, focal: "six colour strips beside her real Wardrobe", motion: ["expo"] },
];
