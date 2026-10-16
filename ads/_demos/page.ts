#!/usr/bin/env node
// The founder's phone page for the concept animatics: one card per demo (phone-sized video, tap to
// play with sound, one at a time; the style of tools/review-page/ads-phone.html), from concepts.ts.
//   node ads/_demos/page.ts <out-dir>     writes <out-dir>/index.html; videos + posters go in <out-dir>/v/
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEMOS } from "./concepts.ts";

const outDir = process.argv[2];
if (!outDir) throw new Error("usage: node ads/_demos/page.ts <out-dir>");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const li = (xs: string[]) => `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
const PICKS = new Set([3, 2]);

const card = (c: (typeof DEMOS)[number]) => `
  <section class="demo" id="demo-${c.n}" aria-labelledby="h-${c.n}">
    <div class="ad">
      <div class="phone"><video src="v/demo-${c.n}-${c.slug}-v1.mp4" poster="v/demo-${c.n}-${c.slug}-v1.jpg" playsinline preload="metadata"></video><button class="tap" aria-label="Play demo ${c.n}"><span>▶</span></button></div>
      <div class="meta"><b><span class="len${PICKS.has(c.n) ? " pick" : ""}">${PICKS.has(c.n) ? "top pick · " : ""}${c.lengthSec} s</span></b><i>Temp music: ${esc(c.trackNote)}</i></div>
    </div>
    <div class="diff">
      <h2 id="h-${c.n}">${c.n} · ${esc(c.title)}</h2>
      <p class="hook"><span class="k">Hook, first second</span>${esc(c.hook)}</p>
      <p class="sub">Story, beat by beat</p>${li(c.story)}
      <p class="sub">Transitions</p>${li(c.transitions)}
      <div class="split">
        <div><p class="sub">AI video later</p>${li(c.aiVideo)}</div>
        <div><p class="sub">Code motion</p>${li(c.code)}</div>
        <div><p class="sub">Real app</p>${li(c.appFootage)}</div>
      </div>
      <p class="sub">Music direction</p><p class="p">${esc(c.music)}</p>
      <p class="sub">Why it stops the scroll</p><p class="p">${esc(c.why)}</p>
    </div>
  </section>`;

const html = `<title>Curate Concept Demos</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Layout: one column of concepts; each is a ~330 px phone beside its notes, stacking on a phone. Tokens copied from tools/review-page/ads-phone.html. */
:root{--g:#F2F3F3;--ink:#17181A;--t2:#6B7078;--t3:#9AA0A8;--bezel:#17181A;--card:#FFFFFF;--line:#E3E5E8;--warn:#8A5A00;--warnbg:#FFF4D6;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--g:#0E0F10;--ink:#EDEEF0;--t2:#A3A8B0;--t3:#7A7F87;--bezel:#2A2C30;--card:#18191C;--line:#2A2C30;--warn:#F2C46B;--warnbg:#2B2416;color-scheme:dark}}
:root[data-theme="dark"]{--g:#0E0F10;--ink:#EDEEF0;--t2:#A3A8B0;--t3:#7A7F87;--bezel:#2A2C30;--card:#18191C;--line:#2A2C30;--warn:#F2C46B;--warnbg:#2B2416;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--g);color:var(--ink);font-family:-apple-system,"SF Pro Text",system-ui,sans-serif}
.w{max-width:1240px;margin:0 auto;padding-block:28px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
h1{font-size:26px;font-weight:650;margin:0 0 6px;letter-spacing:-.01em;text-wrap:balance}
.lede{color:var(--t2);font-size:15px;line-height:1.45;margin:0 0 6px;max-width:66ch}
h2{font-size:20px;font-weight:650;margin:0 0 10px;text-wrap:balance}
.demo{display:flex;flex-wrap:wrap;gap:24px 32px;align-items:flex-start;padding-block:32px;border-top:1px solid var(--line)}
.demo:first-of-type{border-top:0}
.ad{width:min(330px,100%);display:flex;flex-direction:column;gap:10px}
.phone{position:relative;width:100%;border-radius:44px;padding:9px;background:var(--bezel);box-shadow:0 20px 50px rgba(0,0,0,.18)}
.phone video{display:block;width:100%;max-width:100%;border-radius:36px;background:#000;aspect-ratio:9/16;object-fit:cover}
.tap{position:absolute;inset:9px;border-radius:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:transparent;border:0;color:#fff}
.tap:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
.tap span{width:64px;height:64px;border-radius:50%;background:rgba(0,0,0,.45);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;font-size:24px;padding-left:4px}
.playing .tap{display:none}
.meta{display:flex;flex-direction:column;gap:4px;padding-inline:4px}
.meta i{font-style:normal;font-size:13px;color:var(--t2);line-height:1.4}
.len{display:inline-block;font-size:11.5px;font-weight:600;letter-spacing:.04em;color:var(--t2);border:1px solid var(--line);border-radius:99px;padding:2px 9px}
.pick{color:var(--ink);border-color:var(--ink)}
.diff{flex:1 1 360px;min-width:0;max-width:70ch}
.sub{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--t3);margin:18px 0 8px}
.diff ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:14px;line-height:1.5;color:var(--t2)}
.p{margin:0;font-size:14px;line-height:1.5;color:var(--t2)}
.hook{margin:0;font-size:16px;line-height:1.45;color:var(--ink);font-weight:550}
.hook .k,.box .k{display:block;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--t3);margin-bottom:4px}
.split{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0 20px}
.split>div{min-width:0}
.box{margin-top:28px;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px 18px;font-size:14px;line-height:1.5;color:var(--t2)}
.box b{color:var(--ink)}
.box h2{font-size:17px}
.tbl{overflow-x:auto}
table{border-collapse:collapse;width:100%;min-width:520px;font-size:13.5px}
th,td{text-align:left;padding:8px 10px;border-top:1px solid var(--line);vertical-align:top}
th{font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--t3);border-top:0}
td b{font-variant-numeric:tabular-nums}
.warn{background:var(--warnbg);color:var(--warn);border-radius:10px;padding:8px 12px;margin-top:10px}
.picks{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px 24px}
@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
</style>
<div class="w">
  <h1>Six hook-first concepts, as rough demos</h1>
  <p class="lede">You asked for the idea, the hook, the story and the transitions before any polish. Each demo is 11–12 s and rough on purpose. The labels in the corner name each beat and transition. Grey boxes marked "AI video shot later" stand in for real-world shots we would generate. Everything else is your real library: Emma's pieces and photos, Zee, the app's looks and footage. Tap a video to play it with sound. Only one plays at a time.</p>

  <div class="box">
    <h2>Top picks</h2>
    <div class="picks">
      <p class="p"><b>3 · Zee the critic.</b> It is the only one built on a character. A cat-reaction meme is a format people already share, and only Curate has Zee. It is funny before it is an ad, and the payoff is the real Date night look from the app.</p>
      <p class="p"><b>2 · Your camera roll is secretly a closet.</b> The hook line reframes something every viewer owns. The freeze is a pattern-break caused by the scroll itself, and it is the one idea that explains how the product works in under 10 s.</p>
    </div>
    <p class="p" style="margin-top:8px">Next best: 5 (the outfit-change trend), but it needs the most AI video to work, because every change has to show her wearing the look.</p>
  </div>
${DEMOS.map(card).join("\n")}

  <div class="box" id="paid">
    <h2>Paid options (prepared, nothing run)</h2>
    <p class="p">Prices checked on 16 Oct 2026. Nothing below is spent without your OK.</p>
    <div class="tbl"><table>
      <thead><tr><th>For</th><th>Option</th><th>About</th><th>Licence notes</th></tr></thead>
      <tbody>
        <tr><td>Real-world shots (the grey boxes)</td><td>Kling v3 (fal.ai)</td><td><b>$0.42–0.84</b> per 5 s clip</td><td>Standard to Pro, with or without audio. Good image-to-video from her photos.</td></tr>
        <tr><td></td><td>Google Veo 3.1</td><td><b>$0.50–0.60</b> per 5 s (Fast) · <b>$2.00</b> (Standard)</td><td>Gemini API, per second. Lite is $0.25–0.40.</td></tr>
        <tr><td></td><td>Seedance 2.0 (fal.ai)</td><td><b>about $1.52</b> per 5 s at 720p</td><td>1.0 Pro at 1080p is about $0.62.</td></tr>
        <tr><td></td><td>A whole concept</td><td><b>about $5–15</b></td><td>2–4 shots, about 3 takes each, at Kling or Veo Fast prices. Concept 4 needs none.</td></tr>
        <tr><td>Music made for the ad</td><td>ElevenLabs Music API (<code>POST /v1/music</code>)</td><td><b>$0.15</b> a minute (API rate) · about <b>$0.03</b> of the Starter plan's credits per 15 s track</td><td>Our Starter key can call it, and commercial online use is allowed. But Starter is "individual use only": a company needs the Scale plan ($299/mo). Check this before we ship a track made on Starter.</td></tr>
        <tr><td></td><td>Suno Pro</td><td><b>about $10</b>/mo</td><td>Paid plans include commercial rights; the free plan has none.</td></tr>
        <tr><td>A licensed music library</td><td>Epidemic Sound Pro</td><td><b>about $17–40</b>/mo ($204/yr)</td><td>Pro covers ad campaigns.</td></tr>
        <tr><td></td><td>Artlist Music Pro</td><td><b>about $199</b>/yr ($299 with SFX)</td><td>Pro covers paid ads, for companies up to 50 people.</td></tr>
        <tr><td>The temp tracks used here</td><td>Incompetech Standard licence</td><td><b>$30</b> a track, one-off</td><td>Free under CC BY 4.0 with a credit line; $30 removes the credit for paid ads.</td></tr>
      </tbody>
    </table></div>
    <p class="warn"><b>Check before concept 4 goes further:</b> the line says "49 pieces in 3 minutes", but the recorded scan took about 6 minutes to reach 40 pieces. The real ad must use the real time.</p>
  </div>

  <div class="box">
    <h2>About the temp music</h2>
    <p class="p">The Mixkit tracks are out. Each demo now uses a free Kevin MacLeod track from Incompetech, picked for its concept and cut to the beats: Voxel Revolution, Kick Shock, Sneaky Snitch, Laserpack, Overcast and Chill Wave. They are CC BY 4.0, so each needs a credit line, or $30 for the no-credit licence. They are still library music: judge the ideas, not the tracks. Pixabay has closer fits (a phonk reel, a ticking 138 bpm track, a minimal lofi beat) without Content ID claims, but they have to be downloaded by hand. Uppbeat's free tier does not allow paid ads. For the real ads, the best sound is a track made for the edit (ElevenLabs Music) or a licensed trend-style track (Epidemic or Artlist).</p>
  </div>
</div>
<script>
const vids=[...document.querySelectorAll(".phone video")];
document.querySelectorAll(".phone").forEach(p=>{
  const v=p.querySelector("video"),b=p.querySelector(".tap");
  const go=()=>{vids.forEach(o=>{if(o!==v){o.pause();o.closest(".phone").classList.remove("playing")}});v.muted=false;v.controls=true;v.play().catch(()=>{v.muted=true;v.play()});p.classList.add("playing")};
  b.addEventListener("click",go);
  v.addEventListener("ended",()=>{p.classList.remove("playing");v.controls=false});
});
</script>
`;
writeFileSync(join(outDir, "index.html"), html);
console.log(`wrote ${join(outDir, "index.html")}`);
