"""Drive Jake's simulator by UDID only (never `booted`): ui | shot <name> | tap <x> <y> | label <text> | type <text>.
UDID from .cache/persona-gen/jake/sim-udid.txt. Coordinates are points (the 17 Pro Max is 440x956 pt)."""
import json, os, subprocess, sys
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D = os.path.join(ROOT, ".cache", "persona-gen", "jake")
U = open(os.path.join(D, "sim-udid.txt")).read().strip()
assert U != "B0202502-C8FB-4DAA-8E29-EAE4866B0C14", "never Emma's simulator"
cmd = sys.argv[1]
if cmd == "ui":
    d = json.loads(subprocess.run(["axe", "describe-ui", "--udid", U], capture_output=True, text=True).stdout or "[]")
    def walk(n):
        lab = n.get("AXLabel"); val = n.get("AXValue"); t = n.get("type"); f = n.get("frame") or {}
        if lab or val or t in ("Button", "TextField", "SecureTextField"):
            print(f"{t:10} {str(lab)[:70]!r:72} v={str(val)[:30]!r} @({f.get('x',0):.0f},{f.get('y',0):.0f},{f.get('width',0):.0f}x{f.get('height',0):.0f})")
        for c in n.get("children", []) or []: walk(c)
    for n in d: walk(n)
elif cmd == "shot":
    os.makedirs(os.path.join(D, "sim"), exist_ok=True)
    p = os.path.join(D, "sim", sys.argv[2] + ".png")
    subprocess.run(["xcrun", "simctl", "io", U, "screenshot", p], capture_output=True)
    im = Image.open(p); im.thumbnail((440, 956)); im.save(p.replace(".png", "-s.png")); print(p.replace(".png", "-s.png"))
elif cmd == "tap":
    subprocess.run(["axe", "tap", "-x", sys.argv[2], "-y", sys.argv[3], "--udid", U])
elif cmd == "label":
    subprocess.run(["axe", "tap", "--label", sys.argv[2], "--udid", U] + sys.argv[3:])
elif cmd == "type":
    subprocess.run(["axe", "type", sys.argv[2], "--udid", U])
