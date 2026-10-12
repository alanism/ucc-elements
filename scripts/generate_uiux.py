"""Combine the three Enochian studies into one ordered, interactive atlas.

The source studies remain editable. This script keeps their control logic and
styles scoped while rendering each control exactly once in the public page.
"""

from pathlib import Path
from collections import Counter
import argparse
import hashlib
import json
import re
from html import escape

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
UIUX = ROOT / "UIUX"
SOURCES = {
    "foundation": ROOT / "enochian_knobs_keys/index.html",
    "compact": ROOT / "enochian_knobs_keys/volume-3/index.html",
    "instruments": ROOT / "enochian_knobs_keys/volume-2/index.html",
}

GROUPS = [
    ("Action", "Press, latch, and commit. Reach for these when the user starts, holds, or confirms an action.", [
        "Enochian Push Button 01", "Enochian Push Button 02", "Enochian Button Bank 01", "Enochian Button Bank 02",
        "Enochian Push Switch", "Enochian Pop Buttons", "Enochian Synth Keyboard", "Enochian Bouncing Balls",
        "Enochian Drum Machine", "Enochian Camera",
    ]),
    ("State", "Make on, off, and mode visible. Reach for these when a setting has to read at a glance — in the dark, or across the room.", [
        "Enochian Toggle Switch 01", "Enochian Toggle Switch 02", "Enochian Toggle Switch 03", "Enochian Toggle Switch 04",
        "Enochian Toggle Switch 05", "Enochian Toggle Switch 06", "Enochian Toggle Bank 01", "Enochian Toggle Bank 02",
        "Enochian Rocker Switch Bank", "Enochian Light Switch Bank", "Enochian Input Selector", "Enochian Rotary Switch",
    ]),
    ("Choice & value", "Tune continuous and stepped values. Reach for these when a value is chosen, not typed.", [
        "Enochian Rotary Knob 02", "Enochian Stepped Knob", "Enochian Segment Selector", "Enochian Slider 01",
        "Enochian Slider 02", "Enochian Slider 03", "Enochian Pitch Slider", "Enochian DJ Mixer",
        "Enochian Radio Tuner", "Enochian Video Editor",
    ]),
    ("Navigation", "Search, move focus, and enter. Reach for these when the surface holds more than one thing.", [
        "Enochian Search Field", "Enochian Typing Keyboard", "Enochian Number Pad", "Enochian Joystick",
        "Enochian Remote Control", "Enochian Scroll Wheel", "Enochian Macro Pad",
    ]),
    ("Time & playback", "Control duration, transport, and sound. Reach for these when something runs, counts, or plays.", [
        "Enochian Radio Player", "Enochian Clock", "Enochian Countdown Timer", "Enochian 90 Second Timer", "Enochian Pomodoro Timer", "Enochian Turntable",
        "Enochian Tape Deck", "Enochian Stereo Speakers",
    ]),
    ("Signal & feedback", "Read conditions, levels, and outcomes. Reach for these when the system reports rather than asks.", [
        "Enochian Analog Level Meter", "Enochian Context Meter 01", "Enochian LED Level Meter", "Enochian Agent Monitor", "Enochian Speaker Crossover", "Enochian Compass",
        "Enochian Thermostat", "Enochian Speedometer", "Enochian Context Meter 02", "Enochian System Monitor", "Enochian Context Meter 03", "Enochian Usage Monitor",
        "Enochian Flight Board", "Enochian Task Board", "Enochian Voice Assistant",
    ]),
]
FEATURED = "Enochian Rotary Knob 01"
WIDE = {"Enochian Typing Keyboard", "Enochian Drum Machine", "Enochian Video Editor", "Enochian Flight Board", "Enochian Task Board", "Enochian Voice Assistant",
        "Enochian Context Meter 01", "Enochian Agent Monitor", "Enochian Usage Monitor"}

NAME_MAP = {'Aemeth': 'Enochian Voice Assistant',
 'Aether Orb': 'Enochian Bouncing Balls',
 'Aether Receiver': 'Enochian Radio Player',
 'Aperture Scale': 'Enochian Radio Tuner',
 'Augur': 'Enochian Camera',
 'Beacon Switch': 'Enochian Toggle Switch 03',
 'Binary Gate': 'Enochian Toggle Switch 01',
 'Cadence Pads': 'Enochian Drum Machine',
 'Canticle Keys': 'Enochian Synth Keyboard',
 'Cantor Agents': 'Enochian Agent Monitor',
 'Cantor Ladder': 'Enochian LED Level Meter',
 'Choir Dial': 'Enochian Stepped Knob',
 'Cinnabar Key': 'Enochian Push Button 02',
 'Cinnabar Switch': 'Enochian Toggle Switch 02',
 'Climate': 'Enochian Thermostat',
 'Departures': 'Enochian Flight Board',
 'Dimple Slider': 'Enochian Slider 03',
 'Excursion Pair': 'Enochian Speaker Crossover',
 'Glyph Switch': 'Enochian Toggle Switch 04',
 'Hollow Gate': 'Enochian Push Switch',
 'Horologion': 'Enochian Clock',
 'Interlock Bank': 'Enochian Input Selector',
 'Ivory Dial': 'Enochian Rotary Knob 02',
 'Lantern Row': 'Enochian Light Switch Bank',
 'Lodestar': 'Enochian Compass',
 'Lumen Context': 'Enochian Context Meter 01',
 'Lumen Pad': 'Enochian Macro Pad',
 'Lumen VU': 'Enochian Analog Level Meter',
 'Manifest': 'Enochian Task Board',
 'Mechanical Keyboard': 'Enochian Typing Keyboard',
 'Meridian Fader': 'Enochian Pitch Slider',
 'Monitor Pair': 'Enochian Stereo Speakers',
 'Obsidian Dial': 'Enochian Rotary Knob 01',
 'Orbit Gate': 'Enochian Rotary Switch',
 'Orbit Wheel': 'Enochian Scroll Wheel',
 'Ordinal Veil': 'Enochian Segment Selector',
 'Penumbra Deck': 'Enochian Video Editor',
 'Pinch Gate': 'Enochian Toggle Switch 05',
 'Pinch Track': 'Enochian Toggle Switch 06',
 'Pomodoro Vigil': 'Enochian Pomodoro Timer',
 'Pulse Grid': 'Enochian Pop Buttons',
 'Push Button': 'Enochian Push Button 01',
 'Quadrant Slider': 'Enochian Slider 02',
 'Regie Bank': 'Enochian DJ Mixer',
 'Seeker Orb': 'Enochian Search Field',
 'Sigil Controller': 'Enochian Joystick',
 'Sigil Remote': 'Enochian Remote Control',
 'Signal Slider': 'Enochian Slider 01',
 'Strobe Platter': 'Enochian Turntable',
 'Tally Keypad': 'Enochian Number Pad',
 'The Code Veil': 'Enochian Code Toggle',
 'The Three Keys': 'Enochian Button Bank 01',
 'Transport Bank': 'Enochian Tape Deck',
 'Triad': 'Enochian System Monitor',
 'Triad Action Keys': 'Enochian Button Bank 02',
 'Triad Context': 'Enochian Context Meter 03',
 'Triad Quota': 'Enochian Usage Monitor',
 'Triune Beacon': 'Enochian Rocker Switch Bank',
 'Triune Gate': 'Enochian Toggle Bank 01',
 'Triune Switch': 'Enochian Toggle Bank 02',
 'Velocity': 'Enochian Speedometer',
 'Velocity Context': 'Enochian Context Meter 02',
 'Vigil 90': 'Enochian 90 Second Timer',
 'Vigil Clock': 'Enochian Countdown Timer'}
LEGACY_ALIASES = {"Bouncin' Ball": 'Enochian Bouncing Balls',
 'Coloured Switch': 'Enochian Toggle Switch 02',
 'Concaved Switch': 'Enochian Push Switch',
 'Dimpled Slider': 'Enochian Slider 03',
 "Fidget Poppin'": 'Enochian Pop Buttons',
 'I/O Switch': 'Enochian Toggle Switch 04',
 'Joypad Controller': 'Enochian Joystick',
 'LED Switch': 'Enochian Toggle Switch 03',
 'OP-1 Keys': 'Enochian Synth Keyboard',
 "Pinchin' Switch": 'Enochian Toggle Switch 05',
 "Pinchin' Track Switch": 'Enochian Toggle Switch 06',
 "Pushin' Click Button": 'Enochian Push Button 02',
 "Rollin' Search": 'Enochian Search Field',
 'Round On/Off Knob': 'Enochian Rotary Switch',
 'Square Slider': 'Enochian Slider 02',
 'Standard Switch': 'Enochian Toggle Switch 01',
 "Trackin' Slider": 'Enochian Slider 01',
 'Triple Light Switch': 'Enochian Rocker Switch Bank',
 'Triple Push Buttons': 'Enochian Button Bank 02',
 'Triple Switch': 'Enochian Toggle Bank 02'}


STUDIES = [
    {"slug": "midi-keyboard", "name": "Enochian MIDI Keyboard", "folder": "keyboard", "selector": "#keyboard-controller", "anchor": "", "description": "25 notes, touch strips, encoders, and chord pads. Optional MIDI output.", "aliases": "keyboard midi Canticle / 25 25-key keyboard", "finish_selector": "[data-set-finish='{finish}']", "light_finish": "ivory"},
    {"slug": "midi-pad", "name": "Enochian MIDI Pad", "folder": "midi-pad", "selector": "#pad-controller", "anchor": "", "description": "16 pads, three scenes, and a step sequencer. Optional MIDI output.", "aliases": "midi Grid16 Grid / MIDI pad drum controller", "finish_selector": "[data-set-finish='{finish}']", "light_finish": "ivory"},
    {"slug": "synth-studio", "name": "Enochian Synth Studio", "folder": "op-1", "selector": "#instrument", "anchor": "", "description": "A playable keyboard, four encoders, and a note-event recorder.", "aliases": "keyboard recorder synthesizer Canticle / OP study OP-1 op1", "finish_selector": "[data-set-finish='{finish}']", "light_finish": "ivory"},
    {"slug": "dj-controller", "name": "Enochian DJ Controller", "folder": "dj-decks", "selector": "#controller", "anchor": "", "description": "Two jog decks, cues, EQ, channel faders, and a crossfader.", "aliases": "dj mixer Twin decks Duplex Twin DJ decks", "finish_selector": "[data-set-finish='{finish}']", "light_finish": "ivory"},
    {"slug": "compact-speaker", "name": "Enochian Compact Speaker", "folder": "speakers", "selector": "#compact-unit", "anchor": "compact-study", "description": "A woven-grille playback surface with a tactile volume wheel. Generated audio demo.", "aliases": "speaker speakers Mesh compact audio", "finish_selector": "[data-speaker-finish='{finish}']", "light_finish": "ivory"},
    {"slug": "portable-speaker", "name": "Enochian Portable Speaker", "folder": "speakers", "selector": "#twin-unit", "anchor": "twin-study", "description": "Twin drivers, a carry handle, input selection, and playback controls.", "aliases": "speaker speakers Twin portable audio", "finish_selector": "[data-speaker-finish='{finish}']", "light_finish": "ivory"},
    {"slug": "audio-recorder", "name": "Enochian Audio Recorder", "folder": "tp-7", "selector": "#recorder", "anchor": "", "description": "Record and replay locally generated demo audio. No microphone capture.", "aliases": "recorder voice voice recorder Pocket recorder TP-7 TP recorder study", "finish_selector": "#finish-{finish}", "light_finish": "silver"},
    {"slug": "desktop-setup", "name": "Enochian Desktop Setup", "folder": "apple-devices", "selector": "#display-study .scene", "anchor": "display-study", "description": "Display and mini desktop with an empty 16:9 screen slot.", "aliases": "Apple Mac Mac mini desktop display monitor computer", "finish_selector": "[data-set-finish='{finish}']", "light_finish": "ivory"},
    {"slug": "all-in-one", "name": "Enochian All-in-One Setup", "folder": "apple-devices", "selector": "#imac-study .scene", "anchor": "imac-study", "description": "All-in-one computer, slim keyboard, and mouse. Empty 16:9 screen.", "aliases": "Apple Mac iMac keyboard mouse slim keyboard all in one", "finish_selector": "[data-set-finish='{finish}']", "light_finish": "ivory"},
    {"slug": "laptop", "name": "Enochian Laptop", "folder": "apple-devices", "selector": "#macbook-study .scene", "anchor": "macbook-study", "description": "Laptop frame with an empty 16:10 screen slot.", "aliases": "Apple Mac MacBook laptop notebook", "finish_selector": "[data-set-finish='{finish}']", "light_finish": "ivory"},
    {"slug": "tablet", "name": "Enochian Tablet", "folder": "apple-devices", "selector": "#ipad-study .scene", "anchor": "ipad-study", "description": "Landscape tablet and stylus with an empty 4:3 screen slot.", "aliases": "Apple iPad tablet Pencil stylus", "finish_selector": "[data-set-finish='{finish}']", "light_finish": "ivory"},
    {"slug": "phone", "name": "Enochian Phone", "folder": "apple-devices", "selector": "#iphone-study .scene", "anchor": "iphone-study", "description": "Phone frame with an empty 9:19.5 screen slot.", "aliases": "Apple iPhone phone handheld", "finish_selector": "[data-set-finish='{finish}']", "light_finish": "ivory"},
]
ANCHORS = {
    "Enochian Typing Keyboard": "showcase-typing-keyboard",
    "Enochian Synth Keyboard": "showcase-synth-keyboard",
    "Enochian DJ Mixer": "showcase-dj-mixer",
    "Enochian Drum Machine": "showcase-drum-machine",
    "Enochian Turntable": "showcase-turntable",
    "Enochian Stereo Speakers": "showcase-stereo-speakers",
    "Enochian Voice Assistant": "showcase-voice-assistant",
}

HUDS = [
    {"slug": "agent-hud", "name": "Enochian Agent HUD", "source": "index.html", "query": "", "wide": True, "description": "Agent activity, token flow, context pressure, and event traces in one live screen.", "aliases": "dashboard hud coding agent harness tokens context telemetry VR video production"},
    {"slug": "build-board", "name": "Enochian Build Board", "source": "board.html", "query": "theme=enochian", "wide": True, "description": "Board, hybrid, and field views for following a build and inspecting its activity.", "aliases": "dashboard hud coding agent harness board kanban tasks trace VR video production"},
    {"slug": "decision-matrix", "name": "Enochian Decision Matrix", "source": "matrix-journey.html", "query": "theme=enochian", "wide": False, "description": "Priority, difficulty, and journey views for deciding what comes next.", "aliases": "dashboard hud matrix priority urgency importance journey planning VR video production"},
    {"slug": "command-deck", "name": "Enochian Command Deck", "source": "command-deck.html", "query": "theme=enochian", "wide": False, "description": "A cinematic priority radar, project journey, and batch-processing wall.", "aliases": "dashboard hud command deck cinematic radar batch content video production"},
    {"slug": "command-deck-v2", "name": "Enochian Command Deck 02", "source": "v2/command-deck-v2.html", "query": "theme=obsidian", "wide": False, "description": "A ranked queue, editable priority matrix, task actions with undo, and batch review.", "aliases": "dashboard hud command deck v2 priority matrix queue undo harness coding agent batch video production"},
    {"slug": "light-table", "name": "Enochian Light Table", "source": "light-table/light-table.html", "query": "theme=obsidian", "wide": False, "description": "Four connected screens for model fleets, mission forecasts, operator routes, and device/subagent diagnostics.", "aliases": "dashboard hud light table fleet mission operator devices subagents coding agent harness context budget model routes VR video production"},
]


def hud_markup():
    cards = []
    for hud in HUDS:
        path = UIUX / "previews" / f'{hud["slug"]}-hud.png'
        data = path.read_bytes()
        digest = hashlib.sha256(data).hexdigest()[:12]
        width, height = int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")
        wrapper_version = hashlib.sha256((UIUX / "studies" / "agent-hud" / f'{hud["slug"]}.html').read_bytes()).hexdigest()[:12]
        link = f'/UIUX/studies/agent-hud/{hud["slug"]}.html?v={wrapper_version}'
        cards.append(f'<article class="study-item hud-item" id="study-{hud["slug"]}" data-name="{escape(hud["name"])}" data-group="Dashboards &amp; HUDs" data-search-terms="{escape(hud["aliases"])}">'
                     f'<a class="study-preview" href="{link}" aria-label="Open {escape(hud["name"])}"><img src="/UIUX/previews/{path.name}?v={digest}" width="{width}" height="{height}" loading="lazy" alt="{escape(hud["name"])} — digital dashboard preview"></a>'
                     f'<h3><a href="{link}">{escape(hud["name"])}</a></h3><p>{escape(hud["description"])}</p><a class="study-open" href="{link}">Open dashboard →</a></article>')
    return "\n".join(cards)


def public_huds():
    destination = UIUX / "studies" / "agent-hud"
    destination.mkdir(parents=True, exist_ok=True)
    for hud in HUDS:
        text = (ROOT / "prototypes" / "agent-hud" / hud["source"]).read_text()
        text = re.sub(r'<title>.*?</title>', f'<title>{hud["name"]} — screen study</title>', text, count=1, flags=re.S)
        # Replace optional machine-local thumbnails with an explicit synthetic frame.
        text = text.replace('file:///Users/alannguyen/Downloads/gmunk-topgun/', '/UIUX/studies/agent-hud/demo-frame.svg?frame=')
        text = text.replace('GMUNK-TOPGUN · IMAGE PIPELINE', 'ENOCHIAN · PRODUCTION PIPELINE')
        if hud["slug"] == "light-table":
            config = destination / "light-table-config.js"
            if not config.exists():
                config.write_text('window.ENOCHIAN_LIGHT_TABLE_CONFIG = {};\n')
            config_version = hashlib.sha256(config.read_bytes()).hexdigest()[:12]
            text = text.replace('src="config.js"', f'src="/UIUX/studies/agent-hud/light-table-config.js?v={config_version}"')
        (destination / f'{hud["slug"]}-screen.html').write_text(text)
        version = hashlib.sha256(text.encode()).hexdigest()[:12]
        query = "?" + (hud["query"] + "&" if hud["query"] else "") + "v=" + version
        wide = " wide-screen" if hud["wide"] else ""
        wrapper = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{hud["name"]} — Enochian Elements</title>
<style>*{{box-sizing:border-box}}html,body{{margin:0;height:100%;background:#09090a;color:#f7f7f8;font:13px system-ui,sans-serif}}body{{display:flex;flex-direction:column}}nav{{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 20px;min-height:56px;border-bottom:1px solid #3a3a3e;flex-shrink:0}}nav a{{color:inherit;text-underline-offset:4px;min-height:32px;display:inline-flex;align-items:center}}nav a:focus-visible{{outline:2px solid #cc0000;outline-offset:3px}}.screen-scroll{{flex:1;min-height:0;overflow:auto}}iframe{{display:block;width:100%;height:100%;border:0}}.wide-screen iframe{{min-width:1120px}}small{{color:#aaaab0}}@media(max-width:600px){{nav{{padding:8px 12px;flex-wrap:wrap;gap:4px 16px}}nav strong{{font-size:12px}}small{{display:none}}}}</style></head>
<body><nav aria-label="Dashboard navigation"><a href="/UIUX#dashboards">← Showcase</a><strong>{hud["name"]}</strong><small>Interactive screen · simulated data</small><a href="/UIUX/studies/agent-hud/{hud["slug"]}-screen.html{query}">Open screen ↗</a></nav><div class="screen-scroll{wide}"><iframe title="{hud["name"]} interactive screen" src="/UIUX/studies/agent-hud/{hud["slug"]}-screen.html{query}"></iframe></div></body></html>'''
        (destination / f'{hud["slug"]}.html').write_text(wrapper)
    (destination / "demo-frame.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#111"/><path d="M0 90h320M160 0v180M30 30h260v120H30z" fill="none" stroke="#444"/><circle cx="160" cy="90" r="45" fill="none" stroke="#aaa"/><text x="160" y="168" text-anchor="middle" fill="#aaa" font-family="monospace" font-size="12">ENOCHIAN · DEMO FRAME</text></svg>')


def preview_spec():
    return {"schema_version": 1, "studies": STUDIES, "source_hashes": {
        folder: hashlib.sha256((ROOT / "enochian_knobs_keys" / folder / "index.html").read_bytes()).hexdigest()
        for folder in sorted({s["folder"] for s in STUDIES})
    }}


def study_link(study):
    return f'/UIUX/studies/{study["folder"]}/' + ("#" + study["anchor"] if study["anchor"] else "")


def study_image(study, theme):
    path = UIUX / "previews" / f'{study["slug"]}-{theme}.png'
    digest = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
    # PNG IHDR dimensions keep layout stable before images load.
    data = path.read_bytes()
    width, height = int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")
    return f'<img class="preview-{theme}" src="/UIUX/previews/{path.name}?v={digest}" width="{width}" height="{height}" loading="lazy" alt="{escape(study["name"])} — {theme} finish preview">'


def study_markup():
    if len(STUDIES) != 12 or len({s["name"] for s in STUDIES}) != 12:
        raise ValueError("Expected twelve uniquely named device previews")
    cards = []
    for study in STUDIES:
        cards.append(f'<article class="study-item" id="study-{study["slug"]}" data-name="{escape(study["name"])}" data-group="Devices &amp; instruments" data-search-terms="{escape(study["aliases"])}">'
                     f'<a class="study-preview" href="{study_link(study)}" aria-label="Open {escape(study["name"])}">{study_image(study, "light")}{study_image(study, "dark")}</a>'
                     f'<h3><a href="{study_link(study)}">{escape(study["name"])}</a></h3><p>{escape(study["description"])}</p><a class="study-open" href="{study_link(study)}">Open study →</a></article>')
    return "\n".join(cards)


def public_studies():
    folders = {s["folder"] for s in STUDIES}
    for folder in sorted(folders):
        text = (ROOT / "enochian_knobs_keys" / folder / "index.html").read_text()
        expected_title = {"keyboard":"Enochian MIDI Keyboard", "midi-pad":"Enochian MIDI Pad", "op-1":"Enochian Synth Studio", "speakers":"Enochian Speakers", "dj-decks":"Enochian DJ Controller", "tp-7":"Enochian Audio Recorder", "apple-devices":"Enochian Device Frames"}[folder]
        if BeautifulSoup(text, "html.parser").h1.get_text(" ", strip=True) != expected_title:
            raise ValueError(f"Unexpected public study heading for {folder}")
        # Root navigation paths so Firebase clean URLs cannot move the resolution base.
        text = re.sub(r'(\bhref=["\'])\.\./index\.html(["\'])', r'\1/UIUX\2', text)
        for sibling in sorted(folders):
            text = re.sub(r'(\bhref=["\'])\.\./' + re.escape(sibling) + r'/index\.html(["\'])', rf'\1/UIUX/studies/{sibling}/\2', text)
        destination = UIUX / "studies" / folder / "index.html"
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(text)


def hub_studies():
    selection = ["midi-keyboard", "midi-pad", "synth-studio", "dj-controller", "portable-speaker", "audio-recorder", "desktop-setup"]
    cards = []
    for slug in selection:
        study = next(s for s in STUDIES if s["slug"] == slug)
        name = {"portable-speaker": "Enochian Speakers", "desktop-setup": "Enochian Device Frames"}.get(slug, study["name"])
        link = "/UIUX/studies/" + study["folder"] + "/"
        cards.append(f'<a class="hub-study" href="{link}"><div class="hub-preview">{study_image(study, "dark")}</div><h3>{name}</h3><p>{escape(study["description"])}</p><span>Open study →</span></a>')
    path = ROOT / "index.html"
    text = path.read_text()
    text = re.sub(r'\d+ dashboards</span>', f'{len(HUDS)} dashboards</span>', text)
    text, count = re.subn(r'<!-- STUDY_LINKS -->.*?<!-- END_STUDY_LINKS -->', '<!-- STUDY_LINKS -->\n' + "\n".join(cards) + '\n<!-- END_STUDY_LINKS -->', text, flags=re.S)
    if count != 1:
        raise ValueError("Root page needs exactly one study-links marker")
    path.write_text(text)


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
    aliases = [old for old, new in {**NAME_MAP, **LEGACY_ALIASES}.items() if new == name]
    terms = {"Enochian Synth Keyboard":"keyboard midi", "Enochian Drum Machine":"midi dj", "Enochian Macro Pad":"midi voice voice recorder", "Enochian DJ Mixer":"dj mixer", "Enochian Turntable":"dj", "Enochian Pitch Slider":"dj", "Enochian Stereo Speakers":"speaker speakers", "Enochian Speaker Crossover":"speaker speakers", "Enochian Voice Assistant":"voice voice recorder", "Enochian Tape Deck":"recorder", "Enochian Toggle Bank 01":"toggle switch bank", "Enochian Toggle Bank 02":"toggle switch bank"}
    item["data-search-terms"] = " ".join([*aliases, terms.get(name, "")])
    if name == "Enochian Code Toggle":
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
    if name in ANCHORS:
        item.insert(0, soup.new_tag("span", attrs={"id": ANCHORS[name], "class": "showcase-anchor", "aria-hidden": "true"}))


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
    public_huds()
    records = {key: split_source(path) for key, path in SOURCES.items()}
    found = set()
    counts = Counter()
    for key, (soup, _, _) in records.items():
        selectors = ".cap" if key == "foundation" else "article.unit .cap"
        titles = [cap.select_one("span").get_text(" ", strip=True).split("·")[0].strip() for cap in soup.select(selectors)]
        found.update(titles)
        counts.update(titles)
    expected = {FEATURED, "Enochian Code Toggle", *(name for _, _, names in GROUPS for name in names)}
    if len(NAME_MAP) != 64 or len(set(NAME_MAP.values())) != 64 or set(NAME_MAP.values()) != expected:
        raise ValueError("Approved public name map must contain 63 unique controls and the code utility")
    duplicates = {name: count for name, count in counts.items() if count != (3 if name == "Enochian Code Toggle" else 1)}
    if found != expected or duplicates:
        raise ValueError(f"Catalog mismatch: missing={expected-found}, extra={found-expected}, count={len(found)}, duplicates={duplicates}")
    markup = "".join(source_markup(key, soup) for key, (soup, _, _) in records.items())
    nav, headings = category_nav()
    controls_css = "\n".join(scoped_css(css, key) for key, (_, css, _) in records.items())
    prefix = (UIUX / "controls-prefix.js").read_text()
    script = [prefix]
    for key in ("compact", "instruments", "foundation"):
        logic = records[key][2]
        if key == "foundation":
            script.append('try{animate=(await motionPromise).animate;}catch(error){console.warn("Motion unavailable; controls use immediate transitions",error);}')
        script.append(f'{{\nconst root=globalThis.document.getElementById("source-{key}");\n'
                      f'const document=scopedDocument(root);\nconst addEventListener=scopedListener(root);\n{logic}\n}}')
    atlas_js_version = hashlib.sha256((UIUX / "atlas.js").read_bytes()).hexdigest()[:12]
    script.append(f'import("./atlas.js?v={atlas_js_version}");\n')
    controls_js = "\n".join(script)
    shell = (UIUX / "shell.html").read_text()
    shell = shell.replace("<!-- CATEGORY_NAV -->", nav).replace("<!-- GROUP_HEADINGS -->", headings)
    shell = shell.replace("<!-- CONTROL_MARKUP -->", markup)
    shell = shell.replace("<!-- DEVICE_STUDIES -->", study_markup())
    shell = shell.replace("<!-- HUD_STUDIES -->", hud_markup())
    shell = shell.replace("{{HUD_COUNT}}", str(len(HUDS)))
    shell = shell.replace("{{CONTROL_COUNT}}", str(sum(len(names) for _, _, names in GROUPS) + 1))
    assets = {
        "CSS_VERSION": controls_css.encode(),
        "JS_VERSION": controls_js.encode(),
        "ATLAS_CSS_VERSION": (UIUX / "atlas.css").read_bytes(),
    }
    for placeholder, content in assets.items():
        shell = shell.replace("{{" + placeholder + "}}", hashlib.sha256(content).hexdigest()[:12])
    (UIUX / "index.html").write_text(shell)
    (UIUX / "controls.css").write_text(controls_css)
    (UIUX / "controls.js").write_text(controls_js)
    public_studies()
    hub_studies()
    print(f"Generated {len(expected) - 1} controls, 12 devices, {len(HUDS)} dashboards, and their standalone studies")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview-spec", action="store_true", help="Print the source and selector specification for real-browser preview capture")
    args = parser.parse_args()
    if args.preview_spec:
        print(json.dumps(preview_spec(), indent=2))
    else:
        main()
