import themesPayload from "./app/themes.json";
import factsPayload from "./app/facts.json";
import benchmarksPayload from "./app/benchmarks.json";
import motionPayload from "./app/motion.json";
import sampleMarkdown from "./app/sample.md?raw";

export type AppTheme = (typeof themesPayload.themes)[number] & { id: string };
export type BenchmarkPayload = typeof benchmarksPayload;
export type FactsPayload = typeof factsPayload;

export const themes = themesPayload.themes as AppTheme[];
export const facts = factsPayload as FactsPayload;
export const benchmarks = benchmarksPayload as BenchmarkPayload;
export const motion = motionPayload;
export { sampleMarkdown };

export const entityDescription = "Downright is a free, open-source, native Markdown editor and viewer for macOS. It renders files exactly, reviews agent rewrites live, never modifies your bytes, uses no WebView, and is MIT licensed.";
export const brewCommand = "brew tap ezzy1630/downright && brew trust --cask ezzy1630/downright/downright && brew install --cask downright";
export const npmCommand = "npx --yes downright-installer";
export const curlCommand = "curl -fsSL https://downright.cc/install | bash";

export const sections = [
  { id: "hero", label: "Start", detail: "The native Markdown app" },
  { id: "gap", label: "The difference", detail: "What macOS shows you, and what Downright shows you" },
  { id: "agent", label: "Agent writes", detail: "See what changed, then decide" },
  { id: "speed", label: "Speed", detail: "Every number has a limit beside it" },
  { id: "architecture", label: "How it works", detail: "Your text stays in charge" },
  { id: "reach", label: "Everywhere", detail: "Finder, Quick Look, the terminal" },
  { id: "themes", label: "Themes", detail: "Six themes, one document" },
  { id: "close", label: "Free and open", detail: "MIT, no account" },
] as const;

export const copy = {
  title: "Downright | The native Markdown app for macOS",
  description: entityDescription,
  hero: {
    heading: "The native Markdown app for macOS.",
    body: "Your agents write too much Markdown. Downright renders it exactly and lets you review rewrites live, without touching your bytes.",
    micro: "Free · MIT · macOS 14+ · no WebView",
  },
  gap: {
    eyebrow: "The difference",
    lede: "Press Space on a Markdown file today. This is what macOS shows you.",
    capture: "The same bytes above are live DOM — no uploaded image, no detour.",
    closing: "Same file. Same bytes. Downright just renders them.",
    annotation: "same bytes ↑",
    beatTwoHeading: "There is more of it every day.",
    beatTwoLine: "Your agents wrote 3,000 words while you read this sentence. One of them matters. Good luck finding it.",
  },
  render: {
    heading: "Every part of the file renders.",
    body: "Scroll, and the document scrolls with you. Math, diagrams, tables, callouts, tasks, footnotes, and code all render — no plugins, no setup.",
    closing: "Downright decorates your text. It never rewrites it.",
    aside: "Long file? Structural Zoom collapses it to headings, then to first sentences, and back — ⌃⌥⌘1–5, in the app.",
  },
  speed: {
    heading: "Every number here has a limit beside it.",
    body: "These are the app's own measurements. The corpus, the date, and the things we did not measure are all listed below the table.",
  },
  architecture: {
    heading: "Your text stays in charge.",
    body: "One window handles reading, editing, and source. Downright adds styling on top of your file. It never changes what is in it.",
    punctuation: "This page keeps its source too. Press ⌘⇧E.",
  },
  reach: {
    heading: "It opens your files from anywhere.",
    body: "Open a file from Finder. Preview it with Space. Flick a card and it slides — the cards have real weight. Or pipe a file through the down command.",
  },
  themes: {
    heading: "Six themes. One document.",
    body: "This page uses the app's theme engine. Pick a theme and the whole page changes with it.",
  },
  agent: {
    heading: "The file changes while you are reading it.",
    body: "An agent writes to the file you have open. Downright marks every word that changed and waits for you to decide what to keep.",
    contextual: "That is what reviewing agent work should feel like.",
  },
  close: {
    heading: "Free. Open source. MIT. No account.",
    body: "No app telemetry, no cookies, no account. The app stays local; this site uses anonymous, cookie-free analytics so we can see which pages help.",
  },
} as const;

export const supportedExtensionLine = facts.supportedExtensions.map((extension) => `.${extension}`).join(" ");

export const themeColorEntries = (theme: AppTheme) => Object.entries(theme.palette);
