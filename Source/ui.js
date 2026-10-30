// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
(async function() {
  "use strict";
  const $ = (id) => document.getElementById(id), S = CartoonStudio, clone = (x) => JSON.parse(JSON.stringify(x));
  let pkg = clone(BUNDLED), project = pkg.project, renderer, st, index = -1, time = 0, playing = false, last = 0, voice = null, effect = null, music = null, musicKey = "", voiceIndex = -1, audioURLs = /* @__PURE__ */ new Map(), exporting = false, preferredNewMode = "fast";
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function url(key) {
    return pkg.assets[key] || key;
  }
  function total() {
    return S.timeline(project).at(-1).end;
  }
  function status(t) {
    $("status").textContent = t;
  }
  function download(name, data, type) {
    let u = URL.createObjectURL(new Blob([data], { type: type || "application/json" })), a = document.createElement("a");
    a.href = u;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 2e3);
  }
  function effectiveSettings() {
    const fast = (project.renderSettings?.mode ?? S.defaultRenderMode?.(project) ?? "standard") === "fast";
    return S.renderSettings(project, fast ? {} : { fps: project.renderSettings?.fps ?? 24 });
  }
  function syncRenderSettings() {
    const r = effectiveSettings(), c = $("preview");
    if (c.width !== r.width || c.height !== r.height) {
      c.width = r.width;
      c.height = r.height;
      index = -1;
    }
    $("renderMode").value = r.mode;
    $("renderEffective").textContent = `${r.width} \xD7 ${r.height} \xB7 ${r.fps} fps${r.mode === "fast" ? " \xB7 reduced detail / choppy motion" : " \xB7 existing full-actor rendering"}`;
    return r;
  }
  function fastBudget() {
    const s = project.scenes[S.locate(project, time).index], full = s.actors.filter((a) => !S.backgroundExtraEligible?.(a, s) || a.renderRepresentation === "full").length, skinned = s.actors.filter((a) => a.kind === "standard-humanoid").length;
    $("fastBudget").textContent = effectiveSettings().mode === "fast" ? `Authoring budget: ${full} full actors. Prefer 1\u20132 per shot; no actor or plot beat is removed.${full > 2 ? " Consider splitting the shot, not deleting its action." : ""}${skinned ? " Existing imported cast retained unchanged; their skinning and geometry can cost more." : ""}` : "";
  }
  function stopAudio() {
    if (voice) voice.pause();
    if (effect) effect.pause();
    if (music) music.pause();
    voice = null;
    music = null;
    musicKey = "";
    voiceIndex = -1;
  }
  function select(i) {
    playing = false;
    stopAudio();
    time = S.timeline(project)[i].start;
    index = -1;
    draw();
    editor();
  }
  function editor() {
    let row = S.locate(project, time), s = project.scenes[row.index];
    $("sceneList").innerHTML = project.scenes.map((s2, i) => `<option value="${i}" ${i === row.index ? "selected" : ""}>${i + 1}. ${esc(s2.title)}</option>`).join("");
    $("title").value = s.title;
    $("caption").value = s.caption;
    $("duration").value = s.duration.toFixed(2);
    $("environment").value = s.environment;
    $("environmentSet").innerHTML = S.environmentCatalog.map((e) => `<option value="${esc(e.id)}">${esc(e.label || e.id)}</option>`).join("");
    $("environmentSet").value = s.set || S.environmentCatalog[0].id;
    $("voicePreset").value = s.voice || "narrator";
    $("voiceProvider").value = s.voiceProvider || "mespeak";
    $("kokoroSpeaker").value = s.speakerId || s.speaker || "narrator";
    const castVoice = project.voiceCast?.[$("kokoroSpeaker").value];
    $("kokoroVoice").value = s.kokoroVoice || castVoice?.voice || "af_heart";
    $("kokoroSpeed").value = s.kokoroSpeed ?? castVoice?.speed ?? 1;
    $("musicTrack").value = s.music || "";
    $("camera").value = JSON.stringify(s.camera || [5, 3.7, 9]);
    $("actors").value = JSON.stringify(s.actors, null, 2);
    const selectedActor = $("castActor").value;
    $("castActor").innerHTML = s.actors.map((a, i) => `<option value="${i}">${esc(a.id || a.kind)} (${esc(a.cast || a.kind)})</option>`).join("");
    if (selectedActor && +selectedActor < s.actors.length) $("castActor").value = selectedActor;
    $("shots").value = JSON.stringify(s.shots || [], null, 2);
    $("props").value = JSON.stringify(s.props || [], null, 2);
    $("effects").value = JSON.stringify(s.effects || [], null, 2);
    $("setName").value = s.set || "street";
    if ($("worldOptions")) $("worldOptions").value = JSON.stringify(s.environmentOptions || {}, null, 2);
    if (s.environment === "catalog" && $("worldName")) $("worldName").value = s.set;
    $("exportStart").max = project.scenes.length - 1;
    $("exportEnd").max = project.scenes.length - 1;
    $("seek").max = total();
    if ($("presetActor")) presetEditor();
    syncRenderSettings();
    fastBudget();
  }
  function draw() {
    const settings = syncRenderSettings();
    let row = S.locate(project, time), local = time - row.start;
    if (row.index !== index) {
      S.disposeStage(st);
      index = row.index;
      st = S.stage(project.scenes[index], settings);
    }
    renderer.render(S.update(st, local), local);
    $("seek").value = time;
    $("clock").textContent = time.toFixed(1) + " / " + total().toFixed(1) + " seconds \xB7 scene " + (index + 1) + " \xB7 " + renderer.mode;
  }
  function audio(row) {
    let local = time - row.start, s = project.scenes[row.index];
    if (voiceIndex !== row.index) {
      if (voice) voice.pause();
      voiceIndex = row.index;
      if (effect) effect.pause();
      if (pkg.assets["sfx/" + s.id]) {
        effect = new Audio(url("sfx/" + s.id));
        effect.volume = 0.24;
        effect.currentTime = local;
        effect.play().catch(() => {
        });
      }
      if (pkg.assets[s.audio]) {
        voice = new Audio(url(s.audio));
        voice.volume = +$("voiceVolume").value;
        voice.currentTime = Math.min(local, Math.max(0, (s.voiceDuration || s.duration) - 0.05));
        voice.play().catch((e) => status("Press Play to allow sound: " + e.message));
      } else voice = null;
    }
    if (s.music !== musicKey) {
      if (music) music.pause();
      musicKey = s.music;
      if (pkg.assets["music/" + s.music]) {
        music = new Audio(url("music/" + s.music));
        music.loop = true;
        music.volume = +$("musicVolume").value;
        music.play().catch(() => {
        });
      } else music = null;
    }
    if (voice) voice.volume = +$("voiceVolume").value;
    if (music) music.volume = +$("musicVolume").value * (voice && !voice.paused ? 0.55 : 1);
  }
  let lastPreviewFrame = -Infinity;
  function tick(t) {
    if (playing) {
      time += Math.min(0.15, (t - last) / 1e3);
      if (time >= total()) {
        time = total() - 1e-3;
        playing = false;
        stopAudio();
      }
      if (effectiveSettings().mode !== "fast" || t - lastPreviewFrame >= 1e3 / effectiveSettings().fps) {
        draw();
        lastPreviewFrame = t;
      }
      if (playing) audio(S.locate(project, time));
    }
    last = t;
    requestAnimationFrame(tick);
  }
  await S.init(pkg.assets);
  renderer = new S.PreviewRenderer($("preview"));
  draw();
  editor();
  requestAnimationFrame(tick);
  $("play").onclick = () => {
    playing = !playing;
    $("play").textContent = playing ? "Pause" : "Play";
    if (!playing) stopAudio();
    else {
      last = performance.now();
      audio(S.locate(project, time));
    }
  };
  $("seek").oninput = () => {
    playing = false;
    stopAudio();
    time = +$("seek").value;
    index = -1;
    draw();
    editor();
  };
  $("sceneList").onchange = () => select(+$("sceneList").value);
  function applyScene() {
    try {
      let candidate = clone(project), s = candidate.scenes[index], old = s.caption;
      s.title = $("title").value;
      s.caption = $("caption").value;
      s.duration = +$("duration").value;
      s.environment = $("environment").value;
      s.voice = $("voicePreset").value;
      // An unchanged legacy scene stays legacy; never silently migrate loaded projects.
      if (s.voiceProvider || $("voiceProvider").value !== "mespeak") s.voiceProvider = $("voiceProvider").value;
      if (s.voiceProvider === "kokoro") {
        s.kokoroVoice = $("kokoroVoice").value;
        s.kokoroSpeed = +$("kokoroSpeed").value;
        s.speakerId = $("kokoroSpeaker").value.trim() || "narrator";
        StudioVoice.kokoro.request(s, candidate);
      }
      s.music = $("musicTrack").value;
      s.camera = JSON.parse($("camera").value);
      s.actors = JSON.parse($("actors").value);
      s.shots = JSON.parse($("shots").value);
      s.props = JSON.parse($("props").value);
      s.effects = JSON.parse($("effects").value);
      s.set = s.environment === "catalog" ? $("environmentSet").value : $("setName").value;
      if (old !== s.caption) {
        delete s.captions;
        delete s.audio;
      }
      S.validate(candidate);
      // A legacy project may embed only the original four songs. Selecting an
      // additional bundled song explicitly brings its exact bytes into this project.
      const musicAsset = "music/" + s.music;
      if (s.music && !pkg.assets[musicAsset] && BUNDLED.assets[musicAsset]) pkg.assets[musicAsset] = BUNDLED.assets[musicAsset];
      project = candidate;
      pkg.project = project;
      let i = index;
      select(i);
      status("Scene updated. Regenerate speech if you changed its text.");
      return true;
    } catch (e) {
      status(e.message);
    }
  };
  $("apply").onclick = applyScene;
  $("generateVoice").onclick = async () => {
    try {
      if (!applyScene()) return;
      if (project.scenes[index].voiceProvider === "kokoro") {
        exportKokoroRequest();
        return;
      }
      status("Synthesizing bundled offline voice\u2026");
      await new Promise((r) => setTimeout(r, 30));
      let s = project.scenes[index], bytes = StudioVoice.generate(s.caption, s.voice);
      let blob = new Blob([bytes], { type: "audio/wav" }), reader = new FileReader();
      reader.onload = () => {
        let key = "voice/edited-" + Date.now();
        pkg.assets[key] = reader.result;
        s.audio = key;
        let a = new Audio(reader.result);
        a.onloadedmetadata = () => {
          s.voiceDuration = a.duration;
          s.duration = Math.max(s.duration, a.duration + 0.8);
          delete s.captions;
          editor();
          status("Speech generated and stored in this project.");
        };
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      status(e.message);
    }
  };
  function exportKokoroRequest() {
    const scene = {...project.scenes[index],caption:$("caption").value,kokoroVoice:$("kokoroVoice").value,kokoroSpeed:+$("kokoroSpeed").value,speakerId:$("kokoroSpeaker").value.trim() || "narrator"};
    const request = StudioVoice.kokoro.request(scene,project);
    download("scene-" + index + ".kokoro-request.json", JSON.stringify(request,null,2));
    status("Kokoro request exported. Run the local Python command below, then import clip.wav.json. No model download runs in this browser.");
  }
  $("kokoroRequest").onclick = () => { try { exportKokoroRequest(); } catch(e) { status(e.message); } };
  $("kokoroSpeaker").onchange = () => {
    const id=$("kokoroSpeaker").value.trim(), cast=project.voiceCast;
    const choice=cast && Object.hasOwn(cast,id) ? cast[id] : null;
    if(choice) { $("kokoroVoice").value=choice.voice;$("kokoroSpeed").value=choice.speed; }
  };
  $("kokoroCast").onclick = () => {
    try {
      const ids = [...new Set(["narrator",...project.scenes.flatMap(s=>s.actors.map(a=>a.id))])];
      project.voiceCast = StudioVoice.kokoro.assignCast(ids, project.voiceCast || {});
      const choice = project.voiceCast[$("kokoroSpeaker").value];
      if(choice) {$("kokoroVoice").value=choice.voice;$("kokoroSpeed").value=choice.speed;}
      status("Distinct Kokoro cast assigned (10 voices, then cycle). Existing assignments kept. Set each scene's speaker ID; apply to save its voice.");
    } catch(e) { status(e.message); }
  };
  $("kokoroClip").onchange = async () => {
    try {
      if(exporting)throw Error("Finish the current recording before importing speech.");
      const f=$("kokoroClip").files[0]; if(!f)return;
      if(f.size>42000000)throw Error("Use clips under 30 MB.");
      const target=index, original=JSON.stringify(project), candidate=clone({...pkg,project});
      // Imports use applied scene settings, not half-edited form controls.
      const clip = JSON.parse(await f.text());
      StudioVoice.kokoro.wavDuration(clip.data);
      await StudioVoice.kokoro.verifyHash(clip);
      StudioVoice.kokoro.embed(candidate,target,clip);
      if(index!==target || JSON.stringify(project)!==original)throw Error("Scene changed during import; try again.");
      pkg=candidate;project=pkg.project;select(target);
      status("Kokoro narration embedded. Playback and movie export are now fully offline.");
    } catch(e) { status("Kokoro import rejected: "+e.message); }
    finally { $("kokoroClip").value=""; }
  };
  $("voiceSample").onclick = () => {
    if ($("voiceProvider").value === "kokoro") {
      const s=project.scenes[index];
      if(s.audio && s.voiceProvenance?.provider === "kokoro") new Audio(url(s.audio)).play().catch(e=>status(e.message));
      else status("Import a generated Kokoro clip to hear it, or select Bundled synthetic for an immediate offline sample.");
      return;
    }
    let b = StudioVoice.generate("Welcome to the cartoon studio. Every world begins with an idea.", $("voicePreset").value);
    new Audio(URL.createObjectURL(new Blob([b], { type: "audio/wav" }))).play().catch((e) => status(e.message));
  };
  $("save").onclick = () => download("Jet-Cartoon-Project.json", JSON.stringify({ ...pkg, project }, null, 2));
  $("load").onchange = async () => {
    if (exporting) {
      status("Finish the current recording before loading a project.");
      return;
    }
    const previous = pkg;
    try {
      let f = $("load").files[0];
      if (!f) return;
      if (f.size > 2e8) throw Error("Project exceeds 200 MB.");
      let data = JSON.parse(await f.text());
      if (!data.assets || typeof data.assets !== "object") throw Error("Missing assets.");
      for (let value of Object.values(data.assets)) if ((typeof value !== "string" || !value.startsWith("data:")) && value?.schema !== "JetStandardAsset") throw Error("Project assets must be embedded data URLs or supported portable assets.");
      data.assets = { ...Object.fromEntries(Object.entries(BUNDLED.assets).filter(([, v]) => v?.schema === "JetStandardAsset")), ...data.assets };
      stopAudio();
      playing = false;
      await S.init(data.assets);
      S.validate(data.project);
      pkg = data;
      project = data.project;
      time = 0;
      index = -1;
      draw();
      editor();
      standardRefresh();
      status("Project loaded; bundled standard-rig library remains available.");
    } catch (e) {
      await S.init(previous.assets);
      pkg = previous;
      project = previous.project;
      index = -1;
      draw();
      editor();
      status("Project load rejected: " + e.message);
    }
  };
  $("duplicate").onclick = () => {
    project.scenes.splice(index + 1, 0, { ...clone(project.scenes[index]), id: "scene-" + Date.now() });
    select(index + 1);
  };
  $("delete").onclick = () => {
    if (project.scenes.length < 2) return;
    if (confirm("Remove this scene from the current project? Export a backup first if needed.")) {
      project.scenes.splice(index, 1);
      select(Math.min(index, project.scenes.length - 1));
    }
  };
  $("renderMode").onchange = () => {
    if (exporting) {
      $("renderMode").value = effectiveSettings().mode;
      status("Finish the current recording before changing render presets.");
      return;
    }
    playing = false;
    stopAudio();
    preferredNewMode = $("renderMode").value;
    project.renderSettings = { mode: preferredNewMode };
    pkg.project = project;
    index = -1;
    draw();
    editor();
    status("Render preset saved with this project. Existing cast and story remain unchanged.");
  };
  $("newProject").onclick = () => {
    if (exporting) {
      status("Finish the current recording before starting a project.");
      return;
    }
    const settings = { mode: preferredNewMode };
    if (!confirm("Start a new project? Export this one first to keep edits.")) return;
    stopAudio();
    project = { schema: "JetCartoonProject", version: 1, createdWith: "1.7.0", title: "New cartoon", voiceCast: {narrator:{voice:"af_heart",speed:1}}, renderSettings: { mode: settings.mode }, scenes: [{ id: "scene-1", title: "Opening", label: "Opening", caption: "A new story begins.", duration: 6, environment: "gym", page: 0, actors: settings.mode === "fast" ? S.diverseCast(2, { genre: $("castGenre").value || "everyday", seed: 0 }) : [{ id: "actor-1", ...S.createStandardCastActor("standard-everyday-neighbor-m"), id: "actor-1" }], props: [], camera: [3, 2.3, 5], target: [0, 1, 0], music: "Tranquility", voice: "narrator", voiceProvider: "kokoro", kokoroVoice:"af_heart", kokoroSpeed:1, speakerId:"narrator" }] };
    pkg.project = project;
    select(0);
  };
  $("png").onclick = () => {
    $("preview").toBlob((b) => {
      if (b) download("Scene-" + (index + 1) + ".png", b, "image/png");
    });
  };
  $("audioFile").onchange = async () => {
    let f = $("audioFile").files[0];
    if (!f) return;
    if (f.size > 3e7) {
      status("Use audio under 30 MB.");
      return;
    }
    let r = new FileReader();
    r.onload = () => {
      let key = "voice/import-" + Date.now();
      pkg.assets[key] = r.result;
      project.scenes[index].audio = key;
      status("Imported audio for this scene. Adjust its duration to fit.");
    };
    r.readAsDataURL(f);
  };
  $("exportMovie").onclick = async () => {
    if (exporting) {
      status("A recording is already running.");
      return;
    }
    if (!window.MediaRecorder || !$("preview").captureStream) {
      status("This browser does not support recording. Use the included headless renderer.");
      return;
    }
    playing = false;
    stopAudio();
    let first = clampInt($("exportStart").value, 0, project.scenes.length - 1), end = clampInt($("exportEnd").value, first, project.scenes.length - 1), rows = S.timeline(project), start = rows[first].start, finish = rows[end].end;
    const settings = syncRenderSettings();
    exporting = true;
    $("renderMode").disabled = true;
    $("exportMovie").disabled = true;
    let stream = $("preview").captureStream(settings.fps), ctx = new AudioContext(), dest = ctx.createMediaStreamDestination(), buffers = [];
    status("Preparing offline audio for export\u2026");
    try {
      let frame = function(now) {
        time = Math.min(finish - 1e-3, start + (now - base) / 1e3);
        if (settings.mode !== "fast" || now - lastExportFrame >= 1e3 / settings.fps) {
          draw();
          lastExportFrame = now;
        }
        status("Recording " + (time - start).toFixed(1) + " / " + (finish - start).toFixed(1) + "s. Keep this tab visible.");
        if (now - base < (finish - start) * 1e3) requestAnimationFrame(frame);
        else rec.stop();
      };
      for (let i = first; i <= end; i++) {
        let s = project.scenes[i];
        if (pkg.assets[s.audio]) {
          let raw = Uint8Array.from(atob(pkg.assets[s.audio].split(",")[1]), (c) => c.charCodeAt(0));
          let buffer = await ctx.decodeAudioData(raw.buffer);
          buffers.push({ buffer, at: rows[i].start - start, gain: 0.9 });
        }
        if (pkg.assets["sfx/" + s.id]) {
          let raw = Uint8Array.from(atob(pkg.assets["sfx/" + s.id].split(",")[1]), (c) => c.charCodeAt(0)), buffer = await ctx.decodeAudioData(raw.buffer);
          buffers.push({ buffer, at: rows[i].start - start, gain: 0.24 });
        }
        if (pkg.assets["music/" + s.music]) {
          let raw = Uint8Array.from(atob(pkg.assets["music/" + s.music].split(",")[1]), (c) => c.charCodeAt(0)), buffer = await ctx.decodeAudioData(raw.buffer);
          buffers.push({ buffer, at: rows[i].start - start, gain: 0.07, duration: s.duration, loop: true });
        }
      }
      let audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);
      let mime = MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm", rec = new MediaRecorder(stream, { mimeType: mime }), chunks = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        exporting = false;
        $("renderMode").disabled = false;
        $("exportMovie").disabled = false;
        download("Cartoon." + (mime.includes("mp4") ? "mp4" : "webm"), new Blob(chunks, { type: mime }), mime);
        ctx.close();
        stream.getTracks().forEach((t) => t.stop());
        download("Cartoon-export-settings.json", JSON.stringify({ schema: "JetCartoonRenderMetadata", version: 1, ...settings, firstScene: first, lastScene: end, source: "browser-recording", note: "Real-time browser capture; actual scheduling depends on tab visibility and CPU. Headless export provides deterministic frame counts." }, null, 2));
        status("Movie and effective export settings saved. Headless tools create a separate 2x copy from these same frames.");
      };
      let epoch = ctx.currentTime + 0.15;
      for (let item of buffers) {
        let node = ctx.createBufferSource(), gain = ctx.createGain();
        node.buffer = item.buffer;
        node.loop = !!item.loop;
        gain.gain.value = item.gain;
        node.connect(gain);
        gain.connect(dest);
        node.start(epoch + item.at);
        if (item.duration) node.stop(epoch + item.at + item.duration);
      }
      time = start;
      index = -1;
      rec.start();
      let base = performance.now(), lastExportFrame = -Infinity;
      requestAnimationFrame(frame);
    } catch (e) {
      exporting = false;
      $("renderMode").disabled = false;
      $("exportMovie").disabled = false;
      status(e.message);
      ctx.close();
      stream.getTracks().forEach((t) => t.stop());
    }
  };
  function clampInt(x, a, b) {
    return Math.max(a, Math.min(b, Math.floor(+x) || 0));
  }
  function presetEditor() {
    if (!$("presetActor")) return;
    const s = project.scenes[S.locate(project, time).index], old = $("presetActor").value;
    $("presetActor").innerHTML = s.actors.map((a2, i) => `<option value="${i}">${esc(a2.id || a2.kind)}</option>`).join("");
    $("presetActor").value = String(Math.min(+old || 0, s.actors.length - 1));
    const a = s.actors[+$("presetActor").value];
    if (!a) return;
    $("actorRenderRole").value = a.renderRole === "background-extra" ? "background-extra" : "active";
    $("actorRepresentation").value = a.renderRepresentation === "full" ? "full" : "auto";
    $("actorNonInteracting").checked = a.nonInteracting === true;
    $("actorRoleState").textContent = S.backgroundExtraEligible?.(a, s) ? "Eligible background extra; Fast Mode may render a cutout." : "Full actor retained (active, unmarked, or protected).";
    const d = a.design || {};
    $("rigKind").value = ["blank-human", "blank-skater", "skater", "standard-humanoid"].includes(a.kind) ? a.kind : "keep";
    for (const [id, key, fallback] of [["styleSkin", "skin", "#c6cdd7"], ["styleTop", "top", "#a9b5c5"], ["styleLegs", "legs", "#8391a6"], ["styleShoes", "shoes", "#58657b"], ["styleHair", "hair", "#3d4055"]]) $(id).value = d[key] || fallback;
    $("hairVisible").checked = !!d.hairVisible;
    $("helmetVisible").checked = d.helmetVisible !== false;
    $("rigHeight").value = d.height || (["blank-human", "standard-humanoid"].includes(a.kind) ? 2.62 : 1.72);
    for (const [id, k] of [["standardBody", "body"], ["standardHair", "hairStyle"], ["standardOutfit", "outfit"], ["standardAccessory", "accessory"]]) if ($(id) && d[k]) $(id).value = d[k];
  }
  function changeActor(fn) {
    const copy = clone(project), row = S.locate(copy, time), s = copy.scenes[row.index], ai = +$("presetActor").value;
    if (!s.actors[ai]) throw Error("Select an actor");
    fn(s.actors[ai], s);
    S.validate(copy);
    project = copy;
    pkg.project = project;
    select(row.index);
    presetEditor();
  }
  $("presetName").innerHTML = S.presetCatalog.map((p) => `<option value="${p.name}">${esc(p.category + " \xB7 " + (p.label || p.name))}</option>`).join("");
  $("addFastExtras").onclick = () => {
    try {
      const copy = clone(project), row = S.locate(copy, time), scene = copy.scenes[row.index], count = Math.min(4, 16 - scene.actors.length);
      if (!count) throw Error("Actor limit reached");
      const actors = S.diverseCast(count, { genre: $("castGenre").value || "all", seed: scene.actors.length, used: scene.actors.map((a) => a.cast), existing: scene.actors });
      actors.forEach((a, i) => {
        a.id = "extra-" + Date.now() + "-" + i;
        a.from = [(i - (count - 1) / 2) * 1.4, 0, -3];
        a.renderRole = "background-extra";
        a.nonInteracting = true;
        a.renderRepresentation = "auto";
      });
      scene.actors.push(...actors);
      S.validate(copy);
      project = copy;
      pkg.project = project;
      select(row.index);
      status("Explicitly non-interacting background extras added. Review depth, occlusion and camera placement; promote any extra before giving it a story action.");
    } catch (e) {
      status(e.message);
    }
  };
  $("applyActorRole").onclick = () => {
    try {
      const role = $("actorRenderRole").value, nonInteracting = $("actorNonInteracting").checked, representation = $("actorRepresentation").value;
      if (role === "background-extra" && !nonInteracting) throw Error("Confirm that this is a non-interacting background extra, or leave it active.");
      changeActor((a) => {
        a.renderRole = role;
        a.nonInteracting = role === "background-extra" && nonInteracting;
        a.renderRepresentation = representation;
      });
      status("Role saved. Speaking, prop-handling, combat, and plot-relevant actors remain full geometry. Promote to Full 3D at any time.");
    } catch (e) {
      status(e.message);
    }
  };
  $("presetActor").onchange = presetEditor;
  $("presetName").onchange = () => {
    const skating = null; // Captured skating assets are not distributed.
    $("presetDuration").value = skating?.duration || 3;
    $("presetIntensity").disabled = !!skating;
    if (skating) $("presetIntensity").value = 1;
  };
  $("restyle").onclick = () => {
    try {
      changeActor((a) => {
        if ($("rigKind").value !== "keep") {
          a.kind = $("rigKind").value;
          if (!["blank-human", "standard-humanoid"].includes(a.kind)) {
            delete a.cast;
            for (const k of ["body", "hairStyle", "outfit", "accessory", "species", "variant"]) if (a.design) delete a.design[k];
          }
        }
        a.design = { ...a.design, skin: $("styleSkin").value, top: $("styleTop").value, legs: $("styleLegs").value, shoes: $("styleShoes").value, hair: $("styleHair").value, hairVisible: $("hairVisible").checked, helmetVisible: $("helmetVisible").checked, height: +$("rigHeight").value };
        if (a.kind === "standard-humanoid") {
          a.design.standardAsset = a.design.standardAsset || $("standardAsset").value;
          a.design.standardAppearance = true;
          a.design.preserveMaterials = false;
          a.design.body = a.design.body || "average";
          a.design.outfit = a.design.outfit || "blank";
          a.design.hairStyle = a.design.hairStyle || "bald";
        }
      });
      status("Appearance updated; motion retained.");
    } catch (e) {
      status(e.message);
    }
  };
  function chosenMotion() {
    const name = $("presetName").value, duration = +$("presetDuration").value;
    if (!Number.isFinite(duration) || duration <= 0 || duration > 30) throw Error("Duration must be >0 and <=30");
    return { format: "jetmotion3d", version: 1, name, duration, options: { intensity: +$("presetIntensity").value, mirror: $("presetMirror").checked, rootMotion: $("rootMotion").checked, accessory: $("presetAccessory").checked } };
  }
  function applyMotion(m) {
    if (m?.format !== "jetmotion3d" || m.version !== 1 || !S.presetCatalog.some((p) => p.name === m.name) || !Number.isFinite(m.duration) || m.duration <= 0 || m.duration > 30) throw Error("Invalid motion template");
    changeActor((a, s) => {
      if (m.name.startsWith("skate-") && !["skater", "blank-skater"].includes(a.kind)) throw Error("Choose a skater rig for captured skating clips");
      delete a.standardAnimation;
      a.action = m.name;
      a.presetOptions = m.options || {};
      a.beats = [{ at: 0, action: m.name, duration: m.duration, endAction: m.name.startsWith("skate-") ? m.name : "idle" }];
      s.duration = Math.max(s.duration, m.duration);
    });
  }
  $("applyPreset").onclick = () => {
    try {
      applyMotion(chosenMotion());
      status("Preset applied. Review the entire action and add props/effects if needed.");
    } catch (e) {
      status(e.message);
    }
  };
  $("savePreset").onclick = () => {
    try {
      const m = chosenMotion();
      download(m.name + ".jetmotion3d.json", JSON.stringify(m, null, 2));
    } catch (e) {
      status(e.message);
    }
  };
  $("loadPreset").onchange = async (e) => {
    try {
      let m = JSON.parse(await e.target.files[0].text());
      applyMotion(m);
      $("presetName").innerHTML = S.presetCatalog.map((p) => `<option value="${p.name}">${esc(p.category + " \xB7 " + (p.label || p.name))}</option>`).join("");
      $("presetName").value = m.name;
      status("Motion template imported.");
    } catch (e2) {
      status(e2.message);
    }
  };
  $("addPuppet").onclick = () => {
    const row = S.locate(project, time), s = project.scenes[row.index];
    if (s.actors.length >= 16) {
      status("Actor limit reached");
      return;
    }
    s.actors.push({ id: "puppet-" + Date.now(), kind: "blank-skater", from: [0, 0, 0], action: "idle", design: {} });
    index = -1;
    draw();
    editor();
    presetEditor();
  };
  presetEditor();
  $("vfxName").innerHTML = S.visualEffectCatalog.map((e) => `<option value="${e.id}">${esc(e.category + " \xB7 " + e.label)}</option>`).join("");
  $("vfxName").onchange = () => {
    const e = S.visualEffectCatalog.find((x) => x.id === $("vfxName").value);
    $("vfxColor").value = e.color;
    $("vfxY").value = ["ground-fog", "shockwave", "fire-flames", "embers", "smoke-plume", "dust-cloud", "water-splash"].includes(e.id) ? 0 : 1;
  };
  function chosenEffect() {
    return { kind: $("vfxName").value, start: +$("vfxStart").value, duration: +$("vfxDuration").value, color: $("vfxColor").value, position: [+$("vfxX").value, +$("vfxY").value, +$("vfxZ").value], scale: +$("vfxScale").value, intensity: +$("vfxIntensity").value };
  }
  function addEffect(e) {
    const row = S.locate(project, time), copy = clone(project);
    S.validateVisualEffect(e, copy.scenes[row.index].duration);
    if (!S.visualEffectCatalog.some((x) => x.id === e.kind)) throw Error("Unknown effect");
    copy.scenes[row.index].effects = [...copy.scenes[row.index].effects || [], e];
    if (copy.scenes[row.index].effects.length > 32) throw Error("At most 32 effects per scene");
    S.validate(copy);
    project = copy;
    pkg.project = project;
    select(row.index);
    status("Visual effect added. Add sound separately if wanted.");
  }
  $("addVfx").onclick = () => {
    try {
      addEffect(chosenEffect());
    } catch (e) {
      status(e.message);
    }
  };
  $("clearVfx").onclick = () => {
    const row = S.locate(project, time);
    project.scenes[row.index].effects = (project.scenes[row.index].effects || []).filter((e) => !S.visualEffectCatalog.some((x) => x.id === e.kind));
    index = -1;
    draw();
    editor();
  };
  $("saveVfx").onclick = () => {
    try {
      const e = chosenEffect();
      S.validateVisualEffect(e, project.scenes[S.locate(project, time).index].duration);
      download(e.kind + ".jetvfx3d.json", JSON.stringify({ format: "jetvfx3d", version: 1, effect: e }, null, 2));
    } catch (e) {
      status(e.message);
    }
  };
  $("loadVfx").onchange = async (e) => {
    try {
      const t = JSON.parse(await e.target.files[0].text());
      if (t.format !== "jetvfx3d" || t.version !== 1) throw Error("Invalid effect template");
      addEffect(t.effect);
    } catch (e2) {
      status(e2.message);
    }
  };
  $("propName").innerHTML = S.propCatalog.map((p) => `<option value="${p.id}">${esc(p.category + " \xB7 " + p.label)}</option>`).join("");
  function chosenProp() {
    const attach = $("propAttach").value, p = { id: "prop-" + Date.now(), library: $("propName").value.startsWith("urban-") ? "urban" : "2d-props", kind: $("propName").value, scale: +$("propScale").value, from: [+$("propX").value, +$("propY").value, +$("propZ").value] };
    if ($("propRecolor").checked) p.colors = { accent: $("propColor").value };
    if (attach !== "world") {
      const a = project.scenes[S.locate(project, time).index].actors[+$("presetActor").value];
      if (!a) throw Error("Select an actor before attaching");
      p.owners = [{ at: 0, actor: a.id }];
      p.socket = ["body", "head"].includes(attach) ? attach : "hand";
      p.hand = attach === "left" ? 0 : 1;
      p.heldOffset = p.from;
      if (["handgun", "revolver", "shotgun", "scifi-blaster", "scifi-rifle", "crossbow"].includes(p.kind)) p.alignment = "actor-forward";
    }
    return p;
  }
  function addLibraryProp(p) {
    const copy = clone(project), row = S.locate(copy, time), scene = copy.scenes[row.index];
    if (!S.validateLibraryProp(p)) throw Error("Invalid library prop");
    p = clone(p);
    p.id = p.id || "prop";
    while ((scene.props || []).some((x) => x.id === p.id)) p.id += "-copy";
    scene.props = [...scene.props || [], p];
    for (const owner of p.owners || []) {
      const a = scene.actors.find((x) => x.id === owner.actor);
      if (a && (!p.socket || p.socket === "hand")) a.presetOptions = { ...a.presetOptions, accessory: false };
    }
    S.validate(copy);
    project = copy;
    pkg.project = project;
    select(row.index);
    status("3D prop added. Inspect its grip, scale and visibility in the shot.");
  }
  $("addProp").onclick = () => {
    try {
      addLibraryProp(chosenProp());
    } catch (e) {
      status(e.message);
    }
  };
  $("saveProp").onclick = () => {
    try {
      const p = chosenProp();
      S.validateLibraryProp(p);
      delete p.owners;
      delete p.heldOffset;
      download(p.kind + ".jetprop3d.json", JSON.stringify({ format: "jetprop3d", version: 1, prop: p }, null, 2));
    } catch (e) {
      status(e.message);
    }
  };
  $("loadProp").onchange = async (e) => {
    try {
      const t = JSON.parse(await e.target.files[0].text());
      if (t.format !== "jetprop3d" || t.version !== 1) throw Error("Invalid prop template");
      addLibraryProp(t.prop);
    } catch (e2) {
      status(e2.message);
    }
  };
  $("worldName").innerHTML = S.environmentCatalog.map((e) => `<option value="${e.id}">${esc(e.category + " \xB7 " + e.label)}</option>`).join("");
  function applyEnvironment(t, useCamera = true) {
    if (t.format !== "jetenv3d" || t.version !== 1) throw Error("Invalid environment template");
    const copy = clone(project), row = S.locate(copy, time), s = copy.scenes[row.index], info = S.environmentCatalog.find((x) => x.id === t.set);
    if (!info) throw Error("Unknown environment");
    s.environment = "catalog";
    s.set = t.set;
    s.environmentOptions = clone(t.options || {});
    delete s.setSequence;
    delete s.backdrop;
    if (useCamera) {
      s.camera = clone(info.camera);
      s.target = clone(info.target);
      s.shots = [];
    }
    S.validate(copy);
    project = copy;
    pkg.project = project;
    select(row.index);
    status("3D environment applied. Actors and props retained; inspect their placement and the full shot.");
  }
  function chosenEnvironment() {
    return { format: "jetenv3d", version: 1, set: $("worldName").value, options: JSON.parse($("worldOptions").value || "{}") };
  }
  ;
  $("applyWorld").onclick = () => {
    try {
      applyEnvironment(chosenEnvironment(), $("worldFrame").checked);
    } catch (e) {
      status(e.message);
    }
  };
  $("saveWorld").onclick = () => {
    try {
      const t = chosenEnvironment();
      S.validateEnvironment({ environment: "catalog", set: t.set, environmentOptions: t.options });
      download(t.set + ".jetenv3d.json", JSON.stringify(t, null, 2));
    } catch (e) {
      status(e.message);
    }
  };
  $("loadWorld").onchange = async (e) => {
    try {
      applyEnvironment(JSON.parse(await e.target.files[0].text()), $("worldFrame").checked);
    } catch (e2) {
      status(e2.message);
    }
  };
  function castBrowse() {
    const list = S.searchCast($("castSearch").value, $("castGenre").value || "all"), old = $("castSelect").value;
    $("castSelect").innerHTML = list.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
    if (list.some((p) => p.id === old)) $("castSelect").value = old;
    $("castCards").innerHTML = list.map((p) => `<button type="button" data-cast="${p.id}" aria-pressed="${p.id === $("castSelect").value}"><img alt="${esc(p.name)}" src="${S.castThumbnails?.[p.id] || ""}"><br>${esc(p.name)}</button>`).join("");
    castDetails();
  }
  function castDetails() {
    const p = S.castCatalog.find((p2) => p2.id === $("castSelect").value);
    $("castDetails").textContent = p ? `${p.description} Tags: ${p.tags.join(", ")}` : "No matching characters";
  }
  function putCast(id, replace = false) {
    const copy = clone(project), row = S.locate(copy, time), s = copy.scenes[row.index];
    if (replace) {
      const ai = +$("castActor").value;
      if (!s.actors[ai]) throw Error("Select an actor");
      const a = s.actors[ai];
      s.actors[ai] = { ...a, kind: "blank-human", cast: id, design: S.castDesign(id) };
      if (a.action?.startsWith("skate-") || (a.beats || []).some((b) => b.action?.startsWith("skate-"))) throw Error("Choose an authored humanoid motion before changing a skating actor");
    } else {
      if (s.actors.length >= 16) throw Error("Actor limit reached");
      const a = S.createCastActor(id, { id: "cast-" + Date.now(), from: [s.actors.length * 1.6, 0, 0] });
      while (s.actors.some((x) => x.id === a.id)) a.id += "-copy";
      s.actors.push(a);
    }
    S.validate(copy);
    project = copy;
    pkg.project = project;
    select(row.index);
    status("Cast character applied. Review placement and full motion before export.");
  }
  $("castSearch").oninput = castBrowse;
  $("castGenre").onchange = castBrowse;
  $("castSelect").onchange = () => {
    castDetails();
    castBrowse();
  };
  $("castCards").onclick = (e) => {
    const card = e.target.closest?.("[data-cast]");
    if (card) {
      $("castSelect").value = card.dataset.cast;
      castBrowse();
    }
  };
  $("addCast").onclick = () => {
    try {
      putCast($("castSelect").value);
    } catch (e) {
      status(e.message);
    }
  };
  $("applyCast").onclick = () => {
    try {
      putCast($("castSelect").value, true);
    } catch (e) {
      status(e.message);
    }
  };
  $("diverseCast").onclick = () => {
    try {
      const copy = clone(project), row = S.locate(copy, time), s = copy.scenes[row.index], count = Math.min(4, 16 - s.actors.length);
      if (!count) throw Error("Actor limit reached");
      const actors = S.diverseCast(count, { genre: $("castGenre").value || "all", seed: s.actors.length, used: s.actors.map((x) => x.cast), existing: s.actors });
      actors.forEach((a, i) => {
        a.id = "background-" + Date.now() + "-" + i;
        a.from = [(i - (count - 1) / 2) * 2, 0, -2];
        while (s.actors.some((x) => x.id === a.id)) a.id += "-copy";
      });
      s.actors.push(...actors);
      S.validate(copy);
      project = copy;
      pkg.project = project;
      select(row.index);
      status("Diverse cast added. Inspect spacing and story suitability.");
    } catch (e) {
      status(e.message);
    }
  };
  castBrowse();
  function standardRefresh() {
    const old = $("standardAsset").value, list = S.standardAssetCatalog();
    $("standardAsset").innerHTML = list.map((a) => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join("");
    if (list.some((a) => a.id === old)) $("standardAsset").value = old;
    else if (list.some((a) => a.id === "actionforge-human")) $("standardAsset").value = "actionforge-human";
    standardClips();
    standardCastBrowse();
  }
  function standardClips() {
    const a = S.standardAssetCatalog().find((x) => x.id === $("standardAsset").value);
    $("standardClip").innerHTML = (a?.clips || []).map((c) => `<option value="${esc(c.name)}">${esc(c.name)} \xB7 ${c.duration.toFixed(2)}s</option>`).join("");
    $("standardDetails").textContent = a ? `${a.bones.length} bones \xB7 ${a.clips.length} genuine imported clips \xB7 ${a.missing.length ? "Mapping incomplete: " + a.missing.join(", ") : "Supported humanoid mapping"} \xB7 ${a.license}` : "Import a self-contained model to begin.";
  }
  function standardCastBrowse() {
    const old = $("standardCast").value, list = S.searchStandardCast("", $("standardGenre").value);
    $("standardCast").innerHTML = list.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
    if (list.some((c) => c.id === old)) $("standardCast").value = old;
    $("standardCards").innerHTML = list.map((c) => `<button type="button" data-standard-cast="${esc(c.id)}" aria-pressed="${c.id === $("standardCast").value}"><img alt="${esc(c.name)}" src="${S.standardCastThumbnails?.[c.id] || ""}"><br>${esc(c.name)}</button>`).join("");
  }
  function standardDesign(asset) {
    return asset === "actionforge-human" || asset.startsWith("quaternius-") ? { standardAsset: asset, standardAppearance: true, body: "average", outfit: "blank", hairStyle: "bald", hairVisible: false, skin: "#bc9070", top: "#9aa6b3", legs: "#56667d", shoes: "#334052" } : { standardAsset: asset, preserveMaterials: true };
  }
  function standardPutActor(actor) {
    const copy = clone(project), row = S.locate(copy, time), scene = copy.scenes[row.index];
    if (scene.actors.length >= 16) throw Error("Actor limit reached");
    while (scene.actors.some((a) => a.id === actor.id)) actor.id += "-copy";
    scene.actors.push(actor);
    S.validate(copy);
    project = copy;
    pkg.project = project;
    select(row.index);
    return actor;
  }
  $("standardCards").onclick = (e) => {
    const card = e.target.closest?.("[data-standard-cast]");
    if (card) {
      $("standardCast").value = card.dataset.standardCast;
      standardCastBrowse();
    }
  };
  $("standardCast").onchange = standardCastBrowse;
  $("standardAsset").onchange = standardClips;
  $("standardGenre").onchange = standardCastBrowse;
  $("standardFile").onchange = async (e) => {
    try {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 100 * 1024 * 1024) throw Error("Import limit is 100 MiB");
      if (!/\.(glb|gltf)$/i.test(f.name)) throw Error("Use GLB or self-contained glTF. FBX is not supported in this release.");
      status("Reading and validating genuine skeleton\u2026");
      const options = JSON.parse($("standardMapping").value || "{}"), units = +$("standardUnits").value;
      if (!Number.isFinite(units) || units <= 0 || units > 1e3) throw Error("Units must be positive");
      const axis = $("standardUp").value, rotation = axis === "Z" ? [-Math.PI / 2, 0, 0] : axis === "X" ? [0, 0, Math.PI / 2] : [0, 0, 0];
      const data = /\.gltf$/i.test(f.name) ? await f.text() : await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.replace(/^data:[^;]*;/, "data:model/gltf-binary;"));
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      const id = "import-" + Date.now(), manifest = { schema: "JetStandardAsset", version: 1, id, name: f.name, data, mapping: options.mapping || options.boneMap || {}, rotation: options.rotation || rotation, units: options.units || units, license: "User supplied; verify rights before reuse or sharing", source: f.name };
      await S.loadStandardAsset(id, manifest);
      pkg.assets["standard/" + id] = manifest;
      standardRefresh();
      $("standardAsset").value = id;
      standardClips();
      status("Imported actual skeleton and clips. Add it or select an actor to use it; save the project to preserve it.");
    } catch (err) {
      status("Import rejected: " + err.message);
    }
  };
  $("standardBlank").onclick = () => {
    try {
      const id = $("standardAsset").value;
      if (!id) throw Error("Choose or import an asset");
      standardPutActor({ id: "standard-" + Date.now(), kind: "standard-humanoid", from: [0, 0, 0], action: "idle", design: standardDesign(id) });
      status("Skinned blank added. Appearance and skeleton source remain editable.");
    } catch (e) {
      status(e.message);
    }
  };
  $("standardUse").onclick = () => {
    try {
      const id = $("standardAsset").value;
      changeActor((a) => {
        if (a.action?.startsWith("skate-") || (a.beats || []).some((b) => b.action?.startsWith("skate-"))) throw Error("Captured skating is fixed-rig; apply an authored motion first");
        a.kind = "standard-humanoid";
        delete a.cast;
        delete a.standardCast;
        a.design = { standardAsset: id, preserveMaterials: true };
        delete a.standardAnimation;
      });
      status("Actual imported skin applied; source materials and timeline retained.");
    } catch (e) {
      status(e.message);
    }
  };
  $("standardAnimate").onclick = () => {
    try {
      const asset = $("standardAsset").value, clip = $("standardClip").value, speed = +$("standardSpeed").value;
      if (!clip) throw Error("Choose an asset containing animation clips");
      if (!Number.isFinite(speed) || speed < 0.05 || speed > 5) throw Error("Speed must be .05\u20135");
      changeActor((a) => {
        if (a.kind !== "standard-humanoid") throw Error("Select an imported skinned actor");
        a.standardAnimation = { asset, clip, speed, loop: $("standardLoop").checked, rootMotion: $("standardRootMotion").checked };
      });
      status("Imported quaternion clip applied. Review retargeted contacts and root travel.");
    } catch (e) {
      status(e.message);
    }
  };
  $("standardClearAnimation").onclick = () => {
    try {
      changeActor((a) => {
        delete a.standardAnimation;
        delete a.presetOptions?.clip;
      });
      status("Imported clip removed; authored timeline actions are active.");
    } catch (e) {
      status(e.message);
    }
  };
  $("standardAddCast").onclick = () => {
    try {
      standardPutActor(S.createStandardCastActor($("standardCast").value, { id: "skinned-cast-" + Date.now() }));
      status("Reusable genuine skinned character added.");
    } catch (e) {
      status(e.message);
    }
  };
  $("standardApplyCast").onclick = () => {
    try {
      changeActor((a) => {
        if (a.kind !== "standard-humanoid") throw Error("Select an imported skinned actor first");
        const p = S.createStandardCastActor($("standardCast").value);
        delete a.cast;
        a.standardCast = p.standardCast;
        a.design = p.design;
      });
      status("Skinned body, wardrobe and hair recipe applied.");
    } catch (e) {
      status(e.message);
    }
  };
  $("standardDiverse").onclick = () => {
    try {
      const copy = clone(project), row = S.locate(copy, time), scene = copy.scenes[row.index], count = Math.min(4, 16 - scene.actors.length);
      if (!count) throw Error("Actor limit reached");
      const actors = S.selectStandardCast(count, { genre: $("standardGenre").value, seed: scene.actors.length, existing: scene.actors, used: scene.actors.map((a) => a.standardCast).filter(Boolean) });
      actors.forEach((a, i) => {
        a.id = "standard-bg-" + Date.now() + "-" + i;
        a.from = [(i - (count - 1) / 2) * 2, 0, -2];
      });
      scene.actors.push(...actors);
      S.validate(copy);
      project = copy;
      pkg.project = project;
      select(row.index);
      status("Four varied skinned characters added without changing existing actors.");
    } catch (e) {
      status(e.message);
    }
  };
  for (const [id, key] of [["standardBody", "bodies"], ["standardHair", "hairStyles"], ["standardOutfit", "outfits"], ["standardAccessory", "accessories"]]) $(id).innerHTML = S.standardAppearanceOptions[key].map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
  $("standardAppearance").onclick = () => {
    try {
      changeActor((a) => {
        if (a.kind !== "standard-humanoid") throw Error("Select a skinned actor first");
        a.design = { ...a.design, standardAppearance: true, preserveMaterials: false, body: $("standardBody").value, hairStyle: $("standardHair").value, outfit: $("standardOutfit").value, accessory: $("standardAccessory").value, hairVisible: true };
      });
      status("Custom skinned body and wardrobe applied. Review contacts after proportion changes.");
    } catch (e) {
      status(e.message);
    }
  };
  $("standardSaveCast").onclick = () => {
    try {
      const a = project.scenes[S.locate(project, time).index].actors[+$("presetActor").value];
      if (a?.kind !== "standard-humanoid") throw Error("Select a skinned actor");
      const t = JSON.parse(S.serializeStandardCast(a)), asset = pkg.assets["standard/" + a.design.standardAsset];
      if (asset) t.assets = { ["standard/" + a.design.standardAsset]: clone(asset) };
      download((a.standardCast || a.id) + ".jetstandardcast.json", JSON.stringify(t));
      status("Character template saved with its embedded source asset when available.");
    } catch (e) {
      status(e.message);
    }
  };
  $("standardLoadCast").onchange = async (e) => {
    try {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 150 * 1024 * 1024) throw Error("Character template limit is 150MiB");
      const t = JSON.parse(await f.text());
      for (const [k, v] of Object.entries(t.assets || {})) {
        if (v?.schema !== "JetStandardAsset") throw Error("Invalid character asset");
        await S.loadStandardAsset(v.id || k.replace(/^standard\//, ""), v);
        pkg.assets[k] = v;
      }
      const a = S.parseStandardCast(t, { id: "character-" + Date.now() });
      standardPutActor(a);
      standardRefresh();
      status("Reusable skinned character template loaded.");
    } catch (e2) {
      status(e2.message);
    }
  };
  standardRefresh();
  $("addBlank").onclick = () => {
    try {
      const copy = clone(project), row = S.locate(copy, time), scene = copy.scenes[row.index];
      if (scene.actors.length >= 16) throw Error("Actor limit reached");
      let id = "blank-" + Date.now();
      while (scene.actors.some((a) => a.id === id)) id += "-copy";
      scene.actors.push({ id, kind: "blank-human", action: "idle", from: [0, 0, 0] });
      S.validate(copy);
      project = copy;
      pkg.project = project;
      select(row.index);
      status("Blank character added.");
    } catch (e) {
      status(e.message);
    }
  };
  $("castActor").onchange = () => {
    $("presetActor").value = $("castActor").value;
    presetEditor();
  };
  window.StudioApp = { pause: () => {
    playing = false;
    stopAudio();
  }, getFrame: () => ({ sceneIndex: S.locate(project, time).index, time: time - S.locate(project, time).start }), effectiveSettings, syncRenderSettings, fastBudget, standardPutActor, standardRefresh, putCast, applyEnvironment, addLibraryProp, applyMotion, addEffect, getProject: () => clone(project), getPackage: () => clone({ ...pkg, project }), select, render: draw, setTime(t) {
    playing = false;
    stopAudio();
    time = Math.max(0, Math.min(total() - 1e-3, t));
    index = -1;
    draw();
    editor();
  } };
  status("Ready. " + renderer.mode + " preview; embedded audio plays offline; Kokoro generation needs explicit local setup. Export a project to save edits.");
})();
