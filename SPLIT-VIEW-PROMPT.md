# Split View Implementation Prompt

````xml
<optimized_prompt>
  <system_context>
    <role>You are a senior React/TypeScript developer implementing a multi-panel split view feature for a Tauri desktop markdown viewer application.</role>
    <behavior>
      Implement changes incrementally, one phase at a time.
      Follow existing code patterns in the codebase (Zustand stores, Tailwind CSS, component structure).
      Test each phase before moving to the next.
      Keep the existing single-panel functionality working as you add multi-panel support.
    </behavior>
  </system_context>

  <task>
    <objective>Implement a complete Split View system allowing users to open multiple markdown files side-by-side in resizable panels, each with its own independent tabs.</objective>
    <motivation>Users with large screens need to compare documents, reference specs while reading implementations, and work with multiple files simultaneously without constant alt-tabbing. This is the core feature that differentiates a serious markdown viewer from a simple file reader.</motivation>
  </task>

  <context>
    <cwd>/Users/maximilien/Code/worktrees/markdown-viewer/feat-split-view-sidebars</cwd>

    <stack>
      <framework>Tauri v2 (Rust backend)</framework>
      <frontend>React + TypeScript</frontend>
      <styling>Tailwind CSS</styling>
      <state>Zustand</state>
      <persistence>tauri-plugin-store</persistence>
    </stack>

    <specification>
      <file>/Users/maximilien/Code/worktrees/markdown-viewer/feat-split-view-sidebars/SPLIT-VIEW.md</file>
      <summary>Read this file first - contains complete spec with layout diagrams, interactions, data structures, and constraints.</summary>
    </specification>

    <target_files>
      <!-- New files to create -->
      <new>/Users/maximilien/Code/worktrees/markdown-viewer/feat-split-view-sidebars/src/stores/panelStore.ts</new>
      <new>/Users/maximilien/Code/worktrees/markdown-viewer/feat-split-view-sidebars/src/components/PanelContainer/index.tsx</new>
      <new>/Users/maximilien/Code/worktrees/markdown-viewer/feat-split-view-sidebars/src/components/Panel/index.tsx</new>
      <new>/Users/maximilien/Code/worktrees/markdown-viewer/feat-split-view-sidebars/src/components/PanelSeparator/index.tsx</new>

      <!-- Existing files to modify -->
      <modify>/Users/maximilien/Code/worktrees/markdown-viewer/feat-split-view-sidebars/src/App.tsx</modify>
      <modify>/Users/maximilien/Code/worktrees/markdown-viewer/feat-split-view-sidebars/src/components/TabBar/index.tsx</modify>
      <modify>/Users/maximilien/Code/worktrees/markdown-viewer/feat-split-view-sidebars/src/components/MarkdownViewer/index.tsx</modify>
      <modify>/Users/maximilien/Code/worktrees/markdown-viewer/feat-split-view-sidebars/src/components/Sidebar/index.tsx</modify>
      <modify>/Users/maximilien/Code/worktrees/markdown-viewer/feat-split-view-sidebars/src/hooks/useKeyboardShortcuts.ts</modify>
      <modify>/Users/maximilien/Code/worktrees/markdown-viewer/feat-split-view-sidebars/src/stores/settingsStore.ts</modify>
      <modify>/Users/maximilien/Code/worktrees/markdown-viewer/feat-split-view-sidebars/src/types/index.ts</modify>
    </target_files>

    <existing_architecture>
      <pattern name="stores">
        Zustand stores in /src/stores/ with TypeScript interfaces.
        Each store exports a create() hook (useTabStore, useFileStore, etc.).
        Persistence via tauri-plugin-store load() in settingsStore.
      </pattern>
      <pattern name="components">
        Components in /src/components/{ComponentName}/index.tsx.
        Functional components with hooks.
        Tailwind classes for styling.
      </pattern>
      <pattern name="current_tab_system">
        tabStore.ts manages global tabs array.
        Tab interface: { id, path, name, content, isLoading, isDirty }.
        TabBar renders tabs, MarkdownViewer shows active tab content.
        Need to migrate from global tabs to per-panel tabs.
      </pattern>
    </existing_architecture>
  </context>

  <instructions>
    <!-- PHASE 1: Data Layer -->
    <phase n="1" name="Data Layer - Panel Store">
      <step n="1.1">Read SPLIT-VIEW.md to understand the full specification</step>
      <step n="1.2">Add Panel and PanelLayout types to /src/types/index.ts</step>
      <step n="1.3">Create /src/stores/panelStore.ts with SplitViewState interface from spec</step>
      <step n="1.4">Implement panel CRUD actions: splitPanel, closePanel, setActivePanel</step>
      <step n="1.5">Implement tab actions per panel: openFileInPanel, closeTab, setActiveTab</step>
      <step n="1.6">Implement resize action: resizePanel (percentage-based widths)</step>
      <step n="1.7">Add initialization: createInitialPanel for first load</step>
    </phase>

    <!-- PHASE 2: Core Components -->
    <phase n="2" name="Core Components - Panel System">
      <step n="2.1">Create PanelContainer component - horizontal flex container for all panels</step>
      <step n="2.2">Create Panel component - wrapper for TabBar + MarkdownViewer per panel</step>
      <step n="2.3">Create PanelSeparator component - draggable vertical separator with 8px hit zone</step>
      <step n="2.4">Modify TabBar to accept panelId prop and use panel-specific tabs</step>
      <step n="2.5">Modify MarkdownViewer to accept panelId prop and render panel's active tab</step>
      <step n="2.6">Add focus indicator styling (subtle border/shadow on active panel)</step>
    </phase>

    <!-- PHASE 3: Integration -->
    <phase n="3" name="Integration - Wire Everything">
      <step n="3.1">Replace single TabBar+MarkdownViewer in App.tsx with PanelContainer</step>
      <step n="3.2">Modify Sidebar file click to open in active panel (panelStore.openFileInPanel)</step>
      <step n="3.3">Add Cmd+Click handler in Sidebar to open in new panel (openFileInNewPanel)</step>
      <step n="3.4">Handle panel close on last tab close (redistribute space to adjacent panels)</step>
      <step n="3.5">Test basic multi-panel workflow: open file, split, open another file</step>
    </phase>

    <!-- PHASE 4: Keyboard Shortcuts -->
    <phase n="4" name="Keyboard Shortcuts">
      <step n="4.1">Add Cmd+\ to create new split (duplicate active panel)</step>
      <step n="4.2">Modify Cmd+W to close tab in active panel</step>
      <step n="4.3">Add Cmd+Shift+W to close entire active panel</step>
      <step n="4.4">Add Cmd+Alt+← and Cmd+Alt+→ for panel focus navigation</step>
      <step n="4.5">Add Cmd+` to cycle between panels</step>
      <step n="4.6">Update existing tab shortcuts to work within active panel</step>
    </phase>

    <!-- PHASE 5: Resize System -->
    <phase n="5" name="Resize System">
      <step n="5.1">Implement drag handlers on PanelSeparator (mousedown, mousemove, mouseup)</step>
      <step n="5.2">Calculate new widths as percentages during drag</step>
      <step n="5.3">Enforce minimum panel width (e.g., 200px or 15%)</step>
      <step n="5.4">Add cursor:col-resize on hover and during drag</step>
      <step n="5.5">Add visual highlight on separator during hover/drag</step>
    </phase>

    <!-- PHASE 6: Persistence -->
    <phase n="6" name="Persistence">
      <step n="6.1">Add PanelLayout to Settings type in types/index.ts</step>
      <step n="6.2">Save panel layout on every change (panels, widths, open tabs, active tab per panel)</step>
      <step n="6.3">Restore panel layout on app startup in settingsStore.loadSettings</step>
      <step n="6.4">Handle edge cases: missing files, corrupted state, migration from old format</step>
      <step n="6.5">Test: close app with 3 panels, reopen, verify exact restoration</step>
    </phase>

    <!-- PHASE 7: Animations & Polish -->
    <phase n="7" name="Animations and Polish">
      <step n="7.1">Add 200-300ms animation for panel split/close transitions</step>
      <step n="7.2">Add 150ms transition for focus indicator changes</step>
      <step n="7.3">Ensure no layout bugs (no overlap, no gaps between panels)</step>
      <step n="7.4">Test with 5+ panels to verify performance</step>
      <step n="7.5">Final UX review: all interactions feel smooth and intuitive</step>
    </phase>
  </instructions>

  <constraints>
    <constraint>MVP is horizontal splits only - no vertical splits (v2)</constraint>
    <constraint>Same file CAN be open in multiple panels (independent instances, separate scroll)</constraint>
    <constraint>When last tab of a panel closes, the panel closes and space redistributes</constraint>
    <constraint>Separators must be 8px wide with extended hit zone for easy grabbing</constraint>
    <constraint>Keep the existing Sidebar and SearchBar unchanged (left side)</constraint>
    <constraint>Panel widths are stored as percentages for responsive behavior</constraint>
    <constraint>Minimum panel width prevents panels from becoming unusably small</constraint>
    <constraint>DO NOT implement: vertical splits, scroll sync, diff view, panel groups (all v2)</constraint>
    <constraint>Follow existing code style: TypeScript strict, Tailwind classes, functional components</constraint>
  </constraints>

  <data_structures>
    <structure name="Panel">
      ```typescript
      interface Panel {
        id: string;
        tabs: Tab[];
        activeTabId: string | null;
        width: number; // percentage (0-100)
      }
      ```
    </structure>
    <structure name="Tab">
      ```typescript
      interface Tab {
        id: string;
        path: string;
        name: string;
        content: string;
        isLoading: boolean;
        isDirty: boolean;
        scrollPosition?: number;
      }
      ```
    </structure>
    <structure name="SplitViewState">
      ```typescript
      interface SplitViewState {
        panels: Panel[];
        activePanelId: string | null;

        // Panel actions
        splitPanel: (panelId: string) => void;
        closePanel: (panelId: string) => void;
        setActivePanel: (panelId: string) => void;
        resizePanel: (panelId: string, width: number) => void;

        // Tab actions (per panel)
        openFileInPanel: (panelId: string, path: string) => Promise<void>;
        openFileInNewPanel: (path: string) => Promise<void>;
        closeTab: (panelId: string, tabId: string) => void;
        setActiveTab: (panelId: string, tabId: string) => void;

        // Navigation
        focusNextPanel: () => void;
        focusPreviousPanel: () => void;

        // Persistence
        saveLayout: () => Promise<void>;
        restoreLayout: () => Promise<void>;
      }
      ```
    </structure>
  </data_structures>

  <output_format>
    <structure>
      For each phase:
      1. List files created/modified
      2. Show key code changes (not full files, just the important parts)
      3. Verification step: what to test before moving on

      At the end of each phase, confirm:
      - [ ] Phase N complete
      - [ ] Tests pass
      - [ ] Ready for next phase
    </structure>
  </output_format>

  <todo_bootstrap>
    <directive>
      FIRST ACTION before any work: Create a TodoWrite with the following items.
      Mark each item completed as you finish it.
    </directive>
    <todos>
      [
        {"content": "Read SPLIT-VIEW.md specification", "status": "in_progress", "activeForm": "Reading SPLIT-VIEW.md specification"},
        {"content": "Add Panel and PanelLayout types to types/index.ts", "status": "pending", "activeForm": "Adding Panel and PanelLayout types"},
        {"content": "Create panelStore.ts with SplitViewState", "status": "pending", "activeForm": "Creating panelStore with SplitViewState"},
        {"content": "Implement panel CRUD actions", "status": "pending", "activeForm": "Implementing panel CRUD actions"},
        {"content": "Implement per-panel tab actions", "status": "pending", "activeForm": "Implementing per-panel tab actions"},
        {"content": "Implement resize action", "status": "pending", "activeForm": "Implementing resize action"},
        {"content": "Create PanelContainer component", "status": "pending", "activeForm": "Creating PanelContainer component"},
        {"content": "Create Panel component", "status": "pending", "activeForm": "Creating Panel component"},
        {"content": "Create PanelSeparator component", "status": "pending", "activeForm": "Creating PanelSeparator component"},
        {"content": "Modify TabBar for panel-specific tabs", "status": "pending", "activeForm": "Modifying TabBar for panel-specific tabs"},
        {"content": "Modify MarkdownViewer for panel context", "status": "pending", "activeForm": "Modifying MarkdownViewer for panel context"},
        {"content": "Add focus indicator styling", "status": "pending", "activeForm": "Adding focus indicator styling"},
        {"content": "Replace App.tsx layout with PanelContainer", "status": "pending", "activeForm": "Replacing App.tsx layout with PanelContainer"},
        {"content": "Modify Sidebar click handlers", "status": "pending", "activeForm": "Modifying Sidebar click handlers"},
        {"content": "Implement Cmd+Click for new panel", "status": "pending", "activeForm": "Implementing Cmd+Click for new panel"},
        {"content": "Handle panel close on last tab close", "status": "pending", "activeForm": "Handling panel close on last tab close"},
        {"content": "Add Cmd+\\ for new split", "status": "pending", "activeForm": "Adding Cmd+\\ shortcut for new split"},
        {"content": "Add Cmd+Shift+W for close panel", "status": "pending", "activeForm": "Adding Cmd+Shift+W for close panel"},
        {"content": "Add panel focus navigation shortcuts", "status": "pending", "activeForm": "Adding panel focus navigation shortcuts"},
        {"content": "Add Cmd+` to cycle panels", "status": "pending", "activeForm": "Adding Cmd+` to cycle panels"},
        {"content": "Implement separator drag handlers", "status": "pending", "activeForm": "Implementing separator drag handlers"},
        {"content": "Enforce minimum panel width", "status": "pending", "activeForm": "Enforcing minimum panel width"},
        {"content": "Add resize cursor and visual feedback", "status": "pending", "activeForm": "Adding resize cursor and visual feedback"},
        {"content": "Add PanelLayout to Settings type", "status": "pending", "activeForm": "Adding PanelLayout to Settings type"},
        {"content": "Implement layout save on change", "status": "pending", "activeForm": "Implementing layout save on change"},
        {"content": "Implement layout restore on startup", "status": "pending", "activeForm": "Implementing layout restore on startup"},
        {"content": "Handle persistence edge cases", "status": "pending", "activeForm": "Handling persistence edge cases"},
        {"content": "Add split/close animations", "status": "pending", "activeForm": "Adding split/close animations"},
        {"content": "Add focus transition animation", "status": "pending", "activeForm": "Adding focus transition animation"},
        {"content": "Final UX review and polish", "status": "pending", "activeForm": "Final UX review and polish"}
      ]
    </todos>
  </todo_bootstrap>
</optimized_prompt>
````

---

## Execution Strategy

| Aspect               | Value                                             |
| -------------------- | ------------------------------------------------- |
| Mode                 | **Single agent, phased execution**                |
| Phases               | 7 phases, ~30 atomic tasks                        |
| Dependencies         | Sequential phases (each builds on previous)       |
| Parallelism          | Steps within each phase can often be parallelized |
| Estimated complexity | Medium-High (state management + UI + persistence) |

---

## Changes Applied

- [x] XML structure applied
- [x] Paths absolutized
- [x] Instructions explicited with motivations
- [x] Output format specified
- [x] TodoWrite bootstrap generated (30 tasks)
- [x] Data structures included for reference
- [x] Constraints clearly stated
- [x] Phased approach for incremental delivery

---

## Checklist Implementation Summary

### Phase 1: Data Layer (7 steps)

- [ ] Read spec
- [ ] Add types
- [ ] Create panelStore
- [ ] Panel CRUD
- [ ] Tab actions
- [ ] Resize action
- [ ] Initialization

### Phase 2: Core Components (6 steps)

- [ ] PanelContainer
- [ ] Panel
- [ ] PanelSeparator
- [ ] TabBar modification
- [ ] MarkdownViewer modification
- [ ] Focus indicator

### Phase 3: Integration (5 steps)

- [ ] App.tsx update
- [ ] Sidebar click
- [ ] Cmd+Click
- [ ] Last tab close
- [ ] Basic workflow test

### Phase 4: Keyboard Shortcuts (6 steps)

- [ ] Cmd+\
- [ ] Cmd+W (panel-aware)
- [ ] Cmd+Shift+W
- [ ] Cmd+Alt+←/→
- [ ] Cmd+`
- [ ] Existing shortcuts

### Phase 5: Resize System (5 steps)

- [ ] Drag handlers
- [ ] Width calculation
- [ ] Minimum width
- [ ] Cursor styling
- [ ] Visual feedback

### Phase 6: Persistence (5 steps)

- [ ] Settings type
- [ ] Save on change
- [ ] Restore on startup
- [ ] Edge cases
- [ ] Verification test

### Phase 7: Polish (5 steps)

- [ ] Split/close animations
- [ ] Focus transitions
- [ ] Layout bug check
- [ ] Performance test
- [ ] Final UX review

---

**Total: 39 implementation steps across 7 phases**

Le prompt est prêt pour exécution dans un contexte frais.
