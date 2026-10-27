import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { parseBenchmarkPayload } from "./generate-app-data.ts";

const baseline = `
## Budgets
| Metric | Target | Method | Pass condition |
|---|---|---|---|
| Keystroke response, 5,000-line file | <8 ms | release | p95 below target |

## Historical pipeline baseline
| Measurement | p50 | p95 | Result |
|---|---|---|---|
| Source edit and paragraph map | 0.146 ms | 0.153 ms | Under budget |
| Parse 100 KB | 12.078 ms | 12.395 ms | Historical corpus was roughly 48 KB |

## Measurement procedure
Run release builds.
`;

test("renaming the native baseline section preserves published measurements", () => {
  const payload = parseBenchmarkPayload(baseline);
  assert.equal(payload.rows.length, 2);
  assert.equal(payload.rows[0].p95, "0.153 ms");
  assert.equal(payload.rows[0].target, "<8 ms");
});

test("legacy native documents still preserve their baseline", () => {
  const payload = parseBenchmarkPayload(baseline.replace("Historical pipeline baseline", "Current local benchmark"));
  assert.equal(payload.rows.length, 2);
});

test("the historical short-corpus number is never represented as a 100 KB measurement", () => {
  const payload = parseBenchmarkPayload(baseline);
  assert.equal(payload.rows[1]?.measurement, "Small-document parse (~48 KB)");
  assert.equal(payload.rows[1]?.p95, "12.395 ms");
  assert.equal(payload.rows[1]?.target, "Informational");
});

test("missing baseline measurements fail instead of publishing an empty table", () => {
  assert.throws(() => parseBenchmarkPayload("# Performance\nNo measurements."), /baseline/i);
});

const comparisons = `
## Local optimization check (2026-10-25)
Release builds on Apple M4, macOS 27.0 (26A5406e), based on checkout
\`9be0680ec7131dffb8af9a64b6cdbcdb274d3292\` plus the local performance changes.
| Measurement | Before | After |
|---|---:|---:|
| Unicode inline-heavy parse, p95 | 48.811 ms | 11.212 ms |
| Fuzzy match, 12-character query / 1,500-character heading, single invocation | 11.036 ms | 0.912 ms |

The native stress document is measured separately.
### Session-memory continuation
| Native session measurement | Before | After |
|---|---:|---:|
| Lifetime peak physical footprint | 449.2 MiB | 204.1–252.2 MiB |

The workload starts with a fresh isolated release host.
`;

test("comparisons keep sample types distinct and derive conservative improvement ranges", () => {
  const payload = parseBenchmarkPayload(comparisons + baseline);
  assert.equal(payload.optimizations.machine, "Apple M4, macOS 27.0 (26A5406e)");
  assert.deepEqual(payload.optimizations.rows.map(({ statistic, reduction }) => ({ statistic, reduction })), [
    { statistic: "p95", reduction: "77%" },
    { statistic: "Single invocation", reduction: "92%" },
    { statistic: "Two fresh-process runs", reduction: "44–55%" },
  ]);
  assert.equal(payload.optimizations.rows[2].after, "204.1–252.2 MiB");
});

test("non-improving results cannot silently become improvement claims", () => {
  assert.throws(() => parseBenchmarkPayload(comparisons.replace("11.212 ms", "60.000 ms") + baseline), /not an improvement/);
});

test("incomparable units cannot become improvement claims", () => {
  assert.throws(() => parseBenchmarkPayload(comparisons.replace("0.912 ms", "0.912 MiB") + baseline), /matching measurement units/);
});

const published = JSON.parse(readFileSync(new URL("../src/data/app/benchmarks.json", import.meta.url), "utf8"));

test("published speeds use the final conservative repeats, not the faster initial snapshot", () => {
  assert.equal(published.pipeline.rows.length, 10);
  const fullParse = published.pipeline.rows.find((row) => row.measurement === "Full parse");
  assert.equal(fullParse.before, "27.477 ms");
  assert.equal(fullParse.after, "20.807 ms");
  assert.equal(fullParse.reduction, "24.3%");
  assert.equal(published.pipeline.rows.find((row) => row.measurement === "Parse 100 KB").after, "16.489 ms");
});
