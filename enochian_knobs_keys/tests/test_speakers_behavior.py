"""Real-browser vertical behavior checks; no substituted audio nodes."""
from pathlib import Path
import unittest
from playwright.sync_api import sync_playwright

PAGE = Path(__file__).resolve().parents[1] / 'speakers' / 'index.html'

class SpeakerBehaviorTests(unittest.TestCase):
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
        self.page.on('pageerror', lambda e:self.errors.append(str(e)))
        self.page.goto(PAGE.as_uri())
    def tearDown(self):
        self.assertEqual(self.errors, [])
        self.context.close()
    def test_finish_is_isolated_validated_persistent(self):
        self.page.locator('[data-speaker-finish="obsidian"]').click()
        self.assertEqual(self.page.locator('#twin-unit').get_attribute('data-finish'), 'obsidian')
        self.assertEqual(self.page.locator('[data-speaker-finish="obsidian"]').get_attribute('aria-pressed'), 'true')
        self.assertIsNone(self.page.locator('#compact-unit').get_attribute('data-finish'))
        self.page.reload()
        self.assertEqual(self.page.locator('#twin-unit').get_attribute('data-finish'), 'obsidian')
        self.page.evaluate("localStorage.setItem('enochian.speakers.twin.finish','invalid')")
        self.page.reload()
        self.assertEqual(self.page.locator('#twin-unit').get_attribute('data-finish'), 'ivory')

    def test_audio_is_opt_in_independent_native_play_stop(self):
        self.assertEqual(self.page.evaluate('typeof window.speakerLab'), 'object', 'Native audio engine is missing')
        self.assertTrue(self.page.evaluate('Object.values(speakerLab.units).every(u=>u.ctx===null)'))
        for name in ['compact', 'twin']:
            self.page.locator('#'+name+'-play').click()
            self.page.wait_for_function('(name)=>speakerLab.units[name].playing', arg=name)
            self.assertTrue(self.page.evaluate('(name)=>{const u=speakerLab.units[name];return u.graph.source instanceof AudioBufferSourceNode && u.graph.gain instanceof GainNode && u.graph.analyser instanceof AnalyserNode}', name))
        self.assertTrue(self.page.evaluate('speakerLab.units.compact.ctx!==speakerLab.units.twin.ctx'))
        self.page.wait_for_timeout(160)
        self.assertGreater(self.page.evaluate('()=>{const a=speakerLab.units.twin.graph.analyser,d=new Float32Array(a.fftSize);a.getFloatTimeDomainData(d);return Math.max(...d.map(Math.abs))}'), .0001)
        self.page.locator('#compact-play').click()
        self.assertTrue(self.page.evaluate('!speakerLab.units.compact.playing && speakerLab.units.compact.graph===null && speakerLab.units.twin.playing'))
        self.page.locator('[data-speaker-finish="obsidian"]').click()
        self.assertTrue(self.page.evaluate('speakerLab.units.twin.playing'))
        self.page.locator('#twin-play').click()
        self.assertTrue(self.page.evaluate('!speakerLab.units.twin.playing && speakerLab.units.twin.graph===null'))
        self.assertEqual(self.page.locator('#twin-play').get_attribute('aria-pressed'),'false')

    def test_gain_keyboard_pointer_cancel_reset_changes_native_gain(self):
        self.page.evaluate("window.parameters=[];addEventListener('speaker:parameter',e=>parameters.push(e.detail))")
        for name in ['compact','twin']:
            knob=self.page.locator('#'+name+'-volume')
            knob.focus()
            knob.press('End')
            self.assertEqual(knob.get_attribute('aria-valuenow'),'100')
            knob.press('Home');knob.press('PageUp');knob.press('ArrowUp')
            self.assertEqual(knob.get_attribute('aria-valuenow'),'11')
            self.page.locator('#'+name+'-play').click()
            self.page.wait_for_function('(name)=>speakerLab.units[name].playing',arg=name)
            self.assertAlmostEqual(self.page.evaluate('(name)=>speakerLab.units[name].graph.gain.gain.value',name),.0132,places=5)
            knob.press('End')
            self.assertAlmostEqual(self.page.evaluate('(name)=>speakerLab.units[name].graph.gain.gain.value',name),.12,places=5)
            knob.dblclick()
            self.assertEqual(knob.get_attribute('aria-valuenow'),'35')
            box=knob.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
            self.page.mouse.move(x,y);self.page.mouse.down();self.page.mouse.move(x,y-48,steps=5);self.page.mouse.up()
            self.assertEqual(knob.get_attribute('aria-valuenow'),'65')
            knob.dispatch_event('pointerdown',{'pointerId':99,'button':0,'clientY':100})
            knob.dispatch_event('pointercancel',{'pointerId':99})
            knob.dispatch_event('pointermove',{'pointerId':99,'clientY':0})
            self.assertEqual(knob.get_attribute('aria-valuenow'),'65')
            self.page.locator('#'+name+'-play').click()
        self.assertTrue(self.page.evaluate('parameters.some(p=>p.unit===\"compact\"&&p.parameter===\"volume\"&&p.value===65)'))

    def test_source_cycles_real_distinct_buffers_and_loop_ends(self):
        self.page.locator('#twin-input').click()
        self.assertEqual(self.page.locator('#twin-source').inner_text(),'Pulse')
        self.page.locator('#twin-play').click()
        self.page.wait_for_function('speakerLab.units.twin.playing')
        self.assertTrue(self.page.evaluate('speakerLab.units.twin.graph.source.loop'))
        pulse=self.page.evaluate('Array.from(speakerLab.units.twin.graph.source.buffer.getChannelData(0).slice(1000,1100))')
        self.page.locator('#twin-input').click()
        self.page.wait_for_function('speakerLab.units.twin.playing && speakerLab.units.twin.sourceIndex===2')
        self.assertEqual(self.page.locator('#twin-source').inner_text(),'Noise')
        noise=self.page.evaluate('Array.from(speakerLab.units.twin.graph.source.buffer.getChannelData(0).slice(1000,1100))')
        self.assertNotEqual(pulse,noise)
        self.page.locator('#twin-input').click()
        self.page.wait_for_function('speakerLab.units.twin.playing && speakerLab.units.twin.sourceIndex===0')
        chord=self.page.evaluate('Array.from(speakerLab.units.twin.graph.source.buffer.getChannelData(0).slice(1000,1100))')
        self.assertNotEqual(chord,pulse)
        self.assertNotEqual(chord,noise)
        self.page.locator('#twin-loop').click()
        self.assertEqual(self.page.locator('#twin-loop').get_attribute('aria-pressed'),'false')
        self.assertFalse(self.page.evaluate('speakerLab.units.twin.graph.source.loop'))
        self.page.wait_for_function('!speakerLab.units.twin.playing',timeout=6000)
        self.assertTrue(self.page.evaluate('speakerLab.units.twin.graph===null'))
        self.assertEqual(self.page.locator('#twin-play').get_attribute('aria-pressed'),'false')
        self.assertIn('Ended',self.page.locator('#twin-status').inner_text())

    def test_lifecycle_stops_graphs_invalidates_pending_resume_and_sleeps(self):
        for name in ['compact','twin']:
            self.page.locator('#'+name+'-play').click()
        self.page.wait_for_function('Object.values(speakerLab.units).every(u=>u.playing)')
        self.page.evaluate("dispatchEvent(new Event('blur'))")
        self.assertTrue(self.page.evaluate('Object.values(speakerLab.units).every(u=>!u.playing&&!u.wanted&&u.graph===null)'))
        self.page.evaluate("dispatchEvent(new Event('focus'))")
        self.page.wait_for_timeout(150)
        self.assertTrue(self.page.evaluate('Object.values(speakerLab.units).every(u=>!u.playing)'))
        self.page.evaluate('''()=>{const resume=AudioContext.prototype.resume;AudioContext.prototype.resume=function(){return resume.call(this).then(()=>new Promise(resolve=>setTimeout(resolve,140)))}}''')
        self.page.locator('#compact-play').click()
        self.page.evaluate("dispatchEvent(new Event('blur'))")
        self.page.wait_for_timeout(200)
        self.assertTrue(self.page.evaluate('!speakerLab.units.compact.playing && speakerLab.units.compact.graph===null'))
        self.page.locator('#twin-play').click()
        self.page.wait_for_function('speakerLab.units.twin.playing')
        self.page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))")
        self.assertTrue(self.page.evaluate('!speakerLab.units.twin.playing && speakerLab.units.twin.graph===null'))
        self.page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))")
        self.assertTrue(self.page.evaluate('!speakerLab.units.twin.playing'))
        self.page.emulate_media(reduced_motion='reduce')
        self.page.locator('#compact-volume').press('End')
        self.assertTrue(self.page.evaluate('speakerLab.springs.every(s=>s.raf===0)'))
        self.page.evaluate("document.body.style.height='3000px';scrollTo(0,2200)")
        self.page.wait_for_timeout(80)
        self.assertTrue(self.page.evaluate('Object.values(speakerLab.units).every(u=>!u.inView)'))
        self.page.evaluate("dispatchEvent(new Event('pagehide'))")
        self.assertTrue(self.page.evaluate('Object.values(speakerLab.units).every(u=>u.graph===null)'))

    def test_blur_drains_native_analyser_before_context_close(self):
        self.page.locator('#compact-play').click()
        self.page.wait_for_function('speakerLab.units.compact.playing')
        self.page.wait_for_timeout(120)
        self.page.evaluate('window.retiredAnalyser=speakerLab.units.compact.graph.analyser')
        self.page.evaluate("dispatchEvent(new Event('blur'))")
        self.page.wait_for_timeout(180)
        rms=self.page.evaluate('()=>{const a=new Float32Array(retiredAnalyser.fftSize);retiredAnalyser.getFloatTimeDomainData(a);return Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length)}')
        self.assertLess(rms,.000001)

if __name__ == '__main__':
    unittest.main()
