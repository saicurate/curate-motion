import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { Device, DepthPhoto, EDITORIAL, Grain, has, KeyLine, src, useBrandFonts, Vignette, zeeFrame, depthRig, type DepthCam, type ZeeCue } from "../../motion";
import { expoInOut, expoOut, progress, spring, track } from "../../motion/springs";
import { noise1 } from "../../motion/noise";
import { LaterCard, TextThread, type ThreadItem } from "../../motion/TextThread";
import { SearchScreen } from "../../motion/SearchScreen";
import { GEIST } from "../../motion/theme";
import { WORDS } from "./captions";
import { FADE, LINE_AT, MUSIC_A, MUSIC_B, RATE, T, TOTAL_SEC, type LineId } from "./timeline";
import { APP_CLIPS, STILL, VIDEO, VO, SFX } from "./shots";

// Skit "you're chopped" (9:16, 60 fps, ~46 s): the founder's story-time script. Jake (a made-up persona; the joke is the
// outfit, never his looks) gets a girl's number, over-thinks every text, gets ghosted, gets told he's chopped, finds Curate,
// and the real app (on Apple's real iPhone bezel: straight on, fades only, words beside it) styles him from his own closet.
// Stills come alive in 2.5D (DepthPhoto, free local models); three shots are AI video (Veo 3.1 Fast). Every value is a
// function of t = frame / fps. Media by id only (shots.ts); a missing id draws a labelled placeholder (animatic).

export const schema = z.object({ format: FormatId, length: z.number(), music: z.boolean(), volume: z.number().min(0).max(1), voVolume: z.number().min(0).max(1), sfxVolume: z.number().min(0).max(1) });
export const defaults = { music: true, volume: 0.42, voVolume: 1, sfxVolume: 0.6 };
export const metadata = () => ({ durationInFrames: Math.round(TOTAL_SEC * 60) });

// brand ramp (library/brand/BRAND.md)
const INK = "#181818";
const ANGORA = "#F6F6F6";
const WHITE = "#FFFFFF";
const FASHION = "#8B8B8B";

const Placeholder: React.FC<{ label: string; dark?: boolean }> = ({ label, dark = true }) => (
  <AbsoluteFill style={{ background: dark ? "#2b2d31" : "#d9dcdf", display: "grid", placeItems: "center" }}>
    <div style={{ fontFamily: GEIST, fontSize: 44, color: dark ? "#9aa0a6" : "#5b6168", textAlign: "center", padding: 80, lineHeight: 1.3 }}>{label}</div>
  </AbsoluteFill>
);

// ── a still that comes alive (2.5D when its layers exist; a slow push on the flat photo otherwise) ─────────────
type StillKey = keyof typeof STILL;
const rigs: Record<string, ReturnType<typeof depthRig>> = {};
const rigOf = (k: StillKey) => (rigs[k] ??= depthRig({ photo: STILL[k].dims, near: 1.0, far: STILL[k].far ?? 4, overscan: 1.1, fov0: 30, align: STILL[k].align }));

const Still: React.FC<{ k: StillKey; t: number; from: number; cam?: (u: number) => DepthCam; blur?: number; dim?: number }> = ({ k, t, from, cam, blur = 0, dim = 0 }) => {
  const s = STILL[k];
  const u = t - from;
  const c = cam ? cam(u) : { dolly: track(u, 0, [{ t: 0, v: 0.1, spring: "camera" }]), x: track(u, 0.012, [{ t: 0, v: -0.012, spring: "camera" }]) };
  const filter = blur ? `blur(${blur}px)` : undefined;
  let body: React.ReactNode;
  if (has(s.plate) && has(s.cut)) {
    const rig = rigOf(k);
    body = (
      <>
        <div style={{ position: "absolute", inset: 0, filter }}>
          <DepthPhoto rig={rig} camera={c} layers={[{ key: "plate", image: { id: s.plate }, depth: { id: s.plate, role: "depth" }, grade: EDITORIAL }]} />
        </div>
        <div style={{ position: "absolute", inset: 0, filter }}>
          <DepthPhoto rig={rig} camera={c} layers={[{ key: "him", image: { id: s.cut }, depth: { id: s.cut, role: "depth" }, grade: EDITORIAL }]} />
        </div>
      </>
    );
  } else if (has(s.id)) {
    const z = 1.04 + 0.05 * expoOut(progress(u, 0, 4));
    body = <Img src={src(s.id)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})`, filter }} />;
  } else body = <Placeholder label={`${k}: ${s.note}`} />;
  return (
    <AbsoluteFill style={{ background: "#111" }}>
      {body}
      <Vignette strength={0.28} />
      {dim ? <AbsoluteFill style={{ background: `rgba(10,10,12,${dim})` }} /> : null}
    </AbsoluteFill>
  );
};

/** An AI video shot (720p, upscaled), with grain so it sits with the stills. */
const Video: React.FC<{ k: keyof typeof VIDEO; t: number; from: number }> = ({ k, t, from }) => {
  const v = VIDEO[k];
  if (!has(v.id)) return <Placeholder label={`${k}: ${v.note}`} />;
  const z = 1 + 0.03 * expoOut(progress(t - from, 0, 3));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${z})` }}>
        <OffthreadVideo src={src(v.id)} trimBefore={Math.round((v.from ?? 0) * 60)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <Vignette strength={0.22} />
    </AbsoluteFill>
  );
};

// ── captions: TikTok-native, brand type (Geist), word by word; the spoken word inverts onto a white plate ──────────
const Captions: React.FC<{ t: number; top: number; light?: boolean }> = ({ t, top, light = false }) => {
  // the line being spoken (or just finished, for 0.25 s)
  const lid = (Object.keys(LINE_AT) as LineId[]).filter((l) => t >= LINE_AT[l] - 0.05).at(-1);
  if (!lid) return null;
  const ws = WORDS[lid].map(([w, s, e]) => ({ w, s: LINE_AT[lid] + s / RATE, e: LINE_AT[lid] + e / RATE }));
  const end = ws.at(-1)!.e + 0.35;
  if (t > end) return null;
  // chunks of up to 3 words, broken after punctuation
  const chunks: (typeof ws)[] = [];
  let cur: typeof ws = [];
  for (const x of ws) {
    cur.push(x);
    if (cur.length === 3 || /[.,?!…"]$/.test(x.w)) {
      chunks.push(cur);
      cur = [];
    }
  }
  if (cur.length) chunks.push(cur);
  let ci = 0;
  chunks.forEach((c, i) => {
    if (t >= c[0].s - 0.04) ci = i;
  });
  const chunk = chunks[ci];
  const k = spring(t - chunk[0].s + 0.04, "ui");
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 18px", transform: `translateY(${((1 - k) * 18).toFixed(2)}px)`, opacity: Math.min(1, k * 1.6) }}>
      {chunk.map((x, i) => {
        const on = t >= x.s - 0.03 && (i === chunk.length - 1 ? t < end : t < chunk[i + 1].s - 0.03);
        const pop = on ? 1 + 0.06 * (1 - spring(t - x.s, "ui")) : 1;
        return (
          <span key={i} style={{ display: "inline-block", fontFamily: GEIST, fontWeight: 600, fontSize: 76, letterSpacing: "-0.02em", lineHeight: 1.18, padding: "2px 14px 8px", borderRadius: 16, color: light ? (on ? WHITE : INK) : on ? INK : WHITE, background: on ? (light ? INK : WHITE) : "transparent", textShadow: on || light ? "none" : "0 0 2px rgba(0,0,0,0.9), 0 3px 10px rgba(0,0,0,0.65)", transform: `scale(${pop.toFixed(4)})` }}>
            {x.w.replace(/^"|"$/g, (m) => (m === '"' ? "“" : m))}
          </span>
        );
      })}
    </div>
  );
};

// ── the thread (one conversation across the whole skit) ───────────────────────────────────────────────────────
const HER_CHOPPED = "you're chopped. your outfit looks so bad";
const HER_YES = "oh wow. you cleaned up nice. I'm free tomorrow. wanna get drinks?";
const ITEMS: ThreadItem[] = [
  { kind: "time", id: "d0", label: "Sun 6:41 PM", at: 0 },
  { kind: "msg", id: "m1", from: "me", text: "hey", at: T.heySent },
  { kind: "time", id: "d1", label: "Tue 9:02 PM", at: T.hayTypeFrom - 0.2 },
  { kind: "msg", id: "m2", from: "me", text: "hey, how are you?", at: T.haySent },
  { kind: "time", id: "d2", label: "Thu 11:48 PM", at: T.handsomeTypeFrom - 0.2 },
  { kind: "msg", id: "m3", from: "me", text: "hey, you said I was handsome, why are you ghosting me", at: T.handsomeSent },
  { kind: "time", id: "d3", label: "Sat 2:14 PM", at: T.herTypingFrom - 0.1 },
  { kind: "msg", id: "h1", from: "her", text: HER_CHOPPED, at: T.chopped },
  { kind: "time", id: "d4", label: "Sat 7:30 PM", at: T.replyThread },
  { kind: "photo", id: "p1", from: "me", image: STILL.s08.id, at: T.photoSent, aspect: 4 / 3 },
  { kind: "msg", id: "h2", from: "her", text: HER_YES, at: T.herReply },
];
const Thread: React.FC<{ t: number; x?: number; y?: number; scale?: number }> = ({ t, x = 60, y = 640, scale = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 960, height: 900, transformOrigin: "50% 100%", transform: `scale(${scale.toFixed(4)})` }}>
    <TextThread
      t={t}
      contact="Grocery store girl"
      subtitle="saved Sunday"
      width={960}
      height={900}
      size={46}
      items={has(STILL.s08.id) ? ITEMS : ITEMS.filter((i) => i.kind !== "photo")}
      composer={[
        { text: "hey", from: T.heyTypeFrom, to: T.heySent - 0.1 },
        { text: "hey, how are you?", from: T.hayTypeFrom, to: T.haySent - 0.1 },
        { text: "hey, you said I was handsome, why are you ghosting me", from: T.handsomeTypeFrom, to: T.handsomeSent - 0.1 },
      ]}
      statuses={[
        { after: "m1", label: "Delivered", at: T.heyDelivered },
        { after: "m1", label: "Seen", at: T.heySeen },
        { after: "m2", label: "Delivered", at: T.hayDelivered },
        { after: "m3", label: "Delivered", at: T.handsomeDelivered },
        { after: "m3", label: "Seen", at: T.handsomeSeen },
        { after: "p1", label: "Delivered", at: T.photoSent + 0.3 },
      ]}
      typing={[
        { start: T.herTypingFrom, end: T.chopped - 0.05 },
        { start: T.herReplyTypingFrom, end: T.herReply - 0.05 },
      ]}
    />
  </div>
);

/** One of her messages as a sticker over a shot (the screenshot people put on their TikToks). */
const Sticker: React.FC<{ text: string; at: number; t: number; top: number }> = ({ text, at, t, top }) => {
  const k = spring(t - at, "ui");
  if (t < at) return null;
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top, display: "flex", justifyContent: "flex-start", transform: `scale(${(0.9 + 0.1 * k).toFixed(4)}) rotate(-1.5deg)`, transformOrigin: "20% 100%", opacity: Math.min(1, k * 1.5) }}>
      <div style={{ maxWidth: 780, background: "#EBEBEB", color: INK, fontFamily: GEIST, fontSize: 56, lineHeight: 1.22, padding: "26px 34px", borderRadius: "36px 36px 36px 10px", boxShadow: "0 18px 50px rgba(0,0,0,0.35)" }}>{text}</div>
    </div>
  );
};

// ── the hook title (top): the promise in the first second ─────────────────────────────────────────────────────
const HookTitle: React.FC<{ t: number }> = ({ t }) => {
  if (t > T.hookOut) return null;
  const k = spring(t - 0.15, "headline");
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", justifyContent: "center", opacity: Math.min(1, k * 1.5), transform: `translateY(${((1 - k) * 30).toFixed(2)}px)` }}>
      <div style={{ background: WHITE, color: INK, fontFamily: GEIST, fontWeight: 500, fontSize: 60, letterSpacing: "-0.02em", padding: "18px 30px 22px", borderRadius: 22, boxShadow: "0 12px 34px rgba(0,0,0,0.3)" }}>
        storytime: she called me <span style={{ fontWeight: 600 }}>chopped</span>
      </div>
    </div>
  );
};

// ── the real app, on Apple's real bezel (straight on, fades only, words beside it, never on it) ───────────────
const App: React.FC<{ t: number }> = ({ t }) => {
  const u = t - T.app;
  const push = track(u, 1, [{ t: 0.4, v: 1.06, spring: "camera" }]);
  return (
    <AbsoluteFill style={{ background: ANGORA }}>
      {APP_CLIPS.map((c, i) => {
        const a = i === 0 ? 1 : expoInOut(progress(t, c.at - FADE / 2, FADE));
        const next = APP_CLIPS[i + 1];
        const gone = next ? expoInOut(progress(t, next.at + FADE / 2, 0.01)) : 0;
        if (t < c.at - FADE / 2 || gone >= 1) return null;
        return (
          <AbsoluteFill key={c.id} style={{ opacity: a }}>
            {has(c.id) ? (
              <Sequence from={Math.round((c.at - T.app) * 60)} layout="none">
                <Device model="iphone-17-pro-max" color="silver" width={660} x={540} y={1110} scale={push} screen={{ id: c.id, from: c.from }} />
              </Sequence>
            ) : (
              <div style={{ position: "absolute", left: 540 - 300, top: 1080 - 640, width: 600, height: 1280, borderRadius: 80, overflow: "hidden" }}>
                <Placeholder label={`app: ${c.note}`} dark={false} />
              </div>
            )}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

// ── the end card ──────────────────────────────────────────────────────────────────────────────────────────────
const zeeEnd: ZeeCue[] = [{ at: 0, emo: "cheer" }];
const End: React.FC<{ t: number }> = ({ t }) => {
  const u = t - T.end;
  const k = spring(u - 0.05, "panel");
  const peek = spring(u - 0.55, "mascot");
  const zf = has("zee.cheer.intro.v1") ? zeeFrame(zeeEnd, Math.floor(Math.max(0, u - 0.55) * 30)) : null;
  const markW = 230;
  return (
    <AbsoluteFill style={{ background: WHITE }}>
      <div style={{ position: "absolute", left: 540 - markW / 2, top: 420, width: markW, height: markW, opacity: Math.min(1, k * 1.4), transform: `scale(${(0.92 + 0.08 * k).toFixed(4)})` }}>
        <Img src={src("brand.curate.splash-mark.v1")} style={{ position: "absolute", width: markW / (482 / 1152), height: markW / (482 / 1152), left: -(markW / (482 / 1152) - markW) / 2, top: -(markW / (482 / 1152) - markW) / 2 }} />
      </div>
      <KeyLine text={"*Curate.*\nGet un-chopped."} at={T.end + 0.2} size={104} align="center" stagger={0.08} style={{ left: 0, width: 1080, top: 700 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 990, display: "flex", justifyContent: "center", opacity: expoOut(progress(u, 0.55, 0.3)) }}>
        <div style={{ fontFamily: GEIST, fontWeight: 500, fontSize: 44, color: "#383838", padding: "16px 40px", borderRadius: 999, border: "3px solid #DDDDDD", background: WHITE }}>On the App Store</div>
      </div>
      {zf ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1500, overflow: "hidden" }}>
          <Img src={zf} style={{ position: "absolute", left: 540 - 260, top: 1500 - 520 * 0.66 * peek + 30, width: 520, height: 520 }} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 300, right: 300, top: 1500, height: 3, background: "#DDDDDD", opacity: peek }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1540, textAlign: "center", fontFamily: GEIST, fontSize: 26, color: FASHION, opacity: expoOut(progress(u, 0.8, 0.3)) }}>Jake is a fictional character. AI-generated people.</div>
    </AbsoluteFill>
  );
};

// ── the film ──────────────────────────────────────────────────────────────────────────────────────────────────
export const SkitChopped: React.FC<z.infer<typeof schema>> = ({ music, volume, voVolume, sfxVolume }) => {
  useBrandFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const S = (a: number, b: number) => t >= a && t < b;
  // thread placement per shot
  const threadOn = S(T.threadIn, T.facepalm) || S(T.pacing, T.nothing2 + 0.5) || S(T.typingStill, T.jawDrop) || S(T.replyThread, T.beaming);
  const threadRise = spring(t - T.threadIn, "panel");
  // the chopped punch-in: the camera pushes onto her bubble, the room darkens
  const punch = expoInOut(progress(t, T.chopped, 0.35));
  const shake = t >= T.chopped && t < T.chopped + 0.5 ? Math.exp(-(t - T.chopped) / 0.08) * 10 : 0;
  const threadScale = 1 + 0.12 * punch;
  const threadY = 640 + (1 - threadRise) * 1300 + noise1(7, t * 40) * shake;
  const capTop = threadOn || S(T.search, T.app) ? 290 : S(T.app, T.reveal) ? 150 : 1240;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* picture */}
      {S(0, T.hookOut) ? <Video k="hook" t={t} from={0} /> : null}
      {S(T.couch, T.facepalm) ? <Still k="s02" t={t} from={T.couch} dim={0.18} /> : null}
      {S(T.facepalm, T.pacing) ? <Still k="s03" t={t} from={T.facepalm} cam={(u) => ({ dolly: track(u, 0, [{ t: 0, v: 0.14, spring: "camera" }]) })} /> : null}
      {S(T.pacing, T.typingStill) ? <Still k="s04" t={t} from={T.pacing} dim={0.18} cam={(u) => ({ x: track(u, -0.03, [{ t: 0, v: 0.03, spring: "camera" }]), dolly: 0.04 })} /> : null}
      {S(T.typingStill, T.jawDrop) ? <Still k="s05" t={t} from={T.typingStill} dim={0.15 + 0.35 * punch} blur={6 * punch} cam={(u) => ({ dolly: track(u, 0, [{ t: 0, v: 0.12, spring: "camera" }]) })} /> : null}
      {S(T.jawDrop, T.search) ? <Video k="jaw" t={t} from={T.jawDrop} /> : null}
      {S(T.search, T.app + FADE) ? <Still k="s07" t={t} from={T.search} dim={0.25} /> : null}
      {S(T.app - FADE / 2, T.reveal) ? (
        <AbsoluteFill style={{ opacity: expoInOut(progress(t, T.app - FADE / 2, FADE)) }}>
          <App t={t} />
        </AbsoluteFill>
      ) : null}
      {S(T.reveal, T.replyThread + 0.4) ? <Video k="reveal" t={t} from={T.reveal} /> : null}
      {S(T.replyThread, T.beaming) ? <Still k="s08" t={t} from={T.replyThread} blur={10} dim={0.35} /> : null}
      {S(T.beaming, T.end) ? <Still k="s09" t={t} from={T.beaming} cam={(u) => ({ dolly: track(u, 0, [{ t: 0, v: 0.12, spring: "camera" }]) })} /> : null}
      {S(T.end, TOTAL_SEC + 1) ? <End t={t} /> : null}

      {/* the thread and the cards */}
      {threadOn ? <Thread t={t} y={S(T.replyThread, T.beaming) ? 640 : threadY} scale={S(T.typingStill, T.jawDrop) ? threadScale : 1} /> : null}
      <LaterCard label="2 hours later" at={T.twoHours} until={T.twoHours + 1.0} style={{ left: 0, width: 1080, top: 470, textAlign: "center" }} />
      <LaterCard label="1 day later" at={T.oneDay} until={T.twoDays - 0.08} style={{ left: 0, width: 1080, top: 470, textAlign: "center" }} />
      <LaterCard label="2 days later" at={T.twoDays} until={T.facepalm - 0.1} style={{ left: 0, width: 1080, top: 470, textAlign: "center" }} />
      <LaterCard label="2 more hours" at={T.twoMoreHours} until={T.twoMoreHours + 1.1} style={{ left: 0, width: 1080, top: 470, textAlign: "center" }} />
      <LaterCard label="2 days later" at={T.twoDaysLater} until={T.twoDaysLater + 1.0} style={{ left: 0, width: 1080, top: 470, textAlign: "center" }} />
      {S(T.jawDrop, T.search) ? <Sticker text={HER_CHOPPED} at={T.jawDrop + 0.05} t={t} top={260} /> : null}
      {S(T.beaming, T.end) ? <Sticker text={HER_YES} at={T.beaming + 0.05} t={t} top={240} /> : null}
      {S(T.search, T.app) ? (
        <SearchScreen
          t={t - T.search}
          style={{ left: 70, top: 560 }}
          width={940}
          height={900}
          query="how to not look chopped"
          typeFrom={T.searchTypeFrom - T.search}
          typeTo={T.searchTypeTo - T.search}
          results={[
            { kind: "web", source: "a style forum", title: "Am I chopped? (rate my fit)", snippet: "bro the cargo shorts have to go" },
            { kind: "web", source: "a menswear blog", title: "Why your outfits don't work, and how to fix it" },
            { kind: "app", name: "Curate", line: "Your stylist, from your own closet", mark: "brand.curate.logo-mark.v1" },
          ]}
          resultsDelay={0.2}
          every={0.22}
          tapOn={2}
          tapAt={T.curateTap - T.search}
        />
      ) : null}
      <HookTitle t={t} />
      {t < T.end ? <Captions t={t} top={capTop} light={S(T.app, T.reveal)} /> : null}
      {t < T.end ? <Grain seed={0x5c1} amount={0.04} /> : null}

      {/* sound: the voice, two tracks, the designed hits */}
      {has(VO) ? <Audio src={src(VO)} volume={voVolume} /> : null}
      {music ? (
        <Sequence from={0} durationInFrames={Math.round(MUSIC_A.until * fps)} layout="none">
          <Audio src={src(MUSIC_A.id)} trimBefore={Math.round(MUSIC_A.fromSec * fps)} volume={(f) => volume * Math.min(1, f / 12)} />
        </Sequence>
      ) : null}
      {music ? (
        <Sequence from={Math.round(MUSIC_B.at * fps)} durationInFrames={Math.round((MUSIC_B.until - MUSIC_B.at) * fps)} layout="none">
          <Audio src={src(MUSIC_B.id)} trimBefore={Math.round(MUSIC_B.fromSec * fps)} volume={(f) => volume * Math.min(1, f / 30) * Math.min(1, Math.max(0, (MUSIC_B.until - MUSIC_B.at - f / fps) / 0.8))} />
        </Sequence>
      ) : null}
      {has(SFX) ? <Audio src={src(SFX)} volume={sfxVolume} /> : null}
    </AbsoluteFill>
  );
};
