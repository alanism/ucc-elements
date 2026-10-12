# Enochian DJ Controller

Open `index.html` directly, or visit `http://127.0.0.1:8765/dj-decks/` with the local atlas server running. Everything is local: no build step, remote assets, track service, microphone, or network calls.

## Reference treatment

Two scalloped jog wheels, two tempo sliders, two eight-pad banks, Cue / Play controls, twin three-band EQ plus CFX columns, channel faders, routing buttons, and a crossfader. Enochian branding replaces manufacturer logos. Cinnabar `#CC0000` replaces orange pads, cue rings, sync controls, mixer switches, and focus indications. Green remains the semantic Play indicator.

**WHITE / OBSIDIAN** buttons above the controller switch the chassis, platters, jog rims, caps, pads, faders, labels and shadows together. White is the default (internally `ivory`), using the same enamel/graphite palette as Grid16 and Canticle. The choice persists only under `enochian.dj-decks.finish`, independently of every other instrument. Invalid saved values fall back to White; blocked storage does not prevent switching. Finish changes leave playing sources and mixer settings intact.

## Operate

- **Play / Pause:** each deck independently plays a generated eight-second pattern. Pause retains the native playback offset.
- **Cue:** stop the deck and return to the start.
- **Jog:** horizontal drag seeks; arrows step 0.1 seconds, Page Up / Down step one second, Home / End choose the bounds. Double-click resets.
- **Tempo:** ±8%, with 0.1% keyboard steps; double-click restores base tempo. The two patterns have 120 / 128 BPM base rates. Rate changes affect native playback rate, including pitch.
- **Sync:** match the other deck's tempo within the available ±8% range and align buffer-time beat phase. This is not a general track-analysis beat grid or professional sync engine.
- **Pads 1–4:** recall hot cues; latch the deck’s SHIFT button to set a cue at the current position.
- **Pads 5–8:** generated Kick / Snare / Hat / Clap one-shots. They have a bounded simultaneous-source cap and disconnect after ending. Deck patterns loop continuously during Play.
- **EQ:** real native high-shelf, mid peaking, and low-shelf filters, each ±12 dB.
- **CFX:** magnitude of filter amount; the central mode switch selects lowpass or highpass. Both rotary directions increase magnitude from the neutral centre.
- **Channel faders / Crossfader:** change native per-deck gain. Smart Fader switches equal-power versus linear gain law.
- **Preview 1 / 2 / Master:** choose solo / mixed monitoring on the **same output**; no separate hardware headphone bus is created.

On narrow screens the controller retains its physical geometry in a horizontal panning region. The Deck 1 / Mixer / Deck 2 navigation buttons expose each region; controls are not shrunk below 44px. Sliders support arrows, Page Up / Down, Home / End and double-click reset.

## Reuse and lifecycle

Local patterns use the atlas's Canticle-inspired synthesis vocabulary. Sliders reuse the Spring / makeKnob and pointer-ownership contracts from the existing speaker / OP studies. Sources only start from interaction. Blur, pagehide, or hidden-document events invalidate starts, stop/disconnect deck and sample sources, close contexts, and release pointers. Offscreen visuals sleep. Reduced motion uses a slow readout timer instead of animation frames and freezes platter rotation.

`window.djLab` is diagnostic state for the tests, not an external DSP API. Only the material-finish preference persists; performance state remains session-local. No track import, hardware MIDI support, audio export, time-stretching, or separate headphone device routing is implemented. This is a browser control study, not branded hardware firmware or acoustic emulation.

See `VERIFICATION.md` for verified scope.
