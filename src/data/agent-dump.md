# Refactor notes — session 8f3c

## Summary

Refactored the renderer pipeline to isolate decoration from parsing, replaced
the ad-hoc cache with a keyed image store, and updated 14 files. Behavior is
unchanged; **61 tests pass**. Three public signatures moved; every call site is
updated in this changeset.

## Files touched

- `Sources/MarkdownRender/Renderer.swift` — split into `Renderer` + `Decorator`
- `Sources/MarkdownRender/ImageCache.swift` — new, keyed by source hash
- `Sources/MarkdownCore/Parse.swift` — block index now emits ranges
- `Tests/RendererTests.swift` — +9 cases, snapshot fixtures updated

## Decisions

1. **Decoration is not parsing.** The old renderer re-walked the parse tree
   on every keystroke to apply marker elision. Parsing now produces an
   immutable block index; decoration reads it. Keystroke cost drops from
   three passes to one.
2. **The cache belongs to the image, not the document.** Documents swap;
   images persist. Keyed by content hash so the same diagram rendered in
   two documents shares one bitmap.
3. **Ranges, not nodes.** The block index emits byte ranges into the source
   string. Anything that needs the tree can rebuild it; everything that
   needs a location (selection, change marks, Quick Look) uses the range.

## What I did not do

- Did not touch theme resolution. It works and it is load-bearing.
- Did not merge the two line scanners. They look similar; they are not.
  One handles hard wraps, the other handles soft. Merging them cost 40ms
  on a 10k-line file last time we tried.
- Did not add async parsing. The parse budget is 8ms and we spend 0.146ms.
  Async would add complexity the numbers do not justify.

## Signature changes

```swift
// before
func render(_ source: String, theme: Theme) -> NSAttributedString

// after
func render(_ source: String, theme: Theme) -> RenderedDocument
```

`RenderedDocument` carries the attributed string plus the block index, so
callers stop re-parsing to recover positions.

## Test evidence

- 61 passed, 0 failed, 2 skipped (known GPU flake on CI, tracked in #412)
- Benchmark corpus: unchanged from yesterday's run
- Cold launch: 118ms → 121ms (+3ms, within noise, image store registration)

## Open questions for review

1. Should `Decorator` own footnote numbering, or should the parse index?
   Right now numbering survives decoration but not re-parse, which is
   observable if you undo past a footnote insert.
2. The image store keeps 256MB of bitmaps. Under memory pressure we evict
   LRU. Is 256MB the right ceiling for the M-series baseline?
3. `ImageCache` is `@MainActor` because `NSImage` is. If we ever move to
   a background renderer this becomes the hard edge. Flagging now so it
   is a decision, not an accident.

## Next session

- Wire the change-mark dimming timer into `RenderedDocument` dwell state
- Re-run the large-corpus benchmark on the MacBook Air (fanless) baseline
- Draft the migration note for the two downstream packages
