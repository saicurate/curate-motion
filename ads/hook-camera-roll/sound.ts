#!/usr/bin/env node
// Hook B: the designed sound, synthesised in code on the picture's clock (motion/sound). No stock or paid SFX;
// seeded, byte-identical every run.
//
//   node ads/hook-camera-roll/sound.ts [out.wav]       (default: .cache/hook-camera-roll-sound.wav)
//   tools/catalog add <out.wav> --kind sfx --scope curate --name hook-camera-roll-sound --licence curate --tags ad=hook-camera-roll
//
// Swishes on the thumb's flicks, faster and faster with the scroll, a riser under them cut dead on the
// freeze; on the freeze an impact and a snap while the music cuts; a settle as the roll falls dark; a glide
// under the zoom; a land for the line; a pop and a slow whoosh as the jacket leaves her; an impact on the
// track's drop at the end. In the silence between the freeze and the peel, only these.
import { createSound } from "../../motion/sound/index.ts";
import { CUES, LENGTH, T } from "./timeline.ts";

const s = createSound({ durationSec: LENGTH, seed: 0xb011 });
s.riser(0.35, T.freeze, 0.36);
for (const c of CUES) s.hit(c.kind, c.t, c.gain);
const out = process.argv[2] ?? ".cache/hook-camera-roll-sound.wav";
const norm = s.writeWav(out, { peakDb: -3 });
console.log(`wrote ${out}: ${(s.LEN / s.SR).toFixed(2)} s, ${CUES.length} hits + riser, peak normalised ×${norm.toFixed(3)}`);
