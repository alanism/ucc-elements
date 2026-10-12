import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]

class DJAcceptanceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch()
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.p.stop()
    def setUp(self):
        self.assertTrue((ROOT/'dj-decks'/'index.html').is_file(), 'The requested dj-decks study is missing')
        self.page=self.browser.new_page(viewport={'width':1440,'height':1000})
        self.errors=[];self.page.on('pageerror',lambda e:self.errors.append(str(e)))
        self.page.goto((ROOT/'dj-decks'/'index.html').as_uri())
    def tearDown(self):
        if hasattr(self,'page'): self.page.close()
    def test_twin_deck_form_uses_cinnabar(self):
        self.assertEqual(self.page.locator('#controller').count(),1)
        self.assertEqual(self.page.locator('.deck').count(),2)
        self.assertEqual(self.page.locator('.jog').count(),2)
        self.assertEqual(self.page.locator('[data-pad]').count(),16)
        self.assertEqual(self.page.locator('[data-knob]').count(),8)
        self.assertEqual(self.page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase()"),'#cc0000')
        self.assertEqual(self.errors,[])

    def test_responsive_page_keeps_44_pixel_targets(self):
        for width in [280,320,390,700,768,900,1024,1440]:
            with self.subTest(width=width):
                self.page.set_viewport_size({'width':width,'height':1100})
                metrics=self.page.evaluate("""() => ({overflow:document.documentElement.scrollWidth-innerWidth,small:[...document.querySelectorAll('button,a[href],input:not([type=hidden]),[role=slider],summary')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<43.99||r.height<43.99)}).map(el=>({id:el.id,label:el.getAttribute('aria-label')||el.textContent.trim(),w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height}))})""")
                self.assertLessEqual(metrics['overflow'],0,metrics)
                self.assertEqual(metrics['small'],[],metrics)

    def test_control_centers_are_not_occluded(self):
        for width in [280,390,768,1440]:
            self.page.set_viewport_size({'width':width,'height':1100})
            failed=self.page.evaluate("""() => {const fail=[];for(const el of document.querySelectorAll('button,a[href],[role=slider]')){let r=el.getBoundingClientRect();if(!r.width||!r.height)continue;el.scrollIntoView({block:'center',inline:'center',behavior:'instant'});r=el.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);if(hit&&!el.contains(hit))fail.push({id:el.id,label:el.getAttribute('aria-label')||el.textContent.trim(),hit:hit.id||hit.className});}return fail}""")
            self.assertEqual(failed,[],{'width':width,'occluded':failed})

if __name__=='__main__': unittest.main()
