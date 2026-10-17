import React from "react";
import { Img, useCurrentFrame, useVideoConfig } from "remotion";
import { src } from "./assets";
import { expoOut, progress, spring } from "./springs";
import { GEIST } from "./theme";

// SearchScreen: a generic web search for skits, in Curate's own monochrome look (no search engine's branding,
// colours or logo; no real sites). A white card: a rounded search field whose query types in, then the results
// rise in one by one on the `ui` spring; one result can be the Curate app (its mark, name, line and a pill),
// and a tap ring can land on it. Frame-pure (t in seconds).
//
//   <SearchScreen query="how to not look chopped" typeFrom={0.2} typeTo={1.4} results={[…]} tapAt={2.6} tapOn={2} />

const INK = "#181818";
const WINTER = "#656565";
const FASHION = "#8B8B8B";
const GAINS = "#DDDDDD";
const PALE = "#EBEBEB";
const ANGORA = "#F6F6F6";
const WHITE = "#FFFFFF";

export type SearchResult =
  | { kind: "web"; title: string; source: string; snippet?: string }
  | { kind: "app"; name: string; line: string; mark: string; cta?: string };

export const SearchScreen: React.FC<{
  query: string;
  typeFrom: number;
  typeTo: number;
  results: SearchResult[];
  /** Seconds after typeTo before the first result rises; then one per `every`. */
  resultsDelay?: number;
  every?: number;
  /** Index of a result to tap, and when. */
  tapOn?: number;
  tapAt?: number;
  width?: number;
  height?: number;
  size?: number;
  t?: number;
  style?: React.CSSProperties;
}> = ({ query, typeFrom, typeTo, results, resultsDelay = 0.25, every = 0.16, tapOn, tapAt, width = 940, height = 1240, size = 40, t: tProp, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = tProp ?? frame / fps;
  const typed = query.slice(0, Math.round(query.length * Math.min(1, progress(t, typeFrom, Math.max(0.01, typeTo - typeFrom)))));
  const caret = t < typeTo + 0.6 && (Math.floor((t - typeFrom) * 2.4) % 2 === 0 || t < typeTo);
  const pad = size * 0.9;
  const fieldH = size * 2.0;
  let y = pad + fieldH + size * 0.9;
  const tapK = tapAt !== undefined ? progress(t, tapAt, 0.35) : 0;
  return (
    <div style={{ position: "absolute", width, height, borderRadius: size * 1.1, background: WHITE, overflow: "hidden", fontFamily: GEIST, boxShadow: "0 18px 50px rgba(16,20,24,0.18), 0 2px 6px rgba(16,20,24,0.08)", ...style }}>
      <div style={{ position: "absolute", left: pad, top: pad, width: width - 2 * pad, height: fieldH, borderRadius: fieldH / 2, background: ANGORA, border: `2px solid ${GAINS}`, boxSizing: "border-box", display: "flex", alignItems: "center", gap: size * 0.4, padding: `0 ${size * 0.6}px` }}>
        <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 20 20" style={{ flex: "none" }}>
          <circle cx="8.5" cy="8.5" r="6" fill="none" stroke={WINTER} strokeWidth="2.2" />
          <path d="M13 13 L18 18" stroke={WINTER} strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <div style={{ fontSize: size * 0.95, color: typed ? INK : FASHION, whiteSpace: "pre", overflow: "hidden" }}>
          {typed || "Search"}
          <span style={{ display: "inline-block", width: 3, height: size, marginLeft: 2, verticalAlign: "-0.15em", background: INK, opacity: caret ? 1 : 0 }} />
        </div>
      </div>
      {results.map((r, i) => {
        const at = typeTo + resultsDelay + i * every;
        const k = spring(t - at, "ui");
        const a = expoOut(progress(t, at, 0.2));
        const top = y;
        const h = r.kind === "app" ? size * 4.4 : r.snippet ? size * 3.3 : size * 2.4;
        y += h + size * 0.5;
        if (t < at) return null;
        const tapped = tapOn === i ? tapK : 0;
        const box: React.CSSProperties = { position: "absolute", left: pad, top, width: width - 2 * pad, height: h, opacity: a, transform: `translateY(${((1 - k) * size * 0.8).toFixed(2)}px) scale(${(1 - 0.025 * Math.sin(Math.PI * Math.min(1, tapped * 2))).toFixed(4)})`, transformOrigin: "50% 50%" };
        if (r.kind === "web") {
          return (
            <div key={i} style={box}>
              <div style={{ fontSize: size * 0.6, color: FASHION, marginBottom: size * 0.12 }}>{r.source}</div>
              <div style={{ fontSize: size * 0.95, color: INK, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.18 }}>{r.title}</div>
              {r.snippet ? <div style={{ fontSize: size * 0.68, color: WINTER, marginTop: size * 0.14, lineHeight: 1.3 }}>{r.snippet}</div> : null}
            </div>
          );
        }
        return (
          <div key={i} style={{ ...box, borderRadius: size * 0.6, background: ANGORA, border: `2px solid ${tapped > 0 ? INK : PALE}`, boxSizing: "border-box", display: "flex", alignItems: "center", gap: size * 0.55, padding: `0 ${size * 0.6}px` }}>
            <div style={{ width: size * 2.6, height: size * 2.6, borderRadius: size * 0.62, background: WHITE, border: `2px solid ${PALE}`, display: "grid", placeItems: "center", overflow: "hidden", flex: "none" }}>
              <Img src={src(r.mark)} style={{ width: "92%", height: "92%", objectFit: "contain" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: size * 1.0, color: INK, fontWeight: 500 }}>{r.name}</div>
              <div style={{ fontSize: size * 0.66, color: WINTER, marginTop: size * 0.08, lineHeight: 1.25 }}>{r.line}</div>
            </div>
            <div style={{ flex: "none", background: INK, color: WHITE, fontSize: size * 0.66, fontWeight: 500, borderRadius: size, padding: `${size * 0.28}px ${size * 0.6}px` }}>{r.cta ?? "Get the app"}</div>
          </div>
        );
      })}
      {tapOn !== undefined && tapAt !== undefined && t >= tapAt && t < tapAt + 0.6
        ? (() => {
            // the tap ring lands on the app result's pill
            let ry = pad + fieldH + size * 0.9;
            for (let i = 0; i < tapOn; i++) ry += (results[i].kind === "app" ? size * 4.4 : (results[i] as { snippet?: string }).snippet ? size * 3.3 : size * 2.4) + size * 0.5;
            const rh = results[tapOn].kind === "app" ? size * 4.4 : size * 2.4;
            const cx = width - pad - size * 2.4;
            const cy = ry + rh / 2;
            const k = progress(t, tapAt, 0.5);
            const R = size * (0.6 + 1.4 * expoOut(k));
            return <div style={{ position: "absolute", left: cx - R, top: cy - R, width: 2 * R, height: 2 * R, borderRadius: "50%", border: `3px solid ${INK}`, opacity: 0.55 * (1 - k), background: `rgba(24,24,24,${(0.12 * (1 - k)).toFixed(3)})` }} />;
          })()
        : null}
    </div>
  );
};
