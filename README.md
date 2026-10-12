# Enochian Elements

One interactive showcase of 63 Enochian controls for mini-apps and AI-guided device interfaces. The public page is [`UIUX/index.html`](UIUX/index.html); controls appear once, ordered by action, state, choice and value, navigation, time and playback, then signal and feedback. The top bar owns search, Light/Dark, sound, and the single Code mode.

## Local preview

```bash
python3 -m http.server 8080
```

Open <http://localhost:8080/UIUX/>. The page uses IBM Plex web fonts and Motion from a CDN; controls retain an immediate-transition fallback if Motion is unavailable.

## Source and build

- `enochian_knobs_keys/index.html` — foundation controls
- `enochian_knobs_keys/volume-3/index.html` — compact controls
- `enochian_knobs_keys/volume-2/index.html` — instrument controls
- `scripts/generate_uiux.py` — extracts and scopes all 63 controls into one page; requires Python 3 and Beautiful Soup 4
- `UIUX/shell.html`, `UIUX/atlas.css`, `UIUX/atlas.js` — showcase layout and global behavior

Regenerate after editing a source control:

```bash
python3 scripts/generate_uiux.py
python3 scripts/build_uiux.py
```

The second command creates the standalone `.uiux-dist` payload. See [`docs/operations.md`](docs/operations.md) for release and monitoring steps.

## Design language

Black and white are the page modes; Cinnabar `#CC0000` is the signal color. Individual instruments retain Ivory and Obsidian material finishes. Controls expose state through their physical motion, readout, and ARIA attributes.

## License

See the license files in the repository and source folder for the terms that apply to each asset.
