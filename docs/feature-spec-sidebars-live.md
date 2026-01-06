# Feature Spec: Split-View Sidebars & Live Feedback

## Overview

This feature transforms Markdown Viewer from a simple file viewer into a smart navigation hub. Users can access relevant files instantly through configurable sidebars, a quick switcher, and receive real-time visual feedback when files change on disk.

## Problem Statement

Current pain points:

- **Excessive navigation** — too many clicks to reach frequently used files
- **No memory** — app doesn't remember recent files or user preferences
- **Difficult search** — hard to find files by vague recollection
- **No live feedback** — no awareness of filesystem changes

## Goals

1. Open recent/favorite files in <2 clicks or 1 keyboard shortcut
2. Unified search across filenames, content, and metadata
3. Real-time feedback when files change (subtle, non-intrusive)
4. Scalable to any volume of files (no assumptions on size)
5. Minimal UI by default — features discoverable but not in the way

---

## Feature Components

### 1. Smart File Lists

#### 1.1 Recent Files

- Files recently opened in the app
- Files recently modified (filesystem mtime)
- Ordered by recency, most recent first
- Persisted across sessions

#### 1.2 Favorites

- Manually pinned files
- Drag & drop to reorder
- Persisted across sessions
- Can include files outside configured sources

#### 1.3 Contextual Files (Same Folder)

- All `.md` files in the same directory as the current file
- Updates when switching files

#### 1.4 Related by Tags

- Files sharing tags from frontmatter
- Based on the currently open file's tags
- Dynamic, updates when switching files

#### 1.5 Backlinks

- Files that reference the current file via markdown links `[text](path.md)`
- Requires scanning/indexing of all files
- Dynamic, updates when switching files

**Note:** Wiki-links `[[file]]` are OUT OF SCOPE for this version.

---

### 2. Sidebars

#### 2.1 Architecture

- Multiple sidebars supported simultaneously
- Each sidebar contains one type of file list (Recents, Favorites, etc.)
- Freely positionable: left or right side of the main content

#### 2.2 Behavior

- **Hidden by default** — user activates via settings or keyboard shortcut
- **Collapsible** — can be minimized without removing
- **Resizable** — drag to adjust width
- **Remembers state** — position/visibility persisted

#### 2.3 Item Display

- File name (or frontmatter title if available)
- Relative path hint
- Modified timestamp (relative: "2m ago")
- Tag pills (if applicable)

---

### 3. Quick Switcher (Cmd+P)

#### 3.1 Behavior

- Global keyboard shortcut `Cmd+P` (macOS) / `Ctrl+P` (Windows/Linux)
- Modal overlay with search input
- Fuzzy search
- Keyboard navigation (arrows, enter to select, esc to close)

#### 3.2 Search Scope

Unified search across:

- **Filenames** — fuzzy match on file name
- **Full-text content** — search inside file content
- **Tags** — match frontmatter tags
- **Frontmatter fields** — title, author, date

#### 3.3 Results Display

- Grouped or ranked by relevance
- Shows match context (highlighted snippet)
- Recent/favorite files boosted in ranking

---

### 4. Live File Watching

#### 4.1 Implementation

- **Backend:** Rust `notify` crate with `notify-debouncer-mini`
- **Events:** Pushed to frontend via Tauri `app.emit()`
- **Debouncing:** ~100-300ms to batch rapid changes

#### 4.2 Watched Scope

All files matching any criteria:

- Files in configured sources
- Favorited files (even outside sources)
- Currently open files
- Recent files

#### 4.3 Event Types

| Event    | Action                                                    |
| -------- | --------------------------------------------------------- |
| `Create` | Add to file index, show in "same folder" if applicable    |
| `Modify` | Update index, trigger visual feedback, reload if open     |
| `Remove` | Remove from index, close tab if open, remove from recents |
| `Rename` | Update paths in index, favorites, recents                 |

#### 4.4 Auto-Reload Behavior

- **Silent reload** — no confirmation dialog
- **Scroll position preserved** — restore scroll after reload
- Applies to currently open file when modified externally

---

### 5. Visual Feedback System

All feedback elements are **configurable via Settings** (toggle on/off).

#### 5.1 Badge Dot

- Small colored dot appears on modified file item
- Duration: ~3 seconds then fades out
- Appears in: Recents, Favorites, Same Folder lists

#### 5.2 Tab Border Flash

- Tab of modified open file flashes with accent color
- Brief animation (~500ms)
- Indicates "this file was just reloaded"

#### 5.3 Neon Border-Bottom

Subtle glowing border effect applied to multiple UI elements. Thin line with glow effect.

**Locations (all toggleable independently):**

- **Content area bottom** — neon line at the bottom of the markdown viewer content zone
- **Active tab** — neon underline on the currently open tab in TabBar
- **Active file in sidebars** — neon highlight on the currently open file when it appears in Recents/Favorites/etc.

**Style options (dropdown in Settings, applies to all locations):**

- Theme accent color
- Cyan neon (cyberpunk style)
- Custom color (color picker)
- Animated gradient

#### 5.4 Animated Sort

- When a file is modified, it animates to its new position in Recents
- Smooth transition (~300ms)
- Makes the reordering visible and understandable

---

## Technical Architecture

### Frontend (React + TypeScript)

```
src/
├── components/
│   ├── Sidebar/
│   │   ├── index.tsx          # Existing, to be extended
│   │   ├── SidebarPanel.tsx   # Generic panel container
│   │   ├── RecentsList.tsx
│   │   ├── FavoritesList.tsx
│   │   ├── SameFolderList.tsx
│   │   ├── TagRelatedList.tsx
│   │   └── BacklinksList.tsx
│   ├── QuickSwitcher/
│   │   ├── index.tsx
│   │   ├── SearchInput.tsx
│   │   └── ResultsList.tsx
│   ├── TabBar/
│   │   └── index.tsx          # Extend with neon border
│   └── MarkdownViewer/
│       └── index.tsx          # Extend with neon border-bottom on content
├── stores/
│   ├── sidebarStore.ts        # NEW: sidebar state
│   ├── favoritesStore.ts      # NEW: favorites with persistence
│   ├── recentsStore.ts        # NEW: recent files with persistence
│   ├── fileIndexStore.ts      # NEW: indexed file data for search
│   └── watcherStore.ts        # NEW: file watcher events
├── hooks/
│   ├── useFileWatcher.ts      # Subscribe to Tauri watcher events
│   ├── useQuickSwitcher.ts    # Cmd+P logic
│   └── useLiveIndicator.ts    # Visual feedback timing
└── lib/
    ├── search.ts              # Fuzzy search, full-text search
    └── backlinks.ts           # Parse and index markdown links
```

### Backend (Rust/Tauri)

```
src-tauri/src/
├── main.rs
├── watcher.rs                 # NEW: file watcher module
│   ├── setup_watcher()
│   ├── handle_event()
│   └── emit_to_frontend()
└── commands.rs                # Existing commands
```

### Persistence (Tauri Store)

```json
{
  "favorites": ["/path/to/file1.md", "/path/to/file2.md"],
  "recents": [{ "path": "/path/to/file.md", "openedAt": 1704000000000 }],
  "sidebars": {
    "left": { "type": "recents", "visible": true, "width": 250 },
    "right": { "type": "favorites", "visible": false, "width": 250 }
  },
  "feedbackSettings": {
    "badgeDot": true,
    "tabBorderFlash": true,
    "neonBorderContent": true,
    "neonBorderTab": true,
    "neonBorderSidebar": true,
    "neonStyle": "accent",
    "customNeonColor": "#00ffff",
    "animatedSort": true
  }
}
```

---

## Settings Additions

New settings in the Settings panel:

### Sidebars Section

- Toggle: Show left sidebar
- Toggle: Show right sidebar
- Dropdown: Left sidebar content (Recents/Favorites/Same Folder/Tags/Backlinks)
- Dropdown: Right sidebar content

### Live Feedback Section

- Toggle: Badge dot on modified files
- Toggle: Tab border flash on reload
- Toggle: Neon border on content area
- Toggle: Neon border on active tab
- Toggle: Neon border on active file in sidebars
- Dropdown: Neon style (Accent/Cyan/Custom/Gradient)
- Color picker: Custom neon color (when "Custom" selected)
- Toggle: Animated sort in recents

---

## Constraints

- **No cloud sync** — all data stays local
- **No heavy database** — use Tauri store (JSON-based)
- **Must scale** — no assumptions on file volume, use lazy loading/virtualization
- **Minimal by default** — features hidden until activated

---

## Out of Scope (Future)

- Wiki-links `[[file]]` parsing and navigation
- Multi-window sync
- Cloud backup of favorites/settings
- Full-text search indexing with SQLite

---

## Success Criteria

1. [ ] Can open a recent file in 1 click from sidebar
2. [ ] Can open any file via Cmd+P in <3 keystrokes
3. [ ] File modified externally triggers visible feedback within 1s
4. [ ] UI remains responsive with 1000+ files in sources
5. [ ] All feedback elements can be individually disabled
6. [ ] Sidebar positions persist across app restarts
