// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id),
    P = StudioPrint,
    copy = (x) => JSON.parse(JSON.stringify(x));
  let comic = null,
    pageIndex = 0,
    rendering = false;
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
    comic.pages[0].panels = [panel];
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
      for (const v of Object.values(c.source.assets))
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
