import json, base64, io, html
from PIL import Image
D='/private/tmp/claude-501/-Users-saikumar-Desktop-Curate-curate-app/8dfb7189-122d-440a-a9c0-c4ad2cfe63b8/scratchpad/ss'
sp=json.load(open(f'{D}/spec.json'))
def thumb(n):
    im=Image.open(f'{D}/raw/{n}.png').convert('RGB').resize((480,1043),Image.LANCZOS)
    b=io.BytesIO(); im.save(b,'JPEG',quality=72,optimize=True,progressive=True); return base64.b64encode(b.getvalue()).decode()
secs=[]
for e in sp:
    if not secs or secs[-1][0]!=e['section']: secs.append((e['section'],[]))
    secs[-1][1].append(e)
real=sum(e['origin']=='app' for e in sp); probe=len(sp)-real; hero=sum(e['hero'] for e in sp)
H=[]
H.append('''<title>Emma's App Screens</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">
<style>
/* Layout: a contact sheet. One sticky filter row, then each part of the app as a run of phone-ratio frames. */
:root{
  --ground:#F6F7F7; --sheet:#FFFFFF; --ink:#181818; --ink-2:#656565; --ink-3:#8B8B8B; --rule:#DDDDDD; --chip:#EBEBEB;
  --display:"Geist",-apple-system,"Helvetica Neue",Arial,sans-serif; --body:"Geist",-apple-system,"Helvetica Neue",Arial,sans-serif;
  --mono:"Geist Mono",ui-monospace,Menlo,monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--ground:#121313;--sheet:#1B1C1C;--ink:#F2F2F2;--ink-2:#B3B3B3;--ink-3:#8B8B8B;--rule:#2E2F2F;--chip:#262727;color-scheme:dark}}
:root[data-theme="dark"]{--ground:#121313;--sheet:#1B1C1C;--ink:#F2F2F2;--ink-2:#B3B3B3;--ink-3:#8B8B8B;--rule:#2E2F2F;--chip:#262727;color-scheme:dark}
body{background:var(--ground);color:var(--ink);font-family:var(--body);font-size:15px;line-height:1.45}
.wrap{max-width:1180px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:28px 64px}
h1{font-family:var(--display);font-weight:500;font-size:clamp(28px,6vw,44px);letter-spacing:-.02em;margin:0;text-wrap:balance}
.lede{color:var(--ink-2);max-width:62ch;margin:10px 0 0}
.lede b{color:var(--ink);font-weight:500}
.facts{display:flex;flex-wrap:wrap;gap:8px 22px;margin:18px 0 0;font-family:var(--mono);font-size:12.5px;color:var(--ink-2);font-variant-numeric:tabular-nums}
.facts span b{color:var(--ink);font-weight:500}
.bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--ground);margin:22px 0 0;padding-block:10px;border-bottom:1px solid var(--rule);display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.bar button{font:500 13px var(--body);color:var(--ink);background:var(--sheet);border:1px solid var(--rule);border-radius:99px;padding:7px 13px;cursor:pointer}
.bar button[aria-pressed="true"]{background:var(--ink);color:var(--ground);border-color:var(--ink)}
.bar button:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.bar .n{margin-left:auto;font:12px var(--mono);color:var(--ink-3)}
nav.toc{display:flex;flex-wrap:wrap;gap:6px 14px;margin:14px 0 0;font-size:13px}
nav.toc a{color:var(--ink-2);text-decoration:none;border-bottom:1px solid var(--rule)}
section{margin-top:34px}
h2{font-family:var(--display);font-weight:500;font-size:20px;letter-spacing:-.01em;margin:0 0 12px;display:flex;gap:10px;align-items:baseline}
h2 small{font:12px var(--mono);color:var(--ink-3)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:18px 14px}
figure{margin:0;display:flex;flex-direction:column;gap:7px;min-width:0}
figure button{all:unset;cursor:zoom-in;display:block;border-radius:18px;overflow:hidden;background:var(--sheet);box-shadow:0 0 0 1px var(--rule)}
figure button:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
figure img{display:block;width:100%;max-width:100%;aspect-ratio:1320/2868;object-fit:cover}
figcaption{font-size:12.5px;line-height:1.35;color:var(--ink);min-width:0}
.id{display:block;font:10.5px var(--mono);color:var(--ink-3);word-break:break-all;margin-top:3px}
.tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}
.tag{font:500 10px var(--body);letter-spacing:.06em;text-transform:uppercase;padding:2px 6px;border-radius:5px;background:var(--chip);color:var(--ink-2)}
.tag.hero{background:var(--ink);color:var(--ground)}
.notes{margin-top:44px;border-top:1px solid var(--rule);padding-top:18px;color:var(--ink-2);max-width:70ch;font-size:14px}
.notes h3{font-weight:500;color:var(--ink);font-size:15px;margin:0 0 6px}
.notes ul{margin:0;padding-left:18px;display:grid;gap:4px}
dialog{border:0;padding:0;background:transparent;max-width:min(92vw,460px);max-height:94vh}
dialog::backdrop{background:rgba(0,0,0,.72)}
dialog img{display:block;max-width:100%;max-height:86vh;width:auto;border-radius:22px;margin:0 auto}
dialog p{color:#fff;font-size:13px;text-align:center;margin:10px 0 0}
dialog p span{display:block;font:11px var(--mono);opacity:.7}
@media (prefers-reduced-motion:no-preference){figure button{transition:transform .2s}figure button:hover{transform:translateY(-2px)}}
</style>
<div class="wrap">
<h1>Emma's app screens</h1>
<p class="lede">Every screen and state of <b>Curate 1.5.0 (build 262)</b>, from the marketing persona Emma's real account: 49 pieces, the Mist chat, Zee. Full-size PNGs are in the curate-motion library as <b>screenshot</b> assets, all drafts. Tap any frame to see it larger.</p>
''')
H.append(f'<div class="facts"><span><b>{len(sp)}</b> screens</span><span><b>{real}</b> from her phone</span><span><b>{probe}</b> through a probe</span><span><b>{hero}</b> heroes, each also 1290×2796 for the App Store</span><span>native <b>1320×2868</b></span><span>status bar <b>9:41</b></span></div>')
H.append('<div class="bar" role="toolbar" aria-label="Filter"><button id="f-all" aria-pressed="true" data-f="all">All</button><button id="f-hero" aria-pressed="false" data-f="hero">Heroes</button><button id="f-app" aria-pressed="false" data-f="app">Her phone</button><button id="f-probe" aria-pressed="false" data-f="probe">Probe</button><span class="n" id="count"></span></div>')
H.append('<nav class="toc">'+''.join(f'<a href="#s{i}">{html.escape(t)}</a>' for i,(t,_) in enumerate(secs))+'</nav>')
for i,(t,items) in enumerate(secs):
    H.append(f'<section id="s{i}"><h2>{html.escape(t)} <small>{len(items)}</small></h2><div class="grid">')
    for e in items:
        aid=f"screenshot.emma.{e['name']}.v1"
        tags=''.join(['<span class="tag hero">Hero</span>' if e['hero'] else '', '<span class="tag">Probe</span>' if e['origin']=='probe' else '', '<span class="tag">Frame</span>' if e['capture']=='frame' else ''])
        H.append(f'<figure data-o="{e["origin"]}" data-h="{int(e["hero"])}"><button type="button" aria-label="Open {html.escape(e["label"])}"><img alt="{html.escape(e["label"])}" loading="lazy" src="data:image/jpeg;base64,{thumb(e["raw"])}"></button><figcaption>{html.escape(e["label"])}<span class="id">{aid}</span>{f"<span class=tags>{tags}</span>" if tags else ""}</figcaption></figure>')
    H.append('</div></section>')
H.append('''<div class="notes"><h3>How these were made</h3><ul>
<li><b>Her phone</b>: screenshots on her simulator, or exact frames of the native-resolution recordings already in the library (each frame names its footage id and second).</li>
<li><b>Probe</b>: states her account can't reach (the selfie camera, Photos off, Zee's moments, the ready pill, the notification ask, the blocking update) come from build 262's dev probes on a separate simulator, with her real selfie, photos and pieces swapped in.</li>
<li>Left out on purpose: the budget step and the style-preferences budget row (prices), Saved items (mentions the Shop), the Settings footer (a buying tagline), Zee's peek and empty-wardrobe probes (they draw the old Home and Community tab bar), the probe's "Come closer" hint (the stand-in photo's edge shows), and the update sheet (its probe draws over the hidden Home feed).</li>
<li>Three chat frames had a charging battery in the take; only the battery glyph was swapped for the plain one.</li>
</ul></div></div>
<dialog id="lb"><img id="lbimg" alt=""><p id="lbcap"></p></dialog>
<script>
const figs=[...document.querySelectorAll('figure')],count=document.getElementById('count');
function apply(f){let n=0;figs.forEach(x=>{const ok=f==='all'||(f==='hero'&&x.dataset.h==='1')||x.dataset.o===f;x.hidden=!ok;if(ok)n++});
document.querySelectorAll('section').forEach(s=>{s.hidden=!s.querySelector('figure:not([hidden])')});count.textContent=n+' shown';
document.querySelectorAll('.bar button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.f===f)));try{localStorage.setItem('f',f)}catch(e){}}
document.querySelectorAll('.bar button').forEach(b=>b.addEventListener('click',()=>apply(b.dataset.f)));
let f='all';try{f=localStorage.getItem('f')||'all'}catch(e){}apply(f);
const lb=document.getElementById('lb');
figs.forEach(x=>x.querySelector('button').addEventListener('click',()=>{const i=x.querySelector('img');document.getElementById('lbimg').src=i.src;
document.getElementById('lbcap').innerHTML='';const c=document.getElementById('lbcap');c.textContent=i.alt;const s=document.createElement('span');s.textContent=x.querySelector('.id').textContent;c.appendChild(s);lb.showModal()}));
lb.addEventListener('click',()=>lb.close());
</script>''')
open(f'{D}/emma-screens.html','w').write('\n'.join(H))
import os; print(os.path.getsize(f'{D}/emma-screens.html')/1e6,'MB')
