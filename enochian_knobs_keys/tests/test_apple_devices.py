"""Browser acceptance checks for the blank device-frame study."""
from pathlib import Path
import unittest
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
STUDY=ROOT/'apple-devices/index.html'

class AppleDeviceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw=sync_playwright().start();cls.browser=cls.pw.chromium.launch()
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.pw.stop()
    def setUp(self):
        self.context=self.browser.new_context(viewport={'width':1440,'height':1100})
        self.addCleanup(self.context.close)
        self.page=self.context.new_page();self.page.set_default_timeout(1500)
        self.errors=[];self.requests=[]
        self.page.on('pageerror',lambda e:self.errors.append(str(e)))
        self.page.on('request',lambda r:self.requests.append(r.url) if r.url.startswith(('http:','https:')) else None)
    def load(self):
        if STUDY.exists():self.page.goto(STUDY.as_uri())
        else:self.page.set_content('<!doctype html><title>Device study not implemented</title>')
    def assert_blank(self,name,ratio):
        slot=self.page.locator(f'[data-screen="{name}"]')
        self.assertEqual(slot.count(),1,name)
        self.assertEqual(slot.evaluate('el=>el.childNodes.length'),0)
        r=slot.bounding_box();self.assertIsNotNone(r)
        self.assertAlmostEqual(r['width']/r['height'],ratio,delta=.02)
        self.assertEqual(self.page.locator('[data-screen] img,[data-screen] canvas,[data-screen] video,[data-screen] iframe').count(),0)
        self.assertEqual(self.errors,[]);self.assertEqual(self.requests,[])
    def test_display_pair_has_blank_screen_and_compact_desktop(self):
        self.load();p=self.page
        self.assertEqual(p.locator('[data-device="display"]').count(),1)
        self.assertEqual(p.locator('[data-device="mac-mini"]').count(),1)
        self.assertEqual(p.locator('[data-device="mac-mini"] .port').count(),3)
        self.assertEqual(p.locator('[data-device="display"] .stand').count(),1)
        self.assert_blank('display',16/9)

    def test_all_in_one_has_blank_screen_keyboard_and_mouse(self):
        self.load();p=self.page
        for name in ['imac','keyboard','mouse']:
            self.assertEqual(p.locator(f'[data-device="{name}"]').count(),1,name)
        self.assertEqual(p.locator('[data-device="imac"] .chin').count(),1)
        self.assertEqual(p.locator('[data-device="keyboard"] .key-row').count(),5)
        self.assertGreater(p.locator('[data-device="keyboard"] .keycap').count(),50)
        self.assert_blank('imac',16/9)

    def test_laptop_has_blank_screen_and_front_base(self):
        self.load();p=self.page
        self.assertEqual(p.locator('[data-device="macbook"]').count(),1)
        self.assertEqual(p.locator('[data-device="macbook"] .laptop-base').count(),1)
        self.assertEqual(p.locator('[data-device="macbook"] .base-scoop').count(),1)
        self.assert_blank('macbook',16/10)

    def test_tablet_has_blank_landscape_screen_and_stylus(self):
        self.load();p=self.page
        self.assertEqual(p.locator('[data-device="ipad"]').count(),1)
        self.assertEqual(p.locator('[data-device="pencil"]').count(),1)
        self.assertEqual(p.locator('[data-device="ipad"] .camera').count(),1)
        self.assert_blank('ipad',4/3)

    def test_phone_has_blank_screen_with_physical_island_and_buttons(self):
        self.load();p=self.page
        self.assertEqual(p.locator('[data-device="iphone"]').count(),1)
        self.assertEqual(p.locator('[data-device="iphone"] .island').count(),1)
        self.assertEqual(p.locator('[data-device="iphone"] .side-button').count(),4)
        self.assertEqual(p.locator('[data-screen="iphone"]').inner_text(),'')
        self.assert_blank('iphone',9/19.5)

    def test_finish_controls_change_all_hardware_materials_without_screen_content(self):
        self.load();p=self.page
        expected={'display','mac-mini','imac','keyboard','mouse','macbook','ipad','pencil','iphone'}
        self.assertEqual(set(p.locator('[data-device]').evaluate_all('els=>els.map(el=>el.dataset.device)')),expected)
        self.assertEqual(p.locator('[role="group"][aria-label="Device finish"]').count(),1)
        for finish,case in [('ivory','#eeefeb'),('obsidian','#33373a'),('ivory','#eeefeb')]:
            button=p.locator(f'[data-set-finish="{finish}"]')
            self.assertEqual(button.get_attribute('type'),'button')
            button.focus();p.keyboard.press('Enter' if finish=='obsidian' else 'Space')
            self.assertEqual(p.locator('#device-gallery').get_attribute('data-finish'),finish)
            self.assertEqual(p.locator('[data-set-finish][aria-pressed="true"]').count(),1)
            self.assertEqual(button.get_attribute('aria-pressed'),'true')
            values=p.locator('[data-device]').evaluate_all("els=>els.map(el=>getComputedStyle(el).getPropertyValue('--case').trim())")
            self.assertEqual(values,[case]*len(expected))
            self.assertEqual(p.locator('[data-screen]').evaluate_all('els=>els.every(el=>el.childNodes.length===0)'),True)
            self.assertIn('rgb(51, 55, 58)' if finish=='obsidian' else 'rgb(238, 239, 235)',p.locator('.mini').evaluate('el=>getComputedStyle(el).backgroundImage'))
        self.assertEqual(p.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()"),'#cc0000')
        self.assertEqual(self.errors,[]);self.assertEqual(self.requests,[])

    def test_finish_preference_persists_without_touching_other_studies(self):
        self.load();p=self.page
        self.assertIsNone(p.evaluate("localStorage.getItem('enochian.apple-devices.finish')"))
        p.evaluate("localStorage.setItem('enochian.keyboard.finish','ivory');localStorage.setItem('enochian.grid16.finish','obsidian')")
        p.locator('[data-set-finish="obsidian"]').click()
        self.assertEqual(p.evaluate("localStorage.getItem('enochian.apple-devices.finish')"),'obsidian')
        p.reload()
        self.assertEqual(p.locator('#device-gallery').get_attribute('data-finish'),'obsidian')
        self.assertEqual(p.locator('[data-set-finish="obsidian"]').get_attribute('aria-pressed'),'true')
        self.assertEqual(p.evaluate("localStorage.getItem('enochian.keyboard.finish')"),'ivory')
        self.assertEqual(p.evaluate("localStorage.getItem('enochian.grid16.finish')"),'obsidian')
        p.evaluate("localStorage.setItem('enochian.apple-devices.finish','invalid')");p.reload()
        self.assertEqual(p.locator('#device-gallery').get_attribute('data-finish'),'ivory')
        self.assertEqual(p.evaluate("localStorage.getItem('enochian.apple-devices.finish')"),'invalid')
        self.assertEqual(self.errors,[])

    def test_blocked_storage_keeps_keyboard_finish_selection_available(self):
        self.page.add_init_script("Storage.prototype.getItem=Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError')}")
        self.load();p=self.page
        self.assertEqual(p.locator('#device-gallery').get_attribute('data-finish'),'ivory')
        for finish in ['obsidian','ivory']:
            p.locator(f'[data-set-finish="{finish}"]').focus();p.keyboard.press('Space')
            self.assertEqual(p.locator('#device-gallery').get_attribute('data-finish'),finish)
        self.assertEqual(self.errors,[])

    def test_inserted_dom_content_keeps_identity_and_events_across_finishes(self):
        self.load();p=self.page
        p.evaluate('''() => {
          window.inserted=[];window.taps=0;
          document.querySelectorAll('[data-screen]').forEach(slot=>{
            const b=document.createElement('button');b.type='button';b.textContent='Test insertion';
            b.addEventListener('click',()=>window.taps++);slot.append(b);inserted.push(b);
          });
        }''')
        for finish in ['obsidian','ivory']:
            p.locator(f'[data-set-finish="{finish}"]').click()
            self.assertTrue(p.evaluate("[...document.querySelectorAll('[data-screen]')].every((slot,i)=>slot.firstChild===inserted[i])"))
            p.locator('[data-screen="display"] button').click()
        self.assertEqual(p.evaluate('taps'),2)
        self.assertEqual(self.errors,[])

    def test_every_frame_stays_contained_at_responsive_widths(self):
        self.load();p=self.page
        for width in [1440,1024,801,800,768,390,280]:
            p.set_viewport_size({'width':width,'height':1000})
            for finish in ['ivory','obsidian']:
                p.locator(f'[data-set-finish="{finish}"]').click()
                metrics=p.evaluate('''() => {
                  const clipped=[];
                  for(const el of document.querySelectorAll('.device,.stand,.laptop-base,.chin,.screen-slot')){
                    const r=el.getBoundingClientRect(),s=el.closest('.scene').getBoundingClientRect();
                    if(r.width<1||r.height<1||r.left<s.left-.5||r.right>s.right+.5||r.top<s.top-.5||r.bottom>s.bottom+.5)clipped.push(el.dataset.device||el.className);
                  }
                  return {overflow:document.documentElement.scrollWidth-innerWidth,clipped};
                }''')
                self.assertEqual(metrics,{'overflow':0,'clipped':[]},{'width':width,'finish':finish,'metrics':metrics})
        self.assertEqual(self.errors,[])

    def test_atlas_links_to_the_complete_device_study(self):
        self.page.goto((ROOT/'index.html').as_uri(),wait_until='domcontentloaded',timeout=10000);p=self.page
        link=p.locator('a[href="apple-devices/index.html"]')
        self.assertEqual(link.count(),1)
        link.click()
        self.assertEqual(p.url,STUDY.as_uri())
        self.assertEqual(p.locator('[data-screen]').count(),5)
        self.assertEqual(p.locator('[data-device]').count(),9)
        self.assertEqual(self.errors,[])

    def test_display_bezel_covers_the_stand_at_its_upper_joint(self):
        self.load();p=self.page
        self.assertTrue(p.locator('.monitor .stand').evaluate('''stand=>{
          const r=stand.getBoundingClientRect();
          return !!document.elementFromPoint(r.x+r.width/2,r.y-3)?.closest('.monitor-panel');
        }'''))

    def test_inserted_tall_and_wide_images_fit_without_growing_screen_apertures(self):
        self.load();p=self.page
        for name in ['display','imac','macbook','ipad','iphone']:
            slot=p.locator(f'[data-screen="{name}"]');before=slot.bounding_box()
            for width,height in [(100,1600),(1600,100)]:
                slot.evaluate('''(el,size)=>{
                  const img=document.createElement('img');img.alt='Labelled synthetic aspect-ratio test fixture';
                  img.src='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size[0]}" height="${size[1]}"><rect width="100%" height="100%" fill="white"/></svg>`);
                  el.replaceChildren(img);
                }''',[width,height])
                p.wait_for_function("[...document.querySelectorAll('[data-screen] img')].every(img=>img.complete&&img.naturalWidth>0)")
                after=slot.bounding_box();image=slot.locator('img').bounding_box()
                for axis in ['width','height']:
                    self.assertAlmostEqual(after[axis],before[axis],delta=.3,msg=f'{name}: {width}x{height} image grew the {axis}')
                    self.assertAlmostEqual(image[axis],after[axis]-(2 if name=='imac' else 0),delta=.3,msg=f'{name}: image does not fill {axis}')
                slot.evaluate('el=>el.replaceChildren()')
        self.assertEqual(self.errors,[]);self.assertEqual(self.requests,[])

if __name__=='__main__':unittest.main()
