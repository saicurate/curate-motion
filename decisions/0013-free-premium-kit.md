# 0013: Premium for $0: 2.5D photos, cut-outs and a finishing pass from free local models (PROPOSED)

2026-10-16 · founder, after the rough concept demos: they look "so f***ing cheap", and no to a $20
AI-video budget: "we have to do magic with less budget." Status: **proposed** with the two hooks
(`ads/hook-zee-critic`, `ads/hook-camera-roll`); the founder decides from those.

**Context.** The demos were flat: photos as cards, garments as stickers, type over everything, stock
music. The look that reads as expensive in short-form ads (a still that becomes a place, type that sits
*behind* the person, a garment lifting off a body, real lens behaviour) is usually bought as AI video
(Kling, Veo: about $0.40–0.50 per 5 s shot, more with retries). Most of it is geometry, which free models
running on the Mac can recover from one photo.

**Decision (proposed).**
- **Layers, made once per photo, kept as derived assets.** `tools/photo3d <photo-id>` (Python via uv,
  pinned by `tools/photo3d.py.lock`, PyTorch on Apple's GPU) makes: depth (**Depth Anything V2 Small**,
  Apache-2.0; flip-averaged), her matte (**BiRefNet-portrait**, MIT) with edge colours un-mixed
  (**pymatting**, MIT), the plate behind her (**LaMa / big-lama**, Apache-2.0, at 512 px), each layer's
  depth (her depth pushed past her edge; the background's carried on behind her), and pieces she wears
  by points (**SAM 2.1 hiera-small**, Apache-2.0). Where LaMa can't (a body under a garment, a skyline
  behind a person), `tools/genfill` uses **SDXL 1.0 Inpainting** (CreativeML OpenRAIL++-M, commercial use
  allowed) locally, its prompt from `prompts/`. `tools/photo3d register` puts them in the catalog as
  `photo.<persona>.<photo>-{depth,cutout,plate,<part>,under-<part>}.vN`: `source.type: derived`,
  `source.from` = the photo, licence `ai-owned`, draft. Depth files are "rg16" PNGs (16 bits in R+G),
  because browsers decode 16-bit PNGs to 8. Derived layers never go into her simulator's Photos.
- **Rejected models (licence):** Depth Anything V2 Base/Large (CC BY-NC 4.0), Apple Depth Pro
  (apple-amlr, research only), FLUX.1 Fill dev (non-commercial).
- **`motion/DepthPhoto`**: each layer is a mesh displaced by its depth, seen by a real perspective camera
  (three.js in `<ThreeCanvas>`, frame-pure; `--gl=angle`). The rest pose shows the photo exactly; only a
  camera move (truck, pedestal, dolly, lens; a reverse dolly-zoom) reveals 3D. One canvas per layer
  group, so HTML sits at a true depth between them (`rigCss(...).plane(Z)`): titles behind her, Zee
  behind her knee. A layer can move as an object (`move`: a garment peeling off). The grade is in the
  shader (`EDITORIAL`: S-curve, warmth, highlight shoulder, a little fade) so every layer matches.
- **`motion/Finish`**: seeded `Grain` (a new field every 2 frames), `Vignette`, `ContactShadow`,
  `LightWrap` (the scene's light on the cut-out's edge, from the light's side). **`motion/KeyLine`**: the
  brand's line (Geist Medium, the key phrase in #181818 over #656565), words rising on the `headline`
  spring.
- Motion blur stays `SubframeBlur`; the rack focus is CSS blur on a layer's canvas.

**What is still not free.** True motion of her body (a turn, a walk, cloth moving) needs image-to-video
(e.g. Kling image-to-video, about $0.42 per 5 s at the time of writing). Nothing in the two hooks
needs it; it was not run.

**Consequences.** One ~3 min local run per photo (first run downloads ~2 GB of models, SDXL ~7 GB);
renders with WebGL are heavier (concurrency 1). Every 2.5D shot is AI-altered imagery: the ad lists the
AI label in `disclosures`.
