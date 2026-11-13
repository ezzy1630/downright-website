# Downright changelog

Generated from the native app CHANGELOG.md payload.

## 1.0.23 · Fixed

Permission prompts, such as "Read a file from outside this document's folder?", respond to clicks again. Clicks inside the floating Tasks, History, and Document panels no longer land beside the button you pressed. In a short window the prompt keeps every choice visible and separate, scrolling its explanation instead of squeezing the buttons together, and long file names are shortened in the middle so their extension stays readable. ([#56](https://github.com/ezzy1630/Downright/issues/56))

## 1.0.23 · Fixed

Math renders more of the LaTeX written for KaTeX, MathJax, Typora, and Obsidian instead of showing the formula's source. Newly supported: \dfrac, \tfrac, \cfrac, \operatorname, \boldsymbol, \not=, \iint, \big(, \middle|, \tag{1}, \label, and \&; align, align*, equation, gather*, gathered, multline, array, and smallmatrix blocks; and symbols such as \leqslant, \implies, \therefore, \varnothing, and \checkmark. Chinese, Japanese, and Korean text inside \text{} now appears instead of disappearing, as do typed symbols such as α and ≤. ([#55](https://github.com/ezzy1630/Downright/issues/55))

## 1.0.22 · Fixed

Completed image loads now refresh the visible text surface, replacing stuck loading placeholders. Documents with many local images load pictures when they are visible instead of during offscreen layout. Hovering no longer starts repeated loads that can evict the visible picture. Image dimensions survive pixel-cache eviction, and the cache accounts for downsampled pixels correctly. Adjacent image-only lines keep independent image fragments. Unreadable local pictures settle on a missing-image message.

## 1.0.21 · Added

A one-time GitHub star suggestion after five document opens and ten minutes of foreground reading. It waits for idle input, leaves editing focus alone, and keeps eligibility and dismissal state entirely on your Mac.

## 1.0.21 · Added

Local PlantUML rendering for plantuml and puml code fences in the Mac app, alongside existing Mermaid diagrams. No Java installation, WebView, or diagram server is required. Source Focus keeps the original diagram text editable. External includes and downloaded libraries stay disabled; Finder previews retain PlantUML fences as code.

## 1.0.21 · Fixed

Code block backgrounds no longer cover text selection. Selected text uses a contrasting foreground so syntax colours cannot disappear into the highlight.

## 1.0.21 · Fixed

Theme changes during an edit wait for the current parse, preventing a crash from applying the previous document revision's ranges to the new text.

## 1.0.21 · Maintenance

Updated Sparkle to 2.10.1 across SwiftPM, Xcode, and release signing tools, with a consistency check that prevents partial dependency updates.

## 1.0.21 · Maintenance

Updated the pinned GitHub Actions cache and artifact upload actions.

## 1.0.21 · Maintenance

Shared release validation now runs source budgets, native acceptance, and updater acceptance concurrently and requires all three before publication. Added retained diagnostics, explicit skipped coverage, and fixed-seed source and editing checks.

## 1.0.20 · Fixed

Editing and deleting words in document mode preserve the reading position and caret alignment, including in large documents. Stale queued repairs no longer override newer edits or selections, and repeated scroll repairs no longer accumulate fractional position errors.

## 1.0.20 · Fixed

Deferred layout repairs during typing restore the reading position before drawing, avoiding a forced repaint of the intermediate viewport.

## 1.0.19 · Fixed

Editing and deleting words in document mode preserve the visible reading position, including in large documents. Queued layout repairs no longer restore stale positions after a newer edit or selection.

## 1.0.19 · Fixed

Scrolling keeps visible text aligned with caret placement and word deletion.

## 1.0.18 · Added

Inline Markdown images and linked HTML badge rows in the Mac reader. Remote images load only after View → Load Remote Images grants the current document; animated images start paused with Play/Pause controls.

## 1.0.18 · Added

Full width and finite 60-120 character reading measures, carried through reader profiles, HTML export, and Quick Look previews.

## 1.0.18 · Changed

Faster parsing, diffing, syntax highlighting, and decoration. An initial Apple M4 release snapshot improved ten pipeline cases by 30-72%; later conservative comparisons exceeded 25% in seven cases, so that percentage goal is not consistently certified across all ten. [Measurements and limits](https://github.com/ezzy1630/Downright/blob/main/Docs/PERFORMANCE.md#release-pipeline-comparison-2026-10-27) include raw runs and distinguish source-edit timing from visible rendering.

## 1.0.18 · Changed

Lower large-document allocation and layout costs, including compact parsed spans, lazy paragraph presentation, bounded task-panel layers, and shorter lifetimes for parser and mode-transition buffers. The below-150-MB interactive session target remains uncertified; the latest 126.2 MB result covers opening the stress document only.

## 1.0.18 · Fixed

List ornaments retain their marker and interaction metadata after editing continuation paragraphs and undoing the edit, including nested callouts.

## 1.0.18 · Fixed

Source presentation keeps the text view wide enough for its text container.

## 1.0.18 · Fixed

Clicking rendered links works with hidden Markdown syntax, including links on the first line and in later paragraphs.

## 1.0.18 · Fixed

Split panes retain the current document’s remote-image permission. Opening a different file revokes permission without rebuilding stale image ranges.

## 1.0.18 · Maintenance

CI reuses compatible build graphs while retaining source tests, release performance budgets, and packaged-app checks. Automatic CI runs on main; feature branches can run it manually.

## 1.0.17 · Added

Choose what happens when the last document closes in Settings → General → When the last document closes: Show start window, Quit Downright, or Do nothing. Show start window remains the default. ([#42](https://github.com/ezzy1630/Downright/issues/42))

## 1.0.17 · Changed

Reading width follows your choice. Settings → Typography → Measure (characters) now supports 60-110 characters, including reader profiles and HTML export. The default stays at 70; narrow windows fit the column to the available space without overriding the saved setting. ([#41](https://github.com/ezzy1630/Downright/issues/41))

## 1.0.17 · Changed

Faster parsing of long Unicode-heavy lines and outline searches, with lower memory use for large documents. Hidden syntax and split panes materialize layout as needed. [Performance measurements and remaining limits](https://github.com/ezzy1630/Downright/blob/main/Docs/PERFORMANCE.md) distinguish source-edit timing from whole-app rendering and peak memory.

## 1.0.17 · Fixed

Local Markdown links open inside Downright. Sibling paths, encoded filenames, and heading fragments resolve correctly. Back/Forward restores the document and reading position, and failed or cancelled opens leave history unchanged. ([#43](https://github.com/ezzy1630/Downright/issues/43))

## 1.0.17 · Fixed

Deleting an accidental edit clears the save prompt. Returning to the exact saved text by editing or undo clears the edited state without saving. Pending external-file conflicts are still protected.

## 1.0.17 · Fixed

Blank document and split-pane rendering on macOS 26, split reopening and saved split-state restoration, and reading-position jumps during navigation and resizing.

## 1.0.17 · Fixed

Find Next keeps moving through matches after the Find bar closes and refreshes its results when the text changes.

## 1.0.17 · Fixed

Autosave waits for an idle period after the latest edit. Discard keeps implicit saves suppressed until a fresh edit, including after a cancelled quit.

## 1.0.17 · Fixed

Exact-artifact installation reports staging failures and preserves the previous app if the replacement cannot complete.

## 1.0.17 · Maintenance

Updated Sparkle to 2.10.0 with matching build and release-tool pins.

## 1.0.0 · Added

Live editing with byte-for-byte file fidelity (§3.1): read → parse → write round-trips a document exactly, including CRLF/CR line endings, BOM, UTF-16/32, and mixed endings; nothing is normalised that cannot be faithfully restored.

## 1.0.0 · Added

Structural zoom, document outline, reader profiles, and a density rail.

## 1.0.0 · Added

Inline rendering for math (LaTeX), mermaid diagrams, callouts, tables, task lists, wikilinks, and file/path tokens with resolution.

## 1.0.0 · Added

Themes: built-in light/dark palettes plus VS Code / Shiki theme import, and a custom theme store.

## 1.0.0 · Added

No-mutation decoration engine: keystroke → updated render at a budgeted p95 of 8 ms on a 5k-line document (§12), measured by drbench.

## 1.0.0 · Added

Local AI assistance (optional, on-device) with sibling-document scanning, change tracking, and an external-edit conflict bar.

## 1.0.0 · Added

Session restore with per-document state (mode, zoom, fold, scroll, sidebar), native tabs, jump history, command palette, keybindings, and vim keys.

## 1.0.0 · Added

Quick Look preview and Finder thumbnails for Markdown documents.

## 1.0.0 · Added

down CLI for rendering and editing from the terminal, plus the reusable MarkdownCore and MarkdownRender packages.

## 1.0.0 · Added

Front matter editor, table editor, document health checks, tidy pass, smart paste, review sidecars, asset doctor, and diagnostics.

## 1.0.0 · Added

Plain-text fallback: files are opened and rendered; nothing is ever evaluated (.mdx/.qmd executable chunks are rendered as text).

## 1.0.0 · Added

Regression probes locking the mermaid text orientation against the library's known-good render path (MermaidOrientationProbeTests, GeometryProbeTests).

## 1.0.0 · Added

Sparkle 2.9.5 auto-update with a fully custom UI: update pills in document titlebars and the start window, a nonmodal release-notes panel rendered through the app's own MarkdownTextView, and a fully unit-tested update state machine. Dev/ad-hoc bundles omit the Sparkle Info.plist block and ship with the updater disabled; only signed production bundles check for updates.

## 1.0.0 · Added

Signed + notarized release pipeline (.github/workflows/release.yml): Developer ID signing of every nested executable individually (never --deep), notarization, stapling, Sparkle-signed appcast with delta updates, GitHub Release, and GitHub Pages deployment.

## 1.0.0 · Added

Manual release path, scripted: Scripts/sign-and-notarize.sh signs, notarizes, and staples by hand; Scripts/make-dmg.sh packages a drag-install DMG. Scripts/verify-bundle.sh holds both pipelines to one layout contract.

## 1.0.0 · Added

One canonical version source: Config/version.env, verified by Scripts/sync-versions.sh in check.sh and gated in the release workflow.

## 1.0.0 · Added

Privacy manifests (PrivacyInfo.xcprivacy) for the app, Quick Look, and thumbnail bundles declaring the required-reason APIs in use (UserDefaults, file timestamps). No data is collected and nothing tracks.

## 1.0.0 · Added

Quick Look and Finder thumbnails now cover .mdx / .mdc / .qmd / .rmd - the exported com.ezzy.downright.markdown UTI is declared in both extension bundles.

## 1.0.0 · Added

CI gates the §12 performance budget: ci.yml runs drbench in release with budgets enforced (RUN_DRBENCH=1).

## 1.0.0 · Changed

The Tasks panel comes out of the ring that opens it. The panel unfurls downward from the top edge - scaled from its own top, so it grows *away* from the toolbar control rather than out of its middle - and folds back up as the pane gives its width to the document, instead of blinking out of existence. The ring's press belongs to the circle now: the glyph has its own layer, so it compresses and springs back while the plate underneath holds still, and the release wave carries further on the same clock the panel unfurls on.

## 1.0.0 · Changed

The titlebar proxy is a real document proxy. It wears the file's own icon instead of a generic doc.text symbol, and dragging it hands the file to Finder, Mail, or anything else under the pointer.

## 1.0.0 · Changed

The inspector header only carries a section switcher when there is something to switch to. A lone panel gets a slim title-plus-close row instead of a one-segment tab strip; the Search/Tasks/History/Inspector segments appear once a second surface actually opens. Hovering the task panel's section bar no longer swaps the tally for the same sentence about a section - the meter holds still; a click still scrolls. The Tasks toolbar ring presses with its own shape now: the glyph dips, springs back with an overshoot, and emits one quiet accent ping as the panel's content rises in. (Superseded above: the press now lives on the glyph's own layer.) The density rail's marks sit closer together (7-11pt pitch, from 8-13) with the stack ceiling raised to match, so a tall window keeps the same cluster share.

## 1.0.0 · Changed

The Tasks panel is rebuilt around the plan, not the checkboxes. The old header (percent figure, count caption, progress bar, All/Open filter) is replaced by a section-map progress bar - one segment per heading, sized by task count, filled by completion, clickable to jump to a section - with the tally riding at the bar's trailing end. The list answers "what's next" by ordering, not by a duplicate hero card: it is open-first, so the next task is simply the first row, and finished work collapses into a per-section "N completed" pile instead of a wall of struck-through rows. Completion itself is a moment - haptic, drawn check, strike sweep, then the row slides into the pile - followed by an Undo pill, because a tick that writes the file immediately deserves an equally immediate way back. The panel is two-way: quick-add rows (or ⌘N) insert - [ ] … into the right section of the source, and drag reorder moves a task among its siblings with its nested children riding along, both as plain undoable source edits (Restructure.insertTask / moveTask). Section headers carry their remaining count and fold; rows get a context menu (Jump to Source, Mark Complete, Copy Task, Copy Status Report as ready-to-paste Markdown); and Space / Return / ←→ work the whole list from the keyboard.

## 1.0.0 · Removed

The Contents / Outline navigator, and the leading sidebar it pinned into. The density rail already expands into the document's outline on hover, and the command palette already opens headings and files through its Quick Open providers - a third list of the same two things, reachable from a toolbar button, two View items and a Navigate item that all ran the same code, was the document's structure told three times. ⌘⇧K is the one way in. The window is now document-plus-inspector, and NavigationPanelView, OutlinePanelView, SiblingSidebarView, the .outlinePanel / .toggleSidebar / .outlineQuickOpen commands and the "Keep the sibling sidebar open" preference are gone with it.

## 1.0.0 · Fixed

Closing the find bar crashed the app. The exit animation removed the pill from its superview and *then* called removeArrangedSubview(_:). The first call already un-arranges the view, so the second raised out of -[NSStackView _removeView:animated:removeFromViewHierarchy:] and aborted the process - every single time ⌘F's bar was dismissed with motion enabled. Retirement is now ordered and idempotent, so a repeated Escape during the 0.16 s fade is harmless too (regression-pinned).

## 1.0.0 · Fixed

The page teleported out from under the caret while typing. Any parse commit that was not a local edit - a debounced second parse, an external change, a theme or measure change - restored the reading position by scrolling a source offset to .top, which parks that line at the container inset no matter where the reader actually had it. Every commit therefore shoved the page by the leftover fraction of a line plus the inset, and a queued scroll-repair could apply an anchor from several edits earlier. Viewport restores now keep the pixel gap between the viewport's top edge and the anchor line, a scroll repair can never resurrect a stale anchor, and a frame shrink pins the anchor across the clamp (regression-pinned).

## 1.0.0 · Fixed

The caret could land in the empty air above a fenced block. The fence lines are kept in the storage on purpose, but in Document mode their glyphs are suppressed - so a click in the block's top padding resolved to a character part-way along an invisible ``` `swift ```, leaving the caret blinking over nothing and the next keystroke editing a fence the reader could not see. A plain click on either chrome row now aims at the code.

## 1.0.0 · Fixed

The window never remembered its size. setFrameAutosaveName restores the saved frame the moment it is assigned, and the default content size ran unconditionally straight afterwards and threw it away - including for a window left in full screen.

## 1.0.0 · Fixed

A window could come back blank from the Dock or from full screen. TextKit 2 lays out against a viewport it is told about, and those transitions change the bounds without a scroll gesture. The document surface is now re-primed on de-miniaturise, on both full-screen transitions, and on a backing-property change.

## 1.0.0 · Fixed

Opening the Tasks panel shrank the whole window. The fit-to-content "card" the panel floated in was sized by a required Auto Layout height chain, and AppKit's constraint-driven window sizing (_changeWindowFrameFromConstraintsIfNecessary) resized the window frame to the card's height - the window collapsed to ~490pt and never grew back. The inspector is now a docked full-height column like every other panel, and the fit-to-content machinery is gone with the card.

## 1.0.0 · Fixed

The status bar rendered its format strings literally (\(prefix)Ln \(line), Col \(column)) - two escaped interpolations left over from a refactor now show real values again.

## 1.0.0 · Fixed

The History inspector's timestamp caption ran under the Restore button at the inspector's minimum width; it now truncates inside the timeline's track.

## 1.0.0 · Fixed

Math rendered only on the machine that built the app. SwiftMath reached its fonts through SwiftPM's generated Bundle.module, whose two candidates are the bundle *root* (where codesign forbids resources) and an absolute path inside the build directory - so a shipped bundle found neither and the accessor called fatalError, taking the whole Quick Look preview down with the first formula. SwiftMath 1.7.3 is now vendored at Vendor/SwiftMath with a three-line patch that resolves the fonts from the layouts we actually ship (Vendor/SwiftMath/PATCHES.md). MathFontBundle still guards every call as defence in depth, and Scripts/verify-bundle.sh now asserts the fonts in the host app as well as in each .appex.

## 1.0.0 · Fixed

An implicit save could silently clobber a newer on-disk version after an external edit (occlusion autosave, quit, checkbox toggle): saves are now refused until the user resolves the conflict, and only an explicit "keep mine" decision writes over the file.

## 1.0.0 · Fixed

FSEvents retransmissions of the same external write were reported repeatedly while an external write racing a save could be swallowed; both cases are now handled by the suppression window logic in FileWatcher.

## 1.0.0 · Fixed

Clicking the Tasks toolbar button crashed the app. TaskWorklist trusted each task's headingIndex as a live subscript into headings, but the panel rebuilds on every keystroke and can pair a task array captured one parse earlier than the headings it arrives with - the out-of-range subscript was an Index out of range trap. An out-of-range heading now degrades to the "Document" section instead of taking the app down (regression-pinned).

## 1.0.0 · Fixed

An hourglass sliver haunted the task panel's section-map bar. A segment with nothing done gives its fill layer a zero-width frame, and Core Animation still rasterises a capsule corner radius on an empty layer - the two semicircles met as a tiny bowtie of accent colour in the gap between segments. Empty fills are now hidden outright in both bar implementations.

## 1.0.0 · Fixed

Clicking a link, footnote, task, or heading teleported the camera. Every in-document jump scrolled with position: .center, which recentres the page even when the target is already on screen - yanking whatever you were reading out from under the pointer. Navigation now uses .visible: a target already in view doesn't move the page at all, and an off-screen target gets the minimal scroll that brings it in. Back/Forward keep .center because they restore a *recorded* reading position.

## 1.0.0 · Fixed

Stray shading blocks beside and below code blocks. TextKit 2 composites each layout fragment as an independent, lazily-rendered surface, and the code block's closing fence claimed a tinted surface taller than its own band (to make room for its copy control) - a fill that reached past the block's edge and wasn't always painted over when the neighbouring fragment didn't redraw in the same pass. The band now paints exactly its own frame: header and footer round only their *outer* corners, the edges they share with code lines are square and butt flush, and the footer's copy control collapses to fit its thin band instead of forcing the fill to overhang (geometry regression-pinned).

Source commit: 605c9280e13cf1790f0abfadc83a9f6a0f9b55ef
