# UnCommon Core Elements

A shareable collection of tactile, hardware-inspired UI/UX components built with semantic HTML, CSS, JavaScript, and [Motion](https://motion.dev/)—without the Framer hosting service.

## Live demo

After GitHub Pages is enabled, the component showcase is available at:

**https://alanism.github.io/ucc-elements/**

## Components

- Drams—037 page-wide code-reveal switch
- Dark and light rotary dials
- N-detent rotary stepper (`3`, `5`, `7`, or `10` settings)
- N-pill segmented control
- Triple vertical switch
- Rotary Radio Player in light, UCC red, and black finishes
- Square Clock-Radio with live hands and three UCC brand treatments
- Stopwatch-inspired Timer Clock
  - 60 seconds
  - 5 minutes
  - 10 minutes
  - 25 minutes
  - White and black finishes
  - Wall-clock-accurate countdown
  - Increasing UCC-red elapsed indicator
  - Integrated start/stop and reset controls
- Tactile arcade push buttons

## Try it locally

No build step is required:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

You can also open `index.html` directly. Motion is loaded as an ES module from jsDelivr, so an internet connection is required unless you vendor that dependency.

## Reusing a component

1. Open the showcase.
2. Turn on **SHOW UI/UX CODE** with the Drams—037 switch.
3. Use the **COPY** control beneath the component you want.
4. Adapt the colors and labels while preserving the semantic controls and ARIA state.

The UCC accent color is `#CC0000`.

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
