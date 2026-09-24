#!/usr/bin/env python3
"""Síntesis de voz con edge-tts, un clip por segmento, con tiempos por palabra.

Entrada (stdin, JSON):
  {"voice": "en-US-AriaNeural", "rate": "+15%", "pitch": "+2Hz", "volume": "+0%",
   "out_dir": "/ruta/audio", "segments": [{"index": 0, "text": "..."}]}
Salida (stdout, JSON):
  {"segments": [{"index": 0, "file": "/ruta/audio/seg_00.mp3",
                 "words": [{"text": "Still", "start_ms": 50.0, "end_ms": 310.0}]}]}
Códigos de salida: 3 = falta edge-tts, 4 = entrada inválida, 5 = error de red / servicio.
"""
import asyncio
import json
import os
import sys

EXIT_MISSING_DEP = 3
EXIT_BAD_INPUT = 4
EXIT_SERVICE = 5
TICKS_PER_MS = 10_000  # edge-tts entrega offsets en unidades de 100 ns


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def make_communicate(edge_tts, text, req):
    kwargs = dict(rate=req.get("rate", "+15%"), pitch=req.get("pitch", "+2Hz"), volume=req.get("volume", "+0%"))
    try:
        # edge-tts >= 7 emite SentenceBoundary por defecto: pedimos WordBoundary explícitamente.
        return edge_tts.Communicate(text, req["voice"], boundary="WordBoundary", **kwargs)
    except TypeError:
        return edge_tts.Communicate(text, req["voice"], **kwargs)  # versiones antiguas


async def synth_segment(edge_tts, seg, req, attempts=3):
    out = os.path.join(req["out_dir"], "seg_%02d.mp3" % seg["index"])
    tmp = out + ".part"
    last = None
    for attempt in range(1, attempts + 1):
        words = []
        size = 0
        try:
            with open(tmp, "wb") as f:
                async for chunk in make_communicate(edge_tts, seg["text"], req).stream():
                    if chunk["type"] == "audio":
                        f.write(chunk["data"])
                        size += len(chunk["data"])
                    elif chunk["type"] == "WordBoundary":
                        start = chunk["offset"] / TICKS_PER_MS
                        words.append({"text": chunk["text"], "start_ms": start,
                                      "end_ms": start + chunk["duration"] / TICKS_PER_MS})
            if size == 0:
                raise RuntimeError("edge-tts no devolvió audio")
            os.replace(tmp, out)
            return {"index": seg["index"], "file": out, "words": words}
        except Exception as exc:  # red caída, NoAudioReceived, 403 temporal...
            last = exc
            log("segmento %d intento %d/%d falló: %s" % (seg["index"], attempt, attempts, exc))
            await asyncio.sleep(attempt)
    if os.path.exists(tmp):
        os.remove(tmp)
    raise last


async def run(req):
    import edge_tts
    results = []
    for seg in req["segments"]:
        results.append(await synth_segment(edge_tts, seg, req))
        log("segmento %d listo (%d palabras)" % (seg["index"], len(results[-1]["words"])))
    return {"segments": results}


def main():
    try:
        import edge_tts  # noqa: F401
    except ImportError:
        log("Falta el paquete edge-tts. Instálalo con: pip install edge-tts")
        return EXIT_MISSING_DEP
    try:
        req = json.load(sys.stdin)
        assert req.get("voice") and req.get("out_dir") and req.get("segments")
        assert all(str(s.get("text", "")).strip() for s in req["segments"])
    except Exception as exc:
        log("Entrada inválida: %s" % exc)
        return EXIT_BAD_INPUT
    os.makedirs(req["out_dir"], exist_ok=True)
    try:
        result = asyncio.run(run(req))
    except Exception as exc:
        log("Error de edge-tts: %s" % exc)
        return EXIT_SERVICE
    sys.stdout.write(json.dumps(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
