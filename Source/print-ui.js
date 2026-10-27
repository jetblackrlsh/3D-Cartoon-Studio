// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id),
    P = StudioPrint,
    copy = (x) => JSON.parse(JSON.stringify(x));
  let comic = null,
    pageIndex = 0,
    rendering = false, videoSource = null;
  const status = (t) => ($("printStatus").textContent = t);
  function download(name, data, mime = "application/json") {
    let u = URL.createObjectURL(new Blob([data], { type: mime })),
      a = document.createElement("a");
    a.href = u;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 5000);
  }
  async function png(c, name) {
    download(
      name,
      await new Promise((resolve, reject) =>
        c.toBlob(
          (b) => (b ? resolve(b) : reject(Error("PNG export failed."))),
          "image/png",
        ),
      ),
      "image/png",
    );
  }
  function ready() {
    if (!window.StudioApp)
      throw Error("Wait for the studio to finish loading.");
    return StudioApp;
  }
  function snapshot() {
    let app = ready(),
      pkg = app.getPackage(),
      f = app.getFrame();
    return {
      pkg,
      panel: {
        sceneIndex: f.sceneIndex,
        time: f.time,
        sceneOverride: copy(pkg.project.scenes[f.sceneIndex]),
        caption: "",
      },
    };
  }
  function sync() {
    if (!comic) return;
    $("comicTitle").value = comic.title;
    $("comicMode").value = comic.mode || "mixed";
    $("comicImage").replaceChildren(...Object.keys(comic.images || {}).map(id => { const o=document.createElement("option"); o.value=id; o.textContent=id + " — " + (comic.images[id].provenance?.timeSeconds ?? "image") + "s"; return o; }));
    $("comicPanel").replaceChildren(...comic.pages[pageIndex].panels.map((p,i) => {const o=document.createElement("option");o.value=i;o.textContent="Panel "+(i+1)+(p.imageId ? " (image)" : " (scene)");return o;}));
    $("comicPages").innerHTML = comic.pages
      .map((p, i) => `<option value="${i}">${i + 1}: ${p.layout}</option>`)
      .join("");
    $("comicPages").value = pageIndex;
    $("comicLayout").value = comic.pages[pageIndex].layout;
    $("comicJSON").value = JSON.stringify(comic.pages[pageIndex], null, 2);
  }
  async function preview() {
    if (!comic) return;
    if (rendering) throw Error("An export is still running.");
    rendering = true;
    try {
      let c = await P.page(comic, pageIndex, { width: 850, height: 1100 }),
        p = $("comicPreview");
      p.width = c.width;
      p.height = c.height;
      p.getContext("2d").drawImage(c, 0, 0);
      status(
        "Page " +
          (pageIndex + 1) +
          " rendered. Save the comic project to keep edits.",
      );
    } finally {
      rendering = false;
    }
  }
  function action(id, fn) {
    $(id).onclick = async () => {
      try {
        window.StudioApp?.pause();
        status("Working…");
        await new Promise((r) => setTimeout(r, 20));
        await fn();
      } catch (e) {
        status(e.message);
        console.error(e);
      }
    };
  }
  action("stillCapture", async () => {
    let { pkg, panel } = snapshot();
    $("stillSceneJSON").value = JSON.stringify(panel.sceneOverride, null, 2);
    $("stillTime").value = panel.time;
    status(
      "Copied the current scene into the independent still editor. Edits here leave the movie unchanged.",
    );
  });
  async function renderFresh() {
    let { pkg, panel } = snapshot(),
      raw = $("stillSceneJSON").value.trim();
    return P.still(pkg, {
      ...panel,
      sceneOverride: raw ? JSON.parse(raw) : panel.sceneOverride,
      time: +$("stillTime").value,
      width: +$("stillWidth").value,
      height: +$("stillHeight").value,
      captions: $("stillCaptions").checked,
      light: { ambient: +$("stillAmbient").value, sun: +$("stillSun").value },
    });
  }
  action("stillPreview", async () => {
    let c = await renderFresh(),
      p = $("stillPreviewCanvas");
    p.width = c.width;
    p.height = c.height;
    p.getContext("2d").drawImage(c, 0, 0);
    status(
      "Fresh still rendered. Camera, actors, props and shots come from the editable scene JSON.",
    );
  });
  action("stillSave", async () => {
    await png(await renderFresh(), "Cartoon-Still.png");
    status("PNG downloaded.");
  });
  action("comicNew", async () => {
    let { pkg, panel } = snapshot();
    comic = P.createComic(pkg);
    comic.mode = $("comicMode").value;
    comic.pages[0].panels = comic.mode === "animation" ? [] : [panel];
    pageIndex = 0;
    sync();
    await preview();
  });
  action("comicAddPage", async () => {
    if (!comic) throw Error("Create or load a comic first.");
    comic.pages.push({ layout: $("comicLayout").value, title: "", panels: [] });
    pageIndex = comic.pages.length - 1;
    sync();
    await preview();
  });
  action("comicAddPanel", async () => {
    if (!comic) throw Error("Create or load a comic first.");
    let p = comic.pages[pageIndex];
    if (p.panels.length >= P.layouts[p.layout].length)
      throw Error(
        "This page is full. Choose a larger layout or add another page.",
      );
    if (comic.mode === "animation") throw Error("Choose Mixed or newly rendered mode to add scenes.");
    let { pkg, panel } = snapshot();
    comic.source.assets = { ...comic.source.assets, ...pkg.assets };
    panel.sceneIndex = 0;
    p.panels.push(panel);
    sync();
    await preview();
  });
  action("comicApply", async () => {
    if (!comic) throw Error("Create or load a comic first.");
    let next = copy(comic);
    next.title = $("comicTitle").value;
    next.pages[pageIndex] = JSON.parse($("comicJSON").value);
    P.validateComic(next);
    comic = next;
    sync();
    await preview();
  });
  $("comicLayout").onchange = () => {
    if (!comic) return;
    let p = comic.pages[pageIndex],
      key = $("comicLayout").value;
    if (p.panels.length > P.layouts[key].length) {
      status(
        "Remove excess panels in page JSON before choosing this smaller layout.",
      );
      $("comicLayout").value = p.layout;
      return;
    }
    p.layout = key;
    sync();
    preview().catch((e) => status(e.message));
  };
  $("comicPages").onchange = () => {
    pageIndex = +$("comicPages").value;
    sync();
    preview().catch((e) => status(e.message));
  };
  action("comicDuplicate", async () => {
    if (!comic) throw Error("Create or load a comic first.");
    comic.pages.splice(pageIndex + 1, 0, copy(comic.pages[pageIndex]));
    pageIndex++;
    sync();
    await preview();
  });
  action("comicDelete", async () => {
    if (!comic || comic.pages.length === 1)
      throw Error("Keep at least one page.");
    if (
      !confirm(
        "Remove this page from the working comic? Save a backup if needed.",
      )
    )
      return;
    comic.pages.splice(pageIndex, 1);
    pageIndex = Math.min(pageIndex, comic.pages.length - 1);
    sync();
    await preview();
  });
  for (const [id, delta] of [
    ["comicEarlier", -1],
    ["comicLater", 1],
  ])
    action(id, async () => {
      if (!comic) throw Error("Create a comic first.");
      let j = pageIndex + delta;
      if (j < 0 || j >= comic.pages.length) return;
      [comic.pages[j], comic.pages[pageIndex]] = [
        comic.pages[pageIndex],
        comic.pages[j],
      ];
      pageIndex = j;
      sync();
      await preview();
    });
  action("comicSave", async () => {
    if (!comic) throw Error("Create or load a comic first.");
    comic.title = $("comicTitle").value;
    P.validateComic(comic);
    download("Cartoon-Comic.jetcomic.json", JSON.stringify(comic));
    status("Editable comic saved with source scenes and embedded assets.");
  });
  $("comicLoad").onchange = async () => {
    try {
      let f = $("comicLoad").files[0];
      if (!f) return;
      if (f.size > 220000000) throw Error("Comic project exceeds 220 MB.");
      let c = JSON.parse(await f.text());
      P.validateComic(c);
      for (const v of Object.values(c.source?.assets || {}))
        if (typeof v !== "string" || !v.startsWith("data:"))
          throw Error("Comic assets must be embedded data URLs.");
      comic = c;
      pageIndex = 0;
      sync();
      await preview();
    } catch (e) {
      status(e.message);
    }
  };
  action("comicPNG", async () => {
    if (!comic) throw Error("Create or load a comic first.");
    await png(
      await P.page(comic, pageIndex),
      "Comic-Page-" + String(pageIndex + 1).padStart(3, "0") + ".png",
    );
    status("Current page PNG downloaded.");
  });
  action("comicPDF", async () => {
    if (!comic) throw Error("Create or load a comic first.");
    if (rendering) throw Error("Wait for the current render.");
    rendering = true;
    try {
      download(
        "Cartoon-Comic.pdf",
        await P.pdf(comic, {
          onProgress: (i, n) => status("Rendering PDF page " + i + " of " + n),
        }),
        "application/pdf",
      );
      status("Full comic PDF downloaded.");
    } finally {
      rendering = false;
    }
  });
  $("comicMode").onchange = () => {
    if (!comic) return;
    const next = copy(comic); next.mode = $("comicMode").value;
    try { P.validateComic(next); comic = next; status("Source mode changed. Existing panels preserved."); }
    catch(e) { $("comicMode").value = comic.mode || "mixed"; status(e.message); }
  };
  let videoURL, videoRequest = 0;
  $("comicVideoFile").onchange = async () => {
    try {
      const request = ++videoRequest, f = $("comicVideoFile").files[0]; if (!f) return;
      videoSource = null;
      if (f.size > 500000000) throw Error("Browser frame picker accepts videos up to 500 MB. Use headless extraction for larger movies.");
      if (!crypto.subtle) throw Error("SHA-256 unavailable here. Use localhost/secure context or headless extraction.");
      const digest = await crypto.subtle.digest("SHA-256", await f.arrayBuffer());
      if (request !== videoRequest) return;
      const sourceSha256 = Array.from(new Uint8Array(digest), b=>b.toString(16).padStart(2,"0")).join("");
      if (videoURL) URL.revokeObjectURL(videoURL);
      videoURL = URL.createObjectURL(f); $("comicVideo").src = videoURL;
      videoSource = {kind:"animation-frame",sourceName:f.name,sourceSha256,sourceBytes:f.size};
      status("Animation loaded locally. Select a time and capture a frame.");
    } catch(e) {status(e.message);}
  };
  action("comicSeek", async () => {
    const v=$("comicVideo"), t=+$("comicFrameTime").value;
    if (!videoSource || !Number.isFinite(v.duration)) throw Error("Load a decodable animation first.");
    if (!Number.isFinite(t) || t<0 || t>=v.duration) throw Error("Time must be within the animation (before its end).");
    v.pause();
    if (Math.abs(v.currentTime-t) > 0.00001) await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{clean();reject(Error("Video seek timed out."));},15000);
      const clean=()=>{clearTimeout(timer);v.removeEventListener("seeked",done);v.removeEventListener("error",fail);};
      const done=()=>{clean();resolve();},fail=()=>{clean();reject(Error("Video seek failed."));};
      v.addEventListener("seeked",done);v.addEventListener("error",fail);v.currentTime=t;
    });
    status("Seeked to "+v.currentTime.toFixed(3)+" seconds. Capture to embed this frame.");
  });
  $("comicVideo").ontimeupdate = () => {$("comicFrameTime").value=$("comicVideo").currentTime.toFixed(3);};
  action("comicCaptureFrame", async () => {
    if (!comic) throw Error("Create a comic first; choose Animation or Mixed mode.");
    const v=$("comicVideo"); v.pause();
    if (!videoSource || v.readyState<2 || !v.videoWidth || v.seeking) throw Error("Load and seek a decodable animation before capturing.");
    if (v.videoWidth>4096 || v.videoHeight>4096 || v.videoWidth*v.videoHeight>8388608) throw Error("Video exceeds 8 megapixels / 4096 pixels; use headless extraction with scaling.");
    const c=document.createElement("canvas");c.width=v.videoWidth;c.height=v.videoHeight;c.getContext("2d").drawImage(v,0,0);
    const id="frame-"+Date.now()+"-"+Object.keys(comic.images || {}).length;
    comic.images ||= {};comic.images[id]={dataUrl:c.toDataURL("image/png"),provenance:{...videoSource,timeSeconds:v.currentTime,sourceDurationSeconds:v.duration,width:c.width,height:c.height,method:"browser-video-seek"}};
    sync();$("comicImage").value=id;status("Frame embedded and reusable. Add it as a panel or replace a selected panel; save to keep it.");
  });
  async function useImage(replace) {
    if (!comic) throw Error("Create a comic first.");
    if (comic.mode === "render") throw Error("Choose Animation or Mixed mode for image panels.");
    const id=$("comicImage").value;if(!comic.images?.[id]) throw Error("Capture or load an image asset first.");
    const p=comic.pages[pageIndex], i=+$("comicPanel").value;
    if (replace) {if(!p.panels[i]) throw Error("Choose an existing panel."); const old=p.panels[i];p.panels[i]={imageId:id,fit:"contain",caption:old.caption||"",balloons:old.balloons||[]};}
    else {if(p.panels.length>=P.layouts[p.layout].length) throw Error("Page full; choose a larger layout or add a page.");p.panels.push({imageId:id,fit:"contain",caption:""});}
    sync();await preview();
  }
  action("comicAddImage",()=>useImage(false));
  action("comicReplaceImage",()=>useImage(true));
  action("comicReplaceScene",async()=>{
    if(!comic || comic.mode === "animation") throw Error("Choose Mixed or Render mode to replace with a scene.");
    const p=comic.pages[pageIndex],i=+$("comicPanel").value;if(!p.panels[i]) throw Error("Choose an existing panel.");
    const {pkg,panel}=snapshot();comic.source ||= copy(pkg);comic.source.assets={...comic.source.assets,...pkg.assets};
    const old=p.panels[i];panel.sceneIndex=0;p.panels[i]={...panel,caption:old.caption||"",balloons:old.balloons||[]};sync();await preview();
  });
  window.StudioComicApp = {
    getComic: () => (comic ? copy(comic) : null),
    load(c) {
      P.validateComic(c);
      comic = copy(c);
      pageIndex = 0;
      sync();
      return preview();
    },
    preview,
  };
})();
