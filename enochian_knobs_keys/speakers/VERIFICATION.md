# Verification — Mesh & Twin

## Executed gates

- `python -m unittest discover -s tests -v`: **38 tests passed**, exit 0. This includes the original atlas/OP regression suite plus the new audio-object acceptance, behavior, and lifecycle checks.
- `python tests/capture_speakers.py`: **six real browser captures**, exit 0. Both finishes at desktop/mobile sizes, plus tablet and reduced-motion contexts. No JavaScript errors, remote requests, page-width overflow, or visible interactive targets smaller than 44px.
- `.qa/speakers/native_probe.py`: exit 0. The probe wraps real native Chromium Web Audio methods for observation, not substitute audio nodes. No context exists on arrival; Play starts native sources with nonzero analyser RMS. Ordinary Stop disconnects sources and produces RMS 0. Blur stops/disconnects all sources and closes both contexts.
- `.qa/speakers/independent_review.py`: rerun after the confirmed target-overlap fix. Its returned observations were parsed and checked with **11 explicit assertions**, all passing. These cover rail occlusion, actual pause offset, natural completion, rapid transport/input changes, pending-resume cancellation, reduced-motion/offscreen frames, blocked storage/offline operation, unsupported Web Audio, and page errors.
- `git diff --check`: exit 0. Existing LF-to-CRLF notices remain normal working-copy notices.
- Served atlas readback: one new speaker-study link. Study URL returns HTTP 200 with both object IDs present. The direct-file path also exists and was the source used by browser tests.

## Defects reproduced and corrected

1. Navigation links initially had undersized targets: brand height 23px, Atlas width approximately 43.39px, OP width approximately 30.81px. All now have minimum 44px usable targets.
2. Before lifecycle completion, resolving a delayed native resume after blur resurrected compact playback (`wanted`, `playing`, and graph all true). The generation guard plus unconditional stop invalidation now prevents this, with a retained fault-injection regression.
3. The narrow Twin volume/tape controls originally overlapped by **2 × 44px**. The independent reviewer reproduced a real mouse click inside the volume bounding box toggling Loop instead. The narrow volume position moved two pixels left. A new regression checks pairwise occlusion, not merely bounding-box size. The same reviewer probe now reports no rail overlap.

Horizontal containment/44px targets were checked at **280, 320, 390, 700, 701, 768, 900, 901, 1024, and 1440px**. The rail regression additionally checks 340px. Mobile/tablet stack the objects instead of clipping the sidewheel or shrinking interactive hit areas.

## Visual inspection

Reviewed actual Ivory/Obsidian desktop renders and stacked mobile renders against the supplied three references. Kept the compact body's portrait aspect, almost-square woven grille, chrome sidewheel, quiet lower face; Twin's open handle, hinge ends, top rail, two circular tweeters and recessed cones. Removed an artificial diagonal cabinet reflection and neutralized cone materials.

Surface: **Operate**. Subjective ten-tell design self-audit: **0/10**; no decorative feature-card grid, marketing hero, generic tech-gradient palette, or glass overlay. Physical material gradients/shadows provide hardware depth. This is a subjective composition check, not an automated certification.

## Reuse and actual functional scope

- Spring/makeKnob patterns from Volume 2, Volume 3, and their OP-study adaptation; pointer ownership/cancellation, keyboard steps/limits, reset, synchronized slider ARIA and sleeping frames.
- Canticle-derived local synthesis and bounded output buses; finite **four-second mono demo buffers** generated locally.
- Volume-2 transport vocabulary; independent unit playback, Twin pause offset, three actual different source buffers, and looping.
- Validated persistent Twin-only Ivory/Obsidian finish; works even when storage is unavailable, without persisting in that case.
- `speaker:parameter` / `speaker:transport` window events.

## Limits

- CM-15 is a microphone reference; Mesh borrows its physical form but never requests microphone access.
- Tape means looping the generated demo, not audio recording or the original hardware's tape engine.
- Neither object simulates hardware acoustics, stereo output, radio streams, or production speaker firmware.
- Lifecycle fault injection used real Chromium contexts with delayed promises and injected blur/visibility events. Physical speakers, real mobile touch, OS device failures, native tab-switch timing, Firefox/WebKit, and every screen-reader combination were not certified.
- Chromium can preserve its final analyser samples after a context closes. The native probe therefore checks closed-context state as well as analyser values; a frozen sample is not evidence of ongoing sound.

No application dependencies, remote fonts/assets, external requests, or microphone permission calls were found. Browser tests require Python Playwright and Chromium only.
