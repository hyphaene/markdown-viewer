import { create } from "zustand";
import { readFile } from "../lib/tauri";

export interface Tab {
  id: string;
  path: string;
  name: string;
  content: string;
  isLoading: boolean;
  isDirty: boolean; // For future edit feature
}

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;

  // Actions
  openTab: (path: string) => Promise<void>;
  closeTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (id: string) => void;
  nextTab: () => void;
  previousTab: () => void;
  reloadTab: (id: string) => Promise<void>;
  reloadActiveTab: () => Promise<void>;

  // Derived
  getActiveTab: () => Tab | null;
}

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getFileName(path: string): string {
  return path.split("/").pop() || path;
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: async (path: string) => {
    const { tabs } = get();

    // Check if tab already exists for this path
    const existingTab = tabs.find((t) => t.path === path);
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    // Create new tab
    const newTab: Tab = {
      id: generateTabId(),
      path,
      name: getFileName(path),
      content: "",
      isLoading: true,
      isDirty: false,
    };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));

    // Load content
    try {
      const content = await readFile(path);
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === newTab.id ? { ...t, content, isLoading: false } : t,
        ),
      }));
    } catch (e) {
      console.error("Failed to load file:", e);
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === newTab.id
            ? { ...t, content: `Error loading file: ${e}`, isLoading: false }
            : t,
        ),
      }));
    }
  },

  closeTab: (id: string) => {
    const { tabs, activeTabId } = get();
    const tabIndex = tabs.findIndex((t) => t.id === id);
    if (tabIndex === -1) return;

    const newTabs = tabs.filter((t) => t.id !== id);

    // If closing active tab, activate adjacent tab
    let newActiveId: string | null = activeTabId;
    if (activeTabId === id) {
      if (newTabs.length === 0) {
        newActiveId = null;
      } else if (tabIndex >= newTabs.length) {
        newActiveId = newTabs[newTabs.length - 1].id;
      } else {
        newActiveId = newTabs[tabIndex].id;
      }
    }

    set({ tabs: newTabs, activeTabId: newActiveId });
  },

  closeOtherTabs: (id: string) => {
    set((state) => ({
      tabs: state.tabs.filter((t) => t.id === id),
      activeTabId: id,
    }));
  },

  closeAllTabs: () => {
    set({ tabs: [], activeTabId: null });
  },

  setActiveTab: (id: string) => {
    set({ activeTabId: id });
  },

  nextTab: () => {
    const { tabs, activeTabId } = get();
    if (tabs.length === 0) return;

    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    set({ activeTabId: tabs[nextIndex].id });
  },

  previousTab: () => {
    const { tabs, activeTabId } = get();
    if (tabs.length === 0) return;

    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const prevIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1;
    set({ activeTabId: tabs[prevIndex].id });
  },

  reloadTab: async (id: string) => {
    const { tabs } = get();
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;

    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, isLoading: true } : t,
      ),
    }));

    try {
      const content = await readFile(tab.path);
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === id ? { ...t, content, isLoading: false } : t,
        ),
      }));
    } catch (e) {
      console.error("Failed to reload file:", e);
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === id ? { ...t, isLoading: false } : t,
        ),
      }));
    }
  },

  reloadActiveTab: async () => {
    const { activeTabId, reloadTab } = get();
    if (activeTabId) {
      await reloadTab(activeTabId);
    }
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId) || null;
  },
}));
