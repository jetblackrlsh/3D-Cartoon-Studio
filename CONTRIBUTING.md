# Contributing

1. Install Node.js 20+ and run `npm ci`.
2. Edit `Source/`, then run `npm test`.
3. Open the rebuilt `START.html` and check the affected controls and exports in a real browser.
4. For movie changes, also render a short scene with `Source/render.cjs` and inspect the audio and video.
5. Submit a pull request describing the behavior change, tests, and any remaining limitations.

Use only redistributable sample content. Keep builds offline after installation; no telemetry, remote scripts or hidden network dependencies. Do not commit build outputs, node_modules, credentials, private production projects or personal logs.

Contributions to the original application are under GPL-3.0-only. Preserve upstream notices and identify third-party additions. See THIRD_PARTY_NOTICES.md for binary redistribution caveats.
