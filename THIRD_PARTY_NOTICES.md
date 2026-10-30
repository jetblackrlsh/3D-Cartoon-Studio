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

## Urban geometry
Selected vehicle geometry from mrdoob/slop-newyork, commit 12593c9963f141665fe91881b1b4a2290db51d15, copyright 2026 Mr.doob, MIT. See docs/SLOP-NEWYORK-MIT.txt. No geographic dataset or shader runtime is distributed.

## Cast Library additions

The 60 generic cast presets, editable snapshots, procedural wardrobe and embedded generated thumbnails are original studio additions under GPL-3.0-only, modified/integrated on 2026-10-26. No third-party stock model, franchise character or captured motion is included. See docs/CAST_LIBRARY.md.

## CC0 imported skeleton and animation additions (2026-10-27)

`Source/standard-assets.json` inventories five binary GLB assets in `Assets/Standard/` with per-asset original URLs, creator, license and SHA-256. These are redistributable media, not ActionForge application code. The actual ActionForge rig/T-pose/idle were advertised by public HTML preload links; ActionForge's published notice identifies their Quaternius origin and CC0 1.0 terms. See [the saved notice](docs/ACTIONFORGE-THIRD-PARTY-NOTICES.txt). The two 43-clip Quaternius Standard GLBs came from the creator's official free itch.io pack; see [the shipped license](docs/UAL-License.txt), [asset inventory](docs/STANDARD_ASSETS.json) and [guide](docs/STANDARD_RIGS_FAST_MODE.md).

The original Studio standard-skeleton adapter, appearance recipes, anatomical action transfer, Fast Mode and tests are GPL-3.0-only additions. GLTFLoader and SkeletonUtils are imported from the pinned MIT-licensed `three` npm package, not copied from ActionForge. No proprietary ActionForge code, CGstuff prop pack, paid kit, private captured skating, private film, personal character or production log is included. Optional Quaternius bases/hair originals are not bundled; the new editor uses the bundled ActionForge mannequin and original procedural styling.

## Creator-authorized emotion music

The ten included emotion/thematic recordings (Tranquility, Suspense, Determination, Playfulness, Anger, Fear, Nostalgia, Excitement, Sorrow and Joy) are original music by Nicholas Alexander Benson (Jet Black), explicitly authorized by their creator for this public source release under GPL-3.0-only. They are not imported third-party tracks. `music/manifest.json` records exact included-byte SHA-256 values; existing four track IDs and bytes remain unchanged. See `music/README.md`. No private storage IDs are published.
