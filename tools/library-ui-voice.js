// The library page's Voice panel. tools/library-ui injects this script into tracker/index.html when
// it serves the page (so it only exists in the editable, served page). It reads and writes through
// /api/voice/* (tools/library-ui.ts → tools/lib/voice-settings.ts, the same code as `tools/voice use`).
// Plain English for the founder; the page's own colour tokens, so light and dark both work.
(() => {
  const TOKEN = document.querySelector('meta[name="ui-token"]')?.content;
  if (!TOKEN) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const usd = (n) => (n > 0 && n < 0.01 ? `$${n.toFixed(3)}` : `$${n.toFixed(2)}`);
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
  const api = async (path, data) => {
    const r = await fetch(path, data === undefined ? {} : { method: "POST", headers: { "x-ui-token": TOKEN, "content-type": "application/json" }, body: JSON.stringify(data) });
    const j = await r.json().catch(() => ({ error: r.statusText }));
    if (!r.ok) throw new Error(j.error || r.statusText);
    return j;
  };

  const css = `
  .vp{margin-top:22px}
  .vp>summary{list-style:none;cursor:pointer;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px}
  .vp>summary::-webkit-details-marker{display:none}
  .vp>summary h2{margin:0}
  .vp>summary .now{font-size:13px;color:var(--t2)}
  .vp>summary::after{content:"Hide";margin-left:auto;font-size:12px;color:var(--t2)}
  .vp:not([open])>summary::after{content:"Show"}
  .vp-intro{color:var(--t2);font-size:13px;margin:6px 0 12px;max-width:68ch}
  .vp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:12px}
  .vp-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:12px;min-width:0}
  .vp-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px}
  .vp-head b{font-size:15px}
  .vp-head .id{font:11.5px ui-monospace,Menlo,monospace;color:var(--t3)}
  .vp-tag{font-size:11.5px;color:var(--t2);border:1px solid var(--line);border-radius:99px;padding:1px 9px}
  .vp-tag.own{color:var(--ink);border-color:var(--ink)}
  .vp-field{display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:var(--t2);min-width:0}
  .vp-field select,.vp-field input{width:100%;font-size:15px;padding:9px 10px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink)}
  .vp-about{font-size:12.5px;color:var(--t2);line-height:1.4}
  .vp-switch{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--ink);cursor:pointer}
  .vp-switch input{appearance:none;flex:none;width:40px;height:24px;border-radius:99px;background:var(--line);position:relative;cursor:pointer;margin:0;transition:background .15s}
  .vp-switch input::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:var(--card);box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .vp-switch input:checked{background:var(--ink)}
  .vp-switch input:checked::after{transform:translateX(16px)}
  .vp-switch input:disabled{opacity:.5;cursor:default}
  .vp-switch small{display:block;color:var(--t2);font-size:12.5px;margin-top:2px}
  .vp-hear{border-top:1px solid var(--line);padding-top:12px;display:flex;flex-direction:column;gap:10px}
  .vp-hear-top{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;font-size:13px;font-weight:600}
  .vp-hear-top select{flex:1 1 180px;font-size:14px;padding:7px 9px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-weight:400}
  .vp-btns{display:flex;flex-wrap:wrap;gap:8px}
  .vp-btns button{font-size:14px;padding:9px 12px;border-radius:10px;min-height:40px}
  .vp-btns button small{display:block;font-size:11px;color:var(--t2);font-weight:400}
  .vp-btns button.primary small{color:inherit;opacity:.75}
  .vp-out{font-size:13px;line-height:1.45;color:var(--ink);background:var(--ground);border-radius:10px;padding:10px 12px}
  .vp-out:empty{display:none}
  .vp-out .muted{color:var(--t2)}
  .vp-out .warn{color:var(--warn);font-weight:600}
  .vp-out ol{margin:6px 0 0;padding-left:20px}
  .vp-out li.on{font-weight:600}
  .vp-out li.gone{color:var(--t3)}
  .vp-cap{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  .vp-cap input{width:120px;font-size:15px;padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink)}
  .vp-big{font-size:22px;font-weight:600;letter-spacing:-.01em}
  .vp-save{position:sticky;bottom:0;z-index:5;margin-top:12px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;box-shadow:0 6px 24px rgba(0,0,0,.08)}
  .vp-save button{font-size:15px;padding:10px 18px;border-radius:10px}
  .vp-save .st{flex:1 1 200px;font-size:13px;color:var(--t2)}
  .vp-save .st.dirty{color:var(--ink);font-weight:600}
  .vp-saved{margin-top:10px;font-size:13.5px;background:var(--card);border:1px solid var(--ok);border-radius:12px;padding:10px 14px}
  .vp-saved b{color:var(--ok)}
  .vp-saved ul{margin:4px 0 0;padding-left:18px}
  .vp-link{font:12px ui-monospace,Menlo,monospace;overflow-wrap:anywhere;color:var(--ink)}
  .vp [hidden]{display:none!important}
  `;
  document.head.appendChild(Object.assign(document.createElement("style"), { textContent: css }));

  const root = document.createElement("details");
  root.className = "vp";
  root.id = "voice";
  root.open = store.get("vp-open") !== "0";
  root.addEventListener("toggle", () => store.set("vp-open", root.open ? "1" : "0"));
  const anchor = document.querySelector("#addzone") || document.querySelector(".wrap > h2");
  (anchor?.parentNode || document.body).insertBefore(root, anchor || null);

  let S = null; // what's on disk (the server's state)
  let D = null; // the draft: what the dropdowns say now
  const est = {}; // ad → the last cost preview {key, result}
  const out = {}; // ad → result html
  let savedMsg = "";
  const player = new Audio();
  player.preload = "auto";
  let playing = null; // {ad, clips, i, timer}

  const prof = (k) => S.profiles.find((p) => p.key === k);
  const modeLabel = (m) => S.modes.find((x) => x.key === m)?.label ?? m;
  const fromState = () => ({
    global: { mode: S.config.mode, use: S.config.use, burnIn: S.config.burnIn },
    ads: Object.fromEntries(S.ads.map((a) => [a.id, a.override ? { ...a.override } : null])),
    part: Object.fromEntries(S.ads.map((a) => [a.id, D?.part?.[a.id] ?? a.parts[0]?.key])),
  });
  /** The voice an ad would use with the dropdowns as they are now (saved or not). */
  const eff = (ad) => {
    const o = D.ads[ad];
    const mode = o ? o.mode : D.global.mode;
    const use = mode === "tts" ? (o && o.mode === "tts" && o.use) || D.global.use : (o && o.use) || D.global.use;
    return { mode, use };
  };
  const dirty = () => {
    const g = D.global, c = S.config;
    const changes = [];
    if (g.mode !== c.mode || g.use !== c.use || g.burnIn !== c.burnIn) changes.push("the default");
    for (const a of S.ads) if (JSON.stringify(D.ads[a.id]) !== JSON.stringify(a.override)) changes.push(a.title);
    return changes;
  };
  const voiceName = (m, use) => (m === "tts" ? `AI voice: ${prof(use)?.label ?? use}` : modeLabel(m));

  const profileOptions = (sel, first) =>
    (first ? `<option value="">${esc(first)}</option>` : "") + S.profiles.map((p) => `<option value="${esc(p.key)}" ${p.key === sel ? "selected" : ""}>${esc(p.label)}</option>`).join("");
  const modeOptions = (sel) =>
    [
      ["captions", "Captions only (no voice)"],
      ["human", "Human recording"],
      ["tts", "AI voice"],
    ].map(([k, l]) => `<option value="${k}" ${k === sel ? "selected" : ""}>${l}</option>`).join("");

  function render() {
    const g = D.global;
    const gp = prof(g.use);
    const ch = dirty();
    root.innerHTML = `
      <summary><h2>Voiceover</h2><span class="now">Right now: ${esc(voiceName(S.config.mode, S.config.use))}${S.ads.some((a) => a.override) ? " · some ads have their own" : ""}</span></summary>
      <p class="vp-intro">What people hear in the ads. Pick it here and press Save: the next render uses it, no code change. Whatever you pick, the words are also there as captions.</p>
      <div class="vp-grid">
        <div class="vp-card">
          <div class="vp-head"><b>Every ad (the default)</b></div>
          <label class="vp-field">What viewers hear
            <select data-k="g-mode">${modeOptions(g.mode)}</select></label>
          <label class="vp-field" ${g.mode === "tts" ? "" : "hidden"}>Which AI voice
            <select data-k="g-use">${profileOptions(g.use)}</select>
            <span class="vp-about">${esc(gp?.about)}</span></label>
          ${g.mode === "human" ? `<p class="vp-about">Uses each ad's recordings (added with <code>tools/voice import</code>). An ad without them can't render with this until they're added.</p>` : ""}
          <label class="vp-switch"><input type="checkbox" data-k="g-burn" ${g.mode === "captions" || g.burnIn ? "checked" : ""} ${g.mode === "captions" ? "disabled" : ""}>
            <span>Burn in captions<small>${g.mode === "captions" ? "Always on when there's no voice, so the words are on screen." : "On: the words are drawn into the video. Off: they go in separate caption files (.srt and .vtt) for platforms that add their own."}</small></span></label>
        </div>
        ${S.ads.map(adCard).join("")}
        ${capCard()}
        ${S.lan ? phoneCard() : ""}
      </div>
      <div class="vp-save">
        <button class="primary" data-v="save" ${ch.length ? "" : "disabled"}>Save</button>
        ${ch.length ? `<button data-v="undo">Undo changes</button>` : ""}
        <span class="st ${ch.length ? "dirty" : ""}">${ch.length ? `Not saved yet: ${esc(ch.join(", "))}` : "Everything is saved."}</span>
      </div>
      ${savedMsg}`;
  }

  function adCard(a) {
    const o = D.ads[a.id];
    const e = eff(a.id);
    const dflt = `Use the default (${voiceName(D.global.mode, D.global.use)})`;
    const sel = o ? o.mode : "";
    const ownUse = o && o.mode === "tts" ? o.use || "" : "";
    const p = prof(e.use);
    const ready = a.hasScript;
    const part = D.part[a.id];
    const est0 = est[a.id];
    const estOk = est0 && est0.key === `${e.use}|${part}` ? est0.r : null;
    let gen = "";
    if (ready && e.mode === "tts" && p && !p.previewOnly && estOk && estOk.todo > 0) {
      const allowed = estOk.cap > 0 && estOk.spent + estOk.est <= estOk.cap + 1e-9;
      const keyOk = estOk.keyExists !== false;
      gen = `<button class="primary" data-v="generate" data-ad="${esc(a.id)}" ${allowed && keyOk ? "" : "disabled"}>Generate (costs ~${usd(estOk.est)})<small>${!keyOk ? "the key isn't set up" : allowed ? `limit ${usd(estOk.cap)}` : `over your ${usd(estOk.cap)} limit`}</small></button>`;
    }
    return `<div class="vp-card" data-ad="${esc(a.id)}">
      <div class="vp-head"><b>${esc(a.title)}</b><span class="id">${esc(a.id)}</span><span class="vp-tag ${o ? "own" : ""}">${o ? "Its own voice" : "Uses the default"}</span></div>
      ${ready ? "" : `<p class="vp-about">This ad has no voiceover script yet (ads/${esc(a.id)}/script.json), so there's nothing to voice. You can still set its choice for later.</p>`}
      <label class="vp-field">Voice for this ad
        <select data-k="a-mode" data-ad="${esc(a.id)}"><option value="">${esc(dflt)}</option>${modeOptions(sel)}</select></label>
      <label class="vp-field" ${o && o.mode === "tts" ? "" : "hidden"}>Which AI voice
        <select data-k="a-use" data-ad="${esc(a.id)}">${profileOptions(ownUse, `Same as the default (${prof(D.global.use)?.label ?? D.global.use})`)}</select>
        <span class="vp-about">${esc(o && o.mode === "tts" ? p?.about : "")}</span></label>
      ${a.strayUse ? `<p class="vp-about">ad.json also names the AI voice "${esc(a.strayUse)}" for this ad; it's used whenever the ad's voice is AI.</p>` : ""}
      ${a.ownCaptions ? `<p class="vp-about">This ad has its own caption setting in ad.json (${esc(JSON.stringify(a.ownCaptions))}); it is kept.</p>` : ""}
      ${ready ? `<div class="vp-hear">
        <div class="vp-hear-top">Hear it${a.parts.length > 1 ? `<select data-k="part" data-ad="${esc(a.id)}">${a.parts.map((x) => `<option value="${esc(x.key)}" ${x.key === part ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select>` : ""}</div>
        <div class="vp-about">Now: ${esc(voiceName(e.mode, e.use))}${a.human.take || a.human.lines ? ` · recordings: ${a.human.take ? "a full take" : ""}${a.human.take && a.human.lines ? " + " : ""}${a.human.lines ? `${a.human.lines} single lines` : ""}` : ""}</div>
        <div class="vp-btns">
          <button data-v="estimate" data-ad="${esc(a.id)}" ${e.mode === "tts" ? "" : "disabled"}>Preview cost<small>${e.mode === "tts" ? "free: nothing is made" : "for AI voices"}</small></button>
          <button data-v="sample" data-ad="${esc(a.id)}" ${e.mode === "captions" ? "disabled" : ""}>${playing?.ad === a.id ? "Stop" : "Play sample"}<small>${e.mode === "captions" ? "no voice to play" : "clips already made"}</small></button>
          <button data-v="mac" data-ad="${esc(a.id)}">Preview with Mac voice<small>free · not for release</small></button>
          ${gen}
        </div>
        <div class="vp-out" data-out="${esc(a.id)}">${out[a.id] ?? ""}</div>
      </div>` : ""}
    </div>`;
  }

  function capCard() {
    const c = S.config.capUsd;
    return `<div class="vp-card">
      <div class="vp-head"><b>Spending limit for paid AI voices</b></div>
      <div><span class="vp-big">${usd(c)}</span> <span class="vp-about">in total · spent so far ${usd(S.spentUsd)}</span></div>
      <p class="vp-about">${c <= 0 ? "While it's $0, nothing paid can be made, not by this page and not by an agent. The free Mac preview always works." : `Paid voices can be made until everything made adds up to ${usd(c)}. Each Generate still asks you first.`} For scale: the whole explainer in an OpenAI voice is about $0.03.</p>
      <div class="vp-cap"><label class="vp-field" style="flex-direction:row;align-items:center;gap:8px">New limit $<input type="number" data-k="cap" min="0" max="${S.maxCapUsd}" step="0.5" value="${c}" inputmode="decimal"></label><button data-v="cap">Change limit</button></div>
    </div>`;
  }

  function phoneCard() {
    if (!S.phoneLinks) return `<div class="vp-card"><div class="vp-head"><b>On your phone</b></div><p class="vp-about">Open this page on the Mac to get the phone link.</p></div>`;
    return `<div class="vp-card"><div class="vp-head"><b>Open on your phone</b></div>
      <p class="vp-about">Same Wi-Fi only. The link carries this session's key: don't share it. It stops working when the library page is stopped.</p>
      ${S.phoneLinks.map((l) => `<div class="vp-cap"><span class="vp-link">${esc(l)}</span><button data-v="copy" data-link="${esc(l)}">Copy</button></div>`).join("")}</div>`;
  }

  const setOut = (ad, html) => {
    out[ad] = html;
    const el = root.querySelector(`[data-out="${CSS.escape(ad)}"]`);
    if (el) el.innerHTML = html;
  };

  // ---- hearing it
  const stop = () => {
    if (!playing) return;
    clearTimeout(playing.timer);
    player.pause();
    const ad = playing.ad;
    playing = null;
    render();
    return ad;
  };
  const listHtml = (s, on) =>
    `<ol>${s.clips.map((c, i) => `<li class="${i === on ? "on" : ""}">${esc(c.text)}</li>`).join("")}</ol>`;
  const playClips = (ad, s) => {
    stop();
    if (!s.clips.length) return;
    playing = { ad, clips: s.clips, i: 0, timer: 0 };
    render();
    const head = `${s.previewOnly ? `<span class="warn">Mac preview voice · not for release</span><br>` : ""}${s.missing.length ? `<span class="muted">${s.missing.length} of ${s.lines} lines aren't made yet, so they're skipped.</span><br>` : ""}`;
    const step = () => {
      if (!playing || playing.ad !== ad) return;
      const c = playing.clips[playing.i];
      if (!c) {
        playing = null;
        setOut(ad, `${head}Done: played ${s.clips.length} line${s.clips.length === 1 ? "" : "s"}.`);
        render();
        return;
      }
      setOut(ad, `${head}Playing ${playing.i + 1} of ${s.clips.length}${listHtml(s, playing.i)}`);
      const go = () => {
        player.currentTime = c.start || 0;
        player.play().catch(() => {
          setOut(ad, `${head}Your browser blocked the sound. Press Play sample to listen.`);
          playing = null;
          render();
        });
        playing.timer = setTimeout(() => {
          player.pause();
          if (!playing) return;
          playing.i++;
          playing.timer = setTimeout(step, (S.config.gapSec || 0.3) * 1000);
        }, Math.max(0.2, c.dur) * 1000 + 60);
      };
      if (player.src.endsWith(c.url)) go();
      else {
        player.src = c.url;
        player.addEventListener("loadedmetadata", go, { once: true });
        player.load();
      }
    };
    step();
  };
  const emptySampleMsg = (e, s) =>
    e.mode === "human"
      ? `Nothing recorded yet for this part. Record the lines and add them with <code>tools/voice import ${esc(s.ad)} &lt;file&gt;</code>.`
      : prof(e.use)?.previewOnly
        ? "No Mac preview clips yet: press Preview with Mac voice."
        : `Nothing made yet in this voice. Press Preview cost to see the price, or Preview with Mac voice to hear the timing for free.`;

  // ---- events
  root.addEventListener("change", (ev) => {
    const t = ev.target;
    const k = t.dataset?.k;
    if (!k) return;
    const ad = t.dataset.ad;
    if (k === "g-mode") D.global.mode = t.value;
    if (k === "g-use") D.global.use = t.value;
    if (k === "g-burn") D.global.burnIn = t.checked;
    if (k === "a-mode") D.ads[ad] = t.value ? { mode: t.value, ...(t.value === "tts" && D.ads[ad]?.use ? { use: D.ads[ad].use } : {}) } : null;
    if (k === "a-use") D.ads[ad] = { mode: "tts", ...(t.value ? { use: t.value } : {}) };
    if (k === "part") D.part[ad] = t.value;
    if (k === "cap") return;
    if (ad) setOut(ad, "");
    savedMsg = "";
    render();
  });

  root.addEventListener("click", async (ev) => {
    const b = ev.target.closest("button[data-v]");
    if (!b || b.disabled) return;
    ev.preventDefault();
    const v = b.dataset.v;
    const ad = b.dataset.ad;
    const e = ad ? eff(ad) : null;
    const busy = (on) => root.querySelectorAll("button[data-v]").forEach((x) => { if (on) { x.dataset.was = x.disabled ? "1" : ""; x.disabled = true; } else x.disabled = x.dataset.was === "1"; });
    try {
      if (v === "copy") {
        await navigator.clipboard?.writeText(b.dataset.link);
        b.textContent = "Copied";
        return;
      }
      if (v === "undo") {
        D = fromState();
        savedMsg = "";
        return render();
      }
      if (v === "save") {
        busy(true);
        const ads = {};
        for (const a of S.ads) if (JSON.stringify(D.ads[a.id]) !== JSON.stringify(a.override)) ads[a.id] = D.ads[a.id];
        const r = await api("/api/voice/save", { global: D.global, ads, versions: { config: S.version, ads: Object.fromEntries(S.ads.map((a) => [a.id, a.version])) } });
        S = r.state;
        D = fromState();
        savedMsg = `<div class="vp-saved"><b>Saved.</b> ${r.changed.length ? `(${esc(r.changed.join(", "))})` : ""}<ul>${r.next.map((l) => `<li>Saved: ${esc(l)}</li>`).join("")}</ul></div>`;
        return render();
      }
      if (v === "cap") {
        const n = Math.round(Number(root.querySelector('[data-k="cap"]').value) * 100) / 100;
        if (!Number.isFinite(n) || n < 0 || n > S.maxCapUsd) return alert(`Pick an amount between $0 and $${S.maxCapUsd}.`);
        if (n === S.config.capUsd) return;
        const ok = n > S.config.capUsd
          ? confirm(`Raise the spending limit for paid AI voices to ${usd(n)}?\n\nThe Generate button can then spend real money (OpenAI) until everything made adds up to ${usd(n)}. Spent so far: ${usd(S.spentUsd)}. Each Generate still asks you first.`)
          : confirm(`Lower the spending limit to ${usd(n)}?${n === 0 ? " Nothing paid can be made after this." : ""}`);
        if (!ok) return;
        busy(true);
        const r = await api("/api/voice/cap", { capUsd: n, confirm: true, version: S.version });
        S = r.state;
        Object.keys(est).forEach((k) => delete est[k]);
        savedMsg = `<div class="vp-saved"><b>Saved.</b> Spending limit is now ${usd(S.config.capUsd)} (config/voice.json). Press Preview cost again to see what it allows.</div>`;
        return render();
      }
      if (v === "estimate") {
        busy(true);
        setOut(ad, `<span class="muted">Working out the price (nothing is made)…</span>`);
        const r = await api("/api/voice/estimate", { ad, use: e.use, part: D.part[ad] });
        est[ad] = { key: `${e.use}|${D.part[ad]}`, r };
        const made = r.lines.length - r.todo;
        const lines = [
          `<b>${esc(prof(r.profile)?.label ?? r.profile)}</b>`,
          r.todo === 0 ? `All ${r.lines.length} lines are already made. Nothing to pay.` : `To make: ${r.todo} line${r.todo === 1 ? "" : "s"}, ${r.chars.toLocaleString()} characters, about <b>${usd(r.est)}</b>${r.previewOnly ? " (free)" : ""}.`,
          made ? `<span class="muted">Already made: ${made} (never paid twice).</span>` : "",
          r.previewOnly ? `<span class="warn">Mac preview voice · not for release</span>` : `<span class="muted">Spent so far ${usd(r.spent)} · your limit ${usd(r.cap)}.${r.keyName ? ` Key: ${r.keyExists ? "set up" : "not set up"}.` : ""}</span>`,
          !r.previewOnly && r.todo > 0 && !(r.cap > 0 && r.spent + r.est <= r.cap) ? `<span class="warn">Your limit doesn't allow this yet: raise it under "Spending limit".</span>` : "",
        ];
        out[ad] = lines.filter(Boolean).join("<br>");
        return render();
      }
      if (v === "sample") {
        if (stop() === ad) return;
        busy(true);
        const s = await api("/api/voice/sample", { ad, mode: e.mode, use: e.use, part: D.part[ad] });
        s.ad = ad;
        busy(false);
        if (!s.clips.length) return setOut(ad, emptySampleMsg(e, s));
        return playClips(ad, s);
      }
      if (v === "mac") {
        stop();
        busy(true);
        setOut(ad, `<span class="muted">Making the Mac preview (free, a few seconds a line)…</span>`);
        const r = await api("/api/voice/mac-preview", { ad, part: D.part[ad] });
        busy(false);
        r.sample.ad = ad;
        S = await api("/api/voice/state");
        const made = r.result.generated.length;
        if (!r.sample.clips.length) return setOut(ad, "No clips were made.");
        setOut(ad, `${made ? `Made ${made} new clip${made === 1 ? "" : "s"}.` : "Already made."}`);
        return playClips(ad, r.sample);
      }
      if (v === "generate") {
        const r0 = est[ad]?.r;
        if (!r0) return;
        const p = prof(e.use);
        if (!confirm(`Generate ${r0.todo} line${r0.todo === 1 ? "" : "s"} of "${S.ads.find((a) => a.id === ad)?.title}" in ${p?.label ?? e.use}?\n\nThis spends about ${usd(r0.est)} of real money (${r0.provider}). Spent so far ${usd(r0.spent)}, your limit ${usd(r0.cap)}.\n\nAI voices must be disclosed in the ad.`)) return;
        busy(true);
        setOut(ad, `<span class="muted">Generating ${r0.todo} lines…</span>`);
        const r = await api("/api/voice/generate", { ad, use: e.use, part: D.part[ad], expectUsd: r0.est, confirm: true });
        delete est[ad];
        S = await api("/api/voice/state");
        busy(false);
        render();
        setOut(ad, `Made ${r.result.generated.length} clip${r.result.generated.length === 1 ? "" : "s"} for about ${usd(r.result.est)}.`);
        r.sample.ad = ad;
        return playClips(ad, r.sample);
      }
    } catch (err) {
      busy(false);
      if (ad) setOut(ad, `<span class="warn">${esc(err.message)}</span>`);
      else {
        savedMsg = `<div class="vp-saved" style="border-color:var(--warn)"><b style="color:var(--warn)">Not saved.</b> ${esc(err.message)}</div>`;
        render();
      }
    }
  });

  window.addEventListener("beforeunload", (ev) => {
    if (S && D && dirty().length) {
      ev.preventDefault();
      ev.returnValue = "";
    }
  });

  api("/api/voice/state")
    .then((s) => {
      S = s;
      D = fromState();
      render();
    })
    .catch((err) => {
      root.innerHTML = `<summary><h2>Voiceover</h2></summary><p class="vp-intro">Couldn't load the voice settings: ${esc(err.message)}</p>`;
    });
})();
