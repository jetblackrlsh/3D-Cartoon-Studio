# Standard rigs and Fast Mode

Public source edition 1.6.0 integrates the generic features developed in the private 1.2–1.3 line. Version numbers differ intentionally. Original Studio source remains GPL-3.0-only; imported CC0 media retain their terms.

## Offline builds and actual assets

`npm ci && npm run build` embeds five actual GLBs from `Assets/Standard/`, indexed by `Source/standard-assets.json` in the generated starter package. Runtime use needs no server or network. `docs/STANDARD_ASSETS.json` records original source URLs, SHA-256, sizes, joint counts and exact native clip names. The build does not require the large vendor ZIP archives.

- ActionForge's genuine blank human: 71 joints and a real weighted skin. Exact advertised T-pose and idle exports are also included.
- Quaternius free Universal Animation Library Standard: 43 named clips in both in-place and root-motion GLBs, with a 65-joint mannequin. These are official Quaternius originals, not a claim to be byte-identical ActionForge exports.
- 60 original appearance recipes restyle the actual imported rig using procedural wardrobe and geometry. They do not bundle the optional Quaternius character/hair kits.

Sources: <https://actionforge.app/>, <https://actionforge.app/THIRD-PARTY-NOTICES.txt>, <https://quaternius.com/packs/universalanimationlibrary.html>, <https://quaternius.itch.io/universal-animation-library>. The shipped notices/licenses are preserved beside this guide. No proprietary ActionForge application code was copied.

The full advertised ActionForge/Quaternius catalog and CGstuff prop pack were not acquired. Existing Studio procedural props remain available. Nine legacy captured skating clips are not redistributed or supported on imported humanoids; no substitute is claimed to be that captured motion.

## Imported actor format

```json
{
  "id": "performer",
  "kind": "standard-humanoid",
  "action": "idle",
  "from": [0, 0, 0],
  "design": {"standardAsset": "actionforge-human"},
  "standardAnimation": {
    "asset": "quaternius-ual",
    "clip": "Walk_Loop",
    "rootMotion": "in-place",
    "loop": true
  }
}
```

Native clip selection uses exact names from the inventory. Authored Studio actions use `action` instead of `standardAnimation`. The adapter maps anatomical left/right, limb rest directions and knee bends, not just string names. Units, rotation and explicit bone-name mappings can be provided in `design.standard`. Unsupported or incomplete mappings are rejected. Rest-pose-aware retargeting, clip seeks, hand sockets/grips, finger controls and procedural expressions are available; arbitrary vendor skeletons and facial morph sets are not guaranteed compatible. Textured imports require a browser or native Image decoder.

Projects embed `JetStandardAsset` objects under `assets`; actor references use their IDs without the `standard/` prefix. Save/reload preserves imported assets and actor settings. Only import trusted files; this is not a hostile-GLB sandbox.

## Fast Mode defaults and compatibility

Fresh projects start in Fast Mode at 640 × 360 and 6 fps, with lightweight original procedural cast. Existing imports retain explicit saved settings and identity. A legacy project with no `renderSettings.mode` follows Standard, not a silent conversion.

Use the render-mode control to choose Standard or Fast. Fast is deliberately lower-resolution/choppier. It recommends 1–2 full actors per shot but does not remove actors, props, plot beats or imported skeletons. Only explicitly marked distant, quiet, non-interacting actors with `renderRole: "background-extra"` and `nonInteracting: true` can become upright graphic cutouts. Speaking, active, combatant, plot-relevant, object-handling, moving, close-up or interacting actors remain full. `renderRepresentation: "full"` opts out.

## CLI and two-speed exports

FFmpeg and ffprobe must be installed separately.

```sh
node Source/render.cjs Demo.jetcartoon.json output/scenes --mode fast
node Source/render.cjs Demo.jetcartoon.json output/standard --mode standard --fps 12 --width 1280 --height 720
node Source/render-film.cjs Demo.jetcartoon.json output/film --mode fast --two-speed
```

Scene exports write the effective settings beside each MP4 and refuse to reuse a cached movie with different or missing settings. Use a fresh directory after project changes: the settings signature is not a full content hash. Film export assembles scenes once, then derives the 2× movie from that same master with accelerated audio when present; it does not render the 3D film twice. Check the final audio/video; browser and CLI mixing are not identical.

## Verification boundaries

Run `npm test` for public generic/still/comic/voice/cast and new imported-rig/Fast regressions. Native Canvas tests are not a real WebGL/MediaRecorder/download-dialog pass. Still/comic rendering continues using its independent settings; Fast movie defaults do not silently reduce print resolution. Full browser review remains a contributor step in CONTRIBUTING.md.
