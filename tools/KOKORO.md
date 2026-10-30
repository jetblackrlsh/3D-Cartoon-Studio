# Kokoro local voices (preferred for new projects)

Kokoro is an optional CPU neural TTS provider, not a cloud API. Existing bundled meSpeak voices and old projects remain supported. Choosing Kokoro never silently substitutes a different voice when a model is missing. The offline browser editor cannot start Python: export a speech request, run the CLI, then import its `.wav.json` result (or the WAV and matching sidecar). Generated WAV bytes are embedded in the project and thereafter play/export offline without Python or models.

## Explicit one-time setup

Use Python 3.10–3.13 (3.12 tested). In a terminal from the studio folder:

```
python3 -m venv .venv
.venv/bin/python -m pip install -r tools/kokoro-requirements.txt
.venv/bin/python tools/kokoro-tts.py setup --download-models
.venv/bin/python tools/kokoro-tts.py status
```

Windows: use `py -3.12 -m venv .venv`, then `.venv\Scripts\python.exe` in place of `.venv/bin/python`. macOS/Linux use the commands above. No admin install is performed. Dependency wheels depend on platform; `kokoro-onnx` uses `espeakng-loader`, ONNX Runtime and phonemizer. If a wheel/shared library is unavailable, follow their platform instructions rather than disabling a sandbox. Tested here: Linux x86_64/Python3.12 CPU; Windows and macOS not executed.

Setup explicitly downloads 353,746,785 bytes (~354 MB decimal) from upstream `thewh1teagle/kokoro-onnx`, release `model-files-v1.0`. Both files are SHA-256 pinned. Partial downloads are verified before atomic rename; existing mismatching files are rejected, never replaced. Dependencies are installed separately by the explicit pip command. Nothing downloads at editor startup, `status`, or synthesis. No keys are required; synthesis sends no text over the network.

Defaults: `~/.cache/jet-cartoon-studio/kokoro`. Override with `STUDIO_KOKORO_DIR`, or individual `STUDIO_KOKORO_MODEL` and `STUDIO_KOKORO_VOICES`. These are paths, not credentials. The tested model is 24 kHz mono; export pipelines must resample decoded audio onto one common sample rate/channel layout before encoding, never concatenate mixed-rate AAC packets.

## Synthesize

```
.venv/bin/python tools/kokoro-tts.py synthesize --request speech-request.json --output new-clip.wav
# Or:
.venv/bin/python tools/kokoro-tts.py synthesize --text-file line.txt --voice af_heart --lang en-us --speed 1 --output new-clip.wav
```

Writes `new-clip.wav` and `new-clip.wav.json`, refusing existing output names. JSON includes embedded WAV, stock voice, text, speed, language, PCM sample count/rate and audio/model hashes. The scene duration must accommodate the measured audio; changing speed/text requires regeneration. Keep distinct stable voice assignments per speaker, e.g. af_heart / am_adam / bf_emma / bm_george; voice catalog availability is checked by the model. Only en-us/en-gb are enabled in this tested adapter. No real-person cloning is included.

Timing is actual PCM sample count/sample rate, not guessed words-per-minute or synthesis wall clock. This is clip alignment, not forced word alignment or phoneme lip sync. ASR/Whisper can optionally spot-check word placement; it cannot fix mismatched mux sample rates. Verify both early and late utterance timing against the final decoded master.

## Licenses and sources

- Studio adapter code follows the studio's own license.
- [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx): MIT; optional installed dependency, version0.6.1 tested/pinned.
- [Kokoro82M weights/voices](https://huggingface.co/hexgrad/Kokoro-82M): Apache2.0. ONNX conversion distributed via [upstream model releases](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0). Models are not included in the source/editor ZIP; explicit setup acquires them. Respect upstream notices when redistributing them.
- phonemizer is GPL3.0; espeak-ng is GPL3.0-or-later; espeakng-loader wrapper is MIT (its bundled espeak-ng remains GPL). ONNX Runtime and NumPy retain their own notices. This provider does not relicense these dependencies or change existing bundled meSpeak GPL notices.

No claim of browser playback/listening certification follows from headless or DOM tests. Preserve original project files and accepted voice takes when upgrading.
