# Audible music, clear dialogue and meaningful effects

Use Kokoro stock narrator/character voices and freshly generated Stable Audio instrumental music and effects for new productions. Keep stable speaker-to-voice assignments and measure every generated clip before scheduling scenes. Do not clone a person's voice or claim stock voices are impersonations.

The new `local-generative-v1` profile sets initial gain multipliers of 0.95 voice, 0.30 music, and 0.65 effects. During speech the music multiplier is 0.65 (effective 0.195), without stacking another effect-triggered reduction. These are **starting gains, not a loudness guarantee**: normalize and inspect source assets, which can have very different levels. Review narration, dialogue, action and quiet intervals separately; listen to representative passages whenever listening is available. Document a listening limitation honestly.

Music must remain recognizable under voices and effects. Meaningful action effects should be clearly audible without clipping or masking words. Vary distinct actions rather than repeating one generic sound. If an effect competes with an important word, reposition it or shape the effect, rather than burying the whole score. Avoid constant busy effects that mask dialogue. Preserve intentional quiet passages. Record `voiceSilenceReason` for nonverbal shots and `musicSilenceReason` for intentionally unscored shots. Generated scene-local music starts at zero by default, with optional nonnegative `musicOffsetSeconds`; it does not inherit the legacy global music seek.

The old music library is still useful for deliberately selected reuse. Existing accepted projects keep their saved assets and mix; do not silently replace their score or regenerate their voices. New-profile assets are required before headless export; the renderer must not label procedural fallback as Stable Audio.

## Timing acceptance

Build the story timeline from measured decoded clips and explicit pauses. Keep captions, shot boundaries and sound cues on this timeline. Assemble scenes through `Source/render-film.cjs`: it decodes each source independently, trims/pads to scene duration, appends canonical 48 kHz stereo PCM and encodes the final AAC once. Do not concatenate heterogeneous compressed audio streams directly.

For every completed film:

1. Check the actual audio placement at every utterance against the planned timeline, captions and visuals. Start/end checks and total runtime alone cannot establish full-film synchronization.
2. Fully decode the final MP4; check clipping, unexpected silence, missing or repeated scenes, and frame coverage.
3. Derive any 2x version from the accepted normal master, applying pitch-preserving 2x audio tempo and matching video timing.
4. Inspect all shot frames and action transitions. Keep a per-shot defect log and correct defects in a new take.
5. Distinguish timing from audibility. Music can lower isolated-voice correlation without moving the voice; compare aligned expected full mixes and separately verified source placements rather than muting the music merely to pass a similarity threshold.
6. Say which checks were numerical, visual, or actual listening. Tests do not certify perceptual quality or a particular user's listening environment.

`node Source/audio-profile.cjs old.json new.json` deliberately opts a copied project into the new defaults; it refuses to overwrite an output. Generate/import the required audio before export. See [Stable Audio](STABLE_AUDIO.md) and [Kokoro](KOKORO.md).
