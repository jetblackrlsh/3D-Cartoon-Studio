# Preferred local Kokoro narration

**New project** selects Kokoro; opening old projects does not migrate their voice choices or regenerate audio. The bundled meSpeak provider remains available for immediate offline synthesis, including all original presets. Preview/export plays embedded audio identically for either provider.

Kokoro synthesis runs through `tools/kokoro-tts.py` on your own explicitly selected environment, not inside START.html. There is no API key, model download at startup, or implicit service. Follow the adapter's `--help` and explicit setup instructions; after setup and model caching generation can run offline. Python/model dependencies are optional and separate from `npm ci`.

1. Set **Voice provider**, narration text, **Speaker ID**, voice and speed. Apply the scene.
2. **Export Kokoro request**. Keep request/clip JSON private if narration is sensitive.
3. In the extracted studio folder run:
   ```sh
   python tools/kokoro-tts.py status
   python -m pip install -r tools/kokoro-requirements.txt
   python tools/kokoro-tts.py setup --download-models
   python tools/kokoro-tts.py synthesize --request scene-0.kokoro-request.json --output clip.wav
   ```
   `pip install` installs dependencies; `setup --download-models` explicitly downloads the model. `status` never downloads anything. If setup reports a dependency/prerequisite, follow its actionable message rather than changing the browser security settings.
4. Import `clip.wav.json` using **Import generated clip JSON**. The importer verifies text, voice, speed, WAV data and the generated clip’s SHA-256 (when present), measures duration from the WAV, extends the scene if necessary, and embeds audio into the portable project. Changed text/settings require a fresh clip. Apply scene edits before import. WAV-only audio still works via **Use an existing dialogue recording** (set scene duration yourself).
5. Save the portable project. Playback and browser/headless movie export then need no Python, model or network.

## Distinct cast

**Assign distinct character voices** creates `project.voiceCast` keyed by narrator and actor IDs. Existing assignments are preserved; ten voice identities cycle only after ten speakers. Set a scene's speaker ID and choose/apply its matching voice. Multiple scenes can use the same ID to retain identity. This is voice selection, not voice cloning. One narration clip per scene is supported; split alternating dialogue into scenes. Existing actor identities/looks are unchanged.

## Headless authoring

The same validation is shared with the browser. These commands do not modify source projects:

```sh
node Source/kokoro-project.cjs requests story.json requests
node Source/kokoro-project.cjs embed story.json voiced.json 0 clip.wav.json
# Explicitly synthesize all scenes whose voiceProvider is kokoro:
node Source/kokoro-project.cjs synthesize story.json voiced.json python3
```

Scenes use optional `voiceProvider: "kokoro"`, `kokoroVoice`, `kokoroSpeed` (0.5–2), and `speakerId`; `voice` remains the original synthetic preset for fallback. Absent provider means legacy meSpeak. `project.voiceCast` supplies defaults for scenes without explicit Kokoro voice/speed. Embedded narration uses ordinary `scene.audio`, `voiceDuration`, and `pkg.assets` and therefore remains backward-compatible with existing renderers. Text is retained in `voiceProvenance` for auditable generated clips.

Kokoro is optional third-party software; see the adapter notices for model and dependency licenses. It is not bundled into browser JavaScript or included in the GPL application license.
