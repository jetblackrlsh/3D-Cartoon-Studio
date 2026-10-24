# Reusable 3D props: headless and editor authoring

The 72 names match the verified 2D Studio v1.6.0-rc1 catalog. The models are new volumetric low-poly equivalents, not SVG cards. They require no downloaded models, remote images or online service. The catalog's action suggestions are authoring hints, not automatic choreography.

## Basic scene entry
```json
{"id":"hero-sword","library":"2d-props","kind":"longsword","from":[0,0,0],"scale":1,"colors":{"wood":"#674a35","metal":"#d5ddeb","gold":"#cca45a"},"rotation3d":[0,0,0],"owners":[{"at":0,"actor":"hero"},{"at":0.7,"actor":null}],"hand":1,"socket":"hand","heldOffset":[0,0,0],"visibleFrom":0.1,"visibleUntil":0.95,"keys":[{"at":0,"position":[0,0,0]},{"at":0.7,"position":[1,0.3,0]},{"at":1,"position":[1,0.3,0]}]}
```
This example requires a scene actor with id hero. It attaches the sword to the right hand, returns it to a specified world position at 70% of the scene, and hides it at 95%. It demonstrates state/ownership, not an automatically physically plausible falling motion. Stage and inspect the drop path separately.

## Coordinates and options
- Metres, +Y up, radians. Left hand is 0, right hand is 1. Scale 0.05–10, at most 128 scene props.
- Handheld props use a grip/handling origin. Furniture/scenery use a floor-oriented origin. Place by actual bounds if arranging a tabletop or floor display. `makeLibraryProp` returns a Three.js Group for bounds inspection.
- Swords/staves/tools have their long axis along +Y. Guns, crossbows and cameras face +Z. Do not assume every prop shares one orientation.
- `from` is the world position. `heldOffset` is relative to the selected socket, replacing the world position while attached. `rotation3d` supplies local X/Y/Z rotation and combines with keyed tilt/rotation/roll.
- `alignment:"actor-forward"` keeps +Z facing the owner's forward direction while preserving the hand position; appropriate for the supplied gun poses. Default `socket` inherits socket rotation. This is not target tracking.
- `colors` can override wood, metal, dark, gold, accent, cloth, paper, glass or food. Different objects use different channels. The editor's simple color checkbox overrides accent only; use JSON for other channels.
- `visibleFrom`/`visibleUntil`, owner times and position-key times are normalized scene fractions (0–1), not seconds. Keep keys strictly increasing. For advanced timing, the existing scene track API also supports scale, tilt, rotation and roll.
- `open` or keyed open (0–1) animates the treasure-chest lid. Other props are static geometry unless an author supplies tracks. Torch/candle flames and the hologram in this prop library are sculpted geometry; add the separate fire/particle VFX for animated flame.
- No physics collision, automatic inventory, damage, automatic bow draw, finger grasping, or all-prop two-hand IK. Nothing here is a functional device or weapon schematic.

## Headless API
After loading engine.bundle.js in the same canvas-backed environment used by Source/render.cjs:
```js
const S = CartoonStudio;
console.log(S.propCatalog); // id, label, category, actions, grip
S.validateLibraryProp({library:'2d-props',kind:'longsword',scale:1});
const object = S.makeLibraryProp({library:'2d-props',kind:'longsword'});
const bounds = new S.THREE.Box3().setFromObject(object);
// Prefer adding scene.props entries for ordinary authoring. stage/update manage them.
const stage = S.stage(scene);
await S.prepare(stage); // prepare native-canvas textures before CPU rendering
S.update(stage, 1.5); // absolute scene seconds, safe for deterministic seeking
renderer.render(stage, 1.5);
```
`library:"2d-props"` is required so old prop names keep their original behavior in earlier films. Templates/Props contains 72 .jetprop3d.json templates. Import/export preserves editable data; it does not flatten the object into an image.

## Catalog
| ID | Label | Category | Suggested actions |
|---|---|---|---|
| longsword | Longsword | Fantasy weapons | weapon-slash, weapon-overhead |
| greatsword | Greatsword | Fantasy weapons | weapon-overhead |
| rapier | Rapier | Fantasy weapons | weapon-slash |
| katana | Curved katana | Historical weapons | weapon-slash |
| scimitar | Scimitar | Fantasy weapons | weapon-slash |
| dagger | Dagger | Fantasy weapons | weapon-slash |
| battleaxe | Battle axe | Fantasy weapons | weapon-overhead |
| double-axe | Double axe | Fantasy weapons | weapon-overhead |
| warhammer | War hammer | Fantasy weapons | weapon-overhead |
| mace | Mace | Fantasy weapons | weapon-slash |
| wood-club | Wooden club | Fantasy weapons | weapon-overhead |
| halberd | Halberd | Historical weapons | weapon-slash |
| wood-spear | Long spear | Historical weapons | weapon-slash |
| wizard-staff | Crystal staff | Magic weapons | cast-projectile, channel-power |
| wand | Magic wand | Magic weapons | cast-projectile |
| longbow | Longbow | Historical weapons | reach, carry |
| crossbow | Crossbow | Historical weapons | shoot-rifle |
| round-shield | Round shield | Armor | block-high, block-low |
| kite-shield | Kite shield | Armor | block-high, block-low |
| buckler | Small buckler | Armor | block-high |
| revolver | Western revolver | Modern weapons | shoot-pistol |
| handgun | Modern handgun | Modern weapons | shoot-pistol |
| shotgun | Wood-stock long gun | Modern weapons | shoot-rifle |
| scifi-blaster | Science-fiction blaster | Science fiction props | shoot-pistol, cast-projectile |
| energy-sword | Energy sword | Science fiction props | weapon-slash, weapon-overhead |
| scifi-rifle | Science-fiction long gun | Science fiction props | shoot-rifle |
| scanner | Hand scanner | Science fiction props | reach, carry |
| holo-projector | Hologram projector | Science fiction props | reach, carry |
| mug | Mug | Food and daily life | carry, reach |
| water-bottle | Water bottle | Food and daily life | carry, reach |
| plate | Plate | Food and daily life | carry |
| apple | Apple | Food and daily life | carry, reach |
| bread | Bread loaf | Food and daily life | carry |
| bowl | Bowl | Food and daily life | carry |
| book | Closed book | Documents and devices | carry, reach |
| open-book | Open book | Documents and devices | carry |
| scroll | Scroll | Documents and devices | carry |
| map | Folded map | Documents and devices | carry |
| quill | Quill pen | Documents and devices | reach |
| phone | Phone | Documents and devices | carry, reach |
| laptop | Laptop | Documents and devices | carry |
| camera | Camera | Documents and devices | carry |
| microphone | Microphone | Documents and devices | talk |
| key | Key | Treasure and travel | reach |
| coin-pouch | Coin pouch | Treasure and travel | carry |
| gem | Cut gemstone | Treasure and travel | carry |
| backpack | Backpack | Treasure and travel | carry |
| suitcase | Suitcase | Treasure and travel | carry |
| torch | Lit torch | Tools | carry |
| flashlight | Flashlight | Tools | reach |
| shovel | Shovel | Tools | carry, push |
| pickaxe | Pickaxe | Tools | weapon-overhead |
| wrench | Wrench | Tools | reach |
| tool-hammer | Claw hammer | Tools | weapon-overhead |
| broom | Broom | Tools | push |
| umbrella | Open umbrella | Treasure and travel | carry |
| medical-kit | Medical kit | Tools | carry, heal |
| toolbox | Toolbox | Tools | carry |
| crate | Wood crate | Furniture and scenery | carry, push |
| barrel | Barrel | Furniture and scenery | push |
| chair | Chair | Furniture and scenery | sit |
| table | Small table | Furniture and scenery | sit |
| treasure-chest | Treasure chest | Treasure and travel | carry |
| signpost | Blank signpost | Furniture and scenery |  |
| rope-coil | Coiled rope | Treasure and travel | carry |
| telescope | Telescope | Treasure and travel | point, reach |
| candle | Candle | Food and daily life | carry |
| potion | Potion flask | Magic props | carry, heal |
| crystal-ball | Crystal ball | Magic props | channel-power |
| soccer-ball | Patterned ball | Food and daily life | carry, kick-front |
| gift-box | Gift box | Food and daily life | carry, reach |
| guitar | Guitar | Food and daily life | carry |
