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
