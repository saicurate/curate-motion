# Hook B: style guide

- **Palette:** her photos as shot in the roll; the ferry graded `EDITORIAL` in the DepthPhoto shader. The roll's ground goes from the Photos app's white to near-black `#0E0E0F` as the other photos dim. Type: key phrase `#181818`, body `#656565` on the sky.
- **Type:** Geist Medium 92 px, centred, two lines; KeyLine rise 0.075 s apart, drops back into its masks as the peel starts.
- **The scroll:** an accelerating flick (speed ∝ t^2.2 to full speed at 1.25 s, ≈100 px/frame), a dead stop at 1.9 s with a 2.5% catch; `SubframeBlur` with `samplesFor(speed, 0.5, 3, 20)` (≤ 3 px between samples, 1 when still). Tiles are `StableImg fit` (decoded once at tile size: deterministic).
- **The zoom:** the 2.5D camera's lens widens from tile size to the rest pose (an exact scale of the photo, no parallax), with the tile's clip opening to the frame: the same picture throughout.
- **Camera:** `camera` springs (push 0.08 + pedestal 0.022, then a gentle pull back for the peel).
- **The peel:** the jacket moves as one depth mesh: forward 0.28, a small lift that cancels the perspective drop (its collar stays under her chin, its cut hem below the frame), a slow twist; a critically damped 2.6 s glide (no bounce), then a slow drift so it never stops dead. Its shadow on her: the jacket in black, blurred 6→32 px, multiply, fading.
- **Rack focus:** CSS blur on the plate (×1.35) and on her (5.5 px), exposure −0.25/−0.3, exponential over 1.8 s.
- **Finish:** `Vignette` 0.26→0.38, `Grain` 0.05 on the photo shot.
- **Banned:** bouncy easing, the old "white outline sticker", CSS blur as fake motion blur, a phone in this hook.
