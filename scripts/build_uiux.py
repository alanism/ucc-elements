"""Build curated Firebase payloads, or capture the approved device previews."""
from pathlib import Path
import argparse
import hashlib
import importlib.metadata
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
STUDY_FOLDERS = {'keyboard', 'midi-pad', 'op-1', 'speakers', 'dj-decks', 'tp-7', 'apple-devices'}

def capture_previews(spec_path):
    from playwright.sync_api import sync_playwright
    spec = json.loads(Path(spec_path).read_text())
    if spec.get('schema_version') != 1 or len(spec['studies']) != 12 or {s['folder'] for s in spec['studies']} != STUDY_FOLDERS:
        raise SystemExit('Expected version 1 of the twelve-study specification')
    for folder, digest in spec['source_hashes'].items():
        if hashlib.sha256((ROOT/'enochian_knobs_keys'/folder/'index.html').read_bytes()).hexdigest() != digest:
            raise SystemExit(f'Source changed after preview specification: {folder}')
    output = ROOT/'UIUX/previews'; output.mkdir(parents=True, exist_ok=True)
    records = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(); version = browser.version
        for study in spec['studies']:
            if not study['slug'] or not all(c in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in study['slug']):
                raise SystemExit('Invalid preview slug')
            for theme in ('light', 'dark'):
                context = browser.new_context(viewport={'width':1440,'height':1100}, reduced_motion='reduce', device_scale_factor=1)
                page = context.new_page(); errors, remote = [], []
                page.on('pageerror', lambda e: errors.append(str(e)))
                page.on('console', lambda m: errors.append(m.text) if m.type=='error' else None)
                page.on('request', lambda r: remote.append(r.url) if r.url.startswith(('http:','https:')) else None)
                page.goto((ROOT/'enochian_knobs_keys'/study['folder']/'index.html').as_uri())
                finish = 'obsidian' if theme=='dark' else study['light_finish']
                page.locator(study['finish_selector'].format(finish=finish)).click()
                page.wait_for_timeout(250)
                if study['folder']=='apple-devices':
                    assert page.locator('[data-screen]').count()==5
                    assert page.locator('[data-screen]').evaluate_all('slots=>slots.every(slot=>slot.childNodes.length===0)')
                name = f"{study['slug']}-{theme}.png"; path = output/name
                page.locator(study['selector']).screenshot(path=str(path),animations='disabled',omit_background=True)
                if errors or remote:
                    raise SystemExit(f'Capture errors for {name}: {errors}, remote requests: {remote}')
                data=path.read_bytes()
                records.append({'slug':study['slug'],'theme':theme,'file':name,'sha256':hashlib.sha256(data).hexdigest(),'width':int.from_bytes(data[16:20],'big'),'height':int.from_bytes(data[20:24],'big')})
                context.close()
        browser.close()
    manifest={'schema_version':1,'playwright':importlib.metadata.version('playwright'),'chromium':version,'viewport':[1440,1100],'reduced_motion':True,'source_hashes':spec['source_hashes'],'images':records}
    (output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(f'Captured {len(records)} real-browser previews; Chromium {version}')

def atlas_files():
    files={Path(f'UIUX/{name}') for name in ('index.html','atlas.css','atlas.js','controls.css','controls.js')}
    files.update(Path('UIUX/studies',folder,'index.html') for folder in STUDY_FOLDERS)
    manifest=json.loads((ROOT/'UIUX/previews/manifest.json').read_text())
    if manifest.get('schema_version')!=1 or len(manifest['images'])!=24:
        raise SystemExit('Expected twenty-four captured previews')
    for record in manifest['images']:
        relative=Path('UIUX/previews')/record['file']
        if relative.parent!=Path('UIUX/previews') or relative.suffix!='.png':raise SystemExit('Unexpected preview path')
        if hashlib.sha256((ROOT/relative).read_bytes()).hexdigest()!=record['sha256']:raise SystemExit(f'Preview changed: {relative}')
        files.add(relative)
    for folder,digest in manifest['source_hashes'].items():
        if folder not in STUDY_FOLDERS or hashlib.sha256((ROOT/'enochian_knobs_keys'/folder/'index.html').read_bytes()).hexdigest()!=digest:
            raise SystemExit(f'Recapture preview after changing {folder}')
    files.add(Path('UIUX/previews/manifest.json'))
    from generate_uiux import HUDS
    files.add(Path('UIUX/studies/agent-hud/demo-frame.svg'))
    config=Path('UIUX/studies/agent-hud/light-table-config.js')
    if not (ROOT/config).is_file():
        (ROOT/config).write_text('window.ENOCHIAN_LIGHT_TABLE_CONFIG = {};\n')
    files.add(config)
    hud_manifest=json.loads((ROOT/'UIUX/previews/hud-manifest.json').read_text())
    if {r['slug'] for r in hud_manifest['images']}!={h['slug'] for h in HUDS}:
        raise SystemExit('Dashboard preview inventory does not match the showcase')
    for record in hud_manifest['images']:
        if hashlib.sha256((ROOT/'UIUX/previews'/f'{record["slug"]}-hud.png').read_bytes()).hexdigest()!=record['sha256']:
            raise SystemExit('Dashboard preview changed after capture')
    for hud in HUDS:
        if hashlib.sha256((ROOT/'prototypes/agent-hud'/hud['source']).read_bytes()).hexdigest()!=hud_manifest['source_hashes'].get(hud['source']):
            raise SystemExit(f'Recapture dashboard preview after changing {hud["source"]}')
    files.add(Path('UIUX/previews/hud-manifest.json'))
    for hud in HUDS:
        files.update([Path(f'UIUX/studies/agent-hud/{hud["slug"]}.html'),
                      Path(f'UIUX/studies/agent-hud/{hud["slug"]}-screen.html'),
                      Path(f'UIUX/previews/{hud["slug"]}-hud.png')])
    return files

def build(showcase=False):
    output=ROOT/('.showcase-dist' if showcase else '.uiux-dist')
    marker=output/('.enochian-showcase-build' if showcase else '.enochian-uiux-build')
    files=atlas_files()
    if showcase:
        tracked=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0')
        for name in tracked:
            if not name:continue
            path=Path(name)
            if any(part.startswith('.') for part in path.parts) or 'tests' in path.parts:continue
            if path in (Path('index.html'),Path('toggle.html')) or path.parts[0] in ('enochian_knobs_keys','learnvietnamese'):
                if path.suffix not in ('.md','.py'):files.add(path)
        if Path('index.html') not in files:raise SystemExit('Tracked root landing page missing')
    for relative in files:
        source=ROOT/relative
        if not source.is_file() or source.is_symlink():raise SystemExit(f'Missing or unexpected release input: {relative}')
    if output.exists():
        if not marker.exists():raise SystemExit(f'Refusing to replace an unrecognized directory: {output}')
        shutil.rmtree(output)
    for relative in sorted(files):
        destination=output/relative;destination.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(ROOT/relative,destination)
    marker.touch()
    print(f'Built {len(files)} public files in {output}')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--showcase',action='store_true',help='Build the curated root showcase release')
    parser.add_argument('--capture-previews',action='store_true',help='Capture the twelve devices in both finishes using test-only Playwright')
    parser.add_argument('--preview-spec',help='JSON emitted by generate_uiux.py --preview-spec')
    args=parser.parse_args()
    if args.capture_previews:
        if not args.preview_spec or args.showcase:parser.error('Capture requires --preview-spec and cannot combine with --showcase')
        capture_previews(args.preview_spec)
    else:build(args.showcase)
