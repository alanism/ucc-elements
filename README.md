# Enochian Elements

A working showcase of **63 controls, 12 device studies, and 6 dashboards and HUDs** with familiar names: Enochian Synth Keyboard, Enochian DJ Mixer, Enochian Stereo Speakers, and Enochian Toggle Switch 01–06. Digital screen studies support coding agents and harnesses, VR interfaces, and video production, alongside the tactile controls and blank device frames.

- `index.html` — main entry page, device previews, and direct study links.
- `UIUX/index.html` — complete control catalog, device gallery, Light/Dark, search, sound, and one Code drawer.
- `UIUX/studies/` — seven standalone instrument/frame pages, generated from the source studies.
- `UIUX/previews/` — 24 actual browser captures, both finishes, with recorded source hashes and browser version.

Search accepts familiar terms such as **keyboard, MIDI, mixer, speakers, recorder, MacBook**, and the earlier element names. The full approved name map is in [the build plan](docs/build-plan-showcase-names.md).

## Preview

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Open <http://127.0.0.1:8080/> or <http://127.0.0.1:8080/UIUX/>. The original controls use IBM Plex and Motion CDNs, with an immediate-transition fallback for Motion. New study pages are self-contained.

## Sources

The original foundation, compact, and instrument sources remain in `enochian_knobs_keys/index.html`, `volume-3/index.html`, and `volume-2/index.html`. The new sources were imported from `alanism/Enochian-UI-UX-Elements` commit `0c02c6e87bc69b714e73ff99d0335fcdef1f6b54`.

| Source folder | Study |
| --- | --- |
| `keyboard` | Enochian MIDI Keyboard |
| `midi-pad` | Enochian MIDI Pad |
| `op-1` | Enochian Synth Studio |
| `dj-decks` | Enochian DJ Controller |
| `speakers` | Enochian Compact Speaker and Portable Speaker |
| `tp-7` | Enochian Audio Recorder |
| `apple-devices` | Desktop Setup, All-in-One Setup, Laptop, Tablet, and Phone frames |

MIDI connections are optional and explicit. The audio recorder captures generated demo audio, the synth studio records note events, and the voice assistant is a simulation. No microphone capture is included. All five device screens ship empty; these are independent Apple-inspired frames, without OS emulation or official product affiliation.

## Build and release

```bash
python3 scripts/generate_uiux.py
python3 scripts/build_uiux.py
python3 scripts/build_uiux.py --showcase
```

After changing a composed instrument or device frame, recapture previews before generating. The build rejects stale previews. See [operations](docs/operations.md) for the capture commands, isolated test environment, validation, and the two focused Firebase release commands.

The atlas payload is `.uiux-dist`; the root showcase payload is `.showcase-dist`. Tests, QA artifacts, local-only directories, and the duplicate `index 2.html` are excluded. The root build preserves the Vietnamese runtime and audio routes. The `104kdli` site is not a release target.

## License

See the repository and source license files for the terms that apply to each asset. Reference attributions remain in the study documentation.
