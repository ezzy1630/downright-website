# How Downright renders Markdown without a WebView

Downright started with a stubborn constraint: the text file had to remain the document. No hidden database, no HTML copy pretending to be the source, and no browser process between the bytes on disk and the page on screen.

That constraint made the app harder to build. It also settled dozens of later decisions. Copying Markdown returns the original characters. Undo stays ordinary text undo. An external tool can rewrite the same file while it is open. Quick Look can use the same parsing rules as the app. If the renderer fails, the source is still intact.

## The document pipeline

Downright reads the file's encoding and line endings, places the exact text in `NSTextStorage`, parses it with Swift Markdown, and runs a small extension pass for syntax such as math, Mermaid fences, callouts, wikilinks, and front matter. The renderer then decorates the affected blocks and lets TextKit 2 lay them out in one `NSTextView`.

```text
file bytes
  -> exact NSTextStorage
  -> Markdown syntax tree
  -> changed block set
  -> native attributes and fragments
  -> TextKit 2 layout
```

The parser is allowed to rebuild the full syntax tree. Layout is the expensive part, so the renderer hashes syntax subtrees and restyles only the blocks that changed. A theme switch can justify a full pass. Correcting one task item cannot.

## Why one text surface matters

A common Markdown architecture has an editor on one side and an HTML preview on the other. It is practical, but it creates two coordinate systems. Selection, scroll position, search results, and undo belong to the editor while the pleasant reading surface belongs to the preview.

Downright uses one text storage and one native view for its reading, live, and source-focused modes. Markdown markers can be visually suppressed, but they are never deleted from storage. A source-to-display map connects visible positions back to the original offsets. Inline markers reveal near the caret, and input-method composition temporarily suspends hiding in the active paragraph.

This work is fussy. TextKit can report positions in substituted text, paragraph fragments can span ranges that do not look contiguous, and a caret must survive relayout. The payoff is simple behavior: change modes and the selection stays put; copy as Markdown and the bytes are still yours.

## External changes are document events

Coding agents and formatters rarely edit a file one character at a time. They often write a temporary file and rename it over the original. Watching only the original inode will eventually miss an update because that inode has disappeared.

Downright watches the parent directory with FSEvents, matches the filename, and rechecks the file after every relevant event. A slower timestamp poll covers filesystems where FSEvents is less dependable. Short bursts are coalesced because an agent may write a plan several times in a few seconds.

Each incoming version is saved in a content-addressed local snapshot store. If the current buffer is clean, the new text can be applied while the app restores the reader's heading, selection, and scroll position. If the buffer has unsaved work, the save path refuses to overwrite the newer disk version. The app exposes Keep Mine, Take Theirs, and review controls instead.

The review baseline moves only when the reader finishes reviewing. That detail prevents a burst of five writes from showing only the difference between write four and write five. The useful question is what changed since the person last signed off.

## Sharing code with Quick Look without sharing assumptions

The app, Quick Look preview, Finder thumbnail, Spotlight importer, and `down` command do not all run in the same environment. The Quick Look extension has a hard memory ceiling and can be killed without warning. It renders an initial block set for large files, polls its resident memory, and falls back to plain text before the host terminates it.

The targets share parsing and rendering contracts, not a giant application object. MarkdownCore has no UI dependency. MarkdownRender owns AppKit drawing. The app owns windows, file access, and user decisions. That boundary keeps the preview useful without teaching a Finder extension about workspaces, accounts, or agent sessions.

## What I would keep if I rebuilt it

I would keep the source-first rule. It rules out a few shortcuts, but it gives failures a safe floor. A bad decoration can be removed. A parser can fall back to plain text. A stale external write can be reviewed. None of those failures requires reconstructing the user's file from a second representation.

I would also keep performance budgets close to the code. Downright tracks parse time, external text-diff time, Quick Look render time, and extension memory. Native does not automatically mean fast. It only gives you the tools to measure the actual work.

Source: [architecture](https://github.com/ezzy1630/Downright/blob/main/Docs/ARCHITECTURE.md), [file watcher](https://github.com/ezzy1630/Downright/blob/main/Sources/DownrightApp/AI/FileWatcher.swift), and [performance budgets](https://github.com/ezzy1630/Downright/blob/main/Docs/PERFORMANCE.md).
