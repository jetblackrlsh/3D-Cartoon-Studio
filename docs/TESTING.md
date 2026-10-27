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

## Cast regression tests

`npm test` also checks all 60 cast designs, 17,400 pose updates across the 58 authored actions, finite transforms/textures, joint and hand-socket attachments (including backward seek), catalog/legacy validation, and 768 seeded four-character diversity cases. It renders all 60 previews under ignored `Cast-Previews/` and writes reports to ignored `qa/`. `test-cast-ui.cjs` exercises search/filter, add/apply, identity/motion preservation, capacity, blank characters and cancel/new-project behavior through jsdom with a stub preview renderer; it is not WebGL/browser QA.

Optional real-browser coverage is `PLAYWRIGHT_MODULE=/path/to/playwright CHROMIUM_PATH=/path/to/chromium node Source/test-cast-browser.cjs` after building. Install Playwright separately if desired; it is not a runtime dependency. The public cast integration passed the full automated suite and a native-rendered five-genre visual smoke inspection. Chromium interaction QA could not run in the cloud authoring environment because its process/socket sandbox prevented browser startup; no browser pass is claimed.

## Standard rigs and Fast defaults (public 1.6.0)

`npm test` now also verifies the original five CC0 asset checksums, actual 71-joint skin, all 43 native Quaternius clips, all 58 authored actions, 60 standard appearance recipes, clone isolation, backward seeking, finger joints, hand sockets/grips, serialization and offline mapping failures. `test-standard-print.cjs` renders a native-rig still and checks that success/failure restore the imported-asset registry; synchronous comic metadata checks defer only asset lookup, while rendering strictly revalidates after loading its assets.

`test-fast-mode.cjs` checks protected actor eligibility, graphic cutout geometry, facing, full override and unchanged actor data. `test-fast-render-cli.cjs` checks effective dimensions/FPS, option precedence, legacy settings and master reuse. `test-fast-ui.cjs` uses the actual public HTML and engine with a stub preview renderer: it covers fresh two-actor Fast defaults, cancel, mode switches, role protections, save/reimport, and old Standard/no-mode project compatibility. These DOM tests do not establish real WebGL, MediaRecorder, audio playback or download-dialog behavior.

A reproducible actual native-skin movie smoke check is:

```sh
npm run build
node Source/render-film.cjs Standard-Rigs-Demo.jetcartoon.json output/native-fast --mode fast --two-speed
```

For the public integration, that command rendered twelve 640×360 frames at 6 fps, assembled a decodable normal-speed master with audio, then derived a decodable 12 fps 2× version. The measured durations were 2.023 and 1.016 seconds (codec padding included). A representative actual frame was visually inspected; this is not an exhaustive choreography or listening review. No private production movie, project, capture, log or fixture is part of the source release.
