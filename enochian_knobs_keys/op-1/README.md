# Enochian Synth Studio

An Enochian instrument study based on the supplied Teenage Engineering OP-1 reference. The study uses its light molded surfaces, square-cell seams, pill keys, round accidental caps, colored encoders, and black instrument display as a UI vocabulary. It is not an official Teenage Engineering product, firmware recreation, or complete OP-1 emulator.

## Open

Open `index.html` directly in a modern browser. No build step, package manager, network service, external asset, or audio file is required.

To preview over HTTP from the repository root:

```bash
python -m http.server 8765 --bind 127.0.0.1
```

Then visit <http://127.0.0.1:8765/op-1/>.

## Source reuse

| Element | Existing source | Adaptation |
|---|---|---|
| Playable keys | `volume-3/index.html`, Enochian Synth Keyboard | Keeps the `.op-cell` / `.op-cap` / square-cell construction, expands to two octaves, and uses source-owned input handling. |
| Synth voices | Enochian Synth Keyboard | Triangle + sine voices, gain envelope, and low-pass filter. Audio starts only after a user gesture. |
| Encoders | `volume-2/index.html`, `makeKnob` | Bounded values, spring-driven rotation, vertical dragging, keyboard increments, and synchronized ARIA. |
| Motion | Shared `Spring` core | Damped tactile movement; respects reduced-motion settings. |
| Transport | `volume-2/index.html`, Enochian Tape Deck | Visible, interlocked record-arm / play / stop state. |

The new study is self-contained so it does not load an entire atlas volume merely to reuse a control. Source sections are credited in the HTML. Existing source volumes remain unchanged.

## Intentional design differences

- Enochian branding replaces the manufacturer's wordmark.
- Encoder colors identify four distinct parameters. This is a deliberate exception to the atlas's normal Cinnabar-only signal palette.
- **Tape means note-event capture and replay**, not audio recording, microphone capture, sampling, multitrack editing, or WAV export.
- On narrow screens, the hardware stays large enough to operate and scrolls inside its own viewport instead of shrinking every control into tiny targets.

## Playing and adapting

- Sound is **off by default**. Click the small master sound button to enable browser audio.
- Hold the piano keys with a pointer, or focus the keyboard and use the printed computer-key hints. First octave: `A S D F G H J` with `W E T Y U` accidentals. Space/Enter holds the focused note. `Z`/`X` shifts the octave.
- Drag an encoder vertically; arrows change one step, Page Up/Down ten, Home/End reach its limits, and double-click restores the Canticle default.
- Presets 1–8 apply distinct pitch/filter/release/level settings. The previous/next and reset controls work on the same parameter state.
- **Record → Play → notes → Stop → Play** captures and replays a phrase. Arming a new take replaces the previous phrase when capture starts. Takes are limited to 60 seconds or approximately 4,096 events. Tape is memory-only and is cleared on refresh.
- Loop repeats the take; Home stops and rewinds. Clear has one-level undo. Switching Synth/Tape only changes the display, not held notes.
- Guide and Code buttons open the built-in usage and reusable-element panels. Key hints can be hidden independently of note controls. Ivory/Obsidian finish is saved locally when browser storage is available.

The instrument emits bubbling `canticle:note` events with `{ phase, note, midi, hz, source }` and `canticle:parameter` events with `{ parameter, value, unit }`. These are observation/integration hooks, not a complete DAW control API. Reuse the CSS classes and the small helpers alongside their state/cleanup wiring; copying a styled button alone does not reproduce the interaction.

## Verification

The repo's `tests/` directory contains browser acceptance checks. Install the test-only dependency and Chromium if needed:

```bash
python -m pip install playwright
python -m playwright install chromium
python -m unittest discover -s tests -v
python tests/capture_op1.py
```

Visual captures and measurements are written to `.qa/op-1/`, ignored by git. These checks exercise the browser; they do not certify real-device acoustic output or every accessibility assistive technology.

## Credit and terms

Based on *Enochian UI UX Elements* by alanism / UnCommon Core, CC BY-NC 4.0. See `../LICENSE.md`. Teenage Engineering OP-1 is named only to identify the supplied design reference; there is no endorsement or affiliation.
