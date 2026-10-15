# rain-or-shine

**What:** concept c9 with real footage. Rain runs down the glass over Emma's phone while Zee works
out tomorrow in her real chat ("What should I wear to work tomorrow?" → "Going through your 49
pieces…") and lands a drizzle-proof work look ("Covered."). A windshield-wiper sweep clears the rain
exactly as Better Times comes back, and a beat later the app's own four-stroke window wipe answers it
("There's your sky"); "Sun's out.", the look for tonight lands, the light drops to dusk ("57°
tonight.") and the real carousel swipes to the wool coat. A second sweep clears to the end card
("Dressed for the weather.").

**Status:** draft. **Length:** 15 s, 9:16. **Track:**
`music.mixkit.better-times-are-coming-alejandro-magana.v1` from 33.1 s: the rain plays over the
breakdown; the first wiper finishes on the return (38.1 s = beat 10); cuts on beats 7, 10, 14, 19,
24; ends on the 48.1 s bar line. Gain 0.84 (≈ −14 LUFS).

**Transitions:** wiper sweep (a conic mask about a pivot below the frame, with the blade), echoed by
the app's own window wipe; push-ins on the real UI (`Footage zoom`); punch cuts; a single light sweep
as the sun comes out; a colour-temperature move to dusk; 3D phone tilt.

**Files:** `Rain.tsx` (streaks, beads on the glass, bokeh, the wiper and its mask), `index.tsx`.

**Render:** `tools/sync pull --ad rain-or-shine && tools/render rain-or-shine --concurrency 1` (above 1, Chrome can drop
layers on single frames).
