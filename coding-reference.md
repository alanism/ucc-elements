# Framer Motion Coding Reference Guide — Drams Tactile Controls Without the Framer Service
**Grounded in:** NotebookLM notebook `Framer Motion` (933cb34d, 30 sources — motion.dev docs, Refine guide, Shaun Chander variants deep-dive, NR Tech layout-glitch fix, motion YouTube corpus) · 9 interrogation queries, 8 answered in full, 1 retried after timeout · Live inventory of `drams.framer.website` · Vision teardown of Drams—037 ON/OFF screenshots

**Rule zero:** everything here runs on `npm i motion` + `import { motion } from "motion/react"` (the successor to `framer-motion`). No Framer hosting, no Remix, no cloud service. The tactile feel is springs + layered box-shadows — both fully reproducible in plain React.

**UCC adaptation:** Drams' accent is burnt-orange (`#E76A2E`). Every recipe below ships with the **UCC page red `#cc0000`** as the active color (already used for focus rings, fraction-demo buttons, closing emphasis), with the Drams orange noted where it differs.

---

## 0. Setup

```bash
npm i motion
```

```jsx
import { motion, LayoutGroup, AnimatePresence, MotionConfig, useReducedMotion, useMotionValue, useTransform, useMotionValueEvent } from "motion/react";
```

Wrap the app once so reduced-motion users are covered everywhere (notebook R2-03):

```jsx
<MotionConfig reducedMotion="user">{/* app */}</MotionConfig>
```

---

## 1. Spring tokens — the only numbers you need

One shared spring per gesture family. Same object on every related property so track + knob arrive together (notebook R1-01, R1-03, R3-02):

| Token | Value | Use |
|---|---|---|
| `snap` | `{ type:"spring", stiffness:700, damping:35, mass:0.8 }` | Toggles, micro-buttons, knob glide |
| `tactile` | `{ type:"spring", stiffness:600, damping:25, mass:0.5 }` | Push-buttons, press squish + release |
| `glide` | `{ type:"spring", stiffness:500, damping:32, mass:1 }` | Segmented thumb (CALM/PRESSURE — the UCC retrofit) |
| `heavy` | `{ type:"spring", stiffness:300, damping:30, mass:1.2 }` | Rotary dials, weighted drag |
| `gentle` | `{ type:"spring", visualDuration:0.25, bounce:0.15 }` | Tooltips, overlays |

Ranges from the corpus: stiffness 300–700, damping 20–35, mass 0.5–1.2. Stiffness = snap speed · damping = friction (low = bouncy) · mass = perceived weight.

---

## 2. Toggle / switch — Drams—037 (the two screenshots)

**Anatomy (measured):** pill track ~2:1 w:h · OFF track `#EFEFEF` (inset-groove read) · ON track flat accent · white knob Ø ≈ 85–90% of track height, 3–5px inset · knob shadow `0 10px 22px rgba(0,0,0,.22)` SE-cast · no text, no icons — position alone carries state.

**Pattern A — layout FLIP (recommended, notebook R1-01).** No pixel math: flip `justify-content`, the `layout` knob projects itself:

```jsx
const snap = { type:"spring", stiffness:700, damping:35, mass:0.8 };

function DramsToggle({ on, onToggle }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label="Toggle"
      onClick={onToggle}
      style={{ display:"flex", alignItems:"center", padding:5, width:132, height:60,
        borderRadius:999, border:0, cursor:"pointer",
        justifyContent: on ? "flex-end" : "flex-start",
        backgroundColor: on ? "#cc0000" : "#efefef",           // Drams original: "#e76a2e"
        boxShadow:"inset 0 2px 6px rgba(0,0,0,.08)" }}>
      <motion.span layout transition={snap} whileTap={{ scale:0.9 }}
        style={{ width:50, height:50, borderRadius:"50%", background:"#fff",
          boxShadow:"0 10px 22px rgba(0,0,0,.22), 0 2px 6px rgba(0,0,0,.18)" }} />
    </button>
  );
}
```

**Pattern B — variants (track color + knob x on one spring, notebook R1-02).** Prefer when UCC needs exact pixel travel (e.g. 72px in the demo):

```jsx
const spring = { type:"spring", stiffness:500, damping:30 };
const track = { off:{ backgroundColor:"#efefef" }, on:{ backgroundColor:"#cc0000" } };
const knob  = { off:{ x:0 }, on:{ x:72 } };

<motion.button role="switch" aria-checked={on}
  variants={track} animate={on ? "on" : "off"} transition={spring} onClick={onToggle}>
  <motion.span variants={knob} transition={spring} />  {/* inherits "on"/"off" key */}
</motion.button>
```

Variant propagation is strict string-matching: parent `"on"` only moves children that also define `"on"` (notebook R3-01, hidden assumption 1).

---

## 3. Segmented switch — CALM / PRESSURE (shipped in Version M)

**What changed:** `VersionM.jsx` instant-swap buttons → `ModeSwitch.jsx` sliding-thumb control. One `layoutId="mode-switch-thumb"` pill glides between CALM and PRESSURE on the `glide` spring; active fill is `#cc0000`, square corners to match Version M; `role=radiogroup` + `role=radio` + `aria-checked`; `whileTap={{scale:0.97}}` press squish; `useReducedMotion()` collapses the glide to `{duration:0}`. Verified live: click flips `PRESSURE:true:is-active`; `npm run build` green.

```jsx
import { motion, useReducedMotion } from "motion/react";
const GLIDE = { type:"spring", stiffness:500, damping:32 };

function ModeSwitch({ mode, onChange }) {
  const reduce = useReducedMotion();
  return (
    <div className="mode-switch-v2" role="radiogroup" aria-label="Learning conditions">
      {["calm","pressure"].map(v => {
        const active = mode === v;
        return (
          <motion.button key={v} type="button" role="radio" aria-checked={active}
            className={active ? "is-active" : ""} onClick={() => onChange(v)}
            whileTap={reduce ? undefined : { scale:0.97 }}>
            {active && <motion.span className="ms-thumb" layoutId="mode-switch-thumb"
              transition={reduce ? { duration:0 } : GLIDE} aria-hidden="true" />}
            <span className="ms-label">{v.toUpperCase()}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
```

**Glitch-free `layoutId` rules (notebook R2-02 — all five apply to this component):**
1. Exactly one owner of the `layoutId` per frame — conditional-render `{active && …}`.
2. Pass `borderRadius`/`boxShadow` via `style`/`animate` so Motion counter-scales distortion.
3. Parents `position:relative` (absolute thumb or it snaps to 0,0).
4. No CSS transform classes on the same node as `layout`/`layoutId` — all transforms via Motion props.
5. One unified transition object across the grouped elements — no spring-vs-tween mixing.

---

## 4. Push-button — Drams—006 (white dome, black rim, floating dot)

Glossy press = `whileHover` lift + `whileTap` squish + shadow compression, one spring (notebook R3-03). UCC square version drops the radius:

```jsx
<motion.button type="button"
  initial={{ scale:1, y:0, boxShadow:"0px 10px 20px rgba(0,0,0,.35), inset 0 1px 1px rgba(255,255,255,.6), inset 0 -2px 4px rgba(0,0,0,.2)" }}
  whileHover={{ scale:1.03, y:-3, boxShadow:"0px 16px 28px rgba(0,0,0,.45), inset 0 1px 2px rgba(255,255,255,.8), inset 0 -2px 4px rgba(0,0,0,.2)" }}
  whileTap={{ scale:0.96, y:4, boxShadow:"0px 2px 4px rgba(0,0,0,.25), inset 0 3px 6px rgba(0,0,0,.4), inset 0 -1px 1px rgba(255,255,255,.3)" }}
  transition={{ type:"spring", stiffness:650, damping:26, mass:0.6 }}>
```

Dot indicator above the dome: `animate={{ backgroundColor: on ? "#cc0000" : "#d4d4d8" }}` on a 6px circle. Rest shadow must stay distant (10–20px blur) or the float illusion dies.

---

## 5. Sliders (Drams—022 stepper, Drams—005 line) + dial (Drams—002)

**Slider (notebook R2-01):** `useMotionValue` tracks x on the GPU (no re-renders); `useTransform` derives fill + readout; `dragElastic 0.05` = hard tactile stops; `dragMomentum={false}` stops on release:

```jsx
const x = useMotionValue(0);
const fill = useTransform(x, [0, 200], ["0%","100%"]);
const val  = useTransform(x, [0, 200], [0, 100]);
useMotionValueEvent(val, "change", v => set readout(Math.round(v)));

<motion.span drag="x" dragConstraints={{ left:0, right:200 }} dragElastic={0.05}
  dragMomentum={false} style={{ x }} whileHover={{ scale:1.15 }} whileTap={{ scale:0.95 }} />
```

UCC mapping: Gauss `Factor ×N` slider → snap `x` to 4 detents with the `snap` spring on release; fill track in `#cc0000`; thumb keeps the white-capsule + inset-line look.

**Dial (notebook R2-01):** vertical drag → rotation. `dragY [-150,0]` → `rotate [-135°,+135°]` → level 0–100. Indicator notch in `#cc0000`. `hardwareHeavy` spring for weighted feel. Drams—002's orange 6-o'clock dot becomes the notch.

---

## 6. Soft-UI without Framer — studio-lighting shadow tokens (notebook R3-02)

Light source top-left; highlight toward it, shadow away from it. Canvas `#e0e5ec` (or UCC paper `#f7f5ef` — re-tune alphas down ~20% on paper):

```js
const tactileShadows = {
  raised:  "6px 6px 12px rgba(163,177,198,.6), -6px -6px 12px rgba(255,255,255,.8), inset 1px 1px 1px rgba(255,255,255,.6)",
  hover:   "9px 9px 16px rgba(163,177,198,.7), -9px -9px 16px rgba(255,255,255,.9), inset 1px 1px 2px rgba(255,255,255,.8)",
  pressed: "inset 4px 4px 8px rgba(163,177,198,.7), inset -4px -4px 8px rgba(255,255,255,.9)",
};
```

Motion interpolates `boxShadow` strings across `initial/whileHover/whileTap` — shadows morph while scale squishes, which is the entire Drams illusion. No Framer service involved at any point.

---

## 7. Accessibility (notebook R2-03 — non-negotiable)

- Semantic `<button>`/`<motion.button>` — free keyboard Enter/Space; `whileTap` fires on keyboard Enter automatically.
- `role="switch"` + `aria-checked` (toggles) · `aria-pressed` (toggle buttons) · radiogroup/radio (segmented).
- `whileFocus` / `:focus-visible` ring — UCC uses `3px solid #cc0000`.
- Reduced motion: `<MotionConfig reducedMotion="user">` globally + `useReducedMotion()` locally (slide→fade or `{duration:0}`). The shipped ModeSwitch does both.
- `aria-live="polite"` on copy that changes with the switch (mode-copy already has it).

---

## 8. Variants kit architecture (notebook R3-01)

One `controlsVariants.ts`: `springPresets` → parent/child variants (`buttonVariants`, `buttonIconVariants`, `switchTrackVariants`, `switchKnobVariants`) → `tooltipVariants` with `exit` for `AnimatePresence`. Components become finite state machines (`idle/hover/tap/disabled`, `on/off`). Hidden-assumption traps: variant-key mismatch (silent no-op), CSS-transform classes overwriting Motion's matrix (snapping), missing `key` in `AnimatePresence` (exit never fires), mount flash (`initial={false}` on AnimatePresence).

---

## 9. Version M retrofit log

| File | Change |
|---|---|
| `src/variants/version-m/ModeSwitch.jsx` | **new** — sliding-thumb switch, `#cc0000`, glide spring, radiogroup semantics |
| `src/variants/version-m/VersionM.jsx` | mode-switch div → `<ModeSwitch mode onChange>` |
| `src/variants/version-m/version-m.css` | appended `.mode-switch-v2` block (square, red thumb, focus ring) |
| `package.json` | `motion@13.2.0` added |
| Next (not yet) | Gauss slider detents, lens-switch `layoutId` pill, `.button` press squish |

## 10. Provenance

Grounded answers: `drams-motion-guide/answers/*.md` (12 files — 9 foundation + 3 stepper round: `s1_detents`, `s2_stepper_a11y`, `s3_tick_render`; citation blobs in `notebooklm/*.json`).

## 11. Supplement — N-step steppers, React pattern (grounded round 2)

The canonical React implementation tracks the knob with `useMotionValue`, then snaps on release — `Math.round(x / stepWidth)`, clamped, animated with `animate(x, targetX, {type:"spring",stiffness:600,damping:32,mass:0.8})`. `drag="x"` + `dragConstraints` + `dragElastic:0.08` + `dragMomentum:false` so the snap owns the release. Ticks are buttons (click-to-snap); passed ticks (`i <= active`) render accent, active also scales up; tick motion uses `initial={false}` so rebuilds don't replay enter transitions. Keyboard: arrows ±1, PageUp/PageDown ±2, Home/End. `aria-valuetext` reads human ("Step 3 of 7"), not raw index. Reduced motion: springs become `{duration:0.05}` fades. All four behaviors ship in `drams-kit.html` §3–4.

Key corpus URLs: `motion.dev/docs`, `motion.dev/docs/react-animate-presence`, `motion.dev/docs/react-gestures`, `motion.dev/docs/react-accessibility`, `motion.dev/docs/react-use-scroll`, `shaunchander.me/writing/all-about-variants-in-framer-motion`, `refine.dev/blog/framer-motion`, `nrtechstudio.com/framer-motion-layout-animation-glitching-fix`, plus the `drams.framer.website` source and the two screenshot teardowns. Live-verified: preview server `localhost:5173/m` (click flips state), `npm run build` green.
