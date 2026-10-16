// Pop out v3: the shot list as data (shotlist.md is its readable form). tools/stills <ad> --shots
// renders one still per shot at `key`. Pure data.
import { T, TOTAL, FPS } from "./timeline.ts";

export type Shot = {
  id: string;
  part: "HOOK" | "PROBLEM" | "REVEAL" | "PROOF" | "CLOSE";
  from: number;
  to: number;
  /** The still: the moment that shows the shot best. */
  key: number;
  focal: string;
  entry: string;
  exit: string;
  purpose: string;
  motion: string[];
};

export const SHOTS: Shot[] = [
  {
    id: "s1-hook",
    part: "HOOK",
    from: 0,
    to: T.home,
    key: 1.38,
    focal: "her denim jacket, lifting out of her photo",
    entry: "Her ferry photo, big, alone on Angora White (= the last frame: the loop)",
    exit: "The jacket held in front of the photo (the photo veiled back); the line up and readable",
    purpose: "Picture first: a piece of clothing comes out of a photo. Words at 0.92 s say why it matters.",
    motion: ["piece (the jacket lifts, 1.1% settle)", "headline (lands at 0.92 s, holds 2.8 s)"],
  },
  {
    id: "s2-problem",
    part: "PROBLEM",
    from: T.home,
    to: T.line1Out,
    key: 3.3,
    focal: "the line, over her camera roll",
    entry: "The jacket settles home into the photo",
    exit: "The camera has glided back: the photo is one of 30 in her camera roll",
    purpose: "The problem without a word more: her closet is in there, scattered across her photos.",
    motion: ["piece (home)", "camera (one long glide back, 1.7 s, no overshoot)"],
  },
  {
    id: "s3-reveal",
    part: "REVEAL",
    from: T.line1Out,
    to: T.screenChange,
    key: 6.6,
    focal: "the real app lifting her Ballet Flats out of her market photo",
    entry: "Her camera roll; the line leaves",
    exit: "The real app: Ballet Flats, named, the photo gone; “Curate pulls it out.” read",
    purpose: "The product, through a real interaction: the camera glides into one photo, the phone forms round it, and the real app does exactly what the hook promised.",
    motion: ["camera (glide into the market photo)", "panel (the phone settles round the tile)", "headline (“Curate pulls it out.” at 6.01 s, 1.8 s)"],
  },
  {
    id: "s4-proof",
    part: "PROOF",
    from: T.screenChange,
    to: T.phoneOut,
    key: 10.3,
    focal: "“41 pieces from your photos” (the app's real count)",
    entry: "The flats screen; the real review screen rises in the phone",
    exit: "Pushed in on the real header: 41 pieces from your photos, Ballet Flats first in the grid",
    purpose: "One real number, on the real screen: 41 pieces, from her photos. No caption needed.",
    motion: ["panel (the screen rises)", "camera (push-in on the count, from the downbeat)"],
  },
  {
    id: "s5-close",
    part: "CLOSE",
    from: T.phoneOut,
    to: TOTAL / FPS,
    key: 13.6,
    focal: "the Curate lockup: mark, Curate, On the App Store",
    entry: "The phone leaves downward; the mark arrives",
    exit: "Her ferry photo back where the film began (frame 899 = frame 0)",
    purpose: "A clean final state and a readable CTA, held 2.3 s; Zee is the only thing that bounces. Then the loop.",
    motion: ["panel (phone out)", "ui (mark, CTA)", "headline (Curate)", "mascot (Zee, 23% bounce)", "panel (loop back)"],
  },
];
