# Troubleshooting

## “Where is START.html?”

This is a source release. Extract the repository, install Node.js 20+, then run `npm ci` and `npm run build` in the directory containing `package.json`. The build generates START.html. Do not open Source/shell.html: it is an unfinished template.

## `node` or `npm` is not recognized

Install Node.js from its official distribution, including npm. Close and reopen the terminal, then check `node --version` and `npm --version`. On Windows, if PowerShell blocks `npm.ps1`, use the installed `npm.cmd` command or Command Prompt rather than weakening your system execution policy.

## npm cannot find package.json

You are probably in the wrong folder or still inside a ZIP preview. Extract the full ZIP and change into its top-level project directory. Use `dir` on Windows or `ls` on macOS/Linux to confirm package.json is present.

## Dependency installation fails

First installation needs registry/network access and enough disk space. Keep the error text, Node version, npm version and operating system. Do not disable TLS checks or security software to force installation. Native Canvas needs a supported platform binary; unusual operating systems/architectures may need additional work. Do not assume every platform is tested.

## The page is blank or never says Ready

Use the generated START.html in a desktop browser, not shell.html or an online repository preview. Rebuild after source changes. A failed WebGL context should fall back to software rendering, which can be slower. If it still fails, capture the visible error and relevant browser console message; do not upload private project/audio data with the report.

## No sound

- Click Play or Hear voice sample so the browser can activate audio.
- Check browser/device mute and volume settings.
- Narration is not generated automatically just because a caption exists. Generate scene speech and wait for its completion message.
- Load generated First-Cartoon.jetcartoon.json or Demo.jetcartoon.json for bundled music. The small source examples have no embedded audio.
- Check that scene.music resolves to an actual `music/<name>` asset. Unknown/missing assets can be skipped silently by this version.
- Regenerate narration after changing its text. Check the final saved/exported file, not only the preview.

## Music is too loud in the export despite the sliders

The current browser recorder and CLI have fixed export gain values; preview sliders are not an export mixer. The README documents this limitation. For now, use quieter source recordings, choose Silence, or change/test the export gain settings in Source/ui.js or Source/render.cjs and rebuild. Do not promise that a preview adjustment is reflected in the exported video.

## Captions or speech are cut off

Scene duration controls the available time. Generated speech may increase duration automatically; imported dialogue requires a manual duration check. Reapply edits, regenerate narration if its text changed, and verify the final scene's last words. Long text may need another scene instead of faster narration.

## The scene range is confusing

The UI lists scenes in human order, but movie range fields and CLI indexes are zero-based: the first scene is 0, second is 1. For two scenes, record 0 through 1. The final scene number is inclusive.

## My edit did not take effect

Click Apply scene changes before switching scenes. Check for JSON syntax errors: use double quotes, no comments and no trailing commas. A `shots` track overrides the static camera, so clear it to `[]` or edit the track. Independent still/comic edits do not alter the original movie.

## Unsupported character or environment

The public edition deliberately contains only generic templates. Personal-production projects may reference rigs/sets not included here. Choose a generic kind listed in PROJECT_FORMAT.md or implement your own authorized asset. Renaming a project file does not convert unsupported characters.

## Browser recording is WebM, stutters, or fails

MP4 recording support depends on browser and platform. WebM is a valid fallback. Keep the tab visible and avoid heavy concurrent work. If the browser does not support captureStream/MediaRecorder, use the FFmpeg headless renderer. Do not mistake an implementation or mocked test for full browser certification.

## Headless movie files did not change after edits

The renderer intentionally skips existing scene MP4 files. Use a fresh output directory; keep the old files until you have checked the replacement. Confirm FFmpeg is installed and the input is the latest saved portable JSON.

## Stills are black, cropped or different from the preview

Use Fresh stills/print.cjs rather than a transition-time screenshot. Fresh stills disable transition fading, but cameras can still point away from the scene. Check local scene time, camera/target and shot overrides. Different aspect ratios change framing. Software rendering and WebGL have different shading; preview the final export at its actual dimensions.

## Comic export reports text overflow

Shorten or reflow a caption, enlarge/reposition the balloon, or add a panel/page. Check the rendered page afterward. The error exists to prevent silent loss of text. PDF text is rasterized in this version.

## I closed the tab and lost my changes

Edits are held in memory. There is no autosave or server recovery. Reload your last downloaded project JSON and save regularly. Keep editable project/comic JSON separately from MP4/PNG/PDF exports.

## Reporting a bug

Use the repository's Issues tab. Include the app version, OS, browser/Node version, exact steps, expected/actual result, and a small generic project that reproduces it. Remove personal stories, recordings, credentials and identifying metadata first. State whether the problem affects preview, browser recording or headless output; these are separate rendering/audio paths.
