# /// script
# requires-python = ">=3.11,<3.13"
# dependencies = ["faster-whisper>=1.0", "numpy>=1.26"]
# ///
"""Word timestamps for voice clips, free and local (faster-whisper, MIT; model base.en). Prints JSON {file: [[word, start, end]…]}."""
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel
m = WhisperModel("base.en", device="cpu", compute_type="int8")
out = {}
for f in sys.argv[1:]:
    pcm = subprocess.run(["ffmpeg", "-v", "quiet", "-i", f, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, np.float32)
    segs, _ = m.transcribe(audio, word_timestamps=True, language="en")
    out[f.rsplit("/", 1)[-1]] = [[w.word.strip(), round(w.start, 3), round(w.end, 3)] for s in segs for w in s.words]
print(json.dumps(out))
