#!/usr/bin/env node
/**
 * The polish pass's eyes — a thin CDP capture tool. Scrolls the real page to
 * named targets (acts, or fractional progress through the pinned sweep) and
 * writes PNGs under verify/shots/spectacle/, plus a one-line state readout
 * (window slot/chrome) so geometry claims can be checked alongside pixels.
 *
 *   node scripts/capture.mjs gap@0.1 gap@0.5 gap@0.95 agent themes
 *   node scripts/capture.mjs --vp film --prefix film hero gap@0.5
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = Number(process.env.CAPTURE_PORT ?? 9341);
const ROOT = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const get = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : fallback;
};
const VPS = {
  desktop: { width: 1440, height: 900, film: false },
  film: { width: 390, height: 844, film: true },
  "film-414": { width: 414, height: 896, film: true },
};
const vpName = get("--vp", "desktop");
const vp = VPS[vpName] ?? VPS.desktop;
const prefix = get("--prefix", vpName);
const targets = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));

const OUT_DIR = join(ROOT, "../verify/shots/spectacle");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ensureChrome() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return;
    } catch {}
    if (i === 0) {
      spawn(CHROME, [`--remote-debugging-port=${PORT}`, "--headless=new", "--disable-gpu",
        "--hide-scrollbars", "--no-first-run", "--user-data-dir=/tmp/dr-chrome-capture",
        "--force-device-scale-factor=1", "about:blank"], { detached: true, stdio: "ignore" }).unref();
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("chrome did not start");
}

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pending.has(m.id)) {
        const { res, rej } = this.pending.get(m.id); this.pending.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error("timeout " + method)); } }, 30000);
    });
  }
  async evaluate(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + JSON.stringify(r.exceptionDetails.exception?.description ?? ""));
    return r.result?.value;
  }
}

await ensureChrome();
const { WebSocket } = await import("node:ws").catch(() => ({ WebSocket: globalThis.WebSocket }));
// Own target: create a fresh tab instead of racing whatever page happens to
// be first in /json (ad-hoc sessions leave busy pages behind).
const created = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" }).then((r) => r.json());
const ws = new WebSocket(created.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.addEventListener("open", r); ws.addEventListener("error", j); });
const cdp = new CDP(ws);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await mkdir(OUT_DIR, { recursive: true });

await cdp.send("Emulation.setDeviceMetricsOverride", { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: false });
await cdp.send("Page.navigate", { url: `http://localhost:4321/${vp.film ? "?film" : ""}` });
await sleep(2600);
await cdp.evaluate(`(() => { try { localStorage.setItem('downright-theme','warm-dark'); localStorage.removeItem('downright-motion'); sessionStorage.clear(); } catch{} return true; })()`);
await cdp.send("Page.reload", { ignoreCache: true });
await sleep(2800);

const geometry = JSON.parse(await cdp.evaluate(`(() => {
  const tops = {}; const heights = {};
  for (const s of document.querySelectorAll('section[id]')) { tops[s.id] = s.offsetTop; heights[s.id] = s.offsetHeight; }
  const stage = document.querySelector('[data-sweep-stage]');
  return JSON.stringify({ tops, heights, stageH: stage ? stage.offsetHeight : 0, vh: innerHeight });
})()`));

for (const target of targets) {
  const m = target.match(/^([a-z0-9-]+)(?:@([\d.]+))?$/);
  if (!m) continue;
  const [, id, fracRaw] = m;
  const frac = fracRaw ? Number(fracRaw) : 0;
  let y;
  if (id === "gap" && fracRaw !== undefined) {
    y = geometry.tops.gap + frac * Math.max(1, geometry.stageH - geometry.vh);
  } else if (fracRaw !== undefined && geometry.tops[id] !== undefined) {
    y = geometry.tops[id] + frac * Math.max(1, geometry.heights[id] - geometry.vh);
  } else if (geometry.tops[id] !== undefined) {
    y = Math.max(0, geometry.tops[id] - Math.round(geometry.vh * 0.12));
  } else {
    y = Number(id) || 0;
  }
  await cdp.evaluate(`window.scrollTo(0, ${Math.round(y)})`);
  await sleep(700);
  const state = await cdp.evaluate(`(() => {
    const w = document.querySelector('.app-window');
    const sweepStage = document.querySelector('[data-sweep]');
    return JSON.stringify({
      y: scrollY,
      slot: w ? (w.dataset.slot ?? null) : "none",
      chrome: w ? (w.dataset.chrome ?? null) : null,
      view: w ? w.dataset.view : null,
      sweepProgress: sweepStage ? getComputedStyle(sweepStage).getPropertyValue('--sweep-progress').trim() : null,
      blocks: document.querySelectorAll('.sweep-block').length,
    });
  })()`);
  const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
  const file = join(OUT_DIR, `${prefix}-${target}.png`);
  await writeFile(file, Buffer.from(shot.data, "base64"));
  console.log(`${target.padEnd(14)} ${state}  → ${file}`);
}
await fetch(`http://127.0.0.1:${PORT}/json/close/${created.id}`).catch(() => {});
console.log("done");
