"""Real-browser vertical behavior slices for Canticle / OP study.
Run: python -m unittest discover -s tests -p 'test_op1*.py' -v
Each behavior was observed RED before its implementation. No behavior mocks.
"""
from pathlib import Path
import unittest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'op-1' / 'index.html'


class CanticleBehaviorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width': 1440, 'height': 1000})
        self.page = self.context.new_page()
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.page.goto(PAGE.as_uri())
        self.page.evaluate("""window.noteEvents=[];
          document.getElementById('instrument').addEventListener('canticle:note', e=>noteEvents.push(e.detail));
          window.parameterEvents=[];
          document.getElementById('instrument').addEventListener('canticle:parameter', e=>parameterEvents.push(e.detail));""")

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [])

    def note(self, n):
        return self.page.locator(f'#keyboard [data-note="{n}"]')

    def down(self, n):
        return self.note(n).get_attribute('data-down') == 'true'

    def test_computer_chords_emit_actual_note_events(self):
        self.note(0).focus()
        self.page.keyboard.down('a')
        self.page.keyboard.down('d')
        self.assertTrue(self.down(0), 'A must hold C4')
        self.assertTrue(self.down(4), 'D must hold E4 concurrently')
        self.assertEqual(self.page.locator('#held-readout').inner_text(), '2')
        self.page.keyboard.up('a')
        self.assertFalse(self.down(0))
        self.assertTrue(self.down(4))
        self.page.keyboard.up('d')
        events = self.page.evaluate('noteEvents')
        self.assertEqual([(e['phase'], e['note']) for e in events], [('on', 0), ('on', 4), ('off', 0), ('off', 4)])
        self.assertEqual(events[0]['midi'], 60)
        self.assertAlmostEqual(events[0]['hz'], 261.625565, places=4)
        self.assertEqual(self.page.locator('#held-readout').inner_text(), '0')
    def test_pointer_glide_releases_only_its_own_source(self):
        self.note(0).focus()
        self.page.keyboard.down('a')
        c = self.note(0).bounding_box()
        d = self.note(2).bounding_box()
        self.page.mouse.move(c['x'] + c['width']/2, c['y'] + c['height']/2)
        self.page.mouse.down()
        self.page.mouse.move(d['x'] + d['width']/2, d['y'] + d['height']/2, steps=5)
        self.assertTrue(self.down(2), 'Pointer glide must reach D4')
        self.assertTrue(self.down(0), 'Computer-held C4 must survive glide')
        self.page.mouse.up()
        self.assertFalse(self.down(2))
        self.assertTrue(self.down(0), 'Pointerup cannot cancel a keyboard owner')
        self.page.keyboard.up('a')
        self.assertFalse(self.down(0))
        self.assertEqual(len(self.page.evaluate("noteEvents.filter(e=>e.phase==='off' && e.note===0)")), 1)
    def test_focusable_notes_support_space_and_enter_hold(self):
        for note, key in [(7, 'Space'), (3, 'Enter')]:
            self.note(note).focus()
            self.page.keyboard.down(key)
            self.assertTrue(self.down(note), f'{key} activates the focused note')
            self.assertEqual(self.page.locator('#held-readout').inner_text(), '1')
            self.page.keyboard.up(key)
            self.assertFalse(self.down(note))
            self.assertEqual(self.page.locator('#held-readout').inner_text(), '0')
    def test_octave_change_releases_held_notes_before_retuning(self):
        self.note(0).focus()
        self.page.keyboard.down('a')
        self.page.locator('#octave-up').click()
        self.assertEqual(self.page.locator('#octave-readout').inner_text(), '5')
        self.assertFalse(self.down(0), 'Octave change must release the old voice')
        self.page.keyboard.up('a')
        self.note(0).focus()
        self.page.keyboard.down('a')
        self.assertEqual(self.page.evaluate("noteEvents.at(-1).midi"), 72)
        self.page.keyboard.up('a')
        self.page.keyboard.press('z')
        self.assertEqual(self.page.locator('#octave-readout').inner_text(), '4')
        self.page.keyboard.press('x')
        self.assertEqual(self.page.locator('#octave-readout').inner_text(), '5')
        for _ in range(2):
            self.page.locator('#octave-up').click()
        self.note(0).focus()
        self.page.keyboard.press('x')
        self.assertEqual(self.page.locator('#octave-readout').inner_text(), '7')
        self.assertTrue(self.page.locator('#octave-up').is_disabled())
    def test_safety_release_clears_all_sources_on_blur_and_panic(self):
        self.note(0).focus()
        self.page.keyboard.down('a')
        self.page.keyboard.down('d')
        self.page.evaluate("window.dispatchEvent(new Event('blur'))")
        self.assertEqual(self.page.locator('#held-readout').inner_text(), '0')
        self.page.keyboard.up('a')
        self.page.keyboard.up('d')
        self.note(7).focus()
        self.page.keyboard.down('Space')
        self.page.locator('#panic').click()
        self.assertFalse(self.down(7))
        self.page.keyboard.up('Space')
        self.assertEqual(self.page.locator('#keyboard [data-down=true]').count(), 0)
    def test_encoders_accept_keyboard_steps_limits_and_units(self):
        pitch = self.page.locator('[data-encoder=pitch]')
        pitch.focus()
        self.page.keyboard.press('ArrowUp')
        self.assertEqual(pitch.get_attribute('aria-valuenow'), '1')
        self.page.keyboard.press('PageUp')
        self.assertEqual(pitch.get_attribute('aria-valuenow'), '11')
        self.page.keyboard.press('End')
        self.assertEqual(pitch.get_attribute('aria-valuenow'), '12')
        self.page.keyboard.press('Home')
        self.assertEqual(pitch.get_attribute('aria-valuenow'), '-12')
        self.assertIn('semitones', pitch.get_attribute('aria-valuetext'))
        for name, expected, unit in [('tone', '2450', 'Hz'), ('release', '0.45', 'seconds'), ('level', '66', 'percent')]:
            control = self.page.locator(f'[data-encoder={name}]')
            control.focus()
            self.page.keyboard.press('ArrowRight')
            self.assertEqual(control.get_attribute('aria-valuenow'), expected)
            self.assertIn(unit, control.get_attribute('aria-valuetext'))
        events = self.page.evaluate('parameterEvents')
        self.assertEqual(events[0], {'parameter': 'pitch', 'value': 1, 'unit': 'semitones'})
        self.note(0).focus()
        self.page.keyboard.down('a')
        self.assertAlmostEqual(self.page.evaluate('noteEvents.at(-1).hz'), 130.81278265, places=4)
        self.page.keyboard.up('a')
    def test_encoder_pointer_drag_reset_and_cancel(self):
        control = self.page.locator('[data-encoder=tone]')
        box = control.bounding_box()
        x, y = box['x']+box['width']/2, box['y']+box['height']/2
        self.page.mouse.move(x, y)
        self.page.mouse.down()
        self.page.mouse.move(x, y-100, steps=5)
        self.assertGreater(float(control.get_attribute('aria-valuenow')), 2400)
        self.page.mouse.up()
        control.dblclick()
        self.assertEqual(control.get_attribute('aria-valuenow'), '2400')
        self.page.mouse.move(x, y)
        self.page.mouse.down()
        self.page.mouse.move(x, y-200, steps=5)
        self.assertEqual(control.get_attribute('aria-valuenow'), '8000')
        control.dispatch_event('pointercancel', {'pointerId': 1})
        self.page.mouse.move(x, y+100, steps=5)
        self.assertEqual(control.get_attribute('aria-valuenow'), '8000', 'Canceled drag must no longer write values')
        self.page.mouse.up()
    def test_sound_button_enables_real_audio_and_mute_stops_voices(self):
        self.page.locator('#sound-toggle').click()
        self.assertEqual(self.page.locator('#sound-toggle').get_attribute('aria-pressed'), 'true')
        self.note(0).focus()
        self.page.keyboard.down('a')
        self.page.wait_for_timeout(100)
        metrics = self.page.evaluate('''() => {
            const data=new Float32Array(audioEngine.analyser.fftSize);
            audioEngine.analyser.getFloatTimeDomainData(data);
            return {state:audioEngine.ctx.state, voices:audioEngine.voices.size,
                rms:Math.sqrt(data.reduce((s,x)=>s+x*x,0)/data.length)};
        }''')
        self.assertEqual(metrics['state'], 'running')
        self.assertEqual(metrics['voices'], 1)
        self.assertGreater(metrics['rms'], 0.001, 'Actual native audio graph must produce signal')
        self.page.locator('#sound-toggle').click()
        self.assertEqual(self.page.locator('#sound-toggle').get_attribute('aria-pressed'), 'false')
        self.assertEqual(self.page.evaluate('audioEngine.voices.size'), 0)
        self.note(0).focus()
        self.page.keyboard.up('a')
    def test_note_event_tape_records_and_replays_a_phrase(self):
        self.page.locator('#record').click()
        self.assertEqual(self.page.locator('#record').get_attribute('aria-pressed'), 'true')
        self.page.locator('#play').click()
        self.assertIn('RECORD', self.page.locator('#tape-readout').inner_text())
        self.note(0).focus()
        self.page.keyboard.down('a')
        self.page.wait_for_timeout(80)
        self.page.keyboard.up('a')
        self.page.wait_for_timeout(20)
        self.page.keyboard.down('d')
        self.page.wait_for_timeout(80)
        self.page.keyboard.up('d')
        self.page.locator('#stop').click()
        self.assertIn('4 EVENTS', self.page.locator('#tape-readout').inner_text())
        self.assertEqual(self.page.locator('#record').get_attribute('aria-pressed'), 'false')
        self.page.evaluate('noteEvents=[]')
        self.page.locator('#play').click()
        self.page.wait_for_function('noteEvents.length >= 4')
        self.page.wait_for_function("document.getElementById('play').getAttribute('aria-pressed')==='false'")
        replay = self.page.evaluate('noteEvents')
        self.assertEqual([(e['phase'], e['midi']) for e in replay], [('on', 60), ('off', 60), ('on', 64), ('off', 64)])
        self.assertEqual(self.page.locator('#held-readout').inner_text(), '0')
        self.assertTrue(self.page.locator('#tape-reels').is_visible())
        self.assertFalse(self.page.locator('#waveform').is_visible())
    def test_tape_loop_rewind_clear_and_undo_operate_on_the_recorded_take(self):
        self.page.locator('#record').click()
        self.page.locator('#play').click()
        self.note(0).focus()
        self.page.keyboard.down('a')
        self.page.wait_for_timeout(50)
        self.page.keyboard.up('a')
        self.page.locator('#stop').click()
        self.page.locator('#loop-toggle').click()
        self.assertEqual(self.page.locator('#loop-toggle').get_attribute('aria-pressed'), 'true')
        self.page.evaluate('noteEvents=[]')
        self.page.locator('#play').click()
        self.page.wait_for_function("noteEvents.filter(e=>e.phase==='on').length>=2")
        self.page.locator('#home-tape').click()
        self.assertEqual(self.page.locator('#play').get_attribute('aria-pressed'), 'false')
        self.assertEqual(self.page.locator('#tape-time').text_content(), '0.0s')
        self.assertEqual(self.page.locator('#held-readout').inner_text(), '0')
        self.page.locator('#clear-tape').click()
        self.assertIn('0 EVENTS', self.page.locator('#tape-readout').inner_text())
        self.assertFalse(self.page.locator('#undo-clear').is_disabled())
        self.page.locator('#undo-clear').click()
        self.assertIn('2 EVENTS', self.page.locator('#tape-readout').inner_text())
        self.assertTrue(self.page.locator('#undo-clear').is_disabled())
    def test_eight_presets_apply_distinct_values_and_reset_to_canticle(self):
        snapshots=[]
        for number in range(1, 9):
            self.page.locator(f'[data-preset="{number}"]').click()
            self.assertEqual(self.page.locator(f'[data-preset="{number}"]').get_attribute('aria-pressed'), 'true')
            snapshots.append(tuple(self.page.locator(f'[data-encoder={name}]').get_attribute('aria-valuenow') for name in ['pitch','tone','release','level']))
        self.assertEqual(len(set(snapshots)), 8, 'Preset buttons must apply real distinct parameter sets')
        self.page.locator('#next-preset').click()
        self.assertEqual(self.page.locator('[data-preset="1"]').get_attribute('aria-pressed'), 'true')
        self.page.locator('#previous-preset').click()
        self.assertEqual(self.page.locator('[data-preset="8"]').get_attribute('aria-pressed'), 'true')
        self.page.locator('#reset-params').click()
        self.assertEqual(tuple(self.page.locator(f'[data-encoder={name}]').get_attribute('aria-valuenow') for name in ['pitch','tone','release','level']), ('0','2400','0.4','65'))
        self.assertEqual(self.page.locator('#screen-preset').inner_text(), 'DEFAULT')
    def test_material_finish_changes_the_chassis_and_persists(self):
        self.page.locator('[data-set-finish=obsidian]').click()
        self.assertEqual(self.page.locator('#instrument').get_attribute('data-finish'), 'obsidian')
        self.assertEqual(self.page.locator('[data-set-finish=obsidian]').get_attribute('aria-pressed'), 'true')
        self.assertEqual(self.page.locator('[data-set-finish=ivory]').get_attribute('aria-pressed'), 'false')
        self.page.reload()
        self.assertEqual(self.page.locator('#instrument').get_attribute('data-finish'), 'obsidian')
        self.page.locator('[data-set-finish=ivory]').click()
        self.assertEqual(self.page.locator('#instrument').get_attribute('data-finish'), 'ivory')
    def test_mode_buttons_switch_the_display_without_erasing_notes(self):
        self.note(0).focus()
        self.page.keyboard.down('a')
        self.page.locator('[data-mode=tape]').click()
        self.assertTrue(self.page.locator('#tape-reels').is_visible())
        self.assertFalse(self.page.locator('#waveform').is_visible())
        self.assertEqual(self.page.locator('#held-readout').inner_text(), '1')
        self.assertEqual(self.page.locator('[data-mode=tape]').get_attribute('aria-pressed'), 'true')
        self.page.locator('[data-mode=synth]').click()
        self.assertTrue(self.page.locator('#waveform').is_visible())
        self.assertFalse(self.page.locator('#tape-reels').is_visible())
        self.page.keyboard.up('a')
        self.assertEqual(self.page.locator('#held-readout').inner_text(), '0')

    def test_second_octave_white_keys_have_distinct_computer_mappings(self):
        for note, key in [(12,'k'),(14,'l'),(16,';'),(17,"'"),(19,']'),(21,'\\'),(23,'/')]:
            with self.subTest(note=note, key=key):
                self.note(0).focus()
                self.page.keyboard.down(key)
                self.assertEqual(self.note(note).get_attribute('aria-pressed'), 'true')
                self.page.keyboard.up(key)
                self.assertEqual(self.note(note).get_attribute('aria-pressed'), 'false')

    def test_inspector_buttons_open_their_documentation_panels(self):
        for button, panel in [('help-button','help-panel'),('code-button','code-panel')]:
            with self.subTest(panel=panel):
                self.page.locator('#'+button).click()
                self.assertIsNotNone(self.page.locator('#'+panel).get_attribute('open'))
                self.assertEqual(self.page.locator('#'+button).get_attribute('aria-controls'), panel)
                self.assertEqual(self.page.locator('#'+button).get_attribute('aria-expanded'), 'true')
                self.page.locator('#'+panel+' summary').click()
                self.page.wait_for_function("id => document.getElementById(id).getAttribute('aria-expanded')==='false'", arg=button)

    def test_key_hints_toggle_without_hiding_the_note_controls(self):
        self.page.locator('#key-hints').click()
        self.assertEqual(self.page.locator('#key-hints').get_attribute('aria-pressed'), 'false')
        self.assertFalse(self.note(0).locator('.hint').is_visible())
        self.assertTrue(self.note(0).is_visible())
        self.page.locator('#key-hints').click()
        self.assertTrue(self.note(0).locator('.hint').is_visible())

    def test_all_mobile_interactive_targets_are_at_least_44_pixels(self):
        self.page.set_viewport_size({'width':390,'height':844})
        undersized=self.page.evaluate("""() => [...document.querySelectorAll('button,a,summary,[role=slider]')].map(e=>{
            const r=e.getBoundingClientRect();return {name:e.id||e.textContent.trim(),w:r.width,h:r.height};
        }).filter(x=>x.w>0&&x.h>0&&(x.w<43.99||x.h<43.99))""")
        self.assertEqual(undersized, [])

    def test_small_control_labels_have_readable_contrast_in_both_finishes(self):
        for finish in ['ivory','obsidian']:
            self.page.locator('[data-set-finish='+finish+']').click()
            low=self.page.evaluate("""() => {
                const rgb=s=>s.match(/[\\d.]+/g).slice(0,3).map(Number);
                const linear=x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4};
                const lum=a=>a.map(linear).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
                return [...document.querySelectorAll('.round-cap small')].map(e=>{
                    const fg=lum(rgb(getComputedStyle(e).color)),bg=lum(rgb(getComputedStyle(e.parentElement).backgroundColor));
                    return {label:e.textContent,contrast:(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)};
                }).filter(x=>x.contrast<4.5);
            }""")
            self.assertEqual(low, [], finish)

    def test_large_chords_keep_mobile_status_and_display_contained(self):
        self.page.set_viewport_size({'width':390,'height':844})
        self.note(0).focus()
        for key in self.page.evaluate('[...WHITE,...BLACK].map(x=>x[1])'):
            self.page.keyboard.down(key)
        self.assertEqual(self.page.locator('#held-readout').inner_text(), '24')
        self.assertEqual(self.page.evaluate('document.documentElement.scrollWidth'), 390)
        self.assertIn('+21', self.page.locator('#note-readout').inner_text())
        self.assertIn('B5', self.page.locator('#screen').get_attribute('aria-label'))
        self.page.locator('#panic').click()
        self.assertEqual(self.page.locator('#held-readout').inner_text(), '0')

    def test_offscreen_and_reduced_motion_controls_do_not_run_spring_frames(self):
        self.page.set_viewport_size({'width':1440,'height':300})
        self.page.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)')
        self.page.wait_for_timeout(150)
        self.assertFalse(self.page.evaluate('inView'))
        self.page.evaluate('knobs.pitch.set(7)')
        self.assertEqual(self.page.evaluate('knobs.pitch.spring.raf'), 0)
        self.page.evaluate('window.scrollTo(0,0)')
        self.page.emulate_media(reduced_motion='reduce')
        self.page.evaluate('knobs.pitch.set(8)')
        self.assertEqual(self.page.evaluate('knobs.pitch.spring.raf'), 0)
        self.assertEqual(self.page.locator('[data-encoder=pitch]').get_attribute('aria-valuenow'), '8')

    def test_mute_silences_released_tails_and_cleans_their_graphs(self):
        self.page.locator('#sound-toggle').click()
        self.page.locator('[data-preset="8"]').click()
        self.note(0).focus()
        self.page.keyboard.down('a')
        self.page.wait_for_timeout(100)
        self.page.keyboard.up('a')
        self.page.locator('#sound-toggle').click()
        self.page.wait_for_timeout(150)
        rms=self.page.evaluate("""() => {const d=new Float32Array(audioEngine.analyser.fftSize);audioEngine.analyser.getFloatTimeDomainData(d);return Math.sqrt(d.reduce((s,x)=>s+x*x,0)/d.length)}""")
        self.assertLess(rms, 0.0001, 'Mute must silence released envelopes, not only held voices')
        self.assertEqual(self.page.evaluate('audioEngine.graphs.size'), 0)
        self.page.locator('#sound-toggle').click()
        self.note(0).focus()
        self.page.keyboard.down('a')
        self.page.wait_for_timeout(100)
        self.assertGreater(self.page.evaluate('audioEngine.master.gain.value'), 0)
        self.page.keyboard.up('a')

    def test_playback_keeps_original_pitch_when_live_input_owns_the_same_key(self):
        self.page.locator('#sound-toggle').click()
        self.page.locator('#record').click()
        self.page.locator('#play').click()
        self.note(0).focus()
        self.page.keyboard.down('a')
        self.page.wait_for_timeout(300)
        self.page.keyboard.up('a')
        self.page.locator('#stop').click()
        self.page.locator('#octave-up').click()
        self.note(0).focus()
        self.page.keyboard.down('a')
        self.page.locator('#play').click()
        self.page.wait_for_timeout(75)
        self.assertEqual(self.page.evaluate('[...activeNotes.values()].map(v=>v.midi).sort((a,b)=>a-b)'), [60,72])
        self.assertEqual(self.page.evaluate('audioEngine.voices.size'), 2)
        self.page.keyboard.up('a')
        self.page.wait_for_timeout(20)
        self.assertEqual(self.page.evaluate('[...activeNotes.values()].map(v=>v.midi)'), [60])
        self.assertAlmostEqual(self.page.evaluate('[...audioEngine.voices.values()][0].o.frequency.value'), self.page.evaluate('frequency(60)'), delta=.1)
        self.page.locator('#stop').click()
        self.assertEqual(self.page.locator('#held-readout').inner_text(), '0')

    def test_responsive_breakpoints_keep_page_contained_and_targets_usable(self):
        for width in [280,320,360,390,768,1000,1024,1440]:
            with self.subTest(width=width):
                self.page.set_viewport_size({'width':width,'height':1000})
                self.assertEqual(self.page.evaluate('document.documentElement.scrollWidth'), width)
                small=self.page.evaluate("""() => [...document.querySelectorAll('button,a,summary,[role=slider]')].map(e=>{
                    const r=e.getBoundingClientRect();return {label:e.id||e.getAttribute('aria-label'),w:r.width,h:r.height};
                }).filter(x=>x.w>0&&x.h>0&&(x.w<43.99||x.h<43.99))""")
                self.assertEqual(small, [])


if __name__ == '__main__':
    unittest.main()
