"""Shared helpers for the marketing-asset build (Emma persona), 2026-10-15.

- The Gemini key is read from SSM at runtime and held in memory only (never written, never printed).
- Every paid call is one row in calls.jsonl (model, ms, tokens, usd, status). A hard cap stops spend.
- tracker(): edits tracker_state.json and writes ../../tracker/assets.js atomically.
"""
import base64, datetime as dt, io, json, os, subprocess, tempfile, threading, time
import requests
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.dirname(HERE)
TRACKER_DIR = os.path.join(os.path.dirname(ASSETS), "tracker")
CALLS = os.path.join(HERE, "calls.jsonl")
STATE = os.path.join(HERE, "tracker_state.json")
CAP_USD = 20.00
SAFETY_USD = 19.00  # stop starting new calls past this, leaves room for in-flight ones
API = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent"

# $ per 1M tokens, ai.google.dev/gemini-api/docs/pricing (same table as research/nb21-bench, read 2026-10-08)
PRICES = {
    "gemini-3.1-flash-image": {"in": 0.50, "text_out": 3.00, "image_out": 60.00},
    "gemini-nano-banana-2.1": {"in": 1.50, "text_out": 7.50, "image_out": 30.00},
    "gemini-3-pro-image-preview": {"in": 2.00, "text_out": 12.00, "image_out": 120.00},
    "gemini-3-pro-image": {"in": 2.00, "text_out": 12.00, "image_out": 120.00},
}

_lock = threading.Lock()
_key = None


def key():
    global _key
    if _key is None:
        out = subprocess.run(["aws", "ssm", "get-parameter", "--name", "/curate/gemini-api-key", "--with-decryption",
                              "--region", "us-east-1", "--query", "Parameter.Value", "--output", "text"],
                             capture_output=True, text=True, check=True)
        _key = out.stdout.strip()
    return _key


def now():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def spent():
    if not os.path.exists(CALLS):
        return 0.0
    return round(sum(json.loads(l).get("usd", 0) for l in open(CALLS) if l.strip()), 4)


def log_call(row):
    with _lock:
        with open(CALLS, "a") as f:
            f.write(json.dumps(row) + "\n")


def cost(model, usage):
    pr = PRICES[model]
    inp = usage.get("promptTokenCount", 0)
    img_out = sum(d.get("tokenCount", 0) for d in usage.get("candidatesTokensDetails", []) if d.get("modality") == "IMAGE")
    txt_out = usage.get("candidatesTokenCount", 0) - img_out + usage.get("thoughtsTokenCount", 0)
    usd = inp * pr["in"] / 1e6 + txt_out * pr["text_out"] / 1e6 + img_out * pr["image_out"] / 1e6
    return round(usd, 6), {"in": inp, "image_out": img_out, "text_out": txt_out}


def sniff(b):
    if b[:4] == b"\x89PNG": return "image/png"
    if b[:4] == b"RIFF" and b[8:12] == b"WEBP": return "image/webp"
    return "image/jpeg"


def generate(model, prompt, out_path, refs=(), aspect="3:4", size="1K", tag="", thinking=None, timeout=240):
    """One paid image call. Saves the image (as JPEG q92) to out_path. Returns the call row."""
    with _lock:
        s = spent()
    if s >= SAFETY_USD:
        raise SystemExit(f"budget guard: ${s:.2f} spent, cap ${CAP_USD}")
    parts = [{"text": prompt}]
    for r in refs:
        b = open(r, "rb").read() if isinstance(r, str) else r
        parts.append({"inline_data": {"mime_type": sniff(b), "data": base64.b64encode(b).decode()}})
    gen = {"responseModalities": ["TEXT", "IMAGE"], "imageConfig": {"aspectRatio": aspect, "imageSize": size}}
    if thinking:
        gen["thinkingConfig"] = {"thinkingLevel": thinking}
    body = {"contents": [{"role": "user", "parts": parts}], "generationConfig": gen}
    row = {"tag": tag, "model": model, "aspect": aspect, "size": size, "refs": len(refs), "out": os.path.relpath(out_path, ASSETS)}
    t0 = time.time()
    try:
        r = requests.post(API % model, headers={"x-goog-api-key": key(), "Accept-Encoding": "identity"}, json=body, timeout=timeout)
    except Exception as e:
        # a dropped download usually means Google finished (and billed) the image: count it at the typical price
        est = {"gemini-nano-banana-2.1": 0.058, "gemini-3-pro-image": 0.14}.get(model, 0.14)
        row.update(at=now(), ms=int((time.time() - t0) * 1000), status="error", error=f"io: {e}"[:300], usd=est,
                   usd_estimated=True)
        log_call(row); return row
    row.update(at=now(), ms=int((time.time() - t0) * 1000), http=r.status_code)
    if r.status_code != 200:
        row.update(status="error", error=r.text[:300], usd=0); log_call(row); return row
    j = r.json()
    usd, toks = cost(model, j.get("usageMetadata", {}))
    row.update(usd=usd, tokens=toks)
    cand = (j.get("candidates") or [{}])[0]
    img, words = None, ""
    for p in (cand.get("content") or {}).get("parts", []):
        if p.get("thought"): continue
        d = p.get("inlineData") or p.get("inline_data")
        if d and d.get("data"): img = base64.b64decode(d["data"])
        elif "text" in p: words += p["text"]
    if img is None:
        why = (j.get("promptFeedback") or {}).get("blockReason") or cand.get("finishReason") or "NO_IMAGE"
        row.update(status="no_image", error=f"{why} {words[:200]}")
    else:
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        im = Image.open(io.BytesIO(img)).convert("RGB")
        im.save(out_path, "JPEG", quality=92)
        row.update(status="ok", w=im.size[0], h=im.size[1])
        thumb(out_path)
    log_call(row)
    return row


def thumb(path, px=400):
    rel = os.path.relpath(path, ASSETS)
    dst = os.path.join(ASSETS, "_thumbs", os.path.splitext(rel)[0] + ".jpg")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im = Image.open(path).convert("RGB")
    im.thumbnail((px, px * 2 if im.size[1] > im.size[0] else px))
    if max(im.size) > px * 1.4:
        im.thumbnail((px, px))
    im.save(dst, "JPEG", quality=82)
    return dst


def thumb_rel(asset_path):
    """Tracker-relative path of an asset's thumbnail."""
    rel = os.path.relpath(asset_path, ASSETS) if os.path.isabs(asset_path) else asset_path
    return "../assets/_thumbs/" + os.path.splitext(rel)[0] + ".jpg"


# ---------------- tracker ----------------

def load_state():
    if os.path.exists(STATE):
        return json.load(open(STATE))
    return {"phase": "Starting", "sections": [], "log": []}


def save_state(st):
    st["updated"] = now()
    st["spend"] = round(spent(), 2)
    st["cap"] = CAP_USD
    tmp = STATE + ".tmp"
    json.dump(st, open(tmp, "w"), indent=1); os.replace(tmp, STATE)
    js = ("// Written by the assets agent; the tracker re-reads it every few seconds.\n"
          "// Shape: window.CURATE_ASSETS = { updated, phase, spend, cap, sections:[{title,note,items:[{path,label}]}], log:[{t,text}] }\n"
          "window.CURATE_ASSETS = " + json.dumps({k: st[k] for k in ("updated", "phase", "spend", "cap", "sections", "log")}, indent=1) + ";\n")
    fd, tmpjs = tempfile.mkstemp(dir=TRACKER_DIR, prefix=".assets.", suffix=".js")
    with os.fdopen(fd, "w") as f:
        f.write(js)
    os.chmod(tmpjs, 0o644)
    os.replace(tmpjs, os.path.join(TRACKER_DIR, "assets.js"))


def tracker(phase=None, log=None, section=None):
    """section = {title, note, items}; replaces the section with the same title, else appends."""
    with _lock:
        st = load_state()
        if phase: st["phase"] = phase
        if log: st["log"].append({"t": now(), "text": log})
        if section:
            for i, s in enumerate(st["sections"]):
                if s["title"] == section["title"] or s.get("id") and s.get("id") == section.get("id"):
                    st["sections"][i] = section; break
            else:
                st["sections"].append(section)
        save_state(st)
