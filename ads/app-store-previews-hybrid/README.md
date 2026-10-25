# app-store-previews-hybrid: the App Store previews in the header's world

**What:** three App Previews for the iPhone screenshot row (6.9"/6.5", 886 × 1920, 30 fps, silent,
15–30 s), made 2026-10-24 after the founder saw the combined header film: "not screen recordings, I want
them to be the header way". The header's world (ads/app-store-header-all and its parts A, B3 tonal, C2
subtle): Emma's real photos with depth, garments lifting and gliding with soft shadows, the camera glide
and springs, the lockup; all in S-V3's subtle blue only (the founder, 2026-10-24: "Use the subtle blue only"):
the blue linen ground, ink over slate navy, cool slate shadows, nothing warm and no colour change on a reveal.
The warm tonal sets of the first cut are kept in `versions/v3-warm`. In the phone, at the centre of almost every frame, the
**real build-284 recording** (new look, clean status bar).

| Film | Opener (header world) | In the phone (real 284) | Length |
|---|---|---|---|
| 1 closet | her DUMBO photo (cut-out over the street, a slow push), the camel coat lifts out and glides down beside the phone | Extract all: the sort, the found photos, "Added 14 wardrobe items", her rails (the Tan Wool Coat among them) | 16.9 s |
| 2 see-it-on-you | her walk-to-work photo (cut-out), the black tee hovering, then gliding beside the phone | Studio: Weekend in black, Try it on, the shimmer, she's in it, her try-on full screen | 16.5 s |
| 3 what-to-wear | a rail of day cards (Thu, Fri, Today: the art fair look) | Today with that same look, then Chat: her question, Zee's ring, "Here's your art fair look." | 16.5 s |

**Apple's rules, every frame:**
- App Review 2.3.4: the recording plays in the phone from frame 0 until the pan out; the header world is
  the overlay around it, never a stretch without the app.
- Apple's bezel licence (decisions/0012): the iPhone 17 Pro Max bezel straight on, whole, moved only by
  pan, zoom and fade; nothing over it, no shadow added to it, nothing that appears to enter or leave its
  screen. So the garment comes to rest **beside** the phone and the camera pushes in past it; it never
  crosses the screen. The trademark line is in ad.json › disclosures.

**The camera:** one push per film (`GLIDE_DUR`, the camera spring normalised): the whole set scales about
one point, the point that takes the opener phone (410 wide) exactly to hero size (712 wide, as the
screen-recording cuts). Nearer layers scale more (the garment 1.6, the print 1.35, the rail 1.3), the stage
less (0.25): real parallax. The end is the header's glide: a pan right through a soft column of light to
the lockup (the mark, "Curate", "Try it. Style it. *Wear it.*").

**The recordings** (library, drafts, build 284, my own simulator "Previews 17PM", status bar overridden to
9:41 and a plain full battery, tips off, every server call faked, nothing paid):
`footage.curate.b284-scan-sort-land.v2`, `footage.emma.b284-studio-tryon-b284.v3`,
`footage.emma.b284-today-look-scroll.v2`, `footage.emma.b284-chat-art-fair.v2`. The v1 takes have the
green charging battery and are marked so; never use them. The Studio take runs the new-look probe with
`PROBE_PREVIEW_LOOK=true` (the board is tee, trousers, tote and loafers, the very pieces of her real
Studio try-on `tryon.emma.r30-tee-black`), so the reveal matches the board.

**Files:** `timeline.ts` (the cuts and moments, pure data), `index.tsx` (`AppStorePreviewsHybrid`),
`brief.md`, `shotlist.md`. The screen-recording cuts stay in `ads/app-store-previews` as versions.

**Render (on the Mac; the founder's rule from 2026-10-24: no Lambda):**
```bash
tools/stills app-store-previews-hybrid --format appstore-iphone --length 30 --times 0,1.5,3,5 --props '{"film":1}'
tools/render app-store-previews-hybrid --format appstore-iphone --length 30 --props '{"film":1}' --name h1 --concurrency 3
research/app-store-previews/storefile.sh <render.mp4> research/app-store-previews/store/curate-preview-hybrid-1.mp4
```
`--length 30` is the schema's bucket; each film's real length comes from `metadata` (timeline.ts › total).

**Status:** draft. On the founder's review page (pick key `previews`, "Keep hybrid N"). Not uploaded.
