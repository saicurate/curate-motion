// App Store header, direction C "A week of looks": the shot list as data (shotlist.md is its readable
// form). `key` is the still's moment (s). tools/stills app-store-header-week --times <keys> --props '{"variant":"c1"}'.
import { FLIP, RAIL } from "./timeline.ts";

export type Shot = { id: string; variant: "c1" | "c2"; part: "HOOK" | "REVEAL" | "PROOF" | "CLOSE" | "LOOP"; from: number; to: number; key: number; focal: string; motion: string[] };

export const SHOTS: Shot[] = [
  { id: "c1-mon", variant: "c1", part: "HOOK", from: 0, to: FLIP.push[0], key: 1.38, focal: "Monday's look on dusty blue, the line arriving", motion: ["headline (the line)"] },
  { id: "c1-push", variant: "c1", part: "REVEAL", from: FLIP.push[1], to: FLIP.push[1] + 0.5, key: FLIP.push[1] + 0.3, focal: "Wednesday gliding in over Tuesday", motion: ["panel (the push)", "piece (landing)"] },
  { id: "c1-wed", variant: "c1", part: "REVEAL", from: FLIP.push[1], to: FLIP.push[2], key: FLIP.push[1] + 1.25, focal: "Wednesday's look on warm stone", motion: ["piece (landed)", "headline (the name)"] },
  { id: "c1-fri", variant: "c1", part: "REVEAL", from: FLIP.push[3], to: FLIP.push[4], key: FLIP.push[3] + 1.2, focal: "Friday's look on soft blush", motion: [] },
  { id: "c1-week", variant: "c1", part: "CLOSE", from: FLIP.week, to: FLIP.back, key: 12.0, focal: "the week as seven cards, the line and the lockup", motion: ["camera (Sunday into its card)", "piece (the week rising)"] },
  { id: "c1-loop", variant: "c1", part: "LOOP", from: FLIP.back, to: 15, key: FLIP.back + 0.5, focal: "Monday growing back into the frame", motion: ["panel"] },
  { id: "c2-mon", variant: "c2", part: "HOOK", from: 0, to: RAIL.step[0], key: 1.38, focal: "Monday's card centred, Tuesday at its side", motion: ["headline (the line)"] },
  { id: "c2-glide", variant: "c2", part: "REVEAL", from: RAIL.step[1], to: RAIL.step[2], key: RAIL.step[1] + 0.35, focal: "the camera gliding to Wednesday (motion blur)", motion: ["camera (the glide)"] },
  { id: "c2-thu", variant: "c2", part: "REVEAL", from: RAIL.step[2], to: RAIL.step[3], key: 5.0, focal: "Thursday the hero (oat)", motion: ["piece (landed)"] },
  { id: "c2-sat", variant: "c2", part: "REVEAL", from: RAIL.step[4], to: RAIL.step[5], key: 7.5, focal: "Saturday the hero (pale sage)", motion: [] },
  { id: "c2-week", variant: "c2", part: "CLOSE", from: RAIL.week, to: RAIL.back, key: 12.0, focal: "the whole week, the line and the lockup", motion: ["camera (the pull back)"] },
  { id: "c2-loop", variant: "c2", part: "LOOP", from: RAIL.back, to: 15, key: RAIL.back + 0.6, focal: "the camera pushing back into Monday", motion: ["panel"] },
];
