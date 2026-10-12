// Injected into the page by v2-audit.mjs. Returns a JSON string of measurements. No dependencies.
(sel => {
  const out = {};
  const vis = e => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden";
  const scale = e => { try { if (e instanceof SVGElement) { const m = e.getScreenCTM(); return m ? Math.hypot(m.a, m.b) : 1; } } catch {} return 1; };
  const rgb = c => { const m = (c || "").match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const bgOf = e => { const stack = []; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; } } let b = { r: 0, g: 0, b: 0, a: 1 }; const bb = rgb(getComputedStyle(document.body).backgroundColor); if (bb) b = bb; for (const c of stack.reverse()) b = over(c, b); return b; };
  const opac = e => { let o = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; };

  // text nodes → type ramp, weights, contrast
  const texts = [...document.querySelectorAll("body *")].filter(e => !["SCRIPT", "STYLE", "TITLE"].includes(e.tagName) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && vis(e));
  const sizes = {}, weights = {}, fails = [], tot = { n: 0, pass: 0, dimmed: 0 };
  for (const e of texts) {
    const cs = getComputedStyle(e), px = parseFloat(cs.fontSize) * scale(e), k = px.toFixed(1);
    sizes[k] = (sizes[k] || 0) + 1; weights[cs.fontWeight] = (weights[cs.fontWeight] || 0) + 1;
    if (opac(e) < .9) { tot.dimmed++; continue; }
    const fg0 = rgb(e instanceof SVGElement ? cs.fill : cs.color); if (!fg0) continue;
    const bg = bgOf(e), fg = over(fg0, bg), L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const large = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight) >= 600), need = large ? 3 : 4.5; tot.n++;
    if (ratio >= need) tot.pass++; else fails.push({ t: e.textContent.trim().slice(0, 24), ratio: +ratio.toFixed(2), need, px: +px.toFixed(1), tag: e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : "") });
  }
  out.type = { sizes, weights, textNodes: texts.length };
  out.contrast = { checked: tot.n, pass: tot.pass, dimmedSkipped: tot.dimmed, fails: fails.slice(0, 12), failCount: fails.length };

  // spacing: padding / margin / gap on HTML elements
  const sp = {}, props = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginRight", "marginBottom", "marginLeft", "rowGap", "columnGap"];
  for (const e of document.querySelectorAll("body, body *")) { if (e instanceof SVGElement || !vis(e)) continue; const cs = getComputedStyle(e); for (const p of props) { const v = parseFloat(cs[p]); if (v > 0 && isFinite(v)) { const k = Math.round(v * 10) / 10; sp[k] = (sp[k] || 0) + 1; } } }
  const tot2 = Object.values(sp).reduce((a, b) => a + b, 0), m8 = Object.entries(sp).filter(([k]) => +k % 8 === 0).reduce((a, [, v]) => a + v, 0), m4 = Object.entries(sp).filter(([k]) => +k % 4 === 0).reduce((a, [, v]) => a + v, 0);
  out.spacing = { distinct: Object.keys(sp).length, values: sp, pctMultiple8: +(100 * m8 / tot2).toFixed(1), pctMultiple4: +(100 * m4 / tot2).toFixed(1), n: tot2 };

  // tap targets
  const tg = [...document.querySelectorAll("button, [role=option], a[href]")].filter(vis).map(e => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, min: Math.min(r.width, r.height) }; });
  const hits = [...document.querySelectorAll(".mk .hit")].map(e => { const r = e.getBoundingClientRect(); return { min: Math.min(r.width, r.height) }; });
  out.targets = { controls: tg.length, below24: tg.filter(t => t.min < 24).length, below32: tg.filter(t => t.min < 32).length, minControl: +Math.min(...tg.map(t => t.min)).toFixed(1), contacts: hits.length, contactHit: hits.length ? +Math.min(...hits.map(h => h.min)).toFixed(1) : null,
    tiles: [...document.querySelectorAll(".tl")].length, tileSize: (() => { const t = document.querySelector(".tl"); return t ? +t.getBoundingClientRect().width.toFixed(1) : null; })() };

  // matrix collisions
  if (sel.tag) {
    const tags = [...document.querySelectorAll(sel.tag)].filter(vis).map(e => ({ e, r: e.getBoundingClientRect() })), shapes = [...document.querySelectorAll(sel.shape)].filter(vis).map(e => e.getBoundingClientRect());
    const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    let tt = 0, tg2 = 0; tags.forEach((a, i) => { tags.forEach((b, j) => { if (j > i && hit(a.r, b.r)) tt++; }); shapes.forEach(s => { const c = { left: s.left + 3, right: s.right - 3, top: s.top + 3, bottom: s.bottom - 3 }; if (hit(a.r, c) && !(Math.abs((a.r.left + a.r.right) / 2 - (c.left + c.right) / 2) < 1)) { /* own glyph is adjacent, not overlapping */ tg2++; } }); });
    const cs = shapes.map(s => [(s.left + s.right) / 2, (s.top + s.bottom) / 2]); let md = 1e9; cs.forEach((a, i) => cs.forEach((b, j) => { if (j > i) md = Math.min(md, Math.hypot(a[0] - b[0], a[1] - b[1])); }));
    out.matrix = { tags: tags.length, tagTagOverlaps: tt, tagGlyphOverlaps: tg2, minGlyphDistance: +md.toFixed(1) };
    const host = document.querySelector(sel.host); if (host) { const hr = host.getBoundingClientRect(); out.matrix.host = [Math.round(hr.width), Math.round(hr.height)]; if (sel.data) { const d = document.querySelector(sel.data); if (d) { const dr = d.getBoundingClientRect(); out.matrix.dataBox = [Math.round(dr.width), Math.round(dr.height)]; out.matrix.dataAreaPct = +(100 * dr.width * dr.height / (hr.width * hr.height)).toFixed(1); } } }
  }
  out.truncated = [...document.querySelectorAll(".nm")].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent);
  out.doc = { sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight };
  out.animations = document.getAnimations().filter(a => a.playState === "running").length;
  return JSON.stringify(out);
})
