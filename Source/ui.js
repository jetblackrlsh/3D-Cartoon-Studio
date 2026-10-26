// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
(async function () {
  "use strict";
  const $ = (id) => document.getElementById(id),
    S = CartoonStudio,
    clone = (x) => JSON.parse(JSON.stringify(x));
  let pkg = clone(BUNDLED),
    project = pkg.project,
    renderer,
    st,
    index = -1,
    time = 0,
    playing = false,
    last = 0,
    voice = null,
    effect = null,
    music = null,
    musicKey = "",
    voiceIndex = -1,
    audioURLs = new Map();
  const esc = (t) =>
    String(t).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
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
    let u = URL.createObjectURL(
        new Blob([data], { type: type || "application/json" }),
      ),
      a = document.createElement("a");
    a.href = u;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 2000);
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
    let row = S.locate(project, time),
      s = project.scenes[row.index];
    $("sceneList").innerHTML = project.scenes
      .map(
        (s, i) =>
          `<option value="${i}" ${i === row.index ? "selected" : ""}>${i + 1}. ${esc(s.title)}</option>`,
      )
      .join("");
    $("title").value = s.title;
    $("caption").value = s.caption;
    $("duration").value = s.duration.toFixed(2);
    $("environment").value = s.environment;
    $("environmentSet").replaceChildren(...S.environmentCatalog.map(e=>{const o=document.createElement("option");o.value=e.id;o.textContent=e.label||e.id;return o}));$("environmentSet").value=s.set||S.environmentCatalog[0].id;
    $("voicePreset").value = s.voice || "narrator";
    $("musicTrack").value = s.music || "";
    $("camera").value = JSON.stringify(s.camera || [5, 3.7, 9]);
    $("actors").value = JSON.stringify(s.actors, null, 2);
    $("castActor").innerHTML=s.actors.map((a,i)=>`<option value="${i}">${esc(a.id||a.kind)} (${esc(a.cast||a.kind)})</option>`).join("");
    $("shots").value = JSON.stringify(s.shots || [], null, 2);
    $("props").value = JSON.stringify(s.props || [], null, 2);
    $("effects").value = JSON.stringify(s.effects || [], null, 2);
    $("exportStart").max = project.scenes.length - 1;
    $("exportEnd").max = project.scenes.length - 1;
    $("seek").max = total();
  }
  function draw() {
    let row = S.locate(project, time),
      local = time - row.start;
    if (row.index !== index) {
      index = row.index;
      st = S.stage(project.scenes[index]);
    }
    renderer.render(S.update(st, local), local);
    $("seek").value = time;
    $("clock").textContent =
      time.toFixed(1) +
      " / " +
      total().toFixed(1) +
      " seconds · scene " +
      (index + 1) +
      " · " +
      renderer.mode;
  }
  function audio(row) {
    let local = time - row.start,
      s = project.scenes[row.index];
    if (voiceIndex !== row.index) {
      if (voice) voice.pause();
      voiceIndex = row.index;
      if (effect) effect.pause();
      if (pkg.assets["sfx/" + s.id]) {
        effect = new Audio(url("sfx/" + s.id));
        effect.volume = 0.24;
        effect.currentTime = local;
        effect.play().catch(() => {});
      }
      if (pkg.assets[s.audio]) {
        voice = new Audio(url(s.audio));
        voice.volume = +$("voiceVolume").value;
        voice.currentTime = Math.min(
          local,
          Math.max(0, (s.voiceDuration || s.duration) - 0.05),
        );
        voice
          .play()
          .catch((e) => status("Press Play to allow sound: " + e.message));
      } else voice = null;
    }
    if (s.music !== musicKey) {
      if (music) music.pause();
      musicKey = s.music;
      if (pkg.assets["music/" + s.music]) {
        music = new Audio(url("music/" + s.music));
        music.loop = true;
        music.volume = +$("musicVolume").value;
        music.play().catch(() => {});
      } else music = null;
    }
    if (voice) voice.volume = +$("voiceVolume").value;
    if (music)
      music.volume =
        +$("musicVolume").value * (voice && !voice.paused ? 0.55 : 1);
  }
  function tick(t) {
    if (playing) {
      time += Math.min(0.15, (t - last) / 1000);
      if (time >= total()) {
        time = total() - 0.001;
        playing = false;
        stopAudio();
      }
      draw();
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
  $("apply").onclick = () => {
    try {
      let candidate = clone(project),
        s = candidate.scenes[index],
        old = s.caption;
      s.title = $("title").value;
      s.caption = $("caption").value;
      s.duration = +$("duration").value;
      s.environment = $("environment").value;
      if(s.environment==="catalog")s.set=$("environmentSet").value;
      s.voice = $("voicePreset").value;
      s.music = $("musicTrack").value;
      s.camera = JSON.parse($("camera").value);
      s.actors = JSON.parse($("actors").value);
      s.shots = JSON.parse($("shots").value);
      s.props = JSON.parse($("props").value);
      s.effects = JSON.parse($("effects").value);
      if (old !== s.caption) {
        delete s.captions;
        delete s.audio;
      }
      S.validate(candidate);
      project = candidate;
      pkg.project = project;
      let i = index;
      select(i);
      status("Scene updated. Regenerate speech if you changed its text.");
    } catch (e) {
      status(e.message);
    }
  };
  $("generateVoice").onclick = async () => {
    try {
      $("apply").click();
      status("Synthesizing bundled offline voice…");
      await new Promise((r) => setTimeout(r, 30));
      let s = project.scenes[index],
        bytes = StudioVoice.generate(s.caption, s.voice);
      let blob = new Blob([bytes], { type: "audio/wav" }),
        reader = new FileReader();
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
  $("voiceSample").onclick = () => {
    let b = StudioVoice.generate(
      "Welcome to the cartoon studio. Every world begins with an idea.",
      $("voicePreset").value,
    );
    new Audio(URL.createObjectURL(new Blob([b], { type: "audio/wav" })))
      .play()
      .catch((e) => status(e.message));
  };
  $("save").onclick = () =>
    download(
      "Jet-Cartoon-Project.json",
      JSON.stringify({ ...pkg, project }, null, 2),
    );
  $("load").onchange = async () => {
    try {
      let f = $("load").files[0];
      if (!f) return;
      if (f.size > 200000000) throw Error("Project exceeds 200 MB.");
      let data = JSON.parse(await f.text());
      S.validate(data.project);
      if (!data.assets || typeof data.assets !== "object")
        throw Error("Missing assets.");
      for (let value of Object.values(data.assets))
        if (typeof value !== "string" || !value.startsWith("data:"))
          throw Error("Project assets must be embedded data URLs.");
      stopAudio();
      playing = false;
      await S.init(data.assets);
      pkg = data;
      project = data.project;
      time = 0;
      index = -1;
      draw();
      editor();
      status("Project loaded.");
    } catch (e) {
      status(e.message);
    }
  };
  $("duplicate").onclick = () => {
    project.scenes.splice(index + 1, 0, {
      ...clone(project.scenes[index]),
      id: "scene-" + Date.now(),
    });
    select(index + 1);
  };
  $("delete").onclick = () => {
    if (project.scenes.length < 2) return;
    if (
      confirm(
        "Remove this scene from the current project? Export a backup first if needed.",
      )
    ) {
      project.scenes.splice(index, 1);
      select(Math.min(index, project.scenes.length - 1));
    }
  };
  $("newProject").onclick = () => {
    if (!confirm("Start a new project? Export this one first to keep edits."))
      return;
    stopAudio();
    project = {
      schema: "JetCartoonProject",
      version: 1,
      title: "New cartoon",
      scenes: [
        {
          id: "scene-1",
          title: "Opening",
          label: "Opening",
          caption: "A new story begins.",
          duration: 6,
          environment: "street",
          actors: [
            S.createCastActor('everyday-neighbor-f',{id:'actor-1',action:'walk',from:[-2,0,0],to:[2,0,0]}),
          ],
          camera: [5, 3, 8],
          target: [0, 1.2, 0],
          music: "Tranquility",
          voice: "narrator",
        },
      ],
    };
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
    if (f.size > 30000000) {
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
    if (!window.MediaRecorder || !$("preview").captureStream) {
      status(
        "This browser does not support recording. Use the included headless renderer.",
      );
      return;
    }
    playing = false;
    stopAudio();
    let first = clampInt($("exportStart").value, 0, project.scenes.length - 1),
      end = clampInt($("exportEnd").value, first, project.scenes.length - 1),
      rows = S.timeline(project),
      start = rows[first].start,
      finish = rows[end].end;
    let stream = $("preview").captureStream(24),
      ctx = new AudioContext(),
      dest = ctx.createMediaStreamDestination(),
      buffers = [];
    status("Preparing offline audio for export…");
    try {
      for (let i = first; i <= end; i++) {
        let s = project.scenes[i];
        if (pkg.assets[s.audio]) {
          let raw = Uint8Array.from(
            atob(pkg.assets[s.audio].split(",")[1]),
            (c) => c.charCodeAt(0),
          );
          let buffer = await ctx.decodeAudioData(raw.buffer);
          buffers.push({ buffer, at: rows[i].start - start, gain: 0.9 });
        }
        if (pkg.assets["sfx/" + s.id]) {
          let raw = Uint8Array.from(
              atob(pkg.assets["sfx/" + s.id].split(",")[1]),
              (c) => c.charCodeAt(0),
            ),
            buffer = await ctx.decodeAudioData(raw.buffer);
          buffers.push({ buffer, at: rows[i].start - start, gain: 0.24 });
        }
        if (pkg.assets["music/" + s.music]) {
          let raw = Uint8Array.from(
              atob(pkg.assets["music/" + s.music].split(",")[1]),
              (c) => c.charCodeAt(0),
            ),
            buffer = await ctx.decodeAudioData(raw.buffer);
          buffers.push({
            buffer,
            at: rows[i].start - start,
            gain: 0.07,
            duration: s.duration,
            loop: true,
          });
        }
      }
      let audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);
      let mime = MediaRecorder.isTypeSupported("video/mp4")
          ? "video/mp4"
          : "video/webm",
        rec = new MediaRecorder(stream, { mimeType: mime }),
        chunks = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        download(
          "Cartoon." + (mime.includes("mp4") ? "mp4" : "webm"),
          new Blob(chunks, { type: mime }),
          mime,
        );
        ctx.close();
        stream.getTracks().forEach((t) => t.stop());
        status("Movie exported.");
      };
      let epoch = ctx.currentTime + 0.15;
      for (let item of buffers) {
        let node = ctx.createBufferSource(),
          gain = ctx.createGain();
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
      let base = performance.now();
      function frame(now) {
        time = Math.min(finish - 0.001, start + (now - base) / 1000);
        draw();
        status(
          "Recording " +
            (time - start).toFixed(1) +
            " / " +
            (finish - start).toFixed(1) +
            "s. Keep this tab visible.",
        );
        if (now - base < (finish - start) * 1000) requestAnimationFrame(frame);
        else rec.stop();
      }
      requestAnimationFrame(frame);
    } catch (e) {
      status(e.message);
      ctx.close();
    }
  };
  function clampInt(x, a, b) {
    return Math.max(a, Math.min(b, Math.floor(+x) || 0));
  }
function castBrowse(){const list=S.searchCast($('castSearch').value,$('castGenre').value||'all'),old=$('castSelect').value;$('castSelect').innerHTML=list.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');if(list.some(p=>p.id===old))$('castSelect').value=old;
$('castCards').innerHTML=list.map(p=>`<button type="button" data-cast="${p.id}" aria-pressed="${p.id===$('castSelect').value}"><img alt="${esc(p.name)}" src="${S.castThumbnails?.[p.id]||''}"><br>${esc(p.name)}</button>`).join('');castDetails();}
function castDetails(){const p=S.castCatalog.find(p=>p.id===$('castSelect').value);$('castDetails').textContent=p?`${p.description} Tags: ${p.tags.join(', ')}`:'No matching characters';}
function putCast(id,replace=false){const copy=clone(project),row=S.locate(copy,time),s=copy.scenes[row.index];if(replace){const ai=+$('castActor').value;if(!s.actors[ai])throw Error('Select an actor');const a=s.actors[ai];s.actors[ai]={...a,kind:'blank-human',cast:id,design:S.castDesign(id)};if(a.action?.startsWith('skate-')||(a.beats||[]).some(b=>b.action?.startsWith('skate-')))throw Error('Choose an authored humanoid motion before changing a skating actor');}else{if(s.actors.length>=16)throw Error('Actor limit reached');const a=S.createCastActor(id,{id:'cast-'+Date.now(),from:[s.actors.length*1.6,0,0]});while(s.actors.some(x=>x.id===a.id))a.id+='-copy';s.actors.push(a);}S.validate(copy);project=copy;pkg.project=project;select(row.index);status('Cast character applied. Review placement and full motion before export.');}
$('castSearch').oninput=castBrowse;$('castGenre').onchange=castBrowse;$('castSelect').onchange=()=>{castDetails();castBrowse();};
$('castCards').onclick=e=>{const card=e.target.closest?.('[data-cast]');if(card){$('castSelect').value=card.dataset.cast;castBrowse();}};
$('addCast').onclick=()=>{try{putCast($('castSelect').value)}catch(e){status(e.message)}};
$('applyCast').onclick=()=>{try{putCast($('castSelect').value,true)}catch(e){status(e.message)}};
$('diverseCast').onclick=()=>{try{const copy=clone(project),row=S.locate(copy,time),s=copy.scenes[row.index],count=Math.min(4,16-s.actors.length);if(!count)throw Error('Actor limit reached');const actors=S.diverseCast(count,{genre:$('castGenre').value||'all',seed:s.actors.length,used:s.actors.map(x=>x.cast),existing:s.actors});actors.forEach((a,i)=>{a.id='background-'+Date.now()+'-'+i;a.from=[(i-(count-1)/2)*2,0,-2];while(s.actors.some(x=>x.id===a.id))a.id+='-copy';});s.actors.push(...actors);S.validate(copy);project=copy;pkg.project=project;select(row.index);status('Diverse cast added. Inspect spacing and story suitability.');}catch(e){status(e.message)}};
castBrowse();

$('addBlank').onclick=()=>{try{const copy=clone(project),row=S.locate(copy,time),scene=copy.scenes[row.index];if(scene.actors.length>=16)throw Error('Actor limit reached');let id='blank-'+Date.now();while(scene.actors.some(a=>a.id===id))id+='-copy';scene.actors.push({id,kind:'blank-human',action:'idle',from:[0,0,0]});S.validate(copy);project=copy;pkg.project=project;select(row.index);status('Blank character added.');}catch(e){status(e.message)}};

  window.StudioApp = {
    putCast,
    pause: () => {
      playing = false;
      stopAudio();
    },
    getFrame: () => ({
      sceneIndex: S.locate(project, time).index,
      time: time - S.locate(project, time).start,
    }),
    getProject: () => clone(project),
    getPackage: () => clone({ ...pkg, project }),
    select,
    render: draw,
    setTime(t) {
      playing = false;
      stopAudio();
      time = Math.max(0, Math.min(total() - 0.001, t));
      index = -1;
      draw();
      editor();
    },
  };
  status(
    "Ready. " +
      renderer.mode +
      " preview; all assets and voices are bundled. Export a project to save edits.",
  );
})();
