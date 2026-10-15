#!/usr/bin/env python3
"""Builds the phone-view artifact: art/index.html + art/v/*.mp4 + art/p/*.jpg (small previews)."""
import json, os, shutil, html, subprocess
C = os.path.dirname(os.path.abspath(__file__))
A = f'{C}/art'; PV = '/Users/saikumar/Desktop/Curate/marketing/videos/footage/_previews'
inv = json.load(open(f'{C}/inventory.json'))
idx = {a['id']: a for a in json.load(open('/Users/saikumar/Desktop/Curate/curate-motion/catalog/index.json'))['assets']}
shutil.rmtree(A, ignore_errors=True); os.makedirs(f'{A}/v'); os.makedirs(f'{A}/p')
files = {}
def clip_card(cid):
    short = cid.replace('footage.emma.', '')
    a = idx.get(cid, {}); src = 'probe' if 'source:probe' in a.get('tags', []) else 'app'
    dur = a.get('durationSec') or (a.get('asset') or {}).get('durationSec') or 0
    if os.path.exists(f'{PV}/{short}.mp4'):
        shutil.copy(f'{PV}/{short}.mp4', f'{A}/v/{short}.mp4'); shutil.copy(f'{PV}/{short}.jpg', f'{A}/p/{short}.jpg')
        files[f'v/{short}.mp4'] = f'{A}/v/{short}.mp4'; files[f'p/{short}.jpg'] = f'{A}/p/{short}.jpg'
    return (f'<figure class="clip"><video muted loop playsinline preload="none" poster="p/{short}.jpg" data-src="v/{short}.mp4" aria-label="{html.escape(a.get("title", short))}"></video>'
            f'<figcaption><span class="badge {src}">{src}</span><code>{html.escape(short)}</code><span class="dur">{dur:.1f} s</span></figcaption></figure>')
S = {'app': 'Her account', 'probe': 'Probe', 'no': 'Not possible', 'pending': 'Not yet'}
c = inv['counts']; tot = inv['total']
bar = ''.join(f'<span class="seg {k}" style="flex:{c[k]}" title="{S[k]}: {c[k]}"></span>' for k in ('app', 'probe', 'pending', 'no') if c[k])
secs = []; cur = None; body = []
seen = set()
for r in inv['rows']:
    if r['screen'] != cur:
        if cur is not None: secs.append((cur, body))
        cur, body = r['screen'], []
    body.append(r)
secs.append((cur, body))
out = []
for scr, rows in secs:
    items = []
    for r in rows:
        new = [x for x in r['clips'] if x not in seen]
        seen.update(r['clips'])
        clips = ''.join(clip_card(x) for x in new)
        reused = [x.replace('footage.emma.', '') for x in r['clips'] if x not in new]
        meta = f'<p class="what">{html.escape(r["what"])}</p><p class="code"><code>{html.escape(r["code"])}</code></p>'
        if reused: meta += f'<p class="also">Shown in {", ".join("<code>"+html.escape(x)+"</code>" for x in reused)}</p>'
        if r['note']: meta += f'<p class="note">{html.escape(r["note"])}</p>'
        items.append(f'<article class="m {r["status"]}" data-status="{r["status"]}"><header><h3>{html.escape(r["moment"])}</h3><span class="st {r["status"]}">{S[r["status"]]}</span></header>{meta}'
                     + (f'<div class="clips">{clips}</div>' if clips else '') + '</article>')
    out.append(f'<section><h2>{html.escape(scr)}</h2><div class="list">{"".join(items)}</div></section>')
nclips = len([k for k in files if k.startswith('v/')])
page = f'''<title>Curate 262 Motion Library</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">
<style>
/* Layout: one reading column of moments grouped by screen; each moment carries its phone-shaped clips in a wrapping row. */
:root {{
  --bg:#F6F7F7; --surface:#FFFFFF; --ink:#141516; --muted:#6A6F73; --line:#E3E6E8; --accent:#141516;
  --app:#1F7A55; --probe:#5B5BD6; --no:#A3A8AC; --pending:#C27C1A;
  --display:"Geist",ui-sans-serif,system-ui,-apple-system,sans-serif; --body:"Geist",ui-sans-serif,system-ui,-apple-system,sans-serif; --mono:"Geist Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --bg:#0F1011; --surface:#181A1B; --ink:#EDEFF0; --muted:#9AA0A4; --line:#2A2D2F; --accent:#EDEFF0; --app:#4CC28E; --probe:#9C9CFF; --no:#6A6F73; --pending:#E3A54A; color-scheme:dark }} }}
:root[data-theme="dark"] {{ --bg:#0F1011; --surface:#181A1B; --ink:#EDEFF0; --muted:#9AA0A4; --line:#2A2D2F; --accent:#EDEFF0; --app:#4CC28E; --probe:#9C9CFF; --no:#6A6F73; --pending:#E3A54A; color-scheme:dark }}
body {{ background:var(--bg); color:var(--ink); font:15px/1.5 var(--body); padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); padding-block:20px 48px }}
.wrap {{ max-width:1080px; margin:0 auto; display:flex; flex-direction:column; gap:28px }}
h1 {{ font:600 clamp(26px,5vw,38px)/1.1 var(--display); letter-spacing:-.02em; margin:0; text-wrap:balance }}
.lede {{ color:var(--muted); max-width:62ch; margin:8px 0 0 }}
.summary {{ display:flex; flex-direction:column; gap:10px }}
.bar {{ display:flex; height:10px; border-radius:5px; overflow:hidden; gap:2px }}
.seg.app{{background:var(--app)}} .seg.probe{{background:var(--probe)}} .seg.no{{background:var(--no)}} .seg.pending{{background:var(--pending)}}
.legend {{ display:flex; flex-wrap:wrap; gap:8px }}
.legend button {{ font:500 13px var(--body); color:var(--ink); background:var(--surface); border:1px solid var(--line); border-radius:999px; padding:6px 12px; cursor:pointer; display:flex; gap:8px; align-items:center }}
.legend button[aria-pressed="true"] {{ border-color:var(--ink) }}
.legend button:focus-visible {{ outline:2px solid var(--ink); outline-offset:2px }}
.dot {{ width:8px; height:8px; border-radius:50% }} .num {{ font-variant-numeric:tabular-nums; color:var(--muted) }}
section h2 {{ font:600 13px var(--mono); text-transform:uppercase; letter-spacing:.08em; color:var(--muted); margin:0 0 10px; padding-bottom:8px; border-bottom:1px solid var(--line) }}
.list {{ display:flex; flex-direction:column; gap:12px }}
.m {{ background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:14px; display:flex; flex-direction:column; gap:6px; min-width:0 }}
.m.no, .m.pending {{ background:transparent }}
.m header {{ display:flex; justify-content:space-between; align-items:baseline; gap:12px; flex-wrap:wrap }}
.m h3 {{ font:500 15px var(--mono); margin:0; overflow-wrap:anywhere }}
.st {{ font:500 12px var(--body); white-space:nowrap }} .st.app{{color:var(--app)}} .st.probe{{color:var(--probe)}} .st.no{{color:var(--muted)}} .st.pending{{color:var(--pending)}}
.m p {{ margin:0; min-width:0 }} .what {{ max-width:70ch }}
.code code, .also code, figcaption code {{ font:12px var(--mono); color:var(--muted); overflow-wrap:anywhere }}
.note {{ font-size:13px; color:var(--muted) }} .also {{ font-size:13px; color:var(--muted) }}
.clips {{ display:flex; flex-wrap:wrap; gap:12px; margin-top:6px }}
.clip {{ margin:0; width:150px; max-width:100%; display:flex; flex-direction:column; gap:6px }}
.clip video {{ width:100%; aspect-ratio:1320/2868; max-width:100%; border-radius:16px; background:var(--line); display:block; cursor:pointer }}
figcaption {{ display:flex; flex-wrap:wrap; gap:4px 6px; align-items:center }}
.badge {{ font:500 11px var(--body); padding:1px 7px; border-radius:999px; color:var(--surface) }} .badge.app{{background:var(--app)}} .badge.probe{{background:var(--probe)}}
.dur {{ font:12px var(--mono); color:var(--muted); font-variant-numeric:tabular-nums }}
footer {{ color:var(--muted); font-size:13px; max-width:70ch }}
</style>
<div class="wrap">
  <div>
    <h1>Every animation in Curate 1.5.0 (262)</h1>
    <p class="lede">The app's real motion, recorded on Emma's account as footage clips for the ads. Each moment names the code that draws it and the draft clips in the curate-motion library. Probe clips run the app's own screens with Emma's selfie, photos and wardrobe swapped in.</p>
  </div>
  <div class="summary">
    <div class="bar" aria-hidden="true">{bar}</div>
    <div class="legend" role="group" aria-label="Filter by status">
      <button id="f-all" data-f="all" aria-pressed="true">All <span class="num">{tot}</span></button>
      <button id="f-app" data-f="app" aria-pressed="false"><span class="dot" style="background:var(--app)"></span>Her account <span class="num">{c['app']}</span></button>
      <button id="f-probe" data-f="probe" aria-pressed="false"><span class="dot" style="background:var(--probe)"></span>Probe <span class="num">{c['probe']}</span></button>
      <button id="f-pending" data-f="pending" aria-pressed="false"><span class="dot" style="background:var(--pending)"></span>Not yet <span class="num">{c['pending']}</span></button>
      <button id="f-no" data-f="no" aria-pressed="false"><span class="dot" style="background:var(--no)"></span>Not possible <span class="num">{c['no']}</span></button>
    </div>
    <p class="num" style="margin:0">{nclips} clips · previews at 300 px, 30 fps · masters are 1320×2868, 60 fps in the library</p>
  </div>
  {"".join(out)}
  <footer>Clip ids are <code>footage.emma.&lt;moment&gt;.v&lt;n&gt;</code>, all drafts with the Curate licence, tagged appBuild 262, persona emma, source app or probe. Tap a clip to play or pause it.</footer>
</div>
<script>
(function () {{
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vids = [].slice.call(document.querySelectorAll('video[data-src]'));
  function load(v) {{ if (!v.src) {{ v.src = v.getAttribute('data-src'); }} }}
  function play(v) {{ load(v); var p = v.play(); if (p && p.catch) p.catch(function () {{}}); }}
  vids.forEach(function (v) {{ v.addEventListener('click', function () {{ if (v.paused) play(v); else v.pause(); }}); }});
  if (!reduce && 'IntersectionObserver' in window) {{
    var io = new IntersectionObserver(function (es) {{ es.forEach(function (e) {{ if (e.isIntersecting) play(e.target); else e.target.pause(); }}); }}, {{ rootMargin: '100px' }});
    vids.forEach(function (v) {{ io.observe(v); }});
  }}
  var btns = [].slice.call(document.querySelectorAll('.legend button'));
  btns.forEach(function (b) {{ b.addEventListener('click', function () {{
    var f = b.getAttribute('data-f');
    btns.forEach(function (x) {{ x.setAttribute('aria-pressed', String(x === b)); }});
    document.querySelectorAll('.m').forEach(function (m) {{ m.hidden = !(f === 'all' || m.getAttribute('data-status') === f); }});
    document.querySelectorAll('section').forEach(function (s) {{ s.hidden = !s.querySelector('.m:not([hidden])'); }});
  }}); }});
}})();
</script>
'''
open(f'{A}/index.html', 'w').write(page)
json.dump(files, open(f'{A}/files.json', 'w'))
tot_bytes = sum(os.path.getsize(p) for p in files.values()) + os.path.getsize(f'{A}/index.html')
print(nclips, 'clips', round(tot_bytes / 1e6, 1), 'MB')
