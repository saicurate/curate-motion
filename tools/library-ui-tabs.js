// The library page's tabs: Library (everything that was there) | Prompts | Inspo.
// tools/library-ui injects this script after the Voice panel's, so it only exists in the editable,
// served page. It reads and writes through /api/prompts* and /api/inspo* (tools/lib/boards-api.ts →
// the same code as tools/prompts and tools/inspo). Plain English for the founder; the page's own
// colour tokens, so light and dark both work; one column at phone width.
(() => {
  const TOKEN = document.querySelector('meta[name="ui-token"]')?.content;
  if (!TOKEN) return;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
  const toast = (t) => { const el = $("#toast"); if (!el) return alert(t); el.textContent = t; el.style.display = "block"; clearTimeout(toast.h); toast.h = setTimeout(() => (el.style.display = "none"), 4200); };
  const api = async (path, data) => {
    const r = await fetch(path, data === undefined ? {} : { method: "POST", headers: { "x-ui-token": TOKEN, "content-type": "application/json" }, body: JSON.stringify(data) });
    const j = await r.json().catch(() => ({ error: r.statusText }));
    if (!r.ok) throw new Error(j.error || r.statusText);
    return j;
  };
  const copy = async (text, what) => {
    try { await navigator.clipboard.writeText(text); }
    catch { const t = Object.assign(document.createElement("textarea"), { value: text }); document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
    toast(`Copied ${what}`);
  };
  const stars = (r) => (r ? "★".repeat(r) + "☆".repeat(5 - r) : "not rated");
  const OUTCOME_LABEL = { worked: "Worked", "didn't": "Didn't work", mixed: "Mixed", untested: "Not tried yet" };
  const AREA_LABEL = { "image-gen": "Image", "video-gen": "Video", voice: "Voice", music: "Music", copy: "Words", "motion-brief": "Video brief", "agent-brief": "Agent brief", research: "Research", other: "Other" };
  const who = (a) => (a === "founder" ? "You" : a.startsWith("agent:") ? `Agent (${a.slice(6)})` : a.replace(/^other:?/, "") || "Other");

  const css = `
  .tb-nav{display:flex;gap:6px;margin:16px 0 4px;position:sticky;top:0;z-index:6;background:var(--ground);padding:8px 0;border-bottom:1px solid var(--line)}
  .tb-nav button{flex:1 1 0;font-size:15px;padding:10px 8px;border-radius:12px;min-height:44px}
  .tb-nav button[aria-selected=true]{background:var(--ink);color:var(--ground);border-color:var(--ink)}
  .tb-nav button small{display:block;font-size:11px;opacity:.7;font-weight:400}
  .tb-pane[hidden]{display:none!important}
  .tb-pane [hidden],.tb-dlg [hidden]{display:none!important}
  .tb-intro{color:var(--t2);font-size:13px;margin:10px 0 12px;max-width:72ch}
  .tb-bar{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
  .tb-bar input[type=search]{flex:1 1 220px}
  .tb-bar select,.tb-bar button{min-height:40px}
  .tb-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));gap:12px}
  .tb-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 13px;display:flex;flex-direction:column;gap:7px;min-width:0}
  .tb-card.sel{border-color:var(--ink);box-shadow:0 0 0 1px var(--ink)}
  .tb-top{display:flex;gap:10px;align-items:flex-start}
  .tb-top input[type=checkbox]{width:20px;height:20px;margin:2px 0 0;flex:none;accent-color:var(--ink)}
  .tb-title{font-weight:600;font-size:14px;overflow-wrap:anywhere;cursor:pointer}
  .tb-id{font:11.5px ui-monospace,Menlo,monospace;color:var(--t3);overflow-wrap:anywhere;cursor:copy}
  .tb-row{display:flex;flex-wrap:wrap;gap:5px;align-items:center}
  .tb-pill{font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;border:1px solid currentColor}
  .tb-pill.worked{color:var(--ok)}.tb-pill.didnt{color:var(--warn)}.tb-pill.mixed{color:var(--t2)}.tb-pill.untested{color:var(--off)}
  .tb-stars{font-size:13px;letter-spacing:1px;color:var(--ink)}.tb-stars.none{font-size:11.5px;letter-spacing:0;color:var(--t3)}
  .tb-why{font-size:12.5px;color:var(--t2);line-height:1.4;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .tb-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}.tb-acts button{font-size:13px;padding:7px 11px;min-height:36px}
  .tb-sticky{position:sticky;bottom:0;z-index:5;margin-top:12px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;box-shadow:0 6px 24px rgba(0,0,0,.08)}
  .tb-sticky .st{flex:1 1 180px;font-size:13px;color:var(--t2)}
  .tb-sticky button{font-size:15px;padding:10px 16px;min-height:44px}
  .tb-dlg{max-height:calc(100dvh - 32px);overflow:auto}
  .tb-dlg h3{margin:0 0 4px;font-size:17px}
  .tb-text{white-space:pre-wrap;font:13px/1.5 ui-monospace,Menlo,monospace;background:var(--ground);border-radius:10px;padding:12px;max-height:46vh;overflow:auto;overflow-wrap:anywhere}
  .tb-meta{font-size:12.5px;color:var(--t2);display:grid;grid-template-columns:max-content 1fr;gap:3px 10px;margin:10px 0}
  .tb-meta b{color:var(--ink);font-weight:600}
  .tb-meta span{overflow-wrap:anywhere}
  .tb-link{font:11.5px ui-monospace,Menlo,monospace;color:var(--ink);text-decoration:underline;cursor:pointer;overflow-wrap:anywhere}
  .tb-field{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--t2);min-width:0}
  .tb-field input,.tb-field select,.tb-field textarea{width:100%;font-size:15px;padding:9px 10px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink)}
  .tb-field textarea{min-height:90px;font:14px/1.45 ui-monospace,Menlo,monospace;resize:vertical}
  .tb-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:10px}
  .tb-form .wide{grid-column:1/-1}
  .tb-rate{border-top:1px solid var(--line);margin-top:12px;padding-top:12px;display:flex;flex-direction:column;gap:10px}
  .tb-starbtns{display:flex;gap:4px}.tb-starbtns button{font-size:24px;line-height:1;padding:4px 6px;border:0;background:none;color:var(--t3);min-height:40px;min-width:40px}
  .tb-starbtns button.on{color:var(--ink)}
  .tb-seg{display:flex;flex-wrap:wrap;gap:6px}.tb-seg button{font-size:13.5px;padding:8px 12px;min-height:38px}
  .tb-seg button[aria-pressed=true]{background:var(--ink);color:var(--ground);border-color:var(--ink)}
  .tb-foot{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:12px}.tb-foot button{font-size:15px;padding:10px 16px;min-height:44px}
  .tb-msg{font-size:13px;color:var(--t2);white-space:pre-wrap}
  .tb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(46%,200px),1fr));gap:10px}
  .tb-tile{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;cursor:pointer;display:flex;flex-direction:column;text-align:left;padding:0;min-width:0}
  .tb-tile.archived{opacity:.55}
  .tb-thumb{aspect-ratio:4/5;background:var(--ground);display:flex;align-items:center;justify-content:center;overflow:hidden;color:var(--t3);font-size:12px;padding:0}
  .tb-thumb img,.tb-thumb video{width:100%;height:100%;object-fit:cover;display:block}
  .tb-thumb .site{font-size:15px;font-weight:600;color:var(--t2);padding:12px;text-align:center;overflow-wrap:anywhere}
  .tb-tile .b{padding:9px 10px 10px;display:flex;flex-direction:column;gap:4px;min-width:0}
  .tb-tile .t{font-weight:600;font-size:13px;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .tb-tile .k{font-size:11.5px;color:var(--t2)}
  .tb-drop{border:1.5px dashed var(--line);border-radius:16px;padding:16px;background:var(--card);display:flex;flex-direction:column;gap:10px}
  .tb-drop.over{border-color:var(--ink)}
  .tb-drop .zone{text-align:center;color:var(--t2);font-size:14px;padding:10px}
  .tb-drop .zone b{color:var(--ink)}
  .tb-md{font-size:14px;line-height:1.5;overflow-wrap:anywhere}
  .tb-md h2,.tb-md h4{font-size:15px;margin:14px 0 6px}
  .tb-md img{max-width:100%;border-radius:10px;border:1px solid var(--line);display:block;margin:8px 0}
  .tb-md ul{padding-left:20px;margin:6px 0}
  .tb-md code{font:12px ui-monospace,Menlo,monospace;background:var(--ground);padding:1px 4px;border-radius:4px}
  .tb-love{margin:8px 0;padding-left:20px}
  .tb-tech{display:flex;flex-direction:column;gap:6px;margin:8px 0}
  .tb-tech div{font-size:12.5px;color:var(--t2)}.tb-tech b{color:var(--ink);font-weight:600}
  .tb-tag{font-size:11px;color:var(--t2);background:var(--ground);border-radius:6px;padding:1px 6px}
  @media (max-width:520px){.tb-nav button{font-size:14px;padding:8px 4px}.tb-sticky button,.tb-foot button{flex:1 1 auto}}
  `;
  document.head.appendChild(Object.assign(document.createElement("style"), { textContent: css }));

  // ---------------------------------------------------------------- tabs: move the page's sections into "Library"
  const wrap = $(".wrap");
  const header = wrap.querySelector("header");
  const panes = { library: document.createElement("div"), prompts: document.createElement("div"), inspo: document.createElement("div") };
  for (const [k, el] of Object.entries(panes)) { el.className = "tb-pane"; el.id = `tab-${k}`; el.setAttribute("role", "tabpanel"); }
  const keep = new Set([header]);
  const rest = [...wrap.children].filter((c) => !keep.has(c));
  for (const c of rest) panes.library.appendChild(c);
  const nav = document.createElement("nav");
  nav.className = "tb-nav";
  nav.setAttribute("role", "tablist");
  nav.innerHTML = `
    <button type="button" role="tab" data-tab="library">Library<small>assets · voice · renders</small></button>
    <button type="button" role="tab" data-tab="prompts">Prompts<small id="tb-pcount">what worked</small></button>
    <button type="button" role="tab" data-tab="inspo">Inspo<small id="tb-icount">ideas we love</small></button>`;
  header.after(nav);
  nav.after(panes.library, panes.prompts, panes.inspo);
  const show = (tab) => {
    if (!panes[tab]) tab = "library";
    for (const [k, el] of Object.entries(panes)) el.hidden = k !== tab;
    nav.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
    store.set("tb-tab", tab);
    if (location.hash.slice(1) !== tab) history.replaceState(null, "", tab === "library" ? location.pathname : `#${tab}`);
    if (tab === "prompts") loadPrompts();
    if (tab === "inspo") loadInspo();
  };
  nav.addEventListener("click", (e) => { const b = e.target.closest("button[data-tab]"); if (b) show(b.dataset.tab); });

  // A dialog the page doesn't have yet (one, reused)
  const dlg = document.createElement("dialog");
  dlg.className = "tb-dlg";
  document.body.appendChild(dlg);
  const openDlg = (html) => { dlg.innerHTML = html; if (!dlg.open) dlg.showModal(); dlg.scrollTop = 0; };
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });

  // ================================================================ Prompts
  let P = null;
  const sel = new Set(JSON.parse(store.get("tb-sel") || "[]"));
  panes.prompts.innerHTML = `
    <p class="tb-intro">Every prompt we've used, yours and the agents', with how it went. Search before writing a new one, copy what worked, rate what you try, and tick two or more to mix them into a new one.</p>
    <div class="tb-bar">
      <input type="search" id="tb-pq" placeholder="Search words in the prompt, title or why">
      <select id="tb-poutcome" aria-label="Outcome"><option value="">Any outcome</option><option value="worked">Worked</option><option value="didn't">Didn't work</option><option value="mixed">Mixed</option><option value="untested">Not tried yet</option></select>
      <select id="tb-prating" aria-label="Rating"><option value="">Any rating</option><option value="5">★★★★★ only</option><option value="4">★★★★ and up</option><option value="3">★★★ and up</option><option value="0">Not rated</option></select>
      <select id="tb-parea" aria-label="Kind"><option value="">Every kind</option></select>
      <select id="tb-pauthor" aria-label="Who wrote it"><option value="">Anyone</option><option value="founder">Written by you</option><option value="agent">Written by an agent</option></select>
      <button type="button" class="primary" id="tb-pnew">New prompt</button>
    </div>
    <div class="tb-list" id="tb-plist"></div>
    <div class="tb-sticky" id="tb-premix" hidden><span class="st" id="tb-pselst"></span><button type="button" id="tb-pclear">Clear</button><button type="button" class="primary" id="tb-pmix">Remix with…</button></div>`;
  const pFilters = () => ({ q: $("#tb-pq").value.trim().toLowerCase().split(/\s+/).filter(Boolean), outcome: $("#tb-poutcome").value, rating: $("#tb-prating").value, area: $("#tb-parea").value, author: $("#tb-pauthor").value });
  ["tb-pq", "tb-poutcome", "tb-prating", "tb-parea", "tb-pauthor"].forEach((id) => $(`#${id}`).addEventListener("input", drawPrompts));

  async function loadPrompts() {
    try { P = await api("/api/prompts"); } catch (e) { $("#tb-plist").innerHTML = `<p class="tb-msg">Couldn't load the prompts: ${esc(e.message)}</p>`; return; }
    const a = $("#tb-parea"); if (a.options.length === 1) a.insertAdjacentHTML("beforeend", P.areas.map((x) => `<option value="${x}">${esc(AREA_LABEL[x] || x)}</option>`).join(""));
    $("#tb-pcount").textContent = `${P.count} · ${P.counts.outcome.worked || 0} worked`;
    for (const id of [...sel]) if (!P.prompts.some((p) => p.id === id)) sel.delete(id);
    drawPrompts();
    if (P.errors?.length) toast(`${P.errors.length} prompt file(s) have problems: tools/prompts validate`);
  }
  function drawPrompts() {
    if (!P) return;
    const f = pFilters();
    const rows = P.prompts.filter((p) => (!f.outcome || p.outcome === f.outcome) && (!f.area || p.area === f.area) && (!f.author || (f.author === "agent" ? p.author.startsWith("agent:") : p.author === f.author)) && (f.rating === "" || (f.rating === "0" ? !p.rating : (p.rating || 0) >= Number(f.rating))) && f.q.every((w) => `${p.id} ${p.title} ${p.why || ""} ${p.target} ${p.tags.join(" ")} ${p.body}`.toLowerCase().includes(w)))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.useCount - a.useCount || a.id.localeCompare(b.id));
    $("#tb-plist").innerHTML = rows.slice(0, 300).map((p) => `
      <div class="tb-card ${sel.has(p.id) ? "sel" : ""}" data-pid="${esc(p.id)}">
        <div class="tb-top"><input type="checkbox" aria-label="Pick for a remix" data-pick="${esc(p.id)}" ${sel.has(p.id) ? "checked" : ""}><div style="min-width:0;flex:1">
          <div class="tb-title" data-view="${esc(p.id)}">${esc(p.title)}</div>
          <div class="tb-id" data-copyid="${esc(p.id)}" title="Copy the id">${esc(p.id)}</div></div></div>
        <div class="tb-row"><span class="tb-pill ${p.outcome === "didn't" ? "didnt" : p.outcome}">${OUTCOME_LABEL[p.outcome]}</span><span class="tb-stars ${p.rating ? "" : "none"}">${stars(p.rating)}</span><span class="tb-tag">${esc(AREA_LABEL[p.area] || p.area)}</span><span class="tb-tag">${esc(who(p.author))}</span>${p.template ? '<span class="tb-tag">template</span>' : ""}${p.useCount ? `<span class="tb-tag">used ${p.useCount}×</span>` : ""}</div>
        ${p.why ? `<div class="tb-why">${esc(p.why)}</div>` : ""}
        <div class="tb-acts"><button type="button" data-view="${esc(p.id)}">View</button><button type="button" data-copytext="${esc(p.id)}">Copy text</button><button type="button" data-rate="${esc(p.id)}">Rate</button><button type="button" data-used="${esc(p.id)}">I used it</button></div>
      </div>`).join("") + (rows.length ? (rows.length > 300 ? `<p class="tb-msg">Showing 300 of ${rows.length}; narrow the search.</p>` : "") : `<p class="tb-msg">Nothing matches. Clear a filter, or press New prompt.</p>`);
    drawSel();
  }
  function drawSel() {
    store.set("tb-sel", JSON.stringify([...sel]));
    $("#tb-premix").hidden = sel.size === 0;
    $("#tb-pselst").textContent = sel.size === 1 ? "1 picked: pick at least one more to remix" : `${sel.size} picked`;
    $("#tb-pmix").disabled = sel.size < 2;
  }
  const byId = (id) => P?.prompts.find((p) => p.id === id);

  function viewPrompt(id, focusRate = false) {
    const p = byId(id); if (!p) return;
    const link = (x) => byId(x) ? `<span class="tb-link" data-view="${esc(x)}">${esc(x)}</span>` : esc(x);
    openDlg(`
      <h3>${esc(p.title)}</h3><div class="tb-id" data-copyid="${esc(p.id)}">${esc(p.id)}</div>
      <div class="tb-meta">
        <b>How it went</b><span>${OUTCOME_LABEL[p.outcome]} · ${stars(p.rating)}${p.why ? `<br>${esc(p.why)}` : ""}</span>
        <b>For</b><span>${esc(p.target)} (${esc(AREA_LABEL[p.area] || p.area)})</span>
        <b>Written by</b><span>${esc(who(p.author))}${p.useCount ? ` · used ${p.useCount}×, last ${esc(String(p.lastUsedAt).slice(0, 10))}` : ""}${p.costUsd ? ` · $${p.costUsd.toFixed(2)} so far` : ""}</span>
        ${p.parents.length ? `<b>Mixed from</b><span>${p.parents.map(link).join("<br>")}</span>` : ""}
        ${p.children.length ? `<b>Used in</b><span>${p.children.map(link).join("<br>")}</span>` : ""}
        ${p.inputs.length ? `<b>Inputs</b><span>${p.inputs.map(esc).join(", ")}</span>` : ""}
        ${p.outputs.length ? `<b>Made</b><span>${p.outputs.length > 6 ? `${p.outputs.slice(0, 6).map(esc).join(", ")} and ${p.outputs.length - 6} more` : p.outputs.map(esc).join(", ")}</span>` : ""}
        ${p.tags.length ? `<b>Tags</b><span>${p.tags.map(esc).join(", ")}</span>` : ""}
      </div>
      <div class="tb-text">${esc(p.body)}</div>
      <div class="tb-acts" style="margin-top:10px"><button type="button" class="primary" data-copytext="${esc(p.id)}">Copy text</button><button type="button" data-pickone="${esc(p.id)}">${sel.has(p.id) ? "Picked for a remix" : "Pick for a remix"}</button><button type="button" data-used="${esc(p.id)}">I used it</button></div>
      <div class="tb-rate" id="tb-rate">
        <b>Rate it</b>
        <div class="tb-starbtns" role="radiogroup" aria-label="Stars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" aria-label="${n} star${n > 1 ? "s" : ""}" class="${(p.rating || 0) >= n ? "on" : ""}">★</button>`).join("")}</div>
        <div class="tb-seg">${["worked", "didn't", "mixed", "untested"].map((o) => `<button type="button" data-oc="${o}" aria-pressed="${p.outcome === o}">${OUTCOME_LABEL[o]}</button>`).join("")}</div>
        <label class="tb-field">Why (what made it work or fail)<textarea id="tb-why" rows="3">${esc(p.why || "")}</textarea></label>
      </div>
      <div class="tb-msg" id="tb-dmsg"></div>
      <div class="tb-foot"><button type="button" data-close>Close</button><button type="button" class="primary" id="tb-saverate">Save rating</button></div>`);
    const st = { rating: p.rating || 0, outcome: p.outcome };
    dlg.querySelectorAll("[data-star]").forEach((b) => b.onclick = () => { st.rating = Number(b.dataset.star) === st.rating ? 0 : Number(b.dataset.star); dlg.querySelectorAll("[data-star]").forEach((x) => x.classList.toggle("on", Number(x.dataset.star) <= st.rating)); });
    dlg.querySelectorAll("[data-oc]").forEach((b) => b.onclick = () => { st.outcome = b.dataset.oc; dlg.querySelectorAll("[data-oc]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); });
    $("#tb-saverate", dlg).onclick = async () => {
      const why = $("#tb-why", dlg).value.trim();
      if ((st.outcome === "didn't" || st.outcome === "mixed") && !why) { $("#tb-dmsg", dlg).textContent = "Say why in a few words, so nobody repeats it."; return; }
      try { await api("/api/prompts/rate", { id: p.id, rating: st.rating || null, outcome: st.outcome, why }); toast("Saved the rating"); dlg.close(); await loadPrompts(); }
      catch (e) { $("#tb-dmsg", dlg).textContent = e.message; }
    };
    if (focusRate) $("#tb-rate", dlg).scrollIntoView({ block: "center" });
  }

  function editPrompt(draft = {}) {
    const areaOpts = (P?.areas || Object.keys(AREA_LABEL)).map((a) => `<option value="${a}" ${a === (draft.area || "image-gen") ? "selected" : ""}>${esc(AREA_LABEL[a] || a)}</option>`).join("");
    openDlg(`
      <h3>${draft.parents?.length ? "Remix" : "New prompt"}</h3>
      ${draft.parents?.length ? `<p class="tb-intro">Mixed from ${draft.parents.map((x) => `<span class="tb-id">${esc(x)}</span>`).join(" + ")}. Merge the parts below into one prompt and delete the <code>&lt;!-- … --&gt;</code> lines, then save.</p>` : `<p class="tb-intro">Paste a prompt that you used or want to keep. It's saved as its own file in <code>prompts/</code>, with an id agents can find.</p>`}
      <div class="tb-form">
        <label class="tb-field wide">Title<input id="tb-et" value="${esc(draft.title || "")}" placeholder="e.g. Garment product shot, ghost mannequin"></label>
        <label class="tb-field">Kind<select id="tb-ea">${areaOpts}</select></label>
        <label class="tb-field">For which model or tool<input id="tb-eg" value="${esc(draft.target || "")}" placeholder="Nano Banana Pro, gpt-4o-mini-tts, Claude agent…"></label>
        <label class="tb-field">Written by<select id="tb-eu"><option value="founder">Me</option><option value="other">Someone else</option></select></label>
        <label class="tb-field">How did it go?<select id="tb-eo"><option value="untested">Not tried yet</option><option value="worked">Worked</option><option value="didn't">Didn't work</option><option value="mixed">Mixed</option></select></label>
        <label class="tb-field wide">The prompt<textarea id="tb-eb" rows="12">${esc(draft.body || "")}</textarea></label>
        <label class="tb-field wide">Why it worked or didn't (optional)<input id="tb-ew" value=""></label>
        <label class="tb-field wide">Tags (comma-separated, optional)<input id="tb-etags" value="${esc((draft.tags || []).join(", "))}"></label>
      </div>
      <div class="tb-msg" id="tb-emsg"></div>
      <div class="tb-foot"><button type="button" data-close>Cancel</button><button type="button" class="primary" id="tb-esave">Save prompt</button></div>`);
    $("#tb-esave", dlg).onclick = async () => {
      const v = (id) => $(`#${id}`, dlg).value.trim();
      const body = $("#tb-eb", dlg).value;
      if (!v("tb-et") || !body.trim() || !v("tb-eg")) { $("#tb-emsg", dlg).textContent = "A title, the model or tool, and the prompt text are needed."; return; }
      if (body.includes("<!-- remix:") && !confirm("The remix markers are still in the text. Save it as a draft anyway?")) return;
      $("#tb-esave", dlg).disabled = true;
      try {
        const r = await api("/api/prompts/add", { title: v("tb-et"), area: v("tb-ea"), target: v("tb-eg"), author: v("tb-eu"), outcome: v("tb-eo"), body, why: v("tb-ew"), tags: v("tb-etags"), parents: draft.parents || [], inputs: draft.inputs || [] });
        toast(`Saved ${r.id}`); dlg.close();
        if (draft.parents?.length) { sel.clear(); drawSel(); }
        await loadPrompts();
      } catch (e) { $("#tb-emsg", dlg).textContent = e.message; $("#tb-esave", dlg).disabled = false; }
    };
  }

  panes.prompts.addEventListener("change", (e) => { const c = e.target.closest("[data-pick]"); if (!c) return; c.checked ? sel.add(c.dataset.pick) : sel.delete(c.dataset.pick); c.closest(".tb-card")?.classList.toggle("sel", c.checked); drawSel(); });
  $("#tb-pclear").onclick = () => { sel.clear(); drawPrompts(); };
  $("#tb-pnew").onclick = () => editPrompt();
  $("#tb-pmix").onclick = async () => { try { editPrompt(await api("/api/prompts/remix-draft", { ids: [...sel] })); } catch (e) { toast(e.message); } };
  const onPromptClick = async (e) => {
    const t = e.target.closest("[data-view],[data-copyid],[data-copytext],[data-rate],[data-used],[data-pickone]"); if (!t) return;
    if (t.dataset.view) return viewPrompt(t.dataset.view);
    if (t.dataset.copyid) return copy(t.dataset.copyid, t.dataset.copyid);
    if (t.dataset.copytext) return copy(byId(t.dataset.copytext)?.body || "", "the prompt text");
    if (t.dataset.rate) return viewPrompt(t.dataset.rate, true);
    if (t.dataset.pickone) { sel.has(t.dataset.pickone) ? sel.delete(t.dataset.pickone) : sel.add(t.dataset.pickone); t.textContent = sel.has(t.dataset.pickone) ? "Picked for a remix" : "Pick for a remix"; drawPrompts(); return; }
    if (t.dataset.used) { try { const r = await api("/api/prompts/use", { id: t.dataset.used }); toast(`Logged: used ${r.uses}×. Rate it once you've seen the result.`); await loadPrompts(); } catch (err) { toast(err.message); } }
  };
  panes.prompts.addEventListener("click", onPromptClick);
  dlg.addEventListener("click", (e) => { if (dlg.querySelector(".tb-rate") || dlg.querySelector("[data-copytext]")) onPromptClick(e); });

  // ================================================================ Inspo
  let I = null;
  panes.inspo.innerHTML = `
    <p class="tb-intro">Videos, reels, ads, screenshots of other apps, typefaces, colours: anything we want to come back to. Drop a file or paste a link and say what you love about it. Inspo is for study only and is never put in an ad.</p>
    <div class="tb-drop" id="tb-idrop">
      <div class="zone"><b>Drop a video or image here</b><br><span class="small">or <button type="button" id="tb-ipick">choose a file</button></span><input type="file" id="tb-ifile" hidden accept="video/*,image/*,audio/*"><div id="tb-ifname" class="small"></div></div>
      <div class="tb-form">
        <label class="tb-field wide">Or paste a link<input id="tb-iurl" type="url" placeholder="https://…" inputmode="url"></label>
        <label class="tb-field wide">Title<input id="tb-ititle" placeholder="e.g. Reel: outfit swap on the beat"></label>
        <label class="tb-field wide">What I love about it (one thing per line)<textarea id="tb-ilove" rows="3" placeholder="The cut lands on the beat&#10;The words sit behind her"></textarea></label>
        <label class="tb-field">Tags (comma-separated)<input id="tb-itags" placeholder="transition, type, colour"></label>
        <label class="tb-field">Use it for (optional)<input id="tb-ifor" placeholder="concept:c14, ad:pop-out"></label>
      </div>
      <div class="tb-foot" style="margin-top:0"><span class="tb-msg" id="tb-imsg" style="flex:1 1 200px"></span><button type="button" class="primary" id="tb-iadd">Add to inspo</button></div>
    </div>
    <div class="tb-bar"><input type="search" id="tb-iq" placeholder="Search titles, what we love, techniques, tags"><select id="tb-ishow" aria-label="Show"><option value="active">Showing: active</option><option value="all">Showing: everything</option><option value="archived">Showing: archived</option></select></div>
    <div class="tb-grid" id="tb-igrid"></div>`;
  let pickedFile = null;
  const setFile = (f) => { pickedFile = f || null; $("#tb-ifname").textContent = f ? `${f.name} · ${(f.size / 1e6).toFixed(1)} MB` : ""; if (f && !$("#tb-ititle").value) $("#tb-ititle").value = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "); };
  const dz = $("#tb-idrop");
  ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("over"); }));
  dz.addEventListener("drop", (e) => { const f = e.dataTransfer.files[0]; if (f) setFile(f); else { const u = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain"); if (/^https?:/.test(u)) $("#tb-iurl").value = u.trim(); } });
  $("#tb-ipick").onclick = () => $("#tb-ifile").click();
  $("#tb-ifile").onchange = (e) => setFile(e.target.files[0]);
  $("#tb-iadd").onclick = async () => {
    const v = (id) => $(`#${id}`).value.trim();
    const url = v("tb-iurl"), title = v("tb-ititle");
    if (!pickedFile && !url) { $("#tb-imsg").textContent = "Drop a file or paste a link first."; return; }
    if (!title) { $("#tb-imsg").textContent = "Give it a short title."; return; }
    $("#tb-iadd").disabled = true; $("#tb-imsg").textContent = pickedFile ? "Uploading…" : "Saving…";
    try {
      let r;
      if (pickedFile) {
        const qs = new URLSearchParams({ filename: pickedFile.name, title, love: v("tb-ilove"), tags: v("tb-itags"), useFor: v("tb-ifor"), url, by: "founder" });
        const res = await fetch(`/api/inspo/add-file?${qs}`, { method: "POST", headers: { "x-ui-token": TOKEN }, body: pickedFile });
        r = await res.json(); if (!res.ok) throw new Error(r.error || res.statusText);
      } else r = await api("/api/inspo/add-link", { url, title, love: v("tb-ilove"), tags: v("tb-itags"), useFor: v("tb-ifor") });
      $("#tb-imsg").textContent = `Added ${r.id}`;
      ["tb-iurl", "tb-ititle", "tb-ilove", "tb-itags", "tb-ifor"].forEach((id) => ($(`#${id}`).value = "")); setFile(null); $("#tb-ifile").value = "";
      await loadInspo();
    } catch (e) { $("#tb-imsg").textContent = e.message; }
    $("#tb-iadd").disabled = false;
  };
  ["tb-iq", "tb-ishow"].forEach((id) => $(`#${id}`).addEventListener("input", drawInspo));

  async function loadInspo() {
    try { I = await api("/api/inspo"); } catch (e) { $("#tb-igrid").innerHTML = `<p class="tb-msg">Couldn't load the inspo board: ${esc(e.message)}</p>`; return; }
    $("#tb-icount").textContent = `${(I.counts.status.active || 0)} saved`;
    drawInspo();
  }
  const site = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "link"; } };
  const thumb = (x) => {
    if (x.cover) return `<img loading="lazy" alt="" src="/library/${x.cover.split("/").map(encodeURIComponent).join("/")}">`;
    const v = x.files.find((f) => (f.mime || "").startsWith("video/"));
    if (v) return `<video preload="metadata" muted playsinline src="/library/${v.path.split("/").map(encodeURIComponent).join("/")}#t=0.5"></video>`;
    return `<span class="site">${esc(x.url ? site(x.url) : x.kind)}</span>`;
  };
  function drawInspo() {
    if (!I) return;
    const q = $("#tb-iq").value.trim().toLowerCase().split(/\s+/).filter(Boolean), showSt = $("#tb-ishow").value;
    const rows = I.inspo.filter((x) => (showSt === "all" || x.status === showSt) && q.every((w) => `${x.id} ${x.title} ${x.love.join(" ")} ${Object.values(x.techniques).flat().join(" ")} ${x.tags.join(" ")} ${x.useFor.join(" ")}`.toLowerCase().includes(w)));
    $("#tb-igrid").innerHTML = rows.map((x) => `
      <button type="button" class="tb-tile ${x.status}" data-iview="${esc(x.id)}">
        <div class="tb-thumb">${thumb(x)}</div>
        <div class="b"><div class="t">${esc(x.title)}</div><div class="k">${esc(x.kind)}${x.hasBreakdown ? " · broken down" : ""}${x.status === "archived" ? " · archived" : ""}</div></div>
      </button>`).join("") || `<p class="tb-msg">${I.count ? "Nothing matches." : "Nothing saved yet. Drop the first one above."}</p>`;
  }
  // a small, safe Markdown renderer for the notes: headings, bullets, bold, code, images from the library, links
  const md = (src) => {
    const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    const out = []; let list = false;
    for (const raw of src.replace(/<!--[\s\S]*?-->/g, "").split("\n")) {
      const l = raw.trimEnd();
      const img = /^!\[([^\]]*)\]\(\.\.\/library\/([^)\s]+)\)$/.exec(l.trim());
      if (/^\s*[-*] /.test(l)) { if (!list) { out.push("<ul>"); list = true; } out.push(`<li>${inline(l.replace(/^\s*[-*] /, ""))}</li>`); continue; }
      if (list) { out.push("</ul>"); list = false; }
      if (img) out.push(`<img loading="lazy" alt="${esc(img[1])}" src="/library/${img[2].split("/").map(encodeURIComponent).join("/")}">`);
      else if (/^#{1,6} /.test(l)) out.push(`<h4>${inline(l.replace(/^#+ /, ""))}</h4>`);
      else if (l.trim()) out.push(`<p>${inline(l)}</p>`);
    }
    if (list) out.push("</ul>");
    return out.join("");
  };
  const TECH = { transitions: "Transitions", pacing: "Pacing", type: "Type", colour: "Colour", other: "Other" };
  function viewInspo(id) {
    const x = I?.inspo.find((y) => y.id === id); if (!x) return;
    const media = x.files.find((f) => f.role === "original");
    const mediaHtml = media && (media.mime || "").startsWith("video/") ? `<video controls playsinline preload="metadata" style="width:100%;max-height:60vh;border-radius:12px;background:#000" src="/library/${media.path.split("/").map(encodeURIComponent).join("/")}"></video>` : media && (media.mime || "").startsWith("image/") ? `<img alt="" style="width:100%;border-radius:12px" src="/library/${media.path.split("/").map(encodeURIComponent).join("/")}">` : "";
    openDlg(`
      <h3>${esc(x.title)}</h3><div class="tb-id" data-icopy="${esc(x.id)}">${esc(x.id)}</div>
      ${mediaHtml ? `<div style="margin:10px 0">${mediaHtml}</div>` : ""}
      <div class="tb-meta">
        <b>Kind</b><span>${esc(x.kind)}${x.status === "archived" ? " · archived" : ""}</span>
        ${x.url ? `<b>Link</b><span><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.url)}</a></span>` : ""}
        ${x.links.map((l) => `<b>${esc(l.label)}</b><span><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.url)}</a></span>`).join("")}
        ${x.source ? `<b>From</b><span>${esc(x.source)}</span>` : ""}
        ${x.useFor.length ? `<b>Use it for</b><span>${x.useFor.map(esc).join(", ")}</span>` : ""}
        ${x.asset ? `<b>Media</b><span>${esc(x.asset)} (reference: never shipped)</span>` : ""}
      </div>
      ${x.love.length ? `<b>What we love</b><ul class="tb-love">${x.love.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}
      ${Object.keys(x.techniques).length ? `<div class="tb-tech">${Object.entries(x.techniques).map(([k, v]) => `<div><b>${TECH[k] || k}:</b> ${v.map(esc).join(" · ")}</div>`).join("")}</div>` : ""}
      ${x.tags.length ? `<div class="tb-row">${x.tags.map((t) => `<span class="tb-tag">${esc(t)}</span>`).join("")}</div>` : ""}
      <div class="tb-md">${md(x.body)}</div>
      <div class="tb-msg" id="tb-ivmsg"></div>
      <div class="tb-foot">
        <button type="button" data-close>Close</button>
        <button type="button" data-iarchive="${esc(x.id)}" data-undo="${x.status === "archived" ? "1" : ""}">${x.status === "archived" ? "Bring back" : "Archive"}</button>
        ${x.asset ? `<button type="button" class="primary" data-ibreak="${esc(x.id)}">${x.hasBreakdown ? "Redo the breakdown" : "Break it down"}</button>` : ""}
      </div>`);
  }
  panes.inspo.addEventListener("click", (e) => { const t = e.target.closest("[data-iview]"); if (t) viewInspo(t.dataset.iview); });
  dlg.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-iarchive],[data-ibreak],[data-icopy]"); if (!t) return;
    if (t.dataset.icopy) return copy(t.dataset.icopy, t.dataset.icopy);
    const msg = $("#tb-ivmsg", dlg);
    try {
      if (t.dataset.iarchive) { await api("/api/inspo/archive", { id: t.dataset.iarchive, undo: !!t.dataset.undo }); toast(t.dataset.undo ? "Brought back" : "Archived"); dlg.close(); await loadInspo(); return; }
      if (t.dataset.ibreak) { t.disabled = true; msg.textContent = "Looking at every frame (free, on this Mac)…"; await api("/api/inspo/breakdown", { id: t.dataset.ibreak }); await loadInspo(); viewInspo(t.dataset.ibreak); toast("Breakdown written"); }
    } catch (err) { msg.textContent = err.message; t.disabled = false; }
  });

  show(location.hash.slice(1) || store.get("tb-tab") || "library");
  window.addEventListener("hashchange", () => show(location.hash.slice(1)));
})();
