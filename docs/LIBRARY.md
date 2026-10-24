# Reusable 3D library (1.5.0)

Use the runtime catalogs as the source of exact IDs. The public edition adds 58 retargeted humanoid actions, 22 animated visual effects, 90 props and 48 environments. It keeps the existing voice, movie, still and comic-PDF tools.

## Characters and actions

Use kind `blank-human`, `blank-skater`, or `skater`, with `design` colors `skin`, `top`, `legs`, `shoes`, `hair`, `helmet`, and `eye`. `height` is meters (0.8–3.5); `hairVisible` and `helmetVisible` toggle details. Presets also work on the existing generic humanoid rigs. `presetOptions` supports intensity, mirror and optional action accessories. Existing fixed faces do not gain facial morphs.

Get exact action IDs from `CartoonStudio.presetCatalog`. Actor `action` or normalized `beats` selects the preset. Walking and breathing loop naturally; action clips retime to their beat duration. Scene positions are still authored: a walking animation alone does not move the character to another position.

The skater-proportioned blank is original procedural geometry. The private game's captured skating recordings are NOT included: their redistribution rights are unresolved. No gameplay core, proprietary skater model, private recording or story-specific template is part of this repository.

## Environments

Set `environment: "catalog"` and `set` to an ID in `environmentCatalog`. The browser editor exposes a reusable-environment selector. Recommended `camera` and `target` vectors are in the catalog. Optional `environmentOptions.palette` and `hideGroups` customize the set. Delete incompatible backdrop/shot overrides yourself when authoring headlessly.

Sets are volumetric scenery, not navigable game maps or physics collision meshes. Indoors are open-front cutaways. Inspect furniture, foot contact, camera occlusion and water surfaces before making a film.

## Props and effects

Use scene props `{library:"2d-props",kind:"<catalog ID>",from:[x,y,z]}` or `library:"urban"` for urban assets. `owners` tracks attach to an actor. Set `hand` 0/1, `socket` hand/head/body, `heldOffset`, `rotation3d` and optional `alignment:"actor-forward"` deliberately. Hide weapons during unrelated gestures. The engine does not solve arbitrary two-hand grips or collisions.

Use `visualEffectCatalog` for effect IDs; supply `start` and `duration` in seconds, `position`, `color`, `scale`, and optional actor/socket attachment. VFX are not sound effects. Add action sounds and music separately.

Urban vehicle geometry is adapted from mrdoob/slop-newyork at commit 12593c9963f141665fe91881b1b4a2290db51d15 under MIT. Attribution is preserved in SLOP-NEWYORK-MIT.txt. Geographic data, TSL shaders, alternate rendering systems and the upstream application are excluded. Other urban props and sets are original.

## Headless example

After npm ci and npm run build, render the included examples/reusable-library.json with Source/print.cjs or Source/render.cjs. The project is portable and uses only generic source assets. Run node Source/test-library.cjs to exercise 696 timed pose states and 160 asset renders. These are CPU tests, not WebGL/browser-recording certification.
