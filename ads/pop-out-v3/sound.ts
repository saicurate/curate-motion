#!/usr/bin/env node
// Pop out v3: the designed sound (G5), synthesised in code on the picture's clock (motion/sound).
// No stock or paid SFX. Same calls in the same order = the same bytes (seeded noise).
//
//   node ads/pop-out-v3/sound.ts [out.wav]        (default: .cache/pop-out-v3-sound.wav)
//
// Then into the library (the ad reaches it by id, sfx.curate.pop-out-v3-sound.v2):
//   tools/catalog add <out.wav> --kind sfx --scope curate --name pop-out-v3-sound --licence curate …
//
// Layers, all from the measured beat map (timeline.ts › clock, CUES, RISER):
//   - a soft kick on every beat (33), softer from the track's break (14.76 s), so the loop breathes
//   - a riser from the review sheet (7.85 s) that cuts dead on the proof's downbeat (9.23 s, "41")
//   - a named hit on every transformation (timeline.ts › CUES): the jacket's pop, each line's land,
//     a low glide under each camera move, the phone's settle, the app's pop, the sheet's swish,
//     the impact on 41, the whoosh into the phone's exit, the CTA chime, Zee's pop, the loop's glide
// The bus is peak-normalised to −3 dBFS; the ad's sfxVolume sets it against the music, and
// tools/critic measures the final mix (−14 LUFS integrated, true peak ≤ −1 dBTP).
import { createSound, scoreFromBeats } from "../../motion/sound/index.ts";
import { BEATMAP } from "./beatmap.ts";
import { CUES, LENGTH, RISER, RISER_GAIN, T } from "./timeline.ts";

const s = createSound({ durationSec: LENGTH });
scoreFromBeats(s, {
  beats: BEATMAP.beats,
  kickGain: 0.5,
  softFrom: T.breakdown, // the track's break: the loop's breath
  softGain: 0.26,
  riser: [RISER[0], RISER[1], RISER_GAIN],
  cues: CUES.map((c) => ({ t: c.t, kind: c.kind, gain: "gain" in c ? c.gain : undefined })),
});
const out = process.argv[2] ?? ".cache/pop-out-v3-sound.wav";
const norm = s.writeWav(out, { peakDb: -3 });
console.log(`wrote ${out}: ${(s.LEN / s.SR).toFixed(2)} s, ${CUES.length} hits + ${BEATMAP.beats.length} kicks + riser, peak normalised ×${norm.toFixed(3)}`);
