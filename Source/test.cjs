// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
const fs = require("fs"),
  path = require("path"),
  vm = require("vm"),
  assert = require("assert"),
  crypto = require("crypto"),
  native = require("@napi-rs/canvas"),
  PDFLib = require("pdf-lib");
(async () => {
  const root = path.join(__dirname, ".."),
    pkg = JSON.parse(
      fs.readFileSync(path.join(root, "Starter.jetcartoon.json")),
    ),
    ctx = {
      AbortController,
      console,
      TextEncoder,
      TextDecoder,
      Uint8Array,
      ArrayBuffer,
      setTimeout,
      Image: native.Image,
      document: { createElement: () => native.createCanvas(1, 1) },
      PDFLib,
    };
  ctx.window = ctx;
  ctx.self = ctx;
  vm.createContext(ctx);
  for (const p of ["../engine.bundle.js", "print.js"])
    vm.runInContext(fs.readFileSync(path.join(__dirname, p), "utf8"), ctx);
  const P = ctx.StudioPrint,
    hash = (c) =>
      crypto.createHash("sha256").update(c.toBuffer("image/png")).digest("hex");
  let before = JSON.stringify(pkg),
    zero = await P.still(pkg, { time: 0, width: 800, height: 450 }),
    repeat = await P.still(pkg, { time: 0, width: 800, height: 450 });
  assert.equal(hash(zero), hash(repeat), "deterministic render");
  assert.equal(JSON.stringify(pkg), before, "source stays unchanged");
  let dark = await P.still(pkg, {
    time: 0,
    width: 800,
    height: 450,
    light: { ambient: 0.3, sun: 0.2 },
  });
  assert.notEqual(hash(zero), hash(dark), "lighting alters actual output");
  let alt = await P.still(pkg, {
    time: 0,
    width: 800,
    height: 450,
    camera: [-4, 2, 7],
  });
  assert.notEqual(hash(zero), hash(alt), "camera alters output");
  let cap = await P.still(pkg, {
    time: 0,
    width: 800,
    height: 450,
    captions: true,
  });
  assert.notEqual(hash(zero), hash(cap), "caption option");
  let colors = zero.getContext("2d").getImageData(0, 0, 800, 450).data;
  assert(
    colors.some((x, i) => i % 4 !== 3 && x > 100),
    "no black transition frame at zero",
  );
  await assert.rejects(P.still(pkg, { sceneIndex: 999 }), /outside/);
  await assert.rejects(P.still(pkg, { time: -1 }), /time/);
  await assert.rejects(P.still(pkg, { width: 99999 }), /dimensions/);
  let comic = P.createComic(pkg);
  comic.title = "Stills & Comics • Feature Demonstration";
  comic.pages = [
    {
      layout: "cover",
      title: "3D CARTOON STUDIO DEMO",
      panels: [
        {
          sceneIndex: 0,
          time: 2,
          sceneOverride: { camera: [4, 2.8, 10], shots: [] },
        },
      ],
      text: "Fresh frames. Editable scenes.\nA reusable visual workflow.",
    },
    {
      layout: "whos-who",
      title: "WHO’S WHO • Reusable character views",
      panels: [
        {
          sceneIndex: 0,
          time: 2,
          sceneOverride: {
            actors: [pkg.project.scenes[0].actors[0]],
            camera: [0, 2.4, 7],
            target: [-1.3, 1.3, 0],
          },
          caption: "Guide • Reusable rig",
        },
        {
          sceneIndex: 0,
          time: 2,
          sceneOverride: {
            actors: [pkg.project.scenes[0].actors[1]],
            camera: [1, 2.4, 7],
            target: [1.2, 1.3, 0],
          },
          caption: "Visitor • Reusable rig",
        },
        {
          sceneIndex: 1,
          time: 2,
          caption: "A procedural library environment.",
        },
        { sceneIndex: 0, time: 2, caption: "A procedural room environment." },
      ],
    },
    {
      layout: "six",
      title: "SIX PANELS • Camera and pose studies",
      panels: Array.from({ length: 6 }, (_, i) => ({
        sceneIndex: i % 2,
        time: i + 1,
        sceneOverride: {
          camera: [
            [4, 3, 9],
            [-4, 3, 9],
            [0, 2, 6],
            [3, 2, -7],
            [6, 5, 8],
            [0, 5, 10],
          ][i],
          shots: [],
        },
        caption: [
          "Establish the place.",
          "Reverse the angle.",
          "Move in closer.",
          "Show a rear view.",
          "Keep spatial context.",
          "Choose a new moment.",
        ][i],
        balloons:
          i === 2
            ? [
                {
                  kind: "speech",
                  text: "A fresh view!",
                  x: 0.06,
                  y: 0.67,
                  w: 0.78,
                  h: 0.18,
                  fontSize: 18,
                  tail: [0.7, 0.45],
                },
              ]
            : [],
      })),
    },
    {
      layout: "credits",
      title: "CREDITS",
      panels: [{ sceneIndex: 1, time: 3, sceneOverride: { actors: [] } }],
      text: "3D Cartoon Studio\nOpen-source demonstration\n\nThis is a tool demonstration,\nnot an additional story chapter.",
    },
  ];
  P.validateComic(comic);
  let out = path.join(root, "Demo");
  fs.mkdirSync(out, { recursive: true });
  for (let i = 0; i < comic.pages.length; i++) {
    let c = await P.page(comic, i, { width: 850, height: 1100 });
    fs.writeFileSync(
      path.join(out, "page-" + (i + 1) + ".png"),
      c.toBuffer("image/png"),
    );
  }
  let bytes = await P.pdf(comic, { width: 850, height: 1100 }),
    pdf = await PDFLib.PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 4);
  fs.writeFileSync(path.join(out, "Studio-Demo.pdf"), bytes);
  fs.writeFileSync(
    path.join(out, "Studio-Demo.jetcomic.json"),
    JSON.stringify(comic),
  );
  for (const layout of Object.keys(P.layouts)) {
    let test = {
      ...comic,
      pages: [{ layout, panels: [{ sceneIndex: 0, time: 2 }] }],
    };
    assert((await P.page(test, 0, { width: 425, height: 550 })).width === 425);
  }
  let bad = JSON.parse(JSON.stringify(comic));
  bad.pages[0].panels[0].caption = "Too much text ".repeat(1000);
  await assert.rejects(P.page(bad, 0), /caption is too long/);
  let result = {
    pass: true,
    tests: [
      "determinism",
      "source immutability",
      "zero-time no fade",
      "camera override",
      "lighting actual pixels",
      "caption option",
      "invalid scene/time/size",
      "all 8 layouts",
      "overflow rejection",
      "4-page PDF parsed",
    ],
    pdfPages: 4,
  };
  fs.writeFileSync(
    path.join(root, "test-results.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
