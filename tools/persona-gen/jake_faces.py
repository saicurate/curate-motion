"""Jake, step 1: three candidate faces (Nano Banana Pro, 2K, standard tier, ~$0.134 each).

  python3 tools/persona-gen/jake_faces.py [A B C]
From prompt.image-gen.face-portrait.v1 (Emma's proven template), re-cast for a 20-year-old guy.
"""
import concurrent.futures as cf, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C

MODEL = "gemini-3-pro-image"
BASE = ("A candid, photoreal smartphone photo of a 20-year-old American guy named Jake, a college sophomore in "
        "Bloomington, Indiana. Head and upper body, framed like a friend took it with an iPhone across a table in a "
        "busy campus coffee shop: natural window daylight from the side, softly out-of-focus students and a counter "
        "behind him. He looks at the camera with an eager, friendly grin that is a little too big, slightly awkward, "
        "not posing. He is tall, with broad shoulders and an athletic build from playing basketball. "
        "He is ordinary and relatable, average-looking, not a model: real skin texture with pores and small "
        "imperfections, a little shine on the forehead, natural eyebrows, a few stray hairs. He wears a plain "
        "heather-grey crew-neck t-shirt. "
        "Phone-camera look: slight noise, true-to-life colour, no retouching, no beauty filter, no studio lighting, "
        "no shallow-depth-of-field glamour, no text, no watermark, no logos. ")
LOOKS = {
    "A": "He has light skin with a warm undertone and a few faint freckles, grey-blue eyes, and short, slightly messy "
         "sandy-brown hair; clean-shaven.",
    "B": "He is Mexican-American, with warm tan skin, dark-brown eyes, and thick black hair that is short on the sides "
         "and a little longer and messy on top; the faint shadow of a first mustache.",
    "C": "He is Black American, with medium-dark brown skin, brown eyes, a short low-cut fade, and a soft, boyish face "
         "with a wide smile; clean-shaven.",
}


def run(k, version=1):
    out = os.path.join(C.WORK, "jake", "faces", f"face-{k.lower()}.v{version}.jpg")
    if os.path.exists(out):
        return {"status": "exists", "out": out}
    return C.generate(MODEL, BASE + LOOKS[k], out, aspect="3:4", size="2K", tag=f"face-{k}-v{version}", item="face")


if __name__ == "__main__":
    keys = sys.argv[1:] or list(LOOKS)
    C.guard(0.134 * len(keys), "faces")
    with cf.ThreadPoolExecutor(3) as ex:
        for k, row in zip(keys, ex.map(run, keys)):
            print(k, row.get("status"), row.get("ms"), row.get("usd"), (row.get("error") or "")[:200])
    print("spent", C.spent())
