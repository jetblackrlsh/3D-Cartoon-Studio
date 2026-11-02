# Minifigure character configurator

The minifigure-style actor is an optional original procedural toy character. It uses the existing sets, cameras, scene timeline, sound and animation preset controls. It is not an official LEGO product or a library of branded parts.

## Create a character

1. Open the **Minifigure character configurator** in the character/preset section.
2. Choose headwear, face, torso design and hand accessory.
3. Set skin, torso, legs, feet, hair and helmet colors, and height.
4. Click **Add minifigure**. Existing actors remain in the scene. The new actor is selected for editing.
5. Choose an existing action in **Preset** and click **Apply preset to scene**.

The configurator is finite: headwear choices are none, short hair, bob, spiky hair or helmet; faces are smile, neutral, angry or surprised; torso designs are plain, zipper, spacesuit or knight; hand accessories are none, sword, wand or mug. These are procedural options, not arbitrary imported part compatibility.

## Edit without losing a performance

Select a minifigure in the actor selector, adjust the configurator, then click **Apply to selected minifigure**. Its ID, placement, action tracks and motion settings remain unchanged. Applying these controls to a normal actor produces a message rather than silently replacing it. Adding a character is also separate from changing a selected actor.

The existing **Rig** dropdown provides an explicit minifigure selection when a rig change is intended. Use **Apply appearance** to commit that choice. Review existing motion and native-clip compatibility after any deliberate rig change.

**Save portable project** preserves character settings with the ordinary project. Closing a tab without saving still loses unsaved edits. A fresh project keeps its existing default cast; minifigures are opt-in.

## Motion and framing

Use the existing authored animation presets. The toy adaptation uses rigid limbs rather than adding flexible elbows and knees. Inspect the full movement, especially sitting, contact with furniture, prop handling and other actors. Accessories are attached geometry, not automatic interaction or collision solving.

Animation is smoothly sampled; this expansion does not add stop-motion timing. Existing project render settings remain intact. Fast Mode still exports six frames per second, so use an explicit higher-frame-rate render setting when evaluating smooth motion.

The configurator has DOM regression tests with a stub preview renderer. Those checks are not proof of WebGL, real-browser movie recording, audio playback, or cross-device behavior.

## Agent and JSON interface

A minifigure is a regular scene actor. For example:

```json
{
  "id": "pilot",
  "kind": "minifigure",
  "from": [0, 0, 0],
  "action": "wave",
  "design": {
    "skin": "#925e40",
    "top": "#2b87bd",
    "legs": "#253f66",
    "shoes": "#253f66",
    "hair": "#302626",
    "helmet": "#f0f3f8",
    "headwear": "helmet",
    "face": "smile",
    "torsoPrint": "spacesuit",
    "handAccessory": "none",
    "height": 2.2
  }
}
```

`CartoonStudio.createMinifigureActor(design, options)` returns an actor with validated defaults. Options can specify the ID, placement and authored action. `CartoonStudio.normalizeMinifigureDesign(design)` validates colors (`#RRGGBB`), supported choices and height (0.8–3.5). `CartoonStudio.minifigureOptions` lists current supported choices. The generated actor deliberately uses `design`, not an existing stock `cast` ID.

All 58 authored Studio preset names are consumed by the toy adapter. That is **intent adaptation**, not exact human skeletal retargeting. The shoulders, hips, wrists and head move while elbows and knees stay rigid. Human kneels/crouches are approximated with toy-compatible lean and leg positions; a human-looking kneel is not promised. Sitting extends rigid legs and still needs appropriate chair placement. The existing environment does not automatically solve furniture contacts or foot sliding.

Imported `standardAnimation` skeleton clips are not minifigure animations and are rejected by the engine rather than retargeted. Deliberately choosing the minifigure rig and clicking **Apply appearance** removes incompatible actor/beat native clip references, retains supported authored actions, and uses idle where no authored action existed. The editor reports this conversion. Review the result and select appropriate Studio presets; no native animation is converted automatically. JSON authors must remove incompatible clip references themselves.

Preset-generated matching accessories and the configurator's permanent hand accessory are separate features. Avoid enabling both for the same hand when the scene does not call for two objects.

Validation command after building: `node Source/test-minifigure-ui.cjs`. The engine and rendered-image tests are separate from this UI test.
