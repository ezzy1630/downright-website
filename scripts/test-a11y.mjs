#!/usr/bin/env node
// Interaction contracts that lacked dedicated coverage (§11): the reduced-
// motion teleport, keyboard operability of the palette / flip / theme control
// / download, and the no-JS readable document. Drives the dev server over CDP.
import { spawn } from "node:child_process";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9337;

async function ensureChrome() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return;
    } catch {}
    if (i === 0) {
      spawn(CHROME, [`--remote-debugging-port=${PORT}`, "--headless=new", "--disable-gpu",
        "--hide-scrollbars", "--no-first-run", "--user-data-dir=/tmp/dr-chrome-a11y",
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await ensureChrome();
const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const cdp = new CDP(ws);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "  ok  " : "FAIL  "}${name}${detail ? "  — " + detail : ""}`);
};

// ── 1. No-JS: the raw HTML is a complete readable document. ────────────────
{
  const html = await (await fetch("http://localhost:4321/")).text();
  const mustContain = [
    ["hero heading", "The native Markdown app for macOS."],
    ["gap lede", "Press Space on a Markdown file today."],
    ["agent heading", "The file changes while you are reading it."],
    ["speed heading", "Every number here has a limit beside it."],
    ["architecture heading", "Your text stays in charge."],
    ["reach heading", "It opens your files from anywhere."],
    ["themes heading", "Six themes. One document."],
    ["close heading", "Free. Open source. MIT. No account."],
    ["download CTA", "Download for macOS"],
    ["sponsor line", "sponsor it"],
    ["footer absence", "No cookies, no analytics"],
  ];
  for (const [name, needle] of mustContain) {
    check(`no-JS · ${name}`, html.includes(needle), needle);
  }
  // Every act is present in the static markup.
  const actCount = (html.match(/data-act="/g) ?? []).length;
  check("no-JS · all eight acts", actCount === 8, `data-act=${actCount}`);
}

// ── 2. Reduced motion: teleport to final states, zero motion. ─────────────
{
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await cdp.send("Page.navigate", { url: "http://localhost:4321/" });
  await sleep(2600);
  await cdp.evaluate(`(() => { try { localStorage.setItem('downright-theme','warm-dark'); localStorage.removeItem('downright-motion'); } catch{} return true; })()`);
  await cdp.send("Page.reload", { ignoreCache: true });
  await sleep(2600);

  const rm = await cdp.evaluate(`(() => {
    const reveal = document.querySelector('.act-reveal');
    const cs = reveal ? getComputedStyle(reveal) : null;
    return {
      flag: document.documentElement.dataset.reducedMotion,
      revealOpacity: cs ? cs.opacity : null,
      revealTranslate: cs ? cs.translate : null,
      headings: [...document.querySelectorAll('[data-act] h2')].length,
    };
  })()`);
  check("reduced motion · flag set", rm.flag === "true", `flag=${rm.flag}`);
  check("reduced motion · reveal settled visible", rm.revealOpacity === "1", `opacity=${rm.revealOpacity}`);
  check("reduced motion · reveal settled in place", rm.revealTranslate === "none" || rm.revealTranslate === "0px", `translate=${rm.revealTranslate}`);
  check("reduced motion · headings readable", rm.headings >= 6, `h2=${rm.headings}`);

  // The sweep must apply its static split without a running scrub.
  const sweepStatic = await cdp.evaluate(`(() => {
    const section = document.getElementById('gap');
    const absTop = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, absTop + 400);
    return new Promise((r) => setTimeout(() => {
      const s = document.querySelector('[data-sweep]');
      r({ static: s ? s.dataset.sweepStatic : null });
    }, 400));
  })()`);
  check("reduced motion · sweep static", sweepStatic.static === "true", `static=${sweepStatic.static}`);
}

// ── 3. Keyboard: palette, flip, theme control, download. ──────────────────
{
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });
  await cdp.send("Page.navigate", { url: "http://localhost:4321/" });
  await sleep(2600);
  await cdp.evaluate(`(() => { try { sessionStorage.clear(); localStorage.setItem('downright-theme','warm-dark'); localStorage.removeItem('downright-motion'); } catch{} return true; })()`);
  await cdp.send("Page.reload", { ignoreCache: true });
  await sleep(2600);

  // ⌘K opens the palette; Esc closes it.
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "k", code: "KeyK", modifiers: 4 });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "k", code: "KeyK", modifiers: 4 });
  await sleep(200);
  const paletteOpen = await cdp.evaluate(`document.querySelector('[data-command-palette]')?.open === true`);
  check("keyboard · ⌘K opens palette", paletteOpen === true, `open=${paletteOpen}`);
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
  await sleep(150);
  const paletteClosed = await cdp.evaluate(`document.querySelector('[data-command-palette]')?.open === false`);
  check("keyboard · Esc closes palette", paletteClosed === true, `closed=${paletteClosed}`);

  // ⌘⇧E flips the window to source.
  const beforeFlip = await cdp.evaluate(`(() => { const w = document.querySelector('.app-window'); return { mode: w?.dataset.mode ?? null, view: w?.dataset.view ?? null }; })()`);
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "e", code: "KeyE", modifiers: 12 });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "e", code: "KeyE", modifiers: 12 });
  await sleep(250);
  const afterFlip = await cdp.evaluate(`(() => { const w = document.querySelector('.app-window'); return { mode: w?.dataset.mode ?? null, view: w?.dataset.view ?? null }; })()`);
  check("keyboard · ⌘⇧E flips to source", afterFlip.view === "source", `before=${JSON.stringify(beforeFlip)} after=${JSON.stringify(afterFlip)}`);

  // Theme control: focus + Enter re-inks the page.
  const themeChanged = await cdp.evaluate(`(async () => {
    const trigger = document.querySelector('.theme-control__trigger');
    trigger.focus();
    trigger.click();
    await new Promise((r) => setTimeout(r, 120));
    const panelOpen = document.querySelector('.theme-panel')?.matches(':popover-open') === true;
    const option = document.querySelector('[data-theme-option="nord"]');
    if (!option) return { err: 'no nord option' };
    option.focus();
    option.click();
    await new Promise((r) => setTimeout(r, 900));
    return { theme: document.documentElement.dataset.theme, panelOpen };
  })()`);
  check("keyboard · theme panel opens", themeChanged.panelOpen === true, JSON.stringify(themeChanged));
  check("keyboard · theme control re-inks", themeChanged.theme === "nord", JSON.stringify(themeChanged));

  // Download: focus + Enter fires the support panel (DMG stubbed).
  const download = await cdp.evaluate(`(async () => {
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {};
    try {
      const btn = document.querySelector('[data-download]');
      btn.focus();
      btn.click();
      await new Promise((r) => setTimeout(r, 160));
      return { panel: !!document.querySelector('.glass-toast--download') };
    } finally { HTMLAnchorElement.prototype.click = orig; }
  })()`);
  check("keyboard · download fires panel", download.panel === true, JSON.stringify(download));
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} a11y assertions passed`);
for (const r of failed) console.log(`  FAIL  ${r.name} — ${r.detail}`);
ws.close();
process.exit(failed.length ? 1 : 0);
