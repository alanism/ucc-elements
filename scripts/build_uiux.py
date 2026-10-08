"""Build the standalone Firebase payload for the Enochian atlas."""

from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / ".uiux-dist"
MARKER = OUTPUT / ".enochian-uiux-build"

if OUTPUT.exists():
    if not MARKER.exists():
        raise SystemExit(f"Refusing to replace an unrecognized directory: {OUTPUT}")
    shutil.rmtree(OUTPUT)

files = (
    "UIUX/index.html",
    "UIUX/atlas.css",
    "UIUX/atlas.js",
    "UIUX/controls.css",
    "UIUX/controls.js",
)
for relative in files:
    destination = OUTPUT / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / relative, destination)

MARKER.touch()
print(f"Built one page and {len(files)-1} assets in {OUTPUT}")
