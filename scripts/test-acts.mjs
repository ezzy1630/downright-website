#!/usr/bin/env node
// Drives the dirty-buffer agent conflict end to end over CDP (§18.4).
import { spawn } from "node:child_process";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9334;

async function ensureChrome() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return;
    } catch {}
    if (i === 0) {
      spawn(CHROME, [`--remote-debugging-port=${PORT}`, "--headless=new", "--disable-gpu",
        "--hide-scrollbars", "--no-first-run", "--user-data-dir=/tmp/dr-chrome-verify",
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
const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const cdp = new CDP(ws);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "  ok  " : "FAIL  "}${name}${detail ? "  — " + detail : ""}`);
};

async function freshLoad() {
  // sessionStorage is per-tab and survives Storage.clearDataForOrigin, so it
  // has to be cleared from inside the page before the run that depends on the
  // agent being unarmed. (The visit firing only once per session is the
  // product behaving correctly — §8.5.)
  await cdp.send("Page.navigate", { url: "http://localhost:4321/" });
  await sleep(900);
  await cdp.evaluate(`(() => { try { sessionStorage.clear(); localStorage.clear(); } catch {} return true; })()`);
  await cdp.send("Page.reload", { ignoreCache: true });
  await sleep(2400);
}

async function typeInHero(text) {
  await cdp.evaluate(`(() => {
    const win = document.querySelector('[data-editor-window]');
    const src = win.querySelector('[data-document-source]');
    const r = src.getBoundingClientRect();
    src.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true,cancelable:true,composed:true,pointerId:1,pointerType:'mouse',isPrimary:true,clientX:r.left+40,clientY:r.top+60,buttons:1}));
    return true;
  })()`);
  await sleep(1800);
  await cdp.evaluate(`document.querySelector('.cm-content')?.focus(), true`);
  await sleep(200);
  await cdp.send("Input.insertText", { text });
  await sleep(500);
}

async function scrollToAgent() {
  await cdp.evaluate(`(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const agent = document.getElementById('agent');
    const absTop = agent.getBoundingClientRect().top + window.scrollY;
    for (let y = window.scrollY; y <= absTop + 200; y += 400) { window.scrollTo(0, y); await sleep(40); }
    window.scrollTo(0, absTop + 200);
    return true;
  })()`);
  await sleep(4500);
}

// ── 1. Dirty buffer → conflict bar ───────────────────────────────────────
console.log("\n§18.4 dirty branch");
await freshLoad();
await typeInHero("MY OWN WORDS ");
const mounted = await cdp.evaluate(`!!document.querySelector('.cm-editor')`);
check("editor mounts on pointerdown in the source pane", mounted === true);
const dirty = await cdp.evaluate(`document.querySelector('[data-dirty-label]')?.hidden === false`);
check("titlebar shows — Edited once the buffer is dirty", dirty === true);
const mineText = await cdp.evaluate(`document.querySelector('.cm-content').textContent.slice(0, 40)`);
check("typed text landed in the source pane", String(mineText).includes("MY OWN WORDS"), String(mineText));

await scrollToAgent();
const state = await cdp.evaluate(`(() => {
  const bar = document.querySelector('[data-conflict-bar]');
  return JSON.stringify({
    slot: document.querySelector('[data-window]')?.dataset.slot,
    hidden: bar?.hidden, open: bar?.classList.contains('is-open'),
    marks: document.querySelectorAll('.change-mark').length,
    session: Object.keys(sessionStorage),
    err: document.documentElement.dataset.error || null,
  });
})()`);
const parsed = JSON.parse(state);
check("window travelled to the agent slot", parsed.slot === "agent", "slot=" + parsed.slot);
check("agent visit armed once per session", parsed.session.includes("downright-agent-visited"));
check("conflict bar opens on a dirty buffer", parsed.hidden === false && parsed.open === true, JSON.stringify(parsed));
check("word-level change marks rendered", parsed.marks > 0, "marks=" + parsed.marks);
check("no uncaught errors", parsed.err === null, String(parsed.err));

// ── 2. Keep Mine round-trips exactly ─────────────────────────────────────
const keepMine = await cdp.evaluate(`(async () => {
  const before = document.querySelector('[data-conflict-bar]');
  const mineBefore = window.__mineSnapshot;
  document.querySelector('[data-conflict-action="mine"]').click();
  await new Promise(r => setTimeout(r, 900));
  const read = document.querySelector('[data-document-read]').textContent;
  return JSON.stringify({
    hasMine: read.includes('MY OWN WORDS'),
    hasAgentNote: read.includes('Agents rewrite faster than anyone reads'),
    hasAgentRewrite: read.includes('rendered surface remains native'),
    barHidden: document.querySelector('[data-conflict-bar]').hidden,
  });
})()`);
const km = JSON.parse(keepMine);
check("Keep Mine restores the reader's own words", km.hasMine === true, JSON.stringify(km));
check("Keep Mine discards the agent's addition", km.hasAgentNote === false);
check("Keep Mine discards the agent's rewrite", km.hasAgentRewrite === false);
check("conflict bar closes after resolution", km.barHidden === true);

// ── 3. Take Theirs applies the agent's text ──────────────────────────────
console.log("\n§18.4 Take Theirs");
await freshLoad();
await typeInHero("MY OWN WORDS ");
await scrollToAgent();
const takeTheirs = await cdp.evaluate(`(async () => {
  const bar = document.querySelector('[data-conflict-bar]');
  if (bar.hidden) return JSON.stringify({ error: 'conflict bar not open' });
  document.querySelector('[data-conflict-action="theirs"]').click();
  await new Promise(r => setTimeout(r, 900));
  const read = document.querySelector('[data-document-read]').textContent;
  return JSON.stringify({
    hasMine: read.includes('MY OWN WORDS'),
    hasAgentNote: read.includes('Agents rewrite faster than anyone reads'),
    hasAgentRewrite: read.includes('rendered surface remains native'),
    barHidden: bar.hidden,
  });
})()`);
const tt = JSON.parse(takeTheirs);
check("Take Theirs applies the agent's addition", tt.hasAgentNote === true, JSON.stringify(tt));
check("Take Theirs applies the agent's rewrite", tt.hasAgentRewrite === true);
// The agent edits phrases inside the reader's file rather than replacing it,
// so the reader's own sentence survives Take Theirs. That is the honest
// behaviour — an external write is a rewrite, not a wholesale swap.
check("Take Theirs preserves the untouched parts of the reader's file", tt.hasMine === true);

// ── 4. Theme spill actually re-inks the page ─────────────────────────────
console.log("\n§18.6 theme spill");
await freshLoad();
const spill = await cdp.evaluate(`(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const themes = document.getElementById('themes');
  window.scrollTo(0, themes.getBoundingClientRect().top + window.scrollY + 100);
  await sleep(700);
  const read = () => getComputedStyle(document.body).backgroundColor;
  const before = read();
  const card = document.querySelector('[data-theme-option="nord"]');
  const r = card.getBoundingClientRect();
  card.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, clientX:r.left+10, clientY:r.top+10}));
  const frames = [];
  for (let i = 0; i < 24; i++) { frames.push(read()); await sleep(30); }
  await sleep(600);
  return JSON.stringify({
    before, after: read(), root: document.documentElement.dataset.theme,
    distinct: [...new Set(frames)].length,
    persisted: localStorage.getItem('downright-theme'),
  });
})()`);
const sp = JSON.parse(spill);
check("clicking a theme card re-inks the page", sp.before !== sp.after, `${sp.before} -> ${sp.after}`);
check("the switch lands on the chosen theme", sp.root === "nord", "root=" + sp.root);
check("the spill animates (not an instant swap)", sp.distinct > 2, "distinct frames=" + sp.distinct);
check("the choice persists", sp.persisted === "nord", String(sp.persisted));

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
ws.close();
process.exit(failed.length ? 1 : 0);
