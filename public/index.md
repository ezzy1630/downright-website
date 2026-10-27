# Downright

Downright is a free, open-source, native Markdown editor and viewer for macOS. It renders files exactly, reviews agent rewrites live, never modifies your bytes, uses no WebView, and is MIT licensed.

A native Markdown reader and editor for files people and coding agents change together. Exact rendering and live agent-rewrite review keep the source in charge.

## The file is the starting point

The same source appears in a plain preview and in Downright. The renderer keeps math, tables, callouts, tasks, footnotes, syntax, and Mermaid in one document surface.

## Structural zoom

One anchor moves from headings to full text without throwing away the place you are reading.

## Architecture

Raw text is the only source of truth. One adaptive surface moves between Read, Live, and Source Focus. The renderer decorates. It never rewrites the bytes.

## System reach

Open a file from Finder, preview it with Quick Look, or send it through the down command. The same file stays the source of truth.

## Themes

- Paper Light: #f7f4ee background, #292522 text, #307afe accent
- Warm Dark: #171614 background, #e3ddd5 text, #6ea8ff accent
- Nord: #2e3440 background, #d8dee9 text, #88c0d0 accent
- Solarized Light: #fdf6e3 background, #526b72 text, #268bd2 accent
- High Contrast: #ffffff background, #000000 text, #0000cc accent
- System: system:textBackground background, system:label text, system:accent accent

## Free and open

Free. Open source. MIT. No account. Your Markdown stays on your Mac.

If Downright is useful to you, you can [star it on GitHub](https://github.com/ezzy1630/Downright) to support the project.

## Measured improvements

Downright 1.0.18 spends less time parsing, diffing, and updating your document.

| Measurement | Before (p95) | After (p95) | Less time |
|---|---:|---:|---:|
| cmark conversion | 13.076 ms | 10.605 ms | 18.9% |
| Full parse | 27.477 ms | 20.807 ms | 24.3% |
| AST diff | 0.030 ms | 0.018 ms | 40.0% |
| Text diff | 1.605 ms | 0.503 ms | 68.7% |
| Incremental decoration | 0.104 ms | 0.102 ms | 1.9% |
| Wholesale decoration | 157.616 ms | 73.180 ms | 53.6% |
| Typing/storage | 0.149 ms | 0.099 ms | 33.6% |
| Semantic convergence | 28.090 ms | 20.483 ms | 27.1% |
| Parse 100 KB | 23.020 ms | 16.489 ms | 28.4% |
| Syntax highlighting | 0.090 ms | 0.065 ms | 27.8% |

Apple M4 / macOS 27.0, 2026-10-27. p95 latency, fastest baseline versus slowest result across three interleaved pairs on the same Mac. Corpus: 120,825 characters / 4,885 lines; the separate 100 KB parse uses exactly 100,000 characters. [All benchmarks and test conditions](https://downright.cc/benchmarks/).

## Source

- Repository: https://github.com/ezzy1630/Downright
- App payload commit: 2cdc7962848f072506c11908f15caf768110af45
- App payload generated: 2026-10-27T18:52:32.223Z
- Supported extensions: .md .markdown .mdown .mkd .mdx .mdc .qmd .rmd

Download: https://github.com/ezzy1630/Downright/releases/latest/download/Downright.dmg
