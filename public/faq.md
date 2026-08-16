# Downright FAQ

Updated August 2026.

## Is Downright free?

Yes. Downright is free and MIT licensed. The download has no account gate.

## Does Downright modify my files?

No. The renderer decorates your Markdown without changing its bytes. External-write review makes an agent rewrite explicit before you choose what to keep.

## Does it work with Claude Code or other coding agents?

Yes, with ordinary Markdown files. Downright watches the file you have open, marks an external rewrite, and offers Keep Mine or Take Theirs. It does not require a provider-specific integration.

## Does Downright replace Quick Look?

No. Quick Look is useful for a fast Finder preview. Downright is the deeper read, edit, and review surface for the same file.

## Is there a one-line installer?

Yes. On macOS, run:

```bash
curl -fsSL https://downright.cc/install | bash
```

If Node.js 18 or newer is already installed, run:

```bash
npx --yes downright-installer
```

Both paths install the same rolling signed main-channel DMG into
`/Applications` and keep Sparkle updates enabled.

## Is there a Homebrew cask?

Yes. Install the production app from the public tap:

```bash
brew tap ezzy1630/downright && brew trust --cask ezzy1630/downright/downright && brew install --cask downright
```

It resolves to the same rolling DMG as the website, curl, and npm paths, installs
Downright into `/Applications`, and keeps Sparkle updates. The
tap-free `brew install --cask downright` form still depends on official
Homebrew Cask review.

## Why might macOS warn about the app?

macOS can warn when a downloaded app has not yet cleared its quarantine, signing, or notarization path. Use the official release artifact and follow the release notes. A warning is not a reason to bypass Gatekeeper blindly.

## What are the system requirements?

Downright supports macOS 14.0 and newer. It is a native macOS app, not a WebView wrapper.

## Does Downright need an account or cloud sync?

No. Reading, editing, rendering, and external-write review work locally. Apple Intelligence is optional, on-device, and off by default.

## What license does Downright use?

Downright is released under the MIT license. The source repository and release facts are linked from the site.

Updated from the [native privacy document](https://github.com/ezzy1630/Downright/blob/main/Docs/PRIVACY.md) and the current [release record](/known-gaps).
