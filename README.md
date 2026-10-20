# 3D Cartoon Studio

Offline, editable 3D cartoons, fresh stills, and comics from the same scene data.

This is the **1.4.1 public source edition**, derived from the 1.4 Stills & Comics edition. It uses lightweight procedural low-poly rigs and a deterministic software renderer, not a text-to-video AI service. No account or API key is needed to use the built application.

## Build once, use offline

Requires Node.js 20 or newer and npm. The first dependency installation needs internet access.

```sh
npm ci
npm run build
```

Open the generated **START.html** in a desktop browser. It contains the runtime, offline synthetic voice, PDF library, and starter project in one file. A server is not required. Export your editable project before closing the tab: edits are held in memory, not automatically saved.

The repository intentionally publishes source rather than prebuilt third-party voice binaries. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) before redistributing a built application.

## Features

- Scene-based 3D animation, procedural characters, props, environments, camera shots and timed action tracks.
- Native WebGL preview where available, with a Canvas software-rendering fallback.
- Six offline synthetic voice presets, imported dialogue, embedded music and sound-effect tracks.
- Portable `.jetcartoon.json` projects with embedded assets.
- Browser movie recording where supported; headless MP4 scene rendering through Node and FFmpeg.
- Fresh PNG stills with independent scene, camera, lighting, time and resolution controls.
- Editable `.jetcomic.json` comics: eight page layouts, captions, speech/thought balloons, page PNGs and multi-page PDF export.
- Native rendering regression tests, including actual pixel comparisons and PDF parsing.

## Headless commands

Install FFmpeg separately for movies. Stills and comics do not require it.

```sh
npm test
node Source/print.cjs still Starter.jetcartoon.json output/still.png
node Source/print.cjs comic Demo/Studio-Demo.jetcomic.json output/comic
node Source/render.cjs Demo.jetcartoon.json rendered 0 1 12
```

The test command creates the editable demo comic and its PDF under `Demo/`. The renderer produces one MP4 per selected scene; it is not an automatic finished-film editor. Existing scene MP4 files are skipped, so use a fresh output directory after project edits.

For precise still settings, pass a JSON options file as the fourth argument:

```json
{"sceneIndex":0,"time":2,"width":1920,"height":1080,"captions":false,"camera":[4,3,9],"target":[0,1.3,0]}
```

## Audio and media

The public starter uses generic procedural characters and scenery, with no personal characters, private worlds, story text or production artwork. Four original emotion-based songs by Nicholas Alexander Benson (Jet Black) are included with his authorization: Tranquility, Suspense, Determination and Playfulness. The build embeds these in START.html and generates Demo.jetcartoon.json for headless use. You can supply media you have permission to use in your own project. See [docs/PROJECT_FORMAT.md](docs/PROJECT_FORMAT.md).

Local synthetic speech is included at build time through meSpeak. It is traditional text-to-speech, not voice cloning. Generated speech can sound robotic. For higher-quality voices, import a recording you are authorized to use.

## Known limits

- This is the generic-only studio: all personal character and world templates have been removed, not just hidden or renamed. Unsupported character kinds fail validation. The public sample contains no production-story artwork or voice recordings.
- Browser recording depends on MediaRecorder, codecs, audio activation and tab visibility. It is real-time, not frame-exact offline encoding. Use the headless renderer for deterministic visual frames.
- Browser and CLI audio mixing are not identical. Browser SFX use embedded `sfx/<scene-id>` audio; CLI also supports procedural `scene.sfx` events. Check the final export rather than assuming audio parity.
- Still/PDF exports use the software renderer; appearance can differ from WebGL preview. Fonts and native rasterization can differ across operating systems.
- Project validation is not a complete hostile-input sandbox. Only open trusted projects, especially with the Node CLI. Large embedded assets and complex geometry can exhaust memory.
- This release has automated native rendering, PDF and voice tests. Do not interpret those as a complete cross-browser, visual or listening review.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep the offline build and editable project formats working. Add regression tests for fixes; do not commit generated bundles, private stories, credentials, or media without documented redistribution rights.

## License

The original studio code, generic procedural demo and included original music are licensed under **GNU GPL version 3 only**. Third-party packages retain their own licenses. GPL permits use, modification and commercial distribution under its conditions; redistribution of modified or bundled software requires applicable notices and corresponding source. Media you import is not automatically licensed by this repository.
