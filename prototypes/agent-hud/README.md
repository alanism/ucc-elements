# Enochian dashboards and HUDs

These are digital screen studies for coding agents and harnesses, VR interfaces, and video production. They complement the tactile controls and device frames in the showcase. The current project/task/feed data is simulated.

Canonical studies:

- `index.html`: Agent HUD — agent activity, token flow, context, and traces.
- `board.html`: Build Board — board, hybrid, and field views with an inspector.
- `matrix-journey.html`: Decision Matrix — priorities, difficulty, and journey variants.
- `command-deck.html`: Command Deck — cinematic radar, journey, and batch wall.
- `v2/command-deck-v2.html`: Command Deck 02 — queue, editable matrix, reversible task actions, and batch review.
- `light-table/light-table.html`: Light Table — Fleet, Mission, Operator, and Devices screens with model/agent diagnostics and reversible actions. The operator map uses the prototype's public Mapbox token and keeps its offline route fallback.

Palettes: `index.html` and `board.html` take `?theme=enochian|ivory|ivory-glass` (board also takes `ares`), or you can cycle palettes with the palette button. `ivory` follows the atlas light mode. `ivory-glass` keeps the center display obsidian inside a light housing. The choice is saved in `localStorage.hudTheme`. Edit `board.src.html` and `board.html` together (they differ only by the seed line).

The generator publishes isolated copies under `UIUX/studies/agent-hud/`, with navigation wrappers and direct screen links. Agent HUD and Build Board preserve their desktop composition in a horizontally scrollable viewport on narrow devices. The other screens retain their authored responsive behavior.

The published command decks replace machine-local optional thumbnails with a labeled synthetic frame. Original prototype files retain their configuration. Sources, backup files, audit scripts, and screenshots are not automatically published.

To add another study, extend `HUDS` in `scripts/generate_uiux.py`, capture its actual screen preview and update `UIUX/previews/hud-manifest.json`, then regenerate and build. Gallery, wrapper, runtime, and image URLs are versioned by content. No connection to a coding harness, external feed, or physical control is established automatically.
