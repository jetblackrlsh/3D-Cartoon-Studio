// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!doctype html>", { runScripts: "outside-only" });
try {
  dom.window.eval(
    fs.readFileSync(path.join(__dirname, "../voice.bundle.js"), "utf8"),
  );
  for (const preset of Object.keys(dom.window.StudioVoice.presets)) {
    const bytes = Buffer.from(
      dom.window.StudioVoice.generate(
        "Every world begins with an idea.",
        preset,
      ),
    );
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WAVE");
    assert.ok(bytes.length > 10000, "speech must contain samples");
    assert.ok(
      bytes.subarray(44).some((v) => v !== 0),
      "speech must not be silent",
    );
    console.log("Speech generated:", preset, bytes.length, "bytes");
  }
} finally {
  dom.window.close();
}
