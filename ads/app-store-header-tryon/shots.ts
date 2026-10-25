// App Store header, film B "See it on you": the shot list as data (shotlist.md is its readable form).
// `key` is the still's moment (s): tools/stills app-store-header-tryon --times <keys>.
import { T } from "./timeline.ts";

export type Shot = { id: string; part: "HOOK" | "REVEAL" | "PROOF" | "LOOP"; from: number; to: number; key: number; focal: string; motion: string[] };

export const SHOTS: Shot[] = [
  { id: "b1-hook", part: "HOOK", from: 0, to: T.fly, key: 1.2, focal: "her walk-to-work print and the black tee beside it; “See it on you.”", motion: ["headline", "hover (periodic)"] },
  { id: "b2-fly", part: "REVEAL", from: T.fly, to: T.sweep, key: 2.0, focal: "the tee in flight toward her (motion blur)", motion: ["piece (spring)", "camera (push)"] },
  { id: "b3-sweep", part: "REVEAL", from: T.sweep, to: T.sweep + T.sweepDur, key: 2.75, focal: "the light edge putting the tee on her", motion: ["expo (the sweep)", "camera (push, parallax)"] },
  { id: "b4-after", part: "REVEAL", from: T.sweep + T.sweepDur, to: T.slide, key: 4.3, focal: "her, in the black tee (the street moves behind her)", motion: ["camera (parallax)"] },
  { id: "b5-studio", part: "PROOF", from: T.slide, to: T.back, key: 8.0, focal: "Studio on the phone, showing that same try-on; “Before you wear it.”", motion: ["panel (the phone rises)", "headline"] },
  { id: "b6-loop", part: "LOOP", from: T.unsweep, to: 15, key: 12.75, focal: "the edge runs back up; then the tee floats in to its place (= frame 0)", motion: ["expo", "piece"] },
];
