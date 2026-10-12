// lt-check.mjs — Light Table harness. node lt-check.mjs <shotsDir> <light-table.html>
// Needs a Chrome on :9444 with WebGL (e.g. --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const [OUT, FILE] = process.argv.slice(2); mkdirSync(OUT, { recursive: true });
const AUDIT = readFileSync(new URL("../v2/audit-page.js", import.meta.url), "utf8");
const targets = await (await fetch("http://127.0.0.1:9444/json/list")).json();
const ws = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl);
let id = 0; const pending = new Map(), logs = [];
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method === "Runtime.exceptionThrown") logs.push("EXC " + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
  if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") logs.push("ERR " + d.params.args.map(a => a.value ?? a.description).join(" ")); };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ev = async e => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error((r.result.exceptionDetails.exception?.description || JSON.stringify(r.result.exceptionDetails)).slice(0, 300)); return r.result?.result?.value; };
const J = async e => JSON.parse(await ev(`JSON.stringify(${e})`));
const shot = async n => { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(`${OUT}/${n}.png`, Buffer.from(r.result.data, "base64")); };
const view = (w, h) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
async function load(q, w = 1440, h = 900) { await view(w, h); await send("Page.navigate", { url: "file://" + FILE + "?" + q });
  for (let i = 0; i < 80; i++) { await sleep(200); try { if (await ev("!!window.__lt")) break; } catch {} }
  if (q.includes("screen=operator")) { for (let i = 0; i < 100; i++) { await sleep(200); const s = await ev("__lt.mapState"); if (s === "ready" || s === "error") break; } await sleep(1800); } else await sleep(400); }
const key = async (k, code, vk) => { await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk }); };
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) throw new Error("missing "+${JSON.stringify(sel)}); e.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true})); return true})()`);
const R = { checks: [], audit: {} };
const ok = (name, cond, detail = "") => { R.checks.push({ name, pass: !!cond, detail }); console.log((cond ? "PASS " : "FAIL ") + name + (detail ? "  — " + String(detail).slice(0, 220) : "")); };
// overlapping text inside each SVG instrument (labels colliding with labels)
const svgOverlaps = `(()=>{ let n=0, ex=[]; document.querySelectorAll('.screen.on svg').forEach(sv=>{ const t=[...sv.querySelectorAll('text')].filter(e=>e.getClientRects().length).map(e=>({s:e.textContent,r:e.getBoundingClientRect()}));
  t.forEach((a,i)=>t.forEach((b,j)=>{ if(j>i && a.r.left<b.r.right-1&&b.r.left<a.r.right-1&&a.r.top<b.r.bottom-1&&b.r.top<a.r.bottom-1){ n++; if(ex.length<4) ex.push(a.s+"|"+b.s); } })); }); return {n,ex}; })()`;
const htmlOverflow = `(()=>{ const bad=[]; document.querySelectorAll('.screen.on *').forEach(e=>{ if(e instanceof SVGElement) return; const cs=getComputedStyle(e); if(cs.overflow!=='visible'||cs.textOverflow==='ellipsis') return; if(e.children.length===0 && e.scrollWidth>e.clientWidth+2 && e.clientWidth>0) bad.push(e.className+":"+e.textContent.slice(0,20)); }); return bad.slice(0,6); })()`;

const SCR = ["fleet", "mission", "operator", "devices"], TH = ["ares", "obsidian", "white"];
// ---------- 1. every palette × every screen: renders, fits, no text collisions, contrast ----------
for (const th of TH) for (const sc of SCR) {
  await load(`screen=${sc}&theme=${th}&sim=0`);
  const d = await J(`{sw:document.documentElement.scrollWidth, sh:document.documentElement.scrollHeight, th:document.documentElement.dataset.theme, on:document.querySelector('.screen.on')?.id, map:__lt.mapState}`);
  ok(`[${th}/${sc}] renders and fits 1440×900`, d.th === th && d.on === "s-" + sc && d.sw <= 1440 && d.sh <= 900, JSON.stringify(d));
  const ov = await J(svgOverlaps); ok(`[${th}/${sc}] no overlapping text in instruments`, ov.n === 0, ov.ex.join(" ; "));
  const hx = await J(htmlOverflow); ok(`[${th}/${sc}] no clipped HTML text`, hx.length === 0, hx.join(" ; "));
  const a = JSON.parse(await ev(`(${AUDIT})({})`)); R.audit[`${th}-${sc}`] = { contrast: a.contrast, sizes: a.type.sizes, weights: a.type.weights, below24: a.targets.below24, minControl: a.targets.minControl, animations: a.animations };
  ok(`[${th}/${sc}] WCAG AA text contrast`, a.contrast.failCount === 0, `${a.contrast.pass}/${a.contrast.checked} ${a.contrast.fails.map(f => f.t + " " + f.ratio).join(", ")}`);
  if (sc === "operator") ok(`[${th}/operator] Mapbox map ready`, d.map === "ready", d.map);
  await shot(`${th}-${sc}-1440`);
}
// ---------- 2. fleet interactions ----------
await load("screen=fleet&theme=ares&sim=0");
await click('[data-model="R2"]'); let f = await J(`{m:__lt.S.model, focus:document.querySelector('#focus').classList.contains('on'), txt:document.querySelector('#focusTxt').textContent, dim:document.querySelectorAll('.mc.dim').length}`);
ok("fleet: clicking R2 focuses it everywhere (header chip, others dim)", f.m === "R2" && f.focus && /R2/.test(f.txt) && f.dim === 4, JSON.stringify(f));
await key("ArrowRight", "ArrowRight", 39); ok("fleet: → moves focus to R3", (await ev("__lt.S.model")) === "R3");
await key("Escape", "Escape", 27); ok("fleet: Esc clears focus", (await ev("__lt.S.model")) === null);
let n0 = await J(`{n:__lt.needsAll().length, ctx:__lt.AGENTS.find(a=>a.id===166).ctx}`);
ok("fleet: two agents need you (166 context, 177 stalled)", n0.n === 2, JSON.stringify(n0));
await click('[data-act="compact"][data-agent="166"]'); let n1 = await J(`{n:__lt.needsAll().length, ctx:__lt.AGENTS.find(a=>a.id===166).ctx, toast:document.querySelector('#toastMsg').textContent, red:document.querySelectorAll('.ctxb.hot').length}`);
ok("fleet: COMPACT clears 166 (context below 90%, alert gone, toast says what changed)", n1.n === 1 && n1.ctx < 200 * .9 && /compacted/.test(n1.toast) && n1.red === 0, JSON.stringify(n1));
await key("z", "KeyZ", 90); ok("fleet: Z undoes the compaction exactly", (await ev("__lt.AGENTS.find(a=>a.id===166).ctx")) === n0.ctx && (await ev("__lt.needsAll().length")) === 2);
await click('[data-act="retry"][data-agent="177"]'); ok("fleet: RETRY restarts the stalled agent", (await ev("__lt.AGENTS.find(a=>a.id===177).status")) === "running"); await key("z", "KeyZ", 90);
await click('[data-agentgo="172"]'); f = await J(`{sc:__lt.S.screen, ag:__lt.S.agent, dev:__lt.S.device, head:document.querySelector('#d-diag .rh .lb').textContent}`);
ok("fleet: agent row opens that agent on DEVICES", f.sc === "devices" && f.ag === 172 && f.dev === "A2" && /172/.test(f.head), JSON.stringify(f));
for (const [k, c, v, s] of [["1", "Digit1", 49, "fleet"], ["2", "Digit2", 50, "mission"], ["4", "Digit4", 52, "devices"]]) { await key(k, c, v); }
ok("keys 1–4 switch screens", (await ev("__lt.S.screen")) === "devices");
// ---------- 3. mission ----------
await load("screen=mission&theme=ares&sim=0");
const F = await J(`__lt.forecast()`); ok("mission: forecast is deterministic and ordered (P10 ≤ P50 ≤ P90)", F.p10 <= F.p50 && F.p50 <= F.p90 && F.n === 2000, JSON.stringify(F));
const F2 = await J(`__lt.forecast()`); ok("mission: forecast repeats exactly", JSON.stringify(F) === JSON.stringify(F2));
await click('#i-due .tg[data-task="4"]'); f = await J(`{t:__lt.S.task, card:document.querySelector('#i-sum .tcard .t18')?.textContent, rings:document.querySelectorAll('.screen.on .sel-ring').length}`);
ok("mission: picking ◇04 in DUE PRESSURE shows its card and rings it in every instrument", f.t === 4 && /banding/.test(f.card) && f.rings >= 2, JSON.stringify(f));
// ---------- 4. operator / map ----------
await load("screen=operator&theme=ares&sim=0");
f = await J(`{st:__lt.mapState, mk:document.querySelectorAll('.mapboxgl-marker').length, attr:!!document.querySelector('.mapboxgl-ctrl-attrib'), logo:!!document.querySelector('.mapboxgl-ctrl-logo')}`);
ok("map: ready with 1 operator + 5 endpoint markers, attribution + logo shown", f.st === "ready" && f.mk === 6 && f.attr && f.logo, JSON.stringify(f));
await click('[data-mview="local"]'); await sleep(1500); f = await J(`{mk:document.querySelectorAll('.mapboxgl-marker').length, z:Math.round(__lt.MAP.getZoom())}`);
ok("map: LOCAL zooms in and adds the 4 device markers", f.mk === 10 && f.z >= 12, JSON.stringify(f)); await shot("ares-operator-local");
await click('[data-mstyle="sat"]'); await sleep(1500); f = await J(`{v:__lt.MAP.getLayoutProperty('sat','visibility'), w:__lt.MAP.getLayoutProperty('water','visibility')}`);
ok("map: TERRAIN shows grayscale imagery, hides vector water", f.v === "visible" && f.w === "none", JSON.stringify(f)); await shot("ares-operator-terrain");
await click('[data-mstyle="vector"]'); await click('[data-mview="global"]'); await sleep(900);
await click('[data-rot="15"]'); await sleep(500); ok("map: R rotates the bearing 15°", Math.round(await ev("__lt.MAP.getBearing()")) === 15); await click('[data-rot="0"]'); await sleep(400);
await click('[data-layer="routes"]'); await sleep(200); ok("map: ROUTES layer toggle removes the route lines", (await ev("__lt.MAP.getSource('routes')._data.features.length")) === 0); await click('[data-layer="routes"]');
await click('#gTheme [data-v="white"]'); await sleep(600); f = await J(`{bg:__lt.MAP.getPaintProperty('bg','background-color'), want:getComputedStyle(document.documentElement).getPropertyValue('--m-land').trim()}`);
ok("map: palette switch restyles the map (background = --m-land)", String(f.bg).toLowerCase() === f.want.toLowerCase(), JSON.stringify(f));
await click('[data-model="R4"]'); await sleep(200); f = await J(`{sel:__lt.MAP.getSource('routes')._data.features.filter(x=>x.properties.sel).map(x=>x.properties.r), dim:document.querySelectorAll('.mapboxgl-marker.dim').length}`);
ok("map: focusing R4 highlights its route and dims the other endpoints", f.sel.join() === "R4" && f.dim === 4, JSON.stringify(f));
// device markers must not overlap each other or the operator marker
await click('[data-mview="local"]'); await sleep(1500);
const mo = await J(`(()=>{const r=[...document.querySelectorAll(".mapboxgl-marker")].map(e=>e.getBoundingClientRect()); let n=0; r.forEach((a,i)=>r.forEach((b,j)=>{ if(j>i&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom) n++; })); return n})()`);
ok("map LOCAL: no marker labels overlap", mo === 0, `overlaps=${mo}`); await click('[data-mview="global"]'); await sleep(900);
// out-of-policy route turns red
await ev(`__lt.MODELS.find(m=>m.r==="R5").region="CN"; __lt.render(); __lt.syncMap()`); await sleep(300);
f = await J(`{bad:__lt.MAP.getSource('routes')._data.features.filter(x=>x.properties.bad).map(x=>x.properties.r), legend:document.querySelector('#mapLegend .lb:last-child').textContent, list:[...document.querySelectorAll('#op-right .cnt .acc')].map(e=>e.textContent)}`);
ok("map: a route outside the data-region policy turns red in map, list and legend", f.bad.join() === "R5" && /OUT OF POLICY/.test(f.legend) && f.list.includes("OUT OF POLICY"), JSON.stringify(f)); await shot("white-operator-policy");
// Mapbox unreachable → honest offline state + flat fallback plot
await send("Network.enable"); await send("Network.setBlockedURLs", { urls: ["*api.mapbox.com*", "*events.mapbox.com*"] });
await load("screen=operator&theme=ares&sim=0");
f = await J(`{st:__lt.mapState, msg:document.querySelector('#mapMsg').textContent, fallback:document.querySelectorAll('#mapOv path[d*="l6 6"]').length, list:document.querySelectorAll('#op-right .cnt').length}`);
ok("map offline: says so, keeps the routes list, draws a flat fallback plot", f.st === "error" && /MAP OFFLINE/.test(f.msg) && f.fallback === 5 && f.list === 5, JSON.stringify(f)); await shot("ares-operator-offline");
await send("Network.setBlockedURLs", { urls: [] });
// ---------- 5. devices ----------
await load("screen=devices&theme=ares&sim=0");
f = await J(`{ag:__lt.S.agent, frame:document.querySelector('#d-schem .dev-scene')?.getAttribute('aria-label')}`); ok("devices: opens on the first agent that needs you, laptop A1 frame", f.ag === 166 && /Laptop A1/.test(f.frame), JSON.stringify(f));
for (const [dv, lab] of [["A2", "Desktop display A2"], ["A3", "Tablet A3"], ["A4", "Phone A4"]]) { await click(`[data-device="${dv}"]`); const g = await J(`{lab:document.querySelector('#d-schem .dev-scene').getAttribute('aria-label'), agDev:__lt.AGENTS.find(a=>a.id===__lt.S.agent).dev}`); ok(`devices: ${dv} shows its frame, and diagnostics follow to an agent on ${dv}`, g.lab === lab && g.agDev === dv, JSON.stringify(g)); await shot(`ares-devices-${dv}`); }
await click('[data-tf="need"]'); f = await J(`{on:document.querySelectorAll('.tile:not(.off)').length}`); ok("devices: NEEDS YOU filter leaves the 2 agents that need you", f.on === 2, JSON.stringify(f));
await click('[data-tf="all"]'); await click('[data-agent="172"]');
await click('[data-act="lvl+"][data-agent="172"]'); ok("devices: + RAISE moves 172 from MED to HIGH", (await ev("__lt.AGENTS.find(a=>a.id===172).lvl")) === 2);
await key("z", "KeyZ", 90); ok("devices: Z restores MED", (await ev("__lt.AGENTS.find(a=>a.id===172).lvl")) === 1);
await click('[data-act="pause"][data-agent="172"]'); ok("devices: PAUSE pauses 172", (await ev("__lt.AGENTS.find(a=>a.id===172).status")) === "paused");
await click('[data-act="resume"][data-agent="172"]'); ok("devices: RESUME resumes 172", (await ev("__lt.AGENTS.find(a=>a.id===172).status")) === "running");
// ---------- 6. widths, legacy theme, reduced motion, sim ----------
for (const [w, h] of [[1920, 1080], [768, 1024], [280, 900]]) for (const sc of SCR) {
  await load(`screen=${sc}&theme=ares&sim=0`, w, h);
  const d = await J(`{sw:document.documentElement.scrollWidth, sh:document.documentElement.scrollHeight}`);
  const ov = await J(svgOverlaps);
  ok(`[${w}/${sc}] no horizontal overflow${w === 1920 ? ", fits height" : ""}, no text collisions`, d.sw <= w && (w !== 1920 || d.sh <= h) && ov.n === 0, JSON.stringify({ ...d, ov: ov.ex }));
  if (w !== 1440) await shot(`ares-${sc}-${w}`);
}
await load("screen=fleet&theme=enochian&sim=0"); ok("legacy ?theme=enochian maps to obsidian", (await ev("document.documentElement.dataset.theme")) === "obsidian");
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await load("screen=mission&theme=ares"); await sleep(4500);
ok("reduced motion: no running animations and the sim stays still", (await ev("document.getAnimations().filter(a=>a.playState==='running').length")) === 0);
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
await load("screen=fleet&theme=ares"); const t0 = await ev("__lt.MODELS[0].tin"); await sleep(4500); ok("sim on: token totals move", (await ev("__lt.MODELS[0].tin")) > t0);
// accent audit: where --red-hi is used on each screen
for (const sc of SCR) { await load(`screen=${sc}&theme=ares&sim=0`);
  const used = await J(`(()=>{const red=getComputedStyle(document.documentElement).getPropertyValue('--red-hi').trim(); const t='rgb('+[1,3,5].map(i=>parseInt(red.substr(i,2),16)).join(', ')+')'; const hits={}; document.querySelectorAll('.screen.on *, header *').forEach(e=>{const cs=getComputedStyle(e); if([cs.color,cs.borderTopColor,cs.backgroundColor,cs.fill,cs.stroke].includes(t)||(e.getAttribute&&/red-hi/.test(e.getAttribute('fill')+e.getAttribute('stroke')))){ const k=(e.textContent||'').trim().slice(0,28)||e.tagName; hits[k]=1; } }); return Object.keys(hits).slice(0,30)})()`);
  R.audit["red-" + sc] = used; console.log(`red-hi on ${sc}:`, used.join(" | ")); }
ok("no console errors or exceptions", logs.length === 0, logs.slice(0, 5).join(" | "));
writeFileSync(`${OUT}/results.json`, JSON.stringify(R, null, 2));
console.log(`\n${R.checks.filter(c => c.pass).length}/${R.checks.length} checks passed`);
ws.close(); process.exit(0);
