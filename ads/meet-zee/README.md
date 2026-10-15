# meet-zee

**What:** Zee alone on the Mist ground waves hello, "Meet Zee." rises and leaves, she flips mood on
every beat (the room goes dark on every fourth flip, stars on idea/cheer), then settles happy under
"Your stylist." and the Curate logo. No app footage, no people, no products.

**Status:** draft (`ad.json`). Built 2026-10-15 from motion test c2 as the first ad assembled
from the library; the template for the rest.

**Outputs:** 9x16, 4x5, 1x1 × 6 s and 15 s (compositions `meet-zee--<format>--<length>s`).
The 6 s cut drops the flips (`planScenes`: hello → settle).

**Built from:** track `music.mixkit.gummies-michael-ramir-c.v1` (120 bpm, first beat 0.25 s);
Zee `hello` intro + loop and the loops of curious, focused, thinking, idea, love, excited, cheer,
happy; `brand.curate.logo-splash.v1`; Geist. Components: Ground, Track, ZeeActor, Words, Star, Logo,
BeatClock, planScenes, useFrameBox.

**Reusable ideas:** the beat-locked mood flip (`ZeeCue` with `cut` + `loopStart`), the breathing
disc that turns into a spotlight on dark beats so black Zee still reads.

**Render:** `tools/sync pull --ad meet-zee && tools/render meet-zee --draft`.
