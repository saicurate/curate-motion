# 0011: The motion studio process (PROPOSED)

2026-10-15 · founder, after watching Pop out v2: "we need more smooth animations, more clear and
smooth animations". They shared an article on how the best code-rendered motion films are made and
approved: "build the skill, and v3; the founder sees the style guide and storyboard first, before
anything renders."

**Status: proposed.** The founder decides after seeing Pop out v3 whether this becomes house rules.
Until then the rules live in `.claude/skills/motion-reel/SKILL.md`, AGENTS.md › "Making a motion
film" and each ad's `style_guide.md`, not in RULES.md.

**Context.** v2 was frame-pure and beat-synced but not smooth enough: 30 fps; 4 sub-frame samples
over half a frame, so fast moves echoed (the strip test shows "9:41" four times at 13.2 s); every
overshoot banned, so it felt stiff; four things a bar; a 1 s end title; the real app small and brief;
no scored critique. Each ad hand-rolled its own easing, blur, sound and checks.

**Decision.** One reusable studio process, as tooling:
1. **Render contract:** frames from time alone (no timers, no Math.random: `motion/noise`), 60 fps
   for new ads (App Store formats at 30 from the same timeline), and a determinism check
   (`tools/stills --determinism`: frame N rendered fresh and after an out-of-order frame, sha256 equal).
2. **Motion with mass:** `motion/springs.ts`, closed-form springs with stacked retargets and one
   tuned preset per object class (ui, panel, camera, headline, mascot, piece). Bounce only for Zee;
   a hair of overshoot on ui and piece for mass.
3. **Blur that doesn't echo:** `motion/Blur.tsx`, sub-frame samples that follow the analytic speed
   (≤ 3 px apart) + a directional blur; the critic's strip test checks the fastest move.
4. **Measured music:** `tools/beats` (librosa) stores each track's beat map in its manifest; ads clip
   it (`beatmap.ts`). Designed sound with `motion/sound` on the same clock; −14 LUFS; a blindfold test.
5. **State lists:** brief.md (FILM sentence…) and shotlist.md (HOOK / PROBLEM / REVEAL / PROOF /
   CLOSE; entry, exit, purpose, motion class per shot; loop).
6. **Reference → style guide:** `tools/refframes`; take the grammar, never the subjects.
7. **The critic:** `tools/critic` produces the evidence; the agent scores six criteria per round,
   fixes the worst 3, re-renders those seconds, until every score is 8+.
8. **Gates G1–G6 in ad.json** (`gates`, `gateLog`, validated); the founder approves G2 and G3.

**Why tooling and not a document.** Every rule an agent can check is a command (motion-check,
stills --determinism, critic, catalog validate), so the next agent can't skip it by accident, and
the founder judges pictures (a phone page at G2/G3) instead of code.

**Why stay on Remotion.** It is frame-pure already. At 60 fps with photos, real footage and adaptive
sub-frames, v3 renders at about 0.07 s a frame at `--concurrency 1` (0.12 s with 16 samples on
every frame; 900 frames in 78 s). No need for a Playwright + ffmpeg tmix pipeline. The determinism
check found one real leak (Chrome's JPEG decode-to-scale cache: whole photo tiles off by up to 3/255
depending on the previous frame); `motion/StableImg` fixes it.

**Consequences.** New ads are 60 fps with gates (the template has them; the schema requires 60 once
gates are set). Old ads (30 fps, no gates) are unchanged. Approved music assets gained a `beatMap`
(metadata only; their files and `bpm` / `offsetSec` are untouched, since existing ads were cut to them).
