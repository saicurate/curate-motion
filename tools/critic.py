# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy==2.2.6", "pillow==11.3.0", "opencv-python-headless==4.12.0.88"]
# ///
"""tools/critic: the evidence for judging a render by its frames (decisions/0011, proposed).

  tools/critic <ad> [--render <file.mp4>] [--round N] [--samples N --shutter 0.5] [--from <track s>] [--no-determinism] [--det-frame N]
  tools/critic selftest                      the strip test on synthetic clips (sharp / echo / smooth)
  tools/critic score <ad> --round N hook=7 phone=8 smooth=6 variety=7 sound=8 brand=9 [--note "..."]
                                             (a criterion not applicable yet: sound=na, left out of min/pass)
  tools/critic history <ad>

Writes reviews/<ad>/<YYYY-MM-DD>/round-<N>/ with:
  contact.jpg    contact sheet, 2 fps, 6 across, every tile stamped with its time
  strip.jpg      the FASTEST move: 12 consecutive frames, cropped to the moving region, 1:1 pixels,
                 each with its echo score; strip-zoom.jpg = the worst frame at 2x
  phone.jpg      the phone test: one frame a second at 360 px wide (what a thumb-scroller sees)
  loop.mp4       the clip twice, back to back; seam.jpg = the last 3 + first 3 frames
  audio.wav      the blindfold test: audio only; waveform.png = waveform + onset envelope with the
                 ad's beats (ads/<ad>/beatmap.ts) drawn on, so sync can be judged without picture
  metrics.json   everything measured; review.md = the scoring template, measurements filled in

The agent judges ONLY these rendered frames (never the code), scores six things 1-10, lists the 3
worst defects (timestamp, evidence, local fix), fixes them, re-renders those seconds, and runs a new
round until every score is 8+. Scores are recorded per round in reviews/<ad>/scores.json.
"""
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
CRITERIA = [
    ("hook", "Hook in 2 s", "By 2.0 s a stranger knows what this is about and wants the next second. One clear image, no warm-up."),
    ("phone", "Phone readability", "At 360 px wide every word on screen is readable in the time it is up; one focal point per beat."),
    ("smooth", "Motion smoothness", "No echo, judder, pops or dead stops; moves have mass; the fastest move's strip shows one smear, not copies."),
    ("variety", "Variety", "Each beat earns its place with a different idea; nothing repeats without a reason; no template look."),
    ("sound", "Sound sync", "Blindfolded, the waveform alone shows the structure: hits on the moves, big moments on downbeats, -14 LUFS."),
    ("brand", "Brand accuracy", "Monochrome ramp, Geist, the real app, the logo untouched, the rules in RULES.md; the CTA readable for 2 s+."),
]


def sh(*cmd, **kw):
    return subprocess.run(list(map(str, cmd)), capture_output=True, text=True, **kw)


def font(px):
    for p in ["/System/Library/Fonts/SFNSMono.ttf", "/System/Library/Fonts/Menlo.ttc", "/Library/Fonts/Arial.ttf"]:
        try:
            return ImageFont.truetype(p, px)
        except Exception:
            pass
    return ImageFont.load_default()


def label(im, text, px=14):
    d = ImageDraw.Draw(im)
    f = font(px)
    w = d.textlength(text, font=f)
    d.rectangle([0, 0, w + 8, px + 6], fill=(0, 0, 0))
    d.text((4, 2), text, fill=(255, 255, 255), font=f)
    return im


def probe(path):
    r = sh("ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate,nb_frames:format=duration", "-of", "json", path)
    j = json.loads(r.stdout)
    v = next(s for s in j["streams"] if s["codec_type"] == "video")
    num, den = map(int, v["r_frame_rate"].split("/"))
    return {
        "width": int(v["width"]), "height": int(v["height"]), "fps": num / den,
        "duration": float(j["format"]["duration"]), "audio": any(s["codec_type"] == "audio" for s in j["streams"]),
    }


def frames(path, width, gray=True, fps=None, start=None, count=None):
    """Decode frames as uint8 arrays (N, H, W[, 3]) at `width` px."""
    pix = "gray" if gray else "rgb24"
    vf = [f"scale={width}:-2:flags=area"]
    if fps:
        vf.insert(0, f"fps={fps}")
    cmd = ["ffmpeg", "-v", "error"]
    if start is not None:
        cmd += ["-ss", f"{start:.4f}"]
    cmd += ["-i", str(path)]
    if count:
        cmd += ["-frames:v", str(count)]
    cmd += ["-vf", ",".join(vf), "-f", "rawvideo", "-pix_fmt", pix, "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    p = probe(path)
    h = int(round(p["height"] * width / p["width"] / 2) * 2)
    c = 1 if gray else 3
    n = len(raw) // (width * h * c)
    a = np.frombuffer(raw[: n * width * h * c], dtype=np.uint8)
    return a.reshape((n, h, width) if gray else (n, h, width, 3))


def frame_at(path, idx, fps, width=None):
    """One full-res RGB frame by index (exact: select by frame number)."""
    vf = f"select=eq(n\\,{idx})" + (f",scale={width}:-2:flags=area" if width else "")
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vf", vf, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True, check=True).stdout
    from io import BytesIO
    return Image.open(BytesIO(raw)).convert("RGB")


def flow_echo(prev, cur, scale):
    """
    The strip test, per frame. Optical flow (Farneback) between the previous frame and this one
    gives the real speed of the move, even for a zoom or a turn (px per frame, at full size).
    Echo = the move drawn as several sharp copies instead of one smear: along the flow direction,
    the image's gradient then repeats at the gap between sub-frame samples. For each plausible gap
    (speed x shutter / (k - 1), k = 2..12 samples, shutter 1/2 or 1) the gradient is correlated
    with itself one gap further along the flow, minus the best of half a gap and one and a half gaps
    (and 0): copies give a positive comb; one smooth smear or one sharp edge does not. Returns (speed, comb score, k, gap px).
    Calibrated with `tools/critic selftest` (synthetic sharp / 4-sample echo / 16-sample smooth).
    """
    p = prev.astype(np.float32)
    c = cur.astype(np.float32)
    f = cv2.calcOpticalFlowFarneback(prev.astype(np.uint8), cur.astype(np.uint8), None, 0.5, 5, 21, 3, 7, 1.5, 0)
    mag = np.hypot(f[..., 0], f[..., 1])
    mv = np.abs(c - p) > 10
    if mv.sum() < 200:
        return 0.0, 0.0, 0, 0.0
    sp = float(np.percentile(mag[mv], 95))
    if sp * scale < 6:
        return round(sp * scale, 1), 0.0, 0, 0.0
    band = mv & (mag > 0.5 * sp)
    ux = (f[..., 0] / (mag + 1e-6)).astype(np.float32)
    uy = (f[..., 1] / (mag + 1e-6)).astype(np.float32)
    gx = cv2.Sobel(c, cv2.CV_32F, 1, 0)
    gy = cv2.Sobel(c, cv2.CV_32F, 0, 1)
    D = (gx * ux + gy * uy).astype(np.float32)
    H, W = D.shape
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

    def corr(lag):
        sh = cv2.remap(D, xx + ux * lag, yy + uy * lag, cv2.INTER_LINEAR)
        x = D[band] - D[band].mean()
        y = sh[band] - sh[band].mean()
        return float((x * y).mean() / (x.std() * y.std() + 1e-6))

    best = (0.0, 0, 0.0)
    for shutter in (0.5, 1.0):
        for k in range(2, 13):
            gap = sp * shutter / (k - 1)
            if gap < 2.5 or gap > 60:
                continue
            sc = corr(gap) - max(0.0, corr(gap / 2), corr(1.5 * gap))
            if sc > best[0]:
                best = (sc, k, gap * scale)
    return round(sp * scale, 1), round(best[0], 3), best[1], round(best[2], 1)


ECHO_AT = 0.1  # comb at or above this = copies (selftest: 4-sample echo 0.75; smooth 0.06; sharp 0.02. v2 bar 8: 0.13)


def read_beatmap(ad, from_sec=None, length=None):
    """The ad's beats in seconds from frame 0: ads/<ad>/beatmap.ts, or (--from <s>) the track in
    ad.json clipped from the catalog's measured beatMap."""
    p = ROOT / "ads" / ad / "beatmap.ts"
    if p.exists() and from_sec is None:
        m = re.search(r"BEATMAP: AdBeatMap = (\{.*\});", p.read_text(), re.S)
        return json.loads(m.group(1)) if m else None
    if from_sec is None:
        return None
    track = json.loads((ROOT / "ads" / ad / "ad.json").read_text())["track"]
    a = next((x for x in json.loads((ROOT / "catalog" / "index.json").read_text())["assets"] if x["id"] == track), None)
    bm = a and a["asset"].get("beatMap")
    if not bm:
        return None
    end = from_sec + (length or 1e9)
    clip = lambda ts: [round(t - from_sec, 3) for t in ts if from_sec - 1e-3 <= t < end]
    return {"beats": clip(bm["beats"]), "downbeats": clip(bm["downbeats"])}


def loudness(path):
    r = sh("ffmpeg", "-nostats", "-i", path, "-filter_complex", "ebur128=peak=true", "-f", "null", "-")
    t = r.stderr
    def grab(key):
        m = re.findall(key + r":\s+(-?[\d.]+|-inf)", t)
        return float(m[-1]) if m and m[-1] != "-inf" else None
    return {"integratedLufs": grab("I"), "truePeakDbtp": grab("Peak"), "lraLu": grab("LRA")}


def audio_pcm(path, sr=22050):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vn", "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32), sr


def onset_env(y, sr, hop=256):
    n = 1024
    if len(y) < n:
        return np.zeros(1), hop
    w = np.hanning(n)
    fr = np.lib.stride_tricks.sliding_window_view(y, n)[::hop] * w
    mag = np.log1p(np.abs(np.fft.rfft(fr, axis=1)) * 10)
    flux = np.maximum(0, np.diff(mag, axis=0)).sum(axis=1)
    flux = np.concatenate([[0], flux])
    flux = np.maximum(0, flux - np.convolve(flux, np.ones(16) / 16, mode="same"))
    return flux, hop


def latest_render(ad):
    rs = sorted((ROOT / "renders" / ad).rglob("*.mp4"), key=lambda p: p.stat().st_mtime)
    if not rs:
        raise SystemExit(f"no renders under renders/{ad}/ (render first, or pass --render <file>)")
    return rs[-1]


def tile(images, cols, pad=6, bg=(255, 255, 255)):
    w = max(i.width for i in images)
    h = max(i.height for i in images)
    rows = (len(images) + cols - 1) // cols
    out = Image.new("RGB", (cols * w + (cols + 1) * pad, rows * h + (rows + 1) * pad), bg)
    for k, im in enumerate(images):
        r, c = divmod(k, cols)
        out.paste(im, (pad + c * (w + pad), pad + r * (h + pad)))
    return out


def critic(ad, render, round_n, det, det_frame, samples=None, shutter=0.5, from_sec=None):
    p = probe(render)
    fps = p["fps"]
    day = date.today().isoformat()
    out = ROOT / "reviews" / ad / day / f"round-{round_n}"
    out.mkdir(parents=True, exist_ok=True)
    M = {"ad": ad, "render": str(Path(render).resolve().relative_to(ROOT)) if str(render).startswith(str(ROOT)) else str(render), "round": round_n, "date": day, "probe": p}
    sha = sh("shasum", "-a", "256", render).stdout.split()[0]
    M["renderSha256"] = sha

    # ── motion energy per frame (gray, 270 px) ──
    g = frames(render, 270)
    n = len(g)
    diff = np.zeros(n)
    diff[1:] = np.abs(g[1:].astype(np.int16) - g[:-1].astype(np.int16)).mean(axis=(1, 2))
    lum = g.mean(axis=(1, 2))
    # cuts: one-frame spikes (a change of picture, not a move)
    cuts = [i for i in range(1, n - 1) if diff[i] > 12 and diff[i - 1] < 0.35 * diff[i] and diff[i + 1] < 0.35 * diff[i]]
    move = diff.copy()
    for i in cuts:
        move[i] = 0
    win = 12
    sums = np.convolve(move, np.ones(win), mode="valid")
    s0 = int(np.argmax(sums))
    M["motion"] = {
        "meanDiff": round(float(diff.mean()), 2), "cuts": [round(i / fps, 3) for i in cuts],
        "fastestWindow": [s0, s0 + win - 1], "fastestAtSec": round((s0 + win / 2) / fps, 3),
    }
    # holds: stretches where nothing moves (diff < 0.4 / 255 per frame on average over 0.5 s)
    still = diff < 0.4
    holds, run = [], 0
    for i, s in enumerate(still):
        run = run + 1 if s else 0
        if run == int(round(0.5 * fps)):
            holds.append([i - run + 1, i])
        elif run > int(round(0.5 * fps)):
            holds[-1][1] = i
    M["holds"] = [{"from": round(a / fps, 2), "to": round(b / fps, 2), "sec": round((b - a + 1) / fps, 2)} for a, b in holds]
    # layer drops: a frame much darker/brighter than both neighbours, which agree
    drops = [i for i in range(1, n - 1) if abs(lum[i] - (lum[i - 1] + lum[i + 1]) / 2) > 20 and abs(lum[i - 1] - lum[i + 1]) < 6]
    M["layerDrops"] = [round(i / fps, 3) for i in drops]

    # ── contact sheet: 2 fps, 6 across, stamped ──
    step = max(1, int(round(fps / 2)))
    tiles = []
    for k, i in enumerate(range(0, n, step)):
        im = frame_at(render, i, fps, 240)
        tiles.append(label(im, f"{i / fps:5.2f}s"))
    tile(tiles, 6).save(out / "contact.jpg", quality=86)

    # ── the strip: 12 consecutive frames of the fastest move, cropped to where it moves, 1:1 ──
    first = max(1, s0 - 1)
    full = [np.asarray(frame_at(render, i, fps)) for i in range(first - 1, min(n, s0 + win))]
    grayf = [f.mean(axis=2) for f in full]
    mask = np.zeros(grayf[0].shape, bool)
    for a, b in zip(grayf[:-1], grayf[1:]):
        mask |= np.abs(b - a) > 12
    ys, xs = np.where(mask)
    H, W = grayf[0].shape
    if len(xs):
        x0, x1 = np.percentile(xs, 1), np.percentile(xs, 99)
        y0, y1 = np.percentile(ys, 1), np.percentile(ys, 99)
    else:
        x0, x1, y0, y1 = 0, W, 0, H
    cw = int(min(W, max(240, x1 - x0 + 40)))
    chh = int(min(H, max(240, y1 - y0 + 40)))
    cx = int(np.clip((x0 + x1) / 2 - cw / 2, 0, W - cw))
    cy = int(np.clip((y0 + y1) / 2 - chh / 2, 0, H - chh))
    fw = 540  # flow at half size of a 1080 frame
    sc_ = W / fw
    small = [cv2.resize(gf.astype(np.float32), (fw, int(round(H * fw / W))), interpolation=cv2.INTER_AREA) for gf in grayf]
    strip_tiles, echoes = [], []
    for k in range(1, len(full)):
        speed, comb, ks, gap = flow_echo(small[k - 1], small[k], sc_)
        fi = first - 1 + k
        e = {"frame": fi, "sec": round(fi / fps, 3), "speedPx": speed, "echo": comb, "samplesGuess": ks, "gapPx": gap}
        if samples and samples > 1:
            e["sampleGapPx"] = round(speed * shutter / (samples - 1), 1)
        echoes.append(e)
        im = Image.fromarray(full[k][cy:cy + chh, cx:cx + cw])
        if im.width > 420:
            im = im.resize((420, int(im.height * 420 / im.width)), Image.LANCZOS)
        strip_tiles.append(label(im, f"f{fi} {fi / fps:.2f}s {speed:.0f}px/f comb {comb:.2f}", 13))
    tile(strip_tiles, 6).save(out / "strip.jpg", quality=90)
    worst = max(range(len(echoes)), key=lambda i: (echoes[i]["echo"], echoes[i]["speedPx"]))
    wf = full[worst + 1][cy:cy + chh, cx:cx + cw]
    zim = Image.fromarray(wf)
    zim = zim.resize((zim.width * 2, zim.height * 2), Image.NEAREST)
    label(zim, f"worst: f{echoes[worst]['frame']} {echoes[worst]['speedPx']:.0f} px/frame, comb {echoes[worst]['echo']:.2f} at 2x", 16).save(out / "strip-zoom.jpg", quality=92)
    mx = max(e["echo"] for e in echoes)
    gaps = [e["sampleGapPx"] for e in echoes if "sampleGapPx" in e]
    M["strip"] = {
        "crop": [cx, cy, cw, chh], "frames": echoes, "maxEcho": mx, "maxSpeedPx": max(e["speedPx"] for e in echoes),
        "samples": samples, "shutter": shutter, "maxSampleGapPx": max(gaps) if gaps else None,
        "verdict": "ECHO" if mx >= ECHO_AT or (gaps and max(gaps) > 3) else "clean",
    }

    # ── phone test: 1 frame a second at 360 px ──
    ph = [label(frame_at(render, i, fps, 360), f"{i / fps:.1f}s") for i in range(0, n, int(round(fps)))]
    tile(ph, 5, pad=10, bg=(20, 20, 20)).save(out / "phone.jpg", quality=88)

    # ── loop: the clip twice; the seam's change vs a normal frame step ──
    lst = out / "loop-list.txt"
    lst.write_text(f"file '{Path(render).resolve()}'\nfile '{Path(render).resolve()}'\n")
    sh("ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", out / "loop.mp4")
    lst.unlink()
    seam = float(np.abs(g[0].astype(np.int16) - g[-1].astype(np.int16)).mean())
    typical = float(np.median(diff[1:])) if n > 2 else 0.0
    last3 = [label(frame_at(render, i, fps, 200), f"end f{i}") for i in range(n - 3, n)]
    first3 = [label(frame_at(render, i, fps, 200), f"start f{i}") for i in range(0, 3)]
    tile(last3 + first3, 6).save(out / "seam.jpg", quality=86)
    M["loop"] = {"seamDiff": round(seam, 2), "typicalStep": round(typical, 2), "fastestStep": round(float(diff.max()), 2),
                 "verdict": "seamless" if seam <= max(2.0, 2.5 * typical) else ("soft" if seam <= max(6.0, 0.6 * diff.max()) else "jump")}

    # ── determinism: render one frame twice from the composition ──
    if det:
        f = det_frame if det_frame is not None else int(s0 + win // 2)
        r = sh(str(ROOT / "tools" / "stills"), ad, "--determinism", "--frame", f, "--out", str((out / "det").relative_to(ROOT)), cwd=ROOT)
        line = next((l for l in r.stdout.splitlines() if l.startswith("{")), None)
        M["determinism"] = json.loads(line) if line else {"error": (r.stdout + r.stderr)[-400:]}
        if line:
            for k in ("a", "b"):
                M["determinism"][k] = str(Path(M["determinism"][k]).relative_to(ROOT))

    # ── sound: loudness + the blindfold test ──
    if p["audio"]:
        M["loudness"] = loudness(render)
        sh("ffmpeg", "-v", "error", "-y", "-i", render, "-vn", "-acodec", "pcm_s16le", out / "audio.wav")
        y, sr = audio_pcm(render)
        env, hop = onset_env(y, sr)
        bm = read_beatmap(ad, from_sec, p['duration'])
        Wd, Hd = 1800, 420
        im = Image.new("RGB", (Wd, Hd), (250, 250, 250))
        d = ImageDraw.Draw(im)
        dur = len(y) / sr
        cols = np.array_split(y, Wd)
        mid = Hd * 0.32
        for x, c in enumerate(cols):
            if len(c):
                d.line([(x, mid - c.max() * mid * 0.95), (x, mid - c.min() * mid * 0.95)], fill=(40, 40, 40))
        emax = env.max() + 1e-9
        base = Hd - 30
        t_env = np.arange(len(env)) * hop / sr
        for t, v in zip(t_env, env):
            x = t / dur * Wd
            d.line([(x, base), (x, base - v / emax * (Hd * 0.3))], fill=(70, 110, 160))
        sync = None
        if bm:
            for b in bm["beats"]:
                x = b / dur * Wd
                d.line([(x, 0), (x, Hd)], fill=(200, 200, 200))
            for b in bm["downbeats"]:
                x = b / dur * Wd
                d.line([(x, 0), (x, Hd)], fill=(230, 120, 60), width=2)
            # how much of the strong onset energy lands within 25 ms of a beat or a half beat
            t_env = np.arange(len(env)) * hop / sr
            strong = env > np.percentile(env, 90)
            grid = np.array(sorted(bm["beats"] + [(a + b) / 2 for a, b in zip(bm["beats"][:-1], bm["beats"][1:])]))
            if strong.any() and len(grid):
                dist = np.min(np.abs(t_env[strong][:, None] - grid[None, :]), axis=1)
                sync = round(float((dist < 0.025).mean()), 3)
        f = font(14)
        for s in range(int(dur) + 1):
            x = s / dur * Wd
            d.text((x + 2, Hd - 18), f"{s}s", fill=(90, 90, 90), font=f)
        d.text((6, 4), "waveform (top) · onset envelope (blue) · beats (grey) · downbeats (orange)", fill=(20, 20, 20), font=f)
        im.save(out / "waveform.png")
        M["blindfold"] = {"onsetsOnGrid": sync, "beatmap": bool(bm)}
    else:
        M["loudness"] = None
        M["blindfold"] = None

    (out / "metrics.json").write_text(json.dumps(M, indent=1) + "\n")
    write_review(out, M)
    return out, M


def write_review(out, M):
    L = M.get("loudness") or {}
    det = M.get("determinism") or {}
    ok = lambda b: "pass" if b else "FAIL"
    lufs = L.get("integratedLufs")
    tp = L.get("truePeakDbtp")
    lines = [
        f"# Critic: {M['ad']}, round {M['round']} ({M['date']})",
        "",
        f"Render: `{M['render']}` (sha256 `{M['renderSha256'][:16]}…`), {M['probe']['width']}×{M['probe']['height']}, {M['probe']['fps']:.0f} fps, {M['probe']['duration']:.2f} s.",
        "",
        "**Judge only the rendered frames below, never the code.** Score 1–10; 8+ on every line passes the round.",
        "",
        "## Evidence",
        "",
        "| File | What to look at |",
        "|---|---|",
        "| `contact.jpg` | the whole film at 2 fps: one focal point per beat? anything cluttered, off-brand, empty? |",
        f"| `strip.jpg`, `strip-zoom.jpg` | the fastest move ({M['motion']['fastestAtSec']} s, {M['strip']['maxSpeedPx']} px/frame): one smear, or copies? comb **{M['strip']['maxEcho']}**" + (f", sample gap **{M['strip']['maxSampleGapPx']} px** (≤ 3 px or it echoes)" if M['strip'].get('maxSampleGapPx') is not None else "") + f" → **{M['strip']['verdict']}** |",
        "| `phone.jpg` | 360 px wide: can every word be read in the time it's up? |",
        f"| `loop.mp4`, `seam.jpg` | the loop seam: diff {M['loop']['seamDiff']} vs a normal step {M['loop']['typicalStep']} → **{M['loop']['verdict']}** |",
        f"| `audio.wav`, `waveform.png` | the blindfold test: structure visible without picture? strong onsets on the beat grid: **{(M.get('blindfold') or {}).get('onsetsOnGrid')}** |",
        "",
        "## Measured",
        "",
        f"- Determinism: {('frame ' + str(det.get('frame')) + ' rendered twice → ' + ('EQUAL' if det.get('equal') else 'DIFFERENT')) if det.get('frame') is not None else 'not run'}",
        f"- Loudness: {lufs} LUFS integrated ({ok(lufs is not None and abs(lufs + 14) <= 1)}: −14 ± 1), true peak {tp} dBTP ({ok(tp is not None and tp <= -1)}: ≤ −1)",
        f"- Holds ≥ 0.5 s: {', '.join(str(h['from']) + '–' + str(h['to']) + ' s' for h in M['holds']) or 'none'} (an end card SHOULD hold ≥ 2 s; elsewhere a hold must be a read)",
        f"- Cuts: {', '.join(map(str, M['motion']['cuts'])) or 'none'} · layer drops: {', '.join(map(str, M['layerDrops'])) or 'none'}",
        "",
        "## Scores (1–10)",
        "",
        "| Criterion | What an 8 looks like | Score |",
        "|---|---|---|",
    ]
    lines += [f"| {name} | {what} | _ |" for _, name, what in CRITERIA]
    lines += [
        "",
        "## The 3 worst defects",
        "",
        "| # | Time | Evidence (file + what you see) | Local fix (the smallest change that fixes it) |",
        "|---|---|---|---|",
        "| 1 | | | |",
        "| 2 | | | |",
        "| 3 | | | |",
        "",
        "## This round's fixes",
        "",
        "- (what changed, and the seconds re-rendered: `tools/render <ad> --frames a-b`)",
        "",
        "Record the scores: `tools/critic score " + M["ad"] + f" --round {M['round']} hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_`",
        "",
    ]
    (out / "review.md").write_text("\n".join(lines))


def score(ad, argv):
    rn = int(argv[argv.index("--round") + 1]) if "--round" in argv else None
    note = argv[argv.index("--note") + 1] if "--note" in argv else ""
    vals = {}
    for a in argv:
        m = re.fullmatch(r"(\w+)=(\d+(?:\.\d+)?|na)", a)
        if m:
            # "na": not applicable yet (e.g. sound=na before G5's designed sound); left out of min/pass
            vals[m.group(1)] = None if m.group(2) == "na" else float(m.group(2))
    keys = [k for k, _, _ in CRITERIA]
    missing = [k for k in keys if k not in vals]
    if rn is None or missing:
        raise SystemExit(f"usage: tools/critic score <ad> --round N {' '.join(k + '=<1-10>' for k in keys)}  (missing: {', '.join(missing) or 'round'})")
    p = ROOT / "reviews" / ad / "scores.json"
    data = json.loads(p.read_text()) if p.exists() else {"ad": ad, "rounds": []}
    data["rounds"] = [r for r in data["rounds"] if r["round"] != rn]
    num = [vals[k] for k in keys if vals[k] is not None]
    entry = {"round": rn, "date": date.today().isoformat(), "scores": {k: vals[k] for k in keys}, "min": min(num), "pass": all(v >= 8 for v in num), "note": note}
    data["rounds"].append(entry)
    data["rounds"].sort(key=lambda r: r["round"])
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, indent=1) + "\n")
    fmt = lambda v: "n/a" if v is None else f"{v:g}"
    print(f"{ad} round {rn}: " + "  ".join(f"{k} {fmt(vals[k])}" for k in keys) + f"  → {'PASS (all 8+)' if entry['pass'] else 'another round: fix the worst 3'}")


def history(ad):
    p = ROOT / "reviews" / ad / "scores.json"
    if not p.exists():
        print(f"{ad}: no scored rounds yet")
        return
    for r in json.loads(p.read_text())["rounds"]:
        print(f"round {r['round']} ({r['date']}): " + "  ".join(f"{k} {'n/a' if v is None else format(v, 'g')}" for k, v in r["scores"].items()) + f"  {'PASS' if r['pass'] else ''} {r.get('note', '')}")


def selftest():
    """The strip test on synthetic moves with a known answer: one of her photos as a card sliding
    120 px a frame across white. Sharp (1 sample), echo (4 samples over half a frame: 20 px gaps)
    and smooth (16 samples + the gap blurred: what motion/Blur.tsx does). Exit 1 if misjudged."""
    src = ROOT / "library" / "camera-roll" / "emma" / "r26-ferry.v1.jpg"
    card = np.asarray(Image.open(src).convert("L").resize((300, 400))) if src.exists() else (np.indices((400, 300)).sum(0) % 37 * 6).astype(np.uint8)
    W, H, speed = 1080, 720, 120.0

    def draw(x):
        im = np.full((H, W), 255, np.float32)
        xi = int(np.floor(x))
        fr = x - xi
        c = card.astype(np.float32)
        sh = c * (1 - fr) + np.roll(c, 1, axis=1) * fr  # sub-pixel position
        x0, x1 = max(0, xi), min(W, xi + 300)
        if x1 > x0:
            im[160:560, x0:x1] = sh[:, x0 - xi:x1 - xi]
        return im

    def frame(f, samples, shutter=0.5, blur=False):
        xs = [100 + speed * (f - shutter * (samples - 1 - i) / max(1, samples - 1)) for i in range(samples)] if samples > 1 else [100 + speed * f]
        acc = np.mean([draw(x) for x in xs], axis=0)
        if blur and samples > 1:
            k = max(1, int(round(speed * shutter / (samples - 1))))
            acc = cv2.blur(acc, (k, 1))
        return acc

    cases = {"sharp (1 sample)": (1, False), "echo (4 samples, 20 px gaps)": (4, False), "smooth (16 samples + gap blur)": (16, True)}
    res = {}
    for name, (ns, bl) in cases.items():
        a, b = frame(3, ns, blur=bl), frame(4, ns, blur=bl)
        sm = [cv2.resize(x, (540, 360), interpolation=cv2.INTER_AREA) for x in (a, b)]
        res[name] = flow_echo(sm[0], sm[1], 2.0)
        print(f"{name:34s} speed {res[name][0]:6.1f} px/f   comb {res[name][1]:.3f}   → {'ECHO' if res[name][1] >= ECHO_AT else 'no echo'}")
    ok = res["echo (4 samples, 20 px gaps)"][1] >= ECHO_AT and res["smooth (16 samples + gap blur)"][1] < ECHO_AT
    print("selftest:", "PASS (echo caught, smooth passes)" if ok else "FAIL")
    sys.exit(0 if ok else 1)


def main():
    a = sys.argv[1:]
    if not a:
        print(__doc__)
        sys.exit(1)
    if a[0] == "score":
        return score(a[1], a[2:])
    if a[0] == "history":
        return history(a[1])
    if a[0] == "selftest":
        return selftest()
    ad = a[0]
    render = Path(a[a.index("--render") + 1]) if "--render" in a else latest_render(ad)
    if not render.is_absolute():
        render = (Path.cwd() / render).resolve()
    rp = ROOT / "reviews" / ad / date.today().isoformat()
    existing = sorted(int(x.name.split("-")[1]) for x in rp.glob("round-*")) if rp.exists() else []
    rn = int(a[a.index("--round") + 1]) if "--round" in a else (existing[-1] + 1 if existing else 1)
    det_frame = int(a[a.index("--det-frame") + 1]) if "--det-frame" in a else None
    samples = int(a[a.index("--samples") + 1]) if "--samples" in a else None
    shutter = float(a[a.index("--shutter") + 1]) if "--shutter" in a else 0.5
    from_sec = float(a[a.index("--from") + 1]) if "--from" in a else None
    out, M = critic(ad, render, rn, "--no-determinism" not in a, det_frame, samples, shutter, from_sec)
    print(f"critic {ad} round {rn}: {out.relative_to(ROOT)}/")
    gap = f", sample gap {M['strip']['maxSampleGapPx']} px ({M['strip']['samples']} samples)" if M['strip'].get('maxSampleGapPx') is not None else ""
    print(f"  fastest move {M['motion']['fastestAtSec']} s, {M['strip']['maxSpeedPx']} px/frame · strip comb {M['strip']['maxEcho']}{gap} → {M['strip']['verdict']}")
    print(f"  loop {M['loop']['verdict']} (seam {M['loop']['seamDiff']} vs step {M['loop']['typicalStep']}) · holds {len(M['holds'])} · layer drops {len(M['layerDrops'])}")
    if M.get("determinism"):
        print(f"  determinism: {'EQUAL' if M['determinism'].get('equal') else M['determinism']}")
    if M.get("loudness"):
        print(f"  loudness {M['loudness']['integratedLufs']} LUFS, true peak {M['loudness']['truePeakDbtp']} dBTP · onsets on grid {(M.get('blindfold') or {}).get('onsetsOnGrid')}")
    print(f"  now: open review.md, judge the images, score, list the 3 worst defects")


if __name__ == "__main__":
    main()
