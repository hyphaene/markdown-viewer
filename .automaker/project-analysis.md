# Project Analysis: Markdown Viewer

## Overview

This is a **pre-implementation project** currently in the specification/planning phase. The repository contains design documentation but no source code has been implemented yet.

---

## 1. Project Structure and Architecture

### Current File Structure
```
markdown-viewer/
├── .automaker/                    # Automated code generation configuration
│   └── categories.json           # Categories for code generation tasks
├── .git/                         # Git repository (initialized, no commits)
├── SPEC.md                       # Product specification document
└── [No implementation files yet]
```

### Planned Architecture
The specification outlines an **Electron desktop application** with clear process separation:

| Process | Purpose | Location |
|---------|---------|----------|
| **Main Process** | File I/O, OS integration, IPC handlers | `src/main/` |
| **Renderer Process** | React UI, state management | `src/renderer/` |
| **Shared** | TypeScript types and utilities | `src/shared/` |

---

## 2. Main Technologies and Frameworks

### Planned Tech Stack

| Category | Technology |
|----------|------------|
| **Desktop Framework** | Electron |
| **UI Framework** | React |
| **Language** | TypeScript |
| **State Management** | Zustand |
| **Styling** | Tailwind CSS |
| **Markdown Rendering** | react-markdown + remark-gfm |
| **Syntax Highlighting** | Shiki |
| **Client-side Search** | MiniSearch |
| **File Watching** | chokidar |
| **Configuration Storage** | electron-store |

---

## 3. Key Components and Their Responsibilities

### Main Process Components (Planned)
| Component | Responsibility |
|-----------|----------------|
| `index.ts` | Electron main entry point |
| `file-scanner.ts` | File system scanning and watching |
| `ipc-handlers.ts` | Inter-Process Communication handlers |

### Renderer Process Components (Planned)
| Component | Responsibility |
|-----------|----------------|
| `App.tsx` | Root React component |
| `Sidebar/` | File tree and search results navigation |
| `MarkdownViewer/` | Markdown content rendering |
| `SearchBar/` | Global search interface |
| `Settings/` | Application settings panel |
| `hooks/` | Custom React hooks |
| `stores/` | Zustand state management |

### Core Features
1. **File Scanning & Indexing** - Scans configurable directories for `.md`/`.mdx` files
2. **Search Functionality** - Fuzzy filename + full-text content search
3. **Markdown Visualization** - GFM rendering with syntax highlighting
4. **External Integrations** - Open in VS Code, copy paths, reveal in Finder

---

## 4. Build and Test Commands

### Status: Not Yet Configured

The project has no `package.json` or build configuration yet. Based on the planned tech stack, expected commands would include:

```bash
# Expected development commands (to be implemented)
npm run dev          # Development mode with hot reload
npm run build        # Build Electron app
npm run test         # Run test suite
npm run start        # Start packaged app
npm run make         # Package for distribution
```

### Planned Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Focus search |
| `Cmd+O` | Open in VS Code |
| `Cmd+Shift+C` | Copy file path |
| `Cmd+,` | Open settings |
| `↑/↓` | Navigate results |
| `Enter` | Select file |

---

## 5. Existing Conventions and Patterns

### Architectural Patterns (From Specification)

**IPC Communication Pattern:**
```
Main → Renderer: 'files:indexed', 'file:changed', 'file:added', 'file:removed'
Renderer → Main: 'files:scan', 'file:read', 'file:open-vscode', 'file:reveal', 'settings:get', 'settings:set'
```

**Configuration Schema:**
```json
{
  "sources": [
    { "path": "~/Code", "enabled": true },
    { "path": "~/Notes", "enabled": true }
  ],
  "exclusions": ["node_modules", ".git", "vendor", "dist", "build"],
  "theme": "system",
  "lastOpenedFile": "/path/to/file.md"
}
```

### Code Organization Conventions
- **Process Separation** - Clear Electron main/renderer boundary
- **TypeScript** - Full type safety across the application
- **Component-based UI** - React component hierarchy
- **Hook-based Logic** - React hooks for stateful components
- **Store-based State** - Zustand stores for global state

### UI/UX Conventions
- **Two-panel layout** - Sidebar (navigation) + Main panel (content)
- **Read-only mode** - No file editing (VS Code integration for editing)
- **System-aware theming** - Dark/Light mode support

---

## Summary

| Aspect | Status |
|--------|--------|
| **Development Phase** | Planning/Specification |
| **Implementation** | Not started |
| **Documentation** | Complete (SPEC.md) |
| **Git Repository** | Initialized, no commits |

The markdown-viewer is designed as a desktop application for discovering, searching, and viewing Markdown documentation scattered across a developer's machine. The planned architecture follows modern best practices with clear separation of concerns, type safety via TypeScript, and a well-chosen technology stack suited for the use case.