# Verified recorder / DJ studies

## White/Obsidian finish update

The original delivery record below is retained. The subsequent finish update passed **99 full-suite tests**, **28 additional Obsidian interaction/safety tests**, **44 controller native/MIDI-boundary checks**, and **15 transport native checks**. **16 White/Obsidian browser renders** for DJ-Decks and Keyboard passed responsive geometry and reachability checks. Switching finishes preserves live native sources and mixer/note state. Final production source hashes were stable throughout verification; details and rerunnable logs are in `.qa/finishes/verification.md` and `verification.json` (git-ignored). MIDI checks do not certify physical hardware.

Execution timestamp: 2026-10-12T03:10:00.451059+07:00

## Actual commands

From the repository root:

```sh
python -m unittest discover -s tests -v
python tests/capture_transports.py
python .qa/transports/independent_review.py
git diff --check
```

Final chained run: **exit 0**. **62 tests passed**, including the original atlas, Canticle Keys, OP, and speaker regressions. Native Chromium / Python Playwright were used against direct `file://` pages.

## What was exercised

- Recorder: opt-in playback, native pause/resume offset, seek and pointer cancellation, rocker, native gain, bookmarks, valid/invalid/blocked finish storage, native capture and decoded audio, safe blur cancellation, and unsupported Web Audio / encoder states.
- DJ: independent native transports, pause/resume/Cue, native tempo/seek and sync, hot cues and Shift, one-shots and cleanup, EQ / CFX native filters, channel gains, equal-power / linear crossfades, and same-output preview routes.
- Native-resume promise delays prove that blur cannot start an orphan source later. Reduced-motion checks assert both no ongoing animation frames and no interval-driven platter rotation.
- Responsive acceptance: 280, 320, 390, 700, 768, 900, 1024, and 1440px, no outer page overflow, targets at least 44px. Centre hit-tests at 280, 390, 768, 1440px catch real element occlusion. DJ hardware pans internally on narrow screens.
- OLED content stays within its bezel at the tested widths. Recorder finish metal remains neutral rather than olive.
- 12 actual desktop/mobile/narrow/tablet/reduced-motion renders saved under `.qa/transports/` (git-ignored), with no captured runtime or network failures.

## Independent probe

Read-only reviewer probe: **15 / 15 checks passed**, **0 confirmed defects remaining**, no source change during the final run. Full evidence is in `.qa/transports/report.json`.

Example actual final-run outputs:

- Real generated capture: 10865 bytes, 0.659977 seconds, decoded RMS 0.077048.
- DJ native sync reproduction: source `start()` offset 1.060000 seconds; beat-phase error 0.000000 beats.
- One-shots produce nonzero native analyser output, obey gain zero and hard-right crossfade mute, and remove/disconnect themselves after ending.
- Saturated trigger burst is bounded to 16 concurrent one-shots and returns to zero after ending; blur leaves zero active native sources and closed contexts.

## Defects caught and fixed before delivery

- Narrow recorder transport caps smaller than 44px; widened the physical case footprint.
- DJ navigation targets too small; given proper minimum dimensions.
- Decorative DJ maker label occluded MID knob centres; removed its hit interception.
- Delayed recorder `resume()` could survive blur; lifecycle generation invalidation and context cleanup now prevent this.
- DJ reduced-motion transport kept requesting animation frames; uses a slow readout timer instead.
- Recorder interval rotated the platter even without animation frames; decorative transform now respects reduced motion / viewport state.
- Mobile OLED content exceeded its bezel; typography now follows case width.
- DJ sync divided beat duration by playback rate twice; seek offsets now use source-buffer seconds.

## Verification limits

This is Chromium automation, not a human listening session or proof of acoustic equivalence. Firefox / Safari, actual hardware/MIDI devices, assistive-technology sessions, exhaustive edge hit-testing, and the real-time 30-second automatic-recording deadline were not independently exercised. Native capture was exercised at shorter durations. The 30-second bound is implemented, not certified here. Preview routing shares one output. Takes are transient; microphone capture, uploads, imports, export, and transcription are not implemented.

## Visual audit

Primary surface: **Operate**. Slop audit: 0/10 rubric tells identified in the inspected final renders. Hardware geometry and tactile materials dominate; no generic hero/feature tiles, fake metrics, brand logos, decorative stat blocks, or unearned glass panels. This is a design assessment, not an automated metric.
