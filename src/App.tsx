import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import { Sidebar } from "./components/Sidebar";
import { PanelContainer } from "./components/PanelContainer";
import { SearchBar } from "./components/SearchBar";
import { SettingsModal } from "./components/Settings";
import { UpdateBanner } from "./components/UpdateBanner";
import { TableOfContents } from "./components/TableOfContents";
import { parseMarkdown } from "./lib/markdown";
import { useFileStore } from "./stores/fileStore";
import { usePanelStore } from "./stores/panelStore";
import { useSettingsStore } from "./stores/settingsStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { readFile } from "./lib/tauri";
import type { FileEntry, Panel } from "./types";

function App() {
  const { scan, addFile, updateFile, removeFile } = useFileStore();
  const { panels, activePanelId, createInitialPanel, reloadTab, setLayout } =
    usePanelStore();
  const {
    settings,
    isLoaded,
    loadSettings,
    openSettings,
    updatePanelLayout,
    getPanelLayout,
  } = useSettingsStore();
  const layoutRestoredRef = useRef(false);

  // Register keyboard shortcuts
  useKeyboardShortcuts();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Restore layout from settings or create initial panel
  useEffect(() => {
    if (!isLoaded || layoutRestoredRef.current) return;
    layoutRestoredRef.current = true;

    const savedLayout = getPanelLayout();
    if (savedLayout && savedLayout.panels.length > 0) {
      // Restore saved layout and reload file contents
      restoreLayout(savedLayout.panels, savedLayout.activePanelId);
    } else if (panels.length === 0) {
      createInitialPanel();
    }
  }, [isLoaded, getPanelLayout, createInitialPanel, panels.length]);

  // Restore layout helper - reloads file contents for all tabs
  async function restoreLayout(
    savedPanels: Panel[],
    savedActivePanelId: string | null,
  ) {
    // First set the layout structure (without content)
    const panelsWithLoadingTabs = savedPanels.map((panel) => ({
      ...panel,
      tabs: panel.tabs.map((tab) => ({
        ...tab,
        content: "",
        isLoading: true,
      })),
    }));
    setLayout(panelsWithLoadingTabs, savedActivePanelId);

    // Then load content for each tab
    for (const panel of savedPanels) {
      for (const tab of panel.tabs) {
        try {
          const content = await readFile(tab.path);
          usePanelStore.setState((state) => ({
            panels: state.panels.map((p) =>
              p.id === panel.id
                ? {
                    ...p,
                    tabs: p.tabs.map((t) =>
                      t.id === tab.id ? { ...t, content, isLoading: false } : t,
                    ),
                  }
                : p,
            ),
          }));
        } catch (e) {
          console.error(`Failed to load file ${tab.path}:`, e);
          // Remove tab if file no longer exists
          usePanelStore.setState((state) => ({
            panels: state.panels.map((p) =>
              p.id === panel.id
                ? {
                    ...p,
                    tabs: p.tabs.filter((t) => t.id !== tab.id),
                    activeTabId:
                      p.activeTabId === tab.id
                        ? (p.tabs.find((t) => t.id !== tab.id)?.id ?? null)
                        : p.activeTabId,
                  }
                : p,
            ),
          }));
        }
      }
    }
  }

  // Save layout whenever panels change
  useEffect(() => {
    if (!isLoaded || !layoutRestoredRef.current) return;
    if (panels.length === 0) return;

    // Debounce saves to avoid excessive writes
    const timer = setTimeout(() => {
      updatePanelLayout({ panels, activePanelId });
    }, 500);

    return () => clearTimeout(timer);
  }, [panels, activePanelId, isLoaded, updatePanelLayout]);

  // Scan directories from settings once loaded
  useEffect(() => {
    if (isLoaded) {
      const enabledPaths = settings.sources
        .filter((s) => s.enabled)
        .map((s) => s.path);
      if (enabledPaths.length > 0) {
        scan(enabledPaths);
      }
    }
  }, [isLoaded, settings.sources, scan]);

  // Listen to file events from Rust watcher
  useEffect(() => {
    const unlistenAdded = listen<FileEntry>("file:added", (event) => {
      addFile(event.payload);
    });

    const unlistenChanged = listen<FileEntry>("file:changed", (event) => {
      updateFile(event.payload);
      // Reload any open tab with this file across all panels
      for (const panel of panels) {
        const openTab = panel.tabs.find((t) => t.path === event.payload.path);
        if (openTab) {
          reloadTab(panel.id, openTab.id);
        }
      }
    });

    const unlistenRemoved = listen<string>("file:removed", (event) => {
      removeFile(event.payload);
    });

    return () => {
      unlistenAdded.then((fn) => fn());
      unlistenChanged.then((fn) => fn());
      unlistenRemoved.then((fn) => fn());
    };
  }, [addFile, updateFile, removeFile, panels, reloadTab]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-text">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-muted">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-text">
      <UpdateBanner />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="flex flex-col w-72 border-r border-white/5 bg-surface">
          <SearchBar />
          <Sidebar />
          <div className="p-3 border-t border-white/5">
            <button
              onClick={openSettings}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-text hover:bg-white/5 rounded-lg transition-all"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </button>
          </div>
        </div>

        {/* Main content - Panel Container */}
        <PanelContainer />

        {/* Global TOC - shows content of active file */}
        <GlobalTableOfContents />
      </div>
      <SettingsModal />
    </div>
  );
}

function GlobalTableOfContents() {
  const panels = usePanelStore((s) => s.panels);
  const activePanelId = usePanelStore((s) => s.activePanelId);

  const activePanel = panels.find((p) => p.id === activePanelId);
  const activeTab = activePanel?.tabs.find(
    (t) => t.id === activePanel.activeTabId,
  );

  if (!activeTab?.content) return null;

  const { content } = parseMarkdown(activeTab.content);

  return <TableOfContents content={content} />;
}

export default App;
