#!/usr/bin/env node
// Hook A: the designed sound, synthesised in code on the picture's clock (motion/sound). No stock or paid SFX;
// the same calls in the same order write the same bytes (seeded noise).
//
//   node ads/hook-zee-critic/sound.ts [out.wav]        (default: .cache/hook-zee-critic-sound.wav)
//   tools/catalog add <out.wav> --kind sfx --scope curate --name hook-zee-critic-sound --licence curate --tags ad=hook-zee-critic
//
// No kicks of its own: In My Back carries the beat. Hits on the moments (timeline.ts › CUES): the line's
// land, Zee's pop and soft landing in the track's silence, a tick as Zee goes deadpan, a low riser under the
// vertigo cut dead on the drop, the impact on "girl… no.", the glide and settle into the phone, the whoosh
// to the street, the impact on SLAY., Zee's pop and chime.
import { createSound } from "../../motion/sound/index.ts";
import { CUES, LENGTH, RISER } from "./timeline.ts";

const s = createSound({ durationSec: LENGTH, seed: 0xa11ce });
s.riser(RISER[0], RISER[1], RISER[2]);
for (const c of CUES) s.hit(c.kind, c.t, c.gain);
const out = process.argv[2] ?? ".cache/hook-zee-critic-sound.wav";
const norm = s.writeWav(out, { peakDb: -3 });
console.log(`wrote ${out}: ${(s.LEN / s.SR).toFixed(2)} s, ${CUES.length} hits + riser, peak normalised ×${norm.toFixed(3)}`);
