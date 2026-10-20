# Third-party dependencies

This source repository contains original studio source, a generic procedural JSON demo, the creator-authorized original emotion music library, and dependency manifests. It does **not** vendor compiled speech code, voice dictionaries, JavaScript library bundles, third-party music recordings or generated application binaries.

Dependencies are pinned in `package-lock.json` and fetched by npm from their upstream publishers:

| Package | Version | License / source |
|---|---|---|
| three | 0.180.0 | MIT, https://github.com/mrdoob/three |
| pdf-lib | 1.17.1 | MIT, https://github.com/Hopding/pdf-lib |
| esbuild | 0.25.9 | MIT, https://github.com/evanw/esbuild |
| @napi-rs/canvas | 0.1.80 | MIT, https://github.com/Brooooooklyn/canvas |
| mespeak (npm packaging) | 2.0.2 | GPL; https://github.com/mikolalysenko/mespeak |
| jsdom (tests only) | 26.1.0 | MIT, https://github.com/jsdom/jsdom |

meSpeak's official project explains that it derives from speak.js/eSpeak and is distributed under GPLv3: https://www.masswerk.at/mespeak/ . The npm package version is not the same as the upstream engine version displayed within its source. Do not substitute a modern meSpeak release without adapting and testing its API.

Transitive dependencies have their own license files in the installed package tree. This table is not a relicensing of those packages. Preserve their copyright/license notices when redistributing their material.

## Built application redistribution

`npm run build` produces a combined application containing third-party code. A source-only checkout is not by itself a claim that every generated binary's corresponding-source requirements have been fulfilled. Before publishing that bundle, include all applicable notices and the exact corresponding source/build materials required by the dependencies, including the speech engine. A link to an npm tarball alone should not be assumed to satisfy GPL corresponding-source obligations.

The initial public release therefore distributes source only. No compiled voice bundle or downloadable built application is committed here.

## Imported media

The tool license does not grant rights to third-party stories, likenesses, fonts, music, recordings, artwork or characters. The four original music recordings in music/ are separately identified and explicitly authorized by their creator for this release. No personal character/world assets are included. Users are responsible for rights to their own imports and publications.
