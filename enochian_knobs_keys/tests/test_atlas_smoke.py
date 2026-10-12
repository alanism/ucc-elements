"""Regression smoke coverage for the existing, unchanged atlas components."""
from pathlib import Path
import unittest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class AtlasSmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def test_existing_atlas_pages_initialize_without_javascript_errors(self):
        for name in ['index.html', 'volume-2/index.html', 'volume-3/index.html']:
            with self.subTest(page=name):
                page = self.browser.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.goto((ROOT / name).as_uri())
                page.wait_for_timeout(100)
                self.assertGreater(page.locator('button').count(), 20)
                self.assertEqual(errors, [])
                page.close()

    def test_original_canticle_keys_still_play_and_release_keyboard_chords(self):
        page = self.browser.new_page()
        page.goto((ROOT / 'volume-3/index.html').as_uri())
        page.locator('#opKb').focus()
        page.keyboard.down('a')
        page.keyboard.down('d')
        self.assertEqual(page.locator('#opKb [data-down=true]').count(), 2)
        page.keyboard.up('a')
        self.assertEqual(page.locator('#opKb [data-down=true]').count(), 1)
        page.keyboard.up('d')
        self.assertEqual(page.locator('#opKb [data-down=true]').count(), 0)
        page.close()


if __name__ == '__main__':
    unittest.main()
