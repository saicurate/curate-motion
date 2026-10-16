#!/usr/bin/env node
// The designed sound for one concept animatic: every cue in ads/_demos/<slug>/timeline.ts › CUES,
// synthesised with motion/sound (seeded, no stock or paid SFX).   node ads/_demos/sound.ts <slug> <out.wav>
import { createSound, type HitKind } from "../../motion/sound/index.ts";

const [slug, out] = process.argv.slice(2);
if (!slug || !out) throw new Error("usage: node ads/_demos/sound.ts <slug> <out.wav>");
const tl = (await import(`./${slug}/timeline.ts`)) as { LENGTH: number; CUES: readonly { t: number; kind: HitKind; gain?: number }[] };
const s = createSound({ durationSec: tl.LENGTH });
for (const c of tl.CUES) if (c.t >= 0 && c.t < tl.LENGTH) s.hit(c.kind, c.t, c.gain ?? 1);
s.writeWav(out, { peakDb: -4 });
console.log(`sound: ${slug}, ${tl.CUES.length} cues → ${out}`);
