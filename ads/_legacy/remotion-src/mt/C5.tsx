import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Ground, Track } from "../lib/Ground";
import { EndCard } from "../lib/Kinetic";
import { Phone } from "../lib/Phone";
import { GarmentShape } from "../lib/shapes";
import { beats, C, clamp, display, inOut, out, shadow } from "../lib/theme";
import { Zee } from "../lib/Zee";

// C5 "See it on you" — motion test. A selfie ring finds her face, the shutter flashes on
// the beat, two pieces fly onto her photo and a curtain reveals the try-on; before/after
// flips on the beat. Cut to "Better Times are Coming" (Alejandro Magaña, Mixkit) from 0:36.5,
// 120 bpm; the song comes back in on the flash.
export const C5_FRAMES = 300;
const b = beats(120, 0.104);

/** A person-shaped silhouette, optionally dressed in the two pieces. */
const Person: React.FC<{ w: number; dressed: number; night?: boolean }> = ({ w, dressed, night = false }) => (
  <div style={{ position: "relative", width: w, height: w * 1.5 }}>
    <div style={{ position: "absolute", left: w * 0.39, top: w * 0.12, width: w * 0.22, height: w * 0.22, borderRadius: "50%", background: night ? "#C9CDD2" : C.strong }} />
    <div style={{ position: "absolute", left: w * 0.3, top: w * 0.37, width: w * 0.4, height: w * 1.2, borderRadius: `${w * 0.16}px ${w * 0.16}px 0 0`, background: night ? "#8B9097" : C.t3 }} />
    {dressed > 0 ? (
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 ${(1 - dressed) * 100}% 0)` }}>
        <GarmentShape kind="trousers" size={w * 0.62} color="#C8C3BC" style={{ position: "absolute", left: w * 0.19, top: w * 0.8 }} />
        <GarmentShape kind="jacket" size={w * 0.66} color={C.ink} style={{ position: "absolute", left: w * 0.17, top: w * 0.3 }} />
      </div>
    ) : null}
  </div>
);

export const C5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── the selfie ring: too far → off to the side → right ──
  const faceS = interpolate(frame, [0, b(1), b(2), b(3)], [0.55, 0.62, 0.95, 1], { ...clamp, easing: inOut });
  const faceX = interpolate(frame, [0, b(1), b(2), b(3)], [0, 160, 110, 0], { ...clamp, easing: inOut });
  const arc = interpolate(frame, [b(2), b(3) + 10], [0, 1], { ...clamp, easing: out });
  // the app's own hint copy (lib/features/gallery_import/domain/selfie_hints.dart)
  const hint = frame < b(2) ? "Come closer" : frame < b(3) ? "Into the circle" : "Perfect ✨";
  const flash = interpolate(frame, [b(4) - 1, b(4) + 1, b(4) + 9], [0, 1, 0], clamp);
  const ringOut = frame >= b(4);

  // ── the try-on ──
  const phoneIn = spring({ frame: frame - b(4), fps, config: { damping: 16, stiffness: 120 } });
  const curtain = interpolate(frame, [b(8), b(9)], [0, 1], { ...clamp, easing: inOut });
  const flips = [b(11), b(12), b(13)];
  const before = flips.some((f, i) => i % 2 === 0 && frame >= f && frame < f + 15);
  const leave = interpolate(frame, [b(15), b(16)], [0, 1], { ...clamp, easing: inOut });
  const W = 660;
  const SW = W - 2 * W * 0.028;

  return (
    <Ground dark={!ringOut}>
      <Track file="mixkit-better-times-are-coming-alejandro-magana.mp3" fromSec={36.5} total={C5_FRAMES} />

      {!ringOut ? (
        <>
          <div style={{ position: "absolute", left: 140, top: 420, width: 800, height: 800, borderRadius: "50%", overflow: "hidden", background: "radial-gradient(circle at 50% 40%, #3a3b3e, #151617)" }}>
            <div style={{ position: "absolute", left: 400 - 260 + faceX, top: 120, transform: `scale(${faceS})`, transformOrigin: "50% 40%" }}>
              <Person w={520} dressed={0} night />
            </div>
          </div>
          <svg width={880} height={880} viewBox="0 0 880 880" style={{ position: "absolute", left: 100, top: 380 }}>
            <circle cx={440} cy={440} r={420} stroke="rgba(255,255,255,0.18)" strokeWidth={10} fill="none" />
            <circle cx={440} cy={440} r={420} stroke="#FFFFFF" strokeWidth={10} fill="none" strokeDasharray={2 * Math.PI * 420} strokeDashoffset={(1 - arc) * 2 * Math.PI * 420} transform="rotate(-90 440 440)" strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1340, display: "flex", justifyContent: "center" }}>
            <div style={{ padding: "22px 44px", borderRadius: 50, background: "rgba(255,255,255,0.12)", ...display(48, "#F6F7F7"), fontWeight: 400, letterSpacing: "-0.02em" }}>{hint}</div>
          </div>
          <Zee cues={[{ at: 0, emo: "curious", cut: true }, { at: b(3), emo: "excited" }]} size={300} shadow={false} style={{ left: 720, top: 230 }} />
        </>
      ) : null}

      {ringOut && leave < 1 ? (
        <Phone width={W} y={interpolate(phoneIn, [0, 1], [1500, 1000]) - leave * 200} rx={(1 - phoneIn) * 20} ry={-6 * Math.sin(frame / 50)} scale={interpolate(phoneIn, [0, 1], [1.25, 1]) * (1 - leave * 0.3)} opacity={1 - leave}>
          {/* her photo */}
          <div style={{ position: "absolute", left: 40, top: 160, width: SW - 80, height: 900, borderRadius: 40, overflow: "hidden", background: `linear-gradient(160deg, ${C.you}, #D3D6DA)` }}>
            <div style={{ position: "absolute", left: (SW - 80) / 2 - 260, top: 60 }}>
              <Person w={520} dressed={before ? 0 : curtain} />
            </div>
            {/* the curtain: a soft white band sweeping down */}
            {curtain > 0 && curtain < 1 ? (
              <div style={{ position: "absolute", left: 0, right: 0, top: `${curtain * 100 - 12}%`, height: "12%", background: "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.9), rgba(255,255,255,0))" }} />
            ) : null}
          </div>
          {/* the two slots */}
          {[0, 1].map((i) => {
            const at = b(6 + i);
            const s = spring({ frame: frame - at, fps, config: { damping: 11, stiffness: 180 } });
            return (
              <div key={i} style={{ position: "absolute", left: 40 + i * ((SW - 100) / 2 + 20), top: 1090, width: (SW - 100) / 2, height: 180, borderRadius: 30, background: C.card, boxShadow: shadow.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {frame >= at ? (
                  <GarmentShape kind={i === 0 ? "jacket" : "trousers"} size={150} color={i === 0 ? C.ink : "#C8C3BC"} style={{ transform: `translateY(${(1 - s) * -500}px) scale(${interpolate(s, [0, 1], [1.8, 1])})` }} />
                ) : null}
              </div>
            );
          })}
        </Phone>
      ) : null}
      {frame >= b(9) && leave < 1 ? <Zee cues={[{ at: b(9), emo: "love" }]} size={360} style={{ left: 660, top: 1440, opacity: 1 - leave }} /> : null}

      <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", opacity: flash }} />
      <EndCard at={b(16)} line="See it on you." />
    </Ground>
  );
};
