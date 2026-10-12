"""Enochian MIDI Keyboard finishes: real Chromium; MIDI is a labelled boundary double."""
import re
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
from tests.transport_native import NATIVE_AUDIT
from tests.controller_midi import MIDI_BOUNDARY

ROOT = Path(__file__).resolve().parents[1]


class KeyboardFinishTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width': 1440, 'height': 1100})
        self.addCleanup(self.context.close)
        self.page = self.context.new_page()
        self.page.set_default_timeout(1500)
        self.errors = []
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))

    def load(self):
        self.page.goto((ROOT / 'keyboard/index.html').as_uri())

    def test_default_white_has_accessible_material_controls(self):
        self.load()
        p = self.page
        self.assertEqual(p.locator('#keyboard-controller').get_attribute('data-finish'), 'ivory')
        group = p.get_by_role('group', name='Enochian MIDI Keyboard finish')
        self.assertEqual(group.locator('button').count(), 2)
        for finish, label, pressed in [('ivory', 'WHITE', 'true'), ('obsidian', 'OBSIDIAN', 'false')]:
            button = group.get_by_role('button', name=label, exact=True)
            self.assertEqual(button.get_attribute('data-set-finish'), finish)
            self.assertEqual(button.get_attribute('type'), 'button')
            self.assertEqual(button.get_attribute('aria-pressed'), pressed)
            box = button.bounding_box()
            self.assertGreaterEqual(box['width'], 44)
            self.assertGreaterEqual(box['height'], 44)
        self.assertEqual(p.locator('#keyboard-controller').evaluate('e=>getComputedStyle(e).backgroundColor'), 'rgb(238, 239, 235)')
        self.assertEqual(p.locator('[data-key]').count(), 25)
        self.assertEqual(p.locator('[data-pad]').count(), 16)
        self.assertEqual(p.locator('[data-encoder]').count(), 8)
        self.assertEqual(p.locator('#sound-toggle').get_attribute('aria-pressed'), 'false')
        self.assertEqual(p.locator('#midi-output').input_value(), '')
        self.assertNotIn('SILVER', p.locator('.serial').inner_text())
        self.assertEqual(self.errors, [])


    def test_finish_switch_matches_grid16_computed_materials(self):
        self.load()
        p = self.page
        tokens = ['--case', '--well', '--cap', '--ink', '--edge', '--rim', '--cap-high', '--cap-low', '--pad-high', '--pad-low', '--pressed', '--highlight', '--tick', '--cast']
        reference = self.context.new_page()
        reference.goto((ROOT / 'midi-pad/index.html').as_uri())
        for finish in ['obsidian', 'ivory']:
            p.locator(f'[data-set-finish={finish}]').focus()
            p.keyboard.press('Enter')
            self.assertEqual(p.locator('#keyboard-controller').get_attribute('data-finish'), finish)
            self.assertEqual(p.locator('[data-set-finish][aria-pressed=true]').count(), 1)
            reference.locator(f'[data-set-finish={finish}]').click()
            read = '(el, keys)=>keys.map(k=>getComputedStyle(el).getPropertyValue(k).trim())'
            self.assertEqual(p.locator('#keyboard-controller').evaluate(read, tokens), reference.locator('#pad-controller').evaluate(read, tokens))
            material = p.locator('#keyboard-controller').evaluate('''el=>({
                case:getComputedStyle(el).backgroundColor,
                cap:getComputedStyle(el.querySelector('.encoder-cap')).backgroundImage,
                pad:getComputedStyle(el.querySelector('.pad')).backgroundImage,
                aux:getComputedStyle(el.querySelector('.aux button')).backgroundImage,
                white:getComputedStyle(el.querySelector('.white')).backgroundImage,
                black:getComputedStyle(el.querySelector('.black .key-cap')).backgroundImage
            })''')
            self.assertEqual(material['case'], 'rgb(51, 55, 58)' if finish == 'obsidian' else 'rgb(238, 239, 235)')
            self.assertIn('rgb(85, 90, 92)' if finish == 'obsidian' else 'rgb(246, 247, 243)', material['cap'])
            self.assertIn('rgb(65, 70, 73)' if finish == 'obsidian' else 'rgb(228, 229, 225)', material['pad'])
            self.assertEqual(material['cap'], material['aux'])
            self.assertIn('rgb(227, 227, 227)', material['white'])
            self.assertIn('rgb(20, 20, 20)', material['black'])
        p.set_viewport_size({'width': 390, 'height': 844})
        self.assertTrue(p.locator('#hardware-scroll').evaluate('e=>e.scrollWidth>e.clientWidth'))
        self.assertEqual(self.errors, [])


    def test_labels_have_contrast_in_idle_and_pressed_states(self):
        def luminance(color):
            if color.startswith('#'):
                values = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
            else:
                values = [float(v) / 255 for v in re.findall(r'[0-9.]+', color)[:3]]
            return sum((v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4) * w for v, w in zip(values, (.2126, .7152, .0722)))
        self.load()
        for finish in ['ivory', 'obsidian']:
            self.page.locator(f'[data-set-finish={finish}]').click()
            for pressed in [False, True]:
                if pressed:
                    self.page.locator('[data-pad="8"]').click()
                    self.page.locator('#scale-toggle').click()
                    self.page.keyboard.down('a')
                    self.page.keyboard.down('w')
                labels = self.page.locator('#keyboard-controller').evaluate('''root=>{
                    const s=getComputedStyle(root), token=k=>s.getPropertyValue(k).trim();
                    return [...root.querySelectorAll('.brand,.strip-label,.encoder-label,.encoder-value,.legend,.pad,.aux button,.octaves button,.key-hint,.oled div')].map(el=>{
                        let backgrounds=[token('--case')];
                        if(el.matches('.pad')) backgrounds=el.getAttribute('aria-pressed')==='true'?[token('--pressed')]:[token('--pad-high'),token('--pad-low')];
                        if(el.matches('.aux button,.octaves button')) backgrounds=el.getAttribute('aria-pressed')==='true'?[token('--pressed')]:[token('--cap-high'),token('--cap-low')];
                        if(el.matches('.key-hint')) backgrounds=el.closest('.black')?['#141414','#333333','#363636']:['#e3e3e3','#cecece','#c0c0c0'];
                        if(el.closest('.oled')) backgrounds=['#0b0e0c'];
                        return {label:el.textContent,color:getComputedStyle(el).color,backgrounds};
                    });
                }''')
                for label in labels:
                    for color in label['backgrounds']:
                        fg, bg = luminance(label['color']), luminance(color)
                        self.assertGreaterEqual((max(fg, bg) + .05) / (min(fg, bg) + .05), 4.5, (finish, pressed, label))
                self.page.keyboard.up('a')
                self.page.keyboard.up('w')
        self.assertEqual(self.errors, [])


    def test_finish_persists_only_its_own_key_without_initialization_writes(self):
        self.page.add_init_script('''window.storageWrites=[];const originalSet=Storage.prototype.setItem;
            Storage.prototype.setItem=function(k,v){storageWrites.push([k,v]);return originalSet.call(this,k,v)};''')
        self.load()
        self.assertEqual(self.page.evaluate('storageWrites'), [])
        other = {'enochian.grid16.finish': 'obsidian', 'enochian.dj-decks.finish': 'ivory', 'enochian.speakers.twin.finish': 'obsidian', 'enochian-canticle-finish': 'legacy'}
        self.page.evaluate('(items)=>{for(const [k,v] of Object.entries(items))localStorage.setItem(k,v);storageWrites=[]}', other)
        for finish in ['obsidian', 'ivory']:
            self.page.locator(f'[data-set-finish={finish}]').click()
            self.assertEqual(self.page.evaluate("localStorage.getItem('enochian.keyboard.finish')"), finish)
            self.assertEqual(self.page.evaluate('storageWrites'), [['enochian.keyboard.finish', finish]])
            self.page.reload()
            self.assertEqual(self.page.locator('#keyboard-controller').get_attribute('data-finish'), finish)
            self.assertEqual(self.page.evaluate('storageWrites'), [])
        self.assertEqual(self.page.evaluate('(keys)=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)]))', list(other)), other)
        self.assertEqual(self.errors, [])


    def test_blocked_storage_keeps_controls_and_instrument_working(self):
        self.page.add_init_script('''Storage.prototype.getItem=function(){throw new DOMException('Blocked','SecurityError')};
            Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError')};''')
        self.load()
        self.assertEqual(self.errors, [])
        self.assertEqual(self.page.locator('#keyboard-controller').get_attribute('data-finish'), 'ivory')
        for finish in ['obsidian', 'ivory']:
            self.page.locator(f'[data-set-finish={finish}]').click()
            self.assertEqual(self.page.locator('#keyboard-controller').get_attribute('data-finish'), finish)
        self.page.keyboard.down('a')
        self.assertEqual(self.page.evaluate('keyboardLab.held.size'), 1)
        self.page.keyboard.up('a')
        self.assertEqual(self.page.evaluate('keyboardLab.ctx'), None)
        self.assertEqual(self.errors, [])


    def test_invalid_saved_values_fall_back_without_rewriting_storage(self):
        self.load()
        for invalid in ['', 'white', 'silver', 'OBSIDIAN', 'unknown-palette']:
            with self.subTest(invalid=invalid):
                self.page.evaluate("v=>localStorage.setItem('enochian.keyboard.finish',v)", invalid)
                self.page.reload()
                self.assertEqual(self.page.locator('#keyboard-controller').get_attribute('data-finish'), 'ivory')
                self.assertEqual(self.page.locator('[data-set-finish=ivory]').get_attribute('aria-pressed'), 'true')
                self.assertEqual(self.page.evaluate("localStorage.getItem('enochian.keyboard.finish')"), invalid)
        self.assertEqual(self.errors, [])

    def test_finish_preserves_held_native_audio_and_midi_boundary_route(self):
        # NATIVE_AUDIT wraps genuine WebAudio; MIDI_BOUNDARY is not physical MIDI.
        self.page.add_init_script(NATIVE_AUDIT)
        self.page.add_init_script(MIDI_BOUNDARY)
        self.load()
        p = self.page
        self.assertEqual(p.evaluate('__audioAudit.contexts.length'), 0)
        self.assertEqual(p.evaluate('__midiAudit.requests'), [])
        p.locator('#guide').evaluate('e=>e.open=true')
        p.locator('#midi-connect').click()
        self.assertEqual(p.locator('#midi-output').input_value(), '')
        p.locator('#midi-output').select_option('a')
        p.locator('#midi-channel').fill('3')
        p.locator('#midi-channel').dispatch_event('change')
        p.locator('#sound-toggle').click()
        p.wait_for_function('keyboardLab.enabled && keyboardLab.ctx.state==="running"')
        p.locator('[data-key="0"]').focus()
        p.keyboard.down('a')
        p.keyboard.down('w')
        p.wait_for_function('__audioAudit.snapshot().rms.some(v=>v>0.001)')
        p.evaluate('''window.originalContext=keyboardLab.ctx;window.originalVoices=[...keyboardLab.voices.values()];
            window.originalGraphs=[...keyboardLab.graphs];window.originalMidi=JSON.stringify(__midiAudit.messages);
            window.originalState=JSON.stringify(keyboardLab.state);window.originalSources=__audioAudit.sources.length;''')
        self.assertEqual(p.evaluate('__audioAudit.snapshot().active'), 4)
        for finish in ['obsidian', 'ivory', 'obsidian']:
            p.locator(f'[data-set-finish={finish}]').click()
            self.assertTrue(p.evaluate('keyboardLab.ctx===originalContext && keyboardLab.ctx.state==="running"'))
            self.assertTrue(p.evaluate('originalVoices.every(v=>keyboardLab.voices.get(v.midi)===v) && originalGraphs.every(g=>keyboardLab.graphs.has(g))'))
            self.assertTrue(p.evaluate('JSON.stringify(__midiAudit.messages)===originalMidi && JSON.stringify(keyboardLab.state)===originalState'))
            self.assertTrue(p.evaluate('__audioAudit.sources.length===originalSources && __audioAudit.sources.every(s=>!s.stopped&&!s.disconnected)'))
            self.assertEqual(p.evaluate('keyboardLab.held.size'), 2)
            self.assertEqual(p.locator('#midi-output').input_value(), 'a')
            self.assertEqual(p.locator('#midi-channel').input_value(), '3')
            self.assertEqual(p.locator('#sound-toggle').get_attribute('aria-pressed'), 'true')
            self.assertEqual(p.locator('[data-key][aria-pressed=true]').count(), 2)
            p.wait_for_function('__audioAudit.snapshot().rms.some(v=>v>0.001)')
        p.keyboard.up('a')
        p.keyboard.up('w')
        self.assertEqual(p.evaluate('keyboardLab.held.size'), 0)
        self.assertEqual(p.evaluate('keyboardLab.voices.size'), 0)
        messages = p.evaluate('__midiAudit.messages')
        for note in [60, 61]:
            self.assertIn({'port': 'a', 'bytes': [146, note, 100], 'timestamp': None}, messages)
            self.assertIn({'port': 'a', 'bytes': [130, note, 0], 'timestamp': None}, messages)
        p.wait_for_function('__audioAudit.snapshot().sources.every(s=>s.ended && s.disconnected)')
        self.assertEqual(self.errors, [])


if __name__ == '__main__':
    unittest.main()
