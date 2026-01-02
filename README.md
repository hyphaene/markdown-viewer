# Markdown Viewer

A lightweight, native macOS app for browsing and reading markdown files.

## Features

- **Directory scanning** — Point to your folders and browse all `.md` files
- **Live reload** — Files update automatically when modified
- **Syntax highlighting** — Code blocks with proper highlighting
- **Table of contents** — Auto-generated from headings
- **Fuzzy search** — Find files quickly
- **Dark mode** — Follows system preference or manual toggle
- **Auto-update** — Get notified when new versions are available

## Installation

Download the latest `.dmg` from [Releases](https://github.com/hyphaene/markdown-viewer/releases).

After mounting the DMG and copying to Applications, run:

```bash
xattr -cr /Applications/Markdown\ Viewer.app
```

This clears the quarantine flag (required for unsigned apps).

## Development

```bash
pnpm install
pnpm tauri dev
```

## Tech Stack

- [Tauri 2](https://tauri.app) — Native app framework
- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)

## License

MIT
