"""Jake, step 2: his wardrobe, 30 product photos (Nano Banana 2.1, 1K), from prompt.image-gen.garment-product-shot.v1.

  python3 tools/persona-gen/jake_garments.py submit            # one Batch API job (half price: ~$0.017 each)
  python3 tools/persona-gen/jake_garments.py poll <op>         # save results when the job is done
  python3 tools/persona-gen/jake_garments.py one <slug> ["extra"]   # one piece, standard tier (~$0.034), next version
  python3 tools/persona-gen/jake_garments.py list
Raw files land in .cache/persona-gen/jake/garments/<slug>.v<N>.jpg; tools/catalog add puts the picks in the library.
"""
import glob, json, os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C

MODEL = "gemini-nano-banana-2.1"
SIZE = "1K"
GDIR = os.path.join(C.WORK, "jake", "garments")
# cache slug -> (version picked, library name)
PICK = {"sneakers-chunky-dad-grey": (2, "sneakers-court-scuffed-grey")}
SNEAKER_V1_DESC = ("a pair of chunky, bulky grey-and-white men's dad running sneakers with a thick white sole and too many overlays, "
                   "a little scuffed, plain with no logo, no letters, no stripes and no branding")

APPAREL = ("Shown as an invisible ghost-mannequin front view, as if worn by an invisible body, with a natural drape "
           "and realistic shape; the inside back of the neckline may be visible.")
BOTTOM = "Shown as an invisible ghost-mannequin front view of the full length, from waistband to hem, natural shape."
FLAT = "Laid neatly flat and photographed straight from above."
SHOES = "A pair of shoes side by side, photographed at a gentle three-quarter front angle, both shoes fully visible."
SMALL = "Arranged neatly in the center, photographed from slightly above."

# slug, name, category, colour, before|after, description, presentation
ITEMS = [
    # BEFORE: what he owns and wears now (nothing fits, nothing goes together)
    ("tee-graphic-flame-faded", "Faded flame graphic tee", "top", "black", "before",
     "an oversized faded black cotton t-shirt with a big cracked, peeling cartoon flame graphic across the chest (flames only: no words, no letters, no numbers), a stretched-out collar, men's XXL boxy fit, short sleeves", APPAREL),
    ("tee-graphic-wolf-moon", "Wolf-and-moon graphic tee", "top", "navy", "before",
     "an oversized navy cotton t-shirt with a huge airbrushed print of a grey wolf howling at a full moon (picture only: no words, no letters), men's XXL boxy fit, short sleeves", APPAREL),
    ("tee-tie-dye-rainbow", "Rainbow tie-dye tee", "top", "multicolour", "before",
     "a loud rainbow spiral tie-dye cotton t-shirt, men's oversized fit, short sleeves, no print", APPAREL),
    ("tee-mustard-stretched", "Stretched mustard tee", "top", "mustard", "before",
     "a stretched-out, slightly faded mustard-yellow cotton crew-neck t-shirt, men's, two sizes too big, with a wavy stretched hem and a baggy collar", APPAREL),
    ("shirt-camp-flamingo-print", "Flamingo print camp shirt", "top", "teal and pink", "before",
     "a men's short-sleeve button-up camp shirt in shiny polyester with a loud print of neon-pink flamingos and cartoon palm trees on teal, two sizes too big, boxy, buttoned", APPAREL),
    ("polo-striped-boxy", "Boxy striped polo", "top", "brown and orange", "before",
     "a men's boxy short-sleeve polo shirt with wide horizontal stripes in brown, burnt orange and cream, too big and faded, no logo, no embroidery", APPAREL),
    ("hoodie-grey-oversized-pilled", "Giant pilled grey hoodie", "top", "heather grey", "before",
     "a huge, pilled heather-grey pullover hoodie, men's 3XL, sleeves too long, a stretched kangaroo pocket and frayed drawstrings, no print", APPAREL),
    ("windbreaker-colourblock-90s", "90s colour-block windbreaker", "outerwear", "teal, purple and yellow", "before",
     "a men's 90s-style shiny nylon half-zip pullover windbreaker in clashing teal, purple and neon-yellow colour blocks, baggy, no logo, no letters", APPAREL),
    ("shorts-cargo-khaki-baggy", "Baggy khaki cargo shorts", "bottom", "khaki", "before",
     "men's baggy knee-length khaki cargo shorts with big bulging side pockets, wrinkled, a little faded", BOTTOM),
    ("shorts-basketball-mesh-red", "Red mesh basketball shorts", "bottom", "red", "before",
     "men's long shiny red mesh basketball shorts with white side piping, past the knee, elastic waist, no logo, no numbers, no letters", BOTTOM),
    ("shorts-jorts-baggy-dark", "Long baggy jorts", "bottom", "dark blue", "before",
     "men's very long, very baggy dark-wash denim shorts that reach below the knee, plain unbranded metal button, no leather patch", BOTTOM),
    ("jeans-baggy-ripped-light", "Ripped baggy light jeans", "bottom", "light blue", "before",
     "men's baggy light-wash jeans with big rips at the knees and bleach spots, the hems too long and frayed, plain unbranded metal button, no leather patch", BOTTOM),
    ("trousers-khaki-pleated-long", "Too-long pleated khakis", "bottom", "khaki", "before",
     "men's baggy pleated khaki trousers, much too long, so the hems bunch and pool at the bottom, wrinkled", BOTTOM),
    ("slides-black-rubber", "Black rubber slides", "footwear", "black", "before",
     "a pair of plain black rubber slide sandals with one wide strap, completely plain with no logo, no text and no branding", SHOES),
    ("socks-crew-white", "White crew socks", "accessory", "white", "before",
     "a pair of thick white cotton crew socks, mid-calf length, completely plain with no logo and no stripes", FLAT),
    # v1 ("chunky, bulky grey-and-white dad running sneakers … too many overlays") came out as a famous designer
    # trainer's silhouette: dropped (prompt logged as didn't). v2 is this text: a plain scuffed court sneaker.
    ("sneakers-chunky-dad-grey", "Scuffed grey court sneakers", "footwear", "white and grey", "before",
     "a pair of bulky, uncool men's white leather dad walking sneakers with grey suede panels, a thick flat white sole, a padded collar and a wide toe, the kind a dad wears to mow the lawn; a little scuffed; plain, with no logo, no letters, no stripes, no swoosh and no branding", SHOES),
    ("cap-camo-flat-brim", "Camo flat-brim cap", "accessory", "camo", "before",
     "a camo-print flat-brim snapback cap, completely blank with no logo, no patch, no sticker and no text", SMALL),
    ("sunglasses-wraparound-mirrored", "Mirrored wraparound sunglasses", "accessory", "blue", "before",
     "a pair of wraparound sport sunglasses with mirrored blue lenses and a black frame, unfolded, front view, no logo", SMALL),
    # AFTER: the good pieces Curate styles him in (clean, fitted, simple)
    ("jeans-slim-dark-indigo", "Slim dark indigo jeans", "bottom", "dark indigo", "after",
     "men's slim straight-leg jeans in a clean dark indigo rinse, full length to the ankle, five-pocket style, plain unbranded metal buttons, no leather patch", BOTTOM),
    ("shirt-oxford-white", "White oxford shirt", "top", "white", "after",
     "a crisp white cotton oxford button-down shirt, men's slim fit, long sleeves, button-down collar, buttoned", APPAREL),
    ("jacket-bomber-black", "Black bomber jacket", "outerwear", "black", "after",
     "a clean black men's bomber jacket in matte nylon with a ribbed collar, cuffs and hem, zipped, slim fit, no logo, no patches", APPAREL),
    ("sneakers-leather-white", "White leather sneakers", "footwear", "white", "after",
     "minimal low-top white leather men's sneakers with white laces and a clean white rubber sole, completely plain with no logo, no stripes and no branding", SHOES),
    ("sweater-crewneck-navy", "Navy crewneck sweater", "top", "navy", "after",
     "a men's navy fine-knit merino crewneck sweater, slim fit", APPAREL),
    ("tee-white-heavyweight", "Heavyweight white tee", "top", "white", "after",
     "a men's heavyweight plain white cotton crew-neck t-shirt, fitted, short sleeves, no print", APPAREL),
    ("tee-black-fitted", "Fitted black tee", "top", "black", "after",
     "a men's plain black cotton crew-neck t-shirt, fitted, short sleeves, no print", APPAREL),
    ("overshirt-olive", "Olive overshirt", "outerwear", "olive", "after",
     "a men's olive-green cotton twill overshirt with two chest flap pockets and snap buttons, buttoned, regular fit", APPAREL),
    ("chinos-slim-stone", "Stone slim chinos", "bottom", "stone", "after",
     "men's slim-fit stone-beige cotton chinos, full length, a clean flat front", BOTTOM),
    ("jacket-denim-dark", "Dark denim jacket", "outerwear", "dark indigo", "after",
     "a men's classic trucker-style denim jacket in a dark indigo rinse, two chest flap pockets, plain unbranded metal buttons, buttoned", APPAREL),
    ("boots-chelsea-brown-suede", "Brown suede Chelsea boots", "footwear", "brown", "after",
     "a pair of men's brown suede Chelsea boots with elastic side panels and a low heel", SHOES),
    ("belt-leather-brown", "Brown leather belt", "accessory", "brown", "after",
     "a brown leather belt with a simple silver buckle, loosely coiled", FLAT),
]

TEMPLATE = ("Studio product photograph for an online clothing catalog: {desc}. {pres} The item is centered and the "
            "entire item is fully visible with a generous empty margin on all four sides; nothing is cropped or cut off "
            "at the edges. Clean, light warm-grey seamless paper background, soft even diffused studio lighting, a "
            "gentle natural soft shadow. Realistic fabric texture, seams and stitching, true-to-life colour. Exactly "
            "one item in the frame: no person, no visible mannequin, no hanger, no props, no price tags, no labels, "
            "no brand logos, no text, no letters, no numbers, no graphics, no watermark.")
# The two graphic tees need their picture; the template's "no graphics" would fight it.
GRAPHIC_TAIL = ("Studio product photograph rules: exactly one item in the frame: no person, no visible mannequin, no hanger, "
                "no props, no price tags, no labels, no brand logos, no text, no letters, no numbers, no watermark; the "
                "only graphic is the printed picture described.")


def prompt(item):
    slug, name, cat, colour, phase, desc, pres = item
    p = TEMPLATE.format(desc=desc, pres=pres)
    if slug.startswith("tee-graphic"):
        p = p.replace(" no graphics,", "") + " " + GRAPHIC_TAIL
    return p


def path(slug, v):
    return os.path.join(GDIR, f"{slug}.v{v}.jpg")


def next_v(slug):
    vs = [int(re.search(r"\.v(\d+)\.jpg$", p).group(1)) for p in glob.glob(os.path.join(GDIR, f"{slug}.v*.jpg"))]
    return max(vs, default=0) + 1


def submit():
    todo = [i for i in ITEMS if next_v(i[0]) == 1]
    est = len(todo) * C.PER_IMAGE[(MODEL, SIZE)] / 2
    C.guard(est, "garments batch")
    items = [(f"{i[0]}.v1", C.request_body(prompt(i), aspect="3:4", size=SIZE)) for i in todo]
    op = C.batch_submit(MODEL, items, "jake-garments-v1")
    json.dump({"op": op, "keys": [k for k, _ in items], "at": C.now(), "est": est},
              open(os.path.join(GDIR, "batch.json"), "w"), indent=1)
    print("submitted", op, len(items), "est $%.3f" % est)


def poll(op):
    j = C.batch_get(op)
    meta = j.get("metadata") or {}
    state = meta.get("state") or ("DONE" if j.get("done") else "?")
    if not j.get("done"):
        print("state", state, json.dumps(meta.get("batchStats") or {}))
        return False
    res = C.batch_results(j)
    ok = 0
    for key, resp, err in res:
        slug, v = key.rsplit(".v", 1)
        out = path(slug, int(v))
        row = {"item": "garment", "tag": f"garment:{slug}:v{v}", "provider": "google", "model": MODEL, "tier": "batch",
               "aspect": "3:4", "size": SIZE, "refs": 0, "out": os.path.relpath(out, C.ROOT)}
        if err or not resp:
            row.update(status="error", error=json.dumps(err)[:300], usd=0)
        else:
            usd, toks = C.image_cost(MODEL, resp.get("usageMetadata", {}), SIZE, batch=True)
            row.update(usd=usd, tokens=toks)
            dims, e = C.save_image(resp, out)
            if e: row.update(status="no_image", error=e)
            else: row.update(status="ok", w=dims[0], h=dims[1]); ok += 1
        C.log(row)
    print("done", ok, "of", len(res), "spent", C.spent())
    return True


def one(slug, extra=""):
    it = next(i for i in ITEMS if i[0] == slug)
    v = next_v(slug)
    r = C.generate(MODEL, prompt(it) + (" " + extra if extra else ""), path(slug, v), aspect="3:4", size=SIZE,
                   tag=f"garment:{slug}:v{v}", item="garment")
    print(slug, v, r.get("status"), r.get("usd"), (r.get("error") or "")[:200])


if __name__ == "__main__":
    os.makedirs(GDIR, exist_ok=True)
    cmd = sys.argv[1]
    if cmd == "submit": submit()
    elif cmd == "poll": poll(sys.argv[2])
    elif cmd == "one": one(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "")
    elif cmd == "prompt": print(prompt(next(i for i in ITEMS if i[0] == sys.argv[2])))
    elif cmd == "list":
        for i in ITEMS: print(i[4], i[0], next_v(i[0]) - 1)
    print("spent", C.spent())
