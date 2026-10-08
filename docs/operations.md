# Enochian Elements operations

## Run locally

From the repository root, run `python3 -m http.server 8080` and open `http://localhost:8080/UIUX/`.

## Verify and release

After editing one of the three control sources or the atlas shell:

```bash
python3 scripts/generate_uiux.py
node --check UIUX/controls.js
node --check UIUX/atlas.js
python3 scripts/build_uiux.py
npx --yes firebase-tools@15.33.0 deploy --only hosting --project nonhumanintelligence --config firebase.uiux.json --non-interactive
```

The generator requires Python 3 and Beautiful Soup 4. The Firebase CLI needs an account authorized to deploy Hosting in the `nonhumanintelligence` project. No environment variables are required by the site itself. Keep credentials in the CLI's normal account store, outside the repository.

The public payload is five files under `.uiux-dist`: the page and four CSS/JS assets. The dedicated Hosting site is `uiux-nonhumanintelligence`; its default URL is `https://uiux-nonhumanintelligence.web.app/UIUX`. The Firebase custom-domain object for `uiux.nonhumanintelligence.work` has been created, but DNS activation depends on the authoritative DNS provider. Its required CNAME is `uiux.nonhumanintelligence.work` → `uiux-nonhumanintelligence.web.app` (DNS only, no proxy). Inspect the Firebase Hosting custom-domain status after adding it; wait for host, ownership, and certificate states to become active before announcing the custom URL.

## Monitor

Check `https://uiux-nonhumanintelligence.web.app/UIUX` for HTTP 200 and a rendered catalog of 56 controls. In a browser, verify search, Light/Dark, one open code panel, a slider and a switch. On the custom domain, also verify HTTPS and the same page. Watch Firebase Hosting release and custom-domain status in the GCP/Firebase console. The expected healthy state is a successful Hosting release, working interactions, no console errors from the page, and `HOST_ACTIVE` / `OWNERSHIP_ACTIVE` / `CERT_ACTIVE` for the custom domain.

Hosting normalizes `/UIUX/` to `/UIUX`; keep page assets rooted at `/UIUX/` and check that all four CSS/JS asset requests return HTTP 200 after every release.

## Recovery

If generation fails, compare the control names in the three source pages against the ordered list in `scripts/generate_uiux.py`; the generator deliberately stops on missing or extra names. If a control fails at runtime, inspect the browser console and the corresponding source page before regenerating. If the deployed page fails but the prior release worked, use the Firebase Hosting console to roll back the dedicated site to the last healthy release. If the custom domain fails while the default URL works, inspect the domain's `requiredDnsUpdates`, DNS propagation, and certificate state before changing the site. Escalate unresolved DNS access or certificate issues to whoever administers the Cloudflare zone for `nonhumanintelligence.work`.

## Security and known limits

Search results use DOM text nodes for user input. Do not commit credentials, access tokens, or generated service-account files. Motion and IBM Plex load from external CDNs; the page retains an immediate-transition fallback for Motion. Browser audio starts only after a user gesture. Wide physical controls may scroll horizontally within their cards on small screens.

## Aemeth release check

All four local CSS/JS assets have content hashes in their URLs, including the dynamically imported atlas script. The canonical HTML routes require cache revalidation. Regenerate after editing either atlas asset so its hash updates. Verify the canonical `/UIUX` URL in a previously used browser tab, without a page query string: Aemeth must have 60 clock tick lines, a state-specific accessible label, four working state choices, readable selected/hover cards in both page themes, and working Ivory/Obsidian finishes. Compare the original Volume II page before changing integration; preserve its authored source.

If the seal appears but the clock ring or controls do not work, inspect the script URL and initialization before changing the seal CSS. A partial asset refresh can combine new HTML with stale JavaScript.
