# Downright website

Standalone Astro site for Downright. The native app checkout at
`/Volumes/Neural/Downright` remains the source of product claims; this project
contains the marketing surface only.

Downright is a free, open-source, native Markdown editor and viewer for macOS.
It renders files exactly, reviews agent rewrites live, never modifies your
bytes, uses no WebView, and is MIT licensed.

## The living document (plan v2.1)

One Markdown file — the app's real `sample.md` in a shared client-side store —
runs every act: you type into it in the hero (a real CodeMirror 6 editor with
the app's Live-mode decorations), scroll it through the render act, collapse
it through five semantic levels, watch an agent rewrite it and resolve the
conflict if you had edited it, spill six themes across it in OKLab, flip the
window to its own source (⌘⇧E), or drop your own `.md` on the page. Below
900px on a phone, the same URL becomes the mobile film with the AirDrop
handoff. No frameworks; one spring kernel carrying the app's Motion.swift
constants; every token traces to the theme JSONs; the budget gate
(`npm run audit:budgets`) enforces §12 in CI.

## Commands

```bash
npm run test:editor   # §18.1 editor contracts, headless
npm run audit:budgets # §12 gate against dist/
npm run audit:contrast
npm run generate:data # payload from the app checkout
```

## Run

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run check
npm run build
npm run preview
```

## Download release

Set `PUBLIC_DOWNLOAD_URL` to the stable signed, notarized, stapled macOS
artifact only after it has been verified. `.env.example` points at the latest
GitHub Release `Downright.dmg` alias, so the CTA follows the newest published
main-branch release; it stays gated if the value is absent.

## Pages

- `/` — product homepage
- `/changelog` — source-grounded product updates
- `/themes` — six semantic theme palettes
- `/known-gaps` — current release and native-evidence gaps
- `/index.md`, `/changelog.md`, `/themes.md`, `/llms.txt` — machine-readable content

## Guide routes

The answer pages are /markdown-viewer-mac, /markdown-editor-mac-free,
/downright-vs-typora, /downright-vs-obsidian, and /faq.

## Known gaps

The site intentionally publishes its remaining launch gaps at `/known-gaps` and
`/known-gaps.md`: the public tap is live while official Homebrew Cask review,
the public repo address and mark evolution remain open, and the native
Quick Look/Finder/conflict/agent capture sessions are not present in the current
Verification inventory. Clean-machine release verification remains a separate
gate. No product evidence is fabricated to cover those gaps.
