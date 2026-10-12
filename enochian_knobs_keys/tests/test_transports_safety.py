"""Fault-injected asynchronous lifecycles using native Chromium objects."""
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
from transport_native import NATIVE_AUDIT
ROOT=Path(__file__).resolve().parents[1]

class TransportSafetyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch()
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.p.stop()
    def test_blur_invalidates_delayed_native_resume(self):
        for folder,play in [('tp-7','#recorder-play'),('dj-decks','#play-1')]:
            with self.subTest(study=folder):
                page=self.browser.new_page(viewport={'width':1440,'height':1100})
                try:
                    page.add_init_script(NATIVE_AUDIT)
                    page.goto((ROOT/folder/'index.html').as_uri())
                    self.assertEqual(page.evaluate('__audioAudit.contexts.length'),0)
                    page.evaluate('__audioAudit.holdResume=true')
                    page.locator(play).click()
                    page.wait_for_function('__audioAudit.resolvers.length===1',timeout=5000)
                    page.evaluate("window.dispatchEvent(new Event('blur'));__audioAudit.release()")
                    page.wait_for_timeout(180)
                    state=page.evaluate('__audioAudit.snapshot()')
                    self.assertEqual(state['active'],0,state)
                    self.assertTrue(all(s=='closed' for s in state['contexts']),state)
                    page.evaluate("window.dispatchEvent(new Event('focus'))")
                    page.wait_for_timeout(80)
                    self.assertEqual(page.evaluate('__audioAudit.snapshot().active'),0)
                finally:
                    page.close()

    def test_reduced_motion_playback_does_not_run_animation_frames(self):
        for folder,play in [('tp-7','#recorder-play'),('dj-decks','#play-1')]:
            with self.subTest(study=folder):
                page=self.browser.new_page(viewport={'width':1440,'height':1100},reduced_motion='reduce')
                try:
                    page.add_init_script("window.__frames=0;const nativeRAF=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=(fn)=>nativeRAF(t=>{window.__frames++;fn(t)})")
                    page.goto((ROOT/folder/'index.html').as_uri())
                    page.locator(play).click();page.wait_for_timeout(120)
                    wheel='#jog-wheel .platter' if folder=='tp-7' else '#jog-1 .platter'
                    transform=page.locator(wheel).evaluate('(e)=>getComputedStyle(e).transform')
                    before=page.evaluate('__frames');page.wait_for_timeout(180)
                    self.assertEqual(page.evaluate('__frames'),before,'Reduced motion keeps rendering animation frames')
                    self.assertEqual(page.locator(wheel).evaluate('(e)=>getComputedStyle(e).transform'),transform,'Reduced motion still rotates a platter via an interval')
                finally:
                    page.close()

    def test_sync_uses_source_buffer_seconds_for_beat_alignment(self):
        page=self.browser.new_page(viewport={'width':1440,'height':1100})
        try:
            page.add_init_script(NATIVE_AUDIT)
            page.goto((ROOT/'dj-decks'/'index.html').as_uri())
            page.locator('#tempo-2').press('Home')
            for _ in range(3):page.locator('#tempo-2').press('PageUp')
            page.locator('#jog-2').press('Home')
            for _ in range(2):page.locator('#jog-2').press('PageUp')
            for _ in range(4):page.locator('#jog-2').press('ArrowRight')
            page.locator('#jog-1').press('Home');page.locator('#jog-1').press('PageUp')
            for _ in range(3):page.locator('#jog-1').press('ArrowRight')
            page.locator('#sync-1').click()
            phases=page.evaluate('djLab.decks.map(d=>(d.position()*d.base/60)%1)')
            self.assertAlmostEqual(phases[0],phases[1],places=5, msg='Sync applies playbackRate twice when converting buffer seconds')
            page.locator('#play-1').click();page.wait_for_function('djLab.decks[0].playing')
            native=page.evaluate('(()=>{const d=djLab.decks[0],s=__audioAudit.sources.findLast(s=>s.node===d.source);return {phase:(s.offset*d.base/60)%1,bpm:s.node.playbackRate.value*d.base}})()')
            self.assertAlmostEqual(native['phase'],phases[1],places=5)
            self.assertAlmostEqual(native['bpm'],121.6,places=3)
        finally:
            page.close()

    def test_unsupported_web_audio_reports_failure_without_sources(self):
        for folder,play in [('tp-7','#recorder-play'),('dj-decks','#play-1')]:
            with self.subTest(study=folder):
                page=self.browser.new_page(viewport={'width':1440,'height':1100});errors=[]
                try:
                    page.on('pageerror',lambda e:errors.append(str(e)))
                    page.add_init_script('window.AudioContext=undefined;window.webkitAudioContext=undefined')
                    page.goto((ROOT/folder/'index.html').as_uri());page.locator(play).click()
                    page.wait_for_timeout(80)
                    output=page.locator('#status' if folder=='tp-7' else '#status-1').inner_text()
                    self.assertIn('unavailable',output.lower())
                    self.assertEqual(errors,[])
                finally:page.close()
    def test_recorder_handles_blocked_storage_and_unsupported_encoder(self):
        page=self.browser.new_page(viewport={'width':1440,'height':1100});errors=[]
        try:
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError')}});window.MediaRecorder=undefined")
            page.goto((ROOT/'tp-7'/'index.html').as_uri())
            page.locator('#finish-obsidian').click()
            self.assertEqual(page.locator('#recorder').get_attribute('data-finish'),'obsidian')
            page.locator('#recorder-record').click();page.wait_for_timeout(80)
            self.assertIn('not supported',page.locator('#status').inner_text())
            self.assertEqual(page.evaluate('[recorderLab.capture,recorderLab.ctx]'),[None,None])
            page.locator('#recorder-play').click();page.wait_for_function("recorderLab.state==='playing'")
            self.assertEqual(errors,[])
        finally:page.close()

if __name__=='__main__':unittest.main()
