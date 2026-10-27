# Downright Markdown rendering benchmarks

## Measured improvements

Downright 1.0.18 benchmarks.

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

## Test conditions

Apple M4 / macOS 27.0, 2026-10-27. p95 latency, fastest baseline versus slowest result across three interleaved pairs on the same Mac. Corpus: 120,825 characters / 4,885 lines; the separate 100 KB parse uses exactly 100,000 characters.

The measured code is included in [Downright 1.0.18 (build 356)](https://github.com/ezzy1630/Downright/releases/tag/auto-2cdc7962848f072506c11908f15caf768110af45). [Raw runs and source identity](https://github.com/ezzy1630/Downright/blob/2cdc7962848f072506c11908f15caf768110af45/Docs/Benchmarks/2026-10-27/final-input-checks/snapshot.json). These timings cover parsing, diffing, storage, and decoration; they do not measure first-pixel launch time, visible scrolling, or complete window transitions.

## Parsing, search, and memory

2026-10-25. Apple M4, macOS 27.0 (26A5406e). Measured on the same Mac with the same workload within each row.

| Measurement | Sample type | Before | After | Reduction |
|---|---|---:|---:|---:|
| Unicode inline-heavy parse | p95 | 48.811 ms | 11.212 ms | 77% |
| Fuzzy heading search | Single invocation | 11.036 ms | 0.912 ms | 92% |
| Peak physical footprint | Two fresh-process runs | 449.2 MiB | 204.1–252.2 MiB | 44–55% |

## Test conditions and limits

- Unicode inline-heavy parse: 16,800-byte Unicode line with repeated formatting and links. p95.
- Fuzzy heading search: 12-character query against a 1,500-character heading. Single invocation.
- Peak physical footprint: 1,032,709-byte document; edit, save, undo, scroll, and presentation switches. Two fresh-process runs.

The search result is a single invocation, not a percentile. Memory is the kernel's lifetime maximum physical footprint across two fresh isolated native processes, not live heap or resident memory. The below-150-MB interactive-session target remains unverified. The two-run range is not a percentile or a guaranteed ceiling. A later 126.2 MB observation measured opening the stress document only; it does not replace these interactive-session measurements.

The 1,032,709-byte stress document contains 57,043 lines and 16,298 tasks. Each run opens a fresh isolated release host, enters Source, inserts seven characters, saves, undoes seven times and saves again, scrolls down and up two pages, then performs three further Source/Document cycles. The original bytes were restored exactly. These checks do not establish first-pixel launch time or 120 Hz frame delivery.

## Historical pipeline baseline

- Corpus: 120,825 characters / 4,885 lines
- Date: 2026-08-06
- Machine: single unrecorded machine
- Qualification: Historical baseline only. Not a cross-machine claim.
- Not measured: TextKit layout, scroll frames, IME input, live window frame time

The historical small-document parse used roughly 48 KB, despite its original 100 KB label. It is not a 100 KB measurement or a first-pixel timing.

| Measurement | p50 | p95 | Target |
|---|---:|---:|---|
| cmark parse | 12.827 ms | 13.309 ms | Informational |
| Full MarkdownParser.parse | 29.463 ms | 30.372 ms | Informational |
| AST dirty set, one-character edit | 0.030 ms | 0.031 ms | Informational |
| Text diff, external rewrite | 2.099 ms | 2.164 ms | Informational |
| Incremental decoration | 0.097 ms | 0.104 ms | <8 ms |
| Wholesale decoration | 103.722 ms | 171.493 ms | Informational |
| Source edit and paragraph map | 0.146 ms | 0.153 ms | <8 ms |
| End-to-end semantic convergence | 30.583 ms | 31.445 ms | <100 ms |
| Small-document parse (~48 KB) | 12.078 ms | 12.395 ms | Informational |
| Syntax highlight, 10 KB Swift | 0.093 ms | 0.094 ms | Informational |

## Source

- [Native performance record](https://github.com/ezzy1630/Downright/blob/2cdc7962848f072506c11908f15caf768110af45/Docs/PERFORMANCE.md)
- Source commit: 2cdc7962848f072506c11908f15caf768110af45
- Site payload generated: 2026-10-27T18:50:43.237Z
