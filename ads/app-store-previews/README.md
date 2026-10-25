# app-store-previews

Three App Store App Previews (the videos in the screenshot row), made 2026-10-24 for the founder:
"iOS allows videos under the photos section as well… let's generate videos for the previews as well."

- **Format:** `appstore-iphone`, 886 × 1920, rendered at 30 fps (Root's `fpsFor`), 15–30 s each
  (the length comes from the cuts: `metadata` in index.tsx). Props: `preview` 1–3, `palette` blue | cream
  (S-V3's two palettes; blue is the founder's latest pick for S-V3).
- **Footage:** real build-284 code (release/1.5.1-284 @8ef12d4a) on the iPhone 17 Pro Max simulator
  "Previews 17PM", through dev probes with every server call faked and nothing paid:
  `new_look_probe` (Today, Wardrobe + Extract all, Studio), `new_look_chat_probe` (Chat), `tryons_probe`
  (the Try-ons tab). Recorded with `research/app-store-previews/take.sh` / `pace.py`
  (`xcrun simctl io recordVideo` while the probe is driven by control lines), catalogued as
  `footage.curate.b284-*` / `footage.emma.b284-*` (drafts, env local).
- **App Store file:** `tools/render app-store-previews --format appstore-iphone --length 30 --props '{"preview":N,"palette":"blue"}' --name pN`,
  then `research/app-store-previews/storefile.sh` re-encodes it the way App Store Connect takes it:
  H.264 High 4.0, 30 fps constant, ~11 Mbps, yuv420p, plus a silent stereo AAC 256 kbps track.
- **Rules kept:** screen captures of the app only (App Review 2.3.4), words beside the phone and never on it,
  Apple's bezel straight on with fades only (decisions/0012), the iPhone trademark line in `disclosures`.
- Known limits: the try-on result is the Try-ons study's own (the probe can't call the real try-on), so
  preview 2's person is the study's, not Emma; the scan's photos are the founder's faceless gallery set.
