"""Fault-injected lifecycle checks using native Chromium Web Audio underneath."""
from pathlib import Path
import unittest
from playwright.sync_api import sync_playwright

PAGE = Path(__file__).resolve().parents[1]/'speakers'/'index.html'

class SpeakerSafetyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw=sync_playwright().start()
        cls.browser=cls.pw.chromium.launch()
    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def test_blur_invalidates_pending_native_audio_resume(self):
        context=self.browser.new_context()
        self.addCleanup(context.close)
        context.add_init_script('''(() => {
            const Original=window.AudioContext;
            window.__resumeResolvers=[];
            class DelayedContext extends Original {
                async resume() {
                    await super.resume();
                    await new Promise(resolve=>window.__resumeResolvers.push(resolve));
                }
            }
            window.AudioContext=DelayedContext;
        })()''')
        page=context.new_page()
        page.goto(PAGE.as_uri())
        page.locator('#compact-play').click()
        page.wait_for_function('__resumeResolvers.length===1')
        self.assertTrue(page.evaluate('speakerLab.units.compact.wanted'))
        page.evaluate("window.dispatchEvent(new Event('blur'));__resumeResolvers.shift()()")
        page.wait_for_timeout(100)
        state=page.evaluate('''() => {const u=speakerLab.units.compact;return {
            wanted:u.wanted,playing:u.playing,graph:!!u.graph,
            pressed:document.querySelector('#compact-play').getAttribute('aria-pressed')
        }}''')
        self.assertEqual(state,{'wanted':False,'playing':False,'graph':False,'pressed':'false'},'Late resume must not resurrect sound after blur')

if __name__=='__main__':
    unittest.main()
