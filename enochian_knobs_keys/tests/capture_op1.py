"""Capture the actual study for desktop/mobile/reduced-motion visual review."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.qa' / 'op-1'
OUT.mkdir(parents=True, exist_ok=True)
report = []
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for name, width, height, motion in [
        ('desktop', 1440, 1000, 'no-preference'),
        ('mobile', 390, 844, 'no-preference'),
        ('reduced-motion', 1440, 1000, 'reduce'),
        ('obsidian', 1440, 1000, 'no-preference'),
        ('chord', 1440, 1000, 'no-preference'),
        ('tape', 1440, 1000, 'no-preference'),
        ('mobile-controls', 390, 844, 'no-preference'),
    ]:
        page = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion=motion)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto((ROOT / 'op-1' / 'index.html').as_uri())
        if name == 'obsidian':
            page.locator('[data-set-finish=obsidian]').click()
        elif name == 'chord':
            page.locator('[data-note="0"]').focus()
            for key in ['a','d','g']:
                page.keyboard.down(key)
        elif name == 'tape':
            page.locator('#record').click()
            page.locator('#play').click()
            page.locator('[data-note="0"]').focus()
            page.keyboard.down('a')
            page.wait_for_timeout(120)
            page.keyboard.up('a')
            page.locator('#stop').click()
        elif name == 'mobile-controls':
            page.locator('[data-preset="3"]').click()
            page.evaluate("const el=document.querySelector('.hardware-scroll');el.scrollLeft=el.scrollWidth-el.clientWidth")
        page.wait_for_timeout(250)
        path = OUT / f'{name}.png'
        page.screenshot(path=str(path), full_page=True)
        metrics = page.evaluate('''() => ({
            viewport: innerWidth,
            pageWidth: document.documentElement.scrollWidth,
            hardware: (() => {const r=document.querySelector('#instrument').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})(),
            keys: document.querySelectorAll('#keyboard .op-cell').length,
            encoders: document.querySelectorAll('[data-encoder]').length,
            externalResources: performance.getEntriesByType('resource').map(x=>x.name).filter(x=>/^https?:/.test(x)),
            controlsBelow44: [...document.querySelectorAll('#instrument button, #instrument [role="slider"]')].filter(x=>{const r=x.getBoundingClientRect();return r.width<44||r.height<44}).map(x=>({label:x.getAttribute('aria-label')||x.textContent.trim(),width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height}))
        })''')
        report.append({'view': name, 'screenshot': str(path), 'pageErrors': errors, **metrics})
        page.close()
    browser.close()
(OUT / 'visual-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
