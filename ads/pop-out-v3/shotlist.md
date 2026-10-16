# Pop out v3: shot list

**Gate:** G2 (in review). Times are seconds from frame 0 on the **measured** beat map
(`beatmap.ts`, from `tools/beats`: Cat Walk 130.00 BPM, frame 0 = the drop at 29.536 s). 60 fps:
frame = seconds × 60. The same list as data: `shots.ts` (the stills) and `timeline.ts` (the moments).

Beats (s): 0 · 0.47 · 0.92 · 1.38 | **1.85** · 2.30 · 2.76 · 3.23 | **3.70** · 4.17 · 4.63 · 5.09 |
**5.53** · 6.01 · 6.47 · 6.93 | **7.38** · 7.85 · 8.31 · 8.76 | **9.23** · 9.69 · 10.18 · 10.62 |
**11.06** · 11.55 · 12.01 · 12.48 | **12.93** · 13.40 · 13.86 · 14.30 | **14.76** (break). Bold =
downbeats. Bar-end hits (whooshes): 1.625, 3.471, 5.317, 7.163, 9.009, 10.855, 12.701, 14.547.

| # | Part | Time | Entry state | Exit state | Purpose | Motion class | Focal point |
|---|---|---|---|---|---|---|---|
| 1 | HOOK | 0.00–1.85 (f0–f111) | Her ferry photo, big, alone on Angora White (= frame 899) | The denim jacket held out in front of the photo (photo veiled back); line 1 landed | Picture first: a piece of clothing comes out of a photo; the words at 0.92 s say it's about your camera roll | piece (lift, on the drop), headline (0.92 s) | the jacket |
| 2 | PROBLEM | 1.85–3.70 (f111–f222) | The jacket settles home on the downbeat | The photo is one of 30 in her camera roll; line 1 still up (held 2.78 s) | The problem with no extra words: her closet is in there, scattered across photos | piece (home), camera (glide back, 1.7 s) | the line, over the roll |
| 3 | REVEAL | 3.70–7.85 (f222–f471) | The roll; line 1 leaves on the downbeat | Real app: "Ballet Flats", the photo gone; "Curate pulls it out." read (1.84 s) | The product through a real interaction: glide into her market photo, the phone forms round it (the tile IS the app's card), and the real app lifts the flats out on the downbeat (5.53) | camera (glide in), panel (phone forms, 4.17), headline (6.01) | the real app's lift |
| 4 | PROOF | 7.85–11.06 (f471–f664) | The flats screen | Pushed in on the real header: **41 pieces from your photos** | One real number on the real screen. The real count lands on 41 on the downbeat (9.23); the camera pushes in so it reads at phone size | panel (screen rises, 7.85), camera (push-in, 9.23) | "41 pieces from your photos" |
| 5 | CLOSE | 11.06–15.00 (f664–f900) | The phone leaves downward on the downbeat; the mark arrives | Her ferry photo back where the film began (loop) | A clean final state and a readable CTA: mark, "Curate" (11.55), "On the App Store" (12.01), held to 14.30 (2.29 s); Zee pops up on the downbeat (12.93) and bounces; the lockup lifts and the photo returns on the break | panel (phone out; loop back, 14.30), ui (mark, CTA), headline (Curate), mascot (Zee) | the lockup |

**Every beat justifies itself:** 1 makes the promise in a picture, 2 states the problem, 3 shows the
product doing the promise for real, 4 proves it with the app's own number, 5 tells you where to get
it. Nothing else is on screen. (Cut from v2: the four-photo hook, the kinetic-type bar, the
line-into-phone morph, the tile flips, the fold into the Wardrobe, the orbit, the star morph.)

## Real app on screen

- 4.63–7.85 s `footage.emma.first-piece-lift.v1` from 0.35 s, real speed (3.2 s).
- 7.85–11.06 s `footage.emma.review-count-up.v1` from 0.92 s, real speed (3.2 s; the clip ends at 10.53 s, its own last frame holds after).
- Total **6.4 s**, the phone's screen 730 px wide (68% of the frame), pushed in to 2.05× on the count.

## Sound cues (G5, `timeline.ts › CUES`)

0 pop (jacket) · 0.92 land · 1.625 glide · 1.85 settle · 3.471 glide · 4.17 settle (phone) ·
5.53 pop (the app's lift) · 6.01 land · 7.85 swish · riser 7.85→9.23 · 9.23 impact (41) ·
10.855 whoosh · 11.55 land · 12.01 chime (CTA) · 12.93 pop (Zee) · 14.30 glide (loop) · a soft kick
on every beat.

## Stills (one per shot, at its key moment)

`tools/stills pop-out-v3 --shots` → `ads/pop-out-v3/out/stills/` (local): s1 at 1.38 s, s2 at 3.30 s,
s3 at 6.60 s, s4 at 10.30 s, s5 at 13.60 s.

## Known for G3/G4 (seen in a silent timing pass, not shown to the founder)

- 4.2–4.6 s: the phone forms faster than the tile grows: the empty screen reads before the card does.
- 7.85–8.2 s: the screen push shows the old screen's bottom and the new screen's top at once; Zee is
  clipped at the edge. Try a shorter push, or the new screen rising as a sheet over the old one.
- 6.1–7.85 s: the real app is still (1.7 s): a slow camera push (camera class) would keep it alive.
- The jacket's lift reads as "doubled": consider veiling the jacket's area of the photo more.
