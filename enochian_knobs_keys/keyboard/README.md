# Enochian MIDI Keyboard

A self-contained Enochian compact keyboard study. Open `index.html` directly, or visit `http://127.0.0.1:8765/keyboard/` with the repository's local server. There is no build step or runtime dependency.

## Surface and controls

- White/Obsidian chassis, 15 white + 10 black keys, two touch strips, eight encoders and sixteen rubber-style pads. Cinnabar `#CC0000` replaces orange accents. Original Enochian branding; independent reference-inspired study, not firmware or an affiliation claim.
- **WHITE / OBSIDIAN** controls above the instrument switch the complete material palette, labels and shadows using the same enamel/graphite vocabulary as Grid16. White is the default (internally `ivory`). Key colors retain their musical black/white identities in either chassis finish. The choice is stored only under `enochian.keyboard.finish`, independently of other studies; invalid saved values fall back to White and switching works when storage is blocked. Finish changes preserve held notes and audio/MIDI routing.
- **SOUND** opts into native Web Audio preview. It starts off. Canticle triangle + sine voices have ownership-aware release and a bounded native graph.
- Play by pointer/touch, the printed computer-key mapping, or focus a key and hold Space/Enter. Independent key/pointer sources can own the same pitch; releasing one must not release the others.
- **PITCH** bends local notes and outgoing MIDI; pointer release recenters. **MOD** changes local harmonic level/filter cutoff and sends modulation CC.
- **MODE** chooses arpeggio direction (Up, Down, Bounce, Random), not a fake external software mode. **OCT**, **TRANSPOSE** shift notes; **LATCH** retains notes until released by turning it off or ALL OFF. **GATE**, **SWING**, **TEMPO**, **RATE** change the arpeggio timing. **ARP** enables the held-note arpeggiator; **SCALE** snaps pitches down into C major.
- First pad row: C major, D minor, E minor, F major, G major, A minor, B diminished, octave C chord. Hold to play. Second row: four local filter voicings, ARP, LATCH, tap tempo, ALL OFF.
- Encoders: vertical drag, arrows, Page Up/Down, Home/End, double-click default reset. They emit `canticle:parameter`. Musical note ownership emits `canticle:note` with phase, absolute MIDI pitch and source.
- On narrow screens, pan the full-size instrument or use the two jump buttons. Physical hit areas are not shrunk to fit a thumbnail.

## Optional MIDI output

Open the playing guide or press MIDI. CONNECT MIDI requests `navigator.requestMIDIAccess({sysex:false})` only on explicit activation. Choose an output; **None is the default**. Choose a channel 1–16. The controller sends notes, pitch bend, modulation and parameter CC messages. It does not receive MIDI, claim Bluetooth connectivity, or automatically connect to a DAW.

MIDI can work with local sound muted. Output/channel changes drain original-route notes and recenter pitch bend. Leaving the window releases ownership, cancels arpeggios, closes the audio graph and invalidates pending audio/MIDI requests. A disconnected device cannot be guaranteed to receive cleanup messages; the local router drops its state safely.

## Reuse and limits

Adapted from the atlas's Canticle source-ownership/triangle+sine envelope and knob keyboard/pointer contracts. Telemetry is `window.keyboardLab`; it is not a hardware interface. No external assets, uploads, microphone requests or saved takes. Only the finish preference persists; performance state is session-local. Arpeggio scheduling is a browser timer, not sample-accurate MIDI Clock. The PLUCK-labelled voicing is a bright filter setting, not a physical string model.

Automated checks exercise genuine Chromium native audio. MIDI serialization and route cleanup use `tests/controller_midi.py`, explicitly a boundary test double. No physical MIDI device or browser permission-dialog integration was available for verification.
