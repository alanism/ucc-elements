# Device-frame verification

## Scope
Five compositions and nine CSS/HTML hardware bodies from the supplied references: external display, compact desktop, all-in-one, keyboard, mouse, laptop, landscape tablet, stylus, and portrait phone. All five screen slots contain zero child nodes at initial load. No reference photographs, Apple logos, copied OS screens, wallpapers, status text, or notification content are bundled.

## Executed gates

`python .qa/apple-devices/run_gates.py` returned exit 0:
- Full existing + new unittest suite: **112 tests passed**.
- New device acceptance suite: **13 tests**, including each reference composition, blank screen aspect ratios, finish palettes, exclusive accessible pressed state, isolated preference and invalid/blocked storage, all-device containment at seven viewport widths, content/event continuity, actual atlas navigation, and stand/bezel stacking.
- Tall and wide labelled synthetic test images were inserted into all five live Chromium screen slots. Neither image shape changes aperture geometry, and direct images fill the slots. Test fixtures are not bundled with or displayed by the artifact.
- **18 actual browser captures**: both finishes at 1440, 768, 390, and 280px; plus each of the five compositions isolated at desktop width in each finish.
- Capture gates report zero JS exceptions, console errors, remote requests, page overflow, clipped measured hardware geometry, undersized controls, or occluded control centers. Both finishes contain all nine hardware bodies and five empty apertures.
- `git diff --check`: exit 0.
- Actual visible-label contrast: **52 checks**, zero failures; the lowest measured ratio was **5.88:1** against a 4.5:1 threshold (`python .qa/apple-devices/check_contrast.py`).
- The independent reviewer probe was rerun against the final source and its report was read back/hash-checked: **14 intrinsic-image cases**, **14 finish/viewport cases**, and **5 pointer/keyboard content-input cases**, with zero confirmed defects. Extreme 100×10000 and 10000×100 images did not resize the hardware; pixel-level checks found no image painting outside the screen-slot bounds. Evidence: `.qa/apple-devices/independent-review.json`, reproduction: `python .qa/apple-devices/independent_probe.py`.

Final source hashes and per-gate logs are stored in `.qa/apple-devices/verification.json`; capture geometry and paths are in `report.json`. Source versions remained stable throughout that final run. The local `/apple-devices/` preview returned HTTP 200 and exactly matched the verified on-disk HTML.

## Visual review
Actual White and Obsidian desktop renders, Obsidian mobile render, and the corrected display/stand composition were inspected. Screens remain blank. The stand aperture was initially painted above the monitor's bottom bezel; a failing browser hit-test reproduced it, and corrected stacking now places the stand behind the panel.

Design self-audit: **0/10 compositional slop tells**. This is an Explore specimen gallery with unequal device-sized regions, not a hero plus feature tiles. Existing Enochian Arial/Consolas typography and Cinnabar finish selection are intentional. Neutral gradients render physical bevels/materials, not decorative tech-gradient page backgrounds. No decorative blur, metric filler, icon toppers, or fake app dashboards were added.

## Limits
Verified in local Chromium through Python Playwright, with a direct-file offline path and local HTTP preview. No cross-browser certification, physical device behavior, native OS emulation, or exact manufacturing dimensions are claimed. The custom White/Obsidian finishes do not claim actual Apple finish availability. Interactive content inserted by consumers retains responsibility for its own accessibility, layout, sandboxing, and phone-island safe area.

No commit or push was made. The original showcase controls and their count remain unchanged; integration adds one atlas link plus documentation.
