// motion/sound: designed sound, synthesised in code on the picture's clock (decisions/0011, proposed).
// Grown out of Pop out v2's sound.ts. Pure Node, no imports from React or Remotion, so an ad's
// sound.ts (run with `node ads/<ad>/sound.ts <out.wav>`) and its index.tsx share one beat map.
//
//   const s = createSound({ durationSec: 15 });     // a stereo bus at 48 kHz, seeded noise
//   s.kick(0.0, 0.55);                              // seconds, gain
//   s.hit("whoosh", 1.38);                          // a named hit (HIT_KINDS)
//   s.riser(9.2, 11.1, 0.42);                       // a riser that cuts dead on t1
//   s.writeWav("out.wav", { peakDb: -3 });          // peak-normalised 16-bit WAV
//
// Everything is deterministic: the same calls in the same order write the same bytes (the noise is
// a seeded xorshift stream). Loudness of the final mix (music + this) is measured by tools/critic
// (target −14 LUFS integrated, true peak ≤ −1 dBTP); set the ad's volumes from that, not by ear.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const HIT_KINDS = ["pop", "draw", "flood", "type", "whoosh", "snap", "thud", "flips", "swish", "impact", "rise", "suck", "chime", "tick", "settle", "glide", "land"] as const;
export type HitKind = (typeof HIT_KINDS)[number];
/** A cue on the picture's clock: `t` seconds from frame 0. */
export type Cue = { t: number; kind: HitKind; gain?: number; pan?: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const env = (t: number, a: number, d: number) => (t < a ? t / a : Math.exp(-(t - a) / d));

export const createSound = ({ durationSec, sr = 48000, seed = 0x5eed1234 }: { durationSec: number; sr?: number; seed?: number }) => {
  const SR = sr;
  const LEN = Math.round(durationSec * SR);
  const L = new Float32Array(LEN);
  const R = new Float32Array(LEN);

  // seeded noise (xorshift32), one stream per bus: same calls in the same order = same file
  let s = seed;
  const rnd = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296) * 2 - 1;
  };

  /** A biquad (RBJ cookbook) whose cutoff / centre can move every sample. */
  const biquad = (type: "lp" | "hp" | "bp") => {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    return (x: number, fc: number, q: number) => {
      const w = (2 * Math.PI * Math.min(fc, SR * 0.45)) / SR;
      const a = Math.sin(w) / (2 * q);
      const c = Math.cos(w);
      let b0: number, b1: number, b2: number;
      if (type === "lp") [b0, b1, b2] = [(1 - c) / 2, 1 - c, (1 - c) / 2];
      else if (type === "hp") [b0, b1, b2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
      else [b0, b1, b2] = [a, 0, -a];
      const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
      const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      return y;
    };
  };

  /** Write a mono voice into the bus at t0 (s), `dur` s long, panned −1..1 (equal power). */
  const voice = (t0: number, dur: number, pan: number, gain: number, fn: (t: number, u: number) => number) => {
    const s0 = Math.round(t0 * SR);
    const n = Math.round(dur * SR);
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < n; i++) {
      const k = s0 + i;
      if (k < 0 || k >= LEN) continue;
      const t = i / SR;
      const v = fn(t, t / dur);
      L[k] += v * gl;
      R[k] += v * gr;
    }
  };

  // ── primitives ──
  const kick = (t0: number, g: number) => {
    let ph = 0;
    const hp = biquad("hp");
    voice(t0, 0.42, 0, g, (t) => {
      const f = 46 + 74 * Math.exp(-t / 0.035); // 120 → 46 Hz
      ph += (2 * Math.PI * f) / SR;
      const body = Math.sin(ph) * env(t, 0.002, 0.13);
      const click = hp(rnd(), 3000, 0.7) * Math.exp(-t / 0.004) * 0.25;
      return Math.tanh(1.4 * (body + click)) * 0.9;
    });
  };
  const noiseSweep = (t0: number, dur: number, f0: number, f1: number, q: number, g: number, pan0: number, pan1: number, shape: "bell" | "rise" | "fall") => {
    const bp = biquad("bp");
    const slices = 12; // the pan moves across the sweep in short slices
    for (let k = 0; k < slices; k++) {
      const a = k / slices;
      const b = (k + 1) / slices;
      voice(t0 + a * dur, (b - a) * dur, lerp(pan0, pan1, a), g, (t) => {
        const u = a + t / dur;
        const fc = f0 * Math.pow(f1 / f0, u);
        const e = shape === "bell" ? Math.sin(Math.PI * u) ** 2 : shape === "rise" ? u ** 2.2 : Math.exp(-u * 5);
        return bp(rnd(), fc, q) * e * 2.2;
      });
    }
  };
  const tone = (t0: number, dur: number, f0: number, f1: number, a: number, d: number, g: number, pan = 0) => {
    let ph = 0;
    voice(t0, dur, pan, g, (t, u) => {
      ph += (2 * Math.PI * (f0 * Math.pow(f1 / f0, u))) / SR;
      return Math.sin(ph) * env(t, a, d);
    });
  };
  const click = (t0: number, g: number, fc: number, pan = 0) => {
    const bp = biquad("bp");
    voice(t0, 0.03, pan, g, (t) => bp(rnd(), fc, 1.2) * Math.exp(-t / 0.0045) * 3);
  };

  /** A riser from t0 to t1 (s): filtered noise and a sine, rising, cut dead on t1. */
  const riser = (t0: number, t1: number, g = 0.42) => {
    const dur = t1 - t0;
    const bp = biquad("bp");
    let ph = 0;
    voice(t0, dur, 0, g, (_t, u) => {
      const fc = 300 * Math.pow(20, u);
      ph += (2 * Math.PI * (220 * Math.pow(4, u))) / SR;
      const e = Math.pow(u, 2.4);
      return (bp(rnd(), fc, 2) * 2.4 + Math.sin(ph) * 0.35) * e;
    });
  };

  /** A named hit at t (s). `gain` scales it (1 = as designed). */
  const hit = (kind: HitKind, t: number, gain = 1) => {
    const G = gain;
    switch (kind) {
      case "pop": // a soft upward blip with a click: something leaves a surface
        tone(t, 0.12, 380, 980, 0.002, 0.035, 0.32 * G);
        click(t, 0.25 * G, 4200);
        break;
      case "draw": // a line being drawn: a short bright scribble
        noiseSweep(t, 0.16, 2400, 7200, 6, 0.18 * G, -0.3, 0.3, "bell");
        break;
      case "flood": // a picture floods out of a shape
        noiseSweep(t - 0.04, 0.24, 300, 5000, 1.4, 0.32 * G, -0.4, 0.4, "rise");
        tone(t + 0.16, 0.18, 220, 180, 0.002, 0.06, 0.25 * G);
        break;
      case "type": // a crisp key for a line of type
        click(t, 0.3 * G, 5200, -0.1);
        tone(t, 0.06, 2400, 2200, 0.001, 0.012, 0.12 * G);
        break;
      case "whoosh":
        noiseSweep(t - 0.12, 0.34, 250, 3600, 1.1, 0.38 * G, -0.7, 0.7, "bell");
        break;
      case "snap":
        click(t, 0.45 * G, 3000);
        tone(t, 0.05, 1300, 1100, 0.001, 0.01, 0.16 * G);
        break;
      case "thud":
        tone(t, 0.25, 90, 55, 0.002, 0.07, 0.5 * G);
        noiseSweep(t, 0.1, 400, 200, 0.8, 0.2 * G, 0, 0, "fall");
        break;
      case "flips": // tiles turning: a fast patter across the stereo field
        for (let i = 0; i < 14; i++) click(t + i * 0.024 + Math.abs(rnd()) * 0.006, (0.16 + 0.06 * Math.abs(rnd())) * G, 2600 + 1800 * Math.abs(rnd()), lerp(-0.8, 0.8, i / 13));
        break;
      case "swish": // a scroll
        noiseSweep(t - 0.02, 0.2, 900, 2600, 2.2, 0.2 * G, 0.2, -0.2, "bell");
        break;
      case "impact":
        tone(t, 0.6, 62, 38, 0.002, 0.2, 0.75 * G);
        noiseSweep(t, 0.3, 2400, 300, 0.7, 0.5 * G, 0, 0, "fall");
        click(t, 0.4 * G, 2000);
        break;
      case "rise":
        tone(t - 0.05, 0.32, 260, 780, 0.12, 0.2, 0.16 * G, 0.2);
        noiseSweep(t - 0.05, 0.32, 600, 5200, 1.6, 0.26 * G, -0.3, 0.3, "rise");
        break;
      case "suck": // a reversed whoosh that lands on t
        noiseSweep(t - 0.3, 0.3, 5200, 400, 1.2, 0.4 * G, 0.5, -0.5, "rise");
        break;
      case "chime": // two clean partials: an end title's button
        tone(t, 1.2, 1318.5, 1318.5, 0.003, 0.35, 0.12 * G, -0.2);
        tone(t + 0.04, 1.2, 1975.5, 1975.5, 0.003, 0.3, 0.08 * G, 0.2);
        break;
      case "tick":
        click(t, 0.2 * G, 3600, 0.2);
        break;
      case "settle": // a soft low tap: a panel or phone coming to rest (no click, no hiss)
        tone(t, 0.22, 140, 96, 0.004, 0.06, 0.34 * G);
        break;
      case "glide": // a long, low air move under a camera glide (starts 0.25 s early, peaks on t)
        noiseSweep(t - 0.25, 0.7, 180, 1400, 0.9, 0.22 * G, -0.35, 0.35, "bell");
        break;
      case "land": // a headline landing: a tight, dry knock
        click(t, 0.32 * G, 2400);
        tone(t, 0.09, 520, 420, 0.001, 0.025, 0.2 * G);
        break;
    }
  };

  /** Peak-normalise to `peakDb` dBFS and write a 16-bit stereo WAV. Returns the gain applied. */
  const writeWav = (out: string, { peakDb = -3 }: { peakDb?: number } = {}) => {
    let peak = 0;
    for (let i = 0; i < LEN; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    const norm = Math.pow(10, peakDb / 20) / Math.max(peak, 1e-9);
    const buf = Buffer.alloc(44 + LEN * 4);
    buf.write("RIFF", 0);
    buf.writeUInt32LE(36 + LEN * 4, 4);
    buf.write("WAVEfmt ", 8);
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20);
    buf.writeUInt16LE(2, 22);
    buf.writeUInt32LE(SR, 24);
    buf.writeUInt32LE(SR * 4, 28);
    buf.writeUInt16LE(4, 32);
    buf.writeUInt16LE(16, 34);
    buf.write("data", 36);
    buf.writeUInt32LE(LEN * 4, 40);
    for (let i = 0; i < LEN; i++) {
      buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4);
      buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4);
    }
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, buf);
    return norm;
  };

  return { SR, LEN, L, R, rnd, biquad, voice, kick, noiseSweep, tone, click, riser, hit, writeWav };
};
export type Sound = ReturnType<typeof createSound>;

/**
 * The usual score for an ad: a soft kick on every beat, a riser into the big moment, and a hit on
 * every cue, all from one beat map. `beats` are seconds from frame 0 (the picture's clock).
 */
export const scoreFromBeats = (
  s: Sound,
  { beats, kickGain = 0.55, softFrom, softGain = 0.32, riser, cues }: { beats: number[]; kickGain?: number; softFrom?: number; softGain?: number; riser?: [number, number, number?]; cues: Cue[] },
) => {
  for (const b of beats) s.kick(b, softFrom !== undefined && b >= softFrom ? softGain : kickGain);
  if (riser) s.riser(riser[0], riser[1], riser[2]);
  for (const c of cues) s.hit(c.kind, c.t, c.gain);
};
