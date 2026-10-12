"""Browser acceptance checks for the Enochian OP-1-inspired study.
Run: python -m unittest discover -s tests -v
Playwright and its Chromium browser are test-only dependencies.
"""
from pathlib import Path
import unittest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'op-1' / 'index.html'


class InstrumentBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width': 1440, 'height': 1000})
        self.page = self.context.new_page()
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        # A missing feature is an assertion failure, not a navigation error.
        if PAGE.exists():
            self.page.goto(PAGE.as_uri())
        else:
            self.page.goto('about:blank')

    def tearDown(self):
        self.context.close()

    def test_keyboard_reuses_canticle_construction_for_two_octaves(self):
        self.assertEqual(self.page.locator('#instrument').count(), 1, 'OP-1 study is missing')
        self.assertEqual(self.page.locator('#keyboard .op-cell[data-note]').count(), 24)
        self.assertEqual(self.page.locator('#keyboard .op-row-w .op-cap').count(), 14)
        self.assertEqual(self.page.locator('#keyboard .op-row-b .op-cap').count(), 10)
        self.assertEqual(self.page.locator('[data-encoder]').count(), 4)
        self.assertEqual(self.errors, [])

    def test_mobile_instrument_controls_have_at_least_44_pixel_targets(self):
        self.page.set_viewport_size({'width': 390, 'height': 844})
        undersized = self.page.locator('#instrument button, #instrument [role="slider"]').evaluate_all('''els => els.filter(el => {
            const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44;
        }).map(el => ({label:el.getAttribute('aria-label'), width:el.getBoundingClientRect().width, height:el.getBoundingClientRect().height}))''')
        self.assertEqual(undersized, [], 'Mobile controls must remain operable without shrinking targets')
        self.assertEqual(self.page.evaluate('document.documentElement.scrollWidth'), 390)


if __name__ == '__main__':
    unittest.main()
