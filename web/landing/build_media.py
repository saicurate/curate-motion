# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow==11.3.0"]
# ///
"""Landing page media: library assets -> web images.

  tools/sync pull --only "garment.emma.*" --only "photo.emma.*"   # once, so the files are local
  uv run web/landing/build_media.py                                # writes web/landing/media/

Reads web/landing/media.json (which asset fills which picture), takes each file from library/ by the
catalog, trims the transparent edge off cut-outs, scales, and writes WebP plus media/media.js, which
the prototype loads (window.CURATE_MEDIA). The output is not tracked in git (media lives in S3).
Prints every asset that is still a draft: drafts are fine for review, not for a page that goes live.
"""
import json
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
LIB = ROOT / "library"
OUT = HERE / "media"

catalog = {a["id"]: a for a in json.loads((ROOT / "catalog" / "index.json").read_text())["assets"]}
spec = json.loads((HERE / "media.json").read_text())
drafts: set[str] = set()


def file_of(asset_id: str, role: str) -> Path:
    a = catalog.get(asset_id)
    if not a:
        sys.exit(f"not in the catalog: {asset_id}")
    if a.get("status") == "retired":
        sys.exit(f"retired, never used: {asset_id}")
    if a.get("status") != "approved":
        drafts.add(asset_id)
    f = next((f for f in a["files"] if f.get("role") == role), None) or a["files"][0]
    p = LIB / f["path"]
    if not p.exists():
        sys.exit(f"missing locally: {p} (run tools/sync pull --only \"{asset_id}\")")
    return p


def write(im: Image.Image, name: str, max_side: int, quality: int) -> str:
    if im.mode == "RGBA":
        box = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
        if box:
            im = im.crop(box)
    else:
        im = im.convert("RGB")
    s = max_side / max(im.size)
    if s < 1:
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    dst = OUT / f"{name}.webp"
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, "WEBP", quality=quality, method=6)
    return f"media/{name}.webp"


def photo(asset_id: str, name: str, max_side: int = 1400, role: str = "original", trim: bool = True) -> dict:
    im = Image.open(file_of(asset_id, role))
    if im.mode == "RGBA" and not trim:
        im = im.convert("RGBA")
    if not trim and im.mode == "RGBA":
        # keep the frame (a cut-out that must line up with its pair): no crop
        s = max_side / max(im.size)
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS) if s < 1 else im
        dst = OUT / f"{name}.webp"
        dst.parent.mkdir(parents=True, exist_ok=True)
        im.save(dst, "WEBP", quality=82, method=6)
        return {"src": f"media/{name}.webp", "w": im.width, "h": im.height}
    src = write(im, name, max_side, 80)
    w, h = Image.open(OUT / f"{name}.webp").size
    return {"src": src, "w": w, "h": h}


media: dict = {"items": {}, "photos": {}, "cameraRoll": [], "looks": []}
for key, gid in spec["items"].items():
    media["items"][key] = write(Image.open(file_of(gid, "cutout")).convert("RGBA"), f"items/{key}", 640, 82)
for key, p in spec["photos"].items():
    is_cutout = p["id"].endswith("-cutout.v1")
    media["photos"][key] = photo(p["id"], f"photos/{key}", p.get("max", 1400), p.get("role", "original"), trim=not is_cutout)
for slug in spec["lists"]["cameraRoll"]:
    media["cameraRoll"].append(photo(f"photo.emma.{slug}.v1", f"roll/{slug}", 700)["src"])
for slug, name in spec["lists"]["looks"]:
    media["looks"].append([photo(f"photo.emma.{slug}.v1", f"looks/{slug}", 1200)["src"], name])

media["zee"] = {}
for mood, zid in spec.get("zee", {}).items():
    media["zee"][mood] = write(Image.open(file_of(zid, "original")).convert("RGBA"), f"zee/{mood}", 240, 85)
(OUT / "media.js").write_text("window.CURATE_MEDIA = " + json.dumps(media, indent=1) + ";\n")
total = sum(f.stat().st_size for f in OUT.rglob("*.webp"))
print(f"{sum(1 for _ in OUT.rglob('*.webp'))} images, {total / 1e6:.1f} MB -> {OUT.relative_to(ROOT)}")
if drafts:
    print("drafts (fine for review; need the founder's OK before the page goes live):")
    for d in sorted(drafts):
        print("  ", d)
