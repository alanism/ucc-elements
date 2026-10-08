"""Combine the three Enochian studies into one ordered, interactive atlas.

The source studies remain editable. This script keeps their control logic and
styles scoped while rendering each control exactly once in the public page.
"""

from pathlib import Path
import re

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
UIUX = ROOT / "UIUX"
SOURCES = {
    "foundation": ROOT / "enochian_knobs_keys/index.html",
    "compact": ROOT / "enochian_knobs_keys/volume-3/index.html",
    "instruments": ROOT / "enochian_knobs_keys/volume-2/index.html",
}

GROUPS = [
    ("Action", "Press, latch, and commit.", [
        "Push Button", "Cinnabar Key", "The Three Keys", "Triad Action Keys",
        "Hollow Gate", "Pulse Grid", "Canticle Keys", "Aether Orb",
        "Cadence Pads", "Augur",
    ]),
    ("State", "Make on, off, and mode visible.", [
        "Binary Gate", "Cinnabar Switch", "Beacon Switch", "Glyph Switch",
        "Pinch Gate", "Pinch Track", "Triune Gate", "Triune Switch",
        "Triune Beacon", "Lantern Row", "Interlock Bank", "Orbit Gate",
    ]),
    ("Choice & value", "Tune continuous and stepped values.", [
        "Ivory Dial", "Choir Dial", "Ordinal Veil", "Signal Slider",
        "Quadrant Slider", "Dimple Slider", "Meridian Fader", "Regie Bank",
        "Aperture Scale", "Penumbra Deck",
    ]),
    ("Navigation", "Search, move focus, and enter.", [
        "Seeker Orb", "Mechanical Keyboard", "Tally Keypad", "Sigil Controller",
        "Sigil Remote", "Orbit Wheel", "Lumen Pad",
    ]),
    ("Time & playback", "Control duration, transport, and sound.", [
        "Aether Receiver", "Horologion", "Vigil Clock", "Strobe Platter",
        "Transport Bank", "Monitor Pair",
    ]),
    ("Signal & feedback", "Read conditions, levels, and outcomes.", [
        "Lumen VU", "Cantor Ladder", "Excursion Pair", "Lodestar",
        "Climate", "Velocity", "Triad", "Departures", "Manifest", "Aemeth",
    ]),
]
FEATURED = "Obsidian Dial"
WIDE = {"Mechanical Keyboard", "Cadence Pads", "Penumbra Deck", "Departures", "Manifest", "Aemeth"}


def split_source(path):
    text = path.read_text()
    css = re.search(r"<style>(.*?)</style>", text, re.S).group(1)
    scripts = re.findall(r"<script(?:\s+[^>]*)?>(.*?)</script>", text, re.S)
    logic = max(scripts, key=len)
    logic = re.sub(r'^\s*import \{ animate \} from "https://cdn\.jsdelivr\.net/npm/motion@11/\+esm";\s*', "", logic)
    soup = BeautifulSoup(text, "html.parser")
    for script in soup.find_all("script"):
        script.decompose()
    return soup, css, logic


def title_of(item):
    cap = item.select_one(".cap")
    return cap.select_one("span").get_text(" ", strip=True).split("·")[0].strip()


def mark_item(item, name, soup):
    classes = item.get("class", [])
    item["class"] = classes + ["atlas-item"]
    item["data-name"] = name
    if name == "The Code Veil":
        item["class"].append("code-veil-item")
    elif name == FEATURED:
        item["style"] = "--item-order:1"
        item["class"].append("featured-item")
        item["data-group"] = "Featured"
        item["data-index"] = "00.01"
    else:
        for group_index, (group, _, names) in enumerate(GROUPS, 1):
            if name in names:
                item_index = names.index(name) + 1
                item["style"] = f"--item-order:{group_index * 100 + item_index}"
                item["data-group"] = group
                item["data-index"] = f"{group_index:02d}.{item_index:02d}"
                break
        else:
            raise ValueError(f"No catalog placement for {name}")
    if name in WIDE:
        item["class"].append("wide-item")
    meta = soup.new_tag("div", attrs={"class": "item-meta"})
    meta.string = f"{item.get('data-index', '')}  /  {item.get('data-group', 'Code')}"
    item.insert(0, meta)


def source_markup(key, soup):
    if key == "foundation":
        body = soup.body
        for cap in list(body.find_all("div", class_="cap", recursive=False)):
            grid = cap.find_next_sibling("div", class_="grid")
            if grid is None:
                raise ValueError("Foundation card has no grid")
            item = soup.new_tag("article", attrs={"class": "foundation-unit"})
            cap.wrap(item)
            grid.extract()
            item.append(grid)
            mark_item(item, title_of(item), soup)
        contents = "".join(str(child) for child in body.contents)
    else:
        page = soup.select_one(".page")
        for item in page.select("article.unit"):
            mark_item(item, title_of(item), soup)
        contents = str(page)
    return f'<div class="source source-{key}" id="source-{key}">{contents}</div>'


def scoped_css(css, key):
    css = re.sub(r"^\s*html\.embedded[^\n]*\n", "", css, flags=re.M)
    css = css.replace(":root", ":scope").replace("body.show-code", ":scope.show-code")
    css = re.sub(r"(?<![-\w])body\{", ":scope{", css)
    return f"@scope (.source-{key}) {{\n{css}\n}}\n"


def category_nav():
    links = []
    heads = []
    for number, (group, description, names) in enumerate(GROUPS, 1):
        slug = f"group-{number}"
        links.append(f'<a href="#{slug}"><span>{number:02d}</span>{group}</a>')
        heads.append(
            f'<section class="group-heading" id="{slug}" style="--item-order:{number * 100}" '
            f'aria-labelledby="heading-{number}"><div class="group-number">{number:02d} / 06</div>'
            f'<h2 id="heading-{number}">{group}</h2><p>{description}</p>'
            f'<span class="group-count">{len(names)} controls</span></section>'
        )
    return "".join(links), "".join(heads)


def main():
    records = {key: split_source(path) for key, path in SOURCES.items()}
    found = set()
    for key, (soup, _, _) in records.items():
        selectors = ".cap" if key == "foundation" else "article.unit .cap"
        found.update(cap.select_one("span").get_text(" ", strip=True).split("·")[0].strip() for cap in soup.select(selectors))
    expected = {FEATURED, "The Code Veil", *(name for _, _, names in GROUPS for name in names)}
    if found != expected or len(found) != 57:
        raise ValueError(f"Catalog mismatch: missing={expected-found}, extra={found-expected}, count={len(found)}")
    markup = "".join(source_markup(key, soup) for key, (soup, _, _) in records.items())
    nav, headings = category_nav()
    shell = (UIUX / "shell.html").read_text()
    shell = shell.replace("<!-- CATEGORY_NAV -->", nav).replace("<!-- GROUP_HEADINGS -->", headings)
    shell = shell.replace("<!-- CONTROL_MARKUP -->", markup)
    (UIUX / "index.html").write_text(shell)
    (UIUX / "controls.css").write_text("\n".join(scoped_css(css, key) for key, (_, css, _) in records.items()))
    prefix = (UIUX / "controls-prefix.js").read_text()
    script = [prefix]
    for key in ("compact", "instruments", "foundation"):
        logic = records[key][2]
        if key == "foundation":
            script.append('try{animate=(await motionPromise).animate;}catch(error){console.warn("Motion unavailable; controls use immediate transitions",error);}')
        script.append(f'{{\nconst root=globalThis.document.getElementById("source-{key}");\n'
                      f'const document=scopedDocument(root);\nconst addEventListener=scopedListener(root);\n{logic}\n}}')
    script.append('import("./atlas.js");\n')
    (UIUX / "controls.js").write_text("\n".join(script))
    print("Generated one page with 56 controls in six functional groups")


if __name__ == "__main__":
    main()
