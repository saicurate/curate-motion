# rain-or-shine

**What:** concept c9 with real footage. Rain runs down the glass over Emma's phone while Zee works
out tomorrow in her real chat ("What should I wear to work tomorrow?" → "Going through your 49
pieces…") and lands a drizzle-proof work look ("Covered."). A windshield-wiper sweep clears the rain
exactly as Better Times comes back, and a beat later the app's own four-stroke window wipe answers it
("There's your sky"); "Sun's out.", the look for tonight lands, the light drops to dusk ("57°
tonight.") and the real carousel swipes to the wool coat. A second sweep clears to the end card
("Dressed for the weather.").

**Status:** draft. **Length:** 15 s, in 9:16, 4:5 (Instagram feed) and 1:1 (feed and carousel). **Track:**
`music.mixkit.better-times-are-coming-alejandro-magana.v1` from 33.1 s: the rain plays over the
breakdown; the first wiper finishes on the return (38.1 s = beat 10); cuts on beats 7, 10, 14, 19,
24; ends on the 48.1 s bar line. Gain 0.84 (≈ −14 LUFS).

**Transitions:** wiper sweep (a conic mask about a pivot below the frame, with the blade), echoed by
the app's own window wipe; push-ins on the real UI (`Footage zoom`); punch cuts; a single light sweep
as the sun comes out; a colour-temperature move to dusk; 3D phone tilt.

**Files:** `Rain.tsx` (streaks, beads on the glass, bokeh, the wiper and its mask), `index.tsx`.

**Render:** `tools/sync pull --ad rain-or-shine && tools/render rain-or-shine --concurrency 1` (above 1, Chrome can drop
layers on single frames).

**Feed formats (4:5, 1:1):** the phone stands on the right at full height and the words take the
left column, stacked ("Rain / tomorrow."), sized so the longest word fits the column; the end card
is StoreEndCard's shorter layout.

**°F (2026-10-15):** the app's weather lines are °F, but Zee's own words come from the brain, which
writes °C. So: "Covered." plays `chat-thinking-lines.v2` from 27.3 s at 0.7x, ending at 28.35 s,
before her reply ("13–23°… 22°C") appears at 28.45 s; the sun look plays `look-card-landing.v1`
4.1–5.57 s only (clean window 4.08–5.58 s), then her real "Love it" tap (`look-love-it.v1` from 9.6 s)
until dusk. Until the brain speaks °F, time every clip with Zee's weather words like this.
