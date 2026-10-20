# Small, practical recipes

Run terminal commands from the repository root, after `npm ci` and `npm run build`. Paths containing spaces need quotes. Never overwrite the only copy of an edited project.

## Move one actor

In the scene's **Actors (JSON)** field, replace the array with this example and click **Apply scene changes**:

```json
[
  {"id":"traveler","kind":"traveler","action":"walk","from":[-2,0,0],"to":[2,0,0],"rotation":0}
]
```

The actor moves from `from` to `to` over the scene duration. X is left/right, Y is up, Z is depth. Rotation is radians about the vertical axis. `scale: 0.8` makes a character smaller. Keep actor IDs unique when using prop owners or effects.

Available humanoids: `person`, `worker`, `scholar`, `knight`, `robot`, `traveler`. Animals: `deer`, `rabbit`, `badger`, `squirrel`. Start with `observe`, `walk`, `run`, `talk`, `gesture` or `dance`. Animals have simpler motion, not the complete humanoid gesture range.

## Change a camera

Set **Camera position [x,y,z]** to `[4,3,8]`, and clear **Shots (JSON)** to `[]` if a shot track is overriding it. Click **Apply scene changes**.

For an explicit camera/target shot, put this array in **Shots (JSON)**:

```json
[
  {"at":0,"camera":[4,3,8],"target":[0,1.3,0],"to":[2,2.6,6]}
]
```

The camera moves toward `to` during the scene and looks at `target`. Track times are fractions of the scene from 0 to 1, not seconds; the first shot must begin at 0 and later times must strictly increase. Check the complete camera move, not just one frame.

## Add a prop

Put this array in **Props (JSON)** and apply it:

```json
[
  {"id":"lamp","kind":"lantern","from":[0,0,1]}
]
```

Other useful generic props include `staff`, `sword`, `rock`, `console`, `bed`, `box` and `hourglass`. Custom geometric props are supported by `geometry`; inspect `storyObject` in the engine before authoring them. The function name describes arbitrary story props, not a library of personal story assets.

## Render a higher-resolution still

From the browser: choose a moment, click **Copy current scene**, set dimensions and local scene time, preview, then download. Changes in the independent still scene JSON do not change the movie. Clear `shots` in that copy when overriding its camera.

From the terminal:

```sh
node Source/print.cjs still First-Cartoon.jetcartoon.json output/tutorial-still.png examples/still-options.json
```

The supplied options render scene 0 at 3 seconds in 1280×720 without captions. Edit a copy of the options to change dimensions or camera. The limit is 4096 pixels per side and eight megapixels total. The result is a PNG; the options file is not a new movie project.

## Make a two-panel comic

1. Select the first scene and pause at a useful moment.
2. Click **New comic from current frame**.
3. Select **2 panels** in the page-layout selector.
4. Select the second movie scene, move its timeline to the desired moment, then click **Add current frame as panel**.
5. In the page JSON, edit each panel's `caption`. Add a `balloons` array to a panel if desired, then click **Apply page JSON**.
6. Inspect the rendered page. Shorten text or move a balloon if it obscures faces or action.
7. Click **Save editable comic** and **Download full PDF**. Keep both files.

A balloon inside a panel can look like this:

```json
{"kind":"speech","text":"Welcome!","x":0.05,"y":0.05,"w":0.65,"h":0.22,"tail":[0.7,0.5],"fontSize":22}
```

Coordinates are fractions of the panel. Kinds are `speech`, `thought`, and `caption`. An oversized caption/balloon can fail export explicitly. Do not remove important story text merely to make a failing export pass; reframe or add panels/pages.

For a complete tested comic example:

```sh
npm test
node Source/print.cjs comic Demo/Studio-Demo.jetcomic.json output/tutorial-comic examples/comic-options.json
```

This writes page PNGs, `comic.pdf`, editable JSON and a render report. PDF pages are raster images, not independently editable vector artwork.

## Render scene MP4s without browser recording

Install FFmpeg from its official distribution route for your system and confirm `ffmpeg -version` works. Then:

```sh
node Source/render.cjs First-Cartoon.jetcartoon.json output/tutorial-movie 0 1 12
```

Arguments are input project, output directory, first scene, last scene, frames per second. Scene indexes are zero-based and the final index is inclusive. Output resolution is 1280×720; the frame rate is clamped to 6–30. The tutorial has music but no generated narration until you save it from the browser after synthesizing speech. To render your narrated version, use that saved JSON instead.

The CLI writes `scene-000.mp4`, `scene-001.mp4`, thumbnails and a report. It skips existing scene MP4s, so choose a new directory after edits. It does not concatenate them for you; assemble the verified scenes in your video editor.

## Add procedural SFX for the headless renderer

In a copy of the saved project JSON, add this property to a scene:

```json
"sfx": [{"kind":"impact","at":0.5}]
```

`at` is normalized scene time. Supported kinds include `impact`, `laser`, `rewind`, `alarm`, `block`. This is a **headless** procedural effect recipe. Browser playback/recording instead uses embedded scene-length audio at `assets["sfx/" + scene.id]`. These are different paths; adding `scene.sfx` alone does not guarantee a browser-recorded effect.

## Keep projects portable

Save audio/images as data URIs inside `assets`; URLs to your own local files are not portable. Use unique asset keys, include only media you have permission to distribute, and keep a backup before changes. See [PROJECT_FORMAT.md](PROJECT_FORMAT.md) for audio conventions and [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) before distributing a built studio bundle.
