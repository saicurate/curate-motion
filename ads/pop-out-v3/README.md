# pop-out-v3: Pop out, made by the studio process

**What:** "Your whole closet is already in your camera roll; Curate pulls it out." 15 s, 9:16, 60 fps.
Her denim jacket lifts out of her ferry photo → the camera glides back to her camera roll → glides
into her market photo, the phone forms round it, and the real app lifts her Ballet Flats out of it →
the real review screen counts to 41 pieces → the Curate lockup, Zee → back to frame 0 (a loop).

**Status:** draft, **G2 in review** (the founder approves the brief, style guide, shot list and the
storyboard stills before G3). The G2 phone page (private): https://claude.ai/artifact/4tnfSDLUbBQTUuo96epwxM.
Not rendered for review yet. v1 (`ads/pop-out`) and v2's picture (`ads/pop-out-v2`) are untouched; v2's
`sound.ts` now uses `motion/sound` (byte-identical output).

| File | What |
|---|---|
| `brief.md` | the FILM sentence, audience, durations, formats, assets (G1), visual, hard line |
| `style_guide.md` | palette, type, shot lengths, transitions, camera, motion classes, blur, sound, banned defaults (PROPOSED rules) |
| `shotlist.md` | the five shots on the measured beat map: entry, exit, purpose, motion class |
| `beatmap.ts` | generated: `tools/beats clip music.mixkit.cat-walk-arulo.v1 --from 29.536 --length 15 --fps 60` |
| `timeline.ts` | the moments, footage in-points and sound cues (pure; shared with the sound at G5) |
| `shots.ts` | the shot list as data; `tools/stills pop-out-v3 --shots` renders one still per shot |
| `index.tsx` | the composition `pop-out-v3--9x16--15s`: a pure function of t; motion/springs, SubframeBlur, StableImg |

Checks so far: `tools/motion-check pop-out-v3` clean; determinism EQUAL on frames 0, 83, 247, 400,
618, 816, 899; a silent timing pass (not shown) rendered 900 frames in 78 s at concurrency 1, strip
test clean (fastest move 16.5 px/frame at 60 fps), loop seam 0.73 vs a normal step 0.57, no layer drops.

**Draws on:** `inspo.creator.pop-off-reel.v1` (picture first, words at 1 s, one subject on a calm
stage, out of the photo and home again) and v2's lessons.
