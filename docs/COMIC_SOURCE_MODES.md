# Comic source modes — Studio 1.6.1

Open `START.html` locally. No upload/server/account is needed for rendering or comic editing. In **Comic pages**, choose one of three source modes before New comic:

- **Newly rendered scene stills** (`render`): independent scene snapshots, editable pose/camera/time, as before.
- **Frames from existing animation** (`animation`): choose a local video, scrub/play or enter seconds and Seek, then Capture reusable frame. Choose the captured image and Add image panel. Change a full cover to a multi-panel layout or add a page before adding more panels.
- **Mixed** (`mixed`): any combination per panel; Replace selected panel with image/current scene preserves its caption and balloons. Mode changes never erase panels; incompatible changes are rejected. Switch to Mixed first to convert an existing comic.

The video stays local; captured images are embedded once and reusable across pages. Save editable comic after edits. Load restores captured pixels without the original movie. The mode, images and provenance live in the portable JSON, not transient browser state. Page JSON remains available for captions, balloons, `textSize`, `fit: "contain"|"cover"`, and image IDs. Contain (default) letterboxes rather than distorting; cover crops. Existing v1 scene comics and draft inline `sourceImage` panels still load. A mode-less legacy comic accepts either kind. Original project/video assets are never rewritten.

The picker accepts decodable browser video up to 500 MB / 4096 pixels / 8 megapixels. SHA-256 requires WebCrypto (normally supported for local files or localhost); on a browser that lacks it, use the headless helper. Captures store actual `video.currentTime`, dimensions, original filename, byte length, SHA-256 and extraction method. Browser seek selects the decoder's frame at that time, **not guaranteed frame-index addressing**. Codecs depend on the installed browser. A captured frame includes baked subtitles/letterboxing; do not imply original higher resolution or invent missing imagery. Source privacy/copyright remains the user's responsibility.

## Portable schema (additive JetCartoonComic v1)

```json
{
  "schema":"JetCartoonComic", "version":1, "mode":"animation",
  "images": {
    "frame001": {
      "dataUrl":"data:image/png;base64,...",
      "provenance": {
        "kind":"animation-frame", "sourceName":"movie.mp4",
        "sourceSha256":"64 lowercase hexadecimal characters", "timeSeconds":12.5,
        "method":"browser-video-seek"
      }
    }
  },
  "pages":[{"layout":"one","panels":[{"imageId":"frame001","fit":"contain","caption":"An editable caption"}]}]
}
```

`source` is optional for an image-only comic; render/mixed scene panels require the original portable `source: {project,assets}`. `images` are PNG/JPEG/WebP base64 data URLs, not remote URLs or file paths. Animation-frame provenance, when present, validates source filename/SHA/time. It documents extraction, not source authenticity. Empty panels/pages are permitted during editing. Missing IDs, invalid modes/times/provenance, incompatible panel kinds, corrupt image decoding and oversized text fail explicitly.

## Headless / offline extraction

Install existing npm dependencies once (`npm ci`); image-only export uses the same native print engine. Video extraction additionally needs FFmpeg and FFprobe installed on PATH; neither is bundled.

```sh
node Source/extract-comic-frame.cjs movie.mp4 12.5 frame001.asset.json
# Optional JSON: {"crop":{"x":0,"y":0,"width":640,"height":288}}
node Source/extract-comic-frame.cjs movie.mp4 12.5 frame001.asset.json crop.json
```

The helper refuses to overwrite an existing output. It reads source bytes, hashes them, bounds-checks time/crop, decodes one PNG, scales down to at most 1920 pixels per axis, and writes a reusable asset object. Put that object under `comic.images.frame001`, then set panel `imageId` to `frame001`. The source path is not embedded, only its filename. FFmpeg output seeking stores requested seconds; source timebases/VFR/keyframes can affect frame identity. Crop provenance remains explicit. To extract another frame, choose a new asset filename/ID; source movies remain unmodified.

```sh
node Source/print.cjs page comic.jetcomic.json page.png
node Source/print.cjs comic comic.jetcomic.json output-directory
```

This produces native page PNGs, PDF, the portable comic and render report; no video or 3D rerender is needed for image panels. Mixed panels use the shared scene renderer only where a scene panel requests it. Browser PNG/PDF exports use identical page composition.

## Verification scope

`node Source/test-comic-modes.cjs` checks actual native PNG/PDF image-only/mixed/legacy exports, rejection paths, and actual editor event handlers in jsdom with native canvases (load/mode switch/replace/full-page/new/no-video). This is **not a real-browser video codec or WebGL certification**. Run the picker against your installed browser for its media decoder support. Existing renderer limitations remain unchanged. Public examples/tests contain only generated generic images, never private film/audio/log data.
