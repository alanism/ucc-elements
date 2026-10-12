# Light Table — brief, reference mapping, evidence

Prototype: `light-table.html` (one file, no build). It uses the same design system as Command Deck v2: one red accent for "needs you now", type sizes 11 / 18 / 29 / 47, weights 400 and 600, and the Ares, Enochian Obsidian and Enochian White palettes. **All numbers are sample data.** The model names, limits, prices, regions and locations are placeholders in one `CFG` block plus the `MODELS`, `DEVICES`, `TASKS` and `AGENTS` arrays.

Open it as `light-table.html?screen=fleet|mission|operator|devices`, adding `&theme=ares|obsidian|white` to pick a palette. Other parameters: `&model=R2` (focus a model), `&task=4`, `&agent=166`, `&device=A3`, `&mapview=local`, `&mapstyle=sat`, `&sim=0` (freeze the sample data), `&bw=1`, `&flip=1`.

Keys: `1`–`4` switch screens, `←` `→` change the focused model on FLEET, `Esc` clears focus, `Z` undoes.

## Reference → use (what each Oblivion frame became)

| Frame | What I took from it | What it shows here |
|---|---|---|
| **UI_04** (R1 / R2 / R4 drone columns) | Column per unit, title row of a big code and number, plate with a lamp, two dot rings beside a stacked bar gauge, a readout left and right, a boxed percentage, a cell grid, sparklines at the foot | **FLEET.** One column per model (R1 OpenAI … R5 NVIDIA). The plate lamp shows state (red only if an agent needs you). The rings show rate-limit use for tokens in and out. The stacked bars are the context window of the 3 busiest agents, with a dashed 90% line. The readouts are tokens in/out, cache, cost, p50 latency and window size. **CTX %** is the fullest agent. The cell grid is the model's assigned tasks on the Eisenhower matrix, followed by the task list, the agent roster (id, reasoning, device, status) and the last 60 minutes of tokens in/out. The left rail covers agents live, who it reports to, tokens today with a share bar per model, spend against the budget, **NEEDS YOU** with a one-click fix, and a how-to-read key. |
| **UI_09** (instrument sheet: big ring, radial chart, half-circle wind system, velocity triangle, summary + clock) | Ring gauge with ticks, radial instrument, half-circle range rings, fan or cone, summary column with a big clock | **MISSION**, the earlier use cases again. **Batch ring:** one tick per file in 208 exports, needs-review ticks in red, ▲ marks the file running now. **Journey radial:** the 6 phases as arcs, each ◇ task in its phase, distance from the centre = difficulty (outer is easy, centre is hard). **Due pressure:** half-ellipse range rings with time to due across and importance up and down, and a red zone for due ≤ 24 h. **Delivery forecast cone:** 2,000 bootstrap runs from recent throughput, showing P50/P90 and the deadline, plus the share of runs that finish on time. **Session:** clock, counts and the selected task with its agents. |
| **UI_02** (portrait card + map + feeds rail) | ONLINE and clock, portrait card with an audio waveform, map in a lettered and numbered grid with corner marks, feeds list, view, layers and rotation controls | **OPERATOR.** The headshot is the user or the agent (USER/AGENT toggle). With no URL set it shows a generated sigil, and `CFG.operators[].avatar` takes a photo. The waveform is token throughput. The **Mapbox GL** map (your `pk.` token) is styled per palette like `map-to-poster`'s `generateMapLibreStyle`: background = land, then water, parks, three road classes and borders. **GLOBAL** shows dotted great-circle routes from you to each model's endpoint region. **LOCAL** zooms to your location and adds the 4 device markers. **TERRAIN** switches to grayscale satellite. Areas outside the data-region policy are hatched, and a route that leaves policy turns red. Latency is estimated from distance and labelled as an estimate. |
| **UI_03** (drone schematic + small drone tiles + ident row) | Schematic with callouts, device code and number, status rows, fuel bars, a grid of small unit tiles with rings, an ident strip | **DEVICES.** The schematic uses the frames from `enochian_knobs_keys/apple-devices` (laptop, display + mini, tablet, phone). Their finish follows the palette, and the screen shows the agents running on it. The small drone tiles became **subagent tiles**: id, model, reasoning level (⬡ with 0–3 bars), device, a context ring, status, and the task it is on. The diagnostics panel shows reasoning level with LOWER/RAISE, context/budget/cost fuel, the last 24 tool calls, lineage (HC → 166 → 171) and actions (COMPACT / RETRY / +25% BUDGET / PAUSE / RESUME, all undoable). The ident strip lists the user's devices. |

## The one rule for red

An agent **needs you** when any of these is true (thresholds in `CFG.thresholds`):

- **Context:** context is at least 90% of its model's window. Fix: **COMPACT**.
- **Stalled:** it is stalled. Fix: **RETRY**.
- **Budget:** it has used at least 90% of its token budget. Fix: **+25% BUDGET**.
- **Tool error:** its last tool call failed. Fix: **RETRY**.

A model is also red when its rate-limit use is at least 90%. Mission adds three red cases:

- the needs-review files in the batch;
- tasks due within 24 h;
- an on-time chance under 50%.

Operator adds a route outside the data-region policy. Nothing else is red. `lt-check.mjs` prints every element that uses the red token on each screen.

## Evidence (re-runnable)

Start a Chrome with WebGL on port 9444:

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --remote-debugging-port=9444 --user-data-dir=$TMPDIR/ltprof about:blank &
node lt-check.mjs shots "$PWD/light-table.html"
```

**98/98 checks pass:**

- Each of 3 palettes × 4 screens: renders, fits 1440×900, no overlapping text in any instrument, no clipped HTML text, **WCAG AA contrast on every visible text node** (the operator screen counts this only with the map loaded), Mapbox ready.
- Fleet: focus R2 (others dim, header chip), → / Esc, the two sample alerts, COMPACT then exact undo, RETRY, agent row → DEVICES, keys 1–4.
- Mission: the forecast is ordered (P10 ≤ P50 ≤ P90) and repeats exactly. Picking ◇04 rings it in every instrument and shows its card.
- Map:
  - 6 markers, with attribution and logo kept.
  - LOCAL adds 4 device markers that don't overlap.
  - TERRAIN shows imagery; R rotates the map 15°.
  - The routes layer toggles on and off.
  - Switching palettes restyles the map.
  - Focusing R4 highlights its route.
  - An out-of-policy route turns red in the map, the list and the legend.
- **Mapbox blocked:** the map says MAP OFFLINE, keeps the routes list, and draws a flat fallback plot.
- Devices: opens on an agent that needs you. Each device shows its frame, and the diagnostics move to an agent on that device. NEEDS YOU filter, RAISE plus undo, PAUSE/RESUME.
- 1920 / 768 / 280 on all 4 screens: no horizontal overflow and no text collisions. At 1920 everything fits the height.
- Legacy `?theme=enochian` opens Obsidian. Reduced motion means no animations and a frozen sim. With the sim on, token totals move. No console errors.

**Measured:** 4 type sizes and 2 weights on every screen. Zero running animations. One control under 24 px, Mapbox's own logo link (23 px), which their terms require me to keep.

## Known gaps

- **No real data.** Token counts, context, rate-limit use, device CPU, routes and the forecast are simulated. Wiring them means reading provider usage APIs and agent run logs. The map shows sample regions, not where any provider actually serves your traffic.
- **Mapbox configuration stays outside Git.** Optional, ignored `config.js` sets `window.ENOCHIAN_LIGHT_TABLE_CONFIG = {mapboxToken: "your public browser token"}` before the prototype loads. The published configuration is the ignored `UIUX/studies/agent-hud/light-table-config.js`; the release builder includes it with a content version. Restrict the public token to intended URLs in the Mapbox account. A clone without configuration uses the authored offline route plot; no secret is required to view the other screens.
- **Not tested on real hardware.** Mapbox ran in headless Chrome with software WebGL. There has been no touch pass, no screen-reader pass and no real-user test.
- **768 px is a stack**, not a tablet layout (the same as v2). FLEET at 768 puts the left rail above the model columns.
- **Mission instruments are view-only** (select only). Actions live on FLEET and DEVICES.

## Learning log

| # | Classification | Root cause | Fix | Prevention |
|---|---|---|---|---|
| 1 | Tooling | `element.click()` is not defined on SVG `<g>`, so the harness threw on the first matrix glyph. | Dispatch a bubbling `MouseEvent` instead. | `click()` helper in `lt-check.mjs`. |
| 2 | Contrast | Tab key hints used `--dim` (1.9–2.6 : 1 in all palettes). Alert text on the always-dark device glass used `--red-hi`, which is `#cc0000` in White (3.2 : 1 on glass). | Hints use `--muted`; the glass gets its own fixed light red. | Contrast check runs on every palette × screen. |
| 3 | Layout | Narrow widths: the forecast's day labels collided, and the journey's HARD label hit the hub. | Day-label step chosen to keep ≥ 48 px; the hub has a minimum radius and HARD only draws when it fits. | Text-collision check at 768 and 280. |
| 4 | Map | The White hatch fought the land, a focused model dimmed an out-of-policy route, and device markers stacked on YOU. | Hatch strength per palette; out-of-policy is never dimmed; device offsets spread. | Marker-overlap and policy checks. |
| 5 | State | Choosing a device left the diagnostics on an agent from another device. | Picking a device moves the diagnostics to its first agent (needs-you, then running). | Device check asserts the agent's device. |

## Files

`light-table.html` · `lt-check.mjs` (98 checks, reuses `../v2/audit-page.js`) · `lt-shot.mjs` · `shots/` (12 palette × screen shots, map local/terrain/policy/offline, device frames, 1920/768/280) · this file.
