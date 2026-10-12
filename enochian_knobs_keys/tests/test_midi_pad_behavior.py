"""Vertical performance trace against the real offline Web Audio graph."""
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

class PadBehavior(unittest.TestCase):
    def test_chassis_contains_controls_at_reference_aspect(self):
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={'width': 1440, 'height': 1200})
            page.goto((ROOT/'midi-pad/index.html').as_uri())
            geometry = page.evaluate('''() => {
                const c = document.querySelector('#pad-controller').getBoundingClientRect();
                return {ratio:c.width/c.height, overflow:[...document.querySelectorAll('#pad-controller button')].filter(el => {const r=el.getBoundingClientRect(); return r.bottom>c.bottom-15 || r.top<c.top || r.left<c.left || r.right>c.right;}).map(el=>el.id || el.dataset.pad)};
            }''')
            self.assertAlmostEqual(geometry['ratio'], 1010/740, places=2)
            self.assertEqual(geometry['overflow'], [])
            browser.close()

    def test_local_performance_sequence_and_safe_scene_switch(self):
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            # Browser lifetime is owned by the Playwright context.
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto((ROOT/'midi-pad/index.html').as_uri())
            self.assertTrue(page.evaluate('!!window.padLab'))
            page.click('#sound-toggle')
            page.wait_for_function('padLab.ctx && padLab.ctx.state === "running"')
            page.click('[data-mode=piano]')
            page.keyboard.down('q')
            self.assertEqual(page.evaluate('padLab.held.size'), 1)
            self.assertGreater(page.evaluate('padLab.voices.size'), 0)
            self.assertGreater(page.evaluate('[...padLab.voices][0].nodes.length'), 2)
            page.keyboard.up('q')
            page.click('[data-mode=sequence]')
            page.click('[data-pad="0"]')
            self.assertEqual(page.evaluate('padLab.sequence[0]'), 0)
            page.click('#play')
            page.wait_for_timeout(200)
            self.assertTrue(page.evaluate('padLab.state.playing'))
            page.click('#next-scene')
            self.assertFalse(page.evaluate('padLab.state.playing'))
            self.assertTrue(page.evaluate('padLab.sequence.every(x => x === null)'))
            page.click('#previous-scene')
            self.assertEqual(page.evaluate('padLab.sequence[0]'), 0)
            page.click('#delete')
            page.click('#undo')
            self.assertEqual(page.evaluate('padLab.sequence[0]'), 0)
            page.click('#sound-toggle')
            page.wait_for_timeout(70)
            self.assertEqual(page.evaluate('padLab.voices.size'), 0)
            self.assertEqual(page.evaluate('padLab.held.size'), 0)
            self.assertEqual(errors, [])

if __name__ == '__main__':
    unittest.main()
