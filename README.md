# Downright website

Standalone Astro site for Downright. The native app repository remains the
source of product claims; this project contains the marketing surface only.

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

The generated app facts point at the rolling signed, notarized, stapled macOS
artifact alias after release verification. Every verified push to the app's
`main` branch publishes the next build through that alias. `PUBLIC_DOWNLOAD_URL` remains
available when a deployment needs to pin a specific immutable asset.

## Pages

- `/` — product homepage
- `/download/` — signed release and installation methods
- `/releases/1.0.16/` — current release record
- `/changelog/` — source-grounded product updates
- `/themes/` — six semantic theme palettes
- `/known-gaps/` — current release and native-evidence gaps
- `/index.md`, `/changelog.md`, `/themes.md`, `/llms.txt` — machine-readable content

## Guide routes

The answer pages cover Markdown viewing, opening `.md` files, Quick Look,
external agent changes, Claude Code, Codex, AGENTS.md, comparisons, formats,
engineering, benchmarks, press facts, and the FAQ.

## Known gaps

The site intentionally publishes its remaining launch gaps at `/known-gaps/` and
`/known-gaps.md`. The public tap resolves to the same rolling artifact while official Homebrew Cask review and
clean-machine release verification remain separate gates. No product evidence
is fabricated to cover those gaps.
