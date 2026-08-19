# How to preview Markdown with Quick Look on a Mac

Select a `.md` file in Finder and press Space. Quick Look is the fastest way to check a short Markdown file.

For long documents, editing, or review of an external agent rewrite, open the same file in Downright. Downright renders the local source and shows changed words when another process rewrites the open file.

## If Quick Look shows raw text

1. Confirm the file has a Markdown extension such as `.md`, `.markdown`, `.mdx`, `.qmd`, or `.rmd`.
2. Close the preview and open it again after installing the signed Downright app in `/Applications`; extensions cannot register reliably from a temporary disk image or App Translocation.
3. Use `down doctor` to check the installed bundle, Quick Look extensions, file association, and CLI path. The command supports `--json` for support logs.

Some Macs need Finder or Quick Look to reload its extension cache after an app installation. Reopening Finder is a lower-impact first step; reset system caches only when diagnostics point to registration rather than a missing bundle.

## Quick decision

- Two-second check: Finder and Quick Look.
- Read or edit a long file: Downright.
- Review an agent rewrite: Downright with the file open.

This guide is published by Downright. Product behavior is described from the native app's current bundle and source; Quick Look-only preview remains the lighter choice when you do not need editing or review.
