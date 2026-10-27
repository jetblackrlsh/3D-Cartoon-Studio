// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
import { defaultRenderMode, createProject, renderSettings, backgroundExtraEligible, createBackgroundCutout, renderBudget } from "./fast-mode.js";
import standardCastThumbnails from "./standard-cast-thumbnails.json";
import { standardCastCatalog, standardAppearanceOptions, standardCastDesign, createStandardCastActor, selectStandardCast, searchStandardCast, validateStandardAppearance, applyStandardAppearance, serializeStandardCast, parseStandardCast } from "./standard-cast.js";
import { getStandardAssetState, restoreStandardAssetState, loadStandardAsset, initStandardAssets, standardAssetCatalog, createStandardRig, validateStandardActor, syncStandardRig, applyStandardPose, applyStandardAnimation, getStandardSocket, mapStandardBones, standardRigSnapshot, retargetStandardClip, refreshStandardRig, solveStandardGrip, applyStandardLookAt, solveStandardActionGrips } from "./standard-rigs.js";
import castThumbnails from "./cast-thumbnails.json";
import { castCatalog, castDesign, createCastActor, searchCast, diverseCast, validateCastActor, bodyProfiles, hairStyles, outfitStyles, accessoryStyles } from "./cast-library.js";
import * as THREE from "three";
import { urbanPropCatalog, urbanEnvironmentCatalog, validateUrbanProp, makeUrbanProp, validateUrbanEnvironment, makeUrbanEnvironment } from "./urban-assets.js";
import { environmentCatalog as baseEnvironmentCatalog, validateEnvironment as validateBaseEnvironment, makeEnvironment as makeBaseEnvironment } from "./reusable-environments.js";
import { propCatalog as basePropCatalog, validateLibraryProp as validateBaseProp, makeLibraryProp as makeBaseProp } from "./reusable-props.js";
import { visualEffectCatalog, validateVisualEffect, makeVisualEffect, updateVisualEffect } from "./reusable-effects.js";
import { createFlexibleRig, applyPreset, prepareActionProps, updateActionProps, presetCatalog, exportPreset, samplePreset } from "./flexible-rigs.js";
const propCatalog = [...basePropCatalog, ...urbanPropCatalog], environmentCatalog = [...baseEnvironmentCatalog, ...urbanEnvironmentCatalog];
const validateLibraryProp = (p) => p.library === "urban" ? validateUrbanProp(p) : validateBaseProp(p);
const makeLibraryProp = (p, H) => p.library === "urban" ? makeUrbanProp(p, H) : makeBaseProp(p, H);
const validateEnvironment = (s) => s.environment === "catalog" && s.set?.startsWith("urban-") && urbanEnvironmentCatalog.some((x) => x.id === s.set) ? validateUrbanEnvironment(s) : validateBaseEnvironment(s);
const makeEnvironment = (s, H) => urbanEnvironmentCatalog.some((x) => x.id === s.set) ? makeUrbanEnvironment(s, H) : makeBaseEnvironment(s, H);
const TAU = Math.PI * 2, clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const cache = /* @__PURE__ */ new Map();
let assets = {};
function cv(w = 128, h = w) {
  let c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
function texture(kind, color = "#80949c") {
  let key = kind + color;
  if (cache.has(key)) return cache.get(key);
  let c = cv(), x = c.getContext("2d");
  x.fillStyle = color;
  x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 90; i++) {
    let a = (Math.sin(i * 87.31) + 1) / 2, b = (Math.sin(i * 13.77) + 1) / 2;
    x.fillStyle = i % 2 ? "#ffffff0c" : "#00000012";
    x.fillRect(
      a * 128,
      b * 128,
      kind === "wood" ? 2 : 5,
      kind === "wood" ? 128 : 2
    );
  }
  x.lineWidth = 2;
  x.strokeStyle = "#00000038";
  if (kind === "stone") {
    for (let y = 0; y < 128; y += 32) {
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(128, y);
      x.stroke();
      for (let z = y % 64 ? 16 : 0; z < 128; z += 64) {
        x.beginPath();
        x.moveTo(z, y);
        x.lineTo(z, y + 32);
        x.stroke();
      }
    }
  }
  if (kind === "metal") {
    x.strokeStyle = "#d8eef844";
    x.strokeRect(6, 6, 116, 116);
    for (let px of [10, 118])
      for (let py of [10, 118]) {
        x.fillStyle = "#f1faff88";
        x.fillRect(px, py, 3, 3);
      }
  }
  if (kind === "cloth") {
    x.strokeStyle = "#ffffff08";
    for (let i = 0; i < 128; i += 4) {
      x.beginPath();
      x.moveTo(i, 0);
      x.lineTo(i, 128);
      x.moveTo(0, i);
      x.lineTo(128, i);
      x.stroke();
    }
  }
  if (kind === "fur") {
    x.strokeStyle = "#ffffff22";
    for (let i = 0; i < 240; i++) {
      let px = i * 37 % 128, py = i * 61 % 128;
      x.beginPath();
      x.moveTo(px, py);
      x.lineTo(px + 2, py + 5);
      x.stroke();
    }
  }
  if (kind === "scales") {
    x.strokeStyle = "#ffffff33";
    for (let y = 0; y < 128; y += 12)
      for (let xx = 0; xx < 128; xx += 16) {
        x.beginPath();
        x.arc(xx + (y % 24 ? 8 : 0), y, 7, 0, Math.PI);
        x.stroke();
      }
  }
  if (kind === "books") {
    for (let i = 0; i < 12; i++) {
      x.fillStyle = ["#7a315a", "#b3a65b", "#4b8c88", "#4d527b"][i % 4];
      x.fillRect(i * 11, 6, 9, 116);
      x.fillStyle = "#e1c888";
      x.fillRect(i * 11 + 2, 18, 5, 2);
    }
  }
  if (kind === "paper") {
    x.fillStyle = "#8a8d9f";
    for (let i = 12; i < 120; i += 12) x.fillRect(10, i, 90 - i % 30, 1);
  }
  if (kind === "stars") {
    x.fillStyle = "#e5dfff";
    for (let i = 0; i < 80; i++)
      x.fillRect(i * 173 % 127, i * 61 % 127, i % 9 === 0 ? 2 : 1, 1);
  }
  let t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.userData.canvas = c;
  cache.set(key, t);
  return t;
}
function mat(kind, color, repeat = 1) {
  let map = texture(kind, color);
  if (repeat > 1) {
    let key = kind + color + repeat;
    if (!cache.has(key)) {
      let c = cv(128 * repeat), x = c.getContext("2d");
      x.fillStyle = x.createPattern(map.userData.canvas, "repeat");
      x.fillRect(0, 0, c.width, c.height);
      let t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.userData.canvas = c;
      cache.set(key, t);
    }
    map = cache.get(key);
  }
  return new THREE.MeshStandardMaterial({ map, roughness: 0.72 });
}
function mesh(parent, geo, material, x = 0, y = 0, z = 0) {
  let m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function box(parent, w, h, d, m, x, y, z) {
  return mesh(
    parent,
    new THREE.BoxGeometry(w, h, d, w > 8 ? 8 : 1, 1, d > 8 ? 8 : 1),
    m,
    x,
    y,
    z
  );
}
function cyl(parent, r, h, m, x, y, z, sides = 8) {
  return mesh(parent, new THREE.CylinderGeometry(r, r, h, sides), m, x, y, z);
}
function orb(parent, r, m, x, y, z) {
  return mesh(parent, new THREE.SphereGeometry(r, 8, 5), m, x, y, z);
}
const TYPES = {
  person: {
    skin: "#a87957",
    top: "#36a99b",
    legs: "#334657"
  },
  worker: {
    skin: "#70452e",
    top: "#eeb34f",
    legs: "#384d6d"
  },
  scholar: {
    skin: "#d6a87e",
    top: "#495aa5",
    legs: "#2e334e",
    cloak: true
  },
  knight: {
    skin: "#c48a67",
    top: "#9caab7",
    legs: "#596d7d"
  },
  robot: {
    skin: "#9aafbd",
    top: "#627f91",
    legs: "#475d6c"
  },
  traveler: {
    skin: "#543624",
    top: "#b35b49",
    legs: "#475246",
    cloak: true
  }
};
function rig(kind = "person", design) {
  if (kind === "standard-humanoid") {
    const r = createStandardRig(design?.standardAsset || "quaternius-ual", design || {}, { mat, mesh, box, cyl, orb });
    if (design?.standardAppearance === true || design?.outfit) {
      applyStandardAppearance(r, design);
      refreshStandardRig(r);
    }
    return r;
  }

  if (["blank-human", "blank-skater", "skater"].includes(kind)) return createFlexibleRig(kind, design || {}, { mat, mesh, box, cyl, orb });
  if (["deer", "rabbit", "badger", "squirrel"].includes(kind))
    return woodlandRig(kind);
  let info = TYPES[kind] || TYPES.person, root = new THREE.Group(), body = new THREE.Group();
  root.add(body);
  let cloth = mat("cloth", info.top), pants = mat("cloth", info.legs), skin = mat("cloth", info.skin), shoe = mat("cloth", "#382f43");
  let hips = new THREE.Group();
  hips.position.y = 1;
  body.add(hips);
  box(hips, 0.54, 0.25, 0.3, pants, 0, 0, 0);
  cyl(body, 0.31, 0.78, cloth, 0, 1.5, 0, 8);
  let neck = cyl(body, 0.1, 0.16, skin, 0, 1.96, 0);
  let head = new THREE.Group();
  head.position.set(0, 2.25, 0);
  body.add(head);
  const face = orb(head, 0.33, skin, 0, 0, 0);
  face.scale.set(0.94, 1.14, 0.84);
  for (const side of [-1, 1]) {
    orb(head, 0.065, mat("cloth", "#f6f4ec"), side * 0.12, 0.05, 0.26);
    orb(head, 0.029, mat("cloth", "#252c38"), side * 0.12, 0.05, 0.314);
  }
  box(head, 0.12, 0.025, 0.02, mat("cloth", "#594234"), 0, -0.13, 0.272);
  let arms = [], forearms = [], legs = [], shins = [], hands = [];
  for (let side of [-1, 1]) {
    let shoulder = new THREE.Group();
    shoulder.position.set(side * 0.39, 1.84, 0);
    body.add(shoulder);
    cyl(shoulder, 0.12, 0.48, cloth, 0, -0.23, 0);
    let elbow = new THREE.Group();
    elbow.position.y = -0.47;
    shoulder.add(elbow);
    cyl(elbow, 0.1, 0.43, cloth, 0, -0.21, 0);
    let hand = box(elbow, 0.18, 0.2, 0.2, skin, 0, -0.48, 0);
    arms.push(shoulder);
    forearms.push(elbow);
    hands.push(hand);
    let hip = new THREE.Group();
    hip.position.set(side * 0.16, 1, 0);
    body.add(hip);
    cyl(hip, 0.14, 0.48, pants, 0, -0.23, 0);
    let knee = new THREE.Group();
    knee.position.y = -0.47;
    hip.add(knee);
    cyl(knee, 0.12, 0.44, pants, 0, -0.22, 0);
    box(knee, 0.24, 0.16, 0.4, shoe, 0, -0.46, 0.06);
    legs.push(hip);
    shins.push(knee);
  }
  if (info.cloak) {
    let cape = box(body, 0.76, 1.4, 0.06, cloth, 0, 1.15, -0.23);
    cape.rotation.x = 0.12;
  }
  let paper = box(root, 0.75, 1, 0.012, mat("paper", "#ded7c3"), 0, 1, 0);
  paper.visible = false;
  let trapeze = new THREE.Group();
  root.add(trapeze);
  let bar = cyl(trapeze, 0.035, 0.95, mat("metal", "#8faaa9"), 0, 2.86, 0);
  bar.rotation.z = Math.PI / 2;
  for (let side of [-1, 1])
    cyl(trapeze, 0.015, 2.5, mat("cloth", "#c9b78a"), side * 0.4, 4.1, 0);
  trapeze.visible = false;
  return {
    root,
    body,
    paper,
    trapeze,
    head,
    arms,
    forearms,
    legs,
    shins,
    hands,
    kind
  };
}
function pose(r, action, t) {
  let b = Math.sin(t * 6), slow = Math.sin(t * 2);
  r.body.position.y = 0;
  r.body.rotation.set(0, 0, 0);
  r.head.rotation.set(0, 0, 0);
  r.arms.forEach((x) => x.rotation.set(0, 0, 0));
  r.forearms.forEach((x) => x.rotation.set(0, 0, 0));
  r.legs.forEach((x) => x.rotation.set(0, 0, 0));
  r.shins.forEach((x) => x.rotation.set(0, 0, 0));
  if (["walk", "run", "march"].includes(action)) {
    let amp = action === "run" ? 0.7 : 0.4;
    r.legs[0].rotation.x = b * amp;
    r.legs[1].rotation.x = -b * amp;
    r.arms[0].rotation.x = -b * amp;
    r.arms[1].rotation.x = b * amp;
    r.shins.forEach(
      (s, i) => s.rotation.x = Math.max(0, Math.sin(t * 6 + i * Math.PI)) * 0.45
    );
    r.body.position.y = Math.abs(b) * 0.055;
  }
  if (["talk", "think", "gesture", "observe"].includes(action)) {
    r.head.rotation.y = slow * 0.12;
    r.forearms[1].rotation.x = -0.75 - slow * 0.2;
    r.arms[1].rotation.z = -0.15;
    r.arms[0].rotation.x = 0.08 * slow;
    if (action === "think") {
      r.arms[1].rotation.x = -0.7;
      r.forearms[1].rotation.x = -1.5;
    }
  }
  if (action === "dance") {
    r.arms[0].rotation.z = 1.1 + b * 0.4;
    r.arms[1].rotation.z = -1.1 - b * 0.4;
    r.legs[0].rotation.x = b * 0.35;
    r.legs[1].rotation.x = -b * 0.35;
    r.body.rotation.z = slow * 0.12;
    r.body.position.y = Math.abs(b) * 0.15;
  }
  if (action === "swing") {
    r.arms.forEach((a) => a.rotation.x = Math.PI);
    r.legs.forEach((a, i) => a.rotation.x = 0.5 + slow * 0.2 + i * 0.2);
    r.body.rotation.z = Math.sin(t * 2) * 0.22;
  }
  if (action === "aim") {
    r.arms.forEach((a) => a.rotation.x = -Math.PI / 2);
    r.forearms[0].rotation.z = 0.35;
  }
  if (action === "attack") {
    r.arms[1].rotation.x = -1.2 - Math.max(0, b) * 0.8;
    r.body.rotation.y = slow * 0.2;
  }
  if (action === "fall") {
    r.body.rotation.z = -1.2;
    r.body.position.y = -0.6;
    r.arms.forEach((a) => a.rotation.z = 0.7);
  }
  if (action === "sit") {
    r.legs.forEach((a) => a.rotation.x = -Math.PI / 2);
    r.shins.forEach((a) => a.rotation.x = Math.PI / 2);
    r.body.position.y = -0.42;
  }
  if (action === "brace") {
    r.arms.forEach((a) => a.rotation.x = -1.2);
    r.body.rotation.x = -0.15;
  }
}
function prop(parent, kind, x, y, z) {
  let g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  let wood = mat("wood", "#794a31"), metal = mat("metal", "#5e7788");
  if (kind === "bed") {
    box(g, 3, 0.15, 1.1, mat("cloth", "#d3d9ce"), 0, 0.65, 0);
    for (let xx of [-1.2, 1.2])
      for (let zz of [-0.4, 0.4]) cyl(g, 0.06, 0.6, metal, xx, 0.3, zz);
    box(g, 0.4, 0.15, 0.8, mat("cloth", "#e2dfcf"), 1.1, 0.78, 0);
  }
  if (kind === "hourglass") {
    for (let yy of [-0.35, 0.35])
      cyl(g, 0.27, 0.06, mat("metal", "#bba264"), 0, yy, 0);
    mesh(
      g,
      new THREE.ConeGeometry(0.2, 0.3, 8),
      mat("stars", "#b9d9e4"),
      0,
      0.15,
      0
    ).rotation.x = Math.PI;
    mesh(
      g,
      new THREE.ConeGeometry(0.2, 0.3, 8),
      mat("stars", "#e7cc8c"),
      0,
      -0.15,
      0
    );
    for (let xx of [-0.25, 0.25])
      cyl(g, 0.025, 0.7, mat("metal", "#bba264"), xx, 0, 0);
  }
  if (kind === "branch") cyl(g, 0.045, 0.9, wood, 0, 0, 0);
  if (kind === "staff") {
    cyl(g, 0.04, 1.4, metal, 0, 0, 0);
    orb(g, 0.14, mat("stars", "#83b99c"), 0, 0.8, 0);
  }
  if (kind === "sword") {
    box(g, 0.08, 0.3, 0.08, wood, 0, 0, 0);
    box(g, 0.12, 0.8, 0.04, metal, 0, 0.55, 0);
    box(g, 0.35, 0.045, 0.08, metal, 0, 0.15, 0);
  }
  if (kind === "console") {
    box(g, 1.2, 0.7, 0.6, metal, 0, 0.35, 0);
    box(g, 1, 0.5, 0.03, mat("stars", "#7abbd0"), 0, 0.8, -0.2);
  }
  if (kind === "rock") {
    ell(g, 0.5, 0.4, 0.4, mat("stone", "#817b77"), 0, 0.4, 0);
  }
  if (kind === "lantern") {
    cyl(g, 0.18, 0.32, mat("stars", "#ffd785"), 0, 0.2, 0);
    cyl(g, 0.23, 0.06, metal, 0, 0.02, 0);
    cyl(g, 0.23, 0.06, metal, 0, 0.4, 0);
    mesh(g, new THREE.TorusGeometry(0.14, 0.025, 4, 12), metal, 0, 0.54, 0);
    for (let a of [0, 1.57, 3.14, 4.71])
      cyl(g, 0.02, 0.4, metal, Math.cos(a) * 0.19, 0.21, Math.sin(a) * 0.19);
  }
  if (kind === "relic") {
    orb(g, 0.17, mat("stars", "#a19bea"), 0, 0, 0);
    mesh(g, new THREE.TorusGeometry(0.25, 0.035, 4, 16), metal, 0, 0, 0);
  }
  if (kind === "flash") {
    orb(g, 0.12, mat("stars", "#e9bfff"), 0, 0, 0);
  }
  if (kind === "rifle") {
    box(g, 0.1, 0.12, 0.58, metal, 0, 0, 0);
    box(g, 0.08, 0.25, 0.1, wood, 0, -0.12, -0.05);
    cyl(g, 0.045, 0.42, metal, 0, 0, 0.4).rotation.x = Math.PI / 2;
  }
  if (kind === "knife") {
    box(g, 0.07, 0.22, 0.08, wood, 0, 0, 0);
    let blade = mesh(
      g,
      new THREE.ConeGeometry(0.07, 0.45, 3),
      mat("metal", "#d2e6ef"),
      0,
      0.32,
      0
    );
  }
  if (kind === "spear") {
    cyl(g, 0.035, 2.1, wood, 0, 0, 0);
    mesh(g, new THREE.ConeGeometry(0.12, 0.32, 4), metal, 0, 1.16, 0);
  }
  if (kind === "box") {
    let lid = new THREE.Group();
    lid.position.set(0, 0.42, -0.5);
    g.add(lid);
    box(lid, 1.6, 0.06, 1.1, wood, 0, 0, 0.5);
    g.userData.lid = lid;
    box(g, 1.6, 0.1, 1.1, wood, 0, 0, 0);
    for (let side of [-1, 1]) box(g, 0.08, 0.4, 1.1, wood, side * 0.78, 0.2, 0);
    box(g, 1.6, 0.4, 0.08, wood, 0, 0.2, -0.5);
  }
  if (kind === "tablet") {
    box(g, 1.8, 1.1, 0.08, mat("paper", "#bab5db"), 0, 0, 0);
  }
  if (kind === "slime") {
    let jelly = mat("stars", "#395e81");
    let o = orb(g, 0.56, jelly, 0, 0, 0);
    o.scale.set(1, 1.35, 0.72);
  }
  if (kind === "top") {
    mesh(
      g,
      new THREE.ConeGeometry(0.18, 0.25, 12),
      mat("metal", "#9451cd"),
      0,
      0,
      0
    ).rotation.x = Math.PI;
    cyl(g, 0.025, 0.2, metal, 0, 0.17, 0);
  }
  return g;
}
function environment(name) {
  let g = new THREE.Group(), stone = mat("stone", "#6e7188", 8), wood = mat("wood", "#754e39"), metal = mat("metal", "#728e9f"), floor = mat(
    "stone",
    name === "royal" ? "#d1bd98" : name === "void" ? "#101324" : "#506577",
    8
  );
  box(g, 22, 0.15, 20, floor, 0, -0.2, 0);
  if (name === "void") {
    let star = mat("stars", "#16112e");
    for (let i = 0; i < 12; i++) {
      let o = orb(
        g,
        0.08 + i % 3 * 0.03,
        star,
        Math.sin(i * 8.1) * 8,
        1 + i % 5 * 0.8,
        -3 - i % 4
      );
    }
    return g;
  }
  box(g, 22, 7, 0.2, stone, 0, 3.3, -6);
  box(g, 0.2, 7, 20, stone, -10, 3.3, 0);
  box(g, 0.2, 7, 20, stone, 10, 3.3, 0);
  if (name === "jungle" || name === "gym") {
    for (let x = -7; x <= 7; x += 3.5) {
      cyl(g, 0.06, 5, metal, x, 2.4, -2);
      let bar = cyl(g, 0.055, 4.2, metal, x, 4.8, -0.5);
      bar.rotation.x = Math.PI / 2;
    }
    for (let x = -6; x < 7; x += 3) {
      let beam = box(g, 2.7, 0.08, 0.08, metal, x, 3.3, -2);
      for (let y = 0.4; y < 4; y += 0.5)
        box(g, 1.3, 0.05, 0.05, metal, -5, y, 1);
    }
    box(g, 4, 0.12, 4, mat("cloth", "#77515e"), 3, -0.06, 0);
  }
  if (name === "royal" || name === "diner") {
    box(g, 7, 0.18, 1.4, wood, 0, 1.1, -1);
    for (let x = -3; x <= 3; x += 2) {
      box(g, 0.15, 1.1, 0.15, wood, x, 0.5, -1);
      cyl(g, 0.22, 0.04, mat("metal", "#c5bca0"), x, 1.22, -0.8);
      box(g, 0.7, 0.13, 0.65, wood, x, 0.65, -2);
      box(g, 0.7, 1, 0.12, wood, x, 1.2, -2.25);
    }
    if (name === "royal") {
      for (let x of [-8, -4, 4, 8]) {
        cyl(g, 0.3, 6, mat("stone", "#d7c9af"), x, 2.9, -4);
        box(g, 1.2, 2.4, 0.08, mat("cloth", "#6e3486"), x, 3.2, -5.7);
      }
    }
  }
  if (name === "library") {
    for (let x of [-7, -3, 1, 5]) {
      box(g, 2.5, 4, 0.65, wood, x, 2, -4);
      for (let y of [0.6, 1.6, 2.6, 3.6]) {
        box(g, 2.3, 0.7, 0.08, mat("books", "#645844"), x, y, -3.62);
        box(g, 2.5, 0.08, 0.8, wood, x, y - 0.4, -4);
      }
    }
    box(g, 3, 0.15, 1.5, wood, 0, 1.05, 0);
  }
  if (name === "room") {
    box(g, 2.1, 3.5, 0.15, wood, 0, 1.6, -3);
  }
  if (name === "street") {
    g.remove(g.children[1]);
    for (let i = 0; i < 7; i++) {
      let x = (i - 3) * 3;
      box(
        g,
        2.4,
        2.5 + i % 3,
        2.5,
        mat("stone", ["#967f83", "#6a8e9d", "#b59c7b"][i % 3]),
        x,
        1.2 + i % 3 / 2,
        -4
      );
      box(g, 0.7, 1.4, 0.03, wood, x, 0.6, -2.7);
      for (let dx of [-0.6, 0.6])
        box(g, 0.45, 0.6, 0.04, mat("metal", "#bfd7c4"), x + dx, 1.8, -2.68);
    }
  }
  return g;
}
function validateTracks(s) {
  const vec = (x) => Array.isArray(x) && x.length === 3 && x.every((v) => Number.isFinite(v) && Math.abs(v) < 100);
  function ordered(list) {
    let last = -1;
    for (let k of list || []) {
      if (!Number.isFinite(k.at) || k.at < 0 || k.at > 1 || k.at <= last)
        throw Error("Track times must increase from 0 to 1.");
      last = k.at;
      for (let v of ["position", "camera", "target", "to", "targetTo"])
        if (k[v] && !vec(k[v])) throw Error("Invalid track vector.");
    }
  }
  ordered(s.shots);
  if (s.shots?.length && s.shots[0].at !== 0)
    throw Error("First shot must start at 0.");
  for (let sh of s.shots || [])
    if (!vec(sh.camera) || !vec(sh.target))
      throw Error("Shots need camera and target vectors.");
  let ids = new Set((s.actors || []).map((a) => a.id));
  for (let a of [...s.actors || [], ...s.props || []]) {
    ordered(a.keys);
    ordered(a.beats);
    ordered(a.owners);
    for (let k of ["visibleFrom", "visibleUntil", "armedAt", "disarmedAt"])
      if (a[k] !== void 0 && (!Number.isFinite(a[k]) || a[k] < 0 || a[k] > 1.001))
        throw Error("Invalid visibility time.");
    for (let o of a.owners || [])
      if (o.actor !== null && !ids.has(o.actor))
        throw Error("Unknown prop owner.");
  }
}
function validate(p, {deferStandardAssets=false}={}) {
  if(p?.renderSettings) renderSettings(p);
  if (p?.schema !== "JetCartoonProject" || p.version !== 1 || !Array.isArray(p.scenes) || !p.scenes.length || p.scenes.length > 500)
    throw Error("Invalid studio project.");
  for (let s of p.scenes) {
    validateTracks(s);
    validateEnvironment(s);
    for (const e of s.effects || []) validateVisualEffect(e);
    for (const p2 of s.props || []) validateLibraryProp(p2);
    if (s.camera && (!Array.isArray(s.camera) || s.camera.length !== 3 || !s.camera.every((x) => Number.isFinite(x) && Math.abs(x) < 100)))
      throw Error("Invalid camera.");
    if (![
      "catalog",
      "void",
      "jungle",
      "royal",
      "gym",
      "room",
      "library",
      "diner",
      "street"
    ].includes(s.environment))
      throw Error("Unknown environment.");
    if (!Number.isFinite(s.duration) || s.duration < 1 || s.duration > 180)
      throw Error("Scene duration must be 1\u2013180 seconds.");
    if (typeof s.caption !== "string" || s.caption.length > 8e3)
      throw Error("Invalid caption.");
    if (!Array.isArray(s.actors) || s.actors.length > 16)
      throw Error("Limit 16 actors per scene.");
    for (let a of s.actors) {
      if (!["standard-humanoid", "blank-human", "blank-skater", "skater", "deer", "rabbit", "badger", "squirrel"].includes(a.kind) && !TYPES[a.kind])
        throw Error("Unknown character rig.");

      if(a.kind==='standard-humanoid') {
        if(!deferStandardAssets)validateStandardActor(a);
        else if(typeof a.design?.standardAsset!=="string")throw Error("Missing imported skeleton asset identifier");
        for(const beat of a.beats||[]) if(beat.standardAnimation&&!deferStandardAssets) validateStandardActor({...a,standardAnimation:beat.standardAnimation});
        validateStandardAppearance(a.design);
      } else validateCastActor(a);
      if (/^(?:skate-|skating-|captured:)/.test(a.action||'') || (a.beats||[]).some(b=>/^(?:skate-|skating-|captured:)/.test(b.action||''))) throw Error('Captured skating is not distributed in the public source edition');
      if(a.presetOptions?.intensity!==undefined&&(!Number.isFinite(a.presetOptions.intensity)||a.presetOptions.intensity<.25||a.presetOptions.intensity>1.5)) throw Error('Invalid preset intensity');
      if (a.design?.height !== void 0 && (!Number.isFinite(a.design.height) || a.design.height < 0.8 || a.design.height > 3.5)) throw Error("Invalid character height");
      if (a.scale !== void 0 && (!Number.isFinite(a.scale) || a.scale <= 0 || a.scale > 10))
        throw Error("Invalid actor scale.");
      for (let v of [...a.from || [0, 0, 0], ...a.to || [0, 0, 0]])
        if (!Number.isFinite(v) || Math.abs(v) > 100)
          throw Error("Invalid actor position.");
    }
  }
  return p;
}
function timeline(p) {
  let at = 0;
  return p.scenes.map((s, i) => {
    let row = { ...s, index: i, start: at, end: at + s.duration };
    at = row.end;
    return row;
  });
}
function locate(p, t) {
  let rows = timeline(p);
  return rows.find((s) => t < s.end) || rows.at(-1);
}
async function init(data) {
  assets = {};
  await initStandardAssets(data);
  for (let [k, v] of Object.entries(data)) {
    if (typeof v === "string" && v.startsWith("data:image")) {
      let im = new Image();
      im.src = v;
      await new Promise((res, rej) => {
        if (im.complete && im.width) res();
        else {
          im.onload = res;
          im.onerror = rej;
        }
      });
      assets[k] = im;
    }
  }
}
function stage(s, settings = {mode:"standard"}) {
  let root = new THREE.Scene();
  root.background = new THREE.Color(
    s.environment === "void" ? "#030512" : "#273b5a"
  );
  root.add(new THREE.AmbientLight("#e2dcff", 1.8));
  let sun = new THREE.DirectionalLight("#fff0cf", 2.2);
  sun.position.set(4, 8, 6);
  root.add(sun);
  let envRoot = s.environment === "catalog" ? makeEnvironment(s, { mat, mesh }) : environment(s.environment);
  if (envRoot.userData.environment) {
    root.userData.world = envRoot.userData.environment;
    root.background = new THREE.Color(root.userData.world.sky);
  }
  root.add(envRoot);
  root.userData.envGroups = [envRoot];
  for (let seq of (s.setSequence || []).slice(1)) {
    let g = (seq.environment || s.environment) === "catalog" ? makeEnvironment({ ...s, ...seq }, { mat, mesh }) : environment(seq.environment || s.environment);
    g.visible = false;
    root.add(g);
    root.userData.envGroups.push(g);
  }
  let skyMat = mat("stars", s.environment === "void" ? "#080b20" : "#223d61");
  skyMat.side = THREE.BackSide;
  if (s.environment !== "catalog") root.add(new THREE.Mesh(new THREE.SphereGeometry(40, 16, 8), skyMat));
  if (assets[s.backdrop]) {
    root.userData.backdrop = assets[s.backdrop];
    let bt = new THREE.Texture(assets[s.backdrop]);
    bt.needsUpdate = true;
    bt.colorSpace = THREE.SRGBColorSpace;
    root.background = bt;
  }
  let rigs = s.actors.map((a) => {
    if(settings.mode === "fast" && backgroundExtraEligible(a,s)) {
      const r=createBackgroundCutout(a,a.cast?castDesign(a.cast,a.design):a.design||{});
      root.add(r.root);return r;
    }
    let r = rig(a.kind, a.cast ? castDesign(a.cast, a.design) : a.design);
    prepareActionProps(r, { mat, mesh, box, cyl, orb });
    root.add(r.root);
    if (a.sash) {
      let band = box(
        r.body,
        0.5,
        0.12,
        0.035,
        mat("cloth", a.sash),
        0,
        1.5,
        0.27
      );
      band.rotation.z = -0.15;
    }
    r.root.scale.setScalar((a.scale || 1) * (r.baseScale || 1));
    if (a.prop) {
      r.prop = prop(getStandardSocket(r,"rightHand"), a.prop, 0, -0.1, 0.12);
      if (a.prop === "rifle") r.prop.rotation.x = Math.PI / 2;
    }
    return r;
  });
  let props = (s.props || []).map(
    (p) => ["2d-props", "urban"].includes(p.library) ? (() => {
      const o = makeLibraryProp(p, { mat, mesh });
      root.add(o);
      return o;
    })() : p.geometry ? storyObject(root, p) : prop(root, p.kind, ...p.from || [0, 0, 0])
  );
  let camera = new THREE.PerspectiveCamera(40, 1280 / 576, 0.1, 100);
  return effectStage({ root, rigs, props, camera, s, renderSettings:settings });
}
function track(keys, p, fallback = {}) {
  if (!keys?.length) return fallback;
  let a = keys[0], b = a;
  for (let k of keys) {
    if (k.at <= p) a = k;
    else {
      b = k;
      break;
    }
    b = a;
  }
  let u = b === a ? 0 : clamp((p - a.at) / (b.at - a.at));
  if (b.cut) u = 0;
  else u = u * u * (3 - 2 * u);
  let out = { ...fallback, ...a };
  for (let k of ["position", "target", "camera"])
    if (a[k] && b[k]) out[k] = a[k].map((v, j) => lerp(v, b[k][j], u));
  for (let k of ["rotation", "fov", "open", "scale", "tilt", "roll"])
    if (a[k] !== void 0 && b[k] !== void 0) out[k] = lerp(a[k], b[k], u);
  return out;
}
function visibleAt(a, p) {
  return p >= (a.visibleFrom ?? 0) && p < (a.visibleUntil ?? 1.001);
}
function directorPose(r, action, t, q) {
  if (applyPreset(r, action, t, q, r.presetOptions || {})) return;
  if (r.quad) {
    r.legs.forEach(
      (l, i) => l.rotation.x = ["walk", "run"].includes(action) ? Math.sin(t * 7 + i * Math.PI / 2) * 0.45 : 0
    );
    r.head.rotation.x = action === "look-down" ? 0.3 : 0;
    return;
  }
  if (["walk", "run", "march", "swing", "dance"].includes(action)) {
    pose(r, action, t);
    return;
  }
  pose(r, "idle", 0);
  let u = clamp(q), rise = Math.sin(Math.PI * u);
  r.body.position.y = Math.sin(t * 1.1) * 0.012;
  if (action === "observe" || action === "think") {
    r.head.rotation.y = lerp(-0.12, 0.13, u);
    if (action === "think") {
      r.arms[1].rotation.x = -0.7;
      r.forearms[1].rotation.x = -1.5;
    }
  }
  if (["talk", "gesture"].includes(action)) {
    r.forearms[1].rotation.x = -0.45 - rise * 0.55;
    r.arms[1].rotation.z = -0.1 - rise * 0.18;
    r.head.rotation.y = 0.15 * (u - 0.5);
  }
  if (action === "aim") {
    r.arms.forEach((a) => a.rotation.x = -Math.PI / 2);
    r.forearms[0].rotation.z = 0.35;
  }
  if (["strike", "attack", "heavy", "special"].includes(action)) {
    r.arms[1].rotation.x = -0.3 - 1.5 * rise;
    r.body.rotation.y = 0.35 * rise;
    r.forearms[1].rotation.x = -0.3 * rise;
  }
  if (action === "stomp") {
    r.legs[1].rotation.x = -Math.sin(Math.PI * u) * 0.9;
    r.shins[1].rotation.x = Math.sin(Math.PI * u) * 0.8;
    r.body.position.y = 0.06 * rise;
  }
  if (action === "fall") {
    r.body.rotation.z = -Math.PI / 2 * u;
    r.body.position.y = 0.22 * u;
    r.arms.forEach((a) => a.rotation.z = 0.5 * u);
  }
  if (action === "down") {
    r.body.rotation.z = -Math.PI / 2;
    r.body.position.y = 0.22;
  }
  if (action === "brace") {
    r.arms.forEach((a) => a.rotation.x = -1.1);
    r.forearms.forEach((a) => a.rotation.x = -0.6);
    r.body.rotation.x = -0.12;
  }
  if (action === "hit") {
    r.body.rotation.z = -0.22 * rise;
    r.head.rotation.x = -0.2 * rise;
    r.arms.forEach((a) => a.rotation.x = -0.5 * rise);
  }
  if (action === "fly") {
    r.arms.forEach((a) => a.rotation.z = 0.6);
    r.legs.forEach((a) => a.rotation.x = 0.25);
    r.body.position.y = 0.05 * Math.sin(t * 2);
  }
  if (action === "sit") {
    r.legs.forEach((a) => a.rotation.x = -Math.PI / 2);
    r.shins.forEach((a) => a.rotation.x = Math.PI / 2);
    r.body.position.y = -0.42;
  }
  if (action === "reach") {
    r.arms[1].rotation.x = -0.4 - 0.8 * rise;
    r.forearms[1].rotation.x = -0.3;
  }
  if (action === "kneel") {
    r.body.position.y = -0.42;
    r.legs[1].rotation.x = -1.2;
    r.shins[1].rotation.x = 1.5;
    r.body.rotation.x = 0.12;
  }
  if (action === "draw") {
    r.body.position.y = -0.7;
    r.legs[1].rotation.x = -1.2;
    r.shins[1].rotation.x = 1.5;
    r.body.rotation.x = 0.8;
    r.arms[1].rotation.x = 0.4;
    r.forearms[1].rotation.x = -0.1;
    r.arms[1].rotation.z = -0.3 + 0.5 * u;
  }
  if (action === "crouch") {
    r.body.position.y = -0.3;
    r.legs.forEach((a) => a.rotation.x = -0.55);
    r.shins.forEach((a) => a.rotation.x = 1);
    r.body.rotation.x = 0.2;
  }
  if (action === "push" || action === "lift") {
    r.arms.forEach(
      (a) => a.rotation.x = -1.1 - (action === "lift" ? u * 0.7 : 0)
    );
    r.forearms.forEach((a) => a.rotation.x = -0.4);
    r.body.rotation.x = 0.25;
    r.legs[0].rotation.x = -0.3;
  }
  if (action === "point") {
    r.arms[1].rotation.x = -1.4;
    r.forearms[1].rotation.x = -0.1;
    r.head.rotation.y = -0.2;
  }
  if (action === "clap") {
    r.arms[0].rotation.z = 1.1 * rise;
    r.arms[1].rotation.z = -1.1 * rise;
    r.arms.forEach((a) => a.rotation.x = -1.1);
    r.forearms.forEach((a) => a.rotation.x = -0.6);
  }
  if (action === "salute") {
    r.arms[1].rotation.x = -1;
    r.forearms[1].rotation.x = -1.6;
    r.head.rotation.x = 0.12;
  }
  if (action === "nod") {
    r.head.rotation.x = 0.18 * rise;
  }
  if (action === "bow") {
    r.body.rotation.x = 0.35 * u;
    r.head.rotation.x = 0.2;
  }
  if (action === "look-down") {
    r.head.rotation.x = 0.35;
  }
  if (action === "look-up") {
    r.head.rotation.x = -0.3;
  }
  if (action === "hurt") {
    r.body.rotation.x = 0.3;
    r.head.rotation.x = 0.28;
    r.arms[1].rotation.x = -0.8;
    r.forearms[1].rotation.x = -1.4;
  }
  if (action === "recoil") {
    r.body.rotation.x = -0.25 * rise;
    r.arms.forEach((a) => a.rotation.x = -0.6 * rise);
  }
  if (action === "protect") {
    r.arms[0].rotation.z = 0.7;
    r.arms[1].rotation.z = -0.7;
    r.arms.forEach((a) => a.rotation.x = -0.7);
  }
  if (action === "offer") {
    r.arms[1].rotation.x = -1.2;
    r.forearms[1].rotation.x = -0.5;
  }
  if (action === "read") {
    r.arms.forEach((a) => a.rotation.x = -0.6);
    r.forearms.forEach((a) => a.rotation.x = -1);
    r.head.rotation.x = 0.3;
  }
  if (action === "work") {
    r.arms[1].rotation.x = -0.7;
    r.forearms[1].rotation.x = -0.5 - 0.3 * rise;
    r.head.rotation.x = 0.2;
  }
  if (action === "grieve") {
    r.head.rotation.x = 0.35;
    r.body.rotation.x = 0.12;
    r.arms[1].rotation.x = -0.8;
    r.forearms[1].rotation.x = -1.5;
  }
  if (action === "sleep") {
    r.body.rotation.z = -Math.PI / 2;
    r.body.position.y = 0.22;
  }
}
function update(st, t) {
  let s = st.s, p = clamp(t / s.duration);
  if (s.setSequence) {
    let ix = Math.max(
      0,
      s.setSequence.findLastIndex((k) => k.at <= p)
    );
    st.root.userData.envGroups.forEach((g, i) => g.visible = i === ix);
    let bg = assets[s.setSequence[ix].backdrop];
    if (st.root.userData.backdrop !== bg) {
      st.root.userData.backdrop = bg || null;
      if (bg) {
        let tx = new THREE.Texture(bg);
        tx.needsUpdate = true;
        tx.colorSpace = THREE.SRGBColorSpace;
        st.root.background = tx;
      } else st.root.background = new THREE.Color("#273b5a");
    }
  }
  let shot = (s.shots || []).filter((x) => p >= x.at).at(-1), next = shot ? s.shots.find((x) => x.at > shot.at)?.at ?? 1 : 1, sp = shot ? clamp((p - shot.at) / (next - shot.at)) : p;
  let cam = shot?.camera || s.camera || [6, 4.1, 10], end = shot?.to || cam, target = shot?.target || s.target || [0, 1.3, 0], lookEnd = shot?.targetTo || target;
  let ease = sp * sp * (3 - 2 * sp);
  st.camera.position.set(...cam.map((v, j) => lerp(v, end[j], ease)));
  st.camera.fov = shot?.fov || 40;
  st.camera.lookAt(...target.map((v, j) => lerp(v, lookEnd[j], ease)));
  st.camera.updateProjectionMatrix();
  st.camera.updateMatrixWorld();
  st.rigs.forEach((r, i) => {
    let a = s.actors[i];
    if (r.fastExtra) {
      r.root.visible=visibleAt(a,p)&&!(a.hiddenIntervals||[]).some(([lo,hi])=>p>=lo&&p<hi);
      r.root.position.set(...a.from||[i*2-2,0,0]);
      r.root.rotation.set(0,Math.atan2(st.camera.position.x-r.root.position.x,st.camera.position.z-r.root.position.z),0);
      r.root.scale.setScalar((a.scale||1)*r.baseScale);return;
    }
    let from = a.from || [i * 2 - 2, 0, 0], to = a.to || from, state = track(a.keys, p, {
      position: from.map((v, j) => lerp(v, to[j], p)),
      rotation: a.rotation ?? 0
    });
    r.root.visible = visibleAt(a, p) && !(a.hiddenIntervals || []).some(([lo, hi]) => p >= lo && p < hi);
    r.root.position.set(...state.position);
    r.root.rotation.set(0, state.rotation ?? 0, 0);
    r.root.scale.setScalar((a.scale || 1) * (r.baseScale || 1));
    let action = state.action || a.action || "observe", beats = a.beats || [], beat = beats.filter((b) => p >= b.at).at(-1), at = beat?.at ?? 0, until = beats.find((b) => b.at > at)?.at ?? 1;
    if (beat) {
      action = beat.action || action;
      if (beat.position) r.root.position.set(...beat.position);
      if (beat.rotation !== void 0) r.root.rotation.y = beat.rotation;
    }
    let localSeconds = (p - at) * s.duration;
    let actionDuration = beat?.duration ?? (until - at) * s.duration;
    let aq = clamp(localSeconds / Math.max(0.01, actionDuration));
    if (beat?.endAction && localSeconds > actionDuration)
      action = beat.endAction;
    r.presetOptions = a.presetOptions || {};
    if (!applyStandardAnimation(r,beat?.standardAnimation!==undefined?beat.standardAnimation:a.standardAnimation,beat?.standardAnimation!==undefined?localSeconds:t+(a.phase||0)) && !applyStandardPose(r,action,t+(a.phase||0),aq,r.presetOptions)) directorPose(r,action,t+(a.phase||0),aq);
    updateActionProps(r, action, aq, r.presetOptions);
    r.body.visible = action !== "paper";
    r.paper.visible = action === "paper";
    r.trapeze.visible = action === "swing";
    if (r.prop)
      r.prop.visible = p >= (a.armedAt ?? 0) && p < (a.disarmedAt ?? 1.001) && action !== "paper";
    let face = beat?.face || state.face || a.face;
    if (face)
      r.root.rotation.y = Math.atan2(
        face[0] - r.root.position.x,
        face[1] - r.root.position.z
      );
    if (state.scale !== void 0)
      r.root.scale.setScalar(state.scale * (r.baseScale || 1));
    if (a.lookAt) {
      let yaw = Math.atan2(
        a.lookAt[0] - r.root.position.x,
        a.lookAt[1] - r.root.position.z
      ) - r.root.rotation.y;
      r.head.rotation.y = clamp(yaw, -0.65, 0.65);
    }
  });
  st.root.updateMatrixWorld(true);
  st.rigs.forEach((r,i)=>{
    if(r.fastExtra)return;
    syncStandardRig(r);
    if(r.standard&&s.actors[i].lookAt)applyStandardLookAt(r,s.actors[i].lookAt);
    syncStandardAttachments(r,r.preset,r.presetOptions);
    if(r.standard)for(const k of s.actors[i].grips||[])if(p>=k.at&&p<k.until)solveStandardGrip(r,k.hand??1,k.targetKeys?track(k.targetKeys,p,{position:k.target}).position:k.target);
  });
  st.props.forEach((o, i) => {
    let a = s.props[i], f = a.from || [0, 0, 0], state = track(a.keys, p, { position: f, rotation: 0 }), owner = (a.owners || []).filter((x) => p >= x.at).at(-1)?.actor, rig2 = typeof owner === "string" ? st.rigs[s.actors.findIndex((x) => x.id === owner)] : null;
    o.visible = visibleAt(a, p);
    o.scale.setScalar(state.scale ?? a.scale ?? 1);
    let parent = rig2 ? getStandardSocket(rig2,a.socket==="head"?"head":a.socket==="body"?"body":(a.hand??1)===0?"leftHand":"rightHand") : st.root;
    if (o.parent !== parent) parent.add(o);
    o.position.set(...rig2 ? a.heldOffset || [0, -0.1, 0.12] : state.position);
    o.rotation.set(
      (state.tilt ?? (rig2 && a.kind === "rifle" ? Math.PI / 2 : 0)) + (a.rotation3d?.[0] || 0),
      (state.rotation || 0) + (a.rotation3d?.[1] || 0),
      (state.roll || 0) + (a.rotation3d?.[2] || 0)
    );
    if (rig2 && a.alignment === "actor-forward") {
      const local = o.rotation.clone();
      o.quaternion.copy(parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rig2.root.getWorldQuaternion(new THREE.Quaternion())));
      o.rotateX(local.x);
      o.rotateY(local.y);
      o.rotateZ(local.z);
    }
    if (a.spin) o.rotation.y = t * 5;
    if (o.userData.lid)
      o.userData.lid.rotation.x = -(state.open ?? a.open ?? 0) * 1.9;
  });
  st.root.updateMatrixWorld(true);
  effectUpdate(st, p);
  st.root.updateMatrixWorld(true);
  return st;
}
function wrap(ctx, text, width) {
  let ls = [], line = "";
  for (let w of text.split(/\s+/)) {
    let trial = line ? line + " " + w : w;
    if (ctx.measureText(trial).width > width && line) {
      ls.push(line);
      line = w;
    } else line = trial;
  }
  if (line) ls.push(line);
  return ls;
}
function captionAt(s, t) {
  if (s.captions?.length)
    return s.captions.find((x) => t >= x.start && t < x.end)?.text || "";
  let words = s.caption.split(/\s+/), chunk = 22, index = Math.min(
    Math.ceil(words.length / chunk) - 1,
    Math.floor(t / s.duration * Math.ceil(words.length / chunk))
  );
  return words.slice(index * chunk, (index + 1) * chunk).join(" ");
}
function overlay(ctx, w, h, s, t, options = {}) {
  let sh = Math.round(h * 0.8);
  ctx.fillStyle = "#080e1b";
  ctx.fillRect(0, sh, w, h - sh);
  ctx.fillStyle = "#c69eff";
  ctx.font = `bold ${Math.round(w * 0.012)}px sans-serif`;
  ctx.fillText(s.label || s.title || "DREAM ANIME", w * 0.035, sh + h * 0.035);
  ctx.fillStyle = "#f0f1fa";
  ctx.font = `${Math.round(w * 0.021)}px sans-serif`;
  let lines = wrap(ctx, captionAt(s, t), w * 0.92);
  lines.slice(0, 3).forEach(
    (l, i) => ctx.fillText(l, w * 0.04, sh + h * 0.084 + i * h * 0.043)
  );
  if (s.card) {
    ctx.fillStyle = "#060a17bb";
    ctx.fillRect(w * 0.1, h * 0.17, w * 0.8, h * 0.35);
    ctx.fillStyle = "#e5d5ff";
    ctx.textAlign = "center";
    ctx.font = `bold ${Math.round(w * 0.045)}px sans-serif`;
    wrap(ctx, s.title || "", w * 0.7).slice(0, 3).forEach((l, i) => ctx.fillText(l, w * 0.5, h * 0.29 + i * h * 0.075));
    ctx.textAlign = "left";
  }
  let fade = options.transitions === false ? 1 : Math.min(clamp(t / 0.5), clamp((s.duration - t) / 0.5));
  if (fade < 1) {
    ctx.fillStyle = `rgba(3,6,15,${1 - fade})`;
    ctx.fillRect(0, 0, w, sh);
  }
}
const cpuMaterialImages = new WeakMap();
function cpuMaterialImage(material, image) {
  if (!image || !material.color || material.color.equals(new THREE.Color(1, 1, 1))) return image;
  const key = material.color.getHexString(), old = cpuMaterialImages.get(material);
  if (old?.image === image && old.key === key) return old.canvas;
  const canvas = cv(image.width, image.height), ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "#" + key;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(image, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  cpuMaterialImages.set(material, { image, key, canvas });
  return canvas;
}
class SoftwareRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.draws = 0;
  }
  render(st, t, options={}) {
    let c = this.canvas, x = this.ctx, w = c.width, h = options.captions===false?c.height:Math.round(c.height * 0.8);
    let bg = x.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, st.root.userData.world?.sky || (st.s.environment === "void" ? "#02030b" : "#223452"));
    bg.addColorStop(1, st.root.userData.world?.sky || "#66527b");
    x.fillStyle = bg;
    x.fillRect(0, 0, w, h);
    if (st.root.userData.backdrop) {
      let im = st.root.userData.backdrop, k = Math.max(w / im.width, h / im.height), dw = im.width * k, dh = im.height * k;
      x.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }
    for (let i = 0; i < (st.root.userData.backdrop || st.root.userData.world ? 0 : 40); i++) {
      x.fillStyle = "#c9c9ef55";
      x.fillRect(i * 193 % w, i * 71 % (h * 0.5), 1, 1);
    }
    st.camera.aspect = w / h;
    st.camera.updateProjectionMatrix();
    st.root.updateMatrixWorld(true);
    st.camera.updateMatrixWorld();
    let polys = [], vp = new THREE.Matrix4().multiplyMatrices(st.camera.projectionMatrix, st.camera.matrixWorldInverse), cam = st.camera.position, light = new THREE.Vector3(0.3, 0.8, 0.5).normalize();
    st.root.traverseVisible((m) => {
      if (!m.isMesh || !m.visible || m.material?.side === THREE.BackSide) return;
      let g = m.geometry, ix = g.index, pos = g.attributes.position, uv = g.attributes.uv, points = [];
      for (let i = 0; i < pos.count; i++) {
        let world = m.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(m.matrixWorld), q = world.clone().applyMatrix4(vp);
        points.push({ x: (q.x + 1) * w / 2, y: (1 - q.y) * h / 2, z: q.z, world, u: uv ? uv.getX(i) : 0, v: uv ? 1 - uv.getY(i) : 0 });
      }
      let count = ix ? ix.count : pos.count;
      for (let i = 0; i < count; i += 3) {
        let p = [0, 1, 2].map((k) => points[ix ? ix.getX(i + k) : i + k]);
        let n = p[1].world.clone().sub(p[0].world).cross(p[2].world.clone().sub(p[0].world)).multiplyScalar(m.matrixWorld.determinant() < 0 ? -1 : 1);
        if (n.dot(cam.clone().sub(p[0].world)) <= 0) continue;
        let group = g.groups.find((gr) => i >= gr.start && i < gr.start + gr.count), material = Array.isArray(m.material) ? m.material[group?.materialIndex || 0] : m.material, shade = Math.min(1,Math.max(0,0.72*(options.light?.ambient??1.8)/1.8+0.28*(options.light?.sun??2.2)/2.2*Math.max(0,n.normalize().dot(light))));
        if (material.map?.flipY === false) p = p.map((v) => ({ ...v, v: 1 - v.v }));
        let vertexColor = null;
        if (material.vertexColors && g.attributes.color) {
          vertexColor = new THREE.Color(0, 0, 0);
          for (let k = 0; k < 3; k++) {
            const vi = ix ? ix.getX(i + k) : i + k;
            vertexColor.r += g.attributes.color.getX(vi) / 3;
            vertexColor.g += g.attributes.color.getY(vi) / 3;
            vertexColor.b += g.attributes.color.getZ(vi) / 3;
          }
        }
        let tan = Math.tan(st.camera.fov * Math.PI / 360), aspect = w / h;
        const planes = [(v) => -v.z - st.camera.near, (v) => st.camera.far + v.z, (v) => v.x - v.z * tan * aspect, (v) => -v.z * tan * aspect - v.x, (v) => v.y - v.z * tan, (v) => -v.z * tan - v.y];
        for (let plane of planes) {
          let out = [];
          for (let j = 0; j < p.length; j++) {
            let a = p[j], b = p[(j + 1) % p.length], da = plane(a.world.clone().applyMatrix4(st.camera.matrixWorldInverse)), db = plane(b.world.clone().applyMatrix4(st.camera.matrixWorldInverse)), ia = da >= 0, ib = db >= 0;
            if (ia) out.push(a);
            if (ia !== ib) {
              let u = da / (da - db), world = a.world.clone().lerp(b.world, u), q = world.clone().applyMatrix4(vp);
              out.push({ world, x: (q.x + 1) * w / 2, y: (1 - q.y) * h / 2, z: q.z, u: lerp(a.u, b.u, u), v: lerp(a.v, b.v, u) });
            }
          }
          p = out;
          if (p.length < 3) break;
        }
        for (let j = 1; j < p.length - 1; j++) {
          let tri = [p[0], p[j], p[j + 1]];
          polys.push({ p: tri, mat: material, ground: !!m.userData.ground, vertexColor, z: tri.reduce((v, p2) => v + p2.z, 0) / 3, shade });
        }
      }
    });
    polys.sort((a, b) => a.ground !== b.ground ? a.ground ? -1 : 1 : b.z - a.z);
    x.save();
    x.beginPath();
    x.rect(0, 0, w, h);
    x.clip();
    for (let o of polys) {
      if (o.p.every((v) => v.x < 0) || o.p.every((v) => v.x > w) || o.p.every((v) => v.y < 0) || o.p.every((v) => v.y > h)) continue;
      let [a, b, c2] = o.p, im = cpuMaterialImage(o.mat, o.mat.map?.userData.cpuImage || o.mat.map?.userData.canvas || o.mat.map?.image);
      if (!im) {
        const color = o.mat.color || new THREE.Color("#ffffff"), v = color.clone().multiply(o.vertexColor || new THREE.Color(1, 1, 1)).multiplyScalar(o.shade);
        x.globalAlpha = clamp(o.mat.opacity ?? 1);
        x.fillStyle = "#" + v.getHexString();
        const mx2 = (a.x + b.x + c2.x) / 3, my2 = (a.y + b.y + c2.y) / 3, expanded = [a, b, c2].map((p) => {
          const dx = p.x - mx2, dy = p.y - my2, len = Math.hypot(dx, dy) || 1;
          return { x: p.x + dx / len * 0.5, y: p.y + dy / len * 0.5 };
        });
        x.beginPath();
        x.moveTo(expanded[0].x, expanded[0].y);
        x.lineTo(expanded[1].x, expanded[1].y);
        x.lineTo(expanded[2].x, expanded[2].y);
        x.closePath();
        x.fill();
        x.globalAlpha = 1;
        continue;
      }
      let u0 = a.u * im.width, v0 = a.v * im.height, u1 = b.u * im.width, v1 = b.v * im.height, u2 = c2.u * im.width, v2 = c2.v * im.height, den = u0 * (v1 - v2) + u1 * (v2 - v0) + u2 * (v0 - v1);
      if (Math.abs(den) < 1e-8) continue;
      let A = (a.x * (v1 - v2) + b.x * (v2 - v0) + c2.x * (v0 - v1)) / den, B = (a.y * (v1 - v2) + b.y * (v2 - v0) + c2.y * (v0 - v1)) / den, C = (a.x * (u2 - u1) + b.x * (u0 - u2) + c2.x * (u1 - u0)) / den, D = (a.y * (u2 - u1) + b.y * (u0 - u2) + c2.y * (u1 - u0)) / den, E = (a.x * (u1 * v2 - u2 * v1) + b.x * (u2 * v0 - u0 * v2) + c2.x * (u0 * v1 - u1 * v0)) / den, F = (a.y * (u1 * v2 - u2 * v1) + b.y * (u2 * v0 - u0 * v2) + c2.y * (u0 * v1 - u1 * v0)) / den;
      if (![A, B, C, D, E, F].every(Number.isFinite) || Math.abs(A * D - B * C) < 1e-6) continue;
      x.save();
      x.globalAlpha = clamp(o.mat.opacity ?? 1);
      let mx = (a.x + b.x + c2.x) / 3, my = (a.y + b.y + c2.y) / 3;
      let q = [a, b, c2].map((v) => {
        let dx = v.x - mx, dy = v.y - my, l = Math.hypot(dx, dy) || 1;
        return { x: v.x + dx / l * 0.6, y: v.y + dy / l * 0.6 };
      });
      x.beginPath();
      x.moveTo(q[0].x, q[0].y);
      x.lineTo(q[1].x, q[1].y);
      x.lineTo(q[2].x, q[2].y);
      x.closePath();
      x.clip();
      let sx = Math.max(0, Math.min(u0, u1, u2)), sy = Math.max(0, Math.min(v0, v1, v2)), sw = Math.min(im.width, Math.max(u0, u1, u2)) - sx, sh = Math.min(im.height, Math.max(v0, v1, v2)) - sy;
      x.transform(A, B, C, D, E, F);
      if (sw > 1e-3 && sh > 1e-3 && (Math.abs(A) * sw + Math.abs(C) * sh) * (Math.abs(B) * sw + Math.abs(D) * sh) < 8e6) x.drawImage(im, sx, sy, sw, sh, sx, sy, sw, sh);
      x.restore();
      if (o.shade < 0.96) {
        x.fillStyle = `rgba(0,0,0,${(1 - o.shade) * (o.mat.opacity ?? 1)})`;
        x.beginPath();
        x.moveTo(a.x, a.y);
        x.lineTo(b.x, b.y);
        x.lineTo(c2.x, c2.y);
        x.closePath();
        x.fill();
      }
    }
    x.restore();
    if (st.s.blackout !== void 0 && t / st.s.duration >= st.s.blackout) {
      x.fillStyle = "#03040a";
      x.fillRect(0, 0, w, h);
    }
    if(options.captions!==false)overlay(x,w,this.canvas.height,st.s,t,options);
    this.draws++;
    return this.canvas;
  }
}
class PreviewRenderer {
  constructor(c) {
    this.canvas = c;
    this.ctx = c.getContext("2d");
    try {
      this.web = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      this.web.setSize(c.width, Math.round(c.height * 0.8));
      this.web.outputColorSpace = THREE.SRGBColorSpace;
      this.mode = "WebGL";
    } catch (e) {
      this.cpu = new SoftwareRenderer(c);
      this.mode = "CPU fallback";
    }
  }
  render(st, t) {
    if (this.cpu) return this.cpu.render(st, t);
    let w = this.canvas.width, h = Math.round(this.canvas.height * 0.8);
    st.camera.aspect = w / h;
    st.camera.updateProjectionMatrix();
    if (this.web.domElement.width !== w || this.web.domElement.height !== h) this.web.setSize(w, h);
    this.web.render(st.root, st.camera);
    this.ctx.drawImage(this.web.domElement, 0, 0);
    overlay(this.ctx, w, this.canvas.height, st.s, t);
    return this.canvas;
  }
}
async function prepare(st) {
  let tasks = [], seen = /* @__PURE__ */ new Set();
  st.root.traverse((o) => {
    for (let m of o.isMesh ? Array.isArray(o.material) ? o.material : [o.material] : []) {
      let tex = m.map, im = tex?.userData.canvas || tex?.image;
      if (im?.toBuffer && !seen.has(tex)) {
        seen.add(tex);
        let frozen = new Image();
        tasks.push(new Promise((res, rej) => {
          frozen.onload = () => {
            tex.userData.cpuImage = frozen;
            res();
          };
          frozen.onerror = rej;
          frozen.src = im.toBuffer("image/png");
        }));
      }
    }
  });
  await Promise.all(tasks);
  return st;
}
function ell(g, rx, ry, rz, m, x, y, z) {
  let o = orb(g, 1, m, x, y, z);
  o.scale.set(rx, ry, rz);
  return o;
}
function taper(g, r1, r2, h, m, x, y, z) {
  return mesh(g, new THREE.CylinderGeometry(r1, r2, h, 7), m, x, y, z);
}
function effectStage(st) {
  st.fx = (st.s.effects || []).map((e) => {
    const reusable = makeVisualEffect(e, { mat, mesh });
    if (reusable) {
      st.root.add(reusable);
      return reusable;
    }
    let g = new THREE.Group(), m = mat("stars", e.color || "#ffe3a0");
    if (["block", "portal", "sonic", "luck", "shield"].includes(e.kind)) {
      let ring = mesh(
        g,
        new THREE.TorusGeometry(0.48, 0.045, 4, 14),
        m,
        0,
        0,
        0
      );
      if (e.kind === "shield")
        mesh(g, new THREE.TorusGeometry(0.34, 0.025, 4, 12), m, 0, 0, 0.02);
    } else if (["beam", "trail", "lightning"].includes(e.kind)) {
      cyl(g, 0.065, 1, m, 0, 0, 0, 5);
    } else if (e.kind === "flower") {
      for (let i = 0; i < 6; i++) {
        ell(
          g,
          0.12,
          0.25,
          0.06,
          m,
          Math.sin(i * Math.PI / 3) * 0.2,
          Math.cos(i * Math.PI / 3) * 0.2,
          0
        );
      }
      orb(g, 0.1, mat("stars", "#fff7cc"), 0, 0, 0.03);
    } else {
      for (let i = 0; i < 6; i++) {
        let ray = mesh(g, new THREE.ConeGeometry(0.045, 0.55, 4), m, 0, 0, 0);
        ray.rotation.z = i * Math.PI / 3;
        ray.position.set(
          Math.sin(-i * Math.PI / 3) * 0.28,
          Math.cos(i * Math.PI / 3) * 0.28,
          0
        );
      }
    }
    st.root.add(g);
    return g;
  });
  return st;
}
function effectUpdate(st, p) {
  for (let i = 0; i < (st.fx || []).length; i++) {
    let e = st.s.effects[i], o = st.fx[i], u = clamp((p - e.at) / ((e.until ?? e.at + 0.03) - e.at));
    if (o.userData.visualEffect) {
      updateVisualEffect(o, e, p * st.s.duration, st);
      continue;
    }
    o.visible = p >= e.at && p < (e.until ?? e.at + 0.03);
    let pos = e.position || [0, 1.5, 0];
    if (e.actor) {
      let r = st.rigs[st.s.actors.findIndex((a) => a.id === e.actor)];
      if (r) {
        let q = (e.socket === "hand" ? r.hands[1] : r.head).getWorldPosition(
          new THREE.Vector3()
        );
        pos = [q.x, q.y, q.z + 0.15];
      }
    }
    o.position.set(...pos);
    o.rotation.set(0, 0, 0);
    let sz = (e.scale || 1) * (0.7 + Math.sin(u * Math.PI) * 0.5);
    o.scale.setScalar(sz);
    if (["beam", "trail", "lightning"].includes(e.kind)) {
      let end = e.to || [pos[0] + 2, pos[1], pos[2]];
      if (e.targetActor) {
        let rr = st.rigs[st.s.actors.findIndex((a) => a.id === e.targetActor)];
        if (rr) {
          let pp = rr.head.getWorldPosition(new THREE.Vector3());
          end = [pp.x, pp.y - 0.3, pp.z];
        }
      }
      let v = new THREE.Vector3(...end).sub(o.position), len = v.length();
      o.position.addScaledVector(v, 0.5);
      o.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        v.normalize()
      );
      o.scale.set(1, len, 1);
    } else {
      o.lookAt(st.camera.position);
      o.rotateZ(u * 0.4);
    }
  }
}
function disposeStage(st) {
  if (!st?.root) return;
  const geometries = /* @__PURE__ */ new Set(), materials = /* @__PURE__ */ new Set(), skeletons = /* @__PURE__ */ new Set();
  st.root.traverse((o) => {
    if (o.geometry) geometries.add(o.geometry);
    for (const m of o.material ? Array.isArray(o.material) ? o.material : [o.material] : []) materials.add(m);
    if (o.skeleton) skeletons.add(o.skeleton);
  });
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
  for (const k of skeletons) k.dispose();
  for (const r of st.rigs || []) if (r.standard) {
    r.standard.mixer.stopAllAction();
    r.standard.mixer.uncacheRoot(r.standard.scene);
  }
  st.root.clear();
}

function syncStandardAttachments(r, action, options = {}) {
  if (!r.standard) return;
  for (const [kind, g] of Object.entries(r.actionProps || {})) {
    const hand = options.mirror ? "leftHand" : "rightHand", parent = getStandardSocket(r, kind === "aura" ? "body" : hand);
    if (g.parent !== parent) parent.add(g);
  }
  r.root.updateMatrixWorld(true);
  solveStandardActionGrips(r, action, options);
}

function poseAPI(r, action, t = 0, q, options = {}) {
  r.presetOptions = options;
  const phase = q ?? (t % 3 + 3) % 3 / 3;
  if (!applyStandardPose(r, action, t, phase, options)) directorPose(r, action, t, phase);
  r.body.visible = !r.recording && action !== "paper";
  updateActionProps(r, action, phase, options);
  syncStandardRig(r);
  syncStandardAttachments(r, action, options);
  return r;
}

window.CartoonStudio = {
  defaultRenderMode,createProject,renderSettings,backgroundExtraEligible,renderBudget,standardCastThumbnails,standardCastCatalog,standardAppearanceOptions,standardCastDesign,createStandardCastActor,selectStandardCast,searchStandardCast,validateStandardAppearance,applyStandardAppearance,serializeStandardCast,parseStandardCast,loadStandardAsset,standardAssetCatalog,createStandardRig:(id,design)=>createStandardRig(id,design,{mat,mesh,box,cyl,orb}),validateStandardActor,syncStandardRig,applyStandardPose,applyStandardAnimation,getStandardSocket,mapStandardBones,standardRigSnapshot,retargetStandardClip,solveStandardGrip,applyStandardLookAt,solveStandardActionGrips,disposeStage,
  castThumbnails,
  castCatalog,
  castDesign,
  createCastActor,
  searchCast,
  diverseCast,
  bodyProfiles,
  hairStyles,
  outfitStyles,
  accessoryStyles,
  environmentCatalog,
  validateEnvironment,
  makeEnvironment: (s) => makeEnvironment(s, { mat, mesh }),
  propCatalog,
  validateLibraryProp,
  makeLibraryProp: (p) => makeLibraryProp(p, { mat, mesh }),
  visualEffectCatalog,
  validateVisualEffect,
  presetCatalog,
  exportPreset,
  samplePreset,
  getAssetState: () => ({images:assets,standard:getStandardAssetState()}),
  restoreAssetState: (s) => {
    assets = s.images; restoreStandardAssetState(s.standard);
  },
  prepare,
  PreviewRenderer,
  THREE,
  init,
  stage,
  update,
  validate,
  timeline,
  locate,
  SoftwareRenderer,
  pose:poseAPI,
  rig,
  texture,
  overlay,
  captionAt,
  TYPES,
  track,
  visibleAt
};
function storyObject(root, p) {
  let g = new THREE.Group();
  root.add(g);
  g.position.set(...p.from || [0, 0, 0]);
  for (let q of p.geometry) {
    let m = mat(q.texture || "metal", q.color || "#8d9dba"), v = q.size || [1, 1, 1], o;
    if (q.shape === "sphere") o = ell(g, ...v, m, ...q.position || [0, 0, 0]);
    else if (q.shape === "ring")
      o = mesh(
        g,
        new THREE.TorusGeometry(v[0], v[1], 5, 24),
        m,
        ...q.position || [0, 0, 0]
      );
    else if (q.shape === "cone")
      o = mesh(
        g,
        new THREE.ConeGeometry(v[0], v[1], 8),
        m,
        ...q.position || [0, 0, 0]
      );
    else o = box(g, ...v, m, ...q.position || [0, 0, 0]);
    if (q.rotation) o.rotation.set(...q.rotation);
  }
  return g;
}
function woodlandRig(kind) {
  let root = new THREE.Group(), body = new THREE.Group();
  root.add(body);
  let m = mat(
    "fur",
    kind === "badger" ? "#6e7476" : kind === "rabbit" ? "#b6a99b" : kind === "squirrel" ? "#a7774e" : "#b2976e"
  ), dark = mat("fur", "#34383e"), light = mat("fur", "#e3d9be"), legs = [], head = new THREE.Group(), big = kind === "deer", h = big ? 0.85 : 0.28;
  ell(body, big ? 0.3 : 0.25, big ? 0.4 : 0.22, big ? 0.65 : 0.38, m, 0, h, 0);
  head.position.set(0, h + (big ? 0.55 : 0.18), big ? 0.47 : 0.28);
  body.add(head);
  ell(head, big ? 0.2 : 0.18, big ? 0.27 : 0.18, big ? 0.3 : 0.2, m, 0, 0, 0);
  for (let side of [-1, 1]) {
    ell(head, 0.035, 0.04, 0.02, dark, side * 0.1, 0.04, 0.18);
    let ear = ell(
      head,
      0.055,
      kind === "rabbit" ? 0.25 : 0.12,
      0.045,
      m,
      side * 0.12,
      kind === "rabbit" ? 0.3 : 0.2,
      -0.02
    );
    ear.rotation.z = side * 0.2;
  }
  for (let x of [-0.16, 0.16])
    for (let z of [-0.25, 0.25]) {
      let g = new THREE.Group();
      body.add(g);
      g.position.set(x, h - 0.1, z);
      cyl(
        g,
        big ? 0.055 : 0.06,
        big ? 0.7 : 0.2,
        m,
        0,
        big ? -0.35 : -0.1,
        0,
        5
      );
      legs.push(g);
    }
  if (kind === "badger")
    for (let side of [-1, 1])
      box(head, 0.055, 0.3, 0.025, light, side * 0.07, 0, 0.19);
  if (kind === "squirrel") ell(body, 0.15, 0.45, 0.16, m, 0, 0.5, -0.4);
  let hands = [new THREE.Group(), new THREE.Group()];
  body.add(...hands);
  return {
    root,
    body,
    head,
    legs,
    arms: [],
    forearms: [],
    shins: [],
    hands,
    paper: new THREE.Group(),
    trapeze: new THREE.Group(),
    kind,
    quad: true
  };
}
