"""Twin-deck finish behavior exercised in real Chromium."""
import unittest
import re
from pathlib import Path
from playwright.sync_api import sync_playwright
from tests.transport_native import NATIVE_AUDIT

ROOT=Path(__file__).resolve().parents[1]

class DJFinishTests(unittest.TestCase):
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
        self.errors=[];self.page.on('pageerror',lambda e:self.errors.append(str(e)))
    def load(self):
        self.page.goto((ROOT/'dj-decks/index.html').as_uri())
    def test_white_obsidian_switch_complete_materials_without_starting_audio(self):
        self.load();p=self.page;root=p.locator('#controller')
        self.assertEqual(root.get_attribute('data-finish'),'ivory')
        colors=[]
        for finish in ['ivory','obsidian','ivory']:
            p.locator(f'[data-set-finish={finish}]').click()
            self.assertEqual(root.get_attribute('data-finish'),finish)
            self.assertEqual(p.locator('[data-set-finish][aria-pressed=true]').count(),1)
            self.assertEqual(p.locator(f'[data-set-finish={finish}]').get_attribute('aria-pressed'),'true')
            colors.append(root.evaluate('el=>getComputedStyle(el).backgroundColor'))
            self.assertEqual(p.evaluate('djLab.ctx'),None)
            self.assertEqual(p.locator('.deck').count(),2)
            self.assertEqual(p.locator('[data-pad]').count(),16)
            self.assertEqual(p.locator('[data-knob]').count(),8)
            self.assertEqual(p.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase()"),'#cc0000')
        self.assertEqual(colors,['rgb(238, 239, 235)','rgb(51, 55, 58)','rgb(238, 239, 235)'])
        self.assertEqual(self.errors,[])

    def test_finish_persists_only_its_own_preference(self):
        self.load();p=self.page
        p.evaluate("localStorage.setItem('enochian.grid16.finish','ivory');localStorage.setItem('enochian.keyboard.finish','ivory')")
        for finish in ['obsidian','ivory']:
            p.locator(f'[data-set-finish={finish}]').click()
            self.assertEqual(p.evaluate("localStorage.getItem('enochian.dj-decks.finish')"),finish)
            p.reload()
            self.assertEqual(p.locator('#controller').get_attribute('data-finish'),finish)
            self.assertEqual(p.locator(f'[data-set-finish={finish}]').get_attribute('aria-pressed'),'true')
        self.assertEqual(p.evaluate("localStorage.getItem('enochian.grid16.finish')"),'ivory')
        self.assertEqual(p.evaluate("localStorage.getItem('enochian.keyboard.finish')"),'ivory')
        self.assertEqual(self.errors,[])

    def test_invalid_storage_falls_back_without_overwriting_it(self):
        p=self.page
        p.add_init_script("localStorage.setItem('enochian.dj-decks.finish','invalid-finish')")
        self.load()
        self.assertEqual(p.locator('#controller').get_attribute('data-finish'),'ivory')
        self.assertEqual(p.evaluate("localStorage.getItem('enochian.dj-decks.finish')"),'invalid-finish')
        self.assertEqual(self.errors,[])

    def test_blocked_storage_keeps_finish_controls_and_audio_idle(self):
        self.page.add_init_script("Storage.prototype.getItem=Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError')}")
        self.load()
        self.page.locator('[data-set-finish=obsidian]').focus()
        self.page.keyboard.press('Enter')
        self.assertEqual(self.page.locator('#controller').get_attribute('data-finish'),'obsidian')
        self.page.locator('[data-set-finish=ivory]').focus()
        self.page.keyboard.press('Space')
        self.assertEqual(self.page.locator('#controller').get_attribute('data-finish'),'ivory')
        self.assertEqual(self.page.evaluate('djLab.ctx'),None)
        self.assertEqual(self.errors,[])

    def test_small_hardware_labels_meet_contrast_in_both_finishes(self):
        def luminance(color):
            if color.startswith('#'):
                channels=[int(color[i:i+2],16)/255 for i in (1,3,5)]
            else:
                channels=[float(n)/255 for n in re.findall(r'[0-9.]+',color)[:3]]
            return sum((v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4)*w for v,w in zip(channels,(.2126,.7152,.0722)))
        self.load()
        for finish in ['ivory','obsidian']:
            self.page.locator(f'[data-set-finish={finish}]').click()
            data=self.page.locator('#controller').evaluate('''root=>({
              backgrounds:['--case','--cap-high','--cap-low','--pad-high','--pad-low','--pressed'].map(k=>getComputedStyle(root).getPropertyValue(k).trim()),
              labels:[...root.querySelectorAll('button,.maker,.number,.search-label,.pad-title,.performance,.tempo-label,label,.routing p')].map(el=>({label:el.textContent.trim(),color:getComputedStyle(el).color}))})''')
            for label in data['labels']:
                fg=luminance(label['color'])
                for color in data['backgrounds']:
                    bg=luminance(color);ratio=(max(fg,bg)+.05)/(min(fg,bg)+.05)
                    self.assertGreaterEqual(ratio,4.5,{'finish':finish,'label':label,'background':color,'ratio':ratio})

    def test_finish_switch_preserves_live_native_sources_and_mixer_settings(self):
        p=self.page;p.add_init_script(NATIVE_AUDIT);self.load()
        p.locator('#play-1').click();p.locator('#play-2').click()
        p.wait_for_function('djLab.decks.every(d=>d.playing)')
        p.locator('#crossfader').focus();p.keyboard.press('ArrowRight')
        p.locator('#knob-1-hi').focus();p.keyboard.press('ArrowUp')
        p.evaluate('window.originalContext=djLab.ctx;window.originalSources=djLab.decks.map(d=>d.source);window.originalFilters=djLab.decks.map(d=>d.filters);window.originalCross=djLab.cross')
        for finish in ['obsidian','ivory']:
            p.locator(f'[data-set-finish={finish}]').click()
            self.assertTrue(p.evaluate('djLab.ctx===originalContext && djLab.ctx.state==="running"'))
            self.assertTrue(p.evaluate('djLab.decks.every((d,i)=>d.playing && d.source===originalSources[i] && d.filters===originalFilters[i])'))
            self.assertEqual(p.evaluate('__audioAudit.snapshot().active'),2)
            self.assertTrue(p.evaluate('djLab.cross===originalCross && djLab.decks[0].filters.hi.gain.value===1'))
        p.evaluate("window.dispatchEvent(new Event('blur'))")
        p.wait_for_function('__audioAudit.snapshot().active===0')
        self.assertEqual(self.errors,[])

if __name__=='__main__':unittest.main()
