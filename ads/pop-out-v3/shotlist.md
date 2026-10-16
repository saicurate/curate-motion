# Pop out v3: shot list

**Gate:** G2 approved (2026-10-15); G3 approved (2026-10-16); G4 done (critic rounds 7–9); G5 in review (rounds 10–12). Times are seconds from frame 0 on the **measured** beat map
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
| 5 | CLOSE | 11.06–15.00 (f664–f900) | The phone leaves downward on the downbeat; the mark arrives | Her ferry photo back where the film began (loop) | A clean final state and a readable CTA: mark, "Curate" (11.55), "On the App Store" (12.01), held to 14.30 (2.29 s); Zee pops up on the downbeat (12.93) and bounces; the lockup lifts and the photo returns on the break | panel (phone drops + fades, 11.06; lockup lifts + fades, 14.30; her photo rises + fades up, 14.43), ui (mark at 11.21, CTA), headline (Curate), mascot (Zee) | the lockup |

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

## G3: stills per shot, critiqued (6 rounds, `reviews/pop-out-v3/2026-10-15/round-1…6/`)

Stills (real frames of the composition, `tools/stills`): entry / key moment / exit for every shot,
plus the moments the critic fixed: s1 0.00 · 1.38 · 1.83 · s2 1.87 · 3.30 · 3.68 · s3 3.72 · 4.40 ·
5.60 · 6.60 · 7.83 · s4 7.87 · 9.23 · 10.30 · 11.03 · s5 11.08 · 12.50 · 13.60 · 14.98 (19, and the
same 19 at 360 px wide), plus one at every beat (33, at 360 px). Round 6: `stills/`, `beat-strip.jpg`.

What changed in the picture at G3 (each marked `G3 fix (round N, …)` in index.tsx):
- S1: the flat-lay cut-out no longer sits on her worn jacket at rest (frame 0 was two jackets); the
  photo veils first, the cut-out fades up as it lifts, bigger and to the right (her face stays in
  view). Her photo sits 85 px higher so the jacket's hem clears the caption zone.
- S2→S3: the rest of the roll clears as the camera starts its glide in (3.78 s), not when the phone
  forms: the market photo is the one focal point of that beat.
- S3: the real app is under the forming screen from 4.17 s (its in-point frame held until 4.63 s),
  so the growing screen reveals the real app round the card instead of an empty phone. A slow camera
  push (×1.08) from 6.01 s keeps the still real screen alive (was a 1.68 s dead hold).
- S3→S4: the review screen rises OVER the flats screen as a sheet (it dims 10%), with a blur along its
  velocity; no two half screens, no cut Zee.
- S4: the push-in point moved 40 app px right so the header clears the right 15%.
- S5: the phone's exit 2400 → 1800 px and her photo's return 2200 → 1500 px (just clear the frame),
  both with a vertical blur; the lockup's exit too. The return's last 0.6 px eases to 0, so frame 899
  is byte-identical to frame 0.
- Sub-frame samples up to 16 (was 12).

Notes for G4 (watch in motion): the sheet's 0.25 s smear at 7.87–8.12 s; a faint double of "Curate"
in the lockup's exit (2 frames, 14.33 s); the real app's bottom bar sits under the platform caption
4.6–11 s (real UI, left as recorded).

## G4 / G5: judged in motion (rounds 7–12, `reviews/pop-out-v3/2026-10-16/`)

- G4 animatic (540×960, 60 fps, the Cat Walk bed): the sheet's quarter-second smear at 7.9–8.1 s was
  worse in motion than in the stills: the review recording brought its own status bar, so a second
  "9:41" and island slid up the phone. Fixed: the sheet rises under the phone's status bar, on a
  longer panel response (0.62 s; peak 101 px/frame). The 2-frame double of "Curate" at 14.35 s was the
  lockup and her photo scrolling 2016/1500 px in 0.4 s (16 samples 6 px apart). Fixed: the lockup lifts
  300 px and fades out, then her photo rises 480 px and fades up. The same flaw at the phone's exit
  (11.06 s, 173 px/frame, bars for 6 frames): it drops 420 px and fades. Round 9: all 8.
- G5 full pass (1080×1920, 60 fps): designed sound `sound.ts` (motion/sound) on the beat map, cues as
  above plus a settle for the mark (11.21 s) and the loop's glide moved to 14.48 s (her photo's rise).
  Blindfolded the hits were buried in the music (sound 6, rounds 10–11): the music now sinks 6 dB under
  the riser into 41 and is back on the downbeat. −14.2 LUFS, true peak −2.3 dBTP. Round 12: all 8.
