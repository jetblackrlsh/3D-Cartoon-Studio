# Studio 1.6.1 comic-source-mode verification

Base: public GitHub main `1c4252eeffa03a420884ca3456261e318dd9adf7` (Studio 1.6.0), verified through GitHub connector. Six changed existing source/metadata files match that remote baseline byte-for-byte before modifications. Original film, assets and older releases untouched.

- PASS: native shared-engine image-only, mixed and legacy scene/inline-image PNG/PDF; portable source-optional image comic; reusable image IDs; missing IDs, invalid URL/data/provenance/modes/times and corrupt decoding rejection.
- PASS: actual editor event handlers under jsdom/native canvas: load/switch/incompatible mode preservation, per-panel scene/image replacement, full-page errors, new animation-only comic, no-video errors, simulated decoded-video capture plus SHA-256/time provenance. Simulated media does not certify a browser decoder.
- PASS: real FFmpeg generated-video extraction, crop pixel dimensions, source SHA/metadata, unchanged source bytes; invalid times/crop rejection. FFmpeg/FFprobe needed only for CLI extraction.
- PASS: existing native regressions, 17,400 cast poses, native Standard rig/assets checks, protected Fast rendering/settings and CLI, existing still/registry restoration. Aggregate `npm test` passed through native print then exited137 at the existing memory-intensive Fast UI stage; that exact stage passed when run separately. Logs retained. No claim of single uninterrupted aggregate success.
- BLOCKED: standalone Chromium before app load (`socket() Operation not permitted`). Supported cloud CUA browser cannot access this workspace directly: file protocol denied by browser URL policy; local HTTP preview `127.0.0.1:8766` connection refused from separate browser machine. No personal computer used or fallback claimed. Actual browser video seeking/playback, downloads, visual UI/WebGL not certified.

Limits: source videos not embedded; captured pixels are. Baked-in subtitles remain unless explicitly cropped with provenance. Timestamp seeking is not frame-index precision; original resolution cannot be recovered. Images-only PNG/PDF need no 3D rerender. No private production/film data included in public source/examples.
