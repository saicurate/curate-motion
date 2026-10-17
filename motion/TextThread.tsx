import React from "react";
import { Img, useCurrentFrame, useVideoConfig } from "remotion";
import { src } from "./assets";
import { expoOut, progress, spring } from "./springs";
import { GEIST } from "./theme";

// TextThread: a text conversation for skits, in Curate's own look (NOT Apple's Messages: no blue bubbles, no tails,
// no Apple header). A floating white card: a header with the contact, the messages stacked from the bottom (new ones
// push the old ones up on the `panel` spring and pop in on the `ui` spring), "Delivered" / "Seen" under his latest
// message, her typing dots, day dividers, a photo bubble, and a composer whose text types in character by character.
// Frame-pure: every value comes from t (seconds); widths come from canvas text metrics (Geist, loaded by the ad).
//
//   <TextThread contact="Grocery store girl" items={[{ kind: "msg", id: "m1", from: "me", text: "hey", at: 1.2 }]}
//     composer={[{ text: "hey", from: 0.4, to: 1.1 }]} statuses={[{ after: "m1", label: "Delivered", at: 1.5 }]} />

// The brand ramp (library/brand/BRAND.md): monochrome only.
const INK = "#181818"; // Primary Black: his bubbles, names
const STRONG = "#383838";
const WINTER = "#656565"; // Winter Gray: secondary words
const FASHION = "#8B8B8B"; // Fashion Gray: timestamps, statuses
const GAINS = "#DDDDDD";
const PALE = "#EBEBEB"; // Pale Silver: her bubbles
const ANGORA = "#F6F6F6";
const WHITE = "#FFFFFF";

export type ThreadItem =
  | { kind: "msg"; id: string; from: "me" | "her"; text: string; at: number }
  | { kind: "photo"; id: string; from: "me" | "her"; image: string; at: number; aspect?: number }
  | { kind: "time"; id: string; label: string; at: number };
export type ThreadStatus = { after: string; label: string; at: number };
export type ThreadTyping = { start: number; end: number };
export type ThreadComposer = { text: string; from: number; to: number };

type Props = {
  contact: string;
  subtitle?: string;
  items: ThreadItem[];
  statuses?: ThreadStatus[];
  typing?: ThreadTyping[];
  composer?: ThreadComposer[];
  /** Card size in px (the ad's frame px). */
  width?: number;
  height?: number;
  /** Bubble text size in px. */
  size?: number;
  /** Seconds; default = the current frame / fps. */
  t?: number;
  style?: React.CSSProperties;
};

let canvas: HTMLCanvasElement | null = null;
const widthOf = (text: string, px: number, weight = 400) => {
  if (typeof document === "undefined") return text.length * px * 0.52;
  canvas ??= document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${weight} ${px}px ${GEIST}, "Helvetica Neue", Arial, sans-serif`;
  return ctx.measureText(text).width;
};

/** Greedy word wrap with real metrics: the lines a bubble of max width `maxW` holds. */
export const wrap = (text: string, px: number, maxW: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (widthOf(next, px) <= maxW || !cur) cur = next;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
};

const Dots: React.FC<{ t: number; size: number }> = ({ t, size }) => (
  <div style={{ display: "flex", gap: size * 0.28, alignItems: "center", height: size * 1.25 }}>
    {[0, 1, 2].map((i) => {
      const ph = (t * 2.6 - i * 0.18) % 1; // a wave across the three dots, from t alone
      const lift = Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, ph * 1.6))));
      return <div key={i} style={{ width: size * 0.36, height: size * 0.36, borderRadius: "50%", background: FASHION, opacity: 0.45 + 0.55 * lift, transform: `translateY(${(-lift * size * 0.16).toFixed(2)}px)` }} />;
    })}
  </div>
);

export const TextThread: React.FC<Props> = ({ contact, subtitle, items, statuses = [], typing = [], composer = [], width = 940, height = 1180, size = 44, t: tProp, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = tProp ?? frame / fps;
  const pad = size * 0.9;
  const lineH = size * 1.28;
  const maxBubble = width * 0.72;
  const bubblePadX = size * 0.62;
  const bubblePadY = size * 0.42;
  const gap = size * 0.34;
  const headerH = size * 3.1;
  const composerH = size * 2.7;
  const bodyH = height - headerH - composerH;

  // what each item needs, top to bottom
  type Laid = { it: ThreadItem; h: number; lines?: string[]; w?: number };
  const laid: Laid[] = items.map((it) => {
    if (it.kind === "msg") {
      const lines = wrap(it.text, size, maxBubble - 2 * bubblePadX);
      const w = Math.min(maxBubble, Math.max(...lines.map((l) => widthOf(l, size))) + 2 * bubblePadX);
      return { it, h: lines.length * lineH + 2 * bubblePadY, lines, w };
    }
    if (it.kind === "photo") {
      const w = width * 0.5;
      return { it, h: w * (it.aspect ?? 4 / 3), w };
    }
    return { it, h: size * 1.5 };
  });
  // the newest status that has happened, under its message
  const status = statuses.filter((s) => s.at <= t).sort((a, b) => a.at - b.at).at(-1);
  const typingNow = typing.find((x) => t >= x.start && t < x.end + 0.25);
  const typeIn = typingNow ? spring(t - typingNow.start, "panel") * (1 - spring(t - typingNow.end, "panel")) : 0;

  // stack from the bottom: every item that has arrived grows in on the panel spring
  const grow = (at: number) => Math.min(1, Math.max(0, spring(t - at, "panel")));
  const rows: { l: Laid; g: number; statusH: number }[] = [];
  for (const l of laid) {
    if (t < l.it.at) continue;
    const st = status && status.after === l.it.id ? size * 1.0 : 0;
    rows.push({ l, g: grow(l.it.at), statusH: st });
  }
  const typingH = (size * 1.25 + 2 * bubblePadY + gap) * typeIn;
  let y = bodyH - pad * 0.6 - typingH; // the bottom of the newest row
  const placed: { l: Laid; g: number; top: number; statusH: number }[] = [];
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    const hh = (r.l.h + r.statusH + gap) * r.g;
    y -= hh;
    placed.push({ ...r, top: y });
  }

  const comp = composer.find((c) => t >= c.from && t < c.to + 0.12);
  const typed = comp ? comp.text.slice(0, Math.round(comp.text.length * Math.min(1, progress(t, comp.from, Math.max(0.01, comp.to - comp.from))))) : "";
  const caretOn = comp ? Math.floor((t - comp.from) * 2.4) % 2 === 0 || typed.length < (comp?.text.length ?? 0) : false;

  return (
    <div style={{ position: "absolute", width, height, borderRadius: size * 1.0, background: WHITE, overflow: "hidden", fontFamily: GEIST, boxShadow: "0 18px 50px rgba(16,20,24,0.18), 0 2px 6px rgba(16,20,24,0.08)", ...style }}>
      {/* header: back chevron, her initial, the name she's saved under */}
      <div style={{ position: "absolute", left: 0, top: 0, width, height: headerH, borderBottom: `2px solid ${PALE}`, display: "flex", alignItems: "center", gap: size * 0.5, paddingLeft: size * 0.7, boxSizing: "border-box" }}>
        <svg width={size * 0.55} height={size * 0.9} viewBox="0 0 12 20" style={{ flex: "none" }}>
          <path d="M10 2 L2 10 L10 18" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ width: size * 1.7, height: size * 1.7, borderRadius: "50%", background: GAINS, color: STRONG, display: "grid", placeItems: "center", fontSize: size * 0.78, fontWeight: 500, flex: "none" }}>{contact.trim()[0]?.toUpperCase()}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: size * 0.06 }}>
          <div style={{ fontSize: size * 0.86, fontWeight: 500, color: INK, letterSpacing: "-0.01em" }}>{contact}</div>
          {subtitle ? <div style={{ fontSize: size * 0.56, color: FASHION }}>{subtitle}</div> : null}
        </div>
      </div>
      {/* the messages */}
      <div style={{ position: "absolute", left: 0, top: headerH, width, height: bodyH, overflow: "hidden", background: WHITE }}>
        {placed.map(({ l, g, top, statusH }) => {
          const it = l.it;
          const pop = spring(t - it.at, "ui");
          const a = expoOut(progress(t, it.at, 0.18));
          if (it.kind === "time") {
            return (
              <div key={it.id} style={{ position: "absolute", left: 0, width, top, height: l.h, display: "grid", placeItems: "center", opacity: a * g, fontSize: size * 0.56, color: FASHION, letterSpacing: "0.02em" }}>
                {it.label}
              </div>
            );
          }
          const me = it.from === "me";
          const w = l.w!;
          const left = me ? width - pad * 0.7 - w : pad * 0.7;
          const r = size * 0.62;
          const corner = me ? `${r}px ${r}px ${size * 0.18}px ${r}px` : `${r}px ${r}px ${r}px ${size * 0.18}px`;
          const scale = 0.86 + 0.14 * pop;
          return (
            <React.Fragment key={it.id}>
              <div style={{ position: "absolute", left, top, width: w, height: l.h, transformOrigin: me ? "100% 100%" : "0% 100%", transform: `scale(${scale.toFixed(4)})`, opacity: a }}>
                {it.kind === "msg" ? (
                  <div style={{ width: w, height: l.h, boxSizing: "border-box", padding: `${bubblePadY}px ${bubblePadX}px`, borderRadius: corner, background: me ? INK : PALE, color: me ? WHITE : INK, fontSize: size, lineHeight: `${lineH}px`, whiteSpace: "pre" }}>
                    {l.lines!.join("\n")}
                  </div>
                ) : (
                  <Img src={src(it.image)} style={{ width: w, height: l.h, objectFit: "cover", borderRadius: r, display: "block" }} />
                )}
              </div>
              {statusH > 0 && status ? (
                <div style={{ position: "absolute", top: top + l.h + size * 0.12, right: pad * 0.75, fontSize: size * 0.52, color: FASHION, opacity: expoOut(progress(t, status.at, 0.2)) }}>{status.label}</div>
              ) : null}
            </React.Fragment>
          );
        })}
        {typeIn > 0.001 ? (
          <div style={{ position: "absolute", left: pad * 0.7, top: bodyH - pad * 0.6 - (size * 1.25 + 2 * bubblePadY), padding: `${bubblePadY}px ${bubblePadX}px`, borderRadius: `${size * 0.62}px ${size * 0.62}px ${size * 0.62}px ${size * 0.18}px`, background: PALE, opacity: typeIn, transformOrigin: "0% 100%", transform: `scale(${(0.8 + 0.2 * typeIn).toFixed(4)})` }}>
            <Dots t={t} size={size} />
          </div>
        ) : null}
      </div>
      {/* the composer: our own (a field and a round ink send button) */}
      <div style={{ position: "absolute", left: 0, top: headerH + bodyH, width, height: composerH, borderTop: `2px solid ${PALE}`, display: "flex", alignItems: "center", gap: size * 0.4, padding: `0 ${size * 0.6}px`, boxSizing: "border-box", background: WHITE }}>
        <div style={{ flex: 1, height: size * 1.6, borderRadius: size * 0.8, background: ANGORA, display: "flex", alignItems: "center", padding: `0 ${size * 0.55}px`, fontSize: size * 0.82, color: typed ? INK : FASHION, whiteSpace: "pre", overflow: "hidden" }}>
          {typed || "Message"}
          {comp ? <span style={{ display: "inline-block", width: 3, height: size * 0.95, marginLeft: 2, background: INK, opacity: caretOn ? 1 : 0 }} /> : null}
        </div>
        <div style={{ width: size * 1.6, height: size * 1.6, borderRadius: "50%", background: typed ? INK : GAINS, display: "grid", placeItems: "center", flex: "none" }}>
          <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 20 20">
            <path d="M10 16 V4 M4.5 9.5 L10 4 L15.5 9.5" fill="none" stroke={WHITE} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};

/** A "1 day later" card: big words on a white slab that lands on the headline spring and leaves with a fade. */
export const LaterCard: React.FC<{ label: string; at: number; until: number; size?: number; t?: number; style?: React.CSSProperties }> = ({ label, at, until, size = 92, t: tProp, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = tProp ?? frame / fps;
  if (t < at || t > until + 0.3) return null;
  const k = spring(t - at, "headline");
  const out = expoOut(progress(t, until, 0.25));
  return (
    <div style={{ position: "absolute", ...style, opacity: Math.min(1, k * 1.4) * (1 - out), transform: `translateY(${((1 - k) * 40 + out * -24).toFixed(2)}px)` }}>
      <div style={{ display: "inline-block", background: WHITE, color: INK, fontFamily: GEIST, fontWeight: 500, fontSize: size, letterSpacing: "-0.03em", padding: `${size * 0.22}px ${size * 0.42}px`, borderRadius: size * 0.28, boxShadow: "0 14px 40px rgba(16,20,24,0.22)" }}>
        {label}
      </div>
    </div>
  );
};

export const THREAD_INK = { INK, WINTER, FASHION, PALE, ANGORA, WHITE } as const;
