# pop-out-v3: Pop out, made by the studio process

**What:** "Your whole closet is already in your camera roll; Curate pulls it out." 15 s, 9:16, 60 fps.
Her denim jacket lifts out of her ferry photo → the camera glides back to her camera roll → glides
into her market photo, the phone forms round it, and the real app lifts her Ballet Flats out of it →
the real review screen counts to 41 pieces → the Curate lockup, Zee → back to frame 0 (a loop).

**Status:** draft. **G2 approved** by the founder ("Yeah", 2026-10-15); **G3 approved** ("not quite up to
the mark but would like to see the results", 2026-10-16; defaults kept: the flat-lay jacket cut-out, the
phone position). **G4 done**: the animatic, critic rounds 7–9 in motion. **G5 in review**: the full pass
at 1080×1920, 60 fps, with the designed sound (`sound.ts` → `sfx.curate.pop-out-v3-sound.v2`, draft) over
Cat Walk, −14.2 LUFS, true peak −2.3 dBTP, critic rounds 10–12, every score 8
(`reviews/pop-out-v3/2026-10-16/`, `reviews/pop-out-v3/scores.json`). Render:
`renders/pop-out-v3/tiktok/15s/pop-out-v3-g5_tiktok_9x16_15s_v3.mp4`. The founder's pages (private):
storyboard https://claude.ai/artifact/4tnfSDLUbBQTUuo96epwxM, phone review
https://claude.ai/artifact/EwVYnHsfAWgSiyjdAXVyzy. v1 (`ads/pop-out`) and v2 (`ads/pop-out-v2`) are untouched.

| File | What |
|---|---|
| `brief.md` | the FILM sentence, audience, durations, formats, assets (G1), visual, hard line |
| `style_guide.md` | palette, type, shot lengths, transitions, camera, motion classes, blur, sound, banned defaults (PROPOSED rules) |
| `shotlist.md` | the five shots on the measured beat map: entry, exit, purpose, motion class |
| `beatmap.ts` | generated: `tools/beats clip music.mixkit.cat-walk-arulo.v1 --from 29.536 --length 15 --fps 60` |
| `timeline.ts` | the moments, footage in-points and sound cues (pure; shared with the sound at G5) |
| `shots.ts` | the shot list as data; `tools/stills pop-out-v3 --shots` renders one still per shot |
| `sound.ts` | the designed sound (motion/sound, G5): `node ads/pop-out-v3/sound.ts <out.wav>`; byte-identical every run |
| `index.tsx` | the composition `pop-out-v3--9x16--15s`: a pure function of t; motion/springs, SubframeBlur, StableImg |

Checks at G3: `tools/motion-check pop-out-v3` clean; determinism EQUAL on frames 0, 83, 264, 336, 396,
480, 554, 668, 816, 862, 899 and 19/19 shot stills identical on a repeat run; frame 899 byte-identical
to frame 0; internal silent 540×960 passes (critic evidence only, not shown) strip clean, no layer
drops; text clear of the TikTok/Reels safe zones.

**Draws on:** `inspo.creator.pop-off-reel.v1` (picture first, words at 1 s, one subject on a calm
stage, out of the photo and home again) and v2's lessons.
