// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  assert = require("node:assert/strict"),
  native = require("@napi-rs/canvas"),
  { JSDOM } = require("jsdom");
(async () => {
  const root = path.resolve(__dirname, ".."),
    pkg = JSON.parse(fs.readFileSync(path.join(root, "Demo.jetcartoon.json")));
  const ctx = {
    AbortController,
    console,
    TextEncoder,
    TextDecoder,
    Uint8Array,
    ArrayBuffer,
    setTimeout,
    Image: native.Image,
    document: { createElement: () => native.createCanvas(1, 1) },
  };
  ctx.window = ctx;
  ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(
    fs.readFileSync(path.join(root, "engine.bundle.js"), "utf8"),
    ctx,
  );
  const S = ctx.CartoonStudio;
  await S.init(pkg.assets);
  const kinds = [
    "person",
    "worker",
    "scholar",
    "knight",
    "robot",
    "traveler",
    "deer",
    "rabbit",
    "badger",
    "squirrel",
  ];
  assert.deepEqual(Object.keys(S.TYPES), kinds.slice(0, 6));
  const environments = [
    "void",
    "jungle",
    "royal",
    "gym",
    "room",
    "library",
    "diner",
    "street",
  ];
  let count = 0;
  for (const kind of kinds)
    for (const environment of environments) {
      let p = JSON.parse(JSON.stringify(pkg.project));
      p.scenes = [
        {
          ...p.scenes[0],
          environment,
          actors: [
            {
              id: "actor",
              kind,
              action: "walk",
              from: [0, 0, 0],
              to: [1, 0, 0],
            },
          ],
        },
      ];
      S.validate(p);
      let st = S.stage(p.scenes[0]);
      await S.prepare(st);
      let c = native.createCanvas(160, 90);
      new S.SoftwareRenderer(c).render(S.update(st, 1), 1);
      assert.ok(c.toBuffer("image/png").length > 500);
      st.root.traverse((x) => {
        if (x.geometry) x.geometry.dispose();
      });
      count++;
    }
  let invalid = JSON.parse(JSON.stringify(pkg.project));
  invalid.scenes[0].actors[0].kind = "unsupported-personal-template";
  assert.throws(() => S.validate(invalid), /Unknown character/);
  const doc = new JSDOM(
    fs.readFileSync(path.join(root, "Source/shell.html"), "utf8"),
  ).window.document;
  for (const file of ["ui.js", "print-ui.js"])
    for (const m of fs
      .readFileSync(path.join(root, "Source", file), "utf8")
      .matchAll(/\$\("([\w-]+)"\)/g))
      assert.ok(doc.getElementById(m[1]), "Missing control " + m[1]);
  for (const name of [
    "Tranquility",
    "Suspense",
    "Determination",
    "Playfulness",
    "Anger", "Fear", "Nostalgia", "Excitement", "Sorrow", "Joy",
  ])
    assert.ok(pkg.assets["music/" + name].startsWith("data:audio/"));
  assert.equal(
    Object.keys(pkg.assets).filter(k => k.startsWith("music/")).length,
    10,
    "Only authorized music embedded",
  );
  const tutorial = JSON.parse(
    fs.readFileSync(path.join(root, "First-Cartoon.jetcartoon.json")),
  );
  S.validate(tutorial.project);
  assert.equal(tutorial.project.scenes.length, 2);
  assert.equal(Object.keys(tutorial.assets).filter(k => k.startsWith("music/")).length, 10);
  assert.deepEqual(Object.keys(pkg.assets).filter(k => k.startsWith("standard/")).sort(), Object.keys(require("./standard-assets.json")).sort());
  assert.equal(Object.keys(pkg.assets).length, 15, "Only ten authorized songs and five CC0 GLBs embedded");
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "print.js"), "utf8"),
    ctx,
  );
  const options = JSON.parse(
    fs.readFileSync(path.join(root, "examples/still-options.json")),
  );
  const still = await ctx.StudioPrint.still(tutorial, options);
  assert.equal(still.width, 1280);
  assert.equal(still.height, 720);
  assert.ok(still.toBuffer("image/png").length > 1000);
  console.log(
    JSON.stringify({
      genericCharacterEnvironmentRenders: count,
      controlsPresent: true,
      musicTracks: 10,
      unknownRigRejected: true,
      tutorialAndStillOptions: true,
    }),
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
