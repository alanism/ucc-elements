# Enochian MIDI Pad

A self-contained Enochian 4×4 controller study in White and Obsidian finishes. Open `index.html` directly, or visit `http://127.0.0.1:8765/midi-pad/` using the repository's local server. No runtime dependencies, remote fonts or assets.

## Surface and playing

The physical surface includes sixteen illuminated pads, OLED, four encoders, a vertical strip, master dial, utility column and large Record/Play buttons. **WHITE / OBSIDIAN** buttons above the instrument switch the complete chassis, pads, caps, labels and shadows using the Canticle/Twin material vocabulary. White is the default (internally `ivory`). The choice is stored only under `enochian.grid16.finish`; blocked storage still permits switching, and unknown saved values fall back to White. Multicolor pad headers identify pads; the reference's orange headers/record detail become Cinnabar `#CC0000`. Green Play remains semantic. Original Enochian branding; no product affiliation or hardware firmware claim.

Local sound is initially off. **SOUND** enables genuine native Web Audio. **TRIGGER** plays generated kick/snare/hat/tom families; **PIANO** holds Canticle triangle+sine notes; **SEQUENCE** lets pads toggle local step slots. Use the printed 4×4 computer mapping (`1234 / QWER / ASDF / ZXCV`), touch/pointer, or focus a pad and hold Space/Enter. Pointer strike height emulates velocity (higher is louder); computer keys use a fixed velocity. No physical force/pressure sensor is implied.

- **LEVEL / TONE / DECAY / TEMPO:** real voice parameters and clock timing. Decay shapes drum one-shots; Piano uses a fixed short release rather than this decay setting. Drag, arrows, Page Up/Down, Home/End or double-click default reset. ENCODERS toggles global versus selected-pad parameter scope; tempo remains global.
- **STRIP:** switches volume/pitch control. MASTER always adjusts local level; MIDI volume and pitch messages are sent only with an explicitly selected output.
- **PLAY:** starts/stops the selected scene's sixteenth-note sequence. **STOP / PANIC / Escape:** stop clocks and release notes/sources; Panic also recenters outgoing pitch bend.
- **RECORD:** arm local step capture. Played pads write into the current playing step, or their step slot when stopped. This records steps in memory, not audio or microphone input.
- **SCENE / arrow buttons:** cycle A/B/C, with independent patterns. Changing scene stops playback. **SCENE SIZE:** 16 → 4 → 8 → 16 steps.
- **AUTO SET:** generated demo pattern. **SELECT ALL:** arm all active step slots. **DELETE:** clear pattern. **UNDO / REDO:** restore pattern edits within the current scene.
- **LIBRARY:** Analog/Metal generated kit. **FAVORITE:** remember then restore a kit. **OCT −/+** shifts Piano pitch. **NOTE REPEAT:** retrigger held live notes at sixteenths, both native preview and selected MIDI output; it does not double-trigger sequencer-owned notes.
- Narrow screens retain full-size targets inside a pannable instrument. Controller/Utility/Pads buttons reposition the surface.

## Optional MIDI output

Open the playing guide, explicitly CONNECT MIDI, then select an output and channel 1–16. The browser requests `requestMIDIAccess({sysex:false})`; no output is automatically chosen. MIDI works without local preview. It sends note on/off, CC and pitch bend; there is no incoming-device or DAW synchronization feature.

Port/channel changes drain the original route and center its bend before switching. Shared-pitch owners are counted so one input cannot prematurely release another. Blur/hidden/pagehide stops clocks, invalidates pending resume/permission work, releases notes, and closes native audio contexts. Disconnected hardware cannot receive guaranteed cleanup; the local state is cleared and the UI reports disconnection.

## Reuse, verification and limits

Reuses the atlas's knob input contract, Canticle voices/ownership, and deck-generated one-shot/envelope cleanup patterns. Bubbled `grid16:note`, `grid16:parameter`, `grid16:midi` events and `window.padLab` expose state for reuse/testing.

No microphone, remote audio, upload, audio export, external samples or hardware emulation. Only the finish preference persists; patterns and kits are session-local. Switching finish does not stop notes or edit patterns. This is a browser-timer step sequencer, not a sample-accurate workstation or MIDI Clock master. Sound preview has a sixteen-voice bound (pitched voices use two native oscillators each).

Tests use genuine Chromium Web Audio and a separately labelled Web MIDI boundary double. Physical devices, drivers, speaker audibility and the real browser MIDI permission dialog have not been tested.
