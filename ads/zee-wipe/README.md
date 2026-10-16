# zee-wipe

**What:** concept c7 with real footage. Zee, a black plush kitten, is the transition: she leaps at
the lens and her fur blacks out the frame, her silhouette opens a window onto the next moment, she
whips across the screen with a motion-blurred trail. Behind her is Emma's real app: a look landing,
the Wardrobe, the looks carousel (her swipe matches the app's own swipe direction), two try-ons, a
trip look, "Me too."

**Status:** draft. **Track:** `music.mixkit.cant-get-you-off-my-mind-michael-ramir-c.v1` from 24.95 s.
Its hits come every bar (1.6 s); the first (25.58 s) is the first fur peak; the track drops out for
half a second before every fourth bar, and that silence is where she leaps at the lens.

| Cut | How to render | Moment |
|---|---|---|
| 15 s compilation | `tools/render zee-wipe --length 15` | all of them; "Styled." "Sorted." "Tried on."; iris out of black onto "Styled by Zee." |
| 6 s looks | `tools/render zee-wipe --length 6 --props '{"bumper":"looks"}' --name looks` | the date-night look lands, "Styled by Zee." |
| 6 s wardrobe | `… --props '{"bumper":"wardrobe"}' --name wardrobe` | the Wardrobe scrolling, "Your closet, sorted." |
| 6 s try-ons | `… --props '{"bumper":"tryons"}' --name tryons` | the curtain opens on her try-on, "See it on you." |

The 6 s bumpers loop: frame 0 is her fur pulling away from the lens, the last frame is her fur
filling it again. In Studio the `bumper` prop is a dropdown. Add `--concurrency 1` to every render
(above 1, Chrome can drop layers on single frames).

**Components:** ZeeLeap, Fur, ZeeWindow (+ ZeeWindowPreload, mounted from frame 0 so the mask image
is decoded before it's used), MotionBlur, ZeeActor, PhoneFrame, Footage, Slam, StoreEndCard.

**Feed formats:** every cut also renders in 4:5 (`--format 4x5`, the Instagram feed) and the 15 s in
1:1 (`--format 1x1 --channel meta-feed`). The phone is as tall as the frame allows under the words
(a little smaller in 1:1 so the words never touch it); Zee's spots stay beside the phone.

**°F (2026-10-15):** the app's weather lines are °F; Zee's words (from the brain) are °C. The 15 s
plays the look landing from 4.03 s at 0.95x and the looks bumper plays it 4.0–5.4 s, then cuts on
beat 3 to her real "Love it" tap (`look-love-it.v1` from 9.5 s), so "14° tonight" (5.63 s on) and the
"17°" thinking line (until 4.08 s) are never on screen.

**QA fix (2026-10-15):** in the 15 s, the leap after the second fur wipe now starts on hit(4) (it was
hit(4) + 1, which left one frame of dimmed phone between the fur and Zee at 7.0 s). The 15 s mix is
×1.02 over the bumpers' gain: it measured −15.1 LUFS before, −14.9 now, true peak −1.1 dBTP.
