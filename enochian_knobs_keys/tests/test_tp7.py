import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]

class TPAcceptanceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch()
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.p.stop()
    def setUp(self):
        self.assertTrue((ROOT/'tp-7'/'index.html').is_file(), 'The requested tp-7 study is missing')
        self.page=self.browser.new_page(viewport={'width':1440,'height':1000})
        self.errors=[];self.page.on('pageerror',lambda e:self.errors.append(str(e)))
        self.page.goto((ROOT/'tp-7'/'index.html').as_uri())
    def tearDown(self):
        if hasattr(self,'page'): self.page.close()
    def test_reference_recorder_form_uses_cinnabar(self):
        self.assertEqual(self.page.locator('#recorder').count(),1)
        self.assertEqual(self.page.locator('#jog-wheel').count(),1)
        self.assertEqual(self.page.locator('#recorder-screen').count(),1)
        for name in ['record','play','stop']:
            self.assertEqual(self.page.locator('#recorder-'+name).count(),1)
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

    def test_oled_content_fits_inside_its_bezel(self):
        for width in [280,320,390,768,1440]:
            self.page.set_viewport_size({'width':width,'height':1100})
            overflow=self.page.evaluate("""() => {const box=document.querySelector('#recorder-screen').getBoundingClientRect();return [...document.querySelectorAll('#recorder-screen strong,#recorder-screen .screen-bottom')].filter(el=>{const r=el.getBoundingClientRect();return r.x<box.x+1.9||r.right>box.right-1.9||r.y<box.y+1.9||r.bottom>box.bottom-1.9}).map(el=>({text:el.textContent.trim(),bottom:el.getBoundingClientRect().bottom,bezelBottom:box.bottom}));}""")
            self.assertEqual(overflow,[],{'width':width,'overflow':overflow})

    def test_metal_finishes_remain_neutral_not_olive(self):
        for finish in ['silver','obsidian']:
            self.page.locator('#finish-'+finish).click()
            casts=self.page.evaluate("""() => {return [...document.querySelectorAll('#recorder,#recorder .platter,#recorder .hub,#recorder .transport button')].map(el=>({part:el.className||el.id,background:getComputedStyle(el).backgroundImage})).flatMap(p=>[...p.background.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)].filter(m=>Math.max(+m[1],+m[2],+m[3])-Math.min(+m[1],+m[2],+m[3])>1).map(m=>({part:p.part,rgb:m.slice(1,4)})));}""")
            self.assertEqual(casts,[],{'finish':finish,'nonneutralMetal':casts})

if __name__=='__main__': unittest.main()
