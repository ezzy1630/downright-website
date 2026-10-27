# Downright Markdown rendering benchmarks

## Measured improvements

Development-build comparisons recorded 2026-10-25 on Apple M4, macOS 27.0 (26A5406e). The same Mac and workload are used within each row. Recorded development release builds on the same Mac. These results describe the measured builds, not every release or Mac. Performance for the current download is not established by these comparisons.

| Measurement | Sample type | Before | After | Reduction |
|---|---|---:|---:|---:|
| Unicode inline-heavy parse | p95 | 48.811 ms | 11.212 ms | 77% |
| Fuzzy heading search | Single invocation | 11.036 ms | 0.912 ms | 92% |
| Peak physical footprint | Two fresh-process runs | 449.2 MiB | 204.1–252.2 MiB | 44–55% |

## Test conditions and limits

- Unicode inline-heavy parse: 16,800-byte Unicode line with repeated formatting and links. p95.
- Fuzzy heading search: 12-character query against a 1,500-character heading. Single invocation.
- Peak physical footprint: 1,032,709-byte document; edit, save, undo, scroll, and presentation switches. Two fresh-process runs.

The search result is a single invocation, not a percentile. Memory is the kernel's lifetime maximum physical footprint across two fresh isolated native processes, not live heap or resident memory. The stress test still exceeds the 150 MB peak-memory target. The two-run range is not a percentile or a guaranteed ceiling.

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
| cmark parse | 12.827 ms | 13.309 ms | <250 ms |
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

- [Native performance record](https://github.com/ezzy1630/Downright/blob/ce2cad6deb287fa34d3561615c6655e3eb29a17e/Docs/PERFORMANCE.md)
- Source commit: ce2cad6deb287fa34d3561615c6655e3eb29a17e
- Site payload generated: 2026-10-27T05:24:00.167Z
