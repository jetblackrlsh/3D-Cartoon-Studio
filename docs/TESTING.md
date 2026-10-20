# Testing and verification

From a fresh checkout:

```sh
npm ci
npm test
```

Tests build the app, render real frames through native Canvas, and generate demo artifacts. They do not require FFmpeg or a GUI browser.

## What the suite checks

- Deterministic repeated stills and no mutation of the source project.
- Actual pixel changes from camera, lighting and caption options.
- Non-black zero-time stills and rejection of invalid scene/time/dimensions.
- All eight comic layouts, overflow rejection, and a parsed four-page PDF.
- All six speech presets generate nonempty WAV data in jsdom.
- All 80 combinations of ten generic character rigs and eight environments render.
- UI-referenced element IDs exist, unsupported character kinds fail, and all four authorized music tracks are embedded.
- The documented first-cartoon project and still options produce a nonempty PNG.

## What the suite does not establish

It is not a full real-browser interaction test, an auditory quality review, a cross-platform support guarantee, or exhaustive project validation. jsdom does not prove audio playback, download dialogs, WebGL or MediaRecorder. Native speech tests verify WAV output, not intelligibility. UI-ID checks are not interaction tests.

Before distributing a modified release, open START.html in the browser(s) you support, follow GETTING_STARTED.md, save/reload a project, record and watch/listen to a movie, export/inspect stills and comics, and verify the audio is balanced. Test invalid inputs and document limitations honestly.

## Optional FFmpeg smoke test

After installing FFmpeg, use the command in RECIPES.md to render the tutorial. Then decode an exported scene:

```sh
ffmpeg -v error -i output/tutorial-movie/scene-000.mp4 -f null -
```

A successful decode checks stream validity, not story coverage or sound quality. Watch and listen too. A one-second music/SFX smoke test and full decoding of the four music recordings were performed for the initial public source release; that is not a claim that every project or codec has been tested.

## Generated files

START.html, runtime bundles, complete embedded-audio example projects, Demo/, output/ and node_modules/ are generated and ignored by Git. Source examples, music originals, manifests and the lockfile are tracked. Do not commit private projects to make a test easier. Do not publish bundled third-party voice binaries without meeting their corresponding-source and notice obligations.
