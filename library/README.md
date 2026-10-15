# library/

Every asset, made once and reused. **Media files are gitignored** and live in the private S3 bucket
(`tools/sync pull` / `push`); only each folder's `manifest.json` (plus `persona.md`, `account.json`,
`account-state.json`) is in git.

| Folder | Holds | Id pattern |
|---|---|---|
| `brand/` | Curate logo marks (`curate/`), Geist fonts (`fonts/`) | `brand.curate.logo-splash.v1`, `font.geist.medium.v1` |
| `zee/<emotion>/` | Zee frame sequences `<part>.vN/0001.webp…` + source `<part>.vN.webp` | `zee.excited.loop.v1` |
| `people/<persona>/` | face refs, `selfie/`, `tryon/`, `persona.md`, `account.json`, `account-state.json` | `face.emma.b.v1`, `selfie.emma.black-tee.v1` |
| `wardrobe/<persona>/` | product shots, `cutouts/`, `thumbs/` | `garment.emma.jeans-straight-light-wash.v1` |
| `camera-roll/<persona>/` | her phone photos | `photo.emma.r01-coffee-shop.v1` |
| `stock/<source>/` | Unsplash / Pexels with licence | `stock.unsplash.coffee-in-hand.v1` |
| `footage/<moment>/` | app recordings `<persona>-b<build>.vN.mp4` | `footage.emma.two-taps-closet-b262.v1` |
| `music/<source>/` | tracks with bpm + beat map | `music.mixkit.cat-walk-arulo.v1` |
| `voice/<ad>/` | voiceover audio: TTS clips (one per script line) and human takes, made by `tools/voice` | `voice.explainer.l01-say-preview.v1` |
| `references/<name>/` | reels we study, never shipped: the inspo board's media (`inspo/`, `tools/inspo`) | `reference.creator.pop-off-reel.v1` |

- **Goes here:** anything an ad might show or play, with a licence.
- **Doesn't:** renders (→ `renders/`), code, secrets, scratch files, anything without a licence.
- **Example:** `tools/catalog add ~/Downloads/latte.jpg --kind stock --scope unsplash --licence unsplash --set "shows=latte art"`
  copies it to `library/stock/unsplash/latte.v1.jpg`, adds it to `library/stock/manifest.json`, uploads it.

Never edit a file in place: a changed file is a new version (`tools/catalog replace`).
