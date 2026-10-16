# 0012: Phones are Apple's real bezels (ACCEPTED 2026-10-16)

2026-10-16 · founder: "give me the real phone look. The phones that you are showing in the UI are so
ugly." Status: **accepted for option B**. On the demo page
(https://claude.ai/artifact/AGC9UrR9ucfR7EAp8nJn5z) the founder said "i think B is good" (2026-10-16):
Apple's Product Bezels, as is, for every new phone shot; Silver by default. The 3D generic phone
(option C) was not picked and stays available only if the founder asks for it.

**Context.** Every ad drew its phone with `motion/PhoneFrame.tsx`: a black rounded rectangle with a
drawn island, tilted and turned in 3D. Real-looking iPhones come in three forms: Apple's official
Product Bezels (PNG), 3D iPhone models (Sketchfab etc.), or a drawn/vector copy. Apple's App Store
Marketing Guidelines (developer.apple.com/app-store/marketing/guidelines/, read 2026-10-16) decide
most of it:
- Use Apple-provided bezels, the latest generation, **as is**: no reflections, shadows or highlights
  added; no cropping, tilting or covering; no animating, flipping or spinning; nothing that appears to
  enter or come out of the screen; copy beside the device, not on it; at least 200 px tall on screen.
- In video, after an establishing shot of the whole device, pan and zoom to the app; fades/dissolves.
- Not permitted: "rendering in 3D or creating any simulation of an Apple product", illustrations of
  Apple products, and generic devices carrying Apple-only details (Home button, sensor housing,
  Ring/Silent switch, volume controls).
- Credit line wherever legal copy goes: "iPhone is a trademark of Apple Inc., registered in the U.S.
  and other countries."
- Licence: the App Store Marketing Artwork License (EA0861) grants the bezels only to market apps on
  the App Store while we are in the Developer Program; the DMG's Apple Design Resources licence
  (LYL142) forbids redistributing them.

**Decision (accepted: B; C kept, unused).**
- New asset kind **`device`** (`schemas/asset.ts › DeviceAsset`, `library/devices/`): the measured
  screen box, corner radius, island, the moves the licence allows, plain-language rules and the
  credit line. Apple's bezels may only declare pan/zoom/fade; an Apple 3D device is a schema error.
- **`<Device>`** (`motion/Device.tsx`) is the phone for new ads. Variant `bezel` (default): Apple's PNG
  over the screen content, which is masked to the display; props are only pan (x, y), zoom (scale,
  width) and fade (opacity). Variant `3d` (`motion/Device3D.tsx`): **our own generic phone**
  (`device.curate.phone-generic.v1`, built by `tools/device/phone_generic.py`, no Apple-only details)
  in three.js inside Remotion, lit by a CC0 HDRI, with rotation, camera, shadow and reflections.
- Default model: **iPhone 17 Pro Max** (our captures come from its simulator, so the island and corners
  match to the pixel). Moving to the iPhone 18 Pro Max (the latest) needs the hero footage re-recorded
  on the 18 Pro Max simulator: its island is 282 px wide against our footage's 374.
- `PhoneFrame` stays, unchanged, for the ads already cut to it.
- 3D renders: Remotion three.js for anything with footage (frame-exact video texture, ~0.05 s/frame);
  Blender Cycles (`phone_generic.py --hero`) only for single hero stills (~7 s/frame at 1080×1920).

**Why.** The bezel is the most real look there is, free, and the only one Apple sanctions. The 3D
moves the founder liked (tilts, Pop out) are exactly what Apple forbids on its devices, so they move
to a phone we own outright. 3D iPhone models (CC BY on Sketchfab) license only the modeller's mesh,
not Apple's design, and Apple forbids 3D iPhones in marketing anyway.

**Consequences.** Ads that pop pieces out of the phone or tilt it can't use the Apple bezel for those
shots. Ads that use a bezel carry the credit line in their legal copy (ad.json › disclosures). The
review page template (`tools/review-page/ads-phone.html`) shows ads in the iPhone 18 Pro Max bezel.
