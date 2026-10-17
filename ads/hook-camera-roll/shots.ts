// Hook B: the shot list as data (shotlist.md is its readable form). tools/stills <ad> --shots renders one
// still per shot at `key`. Pure data.
import { T, LENGTH } from "./timeline.ts";

export type Shot = { id: string; part: "HOOK" | "PROBLEM" | "REVEAL" | "PROOF" | "CLOSE"; from: number; to: number; key: number; focal: string; entry: string; exit: string; purpose: string; motion: string[] };

export const SHOTS: Shot[] = [
  {
    id: "s1-scroll",
    part: "HOOK",
    from: 0,
    to: T.freeze,
    key: 1.5,
    focal: "her real camera roll, a blur of her own photos",
    entry: "Frame 0 already scrolling: the 30 photos the app scans, 4 across, full bleed",
    exit: "A dead stop on her ferry photo; the music cuts",
    purpose: "Everyone knows this gesture; the speed and the stop make the thumb stop too.",
    motion: ["the scroll (an accelerating flick; sub-frame motion blur, ≤ 3 px between samples)", "ui (the catch: 2.5% overshoot)"],
  },
  {
    id: "s2-freeze",
    part: "PROBLEM",
    from: T.freeze,
    to: T.zoomTo,
    key: 2.3,
    focal: "the ferry photo, alone, the rest of the roll fallen dark",
    entry: "Silence; the other photos dim to near-black",
    exit: "The tile grows to fill the frame through the 2.5D camera's own lens (one picture, no swap)",
    purpose: "Out of thousands of photos, one: this one.",
    motion: ["panel (the dim)", "camera (lens zoom from tile to frame)"],
  },
  {
    id: "s3-alive",
    part: "REVEAL",
    from: T.zoomTo,
    to: T.peel,
    key: 3.6,
    focal: "her on the ferry, the skyline drifting behind her; the line behind her head",
    entry: "The photo becomes a place: a small push-in and rise, real parallax",
    exit: "The line drops back into its masks as the jacket starts to move",
    purpose: "The idea in words: \"Your camera roll is secretly a closet.\"",
    motion: ["camera (push + pedestal, 1.6 s glide)", "headline"],
  },
  {
    id: "s4-peel",
    part: "PROOF",
    from: T.peel,
    to: LENGTH,
    key: 7.2,
    focal: "her denim jacket, floating off her toward the camera; she is left in her striped tee, out of focus",
    entry: "The jacket lifts off her, slow (a 2.6 s critically damped glide); its shadow on her spreads and fades",
    exit: "The jacket hovering in focus, still drifting; the city soft behind (the hook ends; the ad carries on)",
    purpose: "Show the trick: a piece of her closet comes out of a photo.",
    motion: ["piece (slow-motion glide, no bounce)", "camera (a gentle pull back)", "rack focus (exponential)"],
  },
];
