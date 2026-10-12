"""Acceptance gates for the two additive, offline controller studies."""
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

class ControllerAcceptanceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p = sync_playwright().start()
        cls.browser = cls.p.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.p.stop()

    def open_study(self, name):
        path = ROOT / name / 'index.html'
        self.assertTrue(path.is_file(), f'The requested {name} study is missing')
        page = self.browser.new_page(viewport={'width':1440, 'height':1100})
        self.addCleanup(page.close)
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(path.as_uri())
        return page, errors

    def test_keyboard_reference_form_and_silent_initialization(self):
        page, errors = self.open_study('keyboard')
        self.assertEqual(page.locator('#keyboard-controller').count(), 1)
        self.assertEqual(page.locator('[data-key]').count(), 25)
        self.assertEqual(page.locator('[data-pad]').count(), 16)
        self.assertEqual(page.locator('[data-encoder]').count(), 8)
        self.assertEqual(page.locator('[data-strip]').count(), 2)
        self.assertEqual(page.locator('#sound-toggle').get_attribute('aria-pressed'), 'false')
        self.assertEqual(page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase()"), '#cc0000')
        self.assertEqual(errors, [])

    def test_midi_pad_reference_form_and_silent_initialization(self):
        page, errors = self.open_study('midi-pad')
        self.assertEqual(page.locator('#pad-controller').count(), 1)
        self.assertEqual(page.locator('[data-pad]').count(), 16)
        self.assertEqual(page.locator('[data-encoder]').count(), 4)
        self.assertEqual(page.locator('[data-strip]').count(), 1)
        self.assertEqual(page.locator('#sound-toggle').get_attribute('aria-pressed'), 'false')
        self.assertEqual(page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase()"), '#cc0000')
        self.assertEqual(errors, [])

    def test_original_atlas_links_each_new_study_once(self):
        source = (ROOT / 'index.html').read_text(encoding='utf-8')
        for folder in ['keyboard', 'midi-pad']:
            self.assertEqual(source.count(f'href="{folder}/index.html"'), 1)

    def test_responsive_targets_preserve_physical_hit_areas(self):
        for folder in ['keyboard', 'midi-pad']:
            page, errors = self.open_study(folder)
            for width in [280,320,390,768,1024,1440]:
                with self.subTest(folder=folder, width=width):
                    page.set_viewport_size({'width':width,'height':1100})
                    metrics = page.evaluate('''() => ({overflow:document.documentElement.scrollWidth-innerWidth,
                      small:[...document.querySelectorAll('button,a[href],select,input:not([type=hidden]),[role=slider],summary')]
                        .filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<43.99||r.height<43.99)})
                        .map(el=>({id:el.id,label:el.getAttribute('aria-label')||el.textContent.trim(),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}))})''')
                    self.assertLessEqual(metrics['overflow'], 0, metrics)
                    self.assertEqual(metrics['small'], [], metrics)
            self.assertEqual(errors, [])

    def test_control_centers_are_reachable_after_internal_panning(self):
        for folder in ['keyboard', 'midi-pad']:
            page, errors = self.open_study(folder)
            page.locator('details').evaluate_all('(elements) => elements.forEach(el => el.open = true)')
            for width in [280,390,768,1440]:
                page.set_viewport_size({'width':width,'height':1100})
                failed = page.evaluate('''() => {const fail=[];
                  for(const el of document.querySelectorAll('button,a[href],select,input:not([type=hidden]),[role=slider],summary')){
                    let r=el.getBoundingClientRect(); if(!r.width||!r.height)continue;
                    el.scrollIntoView({block:'center',inline:'center',behavior:'instant'}); r=el.getBoundingClientRect();
                    const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
                    if(!hit||!el.contains(hit))fail.push({id:el.id,label:el.getAttribute('aria-label')||el.textContent.trim(),hit:hit?.id||hit?.className||null});
                  }return fail;}''')
                self.assertEqual(failed, [], {'folder':folder,'width':width,'occluded':failed})
            self.assertEqual(errors, [])

    def test_keyboard_oled_keeps_full_sound_state_readable(self):
        page, errors = self.open_study('keyboard')
        for width in [280,390,1440]:
            page.set_viewport_size({'width':width,'height':1100})
            metrics = page.locator('#screen-bottom').evaluate('(el) => ({text:el.textContent,width:el.clientWidth,contentWidth:el.scrollWidth})')
            self.assertLessEqual(metrics['contentWidth'], metrics['width'], metrics)
        self.assertEqual(errors, [])

if __name__ == '__main__':
    unittest.main()
