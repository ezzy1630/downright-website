# Downright engineering

Downright uses AppKit and TextKit 2 for a native Markdown document surface. There is no WebView, browser runtime, remote renderer, or required project database.

Document, Split, and Source Focus views share the same text storage. File watching routes external writes through explicit review, and the same source supports Quick Look, Finder, Spotlight, and the `down` command.
