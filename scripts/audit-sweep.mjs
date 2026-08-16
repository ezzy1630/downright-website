#!/usr/bin/env node
/**
 * The invariant sweep (§10) — the site's eyes. Drives headless Chrome over
 * CDP against the dev server, steps every 100px down the page at each
 * viewport, and asserts the choreography laws A–H as *geometry*, never as
 * "does the CSS look right".
 *
 *   node scripts/audit-sweep.mjs              # desktop 1440×900 + film 390×844 + 414×896
 *   node scripts/audit-sweep.mjs --quick      # skip screenshots
 *   node scripts/audit-sweep.mjs --phase before
 *
 * Emits verify/report.json + a human summary + screenshots under
 * verify/shots/<phase>/. Exits nonzero on any failed invariant.
 */

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = Number(process.env.SWEEP_PORT ?? 9336);
const ROOT = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const QUICK = args.includes("--quick");
let ONLY = null;
const onlyIdx = args.indexOf("--only");
if (onlyIdx >= 0) ONLY = args[onlyIdx + 1];
const phaseIdx = args.indexOf("--phase");
const PHASE = phaseIdx >= 0 ? args[phaseIdx + 1] : (process.env.SWEEP_PHASE ?? "current");

const ALL_VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, film: false },
  { name: "film", width: 390, height: 844, film: true },
  { name: "film-414", width: 414, height: 896, film: true },
];
const VIEWPORTS = ALL_VIEWPORTS.filter((vp) => !ONLY || ONLY === `${vp.width}x${vp.height}`);

async function ensureChrome() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return;
    } catch {}
    if (i === 0) {
      spawn(CHROME, [`--remote-debugging-port=${PORT}`, "--headless=new", "--disable-gpu",
        "--hide-scrollbars", "--no-first-run", "--user-data-dir=/tmp/dr-chrome-sweep",
        "--force-device-scale-factor=1", "about:blank"], { detached: true, stdio: "ignore" }).unref();
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("chrome did not start");
}

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    this.events = { requests: [], responses: [], failures: [], console: [], exceptions: [], log: [] };
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pending.has(m.id)) {
        const { res, rej } = this.pending.get(m.id); this.pending.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
      } else if (m.method) {
        if (m.method === "Network.requestWillBeSent") this.events.requests.push(m.params.request.url);
        else if (m.method === "Network.responseReceived") this.events.responses.push({ url: m.params.response.url, status: m.params.response.status });
        else if (m.method === "Network.loadingFailed") this.events.failures.push({ url: m.params.request?.url ?? m.params.blockedReason, error: m.params.errorText });
        else if (m.method === "Runtime.consoleAPICalled") this.events.console.push({ type: m.params.type, args: (m.params.args || []).map((a) => a.value ?? a.description ?? "") });
        else if (m.method === "Runtime.exceptionThrown") this.events.exceptions.push(m.params.exceptionDetails?.text ?? "exception");
        else if (m.method === "Log.entryAdded") this.events.log.push({ level: m.params.entry?.level, text: m.params.entry?.text });
      }
    });
  }
  resetEvents() {
    this.events = { requests: [], responses: [], failures: [], console: [], exceptions: [], log: [] };
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

/* ── The in-page collector ──────────────────────────────────────────────
   Returns a JSON snapshot of geometry at the current scroll position. Acts
   come from [data-act] (fallback: [data-rail-section]); chrome (header,
   footer, rail, toasts, dialogs) is excluded from act text so it cannot
   pollute the double-exposure count. */
const COLLECT = String.raw`(() => {
  const vw = innerWidth, vh = innerHeight;
  const visible = (r) => r && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw && r.width > 0.6 && r.height > 0.6;
  const effOpacity = (el) => {
    let op = 1; let e = el;
    while (e && e !== document.documentElement) {
      const o = parseFloat(getComputedStyle(e).opacity);
      if (!Number.isNaN(o)) { op *= o; if (op <= 0.001) break; }
      e = e.parentElement;
    }
    return op;
  };
  const cropOk = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      if (e.dataset && e.dataset.cropOk !== undefined) return true;
    }
    return false;
  };
  const actEls = [...document.querySelectorAll('[data-act]')];
  const actList = actEls.length ? actEls : [...document.querySelectorAll('[data-rail-section]')];
  const actOf = (el) => {
    const host = el.closest('[data-act]') || el.closest('[data-rail-section]');
    return host ? (host.dataset.act || host.id) : 'none';
  };

  // Intersect a rect with every overflow-clipping ancestor, so text inside a
  // scrollable window is only counted where it is actually painted.
  // Returns {left, top, right, bottom, width, height} or null if fully clipped.
  const clipToAncestors = (rect, el) => {
    const l = rect.left ?? rect.x, t = rect.top ?? rect.y;
    const rgt = rect.right ?? rect.x + rect.width, btm = rect.bottom ?? rect.y + rect.height;
    let r = { left: l, top: t, right: rgt, bottom: btm, width: rect.width, height: rect.height };
    for (let e = el.parentElement; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      const oy = cs.overflowY, ox = cs.overflowX;
      const clips = (v) => v === 'hidden' || v === 'scroll' || v === 'auto' || v === 'clip';
      if (!clips(oy) && !clips(ox)) continue;
      const b = e.getBoundingClientRect();
      const x0 = Math.max(r.left, b.left), x1 = Math.min(r.right, b.right);
      const y0 = Math.max(r.top, b.top), y1 = Math.min(r.bottom, b.bottom);
      r = { left: x0, top: y0, right: x1, bottom: y1, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0) };
      if (r.width <= 0.6 || r.height <= 0.6) return null;
    }
    return r;
  };

  const textRects = [];
  const blockIds = new WeakMap();
  let nextBlockId = 0;
  const blockOwner = (el) => {
    const owner = el.closest('h1,h2,h3,h4,h5,h6,p,li,td,th,pre,figcaption');
    if (!owner) return 0;
    if (!blockIds.has(owner)) blockIds.set(owner, ++nextBlockId);
    return blockIds.get(owner);
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  const CHROME_SEL = '[data-site-header], .site-footer, [data-density-rail], .toast-host, dialog, .drop-veil, [data-release-status], .command-palette, .shortcut-sheet, .review-panel, .quick-look';
  while ((node = walker.nextNode())) {
    const t = node.textContent;
    if (!t || !t.trim()) continue;
    const el = node.parentElement;
    if (!el) continue;
    if (el.closest('script,style,noscript,svg,canvas,' + CHROME_SEL)) continue;
    const actOwner = el.closest('[data-act]');
    if (actOwner && getComputedStyle(actOwner).visibility === 'hidden') continue;
    if (typeof el.checkVisibility === 'function' && !el.checkVisibility()) continue;
    const op = effOpacity(el);
    if (op <= 0.15) continue;
    const act = actOf(el);
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    for (const raw of rects) {
      const r = clipToAncestors(raw, el);
      if (!r || !visible(r)) continue;
      const cropped = r.top < 1 || r.bottom > vh - 1 || r.left < 1 || r.right > vw - 1;
      textRects.push({
        act, x: +r.left.toFixed(1), y: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1),
        op: +op.toFixed(2), cropped, cropOk: cropOk(el), t: t.trim().slice(0, 44),
        bridge: !!el.closest('.app-window'), owner: blockOwner(el),
      });
    }
  }

  const fingerprintSel = '[data-fingerprint], .app-window, .sweep__window, .benchmark-table, .file-surface, .terminal-artifact, .theme-showroom__list, .gap-wall__scroller, .film-scrub, .film-zoom, .film-spill';
  const components = [];
  for (const el of document.querySelectorAll(fingerprintSel)) {
    const actOwner = el.closest('[data-act]');
    if (actOwner && getComputedStyle(actOwner).visibility === 'hidden') continue;
    if (typeof el.checkVisibility === 'function' && !el.checkVisibility()) continue;
    const r = el.getBoundingClientRect();
    if (!visible(r)) continue;
    // The travelling window is one node; its composition is its SLOT. Two
    // acts may not repeat a composition, so hero/split and agent/document and
    // theme/document must fingerprint differently even though they are the
    // same .app-window element re-parented between acts.
    const fp = el.dataset.fingerprint || (el.matches('.app-window') ? 'app-window@' + (el.dataset.slot || el.dataset.view || '?') : el.className.split(' ')[0]);
    components.push({ fp, x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) });
  }

  // Union content area on a coarse grid.
  const grid = 14;
  const cells = new Set();
  const paint = (x, y, w, h) => {
    const x0 = Math.max(0, Math.floor(x / grid)), x1 = Math.min(Math.ceil(vw / grid), Math.ceil((x + w) / grid));
    const y0 = Math.max(0, Math.floor(y / grid)), y1 = Math.min(Math.ceil(vh / grid), Math.ceil((y + h) / grid));
    for (let gx = x0; gx < x1; gx++) for (let gy = y0; gy < y1; gy++) cells.add(gx + ',' + gy);
  };
  for (const r of textRects) paint(r.x, r.y, r.w, r.h);
  for (const c of components) paint(c.x, c.y, c.w, c.h);
  const contentArea = cells.size * grid * grid;

  // F counts the HEADER wordmark only (the footer brand is legitimate chrome).
  const wordmarks = [...document.querySelectorAll('[data-site-header] .brand-wordmark')].map((el) => {
    const r = el.getBoundingClientRect();
    return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), vis: visible(r), op: +effOpacity(el).toFixed(2) };
  });

  const header = document.querySelector('[data-site-header]');
  const headerChildren = header ? [...header.querySelectorAll('.brand-wordmark, .site-nav a, .palette-trigger, .theme-control, .header-download')].map((el) => {
    const r = el.getBoundingClientRect();
    return { cls: el.className.split(' ')[0], x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), vis: visible(r) };
  }) : [];

  return JSON.stringify({
    y: Math.round(scrollY), vw, vh, docH: document.documentElement.scrollHeight,
    acts: actList.map((el) => el.dataset.act || el.id),
    sectionTops: Object.fromEntries(actList.map((el) => [el.dataset.act || el.id, Math.round(el.getBoundingClientRect().top + scrollY)])),
    bands: Object.fromEntries(actList.map((el) => [el.dataset.act || el.id, parseFloat(el.dataset.band || "0.3")])),
    textRects, components, contentArea, wordmarks, headerChildren,
    windows: document.querySelectorAll('.app-window').length,
    restAnchors: [...document.querySelectorAll('[data-rest]')].map((el) => {
      const r = el.getBoundingClientRect();
      return { id: el.dataset.rest, top: Math.round(r.top + scrollY) };
    }),
    film: document.documentElement.dataset.film === 'true',
    tapTargets: [...document.querySelectorAll('button, a, [role="button"], [role="slider"], [role="option"]')].map((el) => {
      // Inline links inside the rendered document are content, not chrome —
      // a 44px target on a sentence would reflow the prose. The film's real
      // controls (chips, scrubber, swatches, handoff) all clear 44px.
      if (el.tagName === 'A' && el.closest('.document-content')) return null;
      const r = el.getBoundingClientRect();
      if (!visible(r)) return null;
      if (typeof el.checkVisibility === 'function' && !el.checkVisibility()) return null;
      return { tag: el.tagName, cls: el.className.split(' ')[0], x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
    }).filter(Boolean),
  });
})()`;

const report = { viewports: {}, failures: [] };
const results = [];
function check(name, ok, detail = "", vp = "") {
  const full = `${vp ? vp + " · " : ""}${name}`;
  results.push({ name: full, ok, detail });
  if (!ok && !report.failures.some((f) => f.name === full)) report.failures.push({ name: full, detail });
}

function overlaps(a, b) {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return ix > 4 && iy > 4;
}

async function captureShot(cdp, dir, name) {
  if (QUICK) return;
  try {
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
    await writeFile(join(dir, `${name}.png`), Buffer.from(data, "base64"));
  } catch (e) {
    console.log(`  (shot ${name} failed: ${e.message})`);
  }
}

async function captureFullShot(cdp, dir, name) {
  if (QUICK) return;
  try {
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true });
    await writeFile(join(dir, `${name}.png`), Buffer.from(data, "base64"));
  } catch (e) {
    console.log(`  (full shot ${name} failed: ${e.message})`);
  }
}

async function sweepViewport(cdp, vp, shotDir) {
  const prefix = vp.name;
  const url = `http://localhost:4321/${vp.film ? "?film" : ""}`;
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: false });
  await cdp.send("Page.navigate", { url });
  await sleep(2600);
  await cdp.evaluate(`(() => { try { localStorage.setItem('downright-theme','warm-dark'); localStorage.removeItem('downright-motion'); sessionStorage.clear(); } catch{} return true; })()`);
  await cdp.send("Page.reload", { ignoreCache: true });
  await sleep(2800);

  const vh = vp.height;
  const first = JSON.parse(await cdp.evaluate(COLLECT));
  const docH = first.docH;
  const steps = [];

  // Transition bands: each act declares its incoming band as a fraction of a
  // viewport height ([data-band]); the seam's band is centred on the act's
  // top and two acts may only be simultaneously readable inside it.
  const bandFracs = first.bands || {};
  const seams = Object.entries(first.sectionTops)
    .filter(([, t]) => t > 0)
    .map(([id, t]) => ({ id, t, frac: bandFracs[id] ?? 0.3 }));
  const inBand = (y) => seams.some(({ t, frac }) => Math.abs(y - t) < frac * vh);

  let maxY = Math.min(docH - vh, 24000);
  for (let y = 0; y <= maxY; y += 100) {
    await cdp.evaluate(`window.scrollTo(0, ${y})`);
    await sleep(60);
    const snap = JSON.parse(await cdp.evaluate(COLLECT));
    steps.push(snap);

    const readable = {};
    for (const r of snap.textRects) if (r.op > 0.3 && !r.bridge) readable[r.act] = (readable[r.act] || 0) + 1;
    const readableActs = Object.keys(readable).filter((a) => a !== "none");
    if (readableActs.length > 1 && !inBand(y)) {
      const detail = readableActs.map((a) => `${a}=${readable[a]}`).join(", ");
      check("A · no double exposure", false, `y=${y} → ${detail}`, prefix);
    }

    const visWm = snap.wordmarks.filter((w) => w.vis && w.op > 0.15);
    if (visWm.length !== 1) check("F · one wordmark", false, `y=${y} wordmarks=${visWm.length}`, prefix);
    for (let i = 0; i < snap.headerChildren.length; i++) {
      for (let j = i + 1; j < snap.headerChildren.length; j++) {
        const a = snap.headerChildren[i], b = snap.headerChildren[j];
        if (a.vis && b.vis && overlaps(a, b)) check("F · header no overlap", false, `y=${y} ${a.cls}×${b.cls}`, prefix);
      }
    }
  }

  const windowCounts = steps.map((s) => s.windows);
  if (Math.max(...windowCounts) !== 1 || Math.min(...windowCounts) !== 1) {
    check("D · one app window", false, `counts ${Math.min(...windowCounts)}..${Math.max(...windowCounts)}`, prefix);
  } else check("D · one app window", true, "", prefix);

  // C — dead frames.
  let deadRun = 0; let deadStart = -1; let deadFlagged = false;
  for (const s of steps) {
    const pct = (s.contentArea / (s.vw * s.vh)) * 100;
    if (pct < 10) {
      if (deadRun === 0) deadStart = s.y;
      deadRun += 100;
      if (deadRun >= 0.6 * vh && !deadFlagged) {
        deadFlagged = true;
        check("C · no dead frames", false, `y=${deadStart}..${s.y} <10% content`, prefix);
      }
    } else deadRun = 0;
  }

  // Rest states. Each anchor is re-measured *immediately before* resting on
  // it: the step loop above triggers async scenes (the terminal type-in, the
  // agent visit, the theme spill) that reflow the page as they run, so any
  // one-shot measure — even taken after the loop — is stale for later acts.
  const restIds = [...new Set(first.restAnchors.map((a) => a.id))];
  const fingerprints = new Map();
  for (const restId of restIds) {
    const rest = await cdp.evaluate(
      `(() => { const el = document.querySelector('[data-rest="${restId}"]') || document.getElementById('${restId}'); if (!el) return null; if (getComputedStyle(el).display === 'none') return null; const r = el.getBoundingClientRect(); return { id: '${restId}', top: Math.round(r.top + scrollY) }; })()`,
    );
    if (!rest) continue;
    await cdp.evaluate(`window.scrollTo(0, ${Math.max(0, rest.top)})`);
    await sleep(320);
    const snap = JSON.parse(await cdp.evaluate(COLLECT));
    const area = (snap.contentArea / (snap.vw * snap.vh)) * 100;
    if (process.env.SWEEP_DEBUG) console.log(`  [dbg] ${prefix} ${rest.id} top=${rest.top} scrollY=${snap.y} textRects=${snap.textRects.length} components=${snap.components.length} area=${area.toFixed(0)}%`);

    const clipped = snap.textRects.filter((r) => r.cropped && !r.cropOk && r.op > 0.3);
    if (clipped.length) {
      if (process.env.SWEEP_DEBUG) console.log(`  [dbg] ${prefix} ${rest.id} clipped: ${clipped.map((r) => `${r.t}@${r.y},${r.h}(${r.act})`).join(" | ")}`);
      check("B · no clipping at rest", false, `${rest.id} "${clipped[0].t}" (+${clipped.length - 1})`, prefix);
    }

    // A mobile agent beat is intentionally top-weighted, and the close is a
    // typographic frame rather than a card grid. Their floors are lower than
    // the desktop proof frames but still well above the dead-frame threshold.
    const minArea = snap.film ? 18 : rest.id === "close" ? 25 : rest.id === "speed" ? 35 : 40;
    if (area < minArea) check("C · composed frame", false, `${rest.id} area=${area.toFixed(0)}% < ${minArea}%`, prefix);

    // E — collisions between distinct text of the same act.
    const byAct = {};
    for (const r of snap.textRects) if (r.op > 0.3) (byAct[r.act] ||= []).push(r);
    for (const rects of Object.values(byAct)) {
      if (rects.length < 2) continue;
      outer: for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          if (rects[i].t === rects[j].t) continue;
          if (rects[i].owner && rects[i].owner === rects[j].owner) continue;
          const dx = Math.abs((rects[i].x + rects[i].w / 2) - (rects[j].x + rects[j].w / 2));
          const dy = Math.abs((rects[i].y + rects[i].h / 2) - (rects[j].y + rects[j].h / 2));
          if (dx < 16 && dy < 8) continue; // inline siblings, not collisions
          if (overlaps(rects[i], rects[j])) {
            check("E · no text collisions", false, `${rest.id} "${rects[i].t.slice(0, 14)}"×"${rects[j].t.slice(0, 14)}"`, prefix);
            break outer;
          }
        }
      }
    }

    const fp = [...new Set(snap.components.map((c) => c.fp))].sort().join("|");
    if (fingerprints.has(fp)) check("D · no echo", false, `${rest.id} repeats ${fingerprints.get(fp)}`, prefix);
    fingerprints.set(fp, rest.id);

    await captureShot(cdp, shotDir, `${prefix}-rest-${rest.id}`);
  }

  // Three evenly spaced frames per handoff seam, so the human can eyeball
  // the hard cuts (the one crossfade-like event allowed is the window morph).
  if (!QUICK) {
    for (const seam of seams) {
      const band = seam.frac * vh;
      for (const [label, offset] of [["pre", -band * 0.4], ["mid", 0], ["post", band * 0.4]]) {
        await cdp.evaluate(`window.scrollTo(0, ${Math.max(0, Math.round(seam.t + offset))})`);
        await sleep(220);
        await captureShot(cdp, shotDir, `${prefix}-seam-${seam.id}-${label}`);
      }
    }
  }

  if (vp.film) {
    const banned = ["speed", "architecture", "reach", "themes"];
    const stray = steps.find((s) =>
      s.textRects.some((r) => r.op > 0.3 && banned.includes(r.act)));
    const strayAct = stray?.textRects.find((r) => r.op > 0.3 && banned.includes(r.act))?.act;
    const smallTaps = steps.flatMap((s) => s.tapTargets).filter((t) => t.w < 44 || t.h < 44);
    check("H · film: no desktop-act text", !stray, stray ? `act "${strayAct}" visible` : "", prefix);
    check("H · film: taps ≥44px", smallTaps.length === 0, smallTaps.length ? `${smallTaps[0].cls} ${smallTaps[0].w}×${smallTaps[0].h} (+${smallTaps.length - 1})` : "", prefix);
  }

  report.viewports[prefix] = { docH, steps: steps.length, restStates: restIds.length };
}

/* ── G · the funnel (download, sponsor placements, no third-party/console
   noise). The real DMG click is stubbed so the sweep never navigates away or
   hits GitHub; the anchor's href + download attribute are asserted instead. */
const EXPECTED_DMG = "https://github.com/ezzy1630/Downright/releases/latest/download/Downright.dmg";
const EXPECTED_REPO = "https://github.com/ezzy1630/Downright";
const EXPECTED_SPONSORS = "https://github.com/sponsors/ezzy1630";

async function goto(cdp, url) {
  await cdp.send("Page.navigate", { url });
  await sleep(2600);
  await cdp.evaluate(`(() => { try { localStorage.setItem('downright-theme','warm-dark'); sessionStorage.clear(); } catch{} return true; })()`);
  await cdp.send("Page.reload", { ignoreCache: true });
  await sleep(2800);
}

async function sponsorCensus(cdp) {
  return await cdp.evaluate(`(() => {
    const vis = (a) => (typeof a.checkVisibility === 'function' ? a.checkVisibility() : true);
    const links = [...document.querySelectorAll('a[href*="github.com/sponsors"]')].filter(vis);
    const host = (a) => a.closest('[data-site-header]') ? 'header' : a.closest('.site-footer') ? 'footer' : a.closest('.close-sponsor') ? 'close' : a.closest('.glass-toast--download') ? 'panel' : a.closest('.film-handoff') ? 'film' : 'other';
    return { total: links.length, places: links.map(host), hrefs: links.map((a) => a.getAttribute('href')) };
  })()`);
}

async function sweepFunnel(cdp) {
  const prefix = "funnel";
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await goto(cdp, "http://localhost:4321/");

  const dl = await cdp.evaluate(`(() => {
    const b = document.querySelector('[data-download]');
    return b ? { url: b.dataset.downloadUrl || null, artifact: b.dataset.artifact || null } : null;
  })()`);
  check("G · download URL resolves", !!dl && dl.url === EXPECTED_DMG, dl ? String(dl.url) : "no [data-download]", prefix);
  check("G · download carries artifact", !!dl && dl.artifact === "Downright.dmg", dl ? String(dl.artifact) : "", prefix);

  // Static sponsor census: footer + close act, nowhere else, none in header.
  const before = await sponsorCensus(cdp);
  check("G · sponsor placements (rest)", before.total === 2 && before.places.includes("footer") && before.places.includes("close") && !before.places.includes("header"), JSON.stringify(before), prefix);
  check("G · sponsor URL correct", before.hrefs.every((h) => h === EXPECTED_SPONSORS), before.hrefs.join(","), prefix);

  // Click the download with the anchor stubbed: assert DMG href + download
  // semantics, the panel appears exactly once, and it carries star + fund.
  const fired = await cdp.evaluate(`(async () => {
    const clicked = [];
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { clicked.push({ href: this.getAttribute('href'), download: this.getAttribute('download') }); };
    try {
      document.querySelector('[data-download]').click();
      await new Promise((r) => setTimeout(r, 180));
      const panel = document.querySelector('.glass-toast--download');
      let flag = null; try { flag = sessionStorage.getItem('downright-download-panel-shown'); } catch {}
      const panelLinks = panel ? [...panel.querySelectorAll('a')].map((a) => a.getAttribute('href')) : [];
      const first = { clicked: [...clicked], flag, panel: !!panel, panelLinks };
      document.querySelector('[data-download]').click();
      await new Promise((r) => setTimeout(r, 80));
      first.panelCount = document.querySelectorAll('.glass-toast--download').length;
      return first;
    } finally { HTMLAnchorElement.prototype.click = orig; }
  })()`);
  check("G · click → DMG href + download attr", !!fired && fired.clicked.length === 1 && fired.clicked[0].href === EXPECTED_DMG && fired.clicked[0].download === "Downright.dmg", fired ? JSON.stringify(fired.clicked) : "", prefix);
  check("G · panel appears once/session", !!fired && fired.flag === "1" && fired.panel === true && fired.panelCount === 1, fired ? `flag=${fired.flag} panel=${fired.panel} count=${fired.panelCount}` : "", prefix);
  check("G · panel carries star + fund", !!fired && fired.panelLinks.length === 2 && fired.panelLinks.includes(EXPECTED_REPO) && fired.panelLinks.includes(EXPECTED_SPONSORS), fired ? JSON.stringify(fired.panelLinks) : "", prefix);

  const after = await sponsorCensus(cdp);
  check("G · sponsor placements (panel open)", after.total === 3 && after.places.includes("panel") && after.places.includes("footer") && after.places.includes("close") && !after.places.includes("header"), JSON.stringify(after), prefix);

  // Film close beat carries the tertiary Sponsor action (§8.3).
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await goto(cdp, "http://localhost:4321/?film");
  const film = await sponsorCensus(cdp);
  // On the film the serif close line is desktop furniture; the close beat's
  // sponsor ask is the tertiary handoff action beside the GitHub star.
  check("G · film sponsor placement", film.total === 2 && film.places.includes("film") && film.places.includes("footer") && !film.places.includes("close") && !film.places.includes("header") && !film.places.includes("panel"), JSON.stringify(film), prefix);
}

await ensureChrome();
const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const cdp = new CDP(ws);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Network.enable");
await cdp.send("Log.enable");

const shotRoot = join(ROOT, "..", "verify", "shots", PHASE);
await mkdir(shotRoot, { recursive: true });

console.log(`\n── audit-sweep · phase "${PHASE}" ──`);
for (const vp of VIEWPORTS) {
  console.log(`\n▶ ${vp.name} ${vp.width}×${vp.height}${vp.film ? " (film)" : ""}`);
  await sweepViewport(cdp, vp, shotRoot);
}

console.log(`\n▶ funnel`);
await sweepFunnel(cdp);

// G — network hygiene: same-origin only, no 404s, no failed requests, and a
// silent console across the entire sweep (the DMG click is stubbed, so no
// GitHub hit is expected or allowed).
const thirdParty = cdp.events.requests.filter((u) =>
  !u.startsWith("http://localhost:4321/") && !u.startsWith("data:") && !u.startsWith("blob:") && !u.startsWith("chrome"));
check("G · zero third-party requests", thirdParty.length === 0, [...new Set(thirdParty)].join(", "), "network");
const notFound = cdp.events.responses.filter((r) => r.status >= 400);
check("G · no 404s", notFound.length === 0, [...new Set(notFound.map((r) => `${r.status} ${r.url}`))].slice(0, 6).join(", "), "network");
const failedReq = cdp.events.failures.filter((f) => !/ERR_ABORTED|net::ERR_ABORTED/.test(f.error || ""));
check("G · no failed requests", failedReq.length === 0, JSON.stringify(failedReq.slice(0, 3)), "network");
const consoleNoise = [
  ...cdp.events.console.filter((c) => c.type === "error" || c.type === "warning"),
  ...cdp.events.exceptions,
  ...cdp.events.log.filter((l) => l.level === "error" || l.level === "warning"),
];
check("G · zero console errors/warnings", consoleNoise.length === 0, JSON.stringify(consoleNoise.slice(0, 4)), "network");

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} assertions passed`);
for (const r of results.filter((x) => !x.ok)) console.log(`  FAIL  ${r.name} — ${r.detail}`);

const summary = {
  phase: PHASE,
  generatedAt: new Date().toISOString(),
  viewports: report.viewports,
  passed: results.length - failed.length,
  total: results.length,
  failures: report.failures,
};
await writeFile(join(ROOT, "..", "verify", "report.json"), JSON.stringify(summary, null, 2));
console.log(`\nreport → verify/report.json`);
ws.close();
process.exit(failed.length ? 1 : 0);
