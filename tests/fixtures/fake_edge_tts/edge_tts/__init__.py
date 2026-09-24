"""edge_tts falso para tests: genera audio real con ffmpeg (tono) y WordBoundary sintéticos.

FAKE_TTS_LOG  -> archivo donde se registran los parámetros recibidos (JSON por línea)
FAKE_TTS_MODE -> "ok" (defecto) | "fail" | "nowords"
"""
import json
import os
import subprocess
import tempfile

WORD_SEC = 0.3


class Communicate:
    def __init__(self, text, voice, rate="+0%", pitch="+0Hz", volume="+0%", boundary="SentenceBoundary"):
        self.text, self.voice = text, voice
        with open(os.environ["FAKE_TTS_LOG"], "a") as f:
            f.write(json.dumps({"text": text, "voice": voice, "rate": rate, "pitch": pitch, "boundary": boundary}) + "\n")

    async def stream(self):
        mode = os.environ.get("FAKE_TTS_MODE", "ok")
        if mode == "fail":
            raise ConnectionError("red caída (simulada)")
        words = self.text.replace("?", "").replace(".", "").replace(",", "").split()
        dur = WORD_SEC * len(words) + 0.1
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, "a.mp3")
            subprocess.run(["ffmpeg", "-loglevel", "error", "-f", "lavfi", "-i", "sine=f=220:d=%.2f" % dur,
                            "-ar", "24000", "-ac", "1", "-b:a", "48k", out], check=True)
            data = open(out, "rb").read()
        if mode != "nowords":
            for i, w in enumerate(words):
                yield {"type": "WordBoundary", "offset": int(i * WORD_SEC * 1e7), "duration": int(0.25 * 1e7), "text": w}
        for i in range(0, len(data), 4096):
            yield {"type": "audio", "data": data[i:i + 4096]}
