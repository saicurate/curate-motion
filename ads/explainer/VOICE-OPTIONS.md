# The explainer's voice: your options

For the founder. Switching between these is a dropdown: run `tools/library-ui`, open
http://127.0.0.1:4317 and use the **Voiceover** panel (or one line in `config/voice.json`; AGENTS.md ›
"How to change the voice"). No code change. Whatever you pick, the words also show as captions.

The script is 26 lines: **244 words, 1,270 characters**, about 1 min 40 s of speech inside the
2:50 film. (The round-2 note guessed about 330 words; the actual script is shorter.)

| Option | What it sounds like | Cost for the whole 2:50 explainer | Can it ship? |
|---|---|---|---|
| **Captions only** (`"mode": "captions"`) | No voice: music plus on-screen lines. Best for silent autoplay on social | $0 | Yes |
| **Your voice or a friend's** (`"mode": "human"`) | A real person. Record in a quiet closet, 3 takes a line, then `tools/voice import` | $0, plus a signed release from the speaker | Yes, once the release is on file |
| **A hired US voice actor** (`"mode": "human"`) | Professional and warm | About $100–300 for 3 minutes (Voices.com, Voice123, Fiverr Pro) | Yes, with a buy-out licence |
| **OpenAI TTS, gpt-4o-mini-tts** (`"mode": "tts"`, `openai-marin` or `openai-cedar`) | Natural; can be told the tone ("warm, unhurried, never salesy") | About **$0.03** (≈ $0.015 a minute of speech). Even 10 full redos stay under $0.50 | Yes. The ad must say the voice is AI (OpenAI's rule) |
| OpenAI tts-1 / tts-1-hd | Older, flatter | 1,270 chars × $15 / $30 per million = **$0.02 / $0.04** | Yes, same AI note |
| ElevenLabs (not wired up yet) | The most lifelike option | API: 1,270 chars × $0.08 per 1,000 = **about $0.10** (Flash: $0.05). Or the $6/month Starter plan | Yes on paid plans |
| Google Cloud TTS (not wired up yet) | Good, a bit more synthetic | Roughly $0.02 (Neural2) to $0.20 (Studio); likely $0 inside the monthly free tier. Prices not re-checked | Yes |
| **Mac preview voice** (`say-preview`) | Robotic, but free and instant: only for checking the timing | $0 | **No, never.** Apple's licence doesn't allow commercial use; these cuts are labelled "Preview voice · not for release" |

Prices checked 2026-10-15: OpenAI (developers.openai.com/api/docs/pricing), ElevenLabs
(elevenlabs.io/pricing/api). Google is from memory, so treat it as approximate.

## What's needed from you

1. **Pick one.** My suggestion: test **OpenAI marin** next to **your own voice** on the opening
   (about 30 seconds of speech, a few cents), then decide.
2. **For any paid voice, give the OK and a cap**: in the Voiceover panel, "Spending limit for paid
   AI voices" › Change limit (or set `"spendCapUsd": 1` inside `"tts"` in `config/voice.json`). Until
   then it is 0 and nothing paid can be made. "Preview cost" shows the price first, free.
3. **For a human voice**, record the 26 lines from `ads/explainer/script.json` and keep the
   speaker's signed release.

Nothing paid has been generated. The preview cuts so far use the free Mac voice only.
