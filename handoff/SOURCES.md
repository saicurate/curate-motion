# handoff/: where the files outside the library came from

`tools/export-kit` copies these into `../app-media/` beside the library's assets. Only text files live here (git never holds
media): the PNGs made for the kit are library assets, `brand.curate.mark-2048.v1` (this SVG drawn by headless Chrome at
2048 px), `brand.curate.lockup.v1` (the mark and "Curate" in Geist Medium as `motion/Designed.tsx` › `MarkWord` sets
them: gap 0.34 m, type 0.95 m, tracking −0.04 em) and `brand.curate.app-icon.v1` (curate-app's 1024 px icon, build 285). `README.md` here is the master
of `../app-media/README.md`, the brief for whoever receives the folder.

| File | From | Licence | Status |
|---|---|---|---|
| `brand/curate-mark.svg` | curate-admin `public/logo.svg` (the mark, ink `#181818`, matched by eye against `brand.curate.splash-mark.v1`) | Curate original | draft |
| `apple/download-on-the-app-store-black.svg` | https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg (US-UK, black, the preferred badge), 2026-10-24 | Apple App Store badge: use under the App Store Marketing Guidelines, https://developer.apple.com/app-store/marketing/guidelines/ (as provided; one per layout or video; never animated, angled or modified; clear space ¼ of its height; at least 40 px tall) | Apple's artwork |

Not here on purpose: Apple's Product Bezels. Their licence says never redistribute the file, so anyone
outside this repo downloads their own from Apple Design Resources.
