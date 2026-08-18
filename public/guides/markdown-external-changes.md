# Review Markdown files changed by another process

When Claude Code, Codex, a script, or another process rewrites an open Markdown file, Downright treats the rewrite as a review event. It compares the local and external versions, marks changed words, and lets you keep your version or take the external version.

The source file remains the authority. Downright does not silently replace dirty work or move the document into a separate database.

## Why the file can change without a simple edit

Many tools write a temporary file, flush it, and rename it over the original. That atomic replace changes the file identity even though the path is the same. A directory watcher is therefore more reliable than watching only one inode, and a timestamp alone is not enough to explain what happened.

A dirty local buffer makes the distinction important. Blindly reloading the path can erase text that has not been saved yet; ignoring the event can leave the reader looking at an obsolete plan. The safe sequence is to read the new bytes, preserve a local baseline, calculate a difference, and make the decision visible.

## Reproduce the workflow

1. Open a Markdown file in Downright and leave the document at a heading or task list.
2. In a terminal, edit the file with Claude Code, Codex, a script, or an atomic temp-file-and-rename operation.
3. Watch Downright keep the document available while the external changes are marked.
4. Use the review surface to keep local work, take the file on disk, or inspect the changed words before deciding.
