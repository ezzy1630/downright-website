# How to review Markdown changed by another process

You have a plan open. A coding agent rewrites it. The window refreshes, the heading you were reading moves, and the paragraph you meant to question is gone. Nothing crashed, but the review failed.

A file watcher can tell you that bytes changed. A useful document app also has to preserve unsaved work, explain the difference, and keep the reader oriented. Downright treats an external write as a document event, not a command to reload blindly.

## Why watching one file is not enough

Many editors, formatters, build tools, and coding agents save atomically. They write a complete temporary file, flush it, and rename it over the original path. Readers never see a half-written document, which is good. The tradeoff is that the original inode disappears.

A watcher attached only to that inode may fire once and then quietly stop. Downright watches the parent directory with FSEvents, filters events to the open filename, and stats the path again. It also keeps a slower polling fallback for networked and virtualized filesystems.

File events arrive in bursts. One request can produce a draft, a correction, and a formatter pass within seconds. Downright coalesces the low-level events, then waits for a short quiet period at the document layer before applying the settled version.

## Keep three versions straight

An external-change workflow needs more than "old" and "new." There may be three distinct texts:

- The last version the reader finished reviewing.
- The current in-memory buffer, which may contain unsaved edits.
- The newest bytes on disk.

Downright keeps the review baseline separate from the live buffer. Every incoming write is compared with that baseline until the reader clears the marks or chooses a version. If an agent writes five times, the final marks describe everything changed since the last review, not only the fifth write.

Incoming text is also stored in a content-addressed local snapshot. Identical versions deduplicate, and retention rules limit the store. Restoring a snapshot becomes an ordinary text edit with undo. The app never performs a hidden file replacement behind the document.

## Clean and dirty buffers need different policies

When the buffer is clean, Downright can apply the disk version. Before relayout it records the current selection, the source offset near the top of the viewport, and a nearby heading. After the change it restores the best available anchor and marks the changed words.

When the buffer is dirty, automatic replacement would destroy local work. Downright stores the incoming version as a pending conflict and blocks normal saves from overwriting it. Dismissing the conflict bar does not remove that protection. The conflict remains until the reader explicitly chooses Keep Mine or Take Theirs.

This policy has an awkward but honest consequence: a save can be refused. That is better than claiming success after silently erasing either the local edit or the external rewrite.

## Try the workflow

1. Open a Markdown file in Downright and place the window beside Terminal.
2. Leave the document clean, then use a script or coding agent to rewrite one paragraph.
3. Confirm that the document updates in place and the changed words remain marked.
4. Edit a different paragraph in Downright without saving.
5. Rewrite the file from Terminal again. The app should show a conflict rather than replacing either version.
6. Inspect both choices, then resolve the conflict deliberately.

## A small atomic-write test

```sh
cp PLAN.md PLAN.md.tmp
printf '\n## New constraint\n\nKeep the export offline.\n' >> PLAN.md.tmp
mv PLAN.md.tmp PLAN.md
```

The path stays `PLAN.md`, but the file identity changes. A robust app notices the directory event, reopens the path, and compares the new bytes with a stable baseline.

## What the UI should answer

A good review surface answers four questions without sending the reader hunting through history: Did the file change? Which words changed? Is my unsaved work safe? What will each choice do?

That is the standard Downright aims for. The implementation is local and provider-independent. It works the same way whether the writer was Claude Code, Codex, a formatter, a shell script, Dropbox, or another editor.

Source: [watcher implementation](https://github.com/ezzy1630/Downright/blob/main/Sources/DownrightApp/AI/FileWatcher.swift), [document conflict policy](https://github.com/ezzy1630/Downright/blob/main/Sources/DownrightApp/AI/MarkdownDocument.swift), and [plan review checklist](https://downright.cc/guides/review-claude-code-plans/).
