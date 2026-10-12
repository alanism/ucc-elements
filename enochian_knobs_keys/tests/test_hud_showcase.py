"""Exercise the published dashboard collection and its isolated screen controls."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import unittest
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

class HUDShowcaseTests(unittest.TestCase):
    def test_gallery_discovery_and_working_screens(self):
        server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        base=f'http://127.0.0.1:{server.server_port}'
        try:
            with sync_playwright() as pw:
                browser=pw.chromium.launch()
                page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
                errors=[];bad=[]
                page.on('pageerror',lambda error:errors.append(str(error)))
                page.on('response',lambda response:bad.append(response.url) if response.status>=400 and response.url.startswith(base) else None)
                page.goto(base+'/UIUX/');page.wait_for_selector('#code-select option',state='attached')
                self.assertEqual(page.locator('.atlas-item:not(.code-veil-item)').count(),63)
                self.assertEqual(page.locator('.study-item:not(.hud-item)').count(),12)
                self.assertEqual(page.locator('.hud-item').count(),6)
                self.assertEqual(page.locator('#code-select option').count(),63)
                for word in ['dashboard','hud','VR','video production','harness','light table']:
                    page.locator('#atlas-search').fill(word)
                    self.assertGreater(page.locator('#search-results button').count(),0,word)
                page.locator('#atlas-search').fill('')
                links=page.locator('.hud-item .study-open').evaluate_all('links=>links.map(link=>link.getAttribute("href"))')
                for width in [1440,390]:
                    page.set_viewport_size({'width':width,'height':1000})
                    for theme in ['light','dark']:
                        page.locator(f'[data-theme-option="{theme}"]').click()
                        self.assertTrue(page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
                        for image in page.locator('.hud-item img').all():
                            image.scroll_into_view_if_needed();image.evaluate('(image)=>image.decode()')
                            self.assertTrue(image.is_visible())
                for link in links:
                    for width in [1440,390]:
                        page.set_viewport_size({'width':width,'height':1000})
                        page.goto(base+link)
                        screen=page.frame_locator('iframe')
                        self.assertTrue(page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
                        if 'agent-hud.html' in link or 'build-board.html' in link:
                            screen.locator('#pause').click();expect(screen.locator('#pause')).to_have_attribute('aria-pressed','true')
                        if 'build-board.html' in link:
                            screen.locator('.views [data-v="board"]').click();expect(screen.locator('#center')).to_have_attribute('data-view','board')
                            screen.locator('.views [data-v="field"]').click();expect(screen.locator('#center')).to_have_attribute('data-view','field')
                        elif 'decision-matrix.html' in link:
                            screen.locator('#optSeg [data-o="B"]').click();expect(screen.locator('#optB')).to_have_class('opt on')
                        elif 'command-deck.html' in link:
                            screen.locator('#cMetric [data-v="files"]').click();expect(screen.locator('#cMetric [data-v="files"]')).to_have_attribute('aria-pressed','true')
                        elif 'command-deck-v2.html' in link:
                            screen.locator('.qr[data-k="t1"]').click()
                            screen.locator('#dP [data-st="running"]').click()
                            expect(screen.locator('#dP .pill')).to_have_text('RUNNING')
                            screen.locator('body').press('z');expect(screen.locator('#dP .pill')).to_have_text('TODO')
                            screen.locator('#gView [data-v="b"]').click();expect(screen.locator('#gView [data-v="b"]')).to_have_attribute('aria-pressed','true')
                            screen.locator('.qr[data-k="t4"]').click()
                            for image in screen.locator('.th img').all():image.evaluate('(image)=>image.decode()')
                        elif 'light-table.html' in link:
                            screen.locator('[data-model="R2"]').first.click()
                            expect(screen.locator('#focusTxt')).to_contain_text('R2')
                            screen.locator('#focusX').click()
                            screen.locator('[data-act="compact"][data-agent="166"]').first.click()
                            expect(screen.locator('#toastMsg')).to_contain_text('compacted')
                            screen.locator('body').press('z')
                            expect(screen.locator('[data-act="compact"][data-agent="166"]').first).to_be_visible()
                            screen.locator('#gScreen [data-screen="mission"]').click()
                            expect(screen.locator('#s-mission')).to_have_class('screen on')
                            screen.locator('#gScreen [data-screen="devices"]').click()
                            expect(screen.locator('#s-devices')).to_have_class('screen on')
                            screen.locator('[data-device="A2"]').click()
                            expect(screen.locator('[data-device="A2"]')).to_have_attribute('aria-pressed','true')
                            screen.locator('#gTheme [data-v="white"]').click()
                            expect(screen.locator('html')).to_have_attribute('data-theme','white')
                        page.locator('a[href="/UIUX#dashboards"]').click();page.wait_for_selector('#code-select option',state='attached')
                        self.assertEqual(page.locator('.hud-item').count(),6)
                self.assertEqual(errors,[])
                self.assertEqual(bad,[])
                browser.close()
        finally:
            server.shutdown();thread.join(timeout=5);server.server_close()
