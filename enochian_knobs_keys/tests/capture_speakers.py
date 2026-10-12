"""Capture actual rendered speaker studies; fail on errors or unusable targets."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.qa' / 'speakers'
OUT.mkdir(parents=True, exist_ok=True)
report = []
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for name, width, height, motion, finish in [
        ('desktop-ivory',1440,1050,'no-preference','ivory'),
        ('desktop-obsidian',1440,1050,'no-preference','obsidian'),
        ('mobile-ivory',390,844,'no-preference','ivory'),
        ('mobile-obsidian',390,844,'no-preference','obsidian'),
        ('tablet',768,1000,'no-preference','ivory'),
        ('reduced-motion',1440,1050,'reduce','obsidian'),
    ]:
        context = browser.new_context(viewport={'width':width,'height':height},reduced_motion=motion)
        page = context.new_page()
        errors, requests = [], []
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda r:requests.append(r.url))
        page.goto((ROOT/'speakers'/'index.html').as_uri())
        page.locator(f'[data-speaker-finish="{finish}"]').click()
        page.wait_for_timeout(180)
        page.screenshot(path=str(OUT/f'{name}.png'),full_page=True)
        metrics = page.evaluate('''() => ({
            viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,
            finish:document.querySelector('#twin-unit').dataset.finish,
            objects:[...document.querySelectorAll('#compact-unit,#twin-unit')].map(el=>{
                const r=el.getBoundingClientRect();return{id:el.id,width:r.width,height:r.height};}),
            smallTargets:[...document.querySelectorAll('button,a,[role="slider"],input,summary')].filter(el=>{
                const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<43.99||r.height<43.99);
            }).map(el=>({label:el.getAttribute('aria-label')||el.textContent.trim(),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}))
        })''')
        record = {'view':name,'pageErrors':errors,'remoteRequests':[r for r in requests if r.startswith(('http:','https:'))],**metrics}
        report.append(record)
        context.close()
    browser.close()
(OUT/'visual-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
assert all(not x['pageErrors'] and not x['remoteRequests'] and not x['smallTargets'] and x['pageWidth']==x['viewport'] for x in report), 'Visual acceptance metrics failed; see visual-report.json'
