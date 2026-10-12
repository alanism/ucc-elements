"""Native audio checks; Web MIDI assertions use an explicitly labelled boundary double."""
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
from transport_native import NATIVE_AUDIT
from controller_midi import MIDI_BOUNDARY

ROOT = Path(__file__).resolve().parents[1]

class ControllerSafetyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p = sync_playwright().start()
        cls.browser = cls.p.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.p.stop()

    def page(self, folder, script=''):
        p = self.browser.new_page(viewport={'width':1440,'height':1100}, reduced_motion='reduce')
        self.addCleanup(p.close)
        p.set_default_timeout(3000)
        p.add_init_script(NATIVE_AUDIT)
        p.add_init_script(MIDI_BOUNDARY)
        if script:
            p.add_init_script(script)
        p.goto((ROOT / folder / 'index.html').as_uri())
        return p

    def test_midi_boundary_is_opt_in_and_never_auto_selects_output(self):
        for folder in ['keyboard','midi-pad']:
            with self.subTest(folder=folder):
                p = self.page(folder)
                self.assertEqual(p.evaluate('__midiAudit.requests.length'), 0)
                self.assertEqual(p.evaluate('__audioAudit.contexts.length'), 0)
                p.locator('details').evaluate_all('(els) => els.forEach(el => el.open = true)')
                p.locator('#midi-connect').click()
                p.wait_for_function('__midiAudit.requests.length === 1')
                self.assertEqual(p.evaluate('__midiAudit.requests[0]'), {'sysex':False})
                p.wait_for_function("document.querySelector('#midi-output').options.length >= 3")
                self.assertIn(p.locator('#midi-output').input_value(), ['', 'none'])
                self.assertEqual(p.evaluate('__midiAudit.messages'), [])

    def test_blur_closes_native_audio_and_invalidates_pending_resume(self):
        for folder in ['keyboard','midi-pad']:
            with self.subTest(folder=folder):
                p = self.page(folder)
                p.evaluate('__audioAudit.holdResume = true')
                p.locator('#sound-toggle').click()
                p.wait_for_function('__audioAudit.resolvers.length > 0')
                p.evaluate("window.dispatchEvent(new Event('blur')); __audioAudit.release()")
                p.wait_for_timeout(150)
                snapshot = p.evaluate('__audioAudit.snapshot()')
                self.assertEqual(snapshot['active'], 0, snapshot)
                self.assertNotIn('running', snapshot['contexts'], snapshot)
                self.assertEqual(p.locator('#sound-toggle').get_attribute('aria-pressed'), 'false')
                control = '[data-key="0"]' if folder=='keyboard' else '[data-pad="0"]'
                p.locator(control).focus()
                p.keyboard.down('Space')
                p.wait_for_timeout(100)
                self.assertEqual(p.evaluate('__audioAudit.snapshot().active'), 0)
                p.keyboard.up('Space')

    def test_enabling_keyboard_preview_does_not_retrigger_held_midi_note(self):
        p = self.page('keyboard')
        p.locator('details').evaluate_all('(els) => els.forEach(el => el.open = true)')
        p.locator('#midi-connect').click()
        p.locator('#midi-output').select_option('a')
        p.locator('[data-key="0"]').focus()
        p.keyboard.down('a')
        p.locator('#sound-toggle').click()
        p.wait_for_timeout(100)
        p.keyboard.up('a')
        messages = p.evaluate('__midiAudit.messages.map(m => m.bytes)')
        self.assertEqual(sum(m[0]==144 and m[1]==60 for m in messages), 1, messages)
        self.assertEqual(sum(m[0]==128 and m[1]==60 for m in messages), 1, messages)

    def test_keyboard_preset_applies_to_new_native_voices(self):
        for pad, cutoff in [(9,1000),(10,6000),(11,3400)]:
            with self.subTest(pad=pad):
                p = self.page('keyboard')
                p.locator(f'[data-pad="{pad}"]').click()
                p.locator('#sound-toggle').click()
                p.locator('[data-key="0"]').focus()
                p.keyboard.down('a')
                self.assertAlmostEqual(p.evaluate('__audioAudit.filters.at(-1).node.frequency.value'), cutoff, delta=1)
                p.keyboard.up('a')

    def test_pad_note_repeat_works_with_midi_without_local_audio(self):
        for mode, midi in [('trigger',36),('piano',60)]:
            with self.subTest(mode=mode):
                p = self.page('midi-pad')
                p.locator('details').evaluate_all('(els) => els.forEach(el => el.open = true)')
                p.locator('#midi-connect').click()
                p.locator('#midi-output').select_option('a')
                p.locator(f'[data-mode="{mode}"]').click()
                p.locator('#note-repeat').click()
                p.locator('[data-pad="0"]').focus()
                p.keyboard.down('Space')
                p.wait_for_timeout(420)
                messages = p.evaluate('__midiAudit.messages.map(m => m.bytes)')
                self.assertGreaterEqual(sum(m[0]==144 and m[1]==midi for m in messages), 3, messages)
                p.keyboard.up('Space')
                count = p.evaluate('__midiAudit.messages.length')
                p.wait_for_timeout(200)
                self.assertEqual(p.evaluate('__midiAudit.messages.length'), count)
                self.assertEqual(p.evaluate('__audioAudit.contexts.length'), 0)

    def test_pad_route_changes_and_panic_center_original_pitch_bend(self):
        for action in ['channel','port','panic']:
            with self.subTest(action=action):
                p = self.page('midi-pad')
                p.locator('details').evaluate_all('(els) => els.forEach(el => el.open = true)')
                p.locator('#midi-connect').click()
                p.locator('#midi-output').select_option('a')
                p.locator('#strip-mode').click()
                p.locator('[data-strip]').press('End')
                p.evaluate('__midiAudit.messages = []')
                if action=='channel':
                    p.locator('#midi-channel').select_option('16')
                elif action=='port':
                    p.locator('#midi-output').select_option('b')
                else:
                    p.locator('#panic').click()
                messages = p.evaluate('__midiAudit.messages')
                self.assertTrue(any(m['port']=='a' and m['bytes']==[224,0,64] for m in messages), messages)
                self.assertEqual(p.evaluate('padLab.state.pitch'), 0)

    def test_pending_keyboard_enable_preserves_other_held_owner(self):
        p = self.page('keyboard')
        p.evaluate('__audioAudit.holdResume = true')
        p.locator('#sound-toggle').click()
        p.wait_for_function('__audioAudit.resolvers.length > 0')
        p.locator('[data-key="0"]').focus()
        p.keyboard.down('a')
        p.keyboard.down('s')
        p.keyboard.up('a')
        p.evaluate('__audioAudit.release()')
        p.wait_for_timeout(100)
        self.assertEqual(p.locator('#sound-toggle').get_attribute('aria-pressed'), 'true')
        self.assertEqual(p.evaluate('__audioAudit.snapshot().active'), 2)
        p.keyboard.up('s')
        p.wait_for_timeout(180)
        self.assertEqual(p.evaluate('__audioAudit.snapshot().active'), 0)

if __name__ == '__main__':
    unittest.main()
