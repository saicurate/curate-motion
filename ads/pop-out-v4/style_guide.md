# Pop out v4: style guide

**Reference:** our own approved App Store header film, `ads/app-store-header-all` (30 s, 3840 × 1646) and its
portrait form `ads/app-store-previews-hybrid` (the three previews submitted with 1.7.0). Ours, so nothing is
borrowed from anyone else: v4 takes their grammar whole and lays it out for 9:16 with music.

## Palette

| Token | Hex | Where |
|---|---|---|
| Mist | `#F4F3F0` | the ground at frame 0, the lockup, the loop |
| Blush stone | `#ECDFD7` | the ground as the coat lifts (DUMBO's brick, pushed to Mist) |
| Dusty blue | `#DDE5EC` | as the jacket lifts (the ferry's sky) |
| Oat | `#EFE5D3` | as the scarf lifts (the park's autumn) |
| Sand | `#F3EDE3` | the roll, the phone, the proof |
| Ink | `#181818` | the key phrase, "Curate" |
| Winter grey | `#656565` | the rest of each line |
| Shadow | rgb(58,46,36) | every shadow: warm, never black |

Colour comes from her photos, her clothes and the app; the ground only ever takes a photo's own tone, one at a
time, 0.7 s each (exponential).

## Type

Geist Medium (500) only, tracking −0.04 em. Lines 80 px, two lines, top-left at (64, 110), the key phrase in
ink and the rest in grey, words rising out of masks on the `headline` spring (KeyLine). The lockup: "Curate"
160 px beside the mark, "Try it. Style it. *Wear it.*" 64 px, "On the App Store" 46 px, centred.

## Shot lengths and cuts

One bar (1.85 s) for the hook and the problem, two bars each for the reveal and the proof, two for the close.
No hard cuts in the picture: the camera carries every change (pull, push, pans). Inside the phone the scan's
three cuts cross-fade 0.2 s, at real speed.

## Camera and motion classes

| Move | Class / spring | Length |
|---|---|---|
| The slow breath in on the hook | `camera` | the first bar |
| The pull back to her roll | `camera`, normalised | 1.4 s |
| The push into the phone (nearer layers move more: pieces 1.6×) | `camera`, normalised | 1.8 s |
| The pan to the lockup, through the light column | `camera`, normalised | 1.8 s |
| The glide back to frame 0 | ζ 1, 0.34 s response | 0.8 s |
| A piece lifting | `piece` | 0.48 s settle |
| A piece gliding to rest (an arc, 120 px) | ζ 0.94, 0.62 s | |
| The phone appearing | fade (exponential), whole and straight | 0.6 s |

Bouncy easing nowhere (no Zee in this film, as the header). Opacity and colour on exponential curves.

## Blur, grain, sound

Sub-frame motion blur from the analytic speed (gaps ≤ 2 px, shutter 0.5); grain 0.03, vignette 0.12. Sound at
G5: the music bed plus designed sound on the same clock (lifts on the beats, a soft whoosh on the pull and the
pans), −14 LUFS.

## Safe areas and the loop

Lines and the lockup stay inside the 9:16 safe area (clear of the top 110 px and the bottom 250 px of platform
chrome at the lockup). The last frame is the first: her three photos at rest on Mist.

## Banned

Drawn app screens; anything over or out of the phone; black shadows; more than one tone at a time; bouncy UI.
