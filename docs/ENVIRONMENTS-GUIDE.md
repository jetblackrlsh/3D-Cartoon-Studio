# 42 reusable 3D environments

These original low-poly, volumetric counterparts preserve the setting categories and identifying elements of the verified 2D Studio v1.6.0-rc1 catalog. They do not use screenshots or flat background images. Shared tree/building/furniture helpers are intentionally reused; each set combines them with its own relevant scenery. This is a cartoon staging library, not an exact photorealistic reconstruction or game-map generator.

## Browser controls
Choose catalog in the Environment selector, choose the set in Reusable environment, then apply the scene. Author palette and hideGroups through project JSON. This public editor does not include the private template-import panel or automatic camera reset.

## Headless scene example
```json
{
 "id":"forest-arrival", "title":"Forest arrival", "caption":"The party enters the pines.",
 "duration":6, "environment":"catalog", "set":"pine-forest",
 "environmentOptions":{"palette":{"foliage":"#3a7464","sky":"#7ca6c9"},"hideGroups":[]},
 "actors":[], "props":[], "camera":[8,5.2,11], "target":[0,1.7,-3]
}
```
Use the same init/stage/update/prepare/SoftwareRenderer workflow as the rest of the Studio. `environmentCatalog` lists IDs, labels, categories and starting camera/target values. `validateEnvironment(scene)` checks a catalog scene's ID and options. `makeEnvironment(scene)` returns a Three.js Group if a host needs the geometry directly. The normal `stage` path is preferred because it also wires up sky/background information.

- Palette channels: ground, wall, foliage, accent, sky. Colors are six-digit hex strings. Existing objects keep their semantic material roles; one palette color is not an arbitrary texture replacement.
- Units are metres, Y-up. Static ground is nominally y=0. The central x=-3..3,z=0..4 area is reserved for staging in ordinary land/interior sets, not guaranteed collision-free under all modifications.
- Interiors are open-front cutaways, with a roof in the cavern. They are not enclosed 360-degree architectural models. Author reverse shots carefully.
- Open ocean has a water surface, not a walkable platform. Add a boat, deck, island or swimming action. Underwater reef requires underwater context and movement. There is no buoyancy, drowning, swimming physics or terrain collision.
- Water, lava, mist, clouds and plants are static sculpted scenery. Use the separate 22 VFX presets for animated weather/fire/particles. Do not infer sound effects from a visual environment.
- No navigation mesh, automatic pathfinding, gameplay collision or lighting simulation is implied. CPU rendering remains painter-sorted and stylized; inspect windows, thin surfaces and transparency from the selected camera.

## Catalog
| ID | Category |
|---|---|
| meadow | Nature |
| deciduous-forest | Nature |
| pine-forest | Nature |
| rainforest | Nature |
| swamp | Nature |
| desert-dunes | Nature |
| red-canyon | Nature |
| snowy-forest | Nature |
| tundra | Nature |
| alpine-mountains | Nature |
| tropical-beach | Nature |
| open-ocean | Nature |
| underwater-reef | Nature |
| volcano | Nature |
| crystal-cavern | Nature |
| moonlit-forest | Nature |
| farmstead | Fantasy |
| medieval-village | Fantasy |
| castle-courtyard | Fantasy |
| tavern-interior | Fantasy |
| stone-dungeon | Fantasy |
| ancient-temple | Fantasy |
| misty-graveyard | Fantasy |
| western-town | Modern |
| city-day | Modern |
| city-night | Modern |
| urban-alley | Modern |
| city-park | Modern |
| subway-platform | Modern |
| office | Modern |
| classroom | Modern |
| hospital-room | Modern |
| kitchen | Modern |
| bedroom | Modern |
| living-room | Modern |
| warehouse | Modern |
| starship-bridge | ScienceFiction |
| station-corridor | ScienceFiction |
| alien-planet | ScienceFiction |
| cyberpunk-street | ScienceFiction |
| wasteland | ScienceFiction |
| moon-base | ScienceFiction |

## Public editor and tests
Choose catalog in the Environment field, select the reusable set, then apply. Set camera/shot coordinates deliberately; replacing the set does not automatically clear authored backdrop, shot or sequence overrides. The public source includes examples/reusable-library.json and Source/test-library.cjs, not the private full demo/template-import UI.
