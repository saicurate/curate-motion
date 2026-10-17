"""Put Jake's picked garments into the library: one prompt each (tools/prompts add) + one garment asset each
(tools/catalog add, with its cut-out and thumb), linked both ways. Draft status; the founder approves.

  python3 tools/persona-gen/register_garments.py [--dry-run] [slug …]
"""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C
import jake_garments as G

BY = "claude-code (skit-chopped agent)"
DRY = "--dry-run" in sys.argv
WANT = [a for a in sys.argv[1:] if not a.startswith("--")]


def sh(args, stdin=None):
    if DRY:
        print("DRY", " ".join(args)[:240]); return ""
    r = subprocess.run(args, input=stdin, capture_output=True, text=True, cwd=C.ROOT)
    if r.returncode != 0:
        raise SystemExit(f"FAILED {' '.join(args)[:200]}\n{r.stdout[-800:]}\n{r.stderr[-800:]}")
    return r.stdout


def cost_of(slug, v):
    return round(sum(r.get("usd", 0) for r in C.rows() if r.get("tag") == f"garment:{slug}:v{v}"), 6)


def main():
    done = []
    for it in G.ITEMS:
        slug, name, cat, colour, phase, desc, pres = it
        if WANT and slug not in WANT:
            continue
        v, lib = G.PICK.get(slug, (1, slug))
        src = G.path(slug, v)
        stem = f"{slug}.v{v}"
        cut = os.path.join(G.GDIR, "cutouts", stem + ".png")
        th = os.path.join(G.GDIR, "thumbs", stem + ".jpg")
        assert os.path.exists(src) and os.path.exists(cut) and os.path.exists(th), slug
        pid = f"prompt.image-gen.garment-jake-{lib}.v1"
        tier = "Batch API (half price)" if v == 1 else "standard tier"
        sh(["tools/prompts", "add", "-", "--name", f"garment-jake-{lib}", "--title", f"Jake: {name.lower()}, product shot",
            "--area", "image-gen", "--target", "Nano Banana 2.1 (gemini-nano-banana-2.1), 1K, 3:4",
            "--author", "agent:skit-chopped", "--outcome", "worked", "--rating", "4",
            "--why", f"First usable take: logo-free, the whole piece in frame, the same seamless warm-grey as Emma's wardrobe. {tier}.",
            "--parents", "prompt.image-gen.garment-product-shot.v1", "--tags", f"persona:jake,garment,product-shot,logo-free,category:{cat},{phase}",
            "--cost-usd", str(cost_of(slug, v)), "--source", f"tools/persona-gen/jake_garments.py ITEMS['{slug}'] (cache {stem})"],
           stdin=G.prompt(it))
        out = sh(["tools/catalog", "add", src, "--kind", "garment", "--scope", "jake", "--name", lib, "--licence", "ai-owned",
                  "--title", name, "--tags", f"persona=jake,colour={colour},{phase}", "--set", f"category={cat}", "--set", f"name={name}",
                  "--extra", f"cutout:{cut}", "--extra", f"thumb:{th}", "--source-model", G.MODEL,
                  "--source-tool", "tools/persona-gen/jake_garments.py", "--source-prompt-id", pid,
                  "--cost-usd", str(cost_of(slug, v)), "--cost-calls", "1", "--by", BY, "--no-push"])
        done.append(lib)
        print("added", lib, flush=True)
    print(len(done), "garments")


if __name__ == "__main__":
    main()
