#!/usr/bin/env node
// Pop out v2: the designed sound, generated in code (no stock or paid SFX), now built on the shared
// module motion/sound (which grew out of this file; the output is byte-identical to the original).
//
//   node ads/pop-out-v2/sound.ts [out.wav]        (default: .cache/pop-out-v2-sound.wav)
//
// Then add it to the library (the ad reaches it by id):
//   tools/catalog add <out.wav> --kind sfx --scope curate --name pop-out-v2-sound --licence curate …
//
// Layers, all on the beat map in timeline.ts: a soft kick on every beat (softer in the track's
// break), a riser into the strongest bar, and a crisp hit or whoosh on every transformation.
// The bus is peak-normalised to −3 dBFS; the ad's sfxVolume sets it against the music.
import { createSound, scoreFromBeats } from "../../motion/sound/index.ts";
import { B, FPS, HITS, RISER, TOTAL } from "./timeline.ts";

const sec = (beat: number) => B(beat) / FPS;
const s = createSound({ durationSec: TOTAL / FPS });
scoreFromBeats(s, {
  beats: Array.from({ length: 33 }, (_, n) => sec(n)),
  kickGain: 0.55,
  softFrom: sec(31), // beat 31 on is the track's break: softer still
  softGain: 0.32,
  riser: [sec(RISER[0]), sec(RISER[1]), 0.42],
  cues: HITS.map((h) => ({ t: sec(h.beat), kind: h.kind })),
});
const out = process.argv[2] ?? ".cache/pop-out-v2-sound.wav";
const norm = s.writeWav(out, { peakDb: -3 });
console.log(`wrote ${out}: ${(s.LEN / s.SR).toFixed(2)} s, ${HITS.length} hits + 33 kicks + riser, peak normalised ×${norm.toFixed(3)}`);
