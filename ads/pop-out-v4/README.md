# pop-out-v4: Pop out, the header way

**What:** Pop out (the FILM: "Your whole closet is already in your camera roll; Curate pulls it out.") re-cut in
the world of the approved App Store header film, with the new-look (build 284) scan. 9:16, 15 s, 60 fps, Cat
Walk from its drop. v3 (build 262 footage) stays as it was.

**How it's built:** `timeline.ts` (the moments on the beat map, the scan's cuts), `index.tsx` (`PopOutV4`):
the header's tonal ground, prints and lifting garments (laid out for 9:16), her camera roll (a 5 × 6 grid the
camera pulls back to), Apple's bezel with the real recording (`Footage`, three cuts), one camera (pull, push
about one point so the phone lands at hero size, the pan through the light column, the glide back), the
header's lockup with "On the App Store". Every value is a function of t; `SubframeBlur` from the analytic speed.

**Reusable:** the 9:16 hook layout (`HERO`: three photos, where each piece sits in its photo, its cell in the
roll, its rest beside the phone) and the `Pan` between two sets.

**Status:** draft. G1 in review (four drafts to approve), G2 package on the founder's page.

```bash
tools/stills pop-out-v4 --shots
tools/render pop-out-v4 --format 9x16 --length 15 --draft
```
