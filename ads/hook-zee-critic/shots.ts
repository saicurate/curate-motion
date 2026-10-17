// Hook A: the shot list as data (shotlist.md is its readable form). tools/stills <ad> --shots renders one
// still per shot at `key`. Pure data.
import { T, LENGTH } from "./timeline.ts";

export type Shot = { id: string; part: "HOOK" | "PROBLEM" | "REVEAL" | "PROOF" | "CLOSE"; from: number; to: number; key: number; focal: string; entry: string; exit: string; purpose: string; motion: string[] };

export const SHOTS: Shot[] = [
  {
    id: "s1-pov",
    part: "HOOK",
    from: 0,
    to: T.zeeJump,
    key: 1.0,
    focal: "her, on the couch in her sweater and sweats; the POV line on the wall behind her",
    entry: "Her couch photo, already moving (frame 0 is not a still): a slow push-in, the room drifting behind her",
    exit: "The line up and readable, its first word tucked behind her hair",
    purpose: "The setup in one picture and one line: you, at home, in comfy clothes; your cat has opinions.",
    motion: ["camera (push-in + truck, 1.6 s glide)", "headline (KeyLine, words 0.07 s apart)"],
  },
  {
    id: "s2-zee",
    part: "PROBLEM",
    from: T.zeeJump,
    to: T.drop,
    key: 2.5,
    focal: "Zee, peeking over her knee, staring at her outfit, deadpan",
    entry: "Zee hops up from behind her knee (her cut-out hides its body), backlit by the lamp",
    exit: "A reverse dolly-zoom: the room looms, she recedes, Zee holds still; the POV line drops away",
    purpose: "The critic arrives and judges. The joke is in its face, not in a caption.",
    motion: ["mascot (the hop, squash and stretch)", "camera (reverse dolly-zoom into the drop)", "headline (exit)"],
  },
  {
    id: "s3-verdict",
    part: "PROBLEM",
    from: T.drop,
    to: T.toPhone,
    key: 3.6,
    focal: "\"girl… no.\" on the wall behind her; Zee unimpressed",
    entry: "THE DROP: the camera stops dead (a damped shake); the verdict rises on the beat",
    exit: "A fade (Apple: fades between shots) to the phone",
    purpose: "The punchline on the drop: the line people repeat.",
    motion: ["headline (lands hard)", "camera (dead stop)"],
  },
  {
    id: "s4-app",
    part: "REVEAL",
    from: T.toPhone,
    to: T.toSlay,
    key: 5.4,
    focal: "the real look card landing in Curate, in Apple's iPhone 17 Pro Max bezel (Silver)",
    entry: "Fade in: the whole phone, straight on, on Angora White; the line above it",
    exit: "A fade to her night-out photo",
    purpose: "Proof the app does it, with her own clothes: \"Zee restyles you from your own closet.\"",
    motion: ["camera (a 3% glide in, after the whole phone)", "headline"],
  },
  {
    id: "s5-slay",
    part: "CLOSE",
    from: T.toSlay,
    to: LENGTH,
    key: 7.4,
    focal: "her night-out photo alive; SLAY. behind her; Zee cheering at her feet",
    entry: "Fade in: the street already moving; SLAY. rises behind her",
    exit: "Zee cheering, the street drifting (the hook ends; the ad carries on)",
    purpose: "The payoff: same critic, opposite verdict.",
    motion: ["camera (push-in)", "headline", "mascot (Zee pops up)"],
  },
];
