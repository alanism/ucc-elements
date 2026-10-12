"""Browser regression for asynchronous clipboard feedback in the public atlas."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import unittest

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[2]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class ShowcaseCopyTests(unittest.TestCase):
    def test_copy_keeps_button_reference_after_clipboard_await(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with sync_playwright() as pw:
                browser = pw.chromium.launch()
                context = browser.new_context(permissions=["clipboard-read", "clipboard-write"])
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{server.server_port}/UIUX/")
                page.wait_for_selector("#code-select option", state="attached")
                page.locator("#code-control").click()
                page.locator("#code-select").select_option(index=1)
                expected = page.locator("#selected-code").inner_text()
                self.assertGreater(len(expected), 40)
                page.locator("#copy-selected-code").click()
                expect(page.locator("#copy-selected-code")).to_have_text("Copied")
                self.assertEqual(page.evaluate("navigator.clipboard.readText()"), expected)
                expect(page.locator("#copy-selected-code")).to_have_text("Copy code")
                self.assertEqual(errors, [])
                browser.close()
        finally:
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()
