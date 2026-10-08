# Learning log

## 2026-10-08 — Unified Enochian Elements showcase

- Changed: Combined 55 controls from three studies into one six-family catalog with a six-column editorial layout, Light/Dark page modes, Cinnabar signal color, top search and Code mode, and one code snippet open at a time. Removed visible outside lineage and Ember options. Deployed a dedicated Firebase Hosting site.
- Failure: The first pass embedded three source pages as stacked iframes. The result preserved interactions but failed the required layout redesign. A second pass initially failed `node --check` because the source Motion import remained in a generated block. The first public release loaded unstyled because Firebase normalized `/UIUX/` to `/UIUX`, changing where relative asset paths resolved.
- Root cause: Reusing page boundaries prevented a coherent catalog. The generator's import-stripping expression did not account for leading whitespace. Relative asset URLs were incompatible with the deployed clean URL.
- Fix: Extracted each control into an ordered grid and scoped source behavior; corrected the import extraction; rooted asset URLs at `/UIUX/`; verified desktop/mobile visuals and representative controls on the live site.
- Prevention: Keep the generator's 55-control name assertion and check generated JavaScript before deployment. Verify actual browser layout and asset HTTP responses on the released URL.
- Suggested harness update: Add a deployed browser smoke check for 55 visible controls, ordered group headings, no page-wide horizontal overflow at a phone width, four loaded CSS/JS assets, and one top-bar code drawer.
- Remaining risk: `uiux.nonhumanintelligence.work` is pending a Cloudflare DNS CNAME; the default Firebase URL is live. External font and Motion CDNs are runtime dependencies, with fallback for Motion only.
