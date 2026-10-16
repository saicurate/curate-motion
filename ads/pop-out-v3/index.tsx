import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Freeze, Img, OffthreadVideo, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { C, frameSrc, GEIST, has, src, useBrandFonts, useFrameBox } from "../../motion";
import { DirectionalBlur, SubframeBlur, samplesFor } from "../../motion/Blur";
import { StableImg } from "../../motion/StableImg";
import { expoOut, progress, spring, springVel, track, trackVel, type Key } from "../../motion/springs";
import { FOOTAGE, FROM_SEC, LENGTH, musicGain, T } from "./timeline";

// Pop out v3: "Your whole closet is already in your camera roll; Curate pulls it out."
// Built by the studio process (.claude/skills/motion-reel): brief.md → style_guide.md → shotlist.md
// (G2) → stills per shot (G3) → animatic (G4) → full pass (G5) → formats (G6).
// STATUS: G5. Every shot built per the shot list and critiqued on its stills over 6 rounds (G3,
// reviews/pop-out-v3/2026-10-15/round-1…6; fixes marked `G3 fix (round N, …)`), then in motion
// (G4/G5, reviews/pop-out-v3/2026-10-16/round-7…; fixes marked `G4 fix` / `G5 fix`). The music bed
// arrives at G4, the designed sound (sound.ts, motion/sound) at G5.
//
// Everything is a pure function of t = frame / fps (springs from motion/springs, no timers, no
// Math.random), so it renders the same at 60 fps, at 30 (App Store), in any order.

export const schema = z.object({
  format: FormatId,
  length: z.number(),
  track: z.string(),
  fromSec: z.number().nonnegative(),
  volume: z.number().min(0).max(1),
  /** Designed sound gain (sfx.curate.pop-out-v3-sound.v2: kicks, riser, hits; motion/sound, G5). */
  sfxVolume: z.number().min(0).max(1),
  /** Max sub-frame samples on the fastest moves (motion blur that doesn't echo). */
  maxSamples: z.number().int().min(1).max(16),
  /** Floor on the samples (benchmarks only: 16 forces the worst case everywhere). */
  minSamples: z.number().int().min(1).max(16),
});
export type Props = z.infer<typeof schema>;
export const defaults: Omit<Props, "format" | "length"> = { track: "music.mixkit.cat-walk-arulo.v1", fromSec: FROM_SEC, volume: 0.64, sfxVolume: 0.6, maxSamples: 16, minSamples: 1 };

// ── the palette (style_guide.md): the brand ramp around the app; the app keeps its own colours ──
const INK = "#181818"; // Primary Black: key phrases
const WINTER = "#656565"; // Winter Gray: the rest of a line
const ANGORA = "#F6F6F6"; // Angora White: the ground
const APP = C.appGround; // #F4F4F4, the app's own screen ground (only inside the phone)

// ── the world: her camera roll, 4 across (world px = screen px at zoom 1 on a 1080-wide frame) ──
const PH = { w: 1792, h: 2400 }; // her photos
const TW = 243;
const TH = (TW * PH.h) / PH.w; // 325.5
const GAP = 12;
const COLS = 4;
const ROLL_X = 36;
// her ferry photo is on the TOP row, so nothing slides through the line as the camera pulls back;
// the market photo is two rows down, the one the camera glides into
const ROLL = [
  "r01-coffee-shop", "r26-ferry", "r03-brooklyn-street", "r04-park-autumn",
  "r05-office", "r07-rooftop-golden-hour", "r08-beach-day", "r09-mirror-selfie-weekend",
  "r10-night-out", "r11-mirror-selfie-work", "r06-farmers-market", "r13-winter-street",
  "r14-sunday-errands", "r02-subway-platform", "r15-hudson-run", "r16-bookstore",
  "r17-brunch", "r18-office-lobby", "r12-dumbo-walk", "r19-fall-game-day",
  "r20-country-night", "r21-museum-steps", "r22-stoop", "r23-rainy-day",
  "r24-dinner", "r25-cafe-laptop", "r27-chelsea-market", "r28-couch-cozy",
  "r29-gym-mirror", "r30-walk-to-work",
].map((n) => `photo.emma.${n}.v1`);
const tile = (i: number) => ({ x: ROLL_X + (i % COLS) * (TW + GAP), y: Math.floor(i / COLS) * (TH + GAP), w: TW, h: TH });
const FERRY = tile(ROLL.indexOf("photo.emma.r26-ferry.v1"));
const MARKET = tile(ROLL.indexOf("photo.emma.r06-farmers-market.v1"));
const centre = (r: { x: number; y: number; w: number; h: number }) => [r.x + r.w / 2, r.y + r.h / 2] as const;

// The jacket in the ferry photo (photo px, measured for v2): centre (875, 1820), 1180 tall.
const JACKET = "garment.emma.jacket-denim.v1";
const JK = { cx: 875 / PH.w, cy: 1820 / PH.h, h: 1180 / PH.h, aspect: 577 / 744 };

// The phone, in world px, placed so the app's photo card (app px x 345–976, y 629–1479, tilted
// −2.5°, footage.emma.first-piece-lift.v1 at 0.1–0.9 s) lands exactly on the market tile.
const APP_W = 1320;
const APP_H = 2868;
const CARD = { x: 345, y: 629, w: 631, h: 850, rot: -2.5 };
const S = MARKET.w / CARD.w; // world px per app px
const SCREEN = { x: MARKET.x - CARD.x * S, y: MARKET.y - CARD.y * S, w: APP_W * S, h: APP_H * S };
const [PCX, PCY] = centre(SCREEN);

// ── the camera: one virtual camera, world centre + zoom (log), stacked springs (camera class) ──
const HOOK_ZOOM = 720 / TW; // her photo 720 px wide
const PHONE_ZOOM = 730 / SCREEN.w; // the phone's screen 730 px wide
// app px: the middle of "41 pieces from your photos" and the line under it. G3 fix (round 5): x 560 → 600
// so the header's last letters clear the right 15% (TikTok/Reels buttons)
const HEADER = { x: 600, y: 520 };
const ROLL_ZOOM = 0.92;
const ROLL_TOP_ON_SCREEN = 470; // px: clear ground above the roll, where the line sits
const camKeys = (h: number) => {
  // her photo sits a little low (room for the line); G3 fix (round 5): centre 1095 → 1010 px so the
  // lifted jacket's hem stays above the bottom 20% (the platform caption)
  const hookY = centre(FERRY)[1] - (1010 - h / 2) / HOOK_ZOOM;
  const phoneY = PCY - (1095 - h / 2) / PHONE_ZOOM;
  const head = { x: SCREEN.x + HEADER.x * S, y: SCREEN.y + HEADER.y * S };
  const ZOOM_HEAD = 2.05;
  // G3 fix (round 1, defect 3): the real app holds still 6.2–7.85 s, so the camera keeps breathing:
  // a slow push (×1.08) about a point near the phone's top, so the top stays clear of the line
  const PUSH = 1.08;
  const pinY = 420; // screen px that stays put
  const pushY = phoneY + (pinY - h / 2) / PHONE_ZOOM - (pinY - h / 2) / (PHONE_ZOOM * PUSH);
  const x: Key[] = [
    { t: T.home, v: ROLL_X + (COLS * (TW + GAP) - GAP) / 2, spring: "camera" },
    { t: T.intoTile, v: PCX, spring: "camera" },
    { t: T.count41, v: head.x, spring: "camera" },
    { t: 12.4, v: centre(FERRY)[0], spring: { zeta: 1, response: 0.0005 } }, // hidden under the end card: back to frame 0's camera
  ];
  const y: Key[] = [
    { t: T.home, v: (h / 2 - ROLL_TOP_ON_SCREEN) / ROLL_ZOOM, spring: "camera" }, // the roll starts below the line
    { t: T.intoTile, v: phoneY, spring: "camera" },
    { t: T.line2, v: pushY, spring: "camera" },
    { t: T.count41, v: head.y + (h * 0.5 - 760) / ZOOM_HEAD, spring: "camera" },
    { t: 12.4, v: hookY, spring: { zeta: 1, response: 0.0005 } },
  ];
  const z: Key[] = [
    { t: T.home, v: Math.log(ROLL_ZOOM), spring: "camera" },
    { t: T.intoTile, v: Math.log(PHONE_ZOOM), spring: "camera" },
    { t: T.line2, v: Math.log(PHONE_ZOOM * PUSH), spring: "camera" },
    { t: T.count41, v: Math.log(ZOOM_HEAD), spring: "camera" },
    { t: 12.4, v: Math.log(HOOK_ZOOM), spring: { zeta: 1, response: 0.0005 } },
  ];
  return { x0: centre(FERRY)[0], y0: hookY, z0: Math.log(HOOK_ZOOM), x, y, z };
};
const camera = (t: number, h: number) => {
  const k = camKeys(h);
  return { cx: track(t, k.x0, k.x), cy: track(t, k.y0, k.y), zoom: Math.exp(track(t, k.z0, k.z)), vz: trackVel(t, k.z0, k.z), vx: trackVel(t, k.x0, k.x), vy: trackVel(t, k.y0, k.y) };
};

// G3 fix (round 3, defects 2–3): the phone's exit travels only as far as it must to clear the frame
// (v1 of this file: 2400 px, a peak of 230 px a frame).
// G4 fix (round 8, defect 2): 1800 px in 0.4 s still peaked at 173 px a frame: in motion the pushed-in
// screen smeared into bars for 6 frames (the same flaw as the sheet). Now the phone drops 420 px as it
// fades out (0.18 s, exponential), and the mark arrives as it goes: a peak of 40 px a frame.
const OUT_DIST = 420;
const OUT_FADE = 0.18;
// G4 fix (round 7, defect 2: the faint double of "Curate" at 14.33–14.40 s): the lockup and her
// photo no longer scroll the whole frame together (2016 px and 1500 px in 0.4 s, peaks of 194 and
// 144 px a frame: 16 samples sat 6 px apart and the smear's two ends read as two "Curate"s). Now the
// lockup lifts 300 px as it fades out, and her photo rises 480 px as it fades in, 0.1 s
// after it: peaks of 29 and 46 px a frame, one clean smear each.
const LEAVE_DIST = 300;
const LOOP_DIST = 480;
// G4 fix (round 8): the lockup's fade 0.28 → 0.16 s and her photo 0.1 → 0.13 s after it, so no
// trace of "Curate" is left over her photo (round 8's frames 866–869 still showed a 4–10% ghost)
const LEAVE_FADE = 0.16;
const LOOP_IN = T.loopOut + 0.13; // her photo starts back once the lockup has gone
// G4 fix (round 7, defect 1: the sheet's quarter-second smear at 7.9–8.1 s): the review sheet rises
// on a longer panel response (critically damped, no overshoot: still the panel class) so its peak is
// 101 px a frame, not 165, and samples sit ≤ 3.4 px apart; and it rises UNDER the phone's own status
// bar (the recording's status bar is cut off the sheet), so no second "9:41" and island slide up.
const SHEET: { zeta: number; response: number } = { zeta: 1, response: 0.62 };
const STATUS = 200; // app px: the recordings' status bar band (9:41 + the island), identical in both clips

/** The fastest screen speed (px per frame) at t: the camera's zoom and pan, the moving objects. */
const fastest = (t: number, fps: number, h: number) => {
  const c = camera(t, h);
  const pan = Math.hypot(c.vx, c.vy) * c.zoom;
  const zoomEdge = Math.abs(c.vz) * h * 0.6; // an edge 0.6 h from the centre
  const phoneOut = Math.abs(trackVel(t, 0, [{ t: T.phoneOut, v: OUT_DIST, spring: "panel" }]));
  const loopIn = Math.abs(trackVel(t, LOOP_DIST, [{ t: LOOP_IN, v: 0, spring: "panel" }]));
  const leave = Math.abs(springVel(t - T.loopOut, "panel")) * LEAVE_DIST;
  const sheet = Math.abs(springVel(t - T.screenChange, SHEET)) * (SCREEN.h - STATUS * S) * c.zoom;
  const jacket = Math.abs(trackVel(t, 0, [{ t: T.lift, v: 1, spring: "piece" }, { t: T.home, v: 0, spring: "piece" }])) * (FERRY.w * 0.05 + FERRY.h * 0.2) * c.zoom;
  return (pan + zoomEdge + phoneOut + loopIn + leave + sheet + jacket) / fps;
};

// ── pieces of the picture ──
const Photo: React.FC<{ id: string; r: { x: number; y: number; w: number; h: number }; radius: number; opacity?: number; children?: React.ReactNode }> = ({ id, r, radius, opacity = 1, children }) => (
  <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: radius, overflow: "hidden", opacity, background: "#e9e9e9" }}>
    <StableImg src={src(id)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    {children}
  </div>
);

/** Real app footage at an exact source second (real speed: the output clock drives it). */
const Clip: React.FC<{ id: string; sec: number }> = ({ id, sec }) => {
  const { fps } = useVideoConfig();
  return (
    <Freeze frame={Math.max(0, sec * fps)}>
      <OffthreadVideo src={src(id)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    </Freeze>
  );
};

/** A headline: key phrase in Primary Black, the rest in Winter Gray (the brand's signature device). */
const Headline: React.FC<{ lines: { text: string; key?: boolean }[][]; at: number; out?: number; t: number; size: number; left: number; top: number }> = ({ lines, at, out, t, size, left, top }) => {
  const land = spring(t - at, "headline");
  const leave = out === undefined ? 0 : spring(t - out, "ui");
  if (t < at || leave > 0.999) return null;
  return (
    <div style={{ position: "absolute", left, top, fontFamily: GEIST, fontWeight: 500, fontSize: size, lineHeight: 1.08, letterSpacing: "-0.03em" }}>
      {lines.map((ln, i) => {
        const li = spring(t - at - i * 0.06, "headline");
        return (
          <div key={i} style={{ transform: `translateY(${(1 - li) * size * 0.5 - leave * size * 0.4}px)`, opacity: expoOut(Math.min(1, li * 1.4)) * (1 - expoOut(leave)) * Math.min(1, land * 4) }}>
            {ln.map((w, j) => (
              <span key={j} style={{ color: w.key ? INK : WINTER }}>
                {w.text}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { w, h, u, safe } = useFrameBox();
  const t = frame / fps;
  const cam = camera(t, h);
  const toScreen = (style: React.CSSProperties = {}): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    top: 0,
    width: 1,
    height: 1,
    transformOrigin: "0 0",
    transform: `translate(${w / 2}px, ${h / 2}px) scale(${cam.zoom}) translate(${-cam.cx}px, ${-cam.cy}px)`,
    ...style,
  });

  // S1: the jacket lifts (piece) on the drop and settles home on the next downbeat
  const lift = track(t, 0, [
    { t: T.lift, v: 1, spring: "piece" },
    { t: T.home, v: 0, spring: "piece" },
  ]);
  // G3 fix (round 2, defect 1): the cut-out is a flat-lay, not her worn jacket, so at rest it is
  // invisible (frame 0 = frame 899 = just her photo). On the drop it fades up as it lifts (opacity:
  // exponential), from about her jacket's size (×1.2) to in front of the photo (×1.4, right 10%, up 5%:
  // her face stays in view),
  // so it reads as one jacket coming out, not two jackets
  const lift01 = Math.max(0, Math.min(1, lift));
  // G3 fix (round 4): the veil leads, the cut-out follows, so no frame shows two full jackets
  const veil = expoOut(Math.min(1, lift01 / 0.25)) * 0.62;
  const jacketOn = expoOut(Math.min(1, lift / 0.45));
  // the rest of the roll fades in as the camera leaves her photo (opacity: exponential, not a crossfade of scenes)
  // ...and clears away as the phone forms, so the phone is the one thing on screen
  // G3 fix (round 2, defect 3): the rest of the roll clears as the camera STARTS its glide in
  // (3.70 s), not when the phone forms, so the market photo is the one focal point of that beat
  const others = expoOut(progress(t, T.home + 0.15, 0.9)) * (1 - expoOut(progress(t, T.intoTile + 0.08, 0.6)));
  // S3: the market tile becomes the app's card; the phone settles round it (panel)
  const form = spring(t - T.phoneForms, "panel");
  // G3 fix (round 1, defect 2): the real app is under the screen as it forms (its in-point frame
  // held until footageIn), so the growing screen reveals the real app round the card, never an empty phone
  const footOn = t >= T.phoneForms && t < T.phoneOut + 0.8;
  const tileRot = CARD.rot * form;
  // S5: the phone leaves (panel), the world goes; her ferry photo comes back from below (loop)
  const worldOut = track(t, 0, [{ t: T.phoneOut, v: OUT_DIST, spring: "panel" }]);
  // G3 fix (round 3, the loop seam): the panel spring is 0.6 px short of home at f899, and a
  // sub-pixel shift of her detailed photo reads as a seam (diff 2.4 vs a 0.8 step); the last
  // quarter second eases that residual to exactly 0, so frame 899 is frame 0
  const loopTail = 1 - expoOut(progress(t, LENGTH - 0.27, 0.25));
  const loopIn = t >= 12.4 ? track(t, LOOP_DIST, [{ t: LOOP_IN, v: 0, spring: "panel" }]) * loopTail : 0;
  const worldY = t >= 12.4 ? loopIn : worldOut;
  // G4 fix (round 7): her photo fades up as it rises (opacity: exponential), and is fully on (1)
  // from about 14.7 s, so frame 899 is still frame 0
  const worldOpacity = t >= 12.4 ? expoOut(progress(t, LOOP_IN, 0.3)) : 1 - expoOut(progress(t, T.phoneOut, OUT_FADE));
  // ...and a blur along that vertical move joins the sub-frame copies (screen px per frame)
  const worldVy = (t >= 12.4 ? trackVel(t, LOOP_DIST, [{ t: LOOP_IN, v: 0, spring: "panel" }]) * loopTail : trackVel(t, 0, [{ t: T.phoneOut, v: OUT_DIST, spring: "panel" }])) / fps;

  // the screen's rectangle grows from the tile to the whole phone screen as it forms
  const scr = {
    x: MARKET.x + (SCREEN.x - MARKET.x) * form,
    y: MARKET.y + (SCREEN.y - MARKET.y) * form,
    w: MARKET.w + (SCREEN.w - MARKET.w) * form,
    h: MARKET.h + (SCREEN.h - MARKET.h) * form,
  };
  const bezel = 14 * S * form;
  const scrRadius = 6 + (66 * S * 1.6 - 6) * form;
  // inside the phone: footage 1 → (screen change, panel push) → footage 2
  const push = spring(t - T.screenChange, SHEET);
  const sheetVy = (springVel(t - T.screenChange, SHEET) * (SCREEN.h - STATUS * S)) / fps;
  const sheetR = 66 * S * 1.6 * Math.min(1, (1 - push) * 4); // the sheet's top corners square up as it lands
  const clipSec = (k: number) => Math.min(FOOTAGE[k].durationSec - 2 / fps, FOOTAGE[k].from + Math.max(0, t - FOOTAGE[k].start));

  return (
    <AbsoluteFill style={{ background: ANGORA, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${worldY}px)`, opacity: worldOpacity }}>
        <DirectionalBlur name="world" vx={0} vy={worldVy} max={40}>
        <div style={toScreen()}>
          {/* her camera roll */}
          {ROLL.map((id, i) => {
            const r = tile(i);
            const special = id.endsWith("r26-ferry.v1") || id.endsWith("r06-farmers-market.v1");
            if (special) return null;
            return <Photo key={id} id={id} r={r} radius={6} opacity={others} />;
          })}
          {/* the ferry photo and its jacket */}
          <Photo id="photo.emma.r26-ferry.v1" r={FERRY} radius={6} opacity={t >= 12.4 ? 1 : 1 - expoOut(progress(t, T.intoTile + 0.08, 0.6))}>
            <div style={{ position: "absolute", inset: 0, background: ANGORA, opacity: veil }} />
          </Photo>
          {t < T.intoTile + 0.5 || t >= 12.4 ? (
            <StableImg
              src={src(JACKET, "cutout")}
              style={{
                position: "absolute",
                left: FERRY.x + FERRY.w * JK.cx - (FERRY.h * JK.h * JK.aspect) / 2,
                top: FERRY.y + FERRY.h * JK.cy - (FERRY.h * JK.h) / 2,
                width: FERRY.h * JK.h * JK.aspect,
                height: FERRY.h * JK.h,
                transformOrigin: "50% 60%",
                // out of the photo and toward us: up, a little right, bigger, a hair of tilt (piece class)
                opacity: jacketOn,
                transform: `translate(${lift * FERRY.w * 0.1}px, ${-lift * FERRY.h * 0.05}px) scale(${1.2 + 0.2 * lift}) rotate(${-4 * lift}deg)`,
                filter: `drop-shadow(0 ${1 + 5 * lift}px ${2 + 7 * lift}px rgba(16,20,24,${0.08 + 0.14 * lift}))`,
              }}
            />
          ) : null}
          {/* the phone, formed round the market tile */}
          {t < T.phoneOut + 0.6 ? (
            <div style={{ position: "absolute", left: scr.x - bezel, top: scr.y - bezel, width: scr.w + 2 * bezel, height: scr.h + 2 * bezel, borderRadius: scrRadius + bezel, background: form > 0.001 ? "#111214" : "transparent", boxShadow: form > 0.001 ? `0 ${30 * S}px ${80 * S}px rgba(16,20,24,${0.16 * form})` : undefined }}>
              <div style={{ position: "absolute", left: bezel, top: bezel, width: scr.w, height: scr.h, borderRadius: scrRadius, overflow: "hidden", background: form > 0.001 ? APP : "transparent" }}>
                {footOn && has(FOOTAGE[0].id) ? (
                  <div style={{ position: "absolute", left: SCREEN.x - scr.x, top: SCREEN.y - scr.y, width: SCREEN.w, height: SCREEN.h }}>
                    {/* G3 fix (round 1, defect 1): the review screen rises OVER the flats screen as a
                        sheet (the old one stays, eases back 6% and dims a touch), so two half
                        screens never share the phone and nothing is cut at its edge */}
                    {push < 0.999 ? (
                      <div style={{ position: "absolute", inset: 0 }}>
                        <Clip id={FOOTAGE[0].id} sec={clipSec(0)} />
                        {/* dims below the status bar only, so nothing jumps in brightness when the sheet lands */}
                        <div style={{ position: "absolute", left: 0, right: 0, top: STATUS * S, bottom: 0, background: "#101418", opacity: 0.1 * push }} />
                      </div>
                    ) : null}
                    {t >= T.screenChange && push < 0.999 ? (
                      <div style={{ position: "absolute", left: 0, right: 0, top: STATUS * S, bottom: 0, transform: `translateY(${(1 - push) * (SCREEN.h - STATUS * S)}px)`, borderRadius: `${sheetR}px ${sheetR}px 0 0`, overflow: "hidden", boxShadow: `0 ${-18 * S}px ${60 * S}px rgba(16,20,24,${0.18 * (1 - push)})` }}>
                        {/* G3 fix (round 2, defect 2): a blur along the sheet's own velocity joins the sub-frame copies */}
                        <DirectionalBlur name="sheet" vx={0} vy={sheetVy} max={40}>
                          <div style={{ position: "absolute", left: 0, top: -STATUS * S, width: SCREEN.w, height: SCREEN.h }}>
                            <Clip id={FOOTAGE[1].id} sec={clipSec(1)} />
                          </div>
                        </DirectionalBlur>
                      </div>
                    ) : null}
                    {/* landed: the whole recording, status bar and all (the band is the same pixels as before) */}
                    {push >= 0.999 ? <Clip id={FOOTAGE[1].id} sec={clipSec(1)} /> : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          {/* the market tile, until the real card takes over under it */}
          {t < T.footageIn + 0.07 ? (
            <div
              style={{
                position: "absolute",
                left: MARKET.x,
                top: MARKET.y,
                width: MARKET.w,
                height: MARKET.h,
                transform: `rotate(${tileRot}deg)`,
                opacity: (t < T.home ? 0 : expoOut(progress(t, T.home + 0.15, 0.9))) * (1 - progress(t, T.footageIn, 0.07)),
              }}
            >
              <Photo id="photo.emma.r06-farmers-market.v1" r={{ x: 0, y: 0, w: MARKET.w, h: MARKET.h }} radius={6 + 10 * S * form} />
            </div>
          ) : null}
        </div>
        </DirectionalBlur>
      </div>

      {/* the words (pinned to the screen, never to the camera) */}
      <Headline
        t={t}
        at={T.line1}
        out={T.line1Out}
        size={u * 7.4}
        left={safe.side}
        top={safe.top + u * 3}
        lines={[[{ text: "Your closet is already" }], [{ text: "in your " }, { text: "camera roll.", key: true }]]}
      />
      <Headline t={t} at={T.line2} out={T.line2Out} size={u * 7.4} left={safe.side} top={safe.top + u * 1.5} lines={[[{ text: "Curate " }, { text: "pulls it out.", key: true }]]} />

      {/* the close: the lockup, Zee, then the loop */}
      <EndCard t={t} />
    </AbsoluteFill>
  );
};

const MARK = "brand.curate.splash-mark.v1"; // 1152 px square; the mark spans 482 px of it
const EndCard: React.FC<{ t: number }> = ({ t }) => {
  const { w, h, u } = useFrameBox();
  const { fps } = useVideoConfig();
  if (t < T.phoneOut + 0.05) return null;
  const leave = spring(t - T.loopOut, "panel"); // the lockup lifts away (G4 fix: 300 px, fading) before her photo comes back
  const gone = 1 - expoOut(progress(t, T.loopOut, LEAVE_FADE));
  if (gone <= 0) return null;
  const mark = spring(t - (T.phoneOut + 0.15), "ui"); // G4 fix (round 8): +0.12 → +0.15 s, as the phone has faded
  const name = spring(t - T.name, "headline");
  const cta = spring(t - T.cta, "ui");
  const zee = spring(t - T.zee, "mascot");
  const markW = u * 30;
  const y0 = h * 0.36 - leave * LEAVE_DIST;
  const zeeN = Math.max(0, Math.floor((t - T.zee) * 30));
  const zeeSrc = has("zee.cheer.intro.v1") ? (zeeN < 15 ? frameSrc("zee.cheer.intro.v1", zeeN) : frameSrc("zee.cheer.loop.v1", zeeN - 15)) : null;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${y0 - h * 0.36}px)`, opacity: gone }}>
      <DirectionalBlur name="lockup" vx={0} vy={(-springVel(t - T.loopOut, "panel") * LEAVE_DIST) / fps} max={40}>
      <StableImg src={src(MARK)} style={{ position: "absolute", left: w / 2 - markW / 2 / (482 / 1152), top: h * 0.36 - markW / 2 / (482 / 1152), width: markW / (482 / 1152), height: markW / (482 / 1152), opacity: expoOut(Math.min(1, mark * 1.3)), transform: `scale(${0.9 + 0.1 * mark})` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.36 + markW * 0.62, textAlign: "center", fontFamily: GEIST, fontWeight: 500, fontSize: u * 11, letterSpacing: "-0.035em", color: INK, opacity: expoOut(Math.min(1, name * 1.3)), transform: `translateY(${(1 - name) * u * 3}px)` }}>
        Curate
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.36 + markW * 0.62 + u * 14, textAlign: "center", fontFamily: GEIST, fontWeight: 400, fontSize: u * 5.2, letterSpacing: "-0.01em", color: WINTER, opacity: expoOut(Math.min(1, cta * 1.3)), transform: `translateY(${(1 - cta) * u * 2}px)` }}>
        On the App Store
      </div>
      {zeeSrc && t >= T.zee ? (
        <Img src={zeeSrc} style={{ position: "absolute", left: w / 2 - u * 17, top: h * 0.36 + markW * 0.62 + u * 24, width: u * 34, height: u * 34, transformOrigin: "50% 90%", transform: `scale(${zee})` }} />
      ) : null}
      </DirectionalBlur>
    </div>
  );
};

const SFX = "sfx.curate.pop-out-v3-sound.v2";

export const PopOutV3: React.FC<Props> = ({ track: music, fromSec, volume, sfxVolume, maxSamples, minSamples }) => {
  useBrandFonts();
  const { fps, durationInFrames } = useVideoConfig();
  const { h } = useFrameBox();
  // G4: the music bed (Cat Walk from the drop); G5: + the designed sound on the same clock (sound.ts).
  // Both sit outside SubframeBlur (which renders its children once per sub-frame sample).
  const tail = (fr: number) => Math.min(1, (durationInFrames - fr) / 4); // no click at the loop point
  return (
    <AbsoluteFill style={{ background: ANGORA }}>
      <Audio src={src(music)} trimBefore={Math.round(fromSec * fps)} volume={(fr) => volume * musicGain(fr / fps) * tail(fr)} />
      {has(SFX) ? <Audio src={src(SFX)} volume={(fr) => sfxVolume * tail(fr)} /> : null}
      <SubframeBlur samples={(f) => Math.max(minSamples, Math.min(maxSamples, samplesFor(fastest(f / fps, fps, h), 0.5, 3, 16)))} shutter={0.5}>
        <Scene />
      </SubframeBlur>
    </AbsoluteFill>
  );
};
