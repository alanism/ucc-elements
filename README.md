# Enochian Elements — Control Atlas

A shareable atlas of tactile, hardware-inspired UI/UX controls built with semantic HTML, CSS, JavaScript, and [Motion](https://motion.dev/)—without a hosted design service.

## Live demo

**https://alanism.github.io/ucc-elements/**

## Components

- **The Code Veil** — page-wide implementation reveal
- **Obsidian Dial** — dark continuous rotary control
- **Ivory Dial** — light continuous rotary control
- **Choir Dial** — `3`, `5`, `7`, or `10` detent selector
- **Ordinal Veil** — variable-length segmented control
- **Triune Gate** — three independent binary switches
- **Aether Receiver** — rotary radio in Ivory, Cinnabar, and Obsidian
- **Horologion** — live clock and playback-state instrument
- **Vigil Clock** — stopwatch-inspired countdown timer
  - 60 seconds, 5 minutes, 10 minutes, or 25 minutes
  - Ivory and Obsidian finishes
  - Wall-clock-accurate countdown
  - Increasing Cinnabar elapsed indicator
  - Integrated start/stop and reset controls
- **The Three Keys** — tactile momentary or latched action controls

## Try it locally

No build step is required:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

You can also open `index.html` directly. Motion is loaded as an ES module from jsDelivr, so an internet connection is required unless you vendor that dependency.

## Reusing a component

1. Open the atlas.
2. Turn on **The Code Veil**.
3. Use the **COPY** control beneath the instrument you want.
4. Adapt the colors and labels while preserving semantic controls and synchronized ARIA state.

The primary Cinnabar signal accent is `#CC0000`; Ember is the warmer alternate.

## Accessibility and behavior

- Native buttons wherever possible
- `role="switch"`, slider semantics, and synchronized ARIA state where appropriate
- Keyboard control for detented and rotary inputs
- Visible focus rings
- Reduced-motion handling
- WebAudio created or resumed only after a direct user gesture
- Timer countdown derived from `Date.now()` so background-tab throttling does not introduce drift

## Files

- `index.html` — complete component showcase and copyable snippets
- `toggle.html` — standalone Drams—037 toggle study
- `coding-reference.md` — Motion patterns and implementation notes

## License

MIT. See [LICENSE](LICENSE).
