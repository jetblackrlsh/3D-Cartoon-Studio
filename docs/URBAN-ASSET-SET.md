# Cartoon Urban Asset Set v1

18 reusable volumetric props and 6 compact environment presets, rendered with 3D Cartoon Studio's existing textured cartoon pipeline. No WebGPU renderer, TSL shader system, remote asset downloads, or whole-city application is required.

## What's included
Vehicle geometry adapted from Slop New York: sedan, taxi, SUV, bus, helicopter. Geometry is retained, while TSL-painted detail is replaced with ordinary studio materials and simple glazing regions. Liveries, police branding and real transit logos are not included.

Studio-built counterparts of city prop categories: hydrant, mailbox, litter bin, streetlight, traffic signal, food cart, subway entrance, water tower, fire escape, apartment, office tower, park tree and bench. These 13 are intentionally rebuilt cartoon props, not claims of exact source mesh extraction.

Sets: street corner, rooftop, park plaza, transit stop, service alley and skyline. These are newly arranged fictional sets, not geographic Manhattan extracts. No OpenStreetMap/NYC geographic dataset is bundled.

## Use in Studio
The existing prop and environment pickers now contain Urban entries. All previous 72 props, 42 environments, rig presets and effects remain. Load `Examples/Urban-Asset-Catalog.jetcartoon.json` or one of `Examples/Urban-*.jetcartoon.json` for ready-to-render scenes. START.html remains the offline self-contained launcher.

Props use `library: "urban"` and a kind such as `urban-taxi`. Position is `from: [x,y,z]`; `rotation3d` is radians, scale defaults to 1. Colors accept body, accent, metal, dark, glass, paper, leaf, wood and red as #RRGGBB values. Vehicles face +Z, Y is up. Large objects are intended as scenery, not automatically useful as handheld props.

Environment scenes use `environment: "catalog"` and `set: "urban-street-corner"` or another listed ID. Optional environmentOptions.palette supports ground, wall, foliage, accent and sky. Urban sets do not currently implement hideGroups. They are static visual scenery, not collision worlds or navigation meshes.

## Use in future Three.js games
Build the optional portable module with `npm run build:urban`. The resulting `urban-assets.mjs` imports the host's `three` dependency. Call createUrbanAsset("urban-taxi", options) or createUrbanSet("urban-rooftop", options), then add the returned Object3D to your scene. No studio UI or additional renderer is needed. The portable default materials are simple ordinary MeshStandardMaterials; Studio uses its own textured material helper, so exact surface grain differs.

`urban-assets.cjs` is a self-contained Node build for geometry creation and inspection without a browser. It does not render pictures by itself. `node inspect.cjs urban-taxi` prints mesh, vertex and bounding-box data. A host can call Object3D.toJSON() to serialize geometry; importing that JSON requires the corresponding Three.js loader. disposeUrbanAsset(root) frees owned geometry/materials.

## Scope and limitations
This is a curated first asset set, not every asset in Slop New York. No traffic AI, driving physics, animated pedestrians, geographic map, automatic doors, lighting simulation or sound system is included. Rotors and wheels are static geometry, not complete vehicle animation rigs. Fire escapes and subway steps are decorative, not traversable until a game supplies collision. Material conversion deliberately simplifies shader-only details. Public redistribution requires retaining the included MIT/Three.js notices; no geographic data license is being represented as covered by the code's MIT license.

## Provenance
Source repository: https://github.com/mrdoob/slop-newyork
Pinned source commit: 12593c9963f141665fe91881b1b4a2290db51d15
Adapted file: js/actor-models.js. Geometry-only declaration ranges are recorded in Source/urban-vehicle-geometry.js; shader functions and runtime imports removed. Loft helpers originated in Three.js, as acknowledged by upstream. Source copyright: 2026 Mr.doob, MIT. See docs/SLOP-NEWYORK-MIT.txt and the existing Three.js license. New arrangement/material/prop code is separate Studio work, licensed GPL-3.0-only in this public edition, while the retained upstream geometry remains MIT.
