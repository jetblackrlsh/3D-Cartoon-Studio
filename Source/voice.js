// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
const meSpeak = require("mespeak");
meSpeak.loadConfig(require("mespeak/src/mespeak_config.json"));
meSpeak.loadVoice(require("mespeak/voices/en/en-us.json"));
const presets = {
  narrator: { speed: 155, pitch: 43, variant: "m3" },
  warm: { speed: 155, pitch: 54, variant: "m1" },
  bright: { speed: 170, pitch: 65, variant: "f2" },
  gruff: { speed: 145, pitch: 26, variant: "m7" },
  whisper: { speed: 145, pitch: 48, variant: "whisper" },
  robot: { speed: 160, pitch: 50, variant: "klatt" },
};
window.StudioVoice = {
  presets,
  kokoro: require("./kokoro.cjs"),
  providers: {kokoro: "Kokoro (preferred · local Python setup)", mespeak: "Bundled synthetic (meSpeak · immediate offline)"},
  generate(text, name = "narrator") {
    if (typeof text !== "string" || text.length > 8000)
      throw Error("Voice text must be at most 8000 characters.");
    return new Uint8Array(
      meSpeak.speak(text, {
        ...(presets[name] || presets.narrator),
        rawdata: "array",
      }),
    );
  },
};
