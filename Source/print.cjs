#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
/* CLI uses the identical browser engine. Install documented dependencies once. */
const fs = require("fs"),
  path = require("path"),
  vm = require("vm"),
  native = require("@napi-rs/canvas");
async function main() {
  let [mode, input, output, optionsFile] = process.argv.slice(2);
  if (!["still", "page", "comic"].includes(mode) || !input || !output)
    throw Error(
      "Usage: node print.cjs still|page|comic input.json output.png|output-directory [options.json]",
    );
  let data = JSON.parse(fs.readFileSync(input, "utf8")),
    opt = optionsFile ? JSON.parse(fs.readFileSync(optionsFile, "utf8")) : {},
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
      PDFLib: require("pdf-lib"),
    };
  ctx.window = ctx;
  ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "../engine.bundle.js"), "utf8"),
    ctx,
  );
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "print.js"), "utf8"),
    ctx,
  );
  const P = ctx.StudioPrint;
  let report = { mode, input, options: opt, files: [] };
  if (mode === "still" || mode === "page") {
    let c = await (mode === "still"
      ? P.still(data, opt)
      : P.page(data, opt.pageIndex ?? 0, opt));
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, c.toBuffer("image/png"));
    report.files.push({ path: output, width: c.width, height: c.height });
  } else {
    P.validateComic(data);
    fs.mkdirSync(output, { recursive: true });
    for (let i = 0; i < data.pages.length; i++) {
      let c = await P.page(data, i, opt),
        f = path.join(
          output,
          "page-" + String(i + 1).padStart(3, "0") + ".png",
        );
      fs.writeFileSync(f, c.toBuffer("image/png"));
      report.files.push({ path: f, width: c.width, height: c.height });
    }
    let f = path.join(output, "comic.pdf");
    fs.writeFileSync(f, await P.pdf(data, opt));
    report.files.push({ path: f });
    fs.writeFileSync(
      path.join(output, "comic.jetcomic.json"),
      JSON.stringify(data),
    );
    fs.writeFileSync(
      path.join(output, "render-report.json"),
      JSON.stringify(report, null, 2),
    );
  }
  console.log(JSON.stringify(report, null, 2));
}
main().catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
