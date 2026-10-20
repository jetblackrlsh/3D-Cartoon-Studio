// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
const fs = require("node:fs");
const path = require("node:path");
const esbuild = require("esbuild");
const root = path.resolve(__dirname, "..");
for (const entry of ["engine", "voice"]) {
  esbuild.buildSync({
    absWorkingDir: __dirname,
    entryPoints: [entry + ".js"],
    bundle: true,
    format: "iife",
    platform: "browser",
    outfile: path.join(root, entry + ".bundle.js"),
    minify: true,
  });
}
const pkg = JSON.parse(
  fs.readFileSync(path.join(root, "Starter.jetcartoon.json")),
);
const library = JSON.parse(
  fs.readFileSync(path.join(root, "music/manifest.json")),
);
for (const item of library.tracks) {
  const audio = fs.readFileSync(path.join(root, "music", item.file));
  if (
    require("node:crypto").createHash("sha256").update(audio).digest("hex") !==
    item.sha256
  )
    throw Error("Music checksum mismatch: " + item.name);
  pkg.assets["music/" + item.name] =
    "data:" + item.mime + ";base64," + audio.toString("base64");
}
fs.writeFileSync(path.join(root, "Demo.jetcartoon.json"), JSON.stringify(pkg));
const tutorial = JSON.parse(
  fs.readFileSync(path.join(root, "examples/first-cartoon.json")),
);
tutorial.assets = { ...pkg.assets, ...tutorial.assets };
fs.writeFileSync(
  path.join(root, "First-Cartoon.jetcartoon.json"),
  JSON.stringify(tutorial),
);
const scripts = [
  ["assets", "const BUNDLED=" + JSON.stringify(pkg) + ";"],
  ["engine", fs.readFileSync(path.join(root, "engine.bundle.js"), "utf8")],
  ["voice", fs.readFileSync(path.join(root, "voice.bundle.js"), "utf8")],
  [
    "pdf",
    fs.readFileSync(require.resolve("pdf-lib/dist/pdf-lib.min.js"), "utf8"),
  ],
  ...["print", "ui", "print-ui"].map((name) => [
    name,
    fs.readFileSync(path.join(__dirname, name + ".js"), "utf8"),
  ]),
]
  .map(
    ([id, code]) =>
      '<script id="cs-' +
      id +
      '">' +
      code.replace(/<\/script/gi, "<\\/script") +
      "</script>",
  )
  .join("\n");
fs.writeFileSync(
  path.join(root, "START.html"),
  fs
    .readFileSync(path.join(__dirname, "shell.html"), "utf8")
    .replace("<!--SCRIPTS-->", () => scripts),
);
console.log("Built START.html. Open locally in a browser; no server required.");
