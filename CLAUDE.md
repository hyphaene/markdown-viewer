# Markdown Viewer

## Worktrees

Location: `~/Code/worktrees/markdown-viewer/`

## Stack

- Tauri v2 (Rust backend)
- React + TypeScript
- Tailwind CSS
- Zustand (state)

## Commands

```bash
npm run tauri dev    # Dev mode
npm run build        # Build frontend
```

## Release workflow

PR-based: feature branch → PR with user-centric body → squash merge → semantic-release uses PR body as release notes.
