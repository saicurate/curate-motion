#!/usr/bin/env node
// Builds the Framer code component from the prototype, so the motion stays in one place.
//   node web/landing/build-framer.mjs
// In:  web/landing/prototype/curate-one-day.html  (the scroll story, as approved)
//      web/landing/framer/qr.svg                   (QR to curatefashions.com; replace via the component's QR image slot)
// Out: web/landing/framer/CurateOneDay.tsx         (paste into Framer: Assets > Code > New file, or install over MCP)
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const html = readFileSync(join(here, "prototype/curate-one-day.html"), "utf8")
const qr = readFileSync(join(here, "framer/qr.svg"), "utf8").replace(/<\?xml[^>]*>/, "").replace(/<!DOCTYPE[^>]*>/, "").trim()

const take = (re, what) => { const m = html.match(re); if (!m) throw new Error(`prototype: no ${what}`); return m[1] }

// ---------- CSS: scope every rule to the component ----------
const css = take(/<style>([\s\S]*?)<\/style>/, "style block")
function scopeSelector(sel) {
  return sel.split(",").map((s) => {
    s = s.trim()
    if (!s) return s
    if (s === ":root" || s === "html" || s === "body") return ".cod"
    if (s === "*") return ".cod *"
    if (/^(html|body)\b/.test(s)) return s.replace(/^(html|body)/, ".cod")
    return `.cod ${s}`
  }).join(",")
}
function scopeCss(src) {
  let out = "", i = 0
  while (i < src.length) {
    const open = src.indexOf("{", i)
    if (open < 0) { out += src.slice(i); break }
    const head = src.slice(i, open)
    // find the matching close brace
    let depth = 1, j = open + 1
    while (j < src.length && depth) { if (src[j] === "{") depth++; else if (src[j] === "}") depth--; j++ }
    const body = src.slice(open + 1, j - 1)
    const lead = head.match(/^\s*(\/\*[\s\S]*?\*\/\s*)*/)[0]
    const h = head.slice(lead.length).trim()
    if (h.startsWith("@media")) out += `${lead}${h}{${scopeCss(body)}}`
    else if (h.startsWith("@keyframes")) out += `${lead}${h}{${body}}`
    else out += `${lead}${scopeSelector(h)}{${body}}`
    i = j
  }
  return out
}
const scopedCss = scopeCss(css) + `
/* inside a Framer page */
.cod{position:relative;width:100%;background:var(--bg);color:var(--fg)}
.cod.cod-away .hud,.cod.cod-away .tl,.cod.cod-away .pip,.cod.cod-away #rain,.cod.cod-away .sweep{opacity:0!important;pointer-events:none!important}
.cod .hud,.cod .tl{transition:opacity .4s}
.cod.cod-canvas main>.scene:not(#s1),.cod.cod-canvas .fin{display:none}
.cod.cod-canvas #s1{height:100vh!important}
.cod.cod-canvas .hud,.cod.cod-canvas .tl,.cod.cod-canvas .pip,.cod.cod-canvas #rain,.cod.cod-canvas .sweep{position:absolute}
.cod .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
`

// ---------- markup: everything between the style and the scripts ----------
const afterStyle = html.slice(html.indexOf("</style>") + "</style>".length)
const markup = afterStyle.slice(0, afterStyle.indexOf("<script")).trim()

// ---------- script: the IIFE becomes init(root, P) with a cleanup ----------
let js = take(/<script>\s*\(function\(\)\{([\s\S]*?)\}\)\(\);\s*<\/script>/, "page script")
const swap = (a, b, all = false) => {
  if (!js.includes(a)) throw new Error(`script: expected to find ${a.slice(0, 70)}`)
  js = all ? js.split(a).join(b) : js.replace(a, b)
}
// window listeners are tracked so they can be removed
js = js.replace(/(^|[^.\w])addEventListener\(/g, "$1__on(window,")
// the loop stops on unmount, and does not run on Framer's canvas
swap("requestAnimationFrame(frame);\n}", "if (!__dead) __raf = requestAnimationFrame(frame);\n}")
swap("R.forEach(function(r){ r(0); });\nrequestAnimationFrame(frame);", "R.forEach(function(r){ r(0); });\nif (!P.static) __raf = requestAnimationFrame(frame);")
// CSS variables live on the component, not the document
swap("var rs = document.documentElement.style;", "var rs = root.style;")
// positions on a Framer page: measure against the document, not the offset parent
swap("s.top=s.el.offsetTop;", "s.top=s.el.getBoundingClientRect().top+scrollY;")
swap("scrollTo({top:0, behavior:'smooth'})", "scrollTo({top:SC[0].top, behavior:'smooth'})")
// the fixed bar, Zee and the rain only show while the story is on screen
swap("  var y = scrollY, k = reduce ? 1 : 1-Math.exp(-dt*9);",
  "  var rr = root.getBoundingClientRect(); root.classList.toggle('cod-away', !(rr.top < H*.5 && rr.bottom > H*.5));\n  var y = scrollY, k = reduce ? 1 : 1-Math.exp(-dt*9);")
// QR: a prebuilt SVG, or the image given in Framer
swap(/try \{ new QRCode\([\s\S]*?\} catch\(e\) \{ \$\('qrw'\)\.style\.display='none'; \}/.exec(js)[0],
  "$('qr').innerHTML = P.qrImage ? '<img src=\"'+P.qrImage+'\" alt=\"QR code to get Curate\">' : QR_SVG;")
// real photos from Framer's image slots
swap("initReels();", "initReels();\napplyImages(P);\nmeasure();")

const prelude = `
var __L = [], __dead = false, __raf = 0;
function __on(t, e, f, o){ t.addEventListener(e, f, o); __L.push([t, e, f, o]); }
`
const images = `
function applyImages(P){
  function img(u){ return '<img src="'+u+'" alt="" loading="lazy" decoding="async">'; }
  function fill(box, u){ if (!box || !u) return; box.querySelectorAll('.fig,.it').forEach(function(e){ e.style.display='none'; });
    var ph = box.querySelector('.ph') || (box.classList.contains('ph') ? box : null); if (ph){ ph.innerHTML = img(u); ph.style.background = 'none'; } }
  fill($('hp'), P.heroPhoto); if (P.heroPhoto) { var hc = $('hp').querySelector('.hcap'); if (hc) hc.style.display = 'none'; }
  (P.heroItems||[]).forEach(function(u,i){ if (u && flyers[i]) flyers[i].el.innerHTML = '<img src="'+u+'" alt="" style="display:block;width:100%">'; });
  (P.tryOns||[]).forEach(function(u,i){ if (!u) return; fill(TL[i], u); if (TILES[i]) fill(TILES[i].querySelector('.tl8'), u); });
  fill($('reelfig'), P.reelImage);
  fill($('tphfig'), P.replyImage);
  fill($('pv0'), P.extensionTryOn);
  fill($('p4'), P.nightTryOn);
  (P.closetPhotos||[]).forEach(function(u,i){ if (u && PR[i]) fill(PR[i].el, u); });
  var links = { 'App Store': P.appStoreUrl, 'Google Play': P.playStoreUrl, 'Chrome extension': P.chromeUrl };
  root.querySelectorAll('.stores a').forEach(function(a){ var u = links[a.textContent.trim()]; if (u) { a.href = u; a.target = '_blank'; a.rel = 'noopener'; } });
  if (P.appStoreUrl) { var g = root.querySelector('.hud .get'); if (g) { g.href = P.appStoreUrl; g.target = '_blank'; g.rel = 'noopener'; } }
}
`
const cleanup = `
var __ro = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(function(){ measure(); }) : null;
if (__ro) __ro.observe(root);
if (document.fonts) document.fonts.ready.then(function(){ if (!__dead) measure(); });
return function(){ __dead = true; cancelAnimationFrame(__raf); if (__ro) __ro.disconnect(); __L.forEach(function(l){ l[0].removeEventListener(l[1], l[2], l[3]); }); };
`
const initFn = `function init(root, P){\n${prelude}${js}\n${images}${cleanup}}`

const tsx = `// @ts-nocheck
// Curate landing: "One Day", the scroll story. GENERATED by web/landing/build-framer.mjs
// from web/landing/prototype/curate-one-day.html. Edit the prototype and rebuild; don't edit this file.
//
// In Framer: put this component on a page at full width (width: fill, height: auto). It draws its own
// day bar, Zee and clock while it is on screen, and hides them when the page scrolls past it.
// Drop real photos into the image slots in the right-hand panel; empty slots keep the drawn stand-ins.
import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

const CSS = ${JSON.stringify(scopedCss)}
const MARKUP = ${JSON.stringify(markup)}
const QR_SVG = ${JSON.stringify(qr)}

${initFn}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function CurateOneDay(props) {
  const ref = React.useRef(null)
  const isCanvas = RenderTarget.current() === RenderTarget.canvas
  const deps = JSON.stringify(props)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = MARKUP
    return init(el, { ...props, static: isCanvas })
  }, [deps, isCanvas])
  return (
    <div style={{ width: "100%", position: "relative" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500&family=Geist+Mono:wght@400;500&display=swap" />
      <style>{CSS}</style>
      <div ref={ref} className={"cod" + (isCanvas ? " cod-canvas" : "")} />
    </div>
  )
}

addPropertyControls(CurateOneDay, {
  heroPhoto: { type: ControlType.Image, title: "Hero: Emma" },
  heroItems: { type: ControlType.Array, title: "Hero: cut-outs", maxCount: 4, control: { type: ControlType.Image } },
  tryOns: { type: ControlType.Array, title: "Try-ons (16)", maxCount: 16, control: { type: ControlType.Image } },
  closetPhotos: { type: ControlType.Array, title: "Closet: camera roll", maxCount: 8, control: { type: ControlType.Image } },
  extensionTryOn: { type: ControlType.Image, title: "Chrome: try-on" },
  nightTryOn: { type: ControlType.Image, title: "Zee: try-on" },
  reelImage: { type: ControlType.Image, title: "Reel: creator" },
  replyImage: { type: ControlType.Image, title: "Reel: on her" },
  qrImage: { type: ControlType.Image, title: "QR code" },
  appStoreUrl: { type: ControlType.Link, title: "App Store link" },
  playStoreUrl: { type: ControlType.Link, title: "Google Play link" },
  chromeUrl: { type: ControlType.Link, title: "Chrome link" },
})
`
writeFileSync(join(here, "framer/CurateOneDay.tsx"), tsx)
console.log(`framer/CurateOneDay.tsx: ${(tsx.length / 1024).toFixed(0)} KB`)
