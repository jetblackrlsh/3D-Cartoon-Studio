// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
/* Offline headless renderer: npm install @napi-rs/canvas; ffmpeg on PATH. */
const fs = require("fs"),
  vm = require("vm"),
  path = require("path"),
  { spawn, spawnSync } = require("child_process"),
  { once } = require("events");
async function main() {
  let [pkgPath, outDir = "rendered", start = "0", end = "999", fpsArg = "12"] =
    process.argv.slice(2);
  if (!pkgPath)
    throw Error(
      "Usage: node render.cjs project.jetcartoon.json output-directory [first-scene] [last-scene] [fps]",
    );
  let native = require("@napi-rs/canvas"),
    pkg = JSON.parse(fs.readFileSync(pkgPath)),
    here = __dirname,
    bundle = fs.readFileSync(path.join(here, "../engine.bundle.js"), "utf8");
  let c = {
    AbortController,
    console,
    TextEncoder,
    TextDecoder,
    setTimeout,
    Image: native.Image,
    document: { createElement: () => native.createCanvas(1, 1) },
  };
  c.window = c;
  c.self = c;
  vm.createContext(c);
  vm.runInContext(bundle, c);
  let S = c.CartoonStudio;
  S.validate(pkg.project);
  await S.init(pkg.assets);
  fs.mkdirSync(outDir, { recursive: true });
  let fps = Math.max(6, Math.min(30, +fpsArg)),
    canvas = native.createCanvas(1280, 720),
    renderer = new S.SoftwareRenderer(canvas),
    rows = S.timeline(pkg.project),
    report = [];
  function data(key, file) {
    let d = pkg.assets[key];
    if (!d) throw Error("Missing audio asset " + key);
    fs.writeFileSync(file, Buffer.from(d.split(",")[1], "base64"));
  }
  for (
    let i = +start;
    i <= Math.min(+end, pkg.project.scenes.length - 1);
    i++
  ) {
    let s = pkg.project.scenes[i],
      st = S.stage(s),
      frames = Math.ceil(s.duration * fps),
      duration = frames / fps,
      base = path.join(outDir, "scene-" + String(i).padStart(3, "0")),
      video = base + ".silent.mp4",
      output = base + ".mp4";
    if (fs.existsSync(output)) {
      console.log("EXISTS", i);
      continue;
    }
    await S.prepare(st);
    let begin = Date.now();
    let ff = spawn(
      "ffmpeg",
      [
        "-v",
        "error",
        "-y",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgba",
        "-s",
        "1280x720",
        "-r",
        String(fps),
        "-i",
        "pipe:0",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "22",
        "-pix_fmt",
        "yuv420p",
        video,
      ],
      { stdio: ["pipe", "ignore", "pipe"] },
    );
    let errors = "";
    ff.stderr.on("data", (b) => (errors += b));
    ff.stdin.on("error", () => {});
    for (let n = 0; n < frames; n++) {
      let t = n / fps;
      renderer.render(S.update(st, t), t);
      if (n === Math.floor(frames * 0.45))
        fs.writeFileSync(base + ".png", canvas.toBuffer("image/png"));
      let buffer = canvas.data();
      if (!ff.stdin.write(buffer)) await once(ff.stdin, "drain");
      if (n % 24 === 0 && global.gc) global.gc();
      if (n % 120 === 0)
        console.log(
          "FRAME",
          i,
          n,
          "rssMB",
          Math.round(process.memoryUsage().rss / 1048576),
        );
    }
    ff.stdin.end();
    let [code] = await once(ff, "close");
    if (code) throw Error(errors);
    let args = ["-v", "error", "-y", "-i", video],
      filters = [],
      inputs = 1,
      labels = [];
    if (s.audio && pkg.assets[s.audio]) {
      let voice = base + ".voice";
      data(s.audio, voice);
      args.push("-i", voice);
      filters.push(
        `[${inputs}:a]volume=0.95,apad,atrim=duration=${duration}[voice]`,
      );
      labels.push("[voice]");
      inputs++;
    }
    if (s.music && pkg.assets["music/" + s.music]) {
      let music = base + ".music";
      data("music/" + s.music, music);
      args.push(
        "-stream_loop",
        "-1",
        "-ss",
        String((rows[i].start || 0) % 80),
        "-i",
        music,
      );
      filters.push(
        `[${inputs}:a]volume=0.075,atrim=duration=${duration},afade=t=in:d=0.7,afade=t=out:st=${Math.max(0, duration - 0.8)}:d=0.8[music]`,
      );
      labels.push("[music]");
      inputs++;
    }
    if (s.sfx?.length) {
      let sound = base + ".sfx.wav";
      makeSFX(sound, s, duration);
      args.push("-i", sound);
      filters.push(`[${inputs}:a]volume=0.24[sfx]`);
      labels.push("[sfx]");
      inputs++;
    }
    if (labels.length) {
      filters.push(
        labels.join("") +
          `amix=inputs=${labels.length}:normalize=0,alimiter=limit=0.92[out]`,
      );
      args.push(
        "-filter_complex",
        filters.join(";"),
        "-map",
        "0:v",
        "-map",
        "[out]",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-t",
        String(duration),
        "-movflags",
        "+faststart",
        output,
      );
    } else args.push("-c", "copy", output);
    let r = spawnSync("ffmpeg", args, { encoding: "utf8" });
    if (r.status) throw Error(r.stderr);
    report.push({
      scene: i,
      duration,
      frames,
      renderSeconds: (Date.now() - begin) / 1000,
      file: output,
    });
    fs.writeFileSync(
      path.join(outDir, "report-" + start + ".json"),
      JSON.stringify(report, null, 2),
    );
    for (let ext of [".silent.mp4", ".voice", ".music", ".sfx.wav"])
      if (fs.existsSync(base + ext)) fs.unlinkSync(base + ext);
    console.log(
      "DONE",
      i,
      frames,
      "frames",
      ((Date.now() - begin) / 1000).toFixed(1) + "s",
    );
    st.root.traverse((x) => {
      if (x.geometry) x.geometry.dispose();
    });
    if (global.gc) global.gc();
  }
}
function makeSFX(file, s, duration) {
  let sr = 22050,
    n = Math.ceil(duration * sr),
    samples = new Float32Array(n);
  for (let e of s.sfx) {
    let start = Math.floor((e.at || 0) * s.duration * sr),
      len = Math.floor(sr * (e.kind === "alarm" ? 1.1 : 0.4));
    for (let j = 0; j < len && start + j < n; j++) {
      let t = j / sr,
        f =
          e.kind === "laser"
            ? 1200 - 1800 * t
            : e.kind === "rewind"
              ? 250 + 1800 * t
              : e.kind === "alarm"
                ? 650
                : e.kind === "block"
                  ? 950
                  : 80,
        env = Math.pow(1 - j / len, 2),
        v = Math.sin(2 * Math.PI * f * t) * env;
      if (e.kind === "impact")
        v += (Math.sin(j * 33.73) + Math.sin(j * 11.21)) * 0.15 * env;
      samples[start + j] += v * 0.45;
    }
  }
  let b = Buffer.alloc(44 + n * 2);
  b.write("RIFF");
  b.writeUInt32LE(36 + n * 2, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24);
  b.writeUInt32LE(sr * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++)
    b.writeInt16LE(
      Math.max(-32767, Math.min(32767, samples[i] * 32767)),
      44 + i * 2,
    );
  fs.writeFileSync(file, b);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
