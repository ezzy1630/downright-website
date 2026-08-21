# Download Downright for macOS

Downright is a free, open-source native Markdown editor and viewer for macOS 14 or newer.

## Install

- Direct DMG: https://github.com/ezzy1630/Downright/releases/latest/download/Downright.dmg
- Homebrew cask: `brew tap ezzy1630/downright && brew trust --cask ezzy1630/downright/downright && brew install --cask downright`
- Shell installer: `curl -fsSL https://downright.cc/install | bash`
- npm launcher: `npx --yes downright-installer`

All four paths resolve to the same rolling `Downright.dmg`. The installer verifies the published checksum and app signature, installs into Applications, registers system integrations, and leaves Sparkle updates enabled; each verified push to the app's `main` branch becomes the next Sparkle update.
