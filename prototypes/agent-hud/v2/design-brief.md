# Command Deck v2 — design brief, council notes, rubric scorecard

Prototype: `command-deck-v2.html` (one file, no build). Options **A · Darkstar** and **B · Plan view** share all data, panels and interactions; only the matrix and journey forms differ. Data is synthetic (18 tasks from email + PRD for editing the 26 images in `~/Downloads/gmunk-topgun`). Nothing is wired to real email or a PRD yet.

Open: `command-deck-v2.html?v=a` or `?v=b` · `&theme=ares|obsidian|white` · `&metric=difficulty|files|tokens|cost` · `&sel=t4` · `&bw=1` (grayscale reset) · `&flip=1` (upside-down) · `&scale=8` (208-tile batch) · `&filter=EMAIL|PRD|blocked` · `&phase=2` · `&sim=0` (stop the batch simulation).

## 1. Why v1 felt gimmicky (root cause)

v1 spent its effort on the look and not on the job. Each of these is measured or visible in `shots/v1-ares-1440.png`:

- **Effects with no meaning:** perspective tilt, rotating sweep, glow filters, scanlines, vignette, 11 running animations.
- **Four competing accent hues** (red, green, amber, orange), so nothing was the one thing to look at.
- **No action.** The detail panel at rest said “hover a diamond…”. A user could look but not do anything.
- **Not a screen.** 1269 px tall at 900, so it scrolls. Overflows to 367 px at 280. 26 text nodes under 8 px at 280.
- **No keyboard path, no undo, no filter.**

Fix: decide what the person does first (see §3), make everything else quiet, and make the screen answer “what now?” at rest.

## 2. The council (one model, three lenses)

> These are one-model lens analyses, not three independent reviewers. Cards are advisory; the user’s brief and the `gmunk-topgun` references control. Jayse’s card says *do not activate for purely functional interfaces with no audience/story requirement*, which describes this dashboard. So I took his hierarchy rules, not his cinematic ones, and said so below.

| Hero | Role here | Operating question (from the card) | What was taken | What was declined |
|---|---|---|---|---|
| **Jayse Hansen** | Lead designer | Does this UI clarify the story in under 24 frames? | Rule 6: mono base + **one accent**. Rule 10: **B/W reset** and flip test, both built in as buttons and run in the harness. Rule 4: **shape language** (◇ task, ▢ blocked, ○ phase). Rule 7: strip embellishment. Rule 9: no flash-on/off; each contact arrives individually. Veto: “data without story purpose” — every number on screen answers a question. Veto: cluttered, no negative space. | Rule 8 volumetric depth and the tilt (the v1 gimmick). Rule 9’s 800-layer bespoke keyframing (his own failure mode: perfection paralysis). “Make it magical” for a film audience. |
| **Raphael Schaad** | Interaction | Does it feel right in real time, with real latency and state? | Latency: hover preview and select render in ≈3 ms (measured). Hover discipline: hover only *previews*; click pins; nothing is hidden behind hover. Keyboard: ↑↓ select, ⇧+arrows move, Z undo. Verbs over nouns: idle detail = “SUGGESTED NEXT · START”. Software voice: toasts like “T07 moved: SCHEDULE → DO FIRST”. Micro-type: tabular figures, true “−”. | Pixel-perfect polish of every toast permutation (his failure mode). |
| **Andy Allen** | Feel | Does it make you want to spend time with it, not just get through it? | Reversible play: drag a contact, see a live readout, release, undo. Big hit areas: contacts have a 44 px hit target. One purposeful motion beat (arrive, pin pulse). | His card’s own failure mode — “may feel gimmicky to pure-utility users” — was the user’s complaint. So: no skins, no particles, no game-feel layering, no Easter eggs. |

Arbitration used: when Andy’s “savour it” conflicted with Jayse’s “one accent, negative space” and Schaad’s “latency is the interface”, the lead (Jayse) and the user’s complaint (“gimmicky”) won.

## 3. Product brief (one paragraph)

**User:** someone running a project whose tasks arrive from email and a PRD, and whose work includes processing many files. **Job:** decide what to do next, see whether it is blocked, and watch a batch finish. **Smallest complete solution:** a ranked queue, one plot (importance × urgency), a detail/action dock, a journey strip, and a batch wall. **Success on attempt #100:** the same screen still answers “what now?” in one look, and nothing on it moves unless something changed.

## 4. Design system (the rules the screen obeys)

- **Three themes (one set of roles, three palettes).** **Ares** (dark, navy + crimson), **Enochian · Obsidian** (dark, black + red, the old “Enochian”), **Enochian · White** (light, white + red). Switch in the header or `?theme=ares|obsidian|white` (`?theme=enochian` still maps to obsidian). In White the ramp keeps its meaning: light = easy, dark = hard; red stays `#cc0000` (not the lighter coral) so it holds contrast on white; the red/steel quadrant tints are lowered to about half so they do not wash out the page. White and Obsidian share every layout, size and interaction rule.
- **Accent:** red means “needs you now”: DO FIRST, blocked, needs-review, nothing else. Everything else is neutral (ink, cool steel). Palettes are the existing Ares and Enochian values.
- **Shape language:** ◇ task, ▢ blocked task, dashed ◇ done, ringed ◇ running, ○ phase node (A only), ■ file tile. A non-colour cue is required for every state.
- **Type ramp (×1.618 from 11):** 11 / 18 / 29 / 47. Weights 400 and 600 only. IBM Plex Sans + Mono, tabular figures.
- **Space:** 4 · 8 · 16 · 24 · 48. 12-column grid (6×2), 16 px gutter, 24 px side margin. Panel header 40 px everywhere.
- **Motion:** one-shot only. Contacts arrive in a short stagger; selection pulses once. No loops. Reduced-motion removes all of it (measured 0 running animations).
- **Template:** project, phases, metrics (difficulty / files / tokens / cost), pipeline steps and thumbnail folder are in one `CFG` block; tasks are one `TASKS` array. Add a metric by adding one line.

## 5. A vs B

| | A · Darkstar | B · Plan view |
|---|---|---|
| Matrix | Round radar (Darkstar PR NAV): crosshair, range rings, DO FIRST wedge tinted. Plot data area 27.1% of the panel. | Square plot with a 10% inset so extreme tasks never hit the quadrant labels; four tinted zones. Data area 64.1%. |
| Journey | Node track: ○ milestones on a line, task glyphs stacked under each phase. | Zone strip: a column per phase with task chips and a “▲ NOW” marker. |
| Reads best for | Quick triage: where is the pressure? (calm, more negative space) | Precision: read an exact urgency/importance value off the axis (denser, 0–100 ticks). |
| Cost | Smaller plot, so smaller contacts. Under 440 px wide it falls back to B’s rectangular plot. | Journey columns look half-empty at 1440×900. |
| Rubric (builder-scored) | 38 / 40 | 34 / 40 |

**Recommendation:** ship **A** for the main view, and use B’s rectangular plot when the viewport is narrow (already automatic). The decision to confirm: whether the dock should show the task’s file thumbnails by default or only on expand (they are the heaviest thing in the dock).

## 6. What changed v1 → v2

| v1 | v2 | Driven by |
|---|---|---|
| Tilt, sweep, glow, scanlines, vignette | Removed; one-shot arrive and pin pulse | Jayse (rules 7, 9), user complaint |
| 4 accent hues | 1 accent, red = needs you | Jayse rule 6 |
| Idle detail: instructions | Idle detail: “SUGGESTED NEXT” + START | Schaad (verbs over nouns) |
| No actions | START / BLOCK / MARK DONE / UNBLOCK / RETRY, each undoable (Z) | Schaad, Andy |
| Label-only matrix | Drag to re-prioritise, ⇧+arrows nudge, live readout, undo | Andy (reversible play), Schaad (keyboard) |
| No queue | Ranked queue grouped by quadrant, with filters (email / PRD / blocked / phase) | Product brief |
| Tile wall with colour-only states | Tiles with a non-colour cue for needs-review; ETA footer labelled SIMULATED | Jayse B/W reset, honesty |
| 12 font sizes, 3 weights | 4 sizes, 2 weights | Satori L5, L6 |

## 7. Rubric: Satori 10×10 (Engineering_Council 2 / “The Satori Grid & Slide Layout Rubric.md”)

**How to read this.** The rubric is written for slides and has no numeric scale. I score each item **2 = meets, 1 = partial, 0 = misses**. The basis column says whether the score comes from an **M**easurement (instrument output in `audit.json`) or from my **J**udgement. These are **builder self-scores from one model**. Measured items are only “measured against my own targets”; a fresh reviewer should be expected to remove points from the judged ones. Where the rubric speaks of slides (platform = Instagram/LinkedIn), I mapped it to the nearest dashboard equivalent (viewport width).

| | v1 | A · Darkstar | B · Plan view | max |
|---|:-:|:-:|:-:|:-:|
| Layers | 5 | 20 | 19 | 20 |
| Criteria | 5 | 18 | 15 | 20 |
| **Total** | **10** | **38** | **34** | **40** |
| of which measured (M) | 2 | 20 | 20 | 20 |
| of which judged (J) | 8 | 18 | 14 | 20 |

### The 10 architectural layers

| Item | Basis | v1 | A | B | Evidence |
|---|:-:|:-:|:-:|:-:|---|
| L1 Spatial canvas / structural net | J | ◐ 1 | ✓ 2 | ✓ 2 | A/B: plot on the vertical axis of the page (cols 4–9); crosshair on the panel midpoint; DO FIRST on the diagonal. v1: radar left, empty lower-right. |
| L2 Structural grid | M | ✗ 0 | ✓ 2 | ✓ 2 | v2: 12-col (6×2) grid, 16 px gutter, 24 px side margin; row splits 3/6/3 and 8/4. v1: ad-hoc 1.3fr/1fr. |
| L3 Spacing echo | M | ✗ 0 | ✓ 2 | ✓ 2 | Spacing on the 4-pt grid — v1 35.9% · A 96.2% · B 94.9%. On the 8-pt grid — v1 25.8% · A 75.2% · B 71.9% (the rest: fractional grid widths, 1–3 px borders). |
| L4 Negative space (macro vs micro) | J | ◐ 1 | ✓ 2 | ◐ 1 | A: open field around the radar disc (data area 27.1% of the panel), rows tight at 32 px. B: plot fills 64.1% but the journey columns are half empty at 1440×900 (passive space). |
| L5 Type ramp (×1.618 from 11) | M | ✗ 0 | ✓ 2 | ✓ 2 | Distinct sizes — v1 12; v2 exactly 11 · 18 · 29 · 47. |
| L6 Weight pairing | M | ◐ 1 | ✓ 2 | ✓ 2 | Weights — v1 ['300', '400', '500'] (100-unit steps, 300 vs 400 hard to tell at 10 px); v2 ['400', '600'] (200-unit jump). |
| L7 Leverage points / focal primacy | J | ◐ 1 | ✓ 2 | ✓ 2 | v2 Attract = 47 px “06 DO FIRST” + red quadrant; Intrigue = the plot; Deliver = the only filled button (START). v1: red wedge, nothing to act on. |
| L8 Eye choreography (Entry → Proof → Action) | J | ◐ 1 | ✓ 2 | ✓ 2 | v2 Z-path: count (top-left) → plot (centre) → action (top-right). v1: radar, then an instruction panel. |
| L9 Friction vs flow | M | ✗ 0 | ✓ 2 | ✓ 2 | v2: --red-hi is used on 5 selectors, all “needs you now” (printed by v2-check.mjs). v1: red + green + amber + orange + sweep + 11 running animations. |
| L10 Transferability (1920 / 768 / 280 / 64) | M | ✗ 0 | ✓ 2 | ✓ 2 | v2: no horizontal overflow at 1920, 1440, 768, 280; no clipped or overlapping matrix text at 280 (4 selections); at 64 px only the hero number, red quadrant and white button survive. v1 (measured): 1269 px tall at 900 (scrolls), overflows to 367 px at 280, 26 text nodes < 8 px at 280. |
| **Subtotal /20** | | **5** | **20** | **19** | |

### The 10 performance criteria

| Item | Basis | v1 | A | B | Evidence |
|---|:-:|:-:|:-:|:-:|---|
| C1 10-second intention test | J | ◐ 1 | ✓ 2 | ✓ 2 | My own probe (not a fresh viewer). v2: purpose, focal point and first action are all readable. v1: purpose readable, no first action. Counts only after a 5-person test. |
| C2 Cognitive relief threshold | M | ✗ 0 | ✓ 2 | ✓ 2 | Running animations after load — v1 11, v2 0; with reduced-motion on, v2 0. |
| C3 Active vs passive negative space | J | ◐ 1 | ✓ 2 | ◐ 1 | A: the empty field leads the eye to the DO FIRST wedge. B: half-empty journey columns are passive. |
| C4 Temporal flow (impact · linger · release) | J | ✗ 0 | ◐ 1 | ◐ 1 | v2: arrive (≈0.75 s stagger) → pin pulse (0.7 s, once) → toast (5 s). Timing was never frame-captured, so partial. |
| C5 Contrast & isolation | M | ◐ 1 | ✓ 2 | ✓ 2 | One unique hue (red) for one job, “needs you”. v1: four competing hues. |
| C6 Spacing harmonics | M | ✗ 0 | ✓ 2 | ✓ 2 | Same measurement as L3. |
| C7 Mathematical type proportionality | M | ✗ 0 | ✓ 2 | ✓ 2 | Line-heights on an 8-pt multiple — v1 0% (all `normal`), v2 94% (16/24/32/48 for 11/18/29/47; the rest are 22–30 px chip lines inside 24–32 px boxes). |
| C8 Platform / aspect adaptability | J | ✗ 0 | ◐ 1 | ◐ 1 | Works at 1920, 1440, 768, 280; A falls back to the rectangular plot below 440 px. At 768 it is one ≈2.2k px stack: functions everywhere, tailored nowhere. |
| C9 Emotional shape psychology | J | ◐ 1 | ✓ 2 | ◐ 1 | A: ◇ task (sharp = act), ▢ blocked (square = stuck), ○ phase node (circle = flow). B uses only ◇ ▢. |
| C10 Controlled grid disruption | J | ◐ 1 | ✓ 2 | ◐ 1 | A: one disc + one red wedge in a rectilinear grid. B: nothing deliberately breaks the grid. |
| **Subtotal /20** | | **5** | **18** | **15** | |


**Scores I would expect to drop under independent review:** C1 (a real 5-person 10-second test has not been run), C4 (no frame capture of timing), C8 (768 is only a stack).

## 8. Evidence (all re-runnable)

Run from this folder with a Chrome on port 9444 (`--headless=new --remote-debugging-port=9444`):

- `node v2-check.mjs shots "$PWD/command-deck-v2.html"` → **55/55 checks pass** for both options. They cover: renders 18 contacts and 18 queue rows; no page scroll at 1440×900; click, hover-preview and ArrowDown selection; drag with live readout, commit and exact undo; ⇧+arrow nudge; blocked/phase filters; status actions; failed-file retry; idle suggestion + START; no horizontal overflow at 768 and 280; no overlapping or clipped matrix text at 280 for four selections; non-colour cues; no console errors.
- `node v2-audit.mjs audit.json …` → type sizes and weights, WCAG contrast of every visible text node, spacing multiples, tap targets, tag/glyph collisions, running animations, render time.
- `shots/` → idle, selected, drag, file, 1920, 768, 280, Enochian, x8 batch, **b-bw / a-bw**, **b-flip / a-flip**, **a-64-x10 / b-64-x10**, and `v1-ares-1440.png` as the baseline.

| Measured | v1 | v2 (A / B) |
|---|---|---|
| Text contrast (WCAG AA) | 121/125 (fails: header labels 2.65:1) | 215/215 · 229/229 |
| Controls under 24 px | 0 of 12 (only 12 controls) | 0 of 58 |
| Matrix tag overlaps | 0 | 0 |
| Page height at 900 | 1269 px | 900 px (fits) |
| Render time, whole screen | n/m | 4.21 ms · select 3.05 ms |

Grayscale reset and the 64 px thumbnail found two real defects, both fixed and now tested: **needs-review tiles looked identical to done tiles** (now a “!” glyph), and **DO FIRST dimmed when colour was removed** (now a bar and underline). They also found one accent leak, the live phase column in B was red (now neutral).

## 9. Known gaps (not tested or not done)

- **No real users.** The 10-second test was run by me looking at screenshots.
- **No real data.** Email and PRD intake, persistence, and real batch progress are all simulated. Moves reset on reload.
- **No screen-reader testing.** The plot is `role="img"` with the queue as its text equivalent; contacts are not tab stops (keyboard users use the queue and ⇧+arrows). Queue rows use `role="option"` on buttons, which a real AT pass may want changed.
- **No touch device test.** Drag uses pointer events and `touch-action:none`, but was only driven with a mouse in headless Chrome.
- **768 is a stack, not a layout.** There is no two-column tablet design.
- **Tile wall at ×8** uses 10 px tiles and drops the “!” glyph (too small); it keeps an inset ring and the filter dimming only.
- **Z undo** also fires with Cmd/Ctrl+Z. It is unscoped and would clash with real text inputs when the app grows (the handler already skips inputs).

## 10. Learning log

| # | Classification | Root cause | Fix | Prevention |
|---|---|---|---|---|
| 1 | Bug · stale hover | Re-rendering removes the node under the cursor, so `pointerout` never fires and the dock kept a stale preview. First seen as a failing “NEEDS REVIEW → RETRY” check (file pinned, dock showed something else). | After every render, recompute hover from the last pointer position. | Harness checks “hover shows PREVIEW without changing pin” and the retry flow. |
| 2 | Bug · input arbitration | A resting mouse took the dock back right after a keyboard selection. | `KB` flag: keyboard drives until the pointer moves 2 px. | Harness drives ArrowDown with the mouse parked. |
| 3 | Design defect · clipping | Radar sized by height only; `URG ±` labels sat outside a 262 px-wide viewport. | Side gutter in the radius; below 440 px the radar falls back to the rectangular plot. | Harness checks four selections at 280 px for clipped and overlapping text. |
| 4 | Design defect · colour-only encoding | Needs-review vs done tile differed by hue only; DO FIRST emphasis was hue only. | “!” glyph, group bar, underline. | B/W reset is a header button and a screenshot in the harness. |
| 5 | Design defect · accent leak | Live phase column used the red reserved for “needs you”. | Neutral ink/steel for “now”. | v2-check prints every selector that uses `--red-hi`. |
| 6 | Process | First harness run died on a thrown `evaluate`; later runs raced page load. | `load()` waits for `window.__deck` and the contacts. | — |
| 7 | Process | The 280 px check first looked only at horizontal overflow, so clipped and overlapping labels slipped through until I looked at screenshots. | Added text-overlap and clip probes at 280 px. | They run in `v2-check.mjs`; tag/glyph collisions run in `audit-page.js`. |

## 11. Task board

- [x] Read the three hero cards and the Satori rubric
- [x] Name the root cause of “gimmicky” (v1 effects served the look, not the job)
- [x] Build A and B on one shared data/interaction layer
- [x] Queue, dock, journey, batch wall, filters, drag, undo, keyboard
- [x] Harness: 49/49 interaction and layout checks
- [x] Audit: type, contrast, spacing, targets, collisions, motion, perf
- [x] Jayse tests: B/W reset, flip, 64 px thumbnail
- [x] Fix what those tests found
- [x] Score A, B and v1 against the Satori rubric (self-scored, basis marked)
- [ ] Five-person 10-second test (needs real people)
- [ ] Screen-reader and touch-device pass (needs the devices)
- [ ] Wire real email/PRD intake and persistence
- [ ] Decide A vs B with Alan; then retire the other

## 12. Files

`command-deck-v2.html` · `v2-check.mjs` · `v2-audit.mjs` · `audit-page.js` · `audit.json` · `scorecard.json` · `shots/` · this file. The earlier `../command-deck.html` (v1) and `../matrix-journey.html` are unchanged.
