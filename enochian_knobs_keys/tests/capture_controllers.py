"""Capture real browser renderings and fail on reported geometry violations."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.qa' / 'controllers'
OUT.mkdir(parents=True, exist_ok=True)
report = []
views = [('desktop',1440,1100,'no-preference'), ('mobile',390,844,'no-preference'),
         ('narrow',280,900,'no-preference'), ('tablet',768,1100,'no-preference'),
         ('reduced-motion',1440,1100,'reduce')]
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for folder in ['keyboard','midi-pad']:
        for name,width,height,motion in views:
            ctx = browser.new_context(viewport={'width':width,'height':height}, reduced_motion=motion)
            page = ctx.new_page()
            errors, remote = [], []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('request', lambda r: remote.append(r.url) if r.url.startswith(('http:','https:')) else None)
            page.goto((ROOT / folder / 'index.html').as_uri())
            page.wait_for_timeout(120)
            path = OUT / f'{folder}-{name}.png'
            page.screenshot(path=str(path), full_page=True)
            metrics = page.evaluate('''() => ({viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,
                accent:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase(),
                smallTargets:[...document.querySelectorAll('button,a[href],select,input:not([type="hidden"]),[role="slider"],summary')]
                  .filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<43.99||r.height<43.99)})
                  .map(el=>{const r=el.getBoundingClientRect();return {id:el.id,label:el.getAttribute('aria-label')||el.textContent.trim(),width:r.width,height:r.height}})})''')
            report.append({'view':f'{folder}-{name}','path':str(path),'pageErrors':errors,'remoteRequests':remote,**metrics})
            ctx.close()
    browser.close()
(OUT / 'visual-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
failures = [r for r in report if r['pageErrors'] or r['remoteRequests'] or r['smallTargets'] or r['pageWidth']!=r['viewport'] or r['accent']!='#cc0000']
print(json.dumps({'captured':len(report),'failures':failures,'paths':[r['path'] for r in report]},indent=2))
assert not failures, 'Visual metric failures; see .qa/controllers/visual-report.json'
