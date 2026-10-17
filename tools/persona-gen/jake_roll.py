"""Jake, step 3: his camera roll (15 + a selfie) and the skit's BEFORE stills (7), all from the picked face
(Nano Banana Pro, 2K). From prompt.image-gen.camera-roll-photo.v1 (Emma's proven template), re-cast for Jake.

  python3 tools/persona-gen/jake_roll.py prompt <id>            # print one prompt
  python3 tools/persona-gen/jake_roll.py submit [ids…]          # one Batch API job (half price, ~$0.067 each)
  python3 tools/persona-gen/jake_roll.py poll <op>              # save results when done
  python3 tools/persona-gen/jake_roll.py one <id> ["extra"]     # one shot, standard tier (~$0.134), next version
Set the face with JAKE_FACE=a|b|c (the founder's pick). Raw files: .cache/persona-gen/jake/{roll,stills}/<id>.v<N>.jpg
"""
import glob, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C
import jake_faces as F
import jake_garments as G

MODEL = "gemini-3-pro-image"
SIZE = "2K"
FACE_LETTER = os.environ.get("JAKE_FACE", "").lower()
FACE = os.path.join(C.LIB, "people", "jake", f"{FACE_LETTER}.v1.jpg")
OUTDIR = os.path.join(C.WORK, "jake")

IDENTITY = {
    "a": "light skin with a warm undertone and a few faint freckles, grey-blue eyes and short, slightly messy sandy-brown hair",
    "b": "warm tan skin, dark-brown eyes, thick black hair short on the sides and a little longer and messy on top, and the faint shadow of a first mustache",
    "c": "medium-dark brown skin, brown eyes, a short low-cut fade and a soft, boyish face",
}

def gname(slug):
    it = next(i for i in G.ITEMS if i[0] == slug)
    return it[1].lower()

def gfile(slug):
    v, _ = G.PICK.get(slug, (1, slug))
    return G.path(slug, v)

# id, folder, aspect, garment slugs, scene ("SELFIE" = the front-camera selfie)
SHOTS = [
    ("r01-campus-quad", "roll", "3:4", ["shirt-camp-flamingo-print", "shorts-jorts-baggy-dark", "socks-crew-white", "slides-black-rubber", "sunglasses-wraparound-mirrored"],
     "standing on a sunny college campus quad with red-brick and pale limestone buildings and big old trees behind him, giving a double thumbs up, the sunglasses on; full body, a friend's quick phone photo"),
    ("r02-bedroom-mirror", "roll", "3:4", ["tee-tie-dye-rainbow", "shorts-basketball-mesh-red", "socks-crew-white", "slides-black-rubber"],
     "a mirror selfie in the full-length mirror of his cramped off-campus apartment bedroom, holding a phone in a plain black case with no logo in front of his chest, an unmade bed, a gaming chair and a basketball on the floor behind him, daylight; full body"),
    ("r03-tailgate", "roll", "3:4", ["windbreaker-colourblock-90s", "jeans-baggy-ripped-light", "sneakers-chunky-dad-grey", "cap-camo-flat-brim"],
     "at a college football tailgate in a big parking lot, the cap on backwards, holding a red plastic cup, folding chairs and a grill behind him, a sunny autumn afternoon; full body, no readable signs, no team logos"),
    ("r04-rec-desk", "roll", "3:4", ["tee-mustard-stretched", "shorts-cargo-khaki-baggy", "socks-crew-white", "slides-black-rubber"],
     "standing beside the front desk of a campus recreation center where he works part-time, a lanyard with a blank white badge round his neck, a goofy grin; from the knees up, no readable signs"),
    ("r05-court", "roll", "3:4", ["tee-graphic-flame-faded", "shorts-basketball-mesh-red", "socks-crew-white", "sneakers-chunky-dad-grey"],
     "on an outdoor public basketball court in a park in the early evening, holding a basketball under one arm, chain-link fence and trees behind him; full body"),
    ("r06-kitchen-pizza", "roll", "3:4", ["hoodie-grey-oversized-pilled", "shorts-basketball-mesh-red", "socks-crew-white", "slides-black-rubber"],
     "in a small, messy apartment kitchen at night, proudly holding up a frozen pizza in a plain box with no readable text, warm overhead light; full body"),
    ("r07-family-dinner", "roll", "3:4", ["polo-striped-boxy", "trousers-khaki-pleated-long", "sneakers-chunky-dad-grey"],
     "standing in his parents' suburban living room before a family dinner, hands in his pockets, a sofa and family photos in plain frames behind him; full body, his mom took it"),
    ("r08-house-party", "roll", "3:4", ["tee-graphic-wolf-moon", "jeans-baggy-ripped-light", "socks-crew-white", "slides-black-rubber"],
     "at a friend's house party at night, shot with the phone's flash, people blurred in the background, holding a red plastic cup up and yelling happily; from the knees up, no readable signs"),
    ("r09-stadium", "roll", "3:4", ["hoodie-grey-oversized-pilled", "shorts-jorts-baggy-dark", "cap-camo-flat-brim"],
     "standing in the student section of a college football stadium on a grey afternoon, the cap on backwards, the crowd blurred behind him, cheering; from the knees up, no logos, no readable signs"),
    ("r10-lecture-hall", "roll", "3:4", ["tee-graphic-flame-faded", "trousers-khaki-pleated-long", "sneakers-chunky-dad-grey"],
     "standing at the front of an empty university lecture hall with rows of fold-down seats behind him, first day of class, holding a plain notebook; full body, the hems of the trousers bunched over his shoes"),
    ("r11-car-selfie", "roll", "3:4", ["cap-camo-flat-brim", "tee-graphic-flame-faded", "sunglasses-wraparound-mirrored"],
     "a selfie he took at arm's length in the driver's seat of his old silver sedan, seatbelt on, the cap on backwards, the sunglasses pushed up on the cap, a parking lot through the windows; from the chest up, his face fully visible"),
    ("r12-hallway-mirror", "roll", "3:4", ["shirt-oxford-white", "tee-graphic-wolf-moon", "shorts-cargo-khaki-baggy", "socks-crew-white", "slides-black-rubber"],
     "a mirror selfie in his apartment hallway mirror, trying to 'dress up': the white oxford shirt worn wide open and untucked over the wolf t-shirt, holding a phone in a plain black case with no logo; full body"),
    ("r13-lake-dock", "roll", "3:4", ["windbreaker-colourblock-90s", "shorts-cargo-khaki-baggy", "socks-crew-white", "sneakers-chunky-dad-grey", "sunglasses-wraparound-mirrored"],
     "on a wooden dock at a lake on a windy, bright day, the sunglasses on, the windbreaker puffed up by the wind, water and trees behind him; full body"),
    ("r14-thanksgiving", "roll", "3:4", ["sweater-crewneck-navy", "trousers-khaki-pleated-long", "socks-crew-white", "slides-black-rubber"],
     "standing next to a family Thanksgiving dinner table in a suburban dining room, the turkey and dishes on the table, warm light; full body, the too-long trousers pooling over the white socks and slides; his aunt took it"),
    ("r15-bus-stop", "roll", "3:4", ["tee-mustard-stretched", "jeans-baggy-ripped-light", "socks-crew-white", "slides-black-rubber"],
     "waiting at a campus bus stop shelter on a grey morning, a plain backpack with no logo on one shoulder, scrolling on his phone; full body, no readable signs"),
    ("jake-selfie", "selfie", "3:4", ["tee-black-fitted"], "SELFIE"),
    # the skit's BEFORE stills (9:16), each made to be a 2.5D shot or a video's first frame
    ("s01-grocery-proud", "stills", "9:16", ["cap-camo-flat-brim", "tee-graphic-wolf-moon", "shorts-cargo-khaki-baggy", "socks-crew-white", "slides-black-rubber"],
     "STILL a frame from a front-camera selfie video he is filming of himself in a bright supermarket aisle with shelves of colourful products blurred behind him (no readable packaging, no store logos), holding the phone at arm's length (the phone itself is not in frame), the cap on backwards; his other hand holds up a crumpled paper grocery receipt with a phone number scribbled on it in pen (the writing illegible); a huge, proud, slightly cringe grin, eyebrows raised, like he just did the bravest thing of his life; framed from the knees up so the cargo shorts, white crew socks and slides show; vertical 9:16 phone video framing"),
    ("s02-couch-staring", "stills", "9:16", ["hoodie-grey-oversized-pilled", "shorts-basketball-mesh-red", "socks-crew-white"],
     "STILL slumped on a worn couch in his small apartment living room in the evening, the hood down, staring at his phone held in both hands with intense concentration, thumbs hovering, a lamp on, empty snack bags on the coffee table; full body, seen from across the room, room for words above his head; vertical 9:16 framing"),
    ("s03-facepalm", "stills", "9:16", ["hoodie-grey-oversized-pilled", "shorts-basketball-mesh-red", "socks-crew-white"],
     "STILL on the same worn couch the next day in daylight, his phone face-up on his knee, one hand dragged down over his face in a slow, defeated face-palm, slumped back; full body, seen from across the room, room for words above his head; vertical 9:16 framing"),
    ("s04-pacing", "stills", "9:16", ["shirt-camp-flamingo-print", "shorts-jorts-baggy-dark", "socks-crew-white", "slides-black-rubber"],
     "STILL pacing across his small apartment living room mid-stride, staring down at the phone in one hand, the other hand on the back of his head, anxious, the couch and a TV behind him, afternoon light; full body, slight motion in his step; vertical 9:16 framing"),
    ("s05-desperate-typing", "stills", "9:16", ["tee-tie-dye-rainbow"],
     "STILL lying on his back on his unmade bed at night, the room dark, his face lit only by the phone held above him, typing fast with both thumbs, a desperate, determined frown; from the waist up, seen from above at an angle; vertical 9:16 framing"),
    ("s06-jaw-drop", "stills", "9:16", ["cap-camo-flat-brim", "tee-graphic-wolf-moon", "shorts-cargo-khaki-baggy", "socks-crew-white", "slides-black-rubber"],
     "STILL standing in his apartment living room in the afternoon, the cap on backwards, holding his phone in front of him and reading a text, frozen in total shock: jaw dropped wide open, eyes wide, eyebrows up, betrayed; from the knees up, facing the camera, room above his head; vertical 9:16 framing"),
    ("s07-angry-search", "stills", "9:16", ["tee-graphic-flame-faded", "shorts-cargo-khaki-baggy"],
     "STILL sitting hunched at a cheap desk in his bedroom at night, glaring at his phone held close to his face and typing furiously with both thumbs, jaw clenched, determined and a little offended, the desk lamp on, a laptop with no logo closed beside him; from the waist up; vertical 9:16 framing"),
]

PHONE_LOOK = ("It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, "
              "a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, "
              "no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable "
              "signs, no brand logos anywhere. ")


def prompt(shot):
    sid, folder, aspect, slugs, scene = shot
    ident = IDENTITY[FACE_LETTER]
    p = ("The first image shows Jake's face. He is a 20-year-old American college guy from Bloomington, Indiana, "
         "6 foot 2, tall with broad shoulders and an athletic build from basketball, average-looking and a little "
         f"awkward. Keep his identity exactly: the same face, features, {ident}. ")
    for i, s in enumerate(slugs):
        p += f"Image {i + 2} is a product photo of his {gname(s)}. "
    p += ("He is wearing exactly these pieces from his own wardrobe, reproduced faithfully (colour, fabric, cut, print, "
          "details), worn the way he wears them: badly matched, baggy, with total confidence; fill in only plain, "
          "unremarkable basics where something is not shown. ")
    if scene == "SELFIE":
        p += ("Make a front-camera selfie he took at arm's length: head and shoulders, facing the camera straight on, a "
              "natural friendly grin, soft even daylight from a window in front of him, a plain light wall behind, his "
              "full face clearly visible and sharp, no cap, no sunglasses, no hands covering the face. ")
    elif scene.startswith("STILL "):
        p += f"Scene: Jake {scene[6:]}. He is likeable and ordinary: the joke is the clothes, never his looks. "
    else:
        p += f"Scene: Jake {scene}. "
    p += PHONE_LOOK
    return p


def path(sid, folder, v):
    return os.path.join(OUTDIR, folder, f"{sid}.v{v}.jpg")


def next_v(sid, folder):
    vs = [int(re.search(r"\.v(\d+)\.jpg$", x).group(1)) for x in glob.glob(os.path.join(OUTDIR, folder, f"{sid}.v*.jpg"))]
    return max(vs, default=0) + 1


def refs(shot):
    return [FACE] + [gfile(s) for s in shot[3]]


def submit(ids):
    assert FACE_LETTER in IDENTITY and os.path.exists(FACE), "set JAKE_FACE to the founder's pick"
    todo = [s for s in SHOTS if (not ids or s[0] in ids) and next_v(s[0], s[1]) == 1]
    est = len(todo) * C.PER_IMAGE[(MODEL, SIZE)] / 2 * 1.08  # + reference input tokens
    C.guard(est, "roll+stills batch")
    face = C.ref_bytes(FACE, 1024)
    items = [(f"{s[1]}/{s[0]}.v1", C.request_body(prompt(s), [face] + [C.ref_bytes(g, 768) for g in refs(s)[1:]], aspect=s[2], size=SIZE))
             for s in todo]
    # inline batches are capped near 20 MB: split into chunks under 16 MB
    chunks, cur, cur_mb = [], [], 0.0
    for k, b in items:
        mb = len(json.dumps(b)) / 1e6
        if cur and cur_mb + mb > 16: chunks.append(cur); cur, cur_mb = [], 0.0
        cur.append((k, b)); cur_mb += mb
    if cur: chunks.append(cur)
    ops = []
    for i, ch in enumerate(chunks):
        print(f"chunk {i}: {len(ch)} requests, {len(json.dumps([b for _, b in ch])) / 1e6:.1f} MB")
        ops.append(C.batch_submit(MODEL, ch, f"jake-roll-{FACE_LETTER}-v1-{i}"))
    json.dump({"ops": ops, "keys": [k for k, _ in items], "at": C.now(), "est": est, "face": FACE_LETTER},
              open(os.path.join(OUTDIR, "roll-batch.json"), "w"), indent=1)
    print("submitted", ops, f"est ${est:.3f}")


def poll(op):
    j = C.batch_get(op)
    meta = j.get("metadata") or {}
    if not j.get("done"):
        print("state", meta.get("state"), json.dumps(meta.get("batchStats") or {})); return False
    ok = 0
    res = C.batch_results(j)
    for key, resp, err in res:
        folder, rest = key.split("/", 1)
        sid, v = rest.rsplit(".v", 1)
        out = path(sid, folder, int(v))
        row = {"item": "roll" if folder in ("roll", "selfie") else "still", "tag": f"{folder}:{sid}:v{v}", "provider": "google",
               "model": MODEL, "tier": "batch", "size": SIZE, "face": FACE_LETTER, "out": os.path.relpath(out, C.ROOT)}
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


def one(sid, extra=""):
    s = next(x for x in SHOTS if x[0] == sid)
    v = next_v(s[0], s[1])
    r = C.generate(MODEL, prompt(s) + (" " + extra if extra else ""), path(s[0], s[1], v), refs=refs(s), aspect=s[2], size=SIZE,
                   tag=f"{s[1]}:{s[0]}:v{v}", item="roll" if s[1] in ("roll", "selfie") else "still")
    print(sid, v, r.get("status"), r.get("usd"), (r.get("error") or "")[:200])


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "prompt": print(prompt(next(x for x in SHOTS if x[0] == sys.argv[2])))
    elif cmd == "submit": submit(sys.argv[2:])
    elif cmd == "poll": poll(sys.argv[2])
    elif cmd == "one": one(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "")
    print("spent", C.spent())
