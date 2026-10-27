// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
/* Shared deterministic stills / comics engine. No network or storage side effects. */
(function (root) {
  "use strict";
  const copy = (x) => JSON.parse(JSON.stringify(x)),
    S = root.CartoonStudio;
  const layouts = {
    cover: [[0, 0, 1, 1]],
    one: [[0, 0, 1, 1]],
    two: [
      [0, 0, 1, 0.5],
      [0, 0.5, 1, 0.5],
    ],
    four: [
      [0, 0, 0.5, 0.5],
      [0.5, 0, 0.5, 0.5],
      [0, 0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5, 0.5],
    ],
    six: Array.from({ length: 6 }, (_, i) => [
      (i % 2) / 2,
      Math.floor(i / 2) / 3,
      0.5,
      1 / 3,
    ]),
    nine: Array.from({ length: 9 }, (_, i) => [
      (i % 3) / 3,
      Math.floor(i / 3) / 3,
      1 / 3,
      1 / 3,
    ]),
    "whos-who": Array.from({ length: 4 }, (_, i) => [
      (i % 2) / 2,
      Math.floor(i / 2) / 2,
      0.5,
      0.5,
    ]),
    credits: [[0, 0, 1, 1]],
  };
  function canvas(w, h) {
    if (
      !Number.isInteger(w) ||
      !Number.isInteger(h) ||
      w < 64 ||
      h < 64 ||
      w > 4096 ||
      h > 4096 ||
      w * h > 8388608
    )
      throw Error(
        "Image dimensions must be 64–4096 pixels, up to 8 megapixels.",
      );
    let c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  function sceneFor(pkg, o, validationOptions = {deferStandardAssets:true}) {
    if (!pkg?.project?.scenes?.length)
      throw Error("A cartoon project is required.");
    let i = o.sceneIndex ?? 0;
    if (!Number.isInteger(i) || i < 0 || i >= pkg.project.scenes.length)
      throw Error("Scene index is outside the project.");
    let sc = copy({ ...pkg.project.scenes[i], ...(o.sceneOverride || {}) });
    if (o.camera) {
      sc.camera = copy(o.camera);
      sc.shots = [];
    }
    if (o.target) {
      sc.target = copy(o.target);
      sc.shots = [];
    }
    S.validate({ ...pkg.project, scenes: [sc] }, validationOptions);
    return sc;
  }
  async function still(pkg, o = {}) {
    let prior = S.getAssetState(), st;
    try {
      await S.init(pkg.assets);
      const sc = sceneFor(pkg, o, {deferStandardAssets:false}),
        t = o.time ?? Math.min(sc.duration / 2, sc.duration);
      if (!Number.isFinite(t) || t < 0 || t > sc.duration)
        throw Error("Still time must fall within the scene duration.");
      st = S.stage(sc);
      await S.prepare(st);
      S.update(st, t);
      if (o.light) {
        const amb = Number(o.light.ambient ?? 1.8),
          sun = Number(o.light.sun ?? 2.2);
        if (
          !Number.isFinite(amb) ||
          !Number.isFinite(sun) ||
          amb < 0 ||
          sun < 0
        )
          throw Error("Invalid lighting.");
        st.root.traverse((x) => {
          if (x.isAmbientLight) x.intensity = amb;
          if (x.isDirectionalLight) x.intensity = sun;
        });
      }
      let c = canvas(o.width ?? 1600, o.height ?? 900);
      new S.SoftwareRenderer(c).render(st, t, {
        captions: !!o.captions,
        transitions: !!o.transitions,
        light: o.light,
      });
      return c;
    } finally {
      if (st) S.disposeStage(st);
      S.restoreAssetState(prior);
    }
  }
  function wrap(ctx, text, width) {
    const out = [];
    for (const para of String(text ?? "").split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/)) {
        let trial = line ? line + " " + word : word;
        if (ctx.measureText(trial).width > width && line) {
          out.push(line);
          line = word;
        } else line = trial;
      }
      out.push(line);
    }
    return out;
  }
  function label(ctx, text, box, style = {}) {
    let font = Math.max(4, style.fontSize || 22),
      pad = style.padding ?? 12;
    ctx.save();
    ctx.font = `${style.bold ? "bold " : ""}${font}px ${style.fontFamily || "sans-serif"}`;
    const lines = wrap(
        ctx,
        style.allCaps ? String(text).toUpperCase() : text,
        box.w - pad * 2,
      ),
      lineHeight = font * 1.25;
    if (lines.length * lineHeight > box.h - pad * 2 + 0.1) {
      ctx.restore();
      throw Error(
        "Text does not fit its box. Enlarge it, shorten the text, or reduce its font size.",
      );
    }
    ctx.fillStyle = style.color || "#111827";
    ctx.textBaseline = "top";
    ctx.lineJoin = "round";
    if (style.strokeWidth) {
      ctx.strokeStyle = style.strokeColor || "#ffffff";
      ctx.lineWidth = style.strokeWidth;
    }
    lines.forEach((l, i) => {
      let y = box.y + pad + i * lineHeight;
      if (style.strokeWidth) ctx.strokeText(l, box.x + pad, y);
      ctx.fillText(l, box.x + pad, y);
    });
    ctx.restore();
  }
  function balloon(ctx, b, rect) {
    let x = rect.x + (b.x ?? 0.05) * rect.w,
      y = rect.y + (b.y ?? 0.05) * rect.h,
      w = (b.w ?? 0.6) * rect.w,
      h = (b.h ?? 0.22) * rect.h;
    if (
      w < 20 ||
      h < 20 ||
      x < rect.x ||
      y < rect.y ||
      x + w > rect.x + rect.w + 0.01 ||
      y + h > rect.y + rect.h + 0.01
    )
      throw Error("Bubble falls outside its panel.");
    ctx.save();
    ctx.fillStyle = b.fill || "#ffffff";
    ctx.strokeStyle = b.border || "#172033";
    ctx.lineWidth = b.borderWidth ?? 2;
    if (b.kind === "thought") {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, b.kind === "caption" ? 2 : Math.min(18, h / 6));
      ctx.fill();
      ctx.stroke();
    }
    if (b.kind === "speech" && b.tail) {
      let tx = rect.x + b.tail[0] * rect.w,
        ty = rect.y + b.tail[1] * rect.h;
      let edge = ty < y ? y + 1 : y + h - 1;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.55, edge);
      ctx.lineTo(tx, ty);
      ctx.lineTo(x + w * 0.7, edge);
      ctx.fill();
      ctx.stroke();
    }
    if (b.kind === "thought" && b.tail) {
      for (let i = 1; i <= 3; i++) {
        let f = i / 4,
          tx = x + w * 0.7 + (rect.x + b.tail[0] * rect.w - x - w * 0.7) * f,
          ty = y + h + (rect.y + b.tail[1] * rect.h - y - h) * f;
        ctx.beginPath();
        ctx.arc(tx, ty, Math.max(2, 7 - i * 1.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    label(
      ctx,
      b.text || "",
      { x, y, w, h },
      { ...b, padding: b.kind === "thought" ? Math.min(w, h) * 0.18 : 10 },
    );
    ctx.restore();
  }
  const modes = ["render", "animation", "mixed"];
  function imageAsset(c, panel) {
    if (panel.imageId != null) {
      const a = c.images?.[panel.imageId];
      if (!a) throw Error("Missing embedded comic image: " + panel.imageId);
      return a;
    }
    return panel.sourceImage ? {dataUrl: panel.sourceImage} : null;
  }
  function checkImage(a) {
    if (!a || typeof a.dataUrl !== "string" || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(a.dataUrl))
      throw Error("Comic images must be embedded PNG, JPEG or WebP data URLs.");
    if (a.dataUrl.length > 60000000) throw Error("Comic image exceeds 45 MB.");
    const p = a.provenance;
    if (p?.kind === "animation-frame" &&
        (typeof p.sourceName !== "string" || !p.sourceName || !/^[a-f0-9]{64}$/i.test(p.sourceSha256 || "") ||
        !Number.isFinite(p.timeSeconds) || p.timeSeconds < 0))
      throw Error("Animation frame provenance needs sourceName, SHA-256 and nonnegative timeSeconds.");
  }
  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const im = new root.Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(Error("Cannot decode embedded comic image."));
      im.src = dataUrl;
    });
  }
  async function panelImage(comic, panel, options) {
    const a = imageAsset(comic, panel);
    return a ? loadImage(a.dataUrl) : still(comic.source, {...panel, ...options});
  }
  function drawPanelImage(ctx, im, r, fit = "contain") {
    const k = (fit === "cover" ? Math.max : Math.min)(r.w / im.width, r.h / im.height),
      w = im.width * k, h = im.height * k;
    ctx.save(); ctx.beginPath(); ctx.rect(r.x,r.y,r.w,r.h); ctx.clip();
    ctx.fillStyle = "#101827"; ctx.fillRect(r.x,r.y,r.w,r.h);
    ctx.drawImage(im, r.x + (r.w-w)/2, r.y + (r.h-h)/2, w, h); ctx.restore();
  }
  function validateComic(c) {
    if (
      c?.schema !== "JetCartoonComic" ||
      c.version !== 1 ||
      !Array.isArray(c.pages) ||
      !c.pages.length ||
      c.pages.length > 300
    )
      throw Error("Expected a JetCartoonComic v1 with 1–300 pages.");
    if (c.mode != null && !modes.includes(c.mode)) throw Error("Unknown comic source mode.");
    for (const a of Object.values(c.images || {})) checkImage(a);
    if (c.source) S.validate(c.source.project, {deferStandardAssets:true});
    for (const p of c.pages) {
      if (!layouts[p.layout]) throw Error("Unknown page layout: " + p.layout);
      if (
        !Array.isArray(p.panels) ||
        p.panels.length > layouts[p.layout].length
      )
        throw Error("Too many panels for " + p.layout);
      for (const panel of p.panels) {
        const a = imageAsset(c, panel);
        if (panel.fit != null && !["contain", "cover"].includes(panel.fit)) throw Error("Unknown panel image fit.");
        if (panel.textSize != null && (!Number.isFinite(panel.textSize) || panel.textSize < 4 || panel.textSize > 200)) throw Error("Invalid caption textSize.");
        if (a) {
          checkImage(a);
          if (c.mode === "render") throw Error("Render mode requires scene panels; choose mixed for images.");
        } else {
          if (c.mode === "animation") throw Error("Animation mode requires an embedded image for every panel.");
          const sc = sceneFor(c.source, panel), t = panel.time ?? sc.duration / 2;
          if (!Number.isFinite(t) || t < 0 || t > sc.duration) throw Error("Panel time must fall within the scene.");
        }
      }
    }
    return true;
  }
  async function page(comic, index = 0, options = {}) {
    validateComic(comic);
    let p = comic.pages[index];
    if (!p) throw Error("Page index out of range.");
    let w = options.width ?? 1275,
      h = options.height ?? 1650,
      c = canvas(w, h),
      x = c.getContext("2d"),
      scale = w / 1275,
      margin = Math.round(45 * scale),
      gutter = Math.round(20 * scale),
      head = p.title ? Math.round(95 * scale) : 0,
      foot = Math.round(45 * scale);
    if (p.title) {
      x.font = `bold ${32 * scale}px sans-serif`;
      head = Math.max(
        head,
        wrap(x, p.title, w - 2 * margin - 16 * scale).length * 40 * scale +
          16 * scale,
      );
    }
    x.fillStyle = p.background || "#f7f3ea";
    x.fillRect(0, 0, w, h);
    if (p.title)
      label(
        x,
        p.title,
        { x: margin, y: margin / 2, w: w - 2 * margin, h: head },
        { fontSize: 32 * scale, bold: true, padding: 8 * scale },
      );
    let inner = {
      x: margin,
      y: margin + head,
      w: w - 2 * margin,
      h: h - margin * 2 - head - foot,
    };
    for (let i = 0; i < layouts[p.layout].length; i++) {
      let a = layouts[p.layout][i],
        r = {
          x: inner.x + a[0] * inner.w + gutter / 2,
          y: inner.y + a[1] * inner.h + gutter / 2,
          w: a[2] * inner.w - gutter,
          h: a[3] * inner.h - gutter,
        },
        pn = p.panels[i];
      x.fillStyle = "#e1e3e9";
      x.fillRect(r.x, r.y, r.w, r.h);
      if (pn) {
        let cap = pn.caption || "",
          capHeight = 0, textSize = pn.textSize || 22;
        if (cap) {
          x.font = `${textSize * scale}px sans-serif`;
          capHeight =
            (wrap(x, cap, r.w - 24 * scale).length * textSize * 1.25 + 24) * scale;
          if (capHeight > r.h * 0.45)
            throw Error(
              "Panel " + (i + 1) + " caption is too long for this layout.",
            );
        }
        let im = await panelImage(comic, pn, {
          width: Math.max(64, Math.round(r.w)),
          height: Math.max(64, Math.round(r.h - capHeight)),
          captions: false,
          transitions: false,
        });
        drawPanelImage(x, im, {...r, h:r.h-capHeight}, pn.fit || "contain");
        if (cap) {
          x.fillStyle = "#fff7df";
          x.fillRect(r.x, r.y + r.h - capHeight, r.w, capHeight);
          label(
            x,
            cap,
            { x: r.x, y: r.y + r.h - capHeight, w: r.w, h: capHeight },
            { fontSize: textSize * scale, padding: 12 * scale },
          );
        }
        for (let b of pn.balloons || [])
          balloon(x, { ...b, fontSize: (b.fontSize || 22) * scale }, r);
      }
      x.strokeStyle = "#182034";
      x.lineWidth = 3 * scale;
      x.strokeRect(r.x, r.y, r.w, r.h);
    }
    if (p.text) {
      label(
        x,
        p.text,
        {
          x: inner.x + inner.w * 0.08,
          y: inner.y + inner.h * 0.16,
          w: inner.w * 0.84,
          h: inner.h * 0.7,
        },
        {
          fontSize: (p.textSize || p.textStyle?.fontSize || 28) * scale,
          color: p.textColor || "#ffffff",
          strokeWidth: 3 * scale,
          strokeColor: "#000000",
        },
      );
    }
    x.fillStyle = "#444";
    x.font = `${16 * scale}px sans-serif`;
    x.fillText(String(index + 1), w - margin - 22 * scale, h - margin / 2);
    return c;
  }
  async function pdf(comic, options = {}) {
    if (!root.PDFLib) throw Error("Bundled PDF library unavailable.");
    validateComic(comic);
    let doc = await root.PDFLib.PDFDocument.create();
    doc.setTitle(comic.title || "Cartoon Comic");
    doc.setCreator("Jet Black RLSH 3D Cartoon Studio");
    for (let i = 0; i < comic.pages.length; i++) {
      let c = await page(comic, i, options),
        im = await doc.embedPng(c.toDataURL("image/png")),
        p = doc.addPage();
      p.setSize(612, 792);
      p.drawImage(im, { x: 0, y: 0, width: 612, height: 792 });
      options.onProgress?.(i + 1, comic.pages.length);
    }
    return doc.save();
  }
  function createComic(pkg) {
    return {
      schema: "JetCartoonComic",
      version: 1,
      mode: "render",
      images: {},
      title: pkg.project.title || "New comic",
      source: copy(pkg),
      pages: [
        {
          layout: "cover",
          title: pkg.project.title || "New comic",
          panels: [
            {
              sceneIndex: 0,
              time: Math.min(1, pkg.project.scenes[0].duration / 2),
            },
          ],
        },
      ],
    };
  }
  root.StudioPrint = {
    still,
    page,
    pdf,
    createComic,
    validateComic,
    layouts,
    modes, imageAsset, loadImage, drawPanelImage,
    sceneFor,
    wrap,
  };
})(typeof window !== "undefined" ? window : globalThis);
