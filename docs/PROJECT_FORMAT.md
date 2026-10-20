# Project and authoring guide

A portable package has `project` and `assets` properties. `Starter.jetcartoon.json` is the smallest supported example shipped here.

- `project.schema`: `JetCartoonProject`; `version`: 1.
- `scenes`: 1–500 scenes, each 1–180 seconds, at most 16 actors.
- Each scene contains `id`, `title`, `caption`, `duration`, `environment`, `actors`, and camera/target vectors.
- Actor `kind` selects an existing rig. `from`/`to` are XYZ positions; `action` is the animation preset. Do not invent unsupported kinds.
- `shots` and actor/prop `keys`, `beats`, `owners` use normalized time from 0 to 1. See `Source/engine.js` for supported fields. Owner references must identify an actor in that scene.
- `assets` maps stable names to data URIs. Images supply textures/backdrops; audio is embedded rather than fetched from the network.

## Audio conventions

- Narration: `scene.audio` names an entry such as `voice/scene-1`; value is a complete audio data URI. Set `voiceDuration` and ensure scene duration accommodates it.
- Music: `scene.music = "MyTrack"` resolves to `assets["music/MyTrack"]`. Music loops in playback/export.
- Browser SFX: `assets["sfx/" + scene.id]` contains a pre-mixed scene-length audio track.
- Headless procedural SFX: `scene.sfx` is an array of `{kind, at}` where `at` is normalized scene time. Kinds include `impact`, `laser`, `rewind`, `alarm`, `block`.

The build embeds the four original emotion tracks and generates Demo.jetcartoon.json. Use that generated package for headless movies with music; Starter.jetcartoon.json is the small source blueprint without embedded binary media. Set music to an empty string for silence. Narration must be generated or imported separately.

## Story adaptation workflow

1. Read the complete story and preserve its causal sequence, character identities and resolution.
2. Write a scene plan and captions/dialogue; select supported rigs and reusable environments.
3. Block characters, actions, props and camera shots. Keep every important event visible.
4. Generate or import narration; adjust timing to actual speech length.
5. Add licensed music and SFX deliberately. Check that every referenced asset exists.
6. Preview each scene, render a short test, then export the complete selected range.
7. Watch/listen to the exported result, not just the preview. Verify beginning/end, sound, timing and credits.
8. Save the editable project separately from finished videos, stills and PDFs.

For stills, use independent scene snapshots; clear `shots` when overriding a camera directly. For comics, use the UI to create a valid `.jetcomic.json`, then edit panels/page layout and save. Eight layouts are available: cover, Who's Who, credits, and 1/2/4/6/9-panel pages. Text overflow fails explicitly rather than silently dropping content.

## Generic asset catalog

Humanoid rigs: person, worker, scholar, knight, robot, traveler. Animals: deer, rabbit, badger, squirrel. Environments: void, jungle (climbing gym), royal, gym, room, library, diner, street. These are generic procedural models, not personal character templates. Unknown legacy personal character/world names are rejected.
