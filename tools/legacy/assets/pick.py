"""python3 pick.py garment|roll slug=v ...   (or slug alone = v1)"""
import json, sys, garments as G, roll as R, common as C
kind = sys.argv[1]
path = G.PICKS if kind == "garment" else R.PICKS
pk = json.load(open(path)) if __import__("os").path.exists(path) else {}
for a in sys.argv[2:]:
    s, _, v = a.partition("=")
    pk[s] = int(v or 1)
json.dump(pk, open(path, "w"), indent=1)
print(len(pk))
