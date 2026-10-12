# Verification — Canticle / OP study

## Executed gates

- `python -m unittest discover -s tests -v`: **27 tests passed**, exit 0.
- `git diff --check`: exit 0. Git reports normal LF-to-CRLF working-copy notices for the existing text files.
- `python tests/capture_op1.py`: seven actual browser captures, no page errors or remote resource requests, no page overflow, no undersized instrument controls.
- `.qa/op-1/independent_review.py`: an independent review probe, rerun against the corrected implementation with assertions for its confirmed defects. It passes. The probe's private-map lookups were updated when voice identity became `(physical note, MIDI)`; behavioral assertions were not relaxed.

## Confirmed defects repaired

| Finding | Before | Corrected real-browser result |
|---|---|---|
| Mute missed already-released envelopes | RMS approximately 0.008 after mute; release graph still connected | Native analyser RMS **0**, master gain **0**, five voice nodes disconnected |
| Live input and tape collided on a physical key | Recorded C4 inherited live C5's MIDI 72 / approximately 523 Hz | Separate MIDI 60 and 72 voices at approximately 261.626 and 523.251 Hz; releasing live input leaves MIDI 60 playback intact |
| Narrow navigation overflow | Page width 322 at viewports 280 and 320 | Page width equals viewport width |
| Intermediate-width undersized controls | At 1024px, utility targets approximately 39.844px and accidental targets approximately 41.656px tall | No interactive target below 44px at the tested widths |

Tested responsive widths: **280, 320, 360, 390, 768, 1000, 1024, 1440** pixels. The chassis deliberately scrolls inside its own container when it cannot fit without shrinking the controls.

Additional checks cover keyboard chords, focused Space/Enter, source-owned pointer gliding, pitch/filter/release/level controls, octave changes, recording/playback/loop/rewind/clear/undo, presets, finish persistence, guide/code panels, key hints, large chords, reduced motion and offscreen spring shutdown. Blur and the hidden-document cleanup branch stop the tape and release owners. Native parameter probes observe oscillator/harmonic frequencies, low-pass cutoff and master gain.

## Visual inspection

Reviewed actual desktop/mobile renders, Obsidian, held chord, captured tape and right-scrolled mobile controls. Seven captures include a reduced-motion view. Default Synth and Tape graphics do not overlap. Reference-inspired proportions, pale molded cells, tactile caps and role-coded encoders are retained; Enochian branding replaces the manufacturer's mark.

Composition self-audit: **Operate** surface; ten-tell slop score **0/10** (a subjective visual review, not an automated quality certification). Material shading is deliberate physical depth, not a decorative tech-gradient/glass overlay. The instrument is the primary surface, not a marketing hero with feature tiles.

## Limits

- This is a UI/instrument study, not OP-1 firmware or a complete DAW.
- Tape stores MIDI-style note events in memory, not audio; refresh clears it. New recording replaces the previous phrase on Play. Captures are capped at 60 seconds or approximately 4,096 events.
- Audio was verified in the native browser graph. Physical speaker output, real multitouch hardware, all browser engines and screen-reader combinations were not certified.
- The Synth graphic is an illustrative triangle-wave display, not a calibrated oscilloscope.
- Test-only dependency: Python Playwright and Chromium. Application runtime: self-contained HTML/CSS/JavaScript, no build step, remote assets or libraries.
