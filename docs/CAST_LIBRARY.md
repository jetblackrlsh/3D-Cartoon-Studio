# Cast Library

The public studio includes 60 editable, original procedural stock characters on the existing articulated humanoid rig: 12 each in **everyday, fantasy, sci-fi, western and original superhero** genres. Each genre has six archetypes with masculine/feminine styling variants. Presentation labels are optional styling, not anatomy or casting rules.

## Editor

Build with `npm ci && npm run build`, then open START.html. The **Ready-to-use cast** panel has thumbnail cards, name/tag search and genre filters. Add the chosen character, or select an existing actor and apply the appearance. Applying preserves identity, placement, motion and timeline fields; it changes the rig to `blank-human` and replaces its design. Save the portable project before closing.

**Add diverse background cast** adds up to four actors without replacing existing characters. It prefers unused presets and archetypes, then balances presentation and discourages repeated body profiles, hairstyles and outfit families. It does not infer story roles or use skin color for selection. Select explicit story identities deliberately. Review spacing, context, camera framing and interaction yourself. **Add blank character** remains available. New projects start with an editable everyday preset.

## Headless API

The built `engine.bundle.js` exposes the same data and functions through `CartoonStudio` in a browser or the Canvas VM used by the CLI:

```js
const actor = CartoonStudio.createCastActor('fantasy-elf-f', {
  id: 'guide', action: 'walk', from: [0, 0, 0],
  design: {hairStyle: 'bun', skin: '#94644b', height: 2.6}
});
const supporting = CartoonStudio.diverseCast(4, {
  genre: 'fantasy', seed: 7, existing: [actor]
});
const matches = CartoonStudio.searchCast('braids', 'fantasy');
```

Add actors to normal scene data and call `validate(project)` before staging/rendering. `createCastActor` returns a complete serializable design snapshot. A cast-only actor resolves built-in defaults, with explicit design values overriding them. Unknown cast IDs, wardrobe values, profiles and invalid colors are rejected.

`diverseCast(count, {genre, seed, used, existing})` accepts 1–16 actors within the scene's 16-actor capacity. The seed is a nonnegative safe integer and breaks equal-ranked choices. `existing` accounts for edited designs and occupied capacity; the older `used` array of cast IDs is also supported. Presets/archetypes are exhausted before reuse. Results have unique IDs and line placement at 1.7-unit spacing; editor background additions use 2-unit spacing at Z=-2. Existing actors are not rewritten.

## Editable assets

- `Source/cast-catalog.json`: 60 preset definitions and tags.
- `Source/cast-library.js`: search, creation, diversity and validation.
- `Source/cast-wardrobe.js`: joint-bound procedural clothing, hair and accessories.
- `Source/cast-thumbnails.json`: embedded, locally generated catalog previews; no remote image dependency.
- `Cast-Templates/*.jetcast3d.json`: editable snapshots for tooling/manual authoring. Use the built-in catalog controls in the editor; these are not standalone projects.
- `examples/Cast-Catalog.jetcartoon.json`: loadable portable project with all 60 characters, one per scene.

Appearance fields include `body`, `height` (0.8–3.5 m), `hairStyle`, `hairVisible`, `outfit`, `accessory`, `species`, `variant` (0/1), and six-digit hex colors `skin`, `top`, `legs`, `shoes`, `hair`, `accent`, `eye`. Enumerations are exposed as `bodyProfiles`, `hairStyles`, `outfitStyles` and `accessoryStyles`.

## Compatibility and limits

The cast uses the existing shoulder/elbow/hip/knee/hand contract and 58 authored humanoid actions. Profiles change joint positions/limb lengths, not nonuniform root scale. Held props remain attached to hand sockets. Original generic and skater-proportioned rigs remain available. Captured skating data is not part of this repository; capture-style `skate-*` actions are rejected on cast profiles rather than claiming unsupported retargeting.

This is stylized low-poly geometry. Hair and garments are rigid, not simulated cloth. Two-handed grips, combat contact, furniture clearance, extreme poses and crowd spacing need shot-specific review. Software rendering and WebGL use the same scene geometry but have different lighting/rasterization and can show overlap/sorting artifacts. There is no realistic facial performance or collision solver.

## Licensing

These additions are original procedural studio code, generic preset data and generated previews, released under the repository's **GPL-3.0-only** license. No external character franchise, captured motion, private production project, personal character/world template, story, voice recording or third-party stock asset was added. Existing dependency notices remain unchanged; imported user media is not automatically licensed by this repository.
