"""Grid16 material finishes; real browser state, not CSS source assertions."""
import unittest
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

class Grid16FinishTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width':1440,'height':1200})
        self.addCleanup(self.context.close)
        self.page = self.context.new_page()
        self.page.set_default_timeout(1500)
        self.errors = []
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))

    def load(self):
        self.page.goto((ROOT/'midi-pad/index.html').as_uri())

    def test_white_and_obsidian_change_materials_and_pressed_state(self):
        self.load()
        root = self.page.locator('#pad-controller')
        self.assertEqual(root.get_attribute('data-finish'), 'ivory')
        colors = []
        for finish in ['ivory','obsidian','ivory']:
            self.page.locator(f'[data-set-finish="{finish}"]').click()
            self.assertEqual(root.get_attribute('data-finish'), finish)
            self.assertEqual(self.page.locator('[data-set-finish][aria-pressed=true]').count(), 1)
            self.assertEqual(self.page.locator(f'[data-set-finish="{finish}"]').get_attribute('aria-pressed'), 'true')
            colors.append(root.evaluate('(el) => getComputedStyle(el).backgroundColor'))
            self.assertEqual(self.page.locator('[data-pad]').count(), 16)
            self.assertEqual(self.page.locator('[data-encoder]').count(), 4)
            self.assertEqual(self.page.locator('#sound-toggle').get_attribute('aria-pressed'), 'false')
        self.assertEqual(colors, ['rgb(238, 239, 235)','rgb(51, 55, 58)','rgb(238, 239, 235)'])
        self.assertEqual(self.errors, [])

    def test_finish_persists_without_touching_other_studies(self):
        self.load()
        self.page.evaluate('''() => {
            localStorage.setItem('enochian-canticle-finish','ivory');
            localStorage.setItem('enochian.speakers.twin.finish','ivory');
        }''')
        for finish in ['obsidian','ivory']:
            self.page.locator(f'[data-set-finish="{finish}"]').click()
            self.assertEqual(self.page.evaluate("localStorage.getItem('enochian.grid16.finish')"), finish)
            self.page.reload()
            self.assertEqual(self.page.locator('#pad-controller').get_attribute('data-finish'), finish)
            self.assertEqual(self.page.locator(f'[data-set-finish="{finish}"]').get_attribute('aria-pressed'), 'true')
        self.assertEqual(self.page.evaluate("localStorage.getItem('enochian-canticle-finish')"), 'ivory')
        self.assertEqual(self.page.evaluate("localStorage.getItem('enochian.speakers.twin.finish')"), 'ivory')
        self.assertEqual(self.errors, [])

    def test_invalid_saved_finish_falls_back_to_white(self):
        self.page.add_init_script("localStorage.setItem('enochian.grid16.finish','unknown-palette')")
        self.load()
        self.assertEqual(self.page.locator('#pad-controller').get_attribute('data-finish'), 'ivory')
        self.assertEqual(self.page.locator('[data-set-finish=ivory]').get_attribute('aria-pressed'), 'true')
        self.assertEqual(self.errors, [])

    def test_blocked_storage_does_not_break_palette_switching(self):
        self.page.add_init_script('''
            Storage.prototype.getItem = function(){throw new DOMException('Blocked','SecurityError')};
            Storage.prototype.setItem = function(){throw new DOMException('Blocked','SecurityError')};
        ''')
        self.load()
        self.page.locator('[data-set-finish=obsidian]').click()
        self.assertEqual(self.page.locator('#pad-controller').get_attribute('data-finish'), 'obsidian')
        self.assertEqual(self.page.evaluate('padLab.ctx'), None)
        self.assertEqual(self.errors, [])

    def test_labels_keep_contrast_in_both_materials(self):
        def luminance(rgb):
            channels=[v/255 for v in rgb]
            linear=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in channels]
            return sum(v*w for v,w in zip(linear,[.2126,.7152,.0722]))
        def rgb(text):
            return [float(v) for v in re.findall(r'[0-9.]+',text)[:3]]
        def hex_rgb(text):
            return [int(text.strip()[i:i+2],16) for i in [1,3,5]]
        self.load()
        for finish in ['ivory','obsidian']:
            self.page.locator(f'[data-set-finish="{finish}"]').click()
            data=self.page.locator('#pad-controller').evaluate('''root => {
                const style=getComputedStyle(root);
                return {backgrounds:['--case','--cap-high','--cap-low','--pad-high','--pad-low','--pressed'].map(k=>style.getPropertyValue(k).trim()),
                  foregrounds:[...root.querySelectorAll('.brand,.hardware-button,.pad,.encoder-cell,.round small')].map(el=>({label:el.textContent.trim(),color:getComputedStyle(el).color}))};
            }''')
            for label in data['foregrounds']:
                fg=luminance(rgb(label['color']))
                for background in data['backgrounds']:
                    bg=luminance(hex_rgb(background))
                    contrast=(max(fg,bg)+.05)/(min(fg,bg)+.05)
                    self.assertGreaterEqual(contrast,4.5,{'finish':finish,'label':label,'background':background,'contrast':contrast})

    def test_palette_change_preserves_native_sound_and_pattern(self):
        self.load()
        self.page.locator('#sound-toggle').click()
        self.page.wait_for_function('padLab.ctx && padLab.ctx.state==="running" && padLab.state.sound')
        self.page.locator('[data-mode=piano]').click()
        self.page.locator('[data-pad="0"]').focus()
        self.page.keyboard.down('q')
        self.page.wait_for_function('padLab.voices.size > 0')
        self.page.evaluate('window.originalContext=padLab.ctx;window.originalVoices=[...padLab.voices]')
        for finish in ['obsidian','ivory']:
            self.page.locator(f'[data-set-finish="{finish}"]').click()
            self.assertTrue(self.page.evaluate('padLab.ctx===originalContext && padLab.ctx.state==="running"'))
            self.assertTrue(self.page.evaluate('originalVoices.every(v=>padLab.voices.has(v))'))
            self.assertEqual(self.page.evaluate('padLab.held.size'),1)
        self.page.keyboard.up('q')
        self.page.locator('#stop').click()
        self.page.locator('[data-mode=sequence]').click()
        self.page.locator('[data-pad="0"]').click()
        self.page.locator('[data-set-finish=obsidian]').click()
        self.assertEqual(self.page.evaluate('padLab.sequence[0]'),0)
        self.assertEqual(self.errors, [])

if __name__ == '__main__':
    unittest.main()
