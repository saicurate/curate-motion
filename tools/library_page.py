"""Build the phone-viewable "Curate Motion Library" page from catalog/index.json.

Usage: python3 tools/library_page.py <out-dir>
Writes <out-dir>/index.html with small previews in <out-dir>/m/; inline them into one file
(library.html) and publish it as the Claude artifact https://claude.ai/artifact/Xw757vMGZsKvG6JNutUYhZ.
Never commit the output: it is media.
"""
import json, os, subprocess, html, sys
from PIL import Image
ROOT="/Users/saikumar/Desktop/Curate/curate-motion"
OUT=sys.argv[1]; os.makedirs(OUT+"/m",exist_ok=True)
idx=json.load(open(ROOT+"/catalog/index.json")); A=idx["assets"]
def local(p): 
    q=os.path.join(ROOT,"library",p)
    return q if os.path.exists(q) else None
def pick(a,roles):
    for r in roles:
        for f in a.get("files",[]):
            if f.get("role")==r and local(f["path"]): return local(f["path"])
    return None
def img(a,src,w=360):
    n="m/"+a["id"].replace(".","_")+".jpg"; dst=os.path.join(OUT,n)
    if not os.path.exists(dst):
        im=Image.open(src)
        if im.mode in ("RGBA","LA","P"):
            im=im.convert("RGBA"); bg=Image.new("RGBA",im.size,(240,241,242,255)); bg.alpha_composite(im); im=bg
        im=im.convert("RGB"); im.thumbnail((w,int(w*4/3))); im.save(dst,quality=76)
    return n
def vid(a,src):
    n="m/"+a["id"].replace(".","_")+".mp4"; dst=os.path.join(OUT,n)
    if not os.path.exists(dst):
        subprocess.run(["ffmpeg","-v","error","-y","-i",src,"-t","10","-vf","scale=200:-2,fps=24","-c:v","libx264","-crf","33","-preset","veryfast","-an","-movflags","+faststart",dst],check=False)
    p="m/"+a["id"].replace(".","_")+"_p.jpg"; pd=os.path.join(OUT,p)
    if not os.path.exists(pd):
        subprocess.run(["ffmpeg","-v","error","-y","-ss","1","-i",src,"-frames:v","1","-vf","scale=200:-2",pd],check=False)
    return n,(p if os.path.exists(pd) else "")
def aud(a,src):
    n="m/"+a["id"].replace(".","_")+".mp3"; dst=os.path.join(OUT,n)
    if not os.path.exists(dst):
        subprocess.run(["ffmpeg","-v","error","-y","-i",src,"-t","40","-ac","1","-b:a","64k",dst],check=False)
    return n
def tag(a,k):
    for t in a.get("tags",[]):
        if t.startswith(k+":"): return t.split(":",1)[1]
    return ""
groups=[("Emma",["face","selfie","tryon"]),("Wardrobe",["garment"]),("Camera roll",["photo"]),("Everyday photos",["stock"]),
        ("Zee",["zee"]),("App animations",["footage"]),("Music",["music"]),("Brand",["brand","font"]),("References",["reference"])]
order={k:i for i,(g,ks) in enumerate(groups) for k in ks}
H=['''<title>Curate Motion Library</title><style>
:root{--g:#F5F6F6;--ink:#17181A;--t2:#6B7078;--t3:#9AA0A8;--card:#fff;--line:#E6E8EB;--ok:#3E8E63;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--g:#111214;--ink:#EDEEF0;--t2:#A3A8B0;--t3:#7A7F87;--card:#1A1B1E;--line:#2A2C30;--ok:#6CC08F;color-scheme:dark}}
:root[data-theme="dark"]{--g:#111214;--ink:#EDEEF0;--t2:#A3A8B0;--t3:#7A7F87;--card:#1A1B1E;--line:#2A2C30;--ok:#6CC08F;color-scheme:dark}
body{background:var(--g);color:var(--ink);font-family:-apple-system,system-ui,sans-serif}
.w{max-width:1240px;margin:0 auto;padding-block:24px 60px;padding-inline:16px}
h1{font-size:26px;margin:0 0 6px;font-weight:650}h2{font-size:18px;margin:34px 0 4px;font-weight:650}
p.l{color:var(--t2);margin:0 0 14px;font-size:15px;max-width:68ch;line-height:1.45}
nav{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 4px}nav a{font-size:13px;padding:6px 11px;border:1px solid var(--line);border-radius:99px;color:var(--ink);text-decoration:none;background:var(--card)}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:10px}
.c{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column}
.c img,.c video{width:100%;aspect-ratio:3/4;object-fit:cover;display:block;background:var(--line)}
.c.v img,.c.v video{aspect-ratio:9/19.5;object-fit:cover}
.b{padding:8px 10px 10px;display:flex;flex-direction:column;gap:3px}
.t{font-size:12.5px;line-height:1.3}.id{font-size:10.5px;color:var(--t3);word-break:break-all;font-family:ui-monospace,Menlo,monospace}
.s{font-size:10.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--t2)}.s.approved{color:var(--ok)}
.m{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:6px}
audio{width:100%}.mg{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-top:10px}
.cnt{font-size:13px;color:var(--t2);font-weight:400;margin-left:6px}
</style><div class="w"><h1>Curate Motion library</h1>''']
by={}
for a in A: by.setdefault(a["kind"],[]).append(a)
counts=" · ".join(f"{g} {sum(len(by.get(k,[])) for k in ks)}" for g,ks in groups if sum(len(by.get(k,[])) for k in ks))
H.append(f'<p class="l">Every asset in the curate-motion library ({len(A)} in all): made once, reused for every ad. Each card shows its name, its library id (what agents use), and whether it is approved. App animations are short previews of the real recordings from Emma\'s account.</p><p class="l">{html.escape(counts)}</p><nav>'+"".join(f'<a href="#{g.lower().replace(" ","-")}">{g}</a>' for g,ks in groups if any(by.get(k) for k in ks))+"</nav>")
for g,ks in groups:
    items=[a for k in ks for a in sorted(by.get(k,[]),key=lambda x:x["id"])]
    if not items: continue
    H.append(f'<h2 id="{g.lower().replace(" ","-")}">{g}<span class="cnt">{len(items)}</span></h2>')
    if g=="Music":
        H.append('<div class="mg">')
        for a in items:
            src=pick(a,["original","preview"]); n=aud(a,src) if src else ""
            bpm=tag(a,"bpm")
            H.append(f'<div class="m"><div class="t">{html.escape(a.get("title",a["id"]))}</div><div class="id">{a["id"]}</div>{f"<div class=s>{bpm} bpm</div>" if bpm else ""}{f"<audio controls preload=none src={n!r}></audio>" if n else ""}</div>')
        H.append('</div>'); continue
    H.append('<div class="g">')
    for a in items:
        st=a.get("status","draft"); title=html.escape(a.get("title") or a["id"])
        if a["kind"]=="footage":
            src=pick(a,["original","preview"])
            if not src: continue
            n,p=vid(a,src)
            media=f'<video src="{n}" poster="{p}" muted playsinline loop preload="none" controls></video>'; cls="c v"
        else:
            src=pick(a,["thumb","cutout","original","poster","still"])
            if not src or not src.lower().endswith((".jpg",".jpeg",".png",".webp")): 
                media='<img alt="">'; 
            else: media=f'<img src="{img(a,src)}" alt="" loading="lazy">'
            cls="c"
        H.append(f'<div class="{cls}">{media}<div class="b"><div class="t">{title}</div><div class="id">{a["id"]}</div><div class="s {st}">{st}</div></div></div>')
    H.append('</div>')
H.append('</div>')
open(OUT+"/index.html","w").write("\n".join(H))
files=sorted(os.listdir(OUT+"/m")); json.dump([{"path":"m/"+f} for f in files],open(OUT+"/files.json","w"))
print(len(files),"media files")
