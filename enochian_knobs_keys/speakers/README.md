# Enochian Speakers

An additive pair of Enochian audio-control studies, reconstructed in HTML/CSS/SVG from the three supplied hardware references. Open `index.html` directly, or serve the repository and visit `http://127.0.0.1:8765/speakers/`.

## Reference forms

- **Enochian Compact Speaker:** charcoal rounded body, densely woven metal grille, quiet lower face, and a small metallic side wheel. The supplied CM-15 reference is a microphone; this study borrows its physical form, not its microphone hardware or recording capabilities.
- **Enochian Portable Speaker:** crisp rectangular cabinet, open carry handle, two black drivers, corner tweeters, and a top control rail. **Ivory** and **Obsidian** are the two finishes shown in the references. The geometry stays the same when the finish changes.

The manufacturer's branding is replaced with Enochian. These are independent interaction studies, not official products, firmware emulators, or acoustic simulations.

## Runtime and safety

- The application is a single self-contained HTML file: no build step, framework, CDN, downloaded audio, or remote font.
- Audio starts off and requires a deliberate Play gesture.
- Audio examples are **locally generated demo buffers**, not recorded microphone input, a radio stream, or uploaded music.
- Playback and volume controls are independent per object.
- The Twin finish is stored separately from the OP study's material settings.
- Mobile layout stacks the two objects instead of shrinking the complete desktop composition into an unusable thumbnail.

## Adapting components

The knob/keyboard interaction and sleeping Spring patterns originate in `volume-2/index.html`, `volume-3/index.html`, and their composed adaptation in `op-1/index.html`. The new page preserves the interaction vocabulary: pointer ownership, keyboard-operable values, synchronized slider ARIA, clear transport state, and reduced-motion handling. Source comments in the page identify the adaptations.

Geometry hooks:

```text
#compact-unit .woven-grille
#twin-unit .carry-handle
#twin-unit .tweeter
#twin-unit .driver
[data-speaker-finish="ivory"]
[data-speaker-finish="obsidian"]
```

`#twin-unit[data-finish]` is the cabinet material hook; only that object changes finish. Parameter and transport notifications use `speaker:parameter` and `speaker:transport` custom events on `window`.

## Playing

- **Mesh:** select **Play demo**, then drag the chrome side wheel vertically to set volume. Select **Stop demo** to stop.
- **Twin:** use **play** on the top rail to play/pause. **input** cycles Chord, Pulse, and Noise; **tape** toggles looping. The top cylinder controls volume.
- Focus either volume control and use arrows for one-percent steps, Page Up/Down for larger steps, and Home/End for the limits. Double-click returns to 35%.
- Select **Ivory** or **Obsidian** below Twin. The compact object's charcoal material is unchanged.

The examples demonstrate control behavior; they do not reproduce the real hardware's frequency response, stereo field, or room acoustics.

## Verification

Tests use real Chromium through Python Playwright (test-only dependencies):

```bash
python -m pip install playwright
python -m playwright install chromium
python -m unittest discover -s tests -v
python tests/capture_speakers.py
```

Visual captures go to `.qa/speakers/`, which is ignored by Git. The capture script exercises both finishes at desktop and mobile sizes, plus tablet and reduced-motion contexts. It asserts no JavaScript errors, no remote requests, no page-width overflow, and visible interactive targets of at least 44px. Captures still require visual inspection; passing DOM metrics alone does not establish fidelity.

See `VERIFICATION.md` for executed results and remaining limits after verification.
