"""Image-to-video with Veo 3.1 (Gemini API, predictLongRunning). Every take is logged with its price before it runs.

  python3 tools/persona-gen/veo.py run <shot-id> <image> <prompt-file> [--model fast|lite] [--seconds 4|6|8] [--aspect 9:16]
  python3 tools/persona-gen/veo.py poll <op> <out.mp4>
Prices (ai.google.dev/gemini-api/docs/pricing, read 2026-10-16, audio included, 720p): Fast $0.10/s, Lite $0.05/s.
Outputs: .cache/persona-gen/jake/video/<shot-id>.v<N>.mp4
"""
import base64, glob, json, os, re, sys, time
import requests
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C

MODELS = {"fast": ("veo-3.1-fast-generate-preview", 0.10), "lite": ("veo-3.1-lite-generate-preview", 0.05)}
VDIR = os.path.join(C.WORK, "jake", "video")


def next_v(sid):
    vs = [int(re.search(r"\.v(\d+)\.mp4$", x).group(1)) for x in glob.glob(os.path.join(VDIR, f"{sid}.v*.mp4"))]
    return max(vs, default=0) + 1


def run(sid, image, prompt, model="fast", seconds=6, aspect="9:16"):
    mid, per_s = MODELS[model]
    usd = round(per_s * seconds, 4)
    C.guard(usd, f"veo {sid}")
    b = open(image, "rb").read()
    body = {"instances": [{"prompt": prompt, "image": {"inlineData": {"mimeType": C.sniff(b), "data": base64.b64encode(b).decode()}}}],
            "parameters": {"aspectRatio": aspect, "durationSeconds": str(seconds), "resolution": "720p", "personGeneration": "allow_adult"}}
    r = requests.post(C.BASE + f"models/{mid}:predictLongRunning", headers={"x-goog-api-key": C.gkey()}, json=body, timeout=120)
    if r.status_code != 200:
        raise SystemExit(f"veo submit failed {r.status_code}: {r.text[:500]}")
    op = r.json()["name"]
    v = next_v(sid)
    out = os.path.join(VDIR, f"{sid}.v{v}.mp4")
    os.makedirs(VDIR, exist_ok=True)
    open(out + ".op", "w").write(op)
    t0 = time.time()
    while True:
        time.sleep(10)
        j = C.batch_get(op)
        if j.get("done"):
            break
        if time.time() - t0 > 900:
            print("still running after 15 min:", op); return
    row = {"item": "video", "kind": "video", "tag": f"video:{sid}:v{v}", "provider": "google", "model": mid, "seconds": seconds,
           "resolution": "720p", "aspect": aspect, "out": os.path.relpath(out, C.ROOT), "ms": int((time.time() - t0) * 1000)}
    if j.get("error"):
        row.update(status="error", error=json.dumps(j["error"])[:400], usd=0)
        C.log(row); print("ERROR", row["error"]); return
    samples = ((j.get("response") or {}).get("generateVideoResponse") or {}).get("generatedSamples") or []
    if not samples:
        # filtered (e.g. RAI): Google does not bill a video that was not made
        row.update(status="no_video", error=json.dumps(j.get("response"))[:400], usd=0)
        C.log(row); print("NO VIDEO", row["error"]); return
    uri = samples[0]["video"]["uri"]
    d = requests.get(uri, headers={"x-goog-api-key": C.gkey()}, timeout=300, allow_redirects=True)
    d.raise_for_status()
    open(out, "wb").write(d.content)
    os.remove(out + ".op")
    row.update(status="ok", usd=usd, bytes=len(d.content))
    C.log(row)
    print("ok", out, f"${usd}", "spent", C.spent())
    return out


if __name__ == "__main__":
    a = sys.argv[1:]
    def opt(k, d):
        return a[a.index(k) + 1] if k in a else d
    if a[0] == "run":
        run(a[1], a[2], open(a[3]).read().strip(), model=opt("--model", "fast"), seconds=int(opt("--seconds", "6")), aspect=opt("--aspect", "9:16"))
