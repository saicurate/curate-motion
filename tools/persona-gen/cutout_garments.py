# /// script
# requires-python = ">=3.11,<3.13"
# dependencies = ["numpy>=2.0", "pillow>=11.0", "scipy>=1.13", "onnxruntime>=1.19"]
# ///
"""Free, local cut-outs + thumbs of persona garment product shots (u2net from ~/.u2net, the legacy cutout.py method).

  uv run --script tools/persona-gen/cutout_garments.py <in.jpg> [<in.jpg> …] --out <dir>
Writes <dir>/cutouts/<stem>.png (RGBA, cropped) and <dir>/thumbs/<stem>.jpg (400 px).
"""
import importlib.util, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("legacy_cutout", os.path.join(HERE, "..", "legacy", "cutout.py"))
L = importlib.util.module_from_spec(spec); spec.loader.exec_module(L)

args = sys.argv[1:]
out = args[args.index("--out") + 1]; files = [a for a in args if a not in ("--out", out)]
os.makedirs(os.path.join(out, "cutouts"), exist_ok=True); os.makedirs(os.path.join(out, "thumbs"), exist_ok=True)
for f in files:
    stem = os.path.splitext(os.path.basename(f))[0]
    size = L.cut(f, os.path.join(out, "cutouts", stem + ".png"))
    im = Image.open(f).convert("RGB"); im.thumbnail((400, 400 * 4 // 3)); im.save(os.path.join(out, "thumbs", stem + ".jpg"), "JPEG", quality=82)
    print(stem, size, flush=True)
