"""Shared helpers for persona asset generation (Jake, 2026-10-16), from tools/legacy/assets/common.py.

- Keys come from AWS SSM at runtime, are held in memory only, never written and never printed.
- EVERY paid call (image, video, voice, and the app's server AI we trigger) is one row in the
  ad's spend ledger (SPEND, JSON lines: item, model, usd, status, tag, out) and gets a curate-cost
  receipt (~/.curate-cost/laptop.log) so it reaches the Spend tab.
- A HARD cap: guard(estimate) refuses any call that would take the ledger past CAP_USD.
"""
import base64, datetime as dt, io, json, os, subprocess, sys, threading, time
import requests
from PIL import Image

sys.path.insert(0, "/Users/saikumar/Desktop/Curate/curate-cost")
try:
    import receipts  # never raises
except Exception:  # pragma: no cover
    receipts = None

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
LIB = os.path.join(ROOT, "library")
WORK = os.path.join(ROOT, ".cache", "persona-gen")          # raw outputs before they enter the library
SPEND = os.path.join(ROOT, "ads", "skit-chopped", "spend.jsonl")
CAP_USD = 10.00
API = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent"
BASE = "https://generativelanguage.googleapis.com/v1beta/"

# per image, ai.google.dev/gemini-api/docs/pricing, read 2026-10-16
PER_IMAGE = {
    ("gemini-3-pro-image", "1K"): 0.134, ("gemini-3-pro-image", "2K"): 0.134, ("gemini-3-pro-image", "4K"): 0.24,
    ("gemini-nano-banana-2.1", "1K"): 0.0336, ("gemini-nano-banana-2.1", "2K"): 0.0504,
    ("gemini-3.1-flash-image", "1K"): 0.067, ("gemini-3.1-flash-image", "2K"): 0.101,
}
TOKENS = {  # $ per 1M tokens: in, text_out, image_out
    "gemini-3-pro-image": (2.00, 12.00, 120.00),
    "gemini-nano-banana-2.1": (1.50, 7.50, 30.00),
    "gemini-3.1-flash-image": (0.50, 3.00, 60.00),
}

_lock = threading.Lock()
_keys = {}


def ssm(name):
    if name not in _keys:
        out = subprocess.run(["aws", "ssm", "get-parameter", "--name", name, "--with-decryption", "--region", "us-east-1",
                              "--query", "Parameter.Value", "--output", "text"], capture_output=True, text=True, check=True)
        _keys[name] = out.stdout.strip()
    return _keys[name]


def gkey():
    return ssm("/curate/gemini-api-key")


def now():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def rows():
    if not os.path.exists(SPEND):
        return []
    return [json.loads(l) for l in open(SPEND) if l.strip()]


def spent():
    return round(sum(r.get("usd", 0) for r in rows()), 4)


def guard(estimate, what=""):
    s = spent()
    if s + estimate > CAP_USD + 1e-9:
        raise SystemExit(f"HARD CAP: ${s:.2f} spent + ${estimate:.2f} for {what} would pass ${CAP_USD:.2f}. Stopped.")
    return s


def log(row):
    row.setdefault("at", now())
    with _lock:
        os.makedirs(os.path.dirname(SPEND), exist_ok=True)
        with open(SPEND, "a") as f:
            f.write(json.dumps(row) + "\n")
    if receipts:
        receipts.record(row.get("provider", "google"), row.get("model", "?"), "marketing.skit-chopped." + row.get("item", "?"),
                        prompt=row.get("tokens", {}).get("in", 0), output=row.get("tokens", {}).get("text_out", 0),
                        images=1 if row.get("status") == "ok" and row.get("kind", "image") == "image" else 0,
                        ms=row.get("ms"), ok=row.get("status") == "ok", usd=row.get("usd"), tag=row.get("tag"))


def image_cost(model, usage, size, batch=False):
    pi, pt, po = TOKENS[model]
    inp = usage.get("promptTokenCount", 0)
    img_out = sum(d.get("tokenCount", 0) for d in usage.get("candidatesTokensDetails", []) if d.get("modality") == "IMAGE")
    txt_out = usage.get("candidatesTokenCount", 0) - img_out + usage.get("thoughtsTokenCount", 0)
    usd = inp * pi / 1e6 + txt_out * pt / 1e6 + img_out * po / 1e6
    if batch:
        usd /= 2
    return round(usd, 6), {"in": inp, "image_out": img_out, "text_out": txt_out}


def sniff(b):
    if b[:4] == b"\x89PNG": return "image/png"
    if b[:4] == b"RIFF" and b[8:12] == b"WEBP": return "image/webp"
    return "image/jpeg"


def ref_bytes(path, long_side=1024):
    """A reference image, downscaled (smaller requests, same identity)."""
    im = Image.open(path).convert("RGB")
    im.thumbnail((long_side, long_side))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=90)
    return buf.getvalue()


def request_body(prompt, refs=(), aspect="3:4", size="1K", ref_long=1024):
    parts = [{"text": prompt}]
    for r in refs:
        b = ref_bytes(r, ref_long) if isinstance(r, str) else r
        parts.append({"inline_data": {"mime_type": sniff(b), "data": base64.b64encode(b).decode()}})
    gen = {"responseModalities": ["TEXT", "IMAGE"], "imageConfig": {"aspectRatio": aspect, "imageSize": size}}
    return {"contents": [{"role": "user", "parts": parts}], "generationConfig": gen}


def save_image(j, out_path):
    cand = (j.get("candidates") or [{}])[0]
    img, words = None, ""
    for p in (cand.get("content") or {}).get("parts", []):
        if p.get("thought"): continue
        d = p.get("inlineData") or p.get("inline_data")
        if d and d.get("data"): img = base64.b64decode(d["data"])
        elif "text" in p: words += p["text"]
    if img is None:
        why = (j.get("promptFeedback") or {}).get("blockReason") or cand.get("finishReason") or "NO_IMAGE"
        return None, f"{why} {words[:200]}"
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    im = Image.open(io.BytesIO(img)).convert("RGB")
    im.save(out_path, "JPEG", quality=92)
    return im.size, None


def generate(model, prompt, out_path, refs=(), aspect="3:4", size="1K", tag="", item="image", timeout=300):
    """One paid image call (standard tier). Saves JPEG q92 to out_path. Returns the ledger row."""
    est = PER_IMAGE.get((model, size), 0.15)
    guard(est, tag)
    body = request_body(prompt, refs, aspect, size)
    row = {"item": item, "tag": tag, "provider": "google", "model": model, "tier": "standard", "aspect": aspect,
           "size": size, "refs": len(refs), "out": os.path.relpath(out_path, ROOT)}
    t0 = time.time()
    try:
        r = requests.post(API % model, headers={"x-goog-api-key": gkey(), "Accept-Encoding": "identity"}, json=body, timeout=timeout)
    except Exception as e:
        row.update(ms=int((time.time() - t0) * 1000), status="error", error=f"io: {type(e).__name__}"[:200], usd=est, usd_estimated=True)
        log(row); return row
    row.update(ms=int((time.time() - t0) * 1000), http=r.status_code)
    if r.status_code != 200:
        row.update(status="error", error=r.text[:300], usd=0); log(row); return row
    j = r.json()
    usd, toks = image_cost(model, j.get("usageMetadata", {}), size)
    row.update(usd=usd, tokens=toks)
    dims, err = save_image(j, out_path)
    if err:
        row.update(status="no_image", error=err)
    else:
        row.update(status="ok", w=dims[0], h=dims[1])
    log(row)
    return row


# ---------------- Batch API (half price, asynchronous) ----------------

def batch_submit(model, items, name):
    """items = [(key, body)], inline. Returns the batch operation name."""
    payload = {"batch": {"display_name": name, "input_config": {"requests": {"requests": [
        {"request": body, "metadata": {"key": k}} for k, body in items]}}}}
    r = requests.post(BASE + f"models/{model}:batchGenerateContent", headers={"x-goog-api-key": gkey()}, json=payload, timeout=300)
    if r.status_code != 200:
        raise SystemExit(f"batch submit failed {r.status_code}: {r.text[:400]}")
    return r.json()["name"]


def batch_get(op):
    r = requests.get(BASE + op, headers={"x-goog-api-key": gkey()}, timeout=120)
    r.raise_for_status()
    return r.json()


def batch_cancel(op):
    r = requests.post(BASE + op + ":cancel", headers={"x-goog-api-key": gkey()}, timeout=60)
    return r.status_code


def batch_results(j):
    """-> list of (key, response-or-None, error-or-None)."""
    resp = j.get("response") or {}
    inl = (resp.get("inlinedResponses") or {}).get("inlinedResponses") or resp.get("inlinedResponses") or []
    out = []
    for x in inl:
        k = (x.get("metadata") or {}).get("key")
        out.append((k, x.get("response"), x.get("error")))
    return out
