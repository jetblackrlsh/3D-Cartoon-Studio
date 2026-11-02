# Local Stable Audio music and sound effects

This is an explicit offline **generation and import workflow**, not a browser inference engine or a label on prerecorded audio. It calls the pinned official CPU TFLite runtime, validates generated WAV receipts, resamples onto each scene's 48 kHz stereo timeline, and embeds portable music/SFX assets into a NEW project. Existing voice clips are preserved; generate distinct Kokoro character/narrator clips with the existing Kokoro workflow.

## Setup boundary and exact models

Bring an existing installation of [Stability AI stable-audio-3](https://github.com/Stability-AI/stable-audio-3), source revision `5f5e6ac21ae9ff78a6e8847eb7a1dcbe969ffb84`, and [official optimized models](https://huggingface.co/stabilityai/stable-audio-3-optimized), model revision `30cb2644da54bfa63275d1bc7f1fa67fc718680f`. `tools/stable-audio-generate.py` pins and verifies the reviewed runtime files and these data-only models:

- Small Music DiT: `sa3-sm-music/dit_w8a8.tflite`.
- Small SFX DiT: `sa3-sm-sfx/dit_w8a8.tflite`.
- Shared SAME-S decoder: `same-s/dec_w8a8.tflite`.
- Shared T5Gemma encoder: `t5gemma/encoder_fp16.tflite`.

The adapter requires LiteRT `2.2.0`; tested numerical environment: NumPy `2.2.6`, SentencePiece `0.2.1`, SoundFile `0.13.1`. It records actual versions. Explicit settings: 8 steps, CFG 1, four CPU threads, w8a8 DiT/decoder. Both models and shared components total approximately 1.74 GB, plus runtime/cache/dependencies. All exact SHA-256 pins are in the adapter. No model weights are included here.

Review [Stability AI licensing](https://stability.ai/license), [Gemma terms](https://ai.google.dev/gemma/terms), access requirements, and the intended use before obtaining or restoring models. Code licensing does not relicense model weights or guarantee output rights. No download, install, sign-in, credential acquisition, click-through acceptance or paid API happens automatically. Missing or changed models/runtime fail closed; no procedural/library fallback is silently substituted.

## Jobs and commands

Create `jobs.json` beside the output source WAVs. Example for a four-second scene:

```json
{"jobs":[
 {"id":"score","scene":"opening","kind":"music","prompt":"Gentle hopeful instrumental strings and piano, no vocals or speech","seconds":4,"seed":101,"output":"audio/score.wav"},
 {"id":"tap","scene":"opening","kind":"sfx","prompt":"A crisp dry wooden knock, no music or speech","seconds":1,"seed":102,"output":"audio/tap.wav","at":2,"action":"The block hits the tabletop"}
]}
```

Scene IDs must exist and be unique safe identifiers. Each cue's `at` (default zero), generated `seconds` (.1–120), and optional gain (0–2) must fit its scene. Compose longer scenes from explicitly placed cues; this adapter does not implicitly loop or clamp clips. Gaps remain silent: author and document them deliberately. Cues can overlap, with a disclosed linear headroom adjustment if their summed peak would exceed .9. Paths must stay inside the jobs directory. Use original instrumental prompts for the score and varied action-specific prompts for effects.

```sh
python tools/stable-audio-project.py validate project.json jobs.json
python tools/stable-audio-project.py generate project.json jobs.json NEW-project.json \
  --runtime-root /path/to/existing/stable-audio-3 \
  --python /path/to/existing/venv/bin/python
```

For already generated source WAVs **with matching per-file generation receipts**:

```sh
python tools/stable-audio-project.py import project.json jobs.json NEW-project.json
```

To check pinned runtime/model integrity without inference, use the lower-level adapter:

```sh
python tools/stable-audio-generate.py jobs.json \
  --runtime-root /path/to/existing/stable-audio-3 \
  --python /path/to/existing/venv/bin/python --validate-only
```

Jobs never overwrite existing WAVs, receipts or the destination project. A failed later job may leave earlier generated sources; inspect them and use an explicitly revised plan or import the completed set rather than blindly rerunning. The project is written only after all source receipt/hash/timing checks pass. Receipts are provenance records, not cryptographic proof that an arbitrary third-party file was created by a model; prefer this controlled generation route and inspect imported provenance.

## Export and QA

The imported project selects the `local-generative-v1` audio profile. It gets unique `music/generated-SCENE` assets and `sfx/SCENE` assets with exact scene-local start/end sample ledgers. Music begins at scene-local zero; the headless renderer must use the current audio-profile patch, not the older global music offset. Existing voice assets, declared voice provider, text and visual scenes are not regenerated or relabelled; Kokoro is recorded only as a preference. Existing generated-audio ledgers/import records are retained on partial imports. SFX editor `at` is a normalized scene fraction; the ledger retains exact sample positions. Policy/provider metadata does not certify the provenance of preexisting speech: retain its Kokoro receipts separately.

The importer applies one active-sample RMS normalization scalar per cue (default music .18, effects .30), bounded by .9 peak, followed by authored cue gain and a disclosed summed-stem headroom adjustment. Optional `targetRms` (.01–.4) tunes the starting balance; pauses and dynamics remain, and no compression or silence filling is implied. These measurements are not perceptual loudness. Inspect the final mix: words and meaningful effects should remain foreground, with clearly audible subordinate music. Keep the bounded, non-stacking profile attenuation; don't lower music to near-silence to pass a timing check. Use timing ledgers and decoded samples for synchronization, measured levels for engineering evidence, and actual listening for intelligibility/balance. `listeningVerified` remains false in automated receipts. Preserve intentional unvoiced/unscored scenes using the profile's explicit silence reasons.

Run `python tools/test-stable-audio-project.py`. Tests use clearly labelled synthetic engineering fixtures and do not claim inference. A separate actual pinned-runtime smoke generated a four-second instrumental and one-second SFX, verified/imported both, and retained original source hashes and receipts. Generation output is stochastic and not guaranteed to match a prompt perfectly; inspect and listen before delivery.
