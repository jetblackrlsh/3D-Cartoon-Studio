# Stable Audio integration test evidence

2026-11-02, existing verified cloud-local CPU runtime; no model downloads or paid API.

- Nine Python regression tests passed in the release tree: scene/sample placement, normalized editor SFX offsets, preserving voices/previous provenance/untouched scenes, resetting new composed-score offset to zero, invalid paths/provider/timing/gains, duplicate IDs/outputs, source hash mismatch, missing source/runtime failure and no overwrite.
- Actual pinned Stable Audio 3 Small Music generated a four-second original instrumental: 4.976 seconds inference, 44.1kHz source, SHA256 `8b2bb1ab6ff49690780a0a63150a1c511b5c62da4f833ebc6109066636427310`.
- Actual pinned Small SFX generated a one-second wooden knock: 4.841 seconds inference, SHA256 `ceb8f880e947540a14bd588f75a447fab6e49d5ece1cf8eae7eba3e3491cd3ce`.
- Kokoro-ONNX0.6.1, stock af_heart, generated the generic line “A gentle melody, and a wooden knock.” (2.1973 seconds; SHA256 `6e7487dca0a6ff77161a516b3e72796850fa38b9fa0f12118395952132ca1570`). This was not a private story asset.
- Generated music and SFX imported as canonical48kHz stereo scene stems with exact sample placement; the four-second generic fixture rendered24H.264 frames and4.000 seconds AAC48kHz, and passed full FFmpeg decode.
- Engineering mix measurements on that fixture: music RMS8.43dB below voice over its spoken interval; SFX RMS10.20dB above music in its cue interval; decoded sample peak0.630. Those measurements do not certify subjective audibility or semantic prompt fidelity.

**Listening was not independently performed.** No general latency/quality claim follows from two short samples. Runtime installation, model access/license review and perceptual QA remain explicit user/environment responsibilities. Unit-test synthetic fixtures are not labelled as model-generated media in a production release. Source weights, private recordings, credentials and absolute local paths are excluded from this source package.
