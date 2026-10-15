import React from "react";
import { interpolate, Sequence, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import INDEX from "../catalog/index.json";
import VOICE_CONFIG from "../config/voice.json";
import type { Script, VoiceOverride } from "../schemas/voice.ts";
import { src } from "./assets";
import { useFrameBox } from "./formats";
import { planNarration, resolveVoice, type IndexLike, type NarrationPlan, type PlannedLine } from "./narration-plan.ts";
import { C, clamp, GEIST, out, shadow } from "./theme";

// Narration: the voiceover as config (decisions/0009). An ad never decides captions vs human vs
// TTS in code: it builds a plan from config/voice.json + its ad.json › voice + the render's
// override, lays its scenes on plan.scenes, and drops <Narration plan={…}/> on top.
// <Narration> plays each line's audio (a human take or a generated TTS clip) and draws the
// captions in the brand's key-phrase style; the music ducks through duckGain() (Track's `duck`).

/** Build the plan for an ad. Call it once per render (in the component and in calculateMetadata). */
export const narrationPlan = (o: { script: Script; adVoice?: VoiceOverride; override?: VoiceOverride; scenes?: string[]; fps?: number }): NarrationPlan =>
  planNarration({
    script: o.script,
    voice: resolveVoice(VOICE_CONFIG, o.adVoice, o.override),
    index: INDEX.assets as unknown as IndexLike[],
    scenes: o.scenes,
    fps: o.fps,
  });

/** One caption line: body text in the body colour, key phrases in the key colour and weight. */
const Line: React.FC<{ line: PlannedLine; plan: NarrationPlan }> = ({ line, plan }) => {
  const frame = useCurrentFrame();
  const { w, h, u, safe } = useFrameBox();
  const st = plan.voice.captions.style;
  const t = frame - line.from;
  const o = interpolate(t, [0, 4, line.durationInFrames - 4, line.durationInFrames], [0, 1, 1, 0], clamp);
  const dy = interpolate(t, [0, 8], [u * 1.2, 0], { ...clamp, easing: out });
  // split the text into runs, key phrases marked
  const runs: { s: string; key: boolean }[] = [];
  let rest = line.text;
  while (rest.length) {
    const hits = line.keyPhrases.map((k) => ({ k, i: rest.indexOf(k) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i);
    if (!hits.length) {
      runs.push({ s: rest, key: false });
      break;
    }
    const { k, i } = hits[0];
    if (i > 0) runs.push({ s: rest.slice(0, i), key: false });
    runs.push({ s: k, key: true });
    rest = rest.slice(i + k.length);
  }
  const size = st.size * u;
  const block = (w * st.maxWidth) / 100;
  const y = st.position === "lower" ? { bottom: safe.bottom + u * 2 } : { top: safe.top + u * 2 };
  return (
    <div style={{ position: "absolute", left: (w - block) / 2, width: block, ...y, display: "flex", justifyContent: "center", opacity: o, transform: `translateY(${dy}px)`, maxHeight: h * 0.3 }}>
      <div
        style={{
          fontFamily: GEIST,
          fontWeight: st.bodyWeight,
          fontSize: size,
          lineHeight: 1.28,
          letterSpacing: "-0.01em",
          color: C[st.bodyColour],
          textAlign: "center",
          ...(st.plate === "card" ? { background: "rgba(255,255,255,0.9)", padding: `${size * 0.32}px ${size * 0.62}px`, borderRadius: size * 0.5, boxShadow: shadow.card } : {}),
        }}
      >
        {runs.map((r, i) => (
          <span key={i} style={r.key ? { color: C[st.keyColour], fontWeight: st.keyWeight } : undefined}>
            {r.s}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Plays the plan's audio and (when burnIn) draws its captions. Put it last, above the picture. */
export const Narration: React.FC<{ plan: NarrationPlan; volume?: number }> = ({ plan, volume = 1 }) => {
  const { u } = useFrameBox();
  return (
    <>
      {plan.lines.map((l) =>
        l.audio ? (
          <Sequence key={`a-${l.id}`} from={l.from} durationInFrames={l.durationInFrames} layout="none">
            <Audio src={src(l.audio.id)} trimBefore={Math.round(l.audio.trimBeforeSec * plan.fps)} volume={volume} />
          </Sequence>
        ) : null,
      )}
      {plan.voice.captions.burnIn
        ? plan.lines.map((l) => (
            <Sequence key={`c-${l.id}`} from={l.from} durationInFrames={l.durationInFrames} layout="none">
              <Line line={{ ...l, from: 0 }} plan={plan} />
            </Sequence>
          ))
        : null}
      {plan.previewOnly ? (
        // A preview voice (macOS say) must never pass for a release cut.
        <div style={{ position: "absolute", top: u * 2, right: u * 2, fontFamily: GEIST, fontSize: u * 2.2, color: C.t2, background: "rgba(255,255,255,0.8)", padding: `${u * 0.5}px ${u * 1.2}px`, borderRadius: u }}>
          Preview voice · not for release
        </div>
      ) : null}
    </>
  );
};
