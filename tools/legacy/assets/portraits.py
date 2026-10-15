"""Step 1: three candidate faces for Emma (Nano Banana Pro, 2K). python3 portraits.py [A B C]"""
import concurrent.futures as cf, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C

MODEL = "gemini-3-pro-image"
BASE = ("A candid, photoreal smartphone photo of a 27-year-old American woman named Emma, a junior graphic designer "
        "who lives in Queens, New York. Head and upper body, framed like a friend took it with an iPhone across a cafe "
        "table: natural window daylight from the side, a slightly busy, softly out-of-focus New York coffee shop "
        "behind her. She looks at the camera with a relaxed, friendly half-smile, not posing. "
        "She is ordinary and relatable, not a model: real skin texture with pores and small imperfections, a few "
        "flyaway hairs, natural brows, very little makeup, small gold hoop earrings. She wears a plain white crew-neck "
        "t-shirt. Average, slim-to-medium build. "
        "Phone-camera look: slight noise, true-to-life colour, no retouching, no beauty filter, no studio lighting, "
        "no shallow-depth-of-field glamour, no text, no watermark, no logos. ")
LOOKS = {
    "A": "She has light skin with a warm undertone and light freckles across her nose, hazel eyes, and shoulder-length "
         "wavy dark-blonde to light-brown hair worn half-up in a simple claw clip.",
    "B": "She has light-medium olive skin, brown eyes, and long dark-brown hair with a soft natural wave, worn down with "
         "a middle part.",
    "C": "She is of mixed Black and white heritage, with medium-brown skin, brown eyes, and shoulder-length natural 3B "
         "curls pushed back loosely with a thin black headband.",
}


def run(k, version=1):
    out = os.path.join(C.ASSETS, "persona", f"emma-face-{k}-v{version}.jpg")
    if os.path.exists(out):
        return {"status": "exists", "out": out}
    return C.generate(MODEL, BASE + LOOKS[k], out, aspect="3:4", size="2K", tag=f"face-{k}-v{version}")


if __name__ == "__main__":
    keys = sys.argv[1:] or list(LOOKS)
    with cf.ThreadPoolExecutor(3) as ex:
        for k, row in zip(keys, ex.map(run, keys)):
            print(k, row.get("status"), row.get("ms"), row.get("usd"), row.get("error", "")[:200])
    print("spent", C.spent())
