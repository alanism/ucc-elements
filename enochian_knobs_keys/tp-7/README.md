# Enochian Audio Recorder

Open `index.html` directly, or visit `http://127.0.0.1:8765/tp-7/` while the local atlas server is running. No build, CDN, remote fonts, or network requests are needed.

## Reference treatment

An Enochian-branded metal recorder control study: large engraved platter and three-screw hub, OLED, side rocker, three transport keys, diagonal volume caps, lower knurled volume dial, and Silver / Obsidian finishes. Cinnabar `#CC0000` replaces the orange record/mark accents. The finishes use neutral grey metal rather than an olive cast. Finish selection persists when local storage is available; blocked storage remains usable.

## Operate

- **Play / Pause:** play the local eight-second Canticle-inspired generated phrase, pause with position retained, or replay a captured take.
- **Stop:** stop playback and reset position; during recording, finalize the take.
- **Record:** capture a real native `MediaRecorder` stream generated inside this page. The capture is silent and never routes to the speaker output. It is bounded to 30 seconds and decoded into a real `AudioBuffer` for playback.
- **Platter:** drag horizontally to seek; arrows step 0.1 seconds, Page Up / Down step one second, Home / End select the limits.
- **Side rocker:** skip backward / forward one second.
- **M:** bookmark the current position; up to 99 marks, counted on the OLED.
- **Volume:** vertical drag, arrows, Page Up / Down, Home / End; double-click resets to 35%. The + / − buttons change it by five percentage points.

The take and bookmarks live in memory only; reload discards them. Recording is **not microphone capture** and there is no upload, file import, download/export, or transcription flow. Native encoder / decoder support varies by browser; unsupported recording reports a failure without blocking demo playback.

## Reuse and lifecycle

The deterministic phrase uses Canticle's triangle + sine vocabulary. Tactile controls reuse the atlas's Spring / makeKnob and pointer-capture contracts, with accessible slider roles and native buttons. All sound is opt-in. Blur, pagehide, and hidden-document events invalidate pending starts, stop/disconnect sources, cancel capture, release pointers, and close the audio context. Reduced motion freezes decorative platter rotation; offscreen playback stops visual updates without changing the audio transport.

`window.recorderLab` exposes diagnostic state for native-browser tests; it is not a production recording API.

These are web interaction studies, not firmware or exact acoustic emulations, and imply no hardware-manufacturer affiliation. See `VERIFICATION.md` for actual execution results and limits.
