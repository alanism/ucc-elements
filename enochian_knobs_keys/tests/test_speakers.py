"""Reference-form acceptance checks for the two new audio studies."""
from pathlib import Path
import unittest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'speakers' / 'index.html'

class SpeakerAcceptanceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width':1440,'height':1000})
        self.page = self.context.new_page()
        self.errors = []
        self.requests = []
        self.page.on('pageerror', lambda e:self.errors.append(str(e)))
        self.page.on('request', lambda r:self.requests.append(r.url))
        self.page.goto(PAGE.as_uri() if PAGE.exists() else 'about:blank')

    def tearDown(self):
        self.context.close()

    def test_top_rail_hit_areas_do_not_overlap(self):
        for width in [280,320,340,390,768,1024,1440]:
            with self.subTest(width=width):
                self.page.set_viewport_size({'width':width,'height':1100})
                overlaps=self.page.locator('.top-rail button,.top-rail [role="slider"]').evaluate_all('''els=>{
                    const found=[];
                    for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){
                        const a=els[i].getBoundingClientRect(),b=els[j].getBoundingClientRect();
                        const w=Math.min(a.right,b.right)-Math.max(a.left,b.left),h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
                        if(w>.1&&h>.1)found.push({a:els[i].id,b:els[j].id,width:w,height:h});
                    }
                    return found;
                }''')
                self.assertEqual(overlaps,[],'A 44px bounding box must also be an unobstructed hit area')

    def test_controls_remain_inside_horizontal_viewport(self):
        for width in [280,320,390,700,701,768,900,901,1024,1440]:
            with self.subTest(width=width):
                self.page.set_viewport_size({'width':width,'height':1000})
                clipped = self.page.locator('button,a,[role="slider"],summary').evaluate_all('''els=>els.filter(el=>{
                    const r=el.getBoundingClientRect();return r.width&&r.height&&(r.left<-.1||r.right>innerWidth+.1);
                }).map(el=>({label:el.getAttribute('aria-label')||el.textContent.trim(),left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}))''')
                self.assertEqual(clipped,[], 'No reachable control may be clipped horizontally')

    def test_visible_controls_keep_44_pixel_targets(self):
        self.assertTrue(PAGE.exists(), 'Speaker study must exist')
        for width in [280,320,390,700,701,768,900,901,1024,1440]:
            with self.subTest(width=width):
                self.page.set_viewport_size({'width':width,'height':1000})
                undersized = self.page.locator('button,a,[role="slider"],summary').evaluate_all('''els=>els.filter(el=>{
                    const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<43.99||r.height<43.99);
                }).map(el=>({label:el.getAttribute('aria-label')||el.textContent.trim(),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}))''')
                self.assertEqual(undersized,[])
                self.assertEqual(self.page.evaluate('document.documentElement.scrollWidth'),width)

    def test_two_reference_forms_exist_as_operable_components(self):
        self.assertEqual(self.page.locator('#compact-unit').count(),1,'Compact woven-grille study is missing')
        self.assertEqual(self.page.locator('#twin-unit').count(),1,'Twin-driver study is missing')
        self.assertEqual(self.page.locator('#compact-unit .woven-grille').count(),1)
        self.assertEqual(self.page.locator('#twin-unit .driver').count(),2)
        self.assertEqual(self.page.locator('#twin-unit .tweeter').count(),2)
        self.assertEqual(self.page.locator('#twin-unit .carry-handle').count(),1)
        self.assertEqual(self.errors,[])
        self.assertEqual([r for r in self.requests if r.startswith(('http:','https:'))],[])

if __name__ == '__main__':
    unittest.main()
