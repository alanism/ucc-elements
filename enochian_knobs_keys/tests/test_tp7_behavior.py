import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]

class RecorderBehaviorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p = sync_playwright().start()
        cls.browser = cls.p.chromium.launch()
    @classmethod
    def tearDownClass(cls):
        cls.browser.close(); cls.p.stop()
    def setUp(self):
        self.page = self.browser.new_page(viewport={'width': 1280, 'height': 1000})
        self.errors = []
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        self.page.goto((ROOT / 'tp-7' / 'index.html').as_uri())
    def tearDown(self):
        self.assertEqual(self.errors, [])
        self.page.close()
    def test_native_play_pause_retains_elapsed_offset(self):
        self.assertTrue(self.page.evaluate("!!window.recorderLab"), 'native recorder engine missing')
        self.assertTrue(self.page.evaluate('recorderLab.ctx === null'))
        self.page.locator('#recorder-play').click()
        self.page.wait_for_function("recorderLab.state === 'playing'")
        self.page.wait_for_timeout(220)
        self.assertTrue(self.page.evaluate('recorderLab.graph.source instanceof AudioBufferSourceNode'))
        self.assertGreater(self.page.evaluate('recorderLab.graph.buffer.duration'), 7.9)
        self.page.locator('#recorder-play').click()
        self.assertEqual(self.page.evaluate('recorderLab.state'), 'paused')
        offset = self.page.evaluate('recorderLab.offset')
        self.assertGreater(offset, .15)
        self.page.wait_for_timeout(100)
        self.assertEqual(self.page.evaluate('recorderLab.offset'), offset)
        self.page.locator('#recorder-play').click()
        self.page.wait_for_function("recorderLab.state === 'playing'")
        self.assertGreaterEqual(self.page.evaluate('recorderLab.graph.offset'), offset)
        self.page.locator('#recorder-stop').click()
        self.assertEqual(self.page.evaluate('[recorderLab.state,recorderLab.offset,recorderLab.graph]'), ['stopped', 0, None])

    def test_jog_keyboard_pointer_cancel_and_rocker_seek(self):
        wheel = self.page.locator('#jog-wheel')
        wheel.focus(); wheel.press('PageUp')
        self.assertEqual(wheel.get_attribute('aria-valuenow'), '1.00')
        wheel.press('End')
        self.assertEqual(wheel.get_attribute('aria-valuenow'), '8.00')
        wheel.press('Home'); wheel.press('ArrowRight')
        self.assertEqual(wheel.get_attribute('aria-valuenow'), '0.10')
        self.page.locator('#skip-forward').click()
        self.assertEqual(wheel.get_attribute('aria-valuenow'), '1.10')
        self.page.locator('#skip-back').click()
        self.assertEqual(wheel.get_attribute('aria-valuenow'), '0.10')
        wheel.dispatch_event('pointerdown', {'pointerId': 8, 'button': 0, 'clientX': 100})
        wheel.dispatch_event('pointermove', {'pointerId': 9, 'clientX': 180})
        self.assertEqual(wheel.get_attribute('aria-valuenow'), '0.10')
        wheel.dispatch_event('pointermove', {'pointerId': 8, 'clientX': 160})
        self.assertGreater(float(wheel.get_attribute('aria-valuenow')), .1)
        wheel.dispatch_event('pointercancel', {'pointerId': 8})
        offset = wheel.get_attribute('aria-valuenow')
        wheel.dispatch_event('pointermove', {'pointerId': 8, 'clientX': 250})
        self.assertEqual(wheel.get_attribute('aria-valuenow'), offset)

    def test_record_captures_native_stream_and_decodes_nonzero_samples(self):
        self.page.locator('#recorder-record').click()
        self.assertTrue(self.page.evaluate("['record-starting','recording'].includes(recorderLab.state)"), 'record button must capture')
        self.page.wait_for_function("recorderLab.state === 'recording'")
        self.assertTrue(self.page.evaluate('recorderLab.capture.recorder instanceof MediaRecorder'))
        self.assertTrue(self.page.evaluate('recorderLab.capture.dest instanceof MediaStreamAudioDestinationNode'))
        self.page.wait_for_timeout(550)
        self.page.locator('#recorder-stop').click()
        self.page.wait_for_function('recorderLab.recordedBlob && recorderLab.buffer && recorderLab.state === "stopped"')
        self.assertGreater(self.page.evaluate('recorderLab.recordedBlob.size'), 500)
        self.assertTrue(self.page.evaluate('recorderLab.buffer instanceof AudioBuffer'))
        self.assertGreater(self.page.evaluate('recorderLab.buffer.duration'), .2)
        self.assertGreater(self.page.evaluate('Math.sqrt(recorderLab.buffer.getChannelData(0).reduce((s,x)=>s+x*x,0)/recorderLab.buffer.length)'), .01)
        self.assertIsNone(self.page.evaluate('recorderLab.capture'))
        self.page.locator('#recorder-play').click()
        self.page.wait_for_function('recorderLab.graph && recorderLab.graph.buffer === recorderLab.buffer')

    def test_volume_updates_native_gain_and_resets(self):
        dial=self.page.locator('#recorder-volume')
        dial.focus();dial.press('PageUp')
        self.assertEqual(dial.get_attribute('aria-valuenow'),'45')
        self.page.locator('#recorder-play').click()
        self.page.wait_for_function("recorderLab.state==='playing'")
        dial.press('End')
        self.assertAlmostEqual(self.page.evaluate('recorderLab.graph.gain.gain.value'),.15,places=5)
        self.page.locator('#volume-down').click()
        self.assertEqual(dial.get_attribute('aria-valuenow'),'95')
        dial.dblclick()
        self.assertEqual(dial.get_attribute('aria-valuenow'),'35')
        dial.dispatch_event('pointerdown',{'pointerId':3,'button':0,'clientY':160})
        dial.dispatch_event('pointermove',{'pointerId':3,'clientY':80})
        self.assertEqual(dial.get_attribute('aria-valuenow'),'85')
        dial.dispatch_event('pointercancel',{'pointerId':3})
        dial.dispatch_event('pointermove',{'pointerId':3,'clientY':0})
        self.assertEqual(dial.get_attribute('aria-valuenow'),'85')

    def test_finish_is_persisted_and_invalid_storage_is_rejected(self):
        self.page.locator('#finish-obsidian').click()
        self.assertEqual(self.page.locator('#recorder').get_attribute('data-finish'),'obsidian')
        self.page.reload()
        self.assertEqual(self.page.locator('#recorder').get_attribute('data-finish'),'obsidian')
        self.page.evaluate("localStorage.setItem('enochian.tp7.finish.v1','invalid')")
        self.page.reload()
        self.assertEqual(self.page.locator('#recorder').get_attribute('data-finish'),'silver')
        self.assertEqual(self.page.locator('#finish-silver').get_attribute('aria-pressed'),'true')

    def test_blur_closes_native_graph_and_cancels_recording(self):
        self.page.locator('#recorder-play').click()
        self.page.wait_for_function("recorderLab.state==='playing'")
        self.page.evaluate("window.retiredContext=recorderLab.ctx;window.dispatchEvent(new Event('blur'))")
        self.assertIsNone(self.page.evaluate('recorderLab.graph'))
        self.page.wait_for_function("retiredContext.state==='closed'")
        self.page.locator('#recorder-record').click()
        self.page.wait_for_function("recorderLab.state==='recording'")
        self.page.evaluate("window.retiredContext=recorderLab.ctx;window.dispatchEvent(new Event('blur'))")
        self.page.wait_for_function("retiredContext.state==='closed'")
        self.assertEqual(self.page.evaluate('[recorderLab.capture,recorderLab.graph,recorderLab.ctx,recorderLab.state]'),[None,None,None,'stopped'])
        self.page.wait_for_timeout(100)
        self.assertEqual(self.page.evaluate('recorderLab.state'),'stopped')

    def test_bookmark_stores_position_and_updates_oled_counter(self):
        self.page.locator('#jog-wheel').focus()
        self.page.locator('#jog-wheel').press('PageUp')
        self.page.locator('#recorder-mark').click()
        self.assertEqual(self.page.evaluate('recorderLab.marks'),[1])
        self.assertEqual(self.page.locator('#screen-marks').inner_text(),'01')

if __name__ == '__main__': unittest.main()
