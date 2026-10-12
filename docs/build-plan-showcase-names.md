# Build plan: simple element names and showcase release

Status: Approved by Alan on 2026-10-12 — execution in progress; test-only Playwright pin changed to 1.60.0 with Alan's explicit approval.
Date: 2026-10-12 (Asia/Ho_Chi_Minh)
Baseline: local merge commit `f404ebc`, incorporating GitHub `main` at `a581034`.

Execution intake: generator, generated JavaScript syntax checks, and standalone build passed without a source diff. Firebase read-only site listings confirmed `uiux-nonhumanintelligence` in project `nonhumanintelligence` and `uncommoncore` in project `uncommoncore` through an existing credential. The approved Python Playwright `1.64.0` install failed because no matching distribution is offered by the configured package index; `1.60.0` is available. No substitute was installed. Approval to change the test-only pin is pending.

Additional source snapshot: `alanism/Enochian-UI-UX-Elements` at `0c02c6e87bc69b714e73ff99d0335fcdef1f6b54` (`Add Apple device frame studies`), including its preceding `1ec16d7` instrument-study commit. The showcase repository itself has no newer `origin/main` commit at this intake.

## Additional source intake

46 new files were imported without changing existing source pages: seven study directories and their 27 authored test/capture/helper files. Each imported file was copied from the exact Git blob. The original source README's 55-control count is stale; use the showcase generator's actual 63-control catalog.

| Local source | Additions |
| --- | --- |
| `enochian_knobs_keys/apple-devices/` | Five Apple-inspired frame compositions, nine hardware bodies, five empty screens |
| `enochian_knobs_keys/keyboard/` | 25-note keyboard, encoders, touch strips, chord pads, optional MIDI output |
| `enochian_knobs_keys/midi-pad/` | 16-pad controller, sequencer, scenes, optional MIDI output |
| `enochian_knobs_keys/op-1/` | Composed synth keyboard, encoders, and note-event recorder |
| `enochian_knobs_keys/speakers/` | Compact audio object and portable twin-driver speaker |
| `enochian_knobs_keys/dj-decks/` | Twin jog decks with a two-channel mixer |
| `enochian_knobs_keys/tp-7/` | Pocket recorder with capture/playback of locally generated audio |
| `enochian_knobs_keys/tests/` | Authored browser acceptance, capture, and safety checks |

The seven study pages add 12 preview entries: seven composed audio/controller surfaces (the speaker page has two) and five frame compositions. Keep these counts separate from the 63 original controls.

## Requested outcome

Make every element easy to recognize, remember, spell, and find. Feature the keyboards, MIDI controllers, mixer, recorder, speakers, and Apple-inspired device frames on the main showcase pages, then release the updated entry page, unified interactive atlas, and seven additional study pages.

The unified atlas already includes 63 controls. Add a visible Devices & Instruments gallery with real rendered previews of the 12 new entries, linking to the seven self-contained study pages. Keep their interaction code isolated on those pages, preserving the original source's independent audio, preferences, and MIDI lifecycle.

## Approved naming rules, once this plan is accepted

1. Public element names use `Enochian` followed by a familiar device or control name.
2. Use two-digit numbers for closely related visual variants: `01`, `02`, `03`. Keep assigned numbers stable after this release.
3. Put the distinguishing behavior in a short subtitle, rather than inventing a new word for it.
4. Keep material names Ivory and Obsidian as finish options, separate from the element's name.
5. Keep existing runtime IDs, JS identifiers, state machines, timing, constants, audio behavior, and formulas intact. Change presentation strings and the generator's name references where needed.
6. Update titles, descriptive cross-references, accessible labels, search results, and code drawer labels consistently.
7. Retain old names and familiar synonyms as search aliases. Do not show the old names as competing catalog titles.
8. Describe simulations and recording capabilities precisely. The original synth uses Web Audio. The newly imported keyboard and MIDI pad already support optional Web MIDI output; preserve their explicit connect/output-selection flow and `sysex:false`, with no automatic connection. The original macro pad records voice-note duration, not microphone audio. The new pocket recorder captures internally generated audio, and the new synth studio records note events. The voice assistant replies are simulated. No microphone capture is added.
9. Preserve historical artwork attribution, including the proper name Sigillum Dei Aemeth, in explanatory copy.

## Complete naming map

The first 63 rows represent the public catalog. The code toggle is a shared utility and does not increase the catalog count.

| Current name | New public name | Subtitle / distinction |
| --- | --- | --- |
| Obsidian Dial | Enochian Rotary Knob 01 | Bar position marker |
| Push Button | Enochian Push Button 01 | Press and release |
| Cinnabar Key | Enochian Push Button 02 | Tap or hold |
| The Three Keys | Enochian Button Bank 01 | Three buttons; momentary or latch |
| Triad Action Keys | Enochian Button Bank 02 | Three latching buttons |
| Hollow Gate | Enochian Push Switch | Press to toggle |
| Pulse Grid | Enochian Pop Buttons | Six resettable buttons |
| Canticle Keys | Enochian Synth Keyboard | Playable octave |
| Aether Orb | Enochian Bouncing Balls | Tap to bounce |
| Cadence Pads | Enochian Drum Machine | Drum pads and step sequencer |
| Augur | Enochian Camera | Focus, exposure, and shutter demo |
| Binary Gate | Enochian Toggle Switch 01 | Standard |
| Cinnabar Switch | Enochian Toggle Switch 02 | Color signal |
| Beacon Switch | Enochian Toggle Switch 03 | Indicator lights |
| Glyph Switch | Enochian Toggle Switch 04 | On/off symbols |
| Pinch Gate | Enochian Toggle Switch 05 | Stretching knob |
| Pinch Track | Enochian Toggle Switch 06 | Long track |
| Triune Gate | Enochian Toggle Bank 01 | Three vertical switches; foundation design |
| Triune Switch | Enochian Toggle Bank 02 | Three vertical switches; compact design |
| Triune Beacon | Enochian Rocker Switch Bank | Three rocker switches |
| Lantern Row | Enochian Light Switch Bank | Independent illuminated switches |
| Interlock Bank | Enochian Input Selector | Source buttons and filter toggles |
| Orbit Gate | Enochian Rotary Switch | Quarter-turn on/off |
| Ivory Dial | Enochian Rotary Knob 02 | Dot position marker |
| Choir Dial | Enochian Stepped Knob | Fixed-position selector |
| Ordinal Veil | Enochian Segment Selector | Sliding selection marker |
| Signal Slider | Enochian Slider 01 | Continuous; ribbed grip |
| Quadrant Slider | Enochian Slider 02 | Stepped; square grip |
| Dimple Slider | Enochian Slider 03 | Continuous; dimpled grip |
| Meridian Fader | Enochian Pitch Slider | Center detent |
| Regie Bank | Enochian DJ Mixer | Linked level and tone faders |
| Aperture Scale | Enochian Radio Tuner | Sliding frequency scale |
| Penumbra Deck | Enochian Video Editor | Tone controls and timeline |
| Seeker Orb | Enochian Search Field | Expandable search |
| Mechanical Keyboard | Enochian Typing Keyboard | Mechanical text keys |
| Tally Keypad | Enochian Number Pad | Calculator and memory keys |
| Sigil Controller | Enochian Joystick | Two-axis control |
| Sigil Remote | Enochian Remote Control | Clickpad and navigation |
| Orbit Wheel | Enochian Scroll Wheel | Circular list navigation |
| Lumen Pad | Enochian Macro Pad | Layers, undo, and voice-note demo |
| Aether Receiver | Enochian Radio Player | Power, playback, and volume |
| Horologion | Enochian Clock | Analog face and digital time |
| Vigil Clock | Enochian Countdown Timer | Preset durations |
| Vigil 90 | Enochian 90 Second Timer | Single, repeated, or looped intervals |
| Pomodoro Vigil | Enochian Pomodoro Timer | Focus and break cycles |
| Strobe Platter | Enochian Turntable | Play, scrub, and speed |
| Transport Bank | Enochian Tape Deck | Playback and recording-state demo |
| Monitor Pair | Enochian Stereo Speakers | Master volume and input selection |
| Lumen VU | Enochian Analog Level Meter | Needle display |
| Lumen Context | Enochian Context Meter 01 | Two analog needles |
| Cantor Ladder | Enochian LED Level Meter | Segments and peak hold |
| Cantor Agents | Enochian Agent Monitor | Activity per agent |
| Excursion Pair | Enochian Speaker Crossover | Woofer, tweeter, and frequency split |
| Lodestar | Enochian Compass | Heading and bearing |
| Climate | Enochian Thermostat | Temperature and mode |
| Velocity | Enochian Speedometer | Speed, cruise, and limit |
| Velocity Context | Enochian Context Meter 02 | Dial and two needles |
| Triad | Enochian System Monitor | CPU, GPU, and memory |
| Triad Context | Enochian Context Meter 03 | Three rings |
| Triad Quota | Enochian Usage Monitor | Session, weekly, and model limits |
| Departures | Enochian Flight Board | Split-flap flight status |
| Manifest | Enochian Task Board | Build pipeline status |
| Aemeth | Enochian Voice Assistant | Push-to-talk and response demo |
| The Code Veil | Enochian Code Toggle | Show or hide implementation code |

The atlas toolbar continues to use the short action label `Code`. Source study switches use `Show code` / `Hide code` as their action labels.

### Additional instrument names

Use distinct names so the new complete devices do not get confused with their smaller original control patterns.

| Source label | New public name | Description |
| --- | --- | --- |
| Canticle / 25 | Enochian MIDI Keyboard | 25 notes, encoders, strips, chord pads; optional MIDI output |
| Grid16 / pad instrument | Enochian MIDI Pad | 16 pads, scenes, and a step sequencer; optional MIDI output |
| Canticle / OP study | Enochian Synth Studio | Keyboard, encoders, and note-event recorder |
| Mesh / compact | Enochian Compact Speaker | Generated audio playback; microphone-inspired physical form, without microphone capture |
| Twin / portable | Enochian Portable Speaker | Twin drivers, input selection, and playback |
| Twin decks / Duplex | Enochian DJ Controller | Two jog decks and a two-channel mixer |
| Pocket recorder / TP-7 | Enochian Audio Recorder | Record and replay internally generated demo audio |

### Apple-inspired frame names

Use familiar Enochian names for the gallery labels. Keep Apple/Mac reference attribution in explanatory source documentation, and identify these as blank frames rather than actual products or OS emulators.

| Current composition | New gallery name | Included bodies |
| --- | --- | --- |
| Display + Mac mini | Enochian Desktop Setup | Enochian Display; Enochian Mini Desktop |
| iMac + desk set | Enochian All-in-One Setup | Enochian All-in-One Computer; Enochian Slim Keyboard; Enochian Mouse |
| MacBook | Enochian Laptop | Laptop |
| iPad + Pencil | Enochian Tablet | Enochian Tablet; Enochian Stylus |
| iPhone | Enochian Phone | Phone |

Preserve all nine hardware bodies, White/Ivory and Obsidian finishes, and these five insertion slots:

| Slot | Required ratio |
| --- | --- |
| `[data-screen="display"]` | 16:9 |
| `[data-screen="imac"]` | 16:9 |
| `[data-screen="macbook"]` | 16:10 |
| `[data-screen="ipad"]` | 4:3 |
| `[data-screen="iphone"]` | 9:19.5 |

Every screen must have zero child nodes at initial load. Add no wallpaper, OS interface, sample app, image, or iframe inside a device screen. Decorative accessories stay decorative. Keep the study's original device IDs, screen selectors, containment rules, isolated preference key, and insertion/event continuity.

## Search vocabulary

Add search terms to the generated item metadata and make the existing search match those terms as well as the public name and category.

| Search term | Required matches |
| --- | --- |
| keyboard | Synth Keyboard; Typing Keyboard; MIDI Keyboard; Synth Studio; Slim Keyboard accessory within All-in-One Setup |
| midi | MIDI Keyboard; MIDI Pad; existing Synth Keyboard, Drum Machine, and Macro Pad patterns |
| dj | DJ Controller; DJ Mixer; Turntable; Pitch Slider; Drum Machine |
| mixer | DJ Mixer; DJ Controller |
| speaker / speakers | Stereo Speakers; Speaker Crossover; Compact Speaker; Portable Speaker |
| voice / voice recorder | Audio Recorder; Macro Pad; Voice Assistant, with accurate capability descriptions visible |
| recorder | Audio Recorder; Synth Studio; Tape Deck; Macro Pad |
| Apple / Mac / Mac mini / iMac / MacBook | Corresponding frame compositions, with blank-frame descriptions |
| iPad / tablet / Pencil | Tablet frame and stylus |
| iPhone / phone | Phone frame |
| toggle / switch | Numbered toggle switches and applicable switch banks |
| Canticle Keys | Synth Keyboard |
| any other old catalog name | Its corresponding renamed element |

Support the earlier names in the preserved compact export as aliases too: `Rollin' Search`, `OP-1 Keys`, `Triple Push Buttons`, `Pushin' Click Button`, `Concaved Switch`, `Fidget Poppin'`, `Standard Switch`, `Coloured Switch`, `LED Switch`, `I/O Switch`, `Pinchin' Switch`, `Pinchin' Track Switch`, `Triple Switch`, `Triple Light Switch`, `Trackin' Slider`, `Square Slider`, `Dimpled Slider`, `Round On/Off Knob`, `Joypad Controller`, and `Bouncin' Ball`. Map them to the matching canonical controls by function.

## Page changes

### Unified atlas: `/UIUX`

- Keep the existing six functional groups and all 63 controls.
- Apply the full naming map to the catalog, search, code selector, code sample headings, relevant accessibility labels, and explanatory text.
- Keep current card styling, theme controls, sound controls, finishes, and interactions.
- Retain the original-control anchors listed below and add the Devices & Instruments section after the existing control catalog. Add anchors without replacing runtime IDs or existing source article IDs.
- Update hero copy to describe the catalog in familiar terms: keyboards, switches, mixers, speakers, timers, and monitors. Replace references to opening the Code Veil with opening Code.
- Show 12 preview entries using actual browser-rendered instrument/frame images, with light and dark variants, a familiar name, a short capability description, and a link to the working study. Capture the authored objects rather than generating product illustrations. Preserve the existing page's visual style.
- Search covers both the 63 original controls and the 12 new preview entries. Code mode still selects the 63 existing control snippets; new study entries link to their full self-contained source instead of fabricating snippets.
- Give preview entries a separate study class and metadata. Keep the existing control-item count and code-selection collection separate from the expanded search collection, so gallery additions cannot trigger the atlas's control-count error.
- Display `63 controls` and `12 device studies` separately; retain the six existing control families.

### Seven published study routes

Generate each public study from its imported canonical source at `/UIUX/studies/<folder>/index.html`, with the folder names in the intake table. Publish only the seven HTML study pages, not their tests or verification artifacts. Preserve sibling study links. Rewrite only the study links targeting `../index.html` to `/UIUX` in the generated public copy so Back to showcase works on both hosts. Keep source-relative navigation usable in the authored files.

Use the existing Apple composition IDs `display-study`, `imac-study`, `macbook-study`, `ipad-study`, and `iphone-study` for direct frame links. Speaker links target the appropriate existing object section. Preserve all runtime/event IDs and isolated storage keys.

Screenshot preview files live under `UIUX/previews/`, with deterministic filenames per study/object and finish. Produce 24 previews (12 entries × 2 finishes), capture reduced-motion settled states without enabling sound or MIDI, and emit fixed image dimensions and descriptive alt text. Frame previews show blank screens. Build filenames/URLs must change when preview content changes to avoid stale images.

### Root landing page: `/`

Update the existing Enochian entry card and add a concise set of feature links using the page's current visual style. Show the shared rendered previews for the newly imported instrument pages and frame gallery, without duplicating interactive implementations.

| Feature label | Destination anchor | Description |
| --- | --- | --- |
| Enochian Typing Keyboard | `/UIUX#showcase-typing-keyboard` | Tactile keys for text input. |
| Enochian Synth Keyboard | `/UIUX#showcase-synth-keyboard` | Play an octave with pointer or keyboard. |
| Enochian DJ Mixer | `/UIUX#showcase-dj-mixer` | Adjust linked levels, bass, and treble. |
| Enochian Drum Machine | `/UIUX#showcase-drum-machine` | Play pads and sequence a beat. |
| Enochian Turntable | `/UIUX#showcase-turntable` | Play, scrub, and adjust speed. |
| Enochian Stereo Speakers | `/UIUX#showcase-stereo-speakers` | Control volume and choose an input. |
| Enochian Voice Assistant | `/UIUX#showcase-voice-assistant` | Try the push-to-talk interaction demo. |

Retain the original-control links above inside the relevant descriptions, and feature the new complete devices as the primary study links:

| Feature | Destination |
| --- | --- |
| Enochian MIDI Keyboard | `/UIUX/studies/keyboard/` |
| Enochian MIDI Pad | `/UIUX/studies/midi-pad/` |
| Enochian Synth Studio | `/UIUX/studies/op-1/` |
| Enochian DJ Controller | `/UIUX/studies/dj-decks/` |
| Enochian Speakers | `/UIUX/studies/speakers/` |
| Enochian Audio Recorder | `/UIUX/studies/tp-7/` |
| Enochian Device Frames | `/UIUX/studies/apple-devices/` |

The primary button becomes `Open the full showcase` and links to `/UIUX`. Describe its scope as `63 controls + 12 device studies`. Keep the existing link to the toggle study and rename its label to `Code toggle study`.

### Original source studies and preserved exports

Apply the same visible names to the three canonical source pages, the two tracked standalone exports, and the seven imported study pages. Preserve each export's own implementation, including any differences from the canonical source. Update the code-toggle study's visible naming where relevant. Update imported study README titles and visible-name references, while retaining original verification reports as historical evidence.

An untracked `enochian_knobs_keys/index 2.html` is currently present. It has the same catalog titles as the foundation source. Treat it as a local duplicate pending provenance; it is not a canonical source or a release input.

## Phases and gates

### Phase 0 — Readiness

1. Record the starting commit, working-tree state, and a release run ID based on the full release commit and timestamp.
2. Preserve existing local-only directories and the untracked duplicate page.
3. Confirm Python 3, Beautiful Soup 4, Node, and the pinned Firebase CLI are usable. Beautiful Soup successfully parsed the source files during plan preparation.
   The imported tests require Python Playwright plus Chromium. Neither the current Python nor bundled Python has Playwright installed at revised-plan intake. Use the isolated, test-only environment with `playwright==1.60.0`, explicitly approved by Alan after the unavailable 1.64.0 pin failed. Record the interpreter/browser versions, and stop on installation failure rather than silently selecting another version. Add no application runtime dependency.
4. Run the existing generator, JS syntax checks, and standalone build as a baseline. Review any resulting diff before continuing.
   Run the full imported unittest suite from `enochian_knobs_keys/` before renaming any sources. The original author's reported passes are reference evidence, not local validation.
5. Use Firebase read-only account and site listing commands to confirm deployment credentials and ownership of both showcase sites. Use explicit project IDs for release commands.
6. Inspect the proposed release files for credentials and confirm that no private/local-only directories enter either payload.

Gate: all required tools work; both the original catalog baseline and imported acceptance suite pass; site ownership and credentials are confirmed; release staging has a known boundary. Stop on unrelated baseline failures or missing credentials. The sole planned dependency addition is the approved isolated test environment above; broaden nothing to bypass a blocker.

### Phase 1 — Apply names

1. Rename human-facing titles, subtitles, references, and accessible labels in canonical sources and tracked exports using the map above.
   Apply the additional instrument and device-frame maps too. Update only name-dependent test assertions where the new approved labels change the specified output; preserve geometry, behavior, safety, and accessibility assertions.
2. Update existing generator name lists, featured/wide sets, and name-dependent selectors consistently. Keep the order and control membership unchanged.
3. Keep the approved old-to-new mapping and alias terms in the existing generator so emitted search metadata is deterministic.
4. Make generation fail if display names are duplicated or the catalog membership differs from the expected 63 controls.
5. Update the existing atlas search to match the emitted alias terms. Keep search results and code drawer labels on the new public names.

Gate: 63 unique control names plus 12 unique study preview names; one shared code utility; no missing or extra controls or study entries; every old name resolves to its corresponding renamed element; all numbered variants remain distinct.

### Phase 2 — Update discovery and build

1. Add the seven public anchors and root feature links defined above.
2. Update the root card's description and primary destination to the complete atlas.
3. Regenerate `UIUX/index.html`, `UIUX/controls.css`, and `UIUX/controls.js` from the canonical sources.
   Extend this generation/build pipeline to emit the seven public study pages, navigation corrections, 12 preview entries, and common search metadata. Capture the 24 real-browser preview images after labels are finalized. Package these new pages and images into both release payloads.
4. Build twice and compare generated content hashes to verify deterministic output.
5. Extend the existing build script with a root-showcase release mode. Use a separate marked `.showcase-dist` directory, while retaining the existing `.uiux-dist` atlas build.
6. Add a focused `firebase.showcase.json` configuration containing only the `uncommoncore` Hosting site, pointing at `.showcase-dist`. Preserve that site's existing redirects, API rewrite, Vietnamese page rewrite, and cache headers from `firebase.json`.
7. Build the root payload from tracked public files under `index.html`, `toggle.html`, `UIUX/`, `enochian_knobs_keys/`, and `learnvietnamese/`. Keep the Vietnamese runtime and audio assets so existing routes remain available. Apply the existing dotfile exclusions. Exclude local-only files, `.hermes/`, the Weyland directory, `docs/skin/`, and the untracked duplicate HTML page.

Gate: every landing/study link targets an existing element or page; both payloads contain only intended public files; imported tests/QA files are excluded; existing runtime routes and hosting rewrites remain intact; repeated HTML/CSS/JS generation produces identical content. Screenshot images use recorded source/finish/browser versions and content hashes; do not require nondeterministic browser raster captures to be byte-identical across different machines.

### Phase 3 — Local validation

Use the repository's existing commands:

```bash
python3 scripts/generate_uiux.py
node --check UIUX/controls.js
node --check UIUX/atlas.js
python3 scripts/build_uiux.py
python3 scripts/build_uiux.py --showcase
python3 -m http.server 8080
```

`--showcase` is the planned build-script extension from Phase 2.

Also run the imported authored suite and device captures with the isolated test interpreter, from `enochian_knobs_keys/`:

```bash
python -m unittest discover -s tests -v
python tests/capture_apple_devices.py
python tests/capture_controllers.py
python tests/capture_speakers.py
python tests/capture_transports.py
python tests/capture_op1.py
python tests/capture_finishes.py
```

The source tests must all pass locally; do not assume the original report's test count remains authoritative. Record the actual count. Keep generated `.qa/` artifacts out of both releases.

Required browser checks at desktop width (1440px) and mobile width (390px), in both Light and Dark:

- All 63 catalog items render once; all names and code drawer options agree.
- All 12 device preview entries render and link correctly; seven generated study pages load and navigate back to `/UIUX` and to their sibling studies.
- The seven landing links arrive at the intended controls with their headings visible.
- Search finds every required vocabulary entry and old-name alias; no-match and clearing search still work.
- Toggle Switch 01–06 operate by pointer and keyboard; both toggle banks retain independent state.
- Typing Keyboard accepts input; Synth Keyboard plays and releases notes; Drum Machine pads and sequencing work; Turntable plays and scrubs; DJ Mixer faders and linking work; Stereo Speakers adjust volume, standby, and inputs.
- Macro Pad and Voice Assistant retain their existing demo behavior and clear descriptions.
- New MIDI Keyboard and MIDI Pad start muted with no MIDI request or selected hardware output. Preserve held-note ownership, release/panic/blur behavior, and independent finishes. MIDI boundary tests remain explicitly mocked; physical MIDI hardware is not required or claimed as verified.
- New DJ Controller preserves jog, cues, EQ, gains, sync limits, and safe stop/blur behavior. Synth Studio preserves note-event capture and replay. Audio Recorder preserves its generated-stream capture, 30-second bound, cleanup, and unsupported-codec error handling. Compact/Portable Speakers preserve independent playback, volume, finish behavior, and cleanup.
- Device-frame gallery contains all nine hardware bodies and five blank screen slots at the specified ratios. Both finishes work by click/Enter/Space with exclusive pressed state and isolated storage. Invalid/blocked storage works. Check the source's 1440, 768, 390, and 280px capture widths with zero page overflow, clipped measured hardware, undersized finish/navigation controls, or occluded control centers.
- Device frames preserve screen geometry with inserted tall/wide synthetic test images and preserve inserted content/event listeners across finish changes. Remove fixtures from screenshots and the release; all shipped screens remain blank. Match the imported aperture ratio tolerance of 0.02 and visible-label contrast threshold of 4.5:1.
- Code drawer opens, selects the renamed control, copies its sample, and closes; theme and sound work.
- Existing operations-guide checks pass for the seal's 60 clock tick lines, voice states, seven timer/AI gauges, desktop ring/chart layout, and dark-mode text.
- No uncaught page errors; wide hardware is usable within its current mobile scrolling layout; pointer and keyboard focus remain usable.

Gate: every required check and the imported authored suite passes. Any integration-specific regression coverage supplements those tests rather than weakening or replacing them.

### Phase 4 — Release and verify

Deploy the dedicated atlas and root showcase separately. The user's earlier request to deploy remains the release authorization once this plan is approved and its gates pass.

1. Dedicated atlas: `uiux-nonhumanintelligence`, project `nonhumanintelligence`, using the existing documented command:

```bash
npx --yes firebase-tools@15.33.0 deploy --only hosting --project nonhumanintelligence --config firebase.uiux.json --non-interactive
```

2. Root showcase: `uncommoncore`, using the focused single-site configuration from Phase 2:

```bash
npx --yes firebase-tools@15.33.0 deploy --only hosting --project <confirmed-project-owning-uncommoncore> --config firebase.showcase.json --non-interactive
```

Resolve the root site's project via the Phase 0 account/site checks. `.firebaserc` currently names `uncommoncore`, but that is not proof of site ownership. Replace the placeholder with the verified ID before execution. Stop if ownership cannot be established.

3. Record release IDs and deployed commit. Verify HTTP 200 for the landing/atlas pages, all seven study pages, all 24 previews, and local assets. Repeat landing/study links, names, search, theme, code, representative hardware interaction, and blank-device-screen checks against both deployed showcase hosts.
4. Use the documented default Hosting URLs. Announce a custom domain only after its actual hosting/certificate status is confirmed.
5. If a new release fails and cannot be corrected within this plan, restore that site's prior healthy release and report the failed gate.

Gate: successful Hosting release on both sites; updated names and working interactions observed on the live pages; all release assets return successfully.

The `104kdli` Hosting site and its backend are outside this release. Avoid the root config's blanket `--only hosting` deployment, which would include both sites.

### Phase 5 — Operations and learning

- Update `README.md` and `docs/operations.md` with simple names, search behavior, both targeted release procedures, healthy-state checks, and recovery guidance.
- Append an implementation/release entry to `docs/learning-log.md`, recording changes, failures, root causes, fixes, prevention, release IDs, and unresolved risks.
- Provide the requested implementation report with files, commands/results, deviations, risks, and learning capture.
- Keep GitHub pushing separate from Hosting deployment; this plan authorizes code edits and Hosting release, not an additional push to GitHub.

## Expected files

Existing files likely to change:

- `index.html` — familiar device descriptions and direct atlas links.
- `enochian_knobs_keys/index.html` — foundation control labels and references.
- `enochian_knobs_keys/volume-2/index.html` — instrument labels and references.
- `enochian_knobs_keys/volume-3/index.html` — compact control labels and references.
- `enochian_knobs_keys/enochian-elements-vol2.html` and `enochian-elements-vol3.html` — consistent labels in preserved exports.
- `enochian_knobs_keys/toggle.html` and root `toggle.html` — code utility naming where present.
- `scripts/generate_uiux.py` — label references, aliases, anchors, and name validation.
- `scripts/build_uiux.py` — focused root-showcase payload option.
- `UIUX/shell.html` and `UIUX/atlas.js` — familiar copy, alias search, and name-dependent selectors.
- `UIUX/atlas.css` — only if anchor offset or landing-link usability requires a small existing-style adjustment.
- Generated `UIUX/index.html`, `UIUX/controls.css`, and `UIUX/controls.js`.
- The seven newly imported study `index.html` files and README files — simple public names and accurate capabilities.
- Imported `enochian_knobs_keys/tests/` — only expected visible-name strings if necessary; all original safety/behavior gates retained.
- Generated `UIUX/studies/<folder>/index.html` pages and `UIUX/previews/` image assets — dedicated working studies and visible previews.
- `README.md`, `docs/operations.md`, and `docs/learning-log.md`.

One planned configuration addition: `firebase.showcase.json`, for the single root showcase site.

## Dependencies, risks, and stop conditions

- No new application package dependency, microphone permission, voice API, or backend is part of this plan. The explicitly approved isolated Python Playwright/Chromium test environment is the development dependency addition.
- Preserve the imported optional MIDI connection flow without expanding permissions, requesting sysex, or connecting automatically. This is existing authored behavior in the new studies; no new MIDI integration is designed here.
- Python/Beautiful Soup, Node, test-only Python Playwright/Chromium, CDN assets for the original atlas, Firebase CLI authentication, and access to the two existing Hosting sites are the external requirements. The new study pages themselves are self-contained and have no runtime asset requests.
- Name-dependent selectors and code-sample titles can break if a rename is incomplete; validation must cover source, generator, and browser together.
- Publishing from the raw workspace could upload local-only artifacts; both releases must use curated staging directories.
- Firebase root site ownership is unverified at draft time; resolve it before editing and release.
- The original source studies, preserved exports, and new composed instruments contain related implementations. Rename each in place; do not replace one with another, combine their global runtimes, or silently discard differences.
- Apple frames are empty HTML/CSS insertion surfaces. Adding content later is a separate task; this release must not introduce untrusted HTML, remote iframe content, uploads, or OS screens into those slots.
- A new local duplicate `index 2.html` appeared after the pull. Preserve it and exclude it from release inputs unless Alan specifically designates it as canonical.
- If approval changes naming, page scope, or targets, update this draft before implementation. If implementation requires new behavior, dependencies, thresholds, permissions, or backend changes, stop and report the smallest safe pivot.

## Approval requested

Approve both naming maps, the device-frame names, the expanded landing/atlas discovery, seven public study pages and 24 previews, the isolated test-only dependency, and release to both the `uncommoncore` root showcase and existing dedicated UIUX showcase. Implementation starts after Alan approves this revised plan, as required by the supplied AGENTS.md contract.
