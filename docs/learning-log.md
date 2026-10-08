# Learning log

## 2026-10-08 — Unified Enochian Elements showcase

- Changed: Combined 55 controls from three studies into one six-family catalog with a six-column editorial layout, Light/Dark page modes, Cinnabar signal color, top search and Code mode, and one code snippet open at a time. Removed visible outside lineage and Ember options. Deployed a dedicated Firebase Hosting site.
- Failure: The first pass embedded three source pages as stacked iframes. The result preserved interactions but failed the required layout redesign. A second pass initially failed `node --check` because the source Motion import remained in a generated block. The first public release loaded unstyled because Firebase normalized `/UIUX/` to `/UIUX`, changing where relative asset paths resolved.
- Root cause: Reusing page boundaries prevented a coherent catalog. The generator's import-stripping expression did not account for leading whitespace. Relative asset URLs were incompatible with the deployed clean URL.
- Fix: Extracted each control into an ordered grid and scoped source behavior; corrected the import extraction; rooted asset URLs at `/UIUX/`; verified desktop/mobile visuals and representative controls on the live site.
- Prevention: Keep the generator's 55-control name assertion and check generated JavaScript before deployment. Verify actual browser layout and asset HTTP responses on the released URL.
- Suggested harness update: Add a deployed browser smoke check for 55 visible controls, ordered group headings, no page-wide horizontal overflow at a phone width, four loaded CSS/JS assets, and one top-bar code drawer.
- Remaining risk: `uiux.nonhumanintelligence.work` is pending a Cloudflare DNS CNAME; the default Firebase URL is live. External font and Motion CDNs are runtime dependencies, with fallback for Motion only.

## 2026-10-08 — Aemeth asset freshness and theme integration repair

- Changed: Fingerprinted every local CSS/JS asset (including the dynamic atlas import), required HTML cache revalidation, restored normal instrument CSS scoping, preserved readable Aemeth selected/hover cards under the gallery dark theme, and derived the browser catalog assertion from the generated count. The original Volume II source is byte-for-byte unchanged.
- Failure: The previous CSS-only fix left the user with stale JavaScript: the seal appeared without clock ticks, state initialization, or working controls. The initial production navigation in a previously used browser also returned the old 55-control HTML. The gallery inherited light text into authored white selected cards. Browser automation temporarily timed out while loading its request policy; supported DOM interactions worked when availability recovered.
- Root cause: Unversioned scripts and cached HTML could be served from different releases. A broad gallery theme variable override conflicted with Aemeth's authored light selection surface. The prior large-mask CSS parser diagnosis was not supported by evidence. The browser catalog assertion still hardcoded 55.
- Fix: Content hashes couple HTML with the correct assets; canonical HTML returns `Cache-Control: no-cache, max-age=0, must-revalidate`. Selected/hover state cards locally restore the authored dark text variables in atlas CSS. Normal reload refreshed the actual user's Chrome tab.
- Validation: Deterministic generation twice; content-hash assertions for all four assets; source preservation assertion; both JS syntax checks; standalone build; `git diff --check`; successful Firebase Hosting release; live HTTP 200 and cache header; 60 clock ticks and state-specific label in the user's canonical Chrome tab; all four live state transitions; push-to-talk composing reply; Light/Dark and Ivory/Obsidian screenshots; 390px layout with no page horizontal overflow; no warnings/errors in the user's refreshed Chrome tab.
- Prevention / suggested harness update: Compare the source and gallery in a real browser, then test the canonical deployed page in a previously used tab after normal reload. Verify initialization and interaction, not just a static seal. Require fingerprints for every asset and a dynamic catalog count.
- Remaining risks: Existing tabs need one reload to replace previously cached HTML. The authored voice response is a simulation, as before; no voice API was added. Custom-domain activation was not changed or reverified.

## 2026-10-08 — Atlas top-level copy refresh

- Changed: Applied the supplied rewrite preview's top-level Enochian positioning, purpose/use/how brief, and family descriptions to the source template and generator. Preserved the existing Aemeth element and hashed asset pipeline.
- Failure: The preview was a static export from an older gallery state, so copying it wholesale would have regressed the current element count and asset paths.
- Root cause: The preview and live atlas were generated from different revisions.
- Fix: Ported only the copy and its small responsive styling addition, regenerated the page, and verified the rendered hero, search, theme controls, and zero browser warnings/errors locally before release.
- Prevention: Treat static preview files as copy references unless their generated asset versions and control inventory match the current source.
- Suggested harness update: Add a generated-copy smoke check for the hero kicker, purpose/use/how labels, and all six family descriptions.
