"""Step 3: Emma's camera roll, selfie and try-on bases (Nano Banana Pro, 2K), all from face B.

  python3 roll.py run [ids...]      # make shots that have no version yet (default: all roll shots)
  python3 roll.py redo <id> "<extra>"
  python3 roll.py manifest
"""
import concurrent.futures as cf, glob, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C
import garments as G

MODEL = "gemini-3-pro-image"
FACE = os.path.join(C.ASSETS, "persona", "emma-face-B-v1.jpg")
PICKS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "roll_picks.json")
GNAME = {s: n for s, n, *_ in G.ITEMS}

# id, folder, place (plain words), framing, aspect, garment slugs, scene description
SHOTS = [
    ("r01-coffee-shop", "roll", "Coffee shop in Astoria", "half", "3:4", ["white-tee", "black-blazer", "gold-hoops"],
     "sitting at a small wooden table in a busy neighbourhood coffee shop in Astoria, Queens, holding an iced latte, morning light from the window; a friend took it across the table"),
    ("r02-subway-platform", "roll", "Subway platform", "full", "3:4", ["khaki-trench-coat", "black-trousers", "black-loafers", "black-leather-tote"],
     "standing on a New York City subway platform waiting for the train, tiled wall and steel columns behind her, fluorescent light, a train blurred in the background; full body, slightly candid"),
    ("r03-brooklyn-street", "roll", "Brooklyn street", "full", "3:4", ["light-wash-straight-jeans", "grey-crewneck-sweatshirt", "white-leather-sneakers", "navy-baseball-cap"],
     "walking toward the camera on a tree-lined Brooklyn street with brownstones and red-brick buildings, mid-step, laughing a little; full body, a friend's phone photo"),
    ("r04-park-autumn", "roll", "Central Park in the fall", "half", "3:4", ["cream-cable-knit-sweater", "camel-plaid-scarf", "dark-wash-straight-jeans"],
     "on a path in Central Park in autumn, golden and orange leaves behind her, soft overcast light, hands in her pockets; from mid-thigh up"),
    ("r05-office", "roll", "At work in the studio", "half", "3:4", ["blue-oxford-shirt", "black-trousers", "gold-pendant-necklace"],
     "sitting at her desk in a small bright design studio in the Flatiron District, a monitor showing an abstract colour layout with no readable text, mood boards pinned behind her, turning toward the camera with a smile"),
    ("r06-farmers-market", "roll", "Union Square farmers market", "full", "3:4", ["striped-long-sleeve-tee", "light-wash-straight-jeans", "tan-crossbody-bag", "white-leather-sneakers"],
     "at an outdoor farmers market in New York, holding a paper bag of apples next to a stall of produce crates, sunny late-summer morning; full body, no readable signs"),
    ("r07-rooftop-golden-hour", "roll", "Rooftop at golden hour", "half", "3:4", ["champagne-slip-dress", "black-leather-jacket", "gold-hoops"],
     "on a Manhattan rooftop bar at golden hour, the leather jacket over her shoulders, the city skyline glowing behind her, warm low sun on her face, holding a drink; from the knees up"),
    ("r08-beach-day", "roll", "Beach day at Rockaway", "full", "3:4", ["white-linen-shirt", "black-ribbed-tank", "denim-cutoff-shorts", "tan-sandals"],
     "on the sand at Rockaway Beach on a bright summer day, linen shirt worn open over the tank, ocean and a few distant beachgoers behind her, wind in her hair, squinting happily in the sun; full body"),
    ("r09-mirror-selfie-weekend", "roll", "Mirror selfie at home", "full", "3:4", ["denim-jacket", "black-tee", "dark-wash-straight-jeans", "white-leather-sneakers"],
     "a mirror selfie in the full-length mirror of her small Queens apartment bedroom, holding a phone in a plain matte beige case with no logo in front of her chest, plants and a made bed behind her, daylight; full body"),
    ("r10-night-out", "roll", "Night out downtown", "full", "3:4", ["little-black-dress", "black-heels", "black-mini-bag", "gold-hoops"],
     "a night out on the Lower East Side, standing outside a bar on the sidewalk at night, shot with the phone's flash, warm city lights and blurred people behind; full body, fun and candid, no readable signs"),
    ("r11-mirror-selfie-work", "roll", "Mirror selfie before work", "full", "3:4", ["black-turtleneck", "camel-satin-midi-skirt", "black-ankle-boots"],
     "a mirror selfie in her apartment hallway mirror before work, holding a phone in a plain matte beige case with no logo, morning light, a coat rack behind her; full body"),
    ("r12-dumbo-walk", "roll", "Walking in DUMBO", "full", "3:4", ["camel-wool-coat", "black-turtleneck", "dark-wash-straight-jeans", "black-ankle-boots"],
     "walking on a cobblestone street in DUMBO, Brooklyn, with the Manhattan Bridge behind her, crisp late-fall afternoon light; full body"),
    ("r13-winter-street", "roll", "Snowy winter street", "full", "3:4", ["black-puffer-jacket", "cream-beanie", "light-wash-straight-jeans", "retro-runners"],
     "on a snowy New York side street in winter, light snow falling, holding a paper coffee cup with no logo, cheeks a little pink from the cold; full body"),
    ("r14-sunday-errands", "roll", "Sunday coffee run", "full", "3:4", ["navy-hoodie", "grey-sweatpants", "retro-runners", "navy-baseball-cap"],
     "a lazy Sunday morning outside a corner deli in Queens, holding a coffee to go, relaxed and a little sleepy, soft morning light; full body, no readable signs"),
    ("r15-hudson-run", "roll", "Run along the Hudson", "full", "3:4", ["sage-leggings", "grey-running-tank", "retro-runners"],
     "after a run on the Hudson River Greenway path, catching her breath with a smile, the river and New Jersey skyline behind her, early morning light; full body"),
    ("r16-bookstore", "roll", "Bookstore browse", "half", "3:4", ["oatmeal-cardigan", "white-tee", "dark-wash-straight-jeans"],
     "browsing in a cosy independent bookstore with tall wooden shelves, holding an open book with a plain cover, warm lamp light; from the thighs up, book spines blurred with no readable titles"),
    ("r17-brunch", "roll", "Brunch with friends", "half", "3:4", ["plaid-flannel-shirt", "white-tee", "light-wash-straight-jeans"],
     "sitting at a sunny brunch table in a Brooklyn restaurant, flannel worn open over the tee, plates of pancakes and coffee in front of her, a friend's arm visible at the edge of the frame, laughing"),
    ("r18-office-lobby", "roll", "Office lobby", "full", "3:4", ["black-blazer", "white-tee", "black-trousers", "black-loafers"],
     "in a bright Manhattan office building lobby with marble floors, holding a coffee, about to head up to work; full body, a coworker's quick phone photo"),
    ("r19-fall-game-day", "roll", "Saturday in the park", "full", "3:4", ["varsity-jacket", "white-tee", "light-wash-straight-jeans", "white-leather-sneakers"],
     "on a crisp fall Saturday in Prospect Park, sitting on a low stone wall, autumn trees behind her, holding a paper cup of cider; full body"),
    ("r20-country-night", "roll", "Country night in Brooklyn", "full", "3:4", ["black-satin-camisole", "light-wash-straight-jeans", "tan-cowboy-boots"],
     "at a country-music bar night in Brooklyn, string lights and wood panelling behind her, mid-dance with a big grin, warm low light; full body, no readable signs"),
    ("r21-museum-steps", "roll", "Museum steps", "full", "3:4", ["navy-crewneck-sweater", "camel-satin-midi-skirt", "black-loafers"],
     "sitting on wide stone museum steps on Fifth Avenue on a mild sunny afternoon, holding a pretzel, relaxed; full body, no readable signs"),
    ("r22-stoop", "roll", "On the stoop", "full", "3:4", ["navy-hoodie", "light-wash-straight-jeans", "white-leather-sneakers"],
     "sitting on the front stoop of a brick apartment building in Astoria in the late afternoon, elbows on knees, smiling at the camera; full body"),
    ("r23-rainy-day", "roll", "Rainy commute", "full", "3:4", ["khaki-trench-coat", "dark-wash-straight-jeans", "black-ankle-boots"],
     "walking on a wet Manhattan sidewalk on a rainy day holding a plain black umbrella, reflections on the pavement, yellow taxi blurred behind; full body"),
    ("r24-dinner", "roll", "Dinner date", "half", "3:4", ["black-satin-camisole", "gold-pendant-necklace", "gold-hoops"],
     "sitting at a candlelit table in a small West Village restaurant at night, glass of red wine, warm low light, a soft smile across the table; from the waist up"),
    ("r25-cafe-laptop", "roll", "Working from a cafe", "half", "3:4", ["blue-oxford-shirt", "gold-hoops", "black-leather-tote"],
     "working from a cafe window seat with a laptop that has no logo, the tote on the chair beside her, a cappuccino, looking up from the screen; from the waist up"),
    ("r26-ferry", "roll", "On the NYC Ferry", "half", "3:4", ["denim-jacket", "striped-long-sleeve-tee", "black-sunglasses"],
     "on the deck of a New York City ferry on the East River, wind in her hair, sunglasses on, the Manhattan skyline behind her on a sunny day; from the waist up"),
    ("r27-chelsea-market", "roll", "Street food in Chelsea", "full", "3:4", ["black-leather-jacket", "white-tee", "dark-wash-straight-jeans", "white-leather-sneakers"],
     "standing on a Chelsea sidewalk holding a taco, laughing mid-bite, brick warehouse buildings behind her, afternoon light; full body, no readable signs"),
    ("r28-couch-cozy", "roll", "Cozy night in", "half", "3:4", ["cream-cable-knit-sweater", "grey-sweatpants"],
     "curled up on a couch in her apartment at night with a mug of tea and a blanket, warm lamp light, a TV glow off-frame; from the knees up"),
    ("r29-gym-mirror", "roll", "Gym mirror selfie", "full", "3:4", ["sage-sports-bra", "sage-leggings", "white-leather-sneakers"],
     "a mirror selfie in a neighbourhood gym, holding a phone in a plain matte beige case with no logo, dumbbell racks behind her, bright even light; full body"),
    ("r30-walk-to-work", "roll", "Walk to work", "full", "3:4", ["striped-long-sleeve-tee", "black-trousers", "black-ballet-flats", "black-leather-tote"],
     "crossing a Flatiron District street at a crosswalk on her way to work, morning sun between the buildings, mid-stride; full body, no readable signs"),
    # selfie + try-on bases
    ("emma-selfie", "selfie", "Selfie for the selfie scene", "selfie", "3:4", ["black-tee"],
     "SELFIE"),
    ("tryon-base-1", "tryon", "Try-on base 1", "tryon", "3:4", ["white-tee", "light-wash-straight-jeans", "white-leather-sneakers"],
     "TRYON1"),
    ("tryon-base-2", "tryon", "Try-on base 2", "tryon", "3:4", ["black-tee", "dark-wash-straight-jeans", "white-leather-sneakers"],
     "TRYON2"),
]

PHONE_LOOK = ("It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, "
              "a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, "
              "no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable "
              "signs, no brand logos anywhere. ")


def prompt(shot):
    sid, folder, place, framing, aspect, slugs, scene = shot
    p = ("The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium "
         "build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown "
         "wavy hair. ")
    for i, s in enumerate(slugs):
        p += f"Image {i + 2} is a product photo of her {GNAME[s].lower()}. "
    p += ("She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, "
          "details); fill in only plain, unremarkable basics where something is not shown. ")
    if scene == "SELFIE":
        p += ("Make a front-camera selfie she took at arm's length: head and shoulders, facing the camera straight on, "
              "a natural relaxed smile, soft even daylight from a window in front of her, a plain light wall behind, "
              "her full face clearly visible and sharp, hair down, no hands covering the face. ")
    elif scene in ("TRYON1", "TRYON2"):
        p += ("Make a full-body photo for a virtual try-on app: she stands straight, facing the camera, arms relaxed "
              "slightly away from her sides, feet hip-width apart and fully visible, head to toe in frame with a "
              "little space above and below, neutral friendly expression, against a plain light-grey wall in her "
              "apartment with a light wood floor, soft even daylight, no shadows across the body. Taken by a friend "
              "with a phone at chest height. ")
        if scene == "TRYON2":
            p += "Her hair is tucked behind her shoulders. "
    else:
        p += f"Scene: Emma {scene}. "
    p += PHONE_LOOK
    return p


def next_v(sid, folder):
    vs = [int(re.search(r"-v(\d+)\.jpg$", x).group(1)) for x in glob.glob(os.path.join(C.ASSETS, folder, f"{sid}-v*.jpg"))]
    return max(vs, default=0) + 1


def gen(shot, extra=""):
    sid, folder, *_ = shot
    v = next_v(sid, folder)
    out = os.path.join(C.ASSETS, folder, f"{sid}-v{v}.jpg")
    refs = [FACE] + [os.path.join(C.ASSETS, "garments", f"{s}-v{G.picks()[s]}.jpg") for s in shot[5]]
    p = prompt(shot) + (" " + extra if extra else "")
    row = C.generate(MODEL, p, out, refs=refs, aspect=shot[4], size="2K", tag=f"{folder}:{sid}:v{v}")
    row["id"] = sid
    return row


def picks():
    return json.load(open(PICKS)) if os.path.exists(PICKS) else {}


def manifest():
    rows = [json.loads(l) for l in open(C.CALLS) if l.strip()]
    pk = picks()
    out = {"roll": [], "selfie": [], "tryon": []}
    for sid, folder, place, framing, aspect, slugs, scene in SHOTS:
        calls = [r for r in rows if r.get("tag", "").startswith(f"{folder}:{sid}:")]
        if sid not in pk:
            continue
        out[folder].append({"id": sid, "file": f"{sid}-v{pk[sid]}.jpg", "place": place, "framing": framing,
                            "wardrobe": [{"slug": s, "name": GNAME[s], "file": f"garments/{s}-v{G.picks()[s]}.jpg"} for s in slugs],
                            "face": "persona/emma-face-B-v1.jpg", "calls": len(calls),
                            "cost_usd": round(sum(r.get("usd", 0) for r in calls), 4), "model": MODEL})
    for folder, items in out.items():
        tmp = os.path.join(C.ASSETS, folder, "manifest.json.tmp")
        json.dump({"updated": C.now(), "count": len(items), "total_cost_usd": round(sum(x["cost_usd"] for x in items), 4),
                   "items": items}, open(tmp, "w"), indent=1)
        os.replace(tmp, os.path.join(C.ASSETS, folder, "manifest.json"))
    return out


def post_tracker(log=None):
    pk = picks()
    roll = [{"path": C.thumb_rel(f"roll/{s[0]}-v{pk[s[0]]}.jpg"), "label": s[2]} for s in SHOTS if s[1] == "roll" and s[0] in pk]
    other = [{"path": C.thumb_rel(f"{s[1]}/{s[0]}-v{pk[s[0]]}.jpg"), "label": s[2]} for s in SHOTS if s[1] != "roll" and s[0] in pk]
    if other:
        C.tracker(section={"id": "selfie", "title": "Emma: selfie and try-on photos",
                           "note": "The selfie for the selfie scene, and two full-body photos for the Try-ons tab.", "items": other})
    C.tracker(section={"id": "roll", "title": f"Camera roll: {len(roll)} of 30",
                       "note": "Emma (face B) in her own clothes around New York. Each photo shows 2 to 4 of her wardrobe pieces.",
                       "items": roll}, log=log)


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "run":
        ids = sys.argv[2:]
        todo = [s for s in SHOTS if (s[0] in ids if ids else s[1] == "roll") and next_v(s[0], s[1]) == 1]
        with cf.ThreadPoolExecutor(4) as ex:
            for r in ex.map(gen, todo):
                print(r.get("id"), r.get("status"), r.get("ms"), r.get("usd"), (r.get("error") or "")[:160], flush=True)
    elif cmd == "redo":
        s = next(x for x in SHOTS if x[0] == sys.argv[2])
        r = gen(s, sys.argv[3] if len(sys.argv) > 3 else "")
        print(r.get("id"), r.get("status"), r.get("out"), r.get("usd"), (r.get("error") or "")[:160])
    elif cmd == "manifest":
        manifest()
    elif cmd == "prompt":
        print(prompt(next(x for x in SHOTS if x[0] == sys.argv[2])))
    print("spent", C.spent())
