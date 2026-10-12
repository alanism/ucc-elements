import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
from tests.transport_native import NATIVE_AUDIT
ROOT=Path(__file__).resolve().parents[1]
class KeyboardBehavior(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch()
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.p.stop()
    def setUp(self):
        self.page=self.browser.new_page(viewport={'width':1440,'height':1000})
        self.addCleanup(self.page.close)
        self.page.add_init_script(NATIVE_AUDIT)
        self.page.goto((ROOT/'keyboard/index.html').as_uri())
        self.page.evaluate("window.notes=[];document.addEventListener('canticle:note',e=>notes.push(e.detail))")
    def test_midi_selection_channel_switch_drains_original_output(self):
        from tests.controller_midi import MIDI_BOUNDARY
        p=self.page;p.add_init_script(MIDI_BOUNDARY);p.reload()
        p.locator('#guide').evaluate('(el)=>el.open=true')
        p.locator('#midi-connect').click()
        self.assertEqual(p.evaluate('__midiAudit.requests'),[{'sysex':False}])
        self.assertEqual(p.locator('#midi-output').input_value(),'')
        p.locator('#midi-output').select_option('a');p.locator('[data-key="0"]').focus();p.keyboard.down('a')
        self.assertIn([144,60,100],p.evaluate('__midiAudit.messages.map(m=>m.bytes)'))
        p.locator('#midi-channel').fill('2');p.locator('#midi-channel').dispatch_event('change')
        self.assertIn([128,60,0],p.evaluate('__midiAudit.messages.map(m=>m.bytes)'))
        p.keyboard.up('a');p.locator('[data-key="2"]').focus();p.keyboard.down('s')
        self.assertIn([145,62,100],p.evaluate('__midiAudit.messages.map(m=>m.bytes)'))
        p.evaluate('__midiAudit.disconnect("a")')
        self.assertEqual(p.locator('#midi-output').input_value(),'')
        p.keyboard.up('s')

    def test_arpeggio_uses_chord_bank_and_native_pitch_controls(self):
        p=self.page;p.locator('#sound-toggle').click()
        p.locator('#encoder-transpose').focus();p.keyboard.press('ArrowUp')
        self.assertEqual(p.locator('#encoder-transpose').get_attribute('aria-valuenow'),'1')
        p.locator('#arp-toggle').click()
        p.locator('[data-pad="0"]').dispatch_event('pointerdown',{'pointerId':11,'button':0})
        p.wait_for_timeout(700)
        self.assertGreaterEqual(p.evaluate('keyboardLab.sequence.length'),2)
        self.assertTrue(p.evaluate('keyboardLab.sequence.every(n=>[61,65,68].includes(n))'))
        p.locator('#pitch-strip').focus();p.keyboard.press('ArrowUp')
        self.assertGreater(p.evaluate('keyboardLab.state.bend'),0)
        p.keyboard.press('Home')
        self.assertEqual(p.evaluate('keyboardLab.state.bend'),0)
        p.locator('[data-pad="0"]').dispatch_event('pointercancel',{'pointerId':11})
        p.locator('[data-pad="15"]').click();p.wait_for_timeout(180)
        self.assertEqual(p.evaluate('__audioAudit.snapshot().active'),0)

    def test_native_polyphony_has_owner_aware_release(self):
        p=self.page
        self.assertEqual(p.evaluate('__audioAudit.contexts.length'),0)
        p.locator('#sound-toggle').click()
        p.keyboard.press('a')
        p.keyboard.down('a');p.keyboard.down('s')
        p.wait_for_timeout(100)
        self.assertGreaterEqual(p.evaluate('__audioAudit.snapshot().active'),4)
        p.locator('[data-key="0"]').dispatch_event('pointerdown',{'pointerId':7,'button':0})
        p.keyboard.up('a')
        self.assertTrue(p.locator('[data-key="0"]').get_attribute('aria-pressed')=='true')
        p.locator('[data-key="0"]').dispatch_event('pointercancel',{'pointerId':7})
        p.keyboard.up('s')
        p.locator('#sound-toggle').click();p.wait_for_timeout(150)
        self.assertEqual(p.evaluate('__audioAudit.snapshot().active'),0)
        self.assertEqual(p.evaluate('keyboardLab.held.size'),0)
        self.assertEqual(p.evaluate('notes.filter(n=>n.phase==="on").map(n=>n.midi).sort()'),p.evaluate('notes.filter(n=>n.phase==="off").map(n=>n.midi).sort()'))
