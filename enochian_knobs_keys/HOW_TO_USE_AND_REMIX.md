# How to use and remix

Every control in the atlas is plain HTML, CSS and JavaScript in a single file. There is nothing to install and no build step. This guide shows how to lift one control into your own project, and what a remix needs before it belongs in the atlas.

The work is licensed under [CC BY-NC 4.0](LICENSE.md). You can use and remix it for non-commercial work, with credit.

---

## 1. Look before you lift

1. Open `volume-2/index.html` or `volume-3/index.html` in a browser.
2. Find the control and try it with both the pointer and the keyboard. The grey hint line under each control lists its keys.
3. Turn on the **Code Veil** near the top of the page. Each card then shows the fragment that makes the control behave, usually the physics, the state logic or the CSS trick. That fragment is the idea. The full implementation is in the source.

## 2. Find the three pieces

Each control has three parts in the page source, and each part has a marked header.

| Part | Where | Look for |
|---|---|---|
| **Markup** | inside `<article class="unit">` | the control's `id`, e.g. `id="cp"` (Cadence Pads) or the card `id="c-jp"` (Joypad) |
| **Styles** | the `<style>` block | `/* ── Cadence Pads ── */` |
| **Behaviour** | the `<script>` block | `/* ═════════ Cadence Pads ═════════ */` in Volume II, `/* ── Joypad Controller ── */` in Volume III |

Copy everything from a control's header down to the next header.

## 3. Bring the shared core with it

Controls lean on a small core at the top of each page's script. Copy the parts your control uses.

| Helper | What it does | Needed by |
|---|---|---|
| `SNAP`, `HEAVY`, `PRESS` | spring constants used across the whole atlas | anything that moves |
| `class Spring` | a damped spring: `new Spring(value, SNAP, onUpdate)`, then `.to(target)` or `.set(value)` | anything that moves |
| `reduce` | `true` when the visitor prefers reduced motion. Springs jump straight to their target | everything |
| `$`, `$$`, `clamp`, `svgEl` | small DOM and maths helpers | everything |
| `addLoop`, `watch` | one shared animation loop that pauses when a control scrolls off-screen | meters, platter, transport, thermostat, physics toys |
| `audio()`, `click()`, `tick()`, `thock()`, `clack()` | short synthesized clicks that start only after the visitor interacts | anything that makes a sound |
| `MASTER`, `bands()` | Volume II only: the page-wide volume bus and analyser | Monitor Pair, Excursion Pair, the Cadence Pads drums |
| `bindFinish()` | the Ivory / Obsidian switch | every card in Volume II |
| `makeFader`, `makeKnob`, `makeRotary` | shared builders for faders, knobs and dials | Volume II faders, knobs and dials |
| `makeToggle`, `makeHSlider` | shared builders for toggles and horizontal sliders | Volume III switches and sliders |

### Tokens

Keep the root tokens, or map them onto your own design system:

```css
:root {
  --accent: #CC0000;   /* Cinnabar signal */
  --ink: #111; --muted: #6e6e6e; --tile: #f5f6f7; --paper: #fff;
  --sans: "IBM Plex Sans", sans-serif;
  --mono: "IBM Plex Mono", monospace;
  --serif: "IBM Plex Serif", serif;   /* Volume III */
}
```

Load the fonts from Google Fonts:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:ital,wght@0,400;0,500;1,400&display=swap">
```

## 4. Wire it to your app

Every control already reports its state. Hook into the place where it writes its readout:

- **ARIA first.** Sliders set `aria-valuenow` and `aria-valuetext`. Switches set `aria-checked`. Latches set `aria-pressed`. Watch those attributes or read them on submit.
- **Callbacks.** Builders take an `onChange` or `onInput` callback, for example `makeToggle(btn, knob, { travel: 44, onChange: on => save(on) })`.
- **Remove the demo.** Simulations such as the thermostat's room, the VU signal and the camera's scenes are there to show the control working. Replace them with your real data source.

## 5. Remix rules

A remix belongs in the atlas when it passes these checks:

- [ ] **Palette:** black, white and one signal accent. Other colours only on sensors and gauges, where colour carries meaning, such as heat and cool.
- [ ] **Type:** IBM Plex Sans, Mono or Serif only.
- [ ] **Finishes:** an Ivory and an Obsidian version, switched with `data-finish`.
- [ ] **State at a glance:** someone can tell the state without reading the label, from a lamp, a colour, depth, position or a printed symbol.
- [ ] **Keyboard:** it works fully without a pointer, and the hint line says how.
- [ ] **Reduced motion:** it still works, with motion skipped, when `prefers-reduced-motion` is set.
- [ ] **Self-contained:** no libraries and no network calls.
- [ ] **Credit:** a `lineage` line naming the hardware or design it comes from.

## 6. Share a remix

1. Fork the repository.
2. Add your control as a new `<article class="unit">` card in the volume it fits. Include the description, the finish switch, a readout, a hint line, a lineage line and a Code Veil snippet.
3. Rebuild the standalone page: `volume-N/index.html` is the root source file with a `<!doctype html>` and `<head>` wrapper added.
4. Open a pull request with a short clip or screenshot of both finishes.

When you use a control outside this repository, credit it like this:

> Based on *Enochian UI UX Elements* by alanism / UnCommon Core (https://github.com/alanism/Enochian-UI-UX-Elements), CC BY-NC 4.0.
