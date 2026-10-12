# Enochian Elements operations

## Startup and healthy state

From the repository root:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/` or `/UIUX/`. The catalog has **63 original controls** in six functional groups, **12 device previews** linking to seven working studies, and **5 dashboard/HUD previews**. Code selects only the 63 controls. Search covers all three collections, familiar device terms, and legacy names.

## Dashboards and HUDs

`/UIUX#dashboards` contains Agent HUD, Build Board, Decision Matrix, Command Deck, and Command Deck 02. Canonical prototypes remain under `prototypes/agent-hud/`; publication copies and their navigation wrappers are generated under `UIUX/studies/agent-hud/`. Each wrapper has a direct screen link for embedding and a return link to the collection. Coding harness, VR, and content-production use cases are described as intended uses; current demos run simulated data.

The dedicated payload contains 54 public files: the existing 37 plus five dashboard wrappers, five screen pages, five preview images, one preview manifest, and one synthetic thumbnail asset. Dashboard page/image URLs carry content versions. The build checks the five source hashes and captured preview hashes, and stops if they no longer agree. Extend `HUDS` in the generator for future additions and recapture their rendered screens before release.

Agent HUD and Build Board keep their authored wide composition inside a horizontal scrolling container on phones. Matrix/deck pages retain their own responsive behavior and independent themes. The default public views use Enochian palettes; no external feed connects automatically. Optional machine-local command-deck thumbnails become a labeled synthetic frame in public copies.

With the approved test-only Python Playwright environment, run `python -m unittest discover -s tests -p test_hud_showcase.py -v` from `enochian_knobs_keys/`. Healthy means five visible previews, search matches for dashboard/HUD/harness/VR/video production, all screens initialized, working pause/view/task/undo controls, no document overflow at 1440px and 390px, no missing local assets, and working return links. Check the same collection on both Firebase hosts after deployment. Regenerate/build/redeploy if page versions or preview inventories disagree; use the existing Hosting rollback procedure if a release cannot be repaired.

The seven studies are under `/UIUX/studies/keyboard/`, `midi-pad/`, `op-1/`, `dj-decks/`, `speakers/`, `tp-7/`, and `apple-devices/`. Both landing and study navigation use rooted public links so Firebase clean URLs do not change relative resolution.

## Test environment

Application dependencies are unchanged. The imported browser suite needs isolated, test-only Python Playwright **1.60.0** and Chromium:

```bash
python3 -m venv .qa/test-env
.qa/test-env/bin/python -m pip install playwright==1.60.0
.qa/test-env/bin/python -m playwright install chromium
```

Run the suite from its source root so `tests.transport_native` resolves:

```bash
cd enochian_knobs_keys
../.qa/test-env/bin/python -m unittest discover -s tests -v
```

Return to the repository root after testing. The source acceptance/capture scripts are documented in each study README. The six capture commands in the build plan run from `enochian_knobs_keys/`; their `.qa/` output is ignored and never packaged.

No site environment variables are required. Firebase needs an existing credential authorized for the intended Hosting project/site. Keep CLI or Google application-default credentials outside the repository. `firebase login:list` can be empty even when application-default credentials work; check actual authenticated site listing before requesting another login.

## Preview capture and generation

The generator requires Python 3 and Beautiful Soup 4. When a composed source changes, capture its approved previews before generating:

```bash
python3 scripts/generate_uiux.py --preview-spec > /tmp/enochian-preview-spec.json
.qa/test-env/bin/python scripts/build_uiux.py --capture-previews --preview-spec /tmp/enochian-preview-spec.json
python3 scripts/generate_uiux.py
node --check UIUX/controls.js
node --check UIUX/atlas.js
```

Capture produces 24 object/finish PNGs with no sound or MIDI activation, plus `UIUX/previews/manifest.json` recording browser/version, viewport, source hashes, and image dimensions/hashes. Asset URLs have content hashes. Source changes invalidate the manifest; recapture rather than bypassing that check.

The generator validates 63 unique control names, a shared code utility, and 12 unique study names. It preserves source IDs and JS APIs, including `window.Aemeth`. Original names remain search aliases, not competing public titles. Generated study copies preserve source behavior and use public navigation paths; original files keep their relative source navigation.

## Build boundaries

```bash
python3 scripts/build_uiux.py
python3 scripts/build_uiux.py --showcase
```

The dedicated payload contains **37 public files**: one atlas page, four assets, seven study pages, 24 previews, and the preview manifest. The root payload adds tracked public source/Vietnamese runtime files and the landing page. It uses explicit public roots, excludes dotfiles, tests, source documentation, QA reports, untracked files, and local-only artifacts. Newly approved public source files must be staged or committed before the root build. Neither payload publishes the untracked `enochian_knobs_keys/index 2.html` or Weyland workspace.

Both output directories require their build markers before the builder replaces them. Do not point Hosting at the raw repository.

## Validation before release

- Run the full imported suite with all assertions retained. Physical MIDI is not claimed as tested; its routing tests use a labelled boundary double.
- Regenerate/build twice and compare HTML/CSS/JS hashes.
- At 1440px and 390px, check both atlas themes, 63 visible controls, 12 previews, code selection/copy, familiar and legacy search, root links, and all seven public study routes/backlinks.
- Exercise numbered toggles, both toggle banks, typing and synth keys, pads/sequencing, mixer linking/faders, turntable playback/scrub, speaker volume/standby/inputs, and voice demos.
- Verify timer start/pause/reset, Pomodoro phase skip, context selection/compaction, agent spawn/halt, and quota provider/ring changes. Context/quota readouts remain simulations.
- Voice Assistant retains 60 clock tick lines, four states, push-to-talk, and both finishes. Its historical seal attribution stays intact. Check selected/hover card readability in Dark.
- Usage Monitor needs its 340px desktop gauge track plus a visible chart and readable verdict panel; keep the source's stacked layout below its breakpoint.
- Device frames retain nine bodies and five blank screen slots: display and all-in-one 16:9, laptop 16:10, tablet 4:3, phone 9:19.5. Verify finish state/storage, containment at 1440/768/390/280px, ratio tolerance 0.02, and label contrast at least 4.5:1. Synthetic insertion fixtures are test-only; ship zero children in every slot.
- New instruments start muted. Preserve explicit MIDI output selection, `sysex:false`, held-note ownership, release/panic/blur cleanup, the recorder's 30-second generated-stream bound, and supported/unsupported encoding behavior.
- Require no uncaught page errors, missing public assets, or horizontal page overflow. Source wide instruments may pan inside their intended viewport.

## Targeted releases

Read-only site checks confirmed these owners on 2026-10-12:

- `uiux-nonhumanintelligence` belongs to project `nonhumanintelligence`.
- `uncommoncore` belongs to project `uncommoncore`.

Deploy separately with the approved pinned CLI:

```bash
npx --yes firebase-tools@15.33.0 deploy --only hosting --project nonhumanintelligence --config firebase.uiux.json --non-interactive
npx --yes firebase-tools@15.33.0 deploy --only hosting --project uncommoncore --config firebase.showcase.json --non-interactive
```

`firebase.showcase.json` targets only `uncommoncore`, retaining its original redirects, Vietnamese rewrite, Cloud Run API rewrite, and cache headers. Avoid deploying with the broader `firebase.json`: it also contains `104kdli`, which is outside this release.

Record the run ID, full deployed Git commit, both Hosting version/release IDs, validation results, and payload hashes in the learning log. A Hosting deploy does not push Git commits to GitHub.

## Regular monitoring

Check `https://uncommoncore.web.app/` and `https://uiux-nonhumanintelligence.web.app/UIUX` for HTTP 200. On both hosts, verify the 63-control/12-study counts, one legacy search, theme and code, one instrument interaction, and the Apple frame page with empty screens. All seven study routes, four catalog assets, and 24 preview requests should return HTTP 200.

Firebase normalizes `/UIUX/` to `/UIUX`; validate the canonical URL without a page query string, including in an existing browser tab. The pages require cache revalidation; CSS, JS, and preview URLs carry content hashes. Default Hosting URLs are the verified release targets. Announce `uiux.nonhumanintelligence.work` only after checking current host/ownership/certificate states and HTTPS; DNS setup alone is not evidence that it is live.

Healthy: successful Hosting releases, coherent asset hashes, working inputs/navigation, no page errors, and empty device screens. Watch Hosting releases and any custom-domain state in Firebase/GCP. No automatic alerts or live quota integration are configured by this work.

## Failure response and recovery

- Missing/extra/duplicate catalog name: compare the source headings, approved map, and generator groups. Do not remove a validation gate.
- Stale preview/source hash: recapture from the changed authored source with the recorded test environment; regenerate and rebuild.
- Broken study navigation: inspect the generated rooted href and the actual clean URL before editing source behavior.
- Mixed cached assets or missing Voice Assistant ticks: inspect hashed URLs and initialization, then rebuild and verify a normal canonical-page reload.
- Local test import failure: run the suite from `enochian_knobs_keys/`; do not alter test imports to hide a wrong working directory.
- Unsupported native recording: the authored recorder reports that limitation and keeps generated playback available; do not add microphone access or an upload fallback.
- Failed post-release page: restore the prior healthy version through the affected site's Firebase Hosting console, then investigate. Keep the other site and `104kdli` outside that rollback.
- Default URL works but custom domain fails: inspect DNS and Firebase host/ownership/certificate states. Escalate DNS access issues to the `nonhumanintelligence.work` Cloudflare zone administrator.

Escalate unresolved Hosting access, site ownership, or behavior failures to Alan with the failing command/gate and the smallest proposed correction. Stop if a correction changes this plan's behavior, dependencies, permissions, or formulas.

## Security notes

Search renders user input through DOM text nodes. New instrument studies are offline and self-contained. Existing audio activation and optional MIDI permission/output selection remain explicit. Frames accept no uploads, remote HTML, or built-in iframe content. Keep credentials and private local artifacts outside public builds. If a credential is exposed, stop release work, revoke it with the credential owner, rebuild the curated payload, and verify the affected Hosting release.
