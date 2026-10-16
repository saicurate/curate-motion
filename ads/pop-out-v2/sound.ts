#!/usr/bin/env node
// Pop out v2: the designed sound, generated in code (no stock or paid SFX). A small DSP script:
// oscillators, seeded noise and time-varying biquad filters, rendered sample by sample to a WAV.
//
//   node ads/pop-out-v2/sound.ts [out.wav]        (default: .cache/pop-out-v2-sound.wav)
//
// Then add it to the library (the ad reaches it by id):
//   tools/catalog add <out.wav> --kind sfx --scope curate --name pop-out-v2-sound --licence curate …
//
// Layers, all on the beat map in timeline.ts: a soft kick on every beat (softer in the track's
// break), a riser into the strongest bar, and a crisp hit or whoosh on every transformation.
// The bus is peak-normalised to −3 dBFS; the ad's sfxVolume sets it against the music.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { B, FPS, HITS, RISER, TOTAL, type Hit } from "./timeline.ts";

const SR = 48000;
const LEN = Math.round((TOTAL / FPS) * SR);
const L = new Float32Array(LEN);
const R = new Float32Array(LEN);
const sec = (beat: number) => B(beat) / FPS;

// seeded noise, so the file is the same every run
let seed = 0x5eed1234;
const rnd = () => {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return ((seed >>> 0) / 4294967296) * 2 - 1;
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

/** Write a mono voice into the bus at time t0 (s), `dur` s long, panned -1..1. */
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
const env = (t: number, a: number, d: number) => (t < a ? t / a : Math.exp(-(t - a) / d));

// ── the layers ──
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
  // pan moves across the sweep: split into short slices
  const slices = 12;
  for (let s = 0; s < slices; s++) {
    const a = s / slices;
    const b = (s + 1) / slices;
    voice(t0 + a * dur, (b - a) * dur, lerp(pan0, pan1, a), g, (t) => {
      const u = a + (t / dur);
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
  const hp = biquad("bp");
  voice(t0, 0.03, pan, g, (t) => hp(rnd(), fc, 1.2) * Math.exp(-t / 0.0045) * 3);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const play = (h: Hit) => {
  const t = sec(h.beat);
  switch (h.kind) {
    case "pop": // a soft upward blip with a click: the piece leaving the photo
      tone(t, 0.12, 380, 980, 0.002, 0.035, 0.32);
      click(t, 0.25, 4200);
      break;
    case "draw": // the outline being drawn: a short bright scribble
      noiseSweep(t, 0.16, 2400, 7200, 6, 0.18, -0.3, 0.3, "bell");
      break;
    case "flood": // the next photo floods out of the shape
      noiseSweep(t - 0.04, 0.24, 300, 5000, 1.4, 0.32, -0.4, 0.4, "rise");
      tone(t + 0.16, 0.18, 220, 180, 0.002, 0.06, 0.25);
      break;
    case "type": // a crisp key for each line
      click(t, 0.3, 5200, -0.1);
      tone(t, 0.06, 2400, 2200, 0.001, 0.012, 0.12);
      break;
    case "whoosh":
      noiseSweep(t - 0.12, 0.34, 250, 3600, 1.1, 0.38, -0.7, 0.7, "bell");
      break;
    case "snap":
      click(t, 0.45, 3000);
      tone(t, 0.05, 1300, 1100, 0.001, 0.01, 0.16);
      break;
    case "thud":
      tone(t, 0.25, 90, 55, 0.002, 0.07, 0.5);
      noiseSweep(t, 0.1, 400, 200, 0.8, 0.2, 0, 0, "fall");
      break;
    case "flips": // tiles turning: a fast patter of small clicks across the stereo field
      for (let i = 0; i < 14; i++) click(t + i * 0.024 + Math.abs(rnd()) * 0.006, 0.16 + 0.06 * Math.abs(rnd()), 2600 + 1800 * Math.abs(rnd()), lerp(-0.8, 0.8, i / 13));
      break;
    case "swish": // a scroll
      noiseSweep(t - 0.02, 0.2, 900, 2600, 2.2, 0.2, 0.2, -0.2, "bell");
      break;
    case "impact":
      tone(t, 0.6, 62, 38, 0.002, 0.2, 0.75);
      noiseSweep(t, 0.3, 2400, 300, 0.7, 0.5, 0, 0, "fall");
      click(t, 0.4, 2000);
      break;
    case "rise":
      tone(t - 0.05, 0.32, 260, 780, 0.12, 0.2, 0.16, 0.2);
      noiseSweep(t - 0.05, 0.32, 600, 5200, 1.6, 0.26, -0.3, 0.3, "rise");
      break;
    case "suck": // a reversed whoosh that lands on the beat
      noiseSweep(t - 0.3, 0.3, 5200, 400, 1.2, 0.4, 0.5, -0.5, "rise");
      break;
    case "chime": // two clean partials, the end title's button
      tone(t, 1.2, 1318.5, 1318.5, 0.003, 0.35, 0.12, -0.2);
      tone(t + 0.04, 1.2, 1975.5, 1975.5, 0.003, 0.3, 0.08, 0.2);
      break;
    case "tick":
      click(t, 0.2, 3600, 0.2);
      break;
  }
};

// a soft kick on every beat (beat 31 on is the track's break: softer still)
for (let n = 0; n <= 32; n++) kick(sec(n), n >= 31 ? 0.32 : 0.55);
// the riser into the strongest bar: filtered noise and a sine, rising, cut dead on the downbeat
{
  const t0 = sec(RISER[0]);
  const dur = sec(RISER[1]) - t0;
  const bp = biquad("bp");
  let ph = 0;
  voice(t0, dur, 0, 0.42, (t, u) => {
    const fc = 300 * Math.pow(20, u);
    ph += (2 * Math.PI * (220 * Math.pow(4, u))) / SR;
    const e = Math.pow(u, 2.4);
    return (bp(rnd(), fc, 2) * 2.4 + Math.sin(ph) * 0.35) * e;
  });
}
for (const h of HITS) play(h);

// peak-normalise to −3 dBFS
let peak = 0;
for (let i = 0; i < LEN; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const norm = Math.pow(10, -3 / 20) / Math.max(peak, 1e-9);

const out = process.argv[2] ?? ".cache/pop-out-v2-sound.wav";
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
console.log(`wrote ${out}: ${(LEN / SR).toFixed(2)} s, ${HITS.length} hits + 33 kicks + riser, peak normalised ×${norm.toFixed(3)}`);
