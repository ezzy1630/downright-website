import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const site = new URL(process.env.SITE_URL ?? "http://localhost:4321/");
assert.equal((await fetch(site)).status, 200, `Serve the site at ${site} before running this check.`);
const candidates = process.env.CHROME_PATH ? [process.env.CHROME_PATH] : [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium",
];
let executable;
for (const candidate of candidates) {
  try { await access(candidate, constants.X_OK); executable = candidate; break; } catch {}
}
assert.ok(executable, "Chrome not found. Set CHROME_PATH to a WebMCP-capable Chrome executable.");
const profile = await mkdtemp(join(tmpdir(), "downright-webmcp-"));
const browser = spawn(executable, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--enable-experimental-web-platform-features", "--enable-blink-features=WebMCP,WebMCPTesting",
  "--force-device-scale-factor=1", "about:blank",
], { stdio: "ignore" });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let ws;
let passed = 0;
const check = (name, condition) => { assert.ok(condition, name); passed++; console.log(`PASS ${name}`); };

try {
  let port;
  for (let attempt = 0; attempt < 100 && !port; attempt++) {
    try { port = (await readFile(join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]; } catch { await delay(100); }
  }
  assert.ok(port, "Isolated Chrome did not start.");
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  console.log(`Browser: ${version.Browser}; target: ${site}`);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws = new WebSocket(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  let nextId = 0;
  const pending = new Map();
  const handlers = new Map();
  ws.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      clearTimeout(request.timer);
      if (message.error) request.reject(new Error(JSON.stringify(message.error)));
      else request.resolve(message.result);
    } else handlers.get(message.method)?.(message.params);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
    return response.result.value;
  };
  const waitFor = async (expression) => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw new Error(`Condition not reached: ${expression}`);
  };
  const navigate = async (path) => {
    await send("Page.navigate", { url: new URL(path, site).href });
    await waitFor(`location.pathname === ${JSON.stringify(path)} && document.readyState === "complete"`);
  };
  const callExpression = (name, input = {}) => `(async () => {
    const context = document.modelContext ?? navigator.modelContext;
    const tools = await context.getTools();
    const tool = tools.find(tool => tool.name === ${JSON.stringify(name)});
    return JSON.parse(await context.executeTool(tool, ${JSON.stringify(input)}));
  })()`;
  const call = async (name, input) => evaluate(callExpression(name, input));
  const value = (output) => { assert.ok(!output.isError, output.content[0].text); return JSON.parse(output.content[0].text); };
  const screenshot = async (name) => {
    if (!process.env.SCREENSHOT_DIR) return;
    await mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
    await evaluate("document.fonts.ready");
    await delay(300);
    const capture = await send("Page.captureScreenshot", { format: "png" });
    await writeFile(join(process.env.SCREENSHOT_DIR, `${name}.png`), Buffer.from(capture.data, "base64"));
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate("/");
  check("native WebMCP is available (no shim)", await evaluate("typeof (document.modelContext ?? navigator.modelContext)?.getTools === 'function'"));
  await waitFor("document.documentElement.dataset.webmcp === 'ready'");
  const registered = await evaluate("(document.modelContext ?? navigator.modelContext).getTools().then(tools => tools.map(({name, annotations}) => ({name, annotations})))");
  check("all five read-only tools are discoverable", registered.length === 5 && registered.every((tool) => tool.annotations.readOnlyHint));
  const info = value(await call("get_downright_info"));
  check("product facts include the real repository and snapshot provenance", info.repository === "https://github.com/ezzy1630/Downright" && info.publishedSnapshot.sourceCommit.length === 40);
  const installation = value(await call("get_downright_installation"));
  check("installation returns instructions and the signed DMG URL", installation.downloadUrl.endsWith("/Downright.dmg") && installation.commands.homebrew.includes("brew install --cask downright"));
  const found = value(await call("find_downright_docs", { query: "Quick Look" }));
  check("documentation search finds the relevant guide", found.pages.some((page) => page.markdownPath === "/guides/quick-look-markdown.md"));
  const all = value(await call("find_downright_docs", { query: "" }));
  check("every indexed Markdown document is served", (await Promise.all(all.pages.map(async (page) => (await fetch(page.markdownUrl)).status === 200))).every(Boolean));
  check("a search with no matches returns an empty list", value(await call("find_downright_docs", { query: "zzzz-no-matching-guide" })).pages.length === 0);
  const document = value(await call("read_downright_doc", { markdownPath: "/guides/quick-look-markdown.md" }));
  check("document reading fetches the actual Markdown", document.markdown.includes("Quick Look") && document.markdown.startsWith("#"));
  const benchmarks = value(await call("read_downright_doc", { markdownPath: "/benchmarks.md" }));
  check("agents can read qualified benchmark improvements", benchmarks.markdown.includes("44–55%") && benchmarks.markdown.includes("single invocation, not a percentile") && benchmarks.markdown.includes("roughly 48 KB"));
  check("agents receive the latest pipeline timings", benchmarks.markdown.includes("20.807 ms") && benchmarks.markdown.includes("0.099 ms") && benchmarks.markdown.includes("three interleaved pairs"));
  const repository = value(await call("get_downright_repository"));
  check("GitHub support links point to the source repository", repository.support.star.url === info.repository && repository.issues === `${info.repository}/issues`);
  check("read-only tool calls keep the visitor on the same page", await evaluate(`location.href === ${JSON.stringify(site.href)}`));
  for (const [name, input] of [
    ["find_downright_docs", { query: 42 }],
    ["find_downright_docs", { query: "a".repeat(161) }],
    ["read_downright_doc", { markdownPath: "/../install" }],
    ["read_downright_doc", { markdownPath: "https://example.com/private.md" }],
  ]) {
    let refused = false;
    try { refused = Boolean((await call(name, input)).isError); } catch { refused = true; }
    check(`${name} refuses ${JSON.stringify(input).slice(0, 70)}`, refused);
  }
  handlers.set("Fetch.requestPaused", ({ requestId }) => { void send("Fetch.fulfillRequest", { requestId, responseCode: 404, body: "" }); });
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/privacy.md" }] });
  check("HTTP errors return a useful tool error", (await call("read_downright_doc", { markdownPath: "/privacy.md" })).isError);
  await send("Fetch.disable");
  await send("Network.enable");
  await send("Network.setBlockedURLs", { urls: ["*/privacy.md"] });
  check("network failures return a useful tool error", (await call("read_downright_doc", { markdownPath: "/privacy.md" })).isError);
  await send("Network.setBlockedURLs", { urls: [] });
  handlers.set("Fetch.requestPaused", () => {});
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/privacy.md" }] });
  check("document requests can be cancelled", await evaluate(`(async () => {
    const context = document.modelContext ?? navigator.modelContext;
    const tool = (await context.getTools()).find(tool => tool.name === 'read_downright_doc');
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 100);
    try { await context.executeTool(tool, {markdownPath: '/privacy.md'}, {signal: controller.signal}); return false; }
    catch (error) { return error.name === 'AbortError'; }
  })()`));
  await send("Fetch.disable");
  check("homepage star link uses the real repository", await evaluate(`document.querySelector('[data-github-star="hero"]').href === ${JSON.stringify(info.repository)}`));
  await screenshot("desktop-hero");
  await evaluate("document.querySelector('#close').scrollIntoView()");
  await screenshot("desktop-close");
  await navigate("/download/");
  await waitFor("document.documentElement.dataset.webmcp === 'ready'");
  check("tools and star link are available on subpages", await evaluate("document.querySelector('[data-github-star=download]') !== null"));
  await screenshot("desktop-download");
  await navigate("/benchmarks/");
  check("benchmark page separates sample types from historical timings", await evaluate("Array.from(document.querySelectorAll('[data-benchmark-comparison]')).some(table => table.textContent.includes('Single invocation')) && document.body.textContent.includes('Small-document parse (~48 KB)')"));
  check("the primary table shows all ten current pipeline timings with plain labels", await evaluate("document.querySelector('[data-benchmark-comparison] tbody').rows.length === 10 && document.querySelector('[data-benchmark-comparison]').textContent.includes('20.807 ms') && !/development.build|current download is not established/i.test(document.body.textContent)"));
  await evaluate("document.querySelector('h2').scrollIntoView(); window.scrollBy(0, -90)");
  await screenshot("desktop-benchmarks");
  await navigate("/");
  await waitFor("document.documentElement.dataset.enhanced === 'true'");
  await evaluate("document.querySelector('#speed').scrollIntoView(); window.scrollBy(0, -80)");
  await screenshot("desktop-home-benchmarks");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await navigate("/");
  await waitFor("document.documentElement.dataset.webmcp === 'ready'");
  check("the touch viewport uses the site's mobile film", await evaluate("document.documentElement.dataset.film === 'true'"));
  await screenshot("mobile-hero");
  check("mobile star link has a touch target and no horizontal overflow", await evaluate("document.querySelector('[data-github-star=hero]').getBoundingClientRect().height >= 44 && document.documentElement.scrollWidth <= innerWidth"));
  await evaluate("document.querySelector('#close').scrollIntoView()");
  await screenshot("mobile-close");
  check("mobile film exposes the current parsing, diffing, and typing timings", await evaluate("document.querySelector('.film-compact-benchmark').textContent.includes('20.807 ms') && document.querySelector('.film-compact-benchmark').textContent.includes('0.099 ms') && document.querySelector('.film-compact-benchmark').textContent.includes('0.503 ms')"));
  await evaluate("document.querySelector('#film-cta').scrollIntoView(); window.scrollBy(0, -80)");
  await screenshot("mobile-home-benchmarks");
  await navigate("/benchmarks/");
  check("mobile benchmark tables scroll inside the page", await evaluate("document.documentElement.scrollWidth <= innerWidth && document.querySelector('.benchmark-comparison').scrollWidth > document.querySelector('.benchmark-comparison').clientWidth"));
  await evaluate("document.querySelector('h2').scrollIntoView(); window.scrollBy(0, -90)");
  await screenshot("mobile-benchmarks");
  const legacy = await send("Page.addScriptToEvaluateOnNewDocument", { source: `
    Object.defineProperty(navigator, 'modelContext', {value: document.modelContext, configurable: true});
    Object.defineProperty(document, 'modelContext', {value: undefined, configurable: true});
  ` });
  await navigate("/");
  await waitFor("document.documentElement.dataset.webmcp === 'ready'");
  check("the legacy navigator entry point registers callable tools", value(await call("get_downright_info")).repository === info.repository);
  await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: legacy.identifier });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `
    Object.defineProperty(document, 'modelContext', {value: undefined});
    Object.defineProperty(navigator, 'modelContext', {value: undefined});
  ` });
  await navigate("/");
  await waitFor("document.documentElement.dataset.enhanced === 'true'");
  check("unsupported browsers retain the working site and GitHub link", await evaluate("!document.documentElement.dataset.webmcp && !document.documentElement.dataset.error && !!document.querySelector('[data-github-star=hero]')"));
  console.log(`\n${passed} WebMCP checks passed.`);
} finally {
  ws?.close();
  browser.kill("SIGTERM");
  await new Promise((resolve) => { if (browser.exitCode !== null || browser.signalCode !== null) resolve(); else browser.once("exit", resolve); });
  await rm(profile, { recursive: true, force: true });
}
