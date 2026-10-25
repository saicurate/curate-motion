// Pop out v4: the shot list as data (shotlist.md is its readable form). tools/stills <ad> --shots renders one
// still per shot at `key`. Pure data.
import { T, TOTAL } from "./timeline.ts";

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
    to: T.pull,
    key: 1.75,
    focal: "her camel coat, lifted out of her DUMBO photo",
    entry: "Her three photos on Mist, nothing lifted (= the last frame: the loop)",
    exit: "The coat, the denim jacket and the scarf held in front of their photos; the line up",
    purpose: "Picture first: her clothes come out of her photos, one a beat on the drop. The line at 0.92 s says why.",
    motion: ["piece (each lifts, 1.1% settle)", "the ground: one tone a beat (blush, dusty blue, oat)", "headline (lands at 0.92 s)"],
  },
  {
    id: "s2-problem",
    part: "PROBLEM",
    from: T.pull,
    to: T.phone,
    key: 3.45,
    focal: "her camera roll, the three pieces over it",
    entry: "The three pieces lifted, the photos big",
    exit: "The camera has glided back: three of thirty photos in her camera roll; the pieces held over it",
    purpose: "The problem in a picture: her whole closet is in there, scattered through thirty photos.",
    motion: ["camera (the pull back, 1.4 s, no overshoot)", "the roll fades in around her three photos"],
  },
  {
    id: "s3-reveal",
    part: "REVEAL",
    from: T.phone,
    to: T.push,
    key: 5.6,
    focal: "the real app: her photos sorted out of her camera roll",
    entry: "The roll recedes; the phone fades up whole and straight with the real scan",
    exit: "The scan's fan of her photos; the three pieces at rest beside the phone",
    purpose: "The product, really doing it: the real 284 scan at real speed, sorting her photos from the rest.",
    motion: ["panel (the phone fades up)", "piece (the pieces glide down to rest beside it, an arc)", "headline"],
  },
  {
    id: "s4-proof",
    part: "PROOF",
    from: T.push,
    to: T.out,
    key: 10.6,
    focal: "Added 14 wardrobe items from 7 photos, over her rails",
    entry: "The camera pushes into the phone; the pieces leave past the camera",
    exit: "Her wardrobe in rails at hero size; the line up",
    purpose: "Proof on one real screen: her items, sorted, and the app's own count.",
    motion: ["camera (the push, 1.8 s; nearer layers move more)", "headline (lands on the bar at 9.23 s)"],
  },
  {
    id: "s5-close",
    part: "CLOSE",
    from: T.out,
    to: TOTAL,
    key: 13.4,
    focal: "the lockup and On the App Store",
    entry: "The pan through a soft column of light",
    exit: "Her three photos glide back in: the first frame again",
    purpose: "The name, the line, where to get it, held 2.2 s; then the loop.",
    motion: ["camera (the pan, 1.8 s)", "headline (the line, then the CTA)", "camera (the glide back, 0.8 s)"],
  },
];
