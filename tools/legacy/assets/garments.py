"""Step 2: Emma's wardrobe, ~50 product photos (Nano Banana 2.1).

  python3 garments.py batch 1          # generate batch 1 (10 pieces), skip ones that exist
  python3 garments.py redo <slug> "<extra instruction>"   # new version vN+1 of one piece
  python3 garments.py manifest         # rebuild garments/manifest.json from calls.jsonl + PICKS
"""
import concurrent.futures as cf, glob, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C

MODEL = "gemini-nano-banana-2.1"
SIZE = "2K"
GDIR = os.path.join(C.ASSETS, "garments")
PICKS = os.path.join(HERE := os.path.dirname(os.path.abspath(__file__)), "garment_picks.json")  # slug -> chosen version

APPAREL = ("Shown as an invisible ghost-mannequin front view, as if worn by an invisible body, with a natural drape "
           "and realistic shape; the inside back of the neckline may be visible.")
BOTTOM = "Shown as an invisible ghost-mannequin front view of the full length, from waistband to hem, natural shape."
FLAT = "Laid neatly flat and photographed straight from above."
SHOES = "A pair of shoes side by side, photographed at a gentle three-quarter front angle, both shoes fully visible."
BAG = "Standing upright on its base, photographed at a slight three-quarter front angle, strap or handles visible."
SMALL = "Arranged neatly in the center, photographed from slightly above."

# slug, name, category, colour, description, presentation, batch
ITEMS = [
    # batch 1: denim + basics + shirts
    ("light-wash-straight-jeans", "Light-wash straight-leg jeans", "bottom", "light blue", "women's high-rise straight-leg jeans in a light vintage blue wash, full length to the ankle, five-pocket style with plain unbranded metal buttons and rivets, no leather patch", BOTTOM, 1),
    ("dark-wash-straight-jeans", "Dark-wash straight-leg jeans", "bottom", "dark indigo", "women's high-rise straight-leg jeans in a clean dark indigo rinse wash, full length to the ankle, five-pocket style with plain unbranded metal buttons, no leather patch", BOTTOM, 1),
    ("denim-jacket", "Denim jacket", "outerwear", "medium blue", "a classic women's trucker-style denim jacket in a medium blue wash, two chest flap pockets, plain unbranded metal buttons, buttoned up", APPAREL, 1),
    ("white-tee", "White tee", "top", "white", "a plain white cotton crew-neck t-shirt, women's relaxed fit, short sleeves", APPAREL, 1),
    ("black-tee", "Black tee", "top", "black", "a plain black cotton crew-neck t-shirt, women's relaxed fit, short sleeves", APPAREL, 1),
    ("grey-crewneck-sweatshirt", "Grey crewneck sweatshirt", "top", "heather grey", "a plain heather-grey fleece crewneck sweatshirt, relaxed fit, ribbed cuffs and hem, no print", APPAREL, 1),
    ("navy-hoodie", "Navy hoodie", "top", "navy", "a plain faded-navy pullover hoodie with a front kangaroo pocket and flat drawstrings, relaxed fit, no print", APPAREL, 1),
    ("plaid-flannel-shirt", "Plaid flannel shirt", "top", "green and navy", "a soft brushed-cotton flannel button-up shirt in a muted forest-green and navy plaid, long sleeves, two chest pockets, buttoned", APPAREL, 1),
    ("blue-oxford-shirt", "Blue oxford shirt", "top", "light blue", "a light-blue cotton oxford button-down shirt, women's relaxed fit, long sleeves, button-down collar, buttoned", APPAREL, 1),
    ("striped-long-sleeve-tee", "Striped long-sleeve tee", "top", "navy and white", "a Breton-style long-sleeve cotton top with even navy and white horizontal stripes, boat neckline", APPAREL, 1),
    # batch 2: knits + work + outerwear
    ("oatmeal-cardigan", "Oatmeal cardigan", "outerwear", "oatmeal", "a soft oatmeal-beige knit V-neck cardigan with five small round buttons, buttoned, slightly relaxed fit", APPAREL, 2),
    ("cream-cable-knit-sweater", "Cream cable-knit sweater", "top", "cream", "a chunky ivory-cream wool fisherman cable-knit crewneck sweater, relaxed fit", APPAREL, 2),
    ("black-blazer", "Black blazer", "outerwear", "black", "a women's black single-breasted blazer, slightly oversized, notch lapels, two flap pockets, one black button, shown buttoned", APPAREL, 2),
    ("black-trousers", "Black trousers", "bottom", "black", "women's black high-waisted straight-leg tailored trousers with a sharp front crease, full length", BOTTOM, 2),
    ("camel-satin-midi-skirt", "Camel satin midi skirt", "bottom", "camel", "a camel-tan satin bias-cut midi skirt that falls to mid-calf, soft sheen, simple elastic-free waistband", BOTTOM, 2),
    ("khaki-trench-coat", "Khaki trench coat", "outerwear", "khaki", "a classic women's double-breasted khaki trench coat, knee length, belted at the waist, wide lapels, epaulettes", APPAREL, 2),
    ("black-puffer-jacket", "Black puffer jacket", "outerwear", "black", "a women's black quilted down puffer jacket, hip length, stand-up collar, zipped, matte finish, no logo patch", APPAREL, 2),
    ("camel-wool-coat", "Camel wool coat", "outerwear", "camel", "a women's camel wool single-breasted overcoat, below the knee, notch lapels, clean minimal lines", APPAREL, 2),
    ("varsity-jacket", "Varsity jacket", "outerwear", "navy and cream", "a women's varsity bomber jacket with a navy wool body and cream leather sleeves, striped ribbed collar, cuffs and hem, snap front, completely plain with no letters, patches or numbers", APPAREL, 2),
    ("black-leather-jacket", "Black leather jacket", "outerwear", "black", "a women's black leather moto jacket with an asymmetric silver zip, wide lapels, zipped closed", APPAREL, 2),
    # batch 3: dresses + going out + activewear + summer + more basics
    ("little-black-dress", "Little black dress", "dress", "black", "a women's little black dress: sleeveless, fitted, square neckline, just above the knee, smooth matte crepe fabric", APPAREL, 3),
    ("champagne-slip-dress", "Champagne slip dress", "dress", "champagne", "a women's champagne satin slip dress with thin straps and a V neckline, bias cut, midi length, soft sheen", APPAREL, 3),
    ("black-satin-camisole", "Black satin camisole", "top", "black", "a women's black satin camisole top with thin straps and a straight neckline", APPAREL, 3),
    ("sage-leggings", "Sage leggings", "bottom", "sage green", "women's high-waisted full-length athletic leggings in a soft sage green, matte, seamless front", BOTTOM, 3),
    ("sage-sports-bra", "Sage sports bra", "top", "sage green", "a women's medium-support sports bra in a matching soft sage green, scoop neck, wide straps", APPAREL, 3),
    ("grey-running-tank", "Grey running tank", "top", "grey", "a women's light heather-grey athletic racerback tank top, relaxed fit", APPAREL, 3),
    ("black-ribbed-tank", "Black ribbed tank", "top", "black", "a women's black fitted ribbed cotton tank top with a scoop neck", APPAREL, 3),
    ("white-linen-shirt", "White linen shirt", "top", "white", "a women's white linen button-up shirt, relaxed oversized fit, long sleeves, slightly textured natural linen", APPAREL, 3),
    ("denim-cutoff-shorts", "Denim cutoff shorts", "bottom", "light blue", "women's high-rise light-wash denim shorts with a frayed raw hem, plain unbranded metal button", BOTTOM, 3),
    ("grey-sweatpants", "Grey sweatpants", "bottom", "heather grey", "women's heather-grey relaxed straight-leg fleece sweatpants with a drawstring waist, no print", BOTTOM, 3),
    # batch 4: knits extra + shoes
    ("black-turtleneck", "Black turtleneck", "top", "black", "a women's fine-knit black merino turtleneck sweater, slim fit", APPAREL, 4),
    ("navy-crewneck-sweater", "Navy crewneck sweater", "top", "navy", "a women's navy fine-knit merino crewneck sweater, relaxed fit", APPAREL, 4),
    ("white-leather-sneakers", "White leather sneakers", "footwear", "white", "minimal low-top white leather sneakers with white laces and a clean white rubber sole, completely plain with no logo, no stripes and no branding", SHOES, 4),
    ("retro-runners", "Retro runners", "footwear", "grey and navy", "retro-style running sneakers in grey suede and navy mesh with an off-white chunky sole, plain with no logo, no letters and no branding", SHOES, 4),
    ("black-loafers", "Black loafers", "footwear", "black", "women's black polished leather penny loafers with a low stacked heel", SHOES, 4),
    ("black-ankle-boots", "Black ankle boots", "footwear", "black", "women's black leather Chelsea ankle boots with elastic side panels and a low block heel", SHOES, 4),
    ("tan-cowboy-boots", "Tan cowboy boots", "footwear", "tan", "women's tan-brown leather western cowboy boots, mid-calf, pointed toe, subtle stitched detailing, angled heel", SHOES, 4),
    ("black-heels", "Black heels", "footwear", "black", "women's classic black leather pointed-toe pumps with a slim mid-height heel", SHOES, 4),
    ("tan-sandals", "Tan sandals", "footwear", "tan", "women's tan leather flat slide sandals with two wide straps", SHOES, 4),
    ("black-ballet-flats", "Black ballet flats", "footwear", "black", "women's black leather ballet flats with a rounded toe", SHOES, 4),
    # batch 5: bags + accessories
    ("black-leather-tote", "Black leather tote", "accessory", "black", "a large black leather tote bag with two shoulder handles, simple and structured, no hardware logo, no branding", BAG, 5),
    ("tan-crossbody-bag", "Tan crossbody bag", "accessory", "tan", "a small tan leather crossbody bag with a flap and an adjustable thin strap, no logo, no branding", BAG, 5),
    ("black-mini-bag", "Black mini bag", "accessory", "black", "a small black leather shoulder mini bag in a baguette shape with a short strap and a simple gold clasp, no logo", BAG, 5),
    ("navy-baseball-cap", "Navy baseball cap", "accessory", "navy", "a plain navy cotton baseball cap with a curved brim, completely blank with no logo, no embroidery and no text", SMALL, 5),
    ("cream-beanie", "Cream beanie", "accessory", "cream", "a cream ribbed-knit beanie with a folded cuff, no label, no patch", SMALL, 5),
    ("camel-plaid-scarf", "Camel plaid scarf", "accessory", "camel", "a soft wool scarf in a camel, grey and cream check, with short fringed ends, loosely folded", FLAT, 5),
    ("black-sunglasses", "Black sunglasses", "accessory", "black", "a pair of black acetate square-ish sunglasses with dark lenses, unfolded, front view, no logo on the arms", SMALL, 5),
    ("brown-leather-belt", "Brown leather belt", "accessory", "brown", "a brown leather belt with a simple gold buckle, loosely coiled", FLAT, 5),
    ("gold-hoops", "Gold hoop earrings", "accessory", "gold", "a pair of small classic polished gold hoop earrings, side by side", SMALL, 5),
    ("gold-pendant-necklace", "Gold pendant necklace", "accessory", "gold", "a delicate thin gold chain necklace with a tiny round gold pendant, laid in a soft curve", FLAT, 5),
]

TEMPLATE = ("Studio product photograph for an online clothing catalog: {desc}. {pres} The item is centered and the "
            "entire item is fully visible with a generous empty margin on all four sides; nothing is cropped or cut off "
            "at the edges. Clean, light warm-grey seamless paper background, soft even diffused studio lighting, a "
            "gentle natural soft shadow. Realistic fabric texture, seams and stitching, true-to-life colour. Exactly "
            "one item in the frame: no person, no visible mannequin, no hanger, no props, no price tags, no labels, "
            "no brand logos, no text, no letters, no numbers, no graphics, no watermark.")


def path(slug, v):
    return os.path.join(GDIR, f"{slug}-v{v}.jpg")


def next_v(slug):
    vs = [int(re.search(r"-v(\d+)\.jpg$", p).group(1)) for p in glob.glob(os.path.join(GDIR, f"{slug}-v*.jpg"))]
    return max(vs, default=0) + 1


def gen(item, extra="", v=None):
    slug, name, cat, colour, desc, pres, b = item
    v = v or next_v(slug)
    out = path(slug, v)
    if os.path.exists(out):
        return {"status": "exists", "slug": slug}
    p = TEMPLATE.format(desc=desc, pres=pres) + (" " + extra if extra else "")
    row = C.generate(MODEL, p, out, aspect="3:4", size=SIZE, tag=f"garment:{slug}:v{v}")
    row["slug"] = slug
    return row


def picks():
    return json.load(open(PICKS)) if os.path.exists(PICKS) else {}


def manifest():
    rows = [json.loads(l) for l in open(C.CALLS) if l.strip()]
    pk = picks()
    out = []
    for slug, name, cat, colour, desc, pres, b in ITEMS:
        calls = [r for r in rows if r.get("tag", "").startswith(f"garment:{slug}:")]
        v = pk.get(slug)
        if v is None:
            continue
        out.append({"slug": slug, "name": name, "category": cat, "colour": colour, "file": f"{slug}-v{v}.jpg",
                    "versions": sorted(int(r["tag"].rsplit(":v", 1)[1]) for r in calls if r.get("status") == "ok"),
                    "calls": len(calls), "cost_usd": round(sum(r.get("usd", 0) for r in calls), 4), "model": MODEL})
    tmp = os.path.join(GDIR, "manifest.json.tmp")
    json.dump({"updated": C.now(), "count": len(out), "total_cost_usd": round(sum(x["cost_usd"] for x in out), 4),
               "items": out}, open(tmp, "w"), indent=1)
    os.replace(tmp, os.path.join(GDIR, "manifest.json"))
    return out


def post_tracker(log=None):
    pk = picks()
    items = []
    for slug, name, *_ in ITEMS:
        if slug in pk:
            items.append({"path": C.thumb_rel(f"garments/{slug}-v{pk[slug]}.jpg"), "label": name})
    C.tracker(section={"id": "wardrobe", "title": f"Wardrobe: {len(items)} of {len(ITEMS)}",
                       "note": "Emma's own clothes as product photos: weekday minimal, weekend casual, one going-out look. No logos or text on anything.",
                       "items": items}, log=log)


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "batch":
        b = int(sys.argv[2])
        todo = [i for i in ITEMS if i[6] == b and next_v(i[0]) == 1]  # batch never re-makes a piece that has a version
        with cf.ThreadPoolExecutor(5) as ex:
            for r in ex.map(gen, todo):
                print(r.get("slug"), r.get("status"), r.get("ms"), r.get("usd"), (r.get("error") or "")[:160])
    elif cmd == "one":
        it = next(i for i in ITEMS if i[0] == sys.argv[2])
        r = gen(it); print(r)
    elif cmd == "redo":
        it = next(i for i in ITEMS if i[0] == sys.argv[2])
        r = gen(it, extra=sys.argv[3] if len(sys.argv) > 3 else "")
        print(r.get("slug"), r.get("status"), r.get("out"), r.get("usd"), (r.get("error") or "")[:160])
    elif cmd == "manifest":
        print(len(manifest()))
    print("spent", C.spent())
