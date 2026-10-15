#!/usr/bin/env python3
"""Builds the phone-viewable concept page (published as an Artifact) from tools/state.json.

  artifact_build.py OUT_DIR      -> OUT_DIR/index.html (videos are expected in OUT_DIR/v/)
"""
import html, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
st = json.load(open(os.path.join(HERE, "state.json")))
C = {c["id"]: c for c in st["concepts"]}
out = sys.argv[1]
E = lambda s: html.escape(str(s or ""), quote=True)

VID = {  # concept -> (phone copy, label)
    "c1": "c1-motion-test-v2", "c2": "c2-motion-test-v2", "c3": "c3-motion-test-v2", "c4": "c4-motion-test-v2",
    "c5": "c5-motion-test-v2", "c7": "c7-motion-test-v1", "c9": "c9-motion-test-v1", "c12": "c12-motion-test-v1",
    "c14": "c14-motion-test-v1",
}
LENS = ["6 s", "15 s", "30 s", "60 s", "90 s–2 min", "2–3 min"]
# M = made for, c = cut-down planned
MATRIX = {
    "c1": "cMc...", "c2": "cM....", "c3": ".Mc...", "c4": ".Mc...", "c5": ".Mc...",
    "c6": "Mc....", "c7": "Mcc...", "c8": "cMc...", "c9": "cMc...", "c10": "ccM...",
    "c11": ".Mc...", "c12": "ccMc..", "c13": "..ccM.", "c14": "cMc...", "explainer": "..cc.M",
}
R1_LEN = {"c1": "11 s test", "c2": "10 s test", "c3": "12 s test", "c4": "10 s test", "c5": "10 s test"}
PICKS = [
    ("c14", "Pop out", "The lead social ad. The reference reel's pop-out move tells our story by itself: your pieces come out of your own photos. Its first 4 s are already a 6 s opener."),
    ("c9", "Rain or shine", "The clearest feature story in one move: the forecast changes and the look changes. The rain cut can run on rainy days in New York."),
    ("c7", "Zee wipe", "An ownable device nobody else has. Each leap is a 6 s bumper, and the same leap links the chapters of every longer cut and the explainer."),
]
ORDER_NEW = ["c14", "c7", "c9", "c12", "c6", "c8", "c10", "c11", "c13"]
ORDER_OLD = ["c1", "c2", "c3", "c4", "c5"]


def video(name, ratio="tall"):
    return (f'<video class="vid {ratio}" controls playsinline muted loop preload="none" '
            f'poster="v/{name}.jpg" src="v/{name}.mp4"></video>')


def chips(words):
    return "".join(f"<span>{E(w)}</span>" for w in words or [])


def concept_card(c, compact=False):
    cid = c["id"]
    v = VID.get(cid)
    made = c.get("made_for") or R1_LEN.get(cid, "")
    sb = "".join(f"<li>{E(x)}</li>" for x in c.get("storyboard", []))
    tested = '<span class="tag on">Motion test</span>' if v else '<span class="tag">Storyboard</span>'
    body = [
        f'<div class="meta"><span class="len">{E(made)}</span>{tested}<span class="cid">{E(cid)}</span></div>',
        f'<h3>{E(c["title"])}</h3>',
        f'<p class="idea">{E(c.get("idea"))}</p>',
    ]
    if c.get("transition"):
        body.append(f'<p class="kv"><b>Transition</b> {E(c["transition"])}</p>')
    if c.get("hook"):
        body.append(f'<p class="kv"><b>Hook</b> {E(c["hook"])}</p>')
    if c.get("words"):
        body.append(f'<div class="words">{chips(c["words"])}</div>')
    body.append(f'<details><summary>Storyboard</summary><ol>{sb}</ol></details>')
    if c.get("cutdowns"):
        body.append(f'<p class="kv"><b>Cut-downs</b> {E(c["cutdowns"])}</p>')
    body.append(f'<p class="kv"><b>Music</b> {E(c.get("music"))}</p>')
    body.append(f'<p class="kv"><b>Where</b> {E(c.get("channels"))}</p>')
    body.append(f'<p class="kv"><b>Footage needed</b> {E(c.get("footage"))}</p>')
    if c.get("reference"):
        body.append(f'<p class="ref">{E(c["reference"])}</p>')
    media = f'<div class="media">{video(v)}</div>' if v else ""
    return f'<article class="concept{" has-v" if v else ""}" id="{E(cid)}">{media}<div class="text">{"".join(body)}</div></article>'


def matrix():
    head = "".join(f"<th>{E(l)}</th>" for l in LENS)
    rows = []
    for cid in ["c6", "c7", "c8", "c9", "c10", "c11", "c12", "c13", "c14", "explainer", "c1", "c2", "c3", "c4", "c5"]:
        c = C[cid]
        cells = "".join(
            '<td><i class="dot made" title="made for"></i></td>' if m == "M" else '<td><i class="dot cut" title="cut-down"></i></td>' if m == "c" else "<td></td>"
            for m in MATRIX[cid]
        )
        name = "Explainer" if cid == "explainer" else c["title"]
        rows.append(f'<tr><th scope="row"><a href="#{E(cid)}"><span class="cid">{E(cid if cid != "explainer" else "")}</span> {E(name)}</a></th>{cells}</tr>')
        if cid == "explainer":
            rows.append('<tr class="sep"><th colspan="7">Round 1</th></tr>')
    return f'<div class="scroll"><table class="mx"><thead><tr><th></th>{head}</tr></thead><tbody>{"".join(rows)}</tbody></table></div>'


def scenes():
    ex = C["explainer"]
    items, notes = [], []
    for s in ex["storyboard"]:
        m = re.match(r"^(\d:\d\d–\d:\d\d) · ([^.]+)\. (.*)$", s)
        if not m:
            notes.append(s)
            continue
        tc, name, rest = m.groups()
        parts = {}
        keys = ["VO:", "On screen:", "Picture:", "Footage:"]
        idx = sorted((rest.find(k), k) for k in keys if rest.find(k) >= 0)
        for i, (pos, k) in enumerate(idx):
            end = idx[i + 1][0] if i + 1 < len(idx) else len(rest)
            parts[k] = rest[pos + len(k):end].strip()
        vo = parts.get("VO:", "").strip().strip('"')
        heading = re.sub(r"\bzee\b", "Zee", name.capitalize())
        items.append(
            f'<li class="scene"><div class="tc">{E(tc)}</div><div class="sc"><h4>{E(heading)}</h4>'
            + (f'<p class="vo">{E(vo)}</p>' if vo else "")
            + (f'<p class="kv"><b>On screen</b> {E(parts["On screen:"])}</p>' if "On screen:" in parts else "")
            + (f'<p class="kv"><b>Picture</b> {E(parts["Picture:"])}</p>' if "Picture:" in parts else "")
            + (f'<p class="kv"><b>Footage</b> {E(parts["Footage:"])}</p>' if "Footage:" in parts else "")
            + "</div></li>"
        )
    note_html = "".join(f'<p class="kv">{E(n).replace("VOICEOVER,", "<b>Voiceover</b>", 1).replace("MUSIC:", "<b>Music</b>", 1)}</p>' for n in notes)
    return "".join(items), note_html


scene_html, notes_html = scenes()
ex = C["explainer"]
picks = "".join(
    f'<li><a href="#{cid}"><span class="pn">{i + 1}</span><span><b>{E(t)}</b> <span class="len">{E(C[cid]["made_for"])}</span><br>{E(why)}</span></a></li>'
    for i, (cid, t, why) in enumerate(PICKS)
)
new_cards = "".join(concept_card(C[c]) for c in ORDER_NEW)
old_cards = "".join(concept_card(C[c], True) for c in ORDER_OLD)

page = f"""<title>Curate Video Concepts</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">
<style>
/* Layout: one reading column; concept cards put the 9:16 test beside the words on wide screens, stacked on phones. Monochrome, like the brand book. */
:root{{
  --bg:#F6F7F7; --surface:#FFFFFF; --ink:#181818; --muted:#656565; --faint:#8B8B8B; --line:#DDDDDD; --chip:#EBEBEB;
  --display:"Geist",-apple-system,"Helvetica Neue",Arial,sans-serif;
  --body:"Geist",-apple-system,"Helvetica Neue",Arial,sans-serif;
  --mono:"Geist Mono",ui-monospace,Menlo,monospace;
}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{
  --bg:#121313; --surface:#1B1C1D; --ink:#F2F2F2; --muted:#B3B3B3; --faint:#8B8B8B; --line:#2E3031; --chip:#26282A; color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#121313; --surface:#1B1C1D; --ink:#F2F2F2; --muted:#B3B3B3; --faint:#8B8B8B; --line:#2E3031; --chip:#26282A; color-scheme:dark}}
*{{box-sizing:border-box}}
body{{background:var(--bg);color:var(--ink);font:15px/1.55 var(--body);margin:0;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:28px 64px}}
main{{max-width:980px;margin:0 auto;display:flex;flex-direction:column;gap:44px}}
h1,h2,h3,h4{{margin:0;text-wrap:balance;font-family:var(--display)}}
h1{{font-weight:500;font-size:clamp(30px,6vw,46px);line-height:1.04;letter-spacing:-.035em}}
h2{{font-weight:500;font-size:22px;letter-spacing:-.02em}}
h3{{font-weight:500;font-size:20px;letter-spacing:-.02em}}
h4{{font-weight:500;font-size:16px}}
p{{margin:0}}
a{{color:inherit}}
.eyebrow{{font:500 12px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}}
.lede{{font-size:17px;color:var(--muted);max-width:62ch}} .lede b{{color:var(--ink);font-weight:500}}
section{{display:flex;flex-direction:column;gap:16px}}
.sub{{color:var(--muted);max-width:65ch}}
.picks{{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}}
.picks a{{display:flex;gap:12px;text-decoration:none;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px;height:100%;color:var(--muted)}}
.picks b{{color:var(--ink);font-weight:500}}
.pn{{font:500 13px/1.6 var(--mono);color:var(--ink);flex:none}}
.len{{display:inline-block;font:500 12px/1 var(--mono);padding:5px 8px;border-radius:99px;background:var(--ink);color:var(--bg);font-variant-numeric:tabular-nums;white-space:nowrap}}
.tag{{font:500 11.5px/1 var(--mono);padding:5px 8px;border-radius:99px;border:1px solid var(--line);color:var(--muted)}}
.tag.on{{border-color:var(--ink);color:var(--ink)}}
.cid{{font:400 12px/1 var(--mono);color:var(--faint)}}
.scroll{{overflow-x:auto;border:1px solid var(--line);border-radius:16px;background:var(--surface)}}
table.mx{{border-collapse:collapse;width:100%;min-width:620px;font-size:14px}}
.mx th,.mx td{{padding:10px 12px;border-bottom:1px solid var(--line);text-align:center}}
.mx thead th{{font:500 12px/1.2 var(--mono);color:var(--muted);white-space:nowrap}}
.mx tbody th{{text-align:left;font-weight:400;white-space:nowrap}} .mx tbody th a{{text-decoration:none}}
.mx tr:last-child th,.mx tr:last-child td{{border-bottom:0}}
.mx tr.sep th{{font:500 11.5px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);text-align:left;background:var(--bg)}}
.dot{{display:inline-block;width:12px;height:12px;border-radius:50%;vertical-align:middle}}
.dot.made{{background:var(--ink)}} .dot.cut{{border:2px solid var(--faint)}}
.legend{{display:flex;gap:18px;flex-wrap:wrap;font-size:13px;color:var(--muted)}} .legend span{{display:flex;gap:7px;align-items:center}}
.concepts{{display:flex;flex-direction:column;gap:16px}}
.concept{{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:18px;display:grid;gap:18px;grid-template-columns:1fr}}
.concept.has-v{{grid-template-columns:minmax(0,300px) minmax(0,1fr)}}
@media (max-width:680px){{.concept.has-v{{grid-template-columns:1fr}}}}
.text{{display:flex;flex-direction:column;gap:10px;min-width:0}}
.meta{{display:flex;gap:8px;align-items:center;flex-wrap:wrap}}
.idea{{color:var(--muted)}}
.kv{{font-size:14px;color:var(--muted)}} .kv b{{color:var(--ink);font-weight:500;margin-right:4px}}
.ref{{font-size:13px;color:var(--faint);border-top:1px solid var(--line);padding-top:10px}}
.words{{display:flex;flex-wrap:wrap;gap:6px}} .words span{{font-size:13px;padding:4px 10px;border-radius:99px;background:var(--chip)}}
details summary{{cursor:pointer;font-weight:500;font-size:14px}}
details ol{{margin:8px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:5px;font-size:14px;color:var(--muted)}}
summary:focus-visible,a:focus-visible,video:focus-visible{{outline:2px solid var(--ink);outline-offset:2px}}
.media{{min-width:0}}
.vid{{display:block;width:100%;max-width:100%;border-radius:14px;background:#000}}
.vid.tall{{aspect-ratio:9/16;max-height:72vh;object-fit:contain}}
.vid.wide{{aspect-ratio:16/9}}
.ex-v{{display:grid;grid-template-columns:minmax(0,240px) minmax(0,1fr);gap:14px;align-items:start}}
@media (max-width:680px){{.ex-v{{grid-template-columns:1fr}}}}
.cap{{font-size:12.5px;color:var(--faint);margin-top:6px}}
.scenes{{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;border-top:1px solid var(--line)}}
.scene{{display:grid;grid-template-columns:92px minmax(0,1fr);gap:14px;padding-block:16px;border-bottom:1px solid var(--line)}}
.tc{{font:500 13px/1.5 var(--mono);font-variant-numeric:tabular-nums}}
.sc{{display:flex;flex-direction:column;gap:7px;min-width:0}}
.vo{{font-size:17px;line-height:1.45}} .vo::before{{content:"VO  ";font:500 11px/1 var(--mono);color:var(--faint);letter-spacing:.06em}}
.notes{{display:flex;flex-direction:column;gap:10px}}
.rules{{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px 18px}}
.rules ul{{margin:8px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:6px;color:var(--muted);font-size:14px}}
footer{{font-size:12.5px;color:var(--faint)}}
@media (prefers-reduced-motion:reduce){{*{{scroll-behavior:auto}}}}
</style>

<main>
  <header style="display:flex;flex-direction:column;gap:14px">
    <p class="eyebrow">Marketing videos · round 2 · 15 Oct 2026</p>
    <h1>Every length, from a 6 s bumper to the 2:50 explainer</h1>
    <p class="lede">Nine new concepts built around transitions for TikTok, Reels and Shorts (<b>c6–c14</b>), the full app explainer, and motion tests for <b>four</b> of them plus the explainer's opening. The tests use only Zee, Geist type and Emma's generated pieces and photo. No app footage yet: that comes from Emma's account. Videos start muted; tap the speaker for the music.</p>
  </header>

  <section aria-labelledby="picks">
    <h2 id="picks">Top 3 picks</h2>
    <ol class="picks">{picks}</ol>
    <p class="sub">Runner-up: <a href="#c12">Mon to Sun, one move</a>, for Sunday-night "plan my week" posts.</p>
  </section>

  <section aria-labelledby="spectrum">
    <h2 id="spectrum">The length spectrum</h2>
    <div class="legend"><span><i class="dot made"></i> made for</span><span><i class="dot cut"></i> cut-down planned</span></div>
    {matrix()}
  </section>

  <section aria-labelledby="explainer">
    <h2 id="explainer">The app explainer · 2:50</h2>
    <p class="sub">{E(ex["idea"])} For the website and YouTube in 16:9, and for onboarding as a 9:16 reframe split into chapters.</p>
    <div class="ex-v">
      <div>{video("explainer-open-v2")}<p class="cap">Opening 0:00–0:27, 9:16</p></div>
      <div>{video("explainer-open-16x9-v2", "wide")}<p class="cap">Opening 0:00–0:27, 16:9. The voiceover isn't recorded; its lines run as captions to show the timing.</p></div>
    </div>
    <ol class="scenes">{scene_html}</ol>
    <div class="notes">{notes_html}<p class="kv"><b>Cut-downs</b> {E(ex["cutdowns"])}</p></div>
  </section>

  <section aria-labelledby="new">
    <h2 id="new">New concepts</h2>
    <p class="sub">Tested ones first. Each card says the length it's made for and how it cuts down.</p>
    <div class="concepts">{new_cards}</div>
  </section>

  <section aria-labelledby="old">
    <h2 id="old">Round 1, unchanged</h2>
    <div class="concepts">{old_cards}</div>
  </section>

  <section class="rules" aria-labelledby="rules">
    <h2 id="rules" style="font-size:17px">House rules these follow</h2>
    <ul>
      <li>No shopping, prices or buy links anywhere, and no pipeline words on screen (Zee's lines say what she decided, never how).</li>
      <li>Emma is a made-up persona. She never vouches for the app; captions only say what happens (FTC rule on fake testimonials).</li>
      <li>Music is Mixkit (free for social, web and online ads; no TV or radio; never register it with Content ID). On TikTok a business account can only use its Commercial Music Library for trending sounds.</li>
      <li>No paid calls were made. A TTS voice or a real try-on costs money and needs your OK first.</li>
      <li>c14 and the moves folded into c6, c8, c11, c13 and the explainer come from your reference reel ("how to: Pop Off"). We took the moves only, not its tutorial format, branding or faces.</li>
    </ul>
  </section>

  <footer>Rendered on the Mac with Remotion at 1080×1920 (and 1920×1080), 30 fps, H.264. The copies on this page are smaller versions for phones. Full-size files are in marketing/videos/cuts/.</footer>
</main>
"""
open(os.path.join(out, "index.html"), "w").write(page)
print("wrote", os.path.join(out, "index.html"), len(page))
