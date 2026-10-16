# pop-out

**What:** Curate's first real ad (concept c14, from the founder's reference reel). Emma's phone lies
on a desk showing her real camera roll. On Cat Walk's beat her real pieces burst out of her own
photos (15% → 100% with an overshoot), hold, and sink back home, while "Your closet is already in
your photos." types on behind them. On beat 9 everything bursts up at once in depth, then sinks home
as the phone turns face-on, and the roll **match-cuts** into the app's real scan of that same roll:
the same photos in the same 4-column grid (`Roll.tsx` is drawn in the footage's own 1320 × 2868
pixels, in her phone's real order). Then her pieces arrive (real footage), the Wardrobe floats in
depth with her cut-outs around the phone, and a vertical whip to the end card (mark, "Curate",
"On the App Store", Zee peeking).

**Status:** draft. **Track:** `music.mixkit.cat-walk-arulo.v1` from 29.04 s (one beat before the
drop at 29.5 s), gain 0.62 (≈ −14 LUFS).

| Cut | Composition | What's in it |
|---|---|---|
| 6 s | `pop-out--9x16--6s`, `pop-out--4x5--6s` | three pops, the whole look out of one photo + the lockup, home again. A seamless loop (last frame = first frame; the camera drift is periodic). |
| 15 s | `pop-out--9x16--15s`, `pop-out--4x5--15s` | pops → burst → dive + match cut → scan → picked → pieces → Wardrobe in depth → end card. Ends as the track drops into its break (a button ending). |
| 30 s | `pop-out--9x16--30s`, `pop-out--4x5--30s` | adds "Found 30 photos of you", Zee's cheer on the music's break, the burst back on the drop (flash), a look card landing, her "Love it" tap ("Me too.") and a try-on. Ends on the track's next break. |
| feed | `pop-out--4x5--6s/15s/30s`, `pop-out--1x1--15s` | the Instagram feed (4:5) and square (1:1, feed and carousel): the same cut, re-laid out by `useFrameBox()`: the 6 s look comes out to the left of the phone, the Wardrobe cloud is pulled in so no piece is cut at the edge, Zee peeks over the right of the phone. |

**Transitions:** pop-out-and-return (overshoot spring), scan dots + white trace, parallax burst in
depth, 3D phone turn (perspective), match cut roll → scan, jump cuts with a 4% punch, whip pans with
a directional SVG motion blur (`MotionBlur`), a vertical whip to the end card, one white flash (30 s).

**Built from:** `Roll.tsx` (camera roll in app pixels), `FOOT` (which clip, from where, how fast,
how it comes in), `POPS` / `BURST` / `CLOUD` (pieces, their photos and depth). Components:
PhoneFrame (`island={false}` for footage), Footage, Piece, popCurve, ScanDots, MotionBlur, Flash,
StoreEndCard, ZeeActor, BeatClock, planScenes, useFrameBox.

**Render:** `tools/sync pull --ad pop-out && tools/render pop-out --format 9x16 --length 15 --concurrency 1`
(and `--format 4x5 --length 15` for the feed). Use `--concurrency 1`: at 2 or 3 Chrome drops layers
on single frames of these scenes (a black phone screen, missing pieces). Check every render for it.

**°F (2026-10-15):** the app's own weather lines are already °F (it follows the phone's region), but
Zee's words come from the brain, which writes °C ("14° tonight", "17°"). The 30 s look scene now
plays `look-card-landing.v1` only from 4.1 to 5.5 s (its clean window: the "17°" thinking line has
faded by 4.08 s, "14° tonight" streams in at 5.63 s), then cuts on the beat to `look-love-it.v1`.
Any clip with Zee's weather words must be timed the same way until the brain speaks °F.
