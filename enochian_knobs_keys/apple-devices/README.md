# Enochian Device Frames

Apple-hardware-inspired **blank device frames**, composed from inline HTML and CSS. These are independent Enochian material studies—not Apple products, official mockup assets, model-accurate technical drawings, or OS emulators. White/Ivory and Obsidian are custom material variants; their availability here is not a claim about actual Apple finishes.

## Included reference compositions

| Composition | Hardware | Screen selector | Aperture ratio |
|---|---|---|---|
| Desktop pair | External display + Mac mini-style compact desktop | `[data-screen="display"]` | 16:9 |
| All-in-one | iMac-style display, slim keyboard, low-profile mouse | `[data-screen="imac"]` | 16:9 |
| Notebook | Front-view MacBook-style lid + base | `[data-screen="macbook"]` | 16:10 |
| Tablet | Landscape iPad-style frame + Pencil-style stylus | `[data-screen="ipad"]` | 4:3 |
| Handheld | Portrait iPhone-style frame, camera island, side buttons | `[data-screen="iphone"]` | 9:19.5 |

All five screen elements ship **completely empty**. No bundled wallpapers, faces, times, status bars, applications, or placeholder graphics. Cameras and the phone island are separate physical-shell elements, not content inside the insertion slots. The keyboard, mouse, stylus, ports, and physical buttons are decorative accessories, not deceptive interactive controls.

## Open and operate

Open `index.html` directly, or visit <http://127.0.0.1:8765/apple-devices/> while serving the repository with:

```bash
python -m http.server 8765 --bind 127.0.0.1
```

**WHITE / OBSIDIAN** change all nine hardware bodies together. Finish selection supports click, Enter, and Space, has a visible focus ring and exclusive `aria-pressed`, and uses Cinnabar `#CC0000` for its selected border. The isolated preference is `enochian.apple-devices.finish`; internal White value is `ivory`. Invalid or blocked storage falls back to White without breaking the controls. Initialization does not write or alter saved preferences. No audio or hardware permissions are requested.

## Insert your screens later

Use the named `[data-screen]` elements above as your content containers. They are already inside the hardware bezels, with the correct aspect ratios and rounded clipping. Place an image, video, iframe, or application wrapper **inside** the slot—not over the complete device or scene. Set its alternative/accessibility description, and replace the slot's `aria-label` (initially "Empty … content slot") with a description of your actual content.

Direct image/video children fill the aperture with `object-fit: cover` by default; set `object-fit: contain` on that child if the entire image must be visible. Background styles and application wrappers can likewise be attached to the slot. Finish changes only update `data-finish` and pressed state; they do not replace screen nodes or reset inserted application state. An inserted interactive application remains responsible for its own responsive layout, focus behavior, and safe areas. The phone's physical island sits above its screen; leave space for it when inserting application UI.

No untrusted HTML parsing, file picker, uploads, network fetches, or OS simulation are included. A consumer that inserts remote images or iframes opts into those requests; the unmodified artifact is offline and self-contained.

## Reuse outside the gallery

Copy the relevant `.scene` composition and the shared/device-specific CSS, keeping a container that provides the material variables. CSS container units (`cqw`) size bevels, bases, stands, accessories, and corner radii relative to each scene. Preserve `container-type: inline-size` on `.scene`. Set the ancestor's `data-finish` to `ivory` or `obsidian`, or use the existing selector control. The `.specimen` headings and footer labels are gallery chrome, not part of the hardware; omit them in your own presentation.

## Browser verification

Test-only dependency: Python Playwright + its Chromium browser. No application dependencies or build step.

```bash
python -m unittest tests.test_apple_devices -v
python tests/capture_apple_devices.py
python -m unittest discover -s tests -v
```

Captures, computed-geometry results, and review evidence are stored under `.qa/apple-devices/` (git-ignored). Browser testing verifies the component implementation, not native Apple device behavior or physical hardware.
