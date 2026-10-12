// lt-shot.mjs — quick CDP screenshots. node lt-shot.mjs <outDir> <file.html> <w>x<h> <query> [<query> ...]
import { writeFileSync, mkdirSync } from "node:fs";
const [OUT, FILE, WH, ...QS] = process.argv.slice(2); mkdirSync(OUT, { recursive: true });
const [W, H] = WH.split("x").map(Number);
const targets = await (await fetch("http://127.0.0.1:9444/json/list")).json();
const ws = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl);
let id = 0; const pending = new Map(), logs = [];
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method === "Runtime.exceptionThrown") logs.push("EXC " + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
  if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) logs.push(d.params.type + " " + d.params.args.map(a => a.value ?? a.description).join(" ")); };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ev = async e => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result?.result?.value;
await send("Runtime.enable"); await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
for (const q of QS) {
  await send("Page.navigate", { url: "file://" + FILE + "?" + q });
  for (let i = 0; i < 80; i++) { await sleep(250); if (await ev("!!window.__lt")) break; }
  if (q.includes("screen=operator")) { for (let i = 0; i < 80; i++) { await sleep(250); const s = await ev("window.__lt && __lt.mapState"); if (s === "ready" || s === "error") break; } await sleep(2500); }
  else await sleep(700);
  const info = await ev(`JSON.stringify({sw:document.documentElement.scrollWidth, sh:document.documentElement.scrollHeight, map:window.__lt&&__lt.mapState})`);
  const r = await send("Page.captureScreenshot", { format: "png" });
  const name = q.replace(/[&=]/g, "_").replace(/[^\w.-]/g, "") || "default";
  writeFileSync(`${OUT}/${name}-${W}.png`, Buffer.from(r.result.data, "base64"));
  console.log(name, info);
}
console.log(logs.length ? logs.join("\n") : "no console errors");
ws.close(); process.exit(0);
