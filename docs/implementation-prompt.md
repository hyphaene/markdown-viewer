# Implementation Prompt: Split-View Sidebars & Live Feedback

## Context

You are implementing a major feature for **Markdown Viewer**, a Tauri v2 desktop app (React + TypeScript frontend, Rust backend).

**Working directory:** `/Users/maximilien/Code/worktrees/markdown-viewer/feat-split-view-sidebars`

**Specification document:** `docs/feature-spec-sidebars-live.md`

Read the full specification before starting. This prompt provides implementation guidance and phasing.

---

## Existing Codebase Summary

### Stack

- Tauri v2 (Rust backend)
- React 18 + TypeScript
- Tailwind CSS
- Zustand (state management)

### Key Existing Files

| File                                | Purpose                                             |
| ----------------------------------- | --------------------------------------------------- |
| `src/stores/fileStore.ts`           | File list state                                     |
| `src/stores/settingsStore.ts`       | App settings with persistence                       |
| `src/stores/tabStore.ts`            | Open tabs state                                     |
| `src/types/index.ts`                | TypeScript types (FileEntry, Settings, Frontmatter) |
| `src/lib/markdown.ts`               | Markdown parsing, frontmatter extraction            |
| `src/components/Sidebar/index.tsx`  | Existing sidebar (file tree)                        |
| `src/components/TabBar/index.tsx`   | Tab bar for open files                              |
| `src/hooks/useKeyboardShortcuts.ts` | Existing keyboard shortcuts                         |

### Existing Types

```typescript
interface Frontmatter {
  title?: string;
  date?: string;
  tags?: string[];
  author?: string;
}

interface FileEntry {
  path: string;
  name: string;
  modified: number;
  size: number;
  frontmatter?: Frontmatter;
}

interface Settings {
  sources: Source[];
  exclusions: string[];
  theme: "light" | "dark" | "system";
  fontSize: number;
  contentPadding: number;
  contentMargin: number;
  lastOpenedFile: string | null;
}
```

---

## Implementation Phases

Implement in this order. Each phase should be functional and testable before moving to the next.

### Phase 1: Foundation (Stores & Types)

**Goal:** Set up state management infrastructure.

**Tasks:**

1. Extend `src/types/index.ts` with new types:

   ```typescript
   interface RecentFile {
     path: string;
     openedAt: number;
   }

   interface SidebarConfig {
     type: "recents" | "favorites" | "sameFolder" | "tags" | "backlinks";
     visible: boolean;
     width: number;
   }

   interface SidebarState {
     left: SidebarConfig | null;
     right: SidebarConfig | null;
   }

   type NeonStyle = "accent" | "cyan" | "custom" | "gradient";

   interface FeedbackSettings {
     badgeDot: boolean;
     tabBorderFlash: boolean;
     neonBorderContent: boolean; // bottom of markdown content area
     neonBorderTab: boolean; // active tab underline
     neonBorderSidebar: boolean; // active file in sidebar lists
     neonStyle: NeonStyle;
     customNeonColor: string;
     animatedSort: boolean;
   }
   ```

2. Create `src/stores/recentsStore.ts`:
   - Store recent files (max 50)
   - Persist to Tauri store
   - Methods: `addRecent(path)`, `removeRecent(path)`, `clearRecents()`

3. Create `src/stores/favoritesStore.ts`:
   - Store favorite file paths
   - Persist to Tauri store
   - Methods: `addFavorite(path)`, `removeFavorite(path)`, `reorderFavorites(paths)`, `isFavorite(path)`

4. Create `src/stores/sidebarStore.ts`:
   - Store sidebar configuration (left/right)
   - Persist to Tauri store
   - Methods: `setSidebarType(side, type)`, `toggleSidebar(side)`, `setSidebarWidth(side, width)`

5. Extend `src/stores/settingsStore.ts`:
   - Add `feedbackSettings: FeedbackSettings`
   - Methods to update each feedback setting

**Validation:** All stores persist correctly across app restarts.

---

### Phase 2: Sidebar UI Components

**Goal:** Render sidebars with file lists.

**Tasks:**

1. Create `src/components/SidebarPanel/index.tsx`:
   - Generic container for sidebar content
   - Resizable (drag handle)
   - Collapsible
   - Accepts `position: 'left' | 'right'`

2. Create file list components in `src/components/SidebarPanel/`:
   - `RecentsList.tsx` — shows recentsStore files
   - `FavoritesList.tsx` — shows favoritesStore files, drag to reorder
   - `SameFolderList.tsx` — files in same directory as current file
   - `TagRelatedList.tsx` — files with matching tags
   - `BacklinksList.tsx` — files linking to current file

3. Create `src/components/FileListItem/index.tsx`:
   - Reusable file item component
   - Shows: name (or frontmatter title), relative path, modified time, tags
   - Click to open file
   - Right-click context menu: Add/Remove favorite, Open in new tab

4. Update `src/App.tsx`:
   - Render left and right sidebars based on sidebarStore
   - Layout: `[LeftSidebar?] [MainContent] [RightSidebar?]`

5. Add CSS animations in Tailwind:
   - Slide in/out for sidebar visibility
   - Smooth width transition for resize

**Validation:** Can toggle sidebars, see file lists, click to open files.

---

### Phase 3: Quick Switcher (Cmd+P)

**Goal:** Implement command palette for file search.

**Tasks:**

1. Create `src/stores/fileIndexStore.ts`:
   - Index all files from sources
   - Store: path, name, content snippet, frontmatter
   - Method: `search(query)` returns ranked results

2. Create `src/lib/search.ts`:
   - Fuzzy search on filenames
   - Full-text search on content
   - Tag/frontmatter search
   - Combine and rank results

3. Create `src/components/QuickSwitcher/index.tsx`:
   - Modal overlay (centered, 60% width)
   - Search input with autofocus
   - Results list with keyboard navigation
   - Shows: filename, path, match snippet highlighted

4. Update `src/hooks/useKeyboardShortcuts.ts`:
   - Add `Cmd+P` / `Ctrl+P` to open QuickSwitcher
   - `Escape` to close
   - `ArrowUp/Down` to navigate
   - `Enter` to select

**Validation:** Cmd+P opens switcher, search works, can navigate and select with keyboard.

---

### Phase 4: Rust File Watcher

**Goal:** Watch filesystem and emit events to frontend.

**Tasks:**

1. Add dependencies to `src-tauri/Cargo.toml`:

   ```toml
   notify = "6"
   notify-debouncer-mini = "0.4"
   ```

2. Create `src-tauri/src/watcher.rs`:

   ```rust
   // Setup watcher for given paths
   pub fn setup_watcher(app: AppHandle, paths: Vec<PathBuf>) -> Result<()>

   // Handle debounced events
   fn handle_event(app: &AppHandle, event: DebouncedEvent)

   // Event payload struct
   #[derive(Serialize, Clone)]
   struct FileEvent {
     event_type: String, // "create" | "modify" | "remove" | "rename"
     path: String,
     old_path: Option<String>, // for rename
   }
   ```

3. Create Tauri commands in `src-tauri/src/commands.rs`:
   - `start_watching(paths: Vec<String>)` — start/restart watcher
   - `stop_watching()` — cleanup watcher

4. Emit events via `app.emit("file-changed", payload)`

5. Create `src/hooks/useFileWatcher.ts`:
   - Subscribe to `file-changed` events
   - Call appropriate store methods on each event type
   - Trigger visual feedback

**Validation:** Modify a file externally, see console log of event in frontend.

---

### Phase 5: Visual Feedback System

**Goal:** Show visual indicators when files change.

**Tasks:**

1. Create `src/hooks/useLiveIndicator.ts`:
   - Track which files have recent changes
   - Auto-clear after 3 seconds
   - Respect feedbackSettings

2. Update `src/components/FileListItem/index.tsx`:
   - Add badge dot when file recently changed
   - Fade out animation after 3s

3. Update `src/components/TabBar/index.tsx`:
   - Add border flash animation on reload
   - Add neon border-bottom on active tab (when `neonBorderTab` enabled)
   - Neon styles: accent, cyan, custom color, animated gradient

4. Update `src/components/MarkdownViewer/index.tsx`:
   - Add neon border-bottom at the bottom of the content area (when `neonBorderContent` enabled)
   - Same style options as tab

5. Update `src/components/FileListItem/index.tsx`:
   - Add neon highlight on item when it's the currently open file AND `neonBorderSidebar` enabled
   - Use border-left or border-bottom depending on design

6. Create CSS for neon effect (reusable across all locations):

   ```css
   .neon-border-accent {
     /* theme color glow */
     box-shadow:
       0 0 5px var(--accent-color),
       0 0 10px var(--accent-color);
   }
   .neon-border-cyan {
     /* #00ffff glow */
     box-shadow:
       0 0 5px #00ffff,
       0 0 10px #00ffff,
       0 0 20px #00ffff;
   }
   .neon-border-custom {
     /* var(--custom-neon-color) */
     box-shadow:
       0 0 5px var(--custom-neon-color),
       0 0 10px var(--custom-neon-color);
   }
   .neon-border-gradient {
     /* animated gradient - use pseudo-element with moving gradient */
     background: linear-gradient(90deg, #ff00ff, #00ffff, #ff00ff);
     background-size: 200% 100%;
     animation: neon-gradient 2s linear infinite;
   }
   ```

7. Update `src/components/SidebarPanel/RecentsList.tsx`:
   - Animate item position change when order changes
   - Use `framer-motion` or CSS transitions

**Validation:** Edit file externally, see badge dot appear, see tab flash, see neon border on content area, see active file highlighted in sidebar, see recents list reorder with animation.

---

### Phase 6: Auto-Reload & Scroll Preservation

**Goal:** Reload open file when modified, preserve scroll.

**Tasks:**

1. Update file loading logic:
   - Store scroll position before reload
   - Restore scroll position after content updates

2. In `useFileWatcher.ts`:
   - On `modify` event for open file, trigger reload
   - Pass "preserve scroll" flag

3. Handle edge cases:
   - File deleted while open: close tab, show notification
   - File renamed: update tab path

**Validation:** Edit open file in external editor, content updates, scroll position preserved.

---

### Phase 7: Settings UI

**Goal:** Add settings controls for new features.

**Tasks:**

1. Update `src/components/Settings/index.tsx`:
   - Add "Sidebars" section
   - Add "Live Feedback" section

2. Sidebars settings:
   - Toggle: Show left sidebar
   - Toggle: Show right sidebar
   - Dropdown: Left sidebar type
   - Dropdown: Right sidebar type

3. Feedback settings:
   - Toggle: Badge dot
   - Toggle: Tab border flash
   - Toggle: Neon border on content area
   - Toggle: Neon border on active tab
   - Toggle: Neon border on active file in sidebars
   - Dropdown: Neon style (Accent/Cyan/Custom/Gradient)
   - Color picker: Custom neon color (shown when "Custom" selected)
   - Toggle: Animated sort

**Validation:** All toggles work, settings persist, UI updates immediately.

---

### Phase 8: Backlinks & Tag Indexing

**Goal:** Index markdown links and enable backlinks/tag views.

**Tasks:**

1. Create `src/lib/backlinks.ts`:
   - Parse markdown links: `[text](path.md)`, `[text](./relative.md)`
   - Build reverse index: `{targetPath: [sourceFiles]}`

2. Update `src/stores/fileIndexStore.ts`:
   - Index links on file scan
   - Update index on file change events
   - Method: `getBacklinks(path)` returns files linking to path
   - Method: `getFilesByTag(tag)` returns files with tag

3. Update `BacklinksList.tsx` and `TagRelatedList.tsx`:
   - Use indexed data
   - Update when current file changes

**Validation:** Open file with backlinks, see them listed. Open file with tags, see related files.

---

## Code Quality Guidelines

1. **Existing patterns:** Follow existing code style in the repo
2. **TypeScript:** Strict types, no `any`
3. **Zustand:** Use existing store patterns (see `settingsStore.ts`)
4. **Tailwind:** Use existing design tokens/classes
5. **Performance:** Virtualize long lists, debounce search input
6. **Accessibility:** Keyboard navigation, focus management

---

## Testing Checklist

After each phase, verify:

- [ ] Feature works as expected
- [ ] No TypeScript errors
- [ ] App builds: `npm run build`
- [ ] App runs: `npm run tauri dev`
- [ ] Settings persist across restart
- [ ] No console errors

---

## Commands Reference

```bash
# Development
npm run tauri dev

# Build
npm run build

# Check types
npx tsc --noEmit

# Format
npm run format
```

---

## Image Generation Prompt

Use this prompt with an AI image generator to visualize the feature. Provide a screenshot of the current app as input.

```
Transform this screenshot of a markdown viewer desktop app to add the following UI elements while preserving the existing design style and color scheme:

LEFT SIDEBAR (new, ~250px wide):
- Header "Recents" with collapse icon
- List of 5-6 file items, each showing:
  - File name in medium weight
  - Faint relative path below
  - Relative timestamp on the right ("2m ago", "1h ago")
- One item has a small glowing cyan dot on the left (indicating recently modified)
- ONE item is the currently open file: it has a subtle neon glow effect on its left border (cyan/turquoise, thin glowing line)

RIGHT SIDEBAR (new, ~250px wide):
- Header "Favorites" with collapse icon
- List of 4-5 file items with star icons
- Same item style as left sidebar
- The currently open file (if present) also has the neon left-border glow

ACTIVE TAB ENHANCEMENT:
- The currently active tab has a thin glowing neon border-bottom
- Cyan/turquoise color (#00FFFF) with soft glow effect
- Thin and elegant, not overwhelming

CONTENT AREA NEON BORDER:
- At the very bottom of the markdown content area (the main reading zone), add a thin horizontal neon line
- Same cyan/turquoise glow effect (#00FFFF)
- Spans the full width of the content area
- Subtle glow that fades upward slightly
- This creates a "floor" effect under the content

QUICK SWITCHER MODAL (centered overlay):
- Semi-transparent dark backdrop
- Centered modal (~60% width)
- Search input at top with placeholder "Search files..."
- List of 4-5 search results below showing:
  - File name with matched characters highlighted
  - File path in muted color
  - Small tag pills for files with tags

VISUAL STYLE:
- Keep the existing app's design language
- Sidebars should feel minimal and unobtrusive
- Use the same typography and spacing patterns
- The neon effects (tab, content bottom, active sidebar items) should all use the same cyan glow style
- Neon should be the signature visual element - thin, elegant, cyberpunk-inspired
- Everything else stays clean and professional

Do NOT change the main content text or the overall app structure. Only ADD these new UI elements around the existing interface.
```
