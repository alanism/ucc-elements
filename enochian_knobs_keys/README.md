# Enochian control sources

These three self-contained studies supply the 55 working controls in the [single Enochian showcase](../UIUX/index.html):

| Source | Controls | Purpose |
|---|---:|---|
| [`index.html`](index.html) | 11 | Foundation controls, including dials, keys, clocks, and the receiver |
| [`volume-3/index.html`](volume-3/index.html) | 20 | Compact actions, switches, sliders, and navigation |
| [`volume-2/index.html`](volume-2/index.html) | 24 | Instruments, meters, transport, and displays |

The showcase generator in [`../scripts/generate_uiux.py`](../scripts/generate_uiux.py) combines their markup, styles, and behavior. The source files remain available for editing individual instruments. The public deployment contains only the combined showcase and its assets.

Black, white, and Cinnabar `#CC0000` define the palette. Ivory and Obsidian are component material finishes. Use semantic controls, visible focus, synchronized ARIA state, and reduced-motion support when adapting a control.

See [`HOW_TO_USE_AND_REMIX.md`](HOW_TO_USE_AND_REMIX.md) for implementation details and [`LICENSE.md`](LICENSE.md) for source terms.
