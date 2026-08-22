# VERO Studio engine

VERO Studio is the production environment. It does not depend on or connect to an external switcher.

## Current native foundation

- Persistent VERO productions with customizable native input definitions.
- Automatic Windows local-video discovery through the media-device API.
- Separate **Capture Device** and **Webcam** source types: known HDMI/SDI/capture-card hardware is classified as production capture, while integrated and USB webcams remain explicitly labeled webcams.
- Native device selection by stable device ID with optional paired capture-audio selection; local video inputs do not use URLs.
- A vMix-inspired but VERO-owned source catalog covering video, playlists, capture, webcams, desktop/NDI, streams, replay, stingers, delay, images, presentations, audio, titles, virtual sets, GFX, browser, and calls. Only implemented engine types are enabled.
- Native Windows file browsing and range-capable local media serving for Video and Image inputs.
- Video, image, browser, color, and VERO GFX source types.
- Persistent Preview and Program buses with intentional CUT and AUTO actions.
- Basic per-input audio state for enabled channels.
- A loopback-only Studio Bridge at `127.0.0.1:43120`.
- Real VERO GFX discovery through its existing loopback bridge at `127.0.0.1:43110`.
- A versioned `GET/POST /__vero/studio/context` endpoint for sharing production identity and Program state with VERO applications.

## Honest limitations

- AUTO currently performs the same immediate bus change as CUT; a native compositor and timed transition renderer are the next engine layer.
- URL-based media is functional, while a secure packaged local-file picker and managed media storage still need to be added.
- Basic audio settings persist, but native mixing, metering, routing, and output-device control require the audio engine.
- VERO GFX can be discovered and Studio can publish production context. GFX must implement the shared Studio protocol before TAKE/OUT and rendered alpha output can be controlled here.
- Recording, streaming, encoding, multiview output, NDI/SRT/RTMP ingest, hardware capture discovery, and GPU compositing are future engine milestones and are not presented as active.

## Next engine milestones

1. Add a native compositor/output window with real CUT and timed transitions.
2. Add secure local media selection, managed paths, and thumbnail generation.
3. Add audio graph, meters, master bus, monitoring, and output selection.
4. Finalize the bidirectional VERO Studio ↔ VERO GFX protocol and alpha graphics source.
5. Add recording/streaming encoders and professional ingest/output transports.
