import { create } from "zustand";
import { readFile } from "../lib/tauri";
import type { Panel, Tab } from "../types";

const MIN_PANEL_WIDTH = 15; // minimum panel width in percentage

interface DragState {
  isDragging: boolean;
  sourcePanelId: string | null;
  sourceTabId: string | null;
}

interface PanelState {
  panels: Panel[];
  activePanelId: string | null;
  dragState: DragState;
}

interface PanelActions {
  // Panel CRUD
  splitPanel: (panelId: string) => void;
  closePanel: (panelId: string) => void;
  setActivePanel: (panelId: string) => void;
  resizePanel: (panelId: string, width: number) => void;

  // Tab actions (per panel)
  openFileInPanel: (panelId: string, path: string) => Promise<void>;
  openFileInActivePanel: (path: string) => Promise<void>;
  openFileInNewPanel: (path: string) => Promise<void>;
  closeTab: (panelId: string, tabId: string) => void;
  setActiveTab: (panelId: string, tabId: string) => void;
  reloadTab: (panelId: string, tabId: string) => Promise<void>;

  // Navigation
  focusNextPanel: () => void;
  focusPreviousPanel: () => void;
  nextTabInPanel: (panelId: string) => void;
  previousTabInPanel: (panelId: string) => void;

  // Helpers
  getActivePanel: () => Panel | null;
  getPanel: (panelId: string) => Panel | undefined;
  createInitialPanel: () => void;

  // Drag & Drop
  startDrag: (panelId: string, tabId: string) => void;
  endDrag: () => void;
  moveTabToPanel: (
    targetPanelId: string,
    position?: "start" | "end" | number,
  ) => void;
  moveTabToNewPanel: (targetPanelId: string, side: "left" | "right") => void;
  checkDropZone: (
    sourcePanelId: string,
    clientX: number,
    clientY: number,
  ) => void;

  // Persistence
  setLayout: (panels: Panel[], activePanelId: string | null) => void;
}

type PanelStore = PanelState & PanelActions;

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getFileName(path: string): string {
  return path.split("/").pop() || path;
}

function createEmptyPanel(width: number = 100): Panel {
  return {
    id: generateId("panel"),
    tabs: [],
    activeTabId: null,
    width,
  };
}

export const usePanelStore = create<PanelStore>((set, get) => ({
  panels: [],
  activePanelId: null,
  dragState: {
    isDragging: false,
    sourcePanelId: null,
    sourceTabId: null,
  },

  // Create initial panel when app starts
  createInitialPanel: () => {
    const { panels } = get();
    if (panels.length === 0) {
      const panel = createEmptyPanel(100);
      set({ panels: [panel], activePanelId: panel.id });
    }
  },

  // Split the specified panel (creates a new panel to the right with same tabs)
  splitPanel: (panelId: string) => {
    const { panels } = get();
    const panelIndex = panels.findIndex((p) => p.id === panelId);
    if (panelIndex === -1) return;

    const sourcePanel = panels[panelIndex];

    // Calculate new widths - split the source panel's width in half
    const halfWidth = sourcePanel.width / 2;

    // Enforce minimum width
    if (halfWidth < MIN_PANEL_WIDTH) return;

    const newPanel = createEmptyPanel(halfWidth);

    const updatedPanels = [...panels];
    updatedPanels[panelIndex] = { ...sourcePanel, width: halfWidth };
    updatedPanels.splice(panelIndex + 1, 0, newPanel);

    set({
      panels: updatedPanels,
      activePanelId: newPanel.id,
    });
  },

  // Close a panel and redistribute its width to adjacent panels
  closePanel: (panelId: string) => {
    const { panels, activePanelId } = get();
    if (panels.length <= 1) return; // Don't close the last panel

    const panelIndex = panels.findIndex((p) => p.id === panelId);
    if (panelIndex === -1) return;

    const closingPanel = panels[panelIndex];
    const redistributeWidth = closingPanel.width;

    const newPanels = panels.filter((p) => p.id !== panelId);

    // Redistribute width to adjacent panels
    if (newPanels.length > 0) {
      // Prefer giving width to the panel on the left, otherwise right
      const targetIndex = panelIndex > 0 ? panelIndex - 1 : 0;
      newPanels[targetIndex] = {
        ...newPanels[targetIndex],
        width: newPanels[targetIndex].width + redistributeWidth,
      };
    }

    // If closing the active panel, switch to adjacent
    let newActiveId = activePanelId;
    if (activePanelId === panelId) {
      const newIndex = Math.min(panelIndex, newPanels.length - 1);
      newActiveId = newPanels[newIndex]?.id ?? null;
    }

    set({ panels: newPanels, activePanelId: newActiveId });
  },

  setActivePanel: (panelId: string) => {
    set({ activePanelId: panelId });
  },

  resizePanel: (panelId: string, width: number) => {
    const { panels } = get();
    const panelIndex = panels.findIndex((p) => p.id === panelId);
    if (panelIndex === -1) return;

    // Clamp width
    const clampedWidth = Math.max(MIN_PANEL_WIDTH, Math.min(100, width));

    // Calculate width difference
    const oldWidth = panels[panelIndex].width;
    const diff = clampedWidth - oldWidth;

    // Adjust adjacent panel (prefer right, then left)
    const adjacentIndex =
      panelIndex < panels.length - 1 ? panelIndex + 1 : panelIndex - 1;
    if (adjacentIndex < 0 || adjacentIndex >= panels.length) return;

    const adjacentNewWidth = panels[adjacentIndex].width - diff;
    if (adjacentNewWidth < MIN_PANEL_WIDTH) return;

    const updatedPanels = [...panels];
    updatedPanels[panelIndex] = { ...panels[panelIndex], width: clampedWidth };
    updatedPanels[adjacentIndex] = {
      ...panels[adjacentIndex],
      width: adjacentNewWidth,
    };

    set({ panels: updatedPanels });
  },

  // Open a file in a specific panel
  openFileInPanel: async (panelId: string, path: string) => {
    const { panels } = get();
    const panelIndex = panels.findIndex((p) => p.id === panelId);
    if (panelIndex === -1) return;

    const panel = panels[panelIndex];

    // Check if file is already open in this panel
    const existingTab = panel.tabs.find((t) => t.path === path);
    if (existingTab) {
      // Just switch to it
      const updatedPanels = [...panels];
      updatedPanels[panelIndex] = { ...panel, activeTabId: existingTab.id };
      set({ panels: updatedPanels, activePanelId: panelId });
      return;
    }

    // Create new tab
    const newTab: Tab = {
      id: generateId("tab"),
      path,
      name: getFileName(path),
      content: "",
      isLoading: true,
      isDirty: false,
    };

    const updatedPanels = [...panels];
    updatedPanels[panelIndex] = {
      ...panel,
      tabs: [...panel.tabs, newTab],
      activeTabId: newTab.id,
    };

    set({ panels: updatedPanels, activePanelId: panelId });

    // Load content
    try {
      const content = await readFile(path);
      set((state) => ({
        panels: state.panels.map((p) =>
          p.id === panelId
            ? {
                ...p,
                tabs: p.tabs.map((t) =>
                  t.id === newTab.id ? { ...t, content, isLoading: false } : t,
                ),
              }
            : p,
        ),
      }));
    } catch (e) {
      console.error("Failed to load file:", e);
      set((state) => ({
        panels: state.panels.map((p) =>
          p.id === panelId
            ? {
                ...p,
                tabs: p.tabs.map((t) =>
                  t.id === newTab.id
                    ? {
                        ...t,
                        content: `Error loading file: ${e}`,
                        isLoading: false,
                      }
                    : t,
                ),
              }
            : p,
        ),
      }));
    }
  },

  // Open file in the currently active panel
  openFileInActivePanel: async (path: string) => {
    const { activePanelId, openFileInPanel, createInitialPanel, panels } =
      get();
    if (!activePanelId || panels.length === 0) {
      createInitialPanel();
      const { activePanelId: newActiveId } = get();
      if (newActiveId) {
        await openFileInPanel(newActiveId, path);
      }
      return;
    }
    await openFileInPanel(activePanelId, path);
  },

  // Open file in a new panel (split)
  openFileInNewPanel: async (path: string) => {
    const { activePanelId, splitPanel, panels, openFileInPanel } = get();

    if (!activePanelId || panels.length === 0) {
      // No panels yet, just open in a new one
      const panel = createEmptyPanel(100);
      set({ panels: [panel], activePanelId: panel.id });
      await get().openFileInPanel(panel.id, path);
      return;
    }

    // Split current panel first
    splitPanel(activePanelId);

    // Get the newly created panel (it becomes active after split)
    const { activePanelId: newPanelId } = get();
    if (newPanelId) {
      await openFileInPanel(newPanelId, path);
    }
  },

  closeTab: (panelId: string, tabId: string) => {
    const { panels, closePanel } = get();
    const panelIndex = panels.findIndex((p) => p.id === panelId);
    if (panelIndex === -1) return;

    const panel = panels[panelIndex];
    const tabIndex = panel.tabs.findIndex((t) => t.id === tabId);
    if (tabIndex === -1) return;

    const newTabs = panel.tabs.filter((t) => t.id !== tabId);

    // If this was the last tab, close the panel
    if (newTabs.length === 0) {
      closePanel(panelId);
      return;
    }

    // Update active tab if needed
    let newActiveTabId = panel.activeTabId;
    if (panel.activeTabId === tabId) {
      if (tabIndex >= newTabs.length) {
        newActiveTabId = newTabs[newTabs.length - 1].id;
      } else {
        newActiveTabId = newTabs[tabIndex].id;
      }
    }

    const updatedPanels = [...panels];
    updatedPanels[panelIndex] = {
      ...panel,
      tabs: newTabs,
      activeTabId: newActiveTabId,
    };

    set({ panels: updatedPanels });
  },

  setActiveTab: (panelId: string, tabId: string) => {
    const { panels } = get();
    const updatedPanels = panels.map((p) =>
      p.id === panelId ? { ...p, activeTabId: tabId } : p,
    );
    set({ panels: updatedPanels, activePanelId: panelId });
  },

  reloadTab: async (panelId: string, tabId: string) => {
    const { panels } = get();
    const panel = panels.find((p) => p.id === panelId);
    if (!panel) return;

    const tab = panel.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    // Set loading state
    set((state) => ({
      panels: state.panels.map((p) =>
        p.id === panelId
          ? {
              ...p,
              tabs: p.tabs.map((t) =>
                t.id === tabId ? { ...t, isLoading: true } : t,
              ),
            }
          : p,
      ),
    }));

    try {
      const content = await readFile(tab.path);
      set((state) => ({
        panels: state.panels.map((p) =>
          p.id === panelId
            ? {
                ...p,
                tabs: p.tabs.map((t) =>
                  t.id === tabId ? { ...t, content, isLoading: false } : t,
                ),
              }
            : p,
        ),
      }));
    } catch (e) {
      console.error("Failed to reload file:", e);
      set((state) => ({
        panels: state.panels.map((p) =>
          p.id === panelId
            ? {
                ...p,
                tabs: p.tabs.map((t) =>
                  t.id === tabId ? { ...t, isLoading: false } : t,
                ),
              }
            : p,
        ),
      }));
    }
  },

  focusNextPanel: () => {
    const { panels, activePanelId } = get();
    if (panels.length <= 1) return;

    const currentIndex = panels.findIndex((p) => p.id === activePanelId);
    const nextIndex = (currentIndex + 1) % panels.length;
    set({ activePanelId: panels[nextIndex].id });
  },

  focusPreviousPanel: () => {
    const { panels, activePanelId } = get();
    if (panels.length <= 1) return;

    const currentIndex = panels.findIndex((p) => p.id === activePanelId);
    const prevIndex = currentIndex <= 0 ? panels.length - 1 : currentIndex - 1;
    set({ activePanelId: panels[prevIndex].id });
  },

  nextTabInPanel: (panelId: string) => {
    const { panels } = get();
    const panel = panels.find((p) => p.id === panelId);
    if (!panel || panel.tabs.length === 0) return;

    const currentIndex = panel.tabs.findIndex(
      (t) => t.id === panel.activeTabId,
    );
    const nextIndex = (currentIndex + 1) % panel.tabs.length;
    get().setActiveTab(panelId, panel.tabs[nextIndex].id);
  },

  previousTabInPanel: (panelId: string) => {
    const { panels } = get();
    const panel = panels.find((p) => p.id === panelId);
    if (!panel || panel.tabs.length === 0) return;

    const currentIndex = panel.tabs.findIndex(
      (t) => t.id === panel.activeTabId,
    );
    const prevIndex =
      currentIndex <= 0 ? panel.tabs.length - 1 : currentIndex - 1;
    get().setActiveTab(panelId, panel.tabs[prevIndex].id);
  },

  getActivePanel: () => {
    const { panels, activePanelId } = get();
    return panels.find((p) => p.id === activePanelId) ?? null;
  },

  getPanel: (panelId: string) => {
    const { panels } = get();
    return panels.find((p) => p.id === panelId);
  },

  // Drag & Drop actions
  startDrag: (panelId: string, tabId: string) => {
    set({
      dragState: {
        isDragging: true,
        sourcePanelId: panelId,
        sourceTabId: tabId,
      },
    });
  },

  endDrag: () => {
    set({
      dragState: {
        isDragging: false,
        sourcePanelId: null,
        sourceTabId: null,
      },
    });
  },

  moveTabToPanel: (
    targetPanelId: string,
    position: "start" | "end" | number = "end",
  ) => {
    const { panels, dragState, endDrag, closePanel } = get();
    const { sourcePanelId, sourceTabId } = dragState;

    if (!sourcePanelId || !sourceTabId) return;
    if (sourcePanelId === targetPanelId) {
      endDrag();
      return;
    }

    const sourcePanel = panels.find((p) => p.id === sourcePanelId);
    const targetPanel = panels.find((p) => p.id === targetPanelId);
    if (!sourcePanel || !targetPanel) {
      endDrag();
      return;
    }

    const tab = sourcePanel.tabs.find((t) => t.id === sourceTabId);
    if (!tab) {
      endDrag();
      return;
    }

    // Check if file is already open in target panel
    const existingTab = targetPanel.tabs.find((t) => t.path === tab.path);
    if (existingTab) {
      // Just switch to existing tab and remove from source
      const newSourceTabs = sourcePanel.tabs.filter(
        (t) => t.id !== sourceTabId,
      );

      if (newSourceTabs.length === 0) {
        // Close source panel if empty
        endDrag();
        closePanel(sourcePanelId);
        set((state) => ({
          panels: state.panels.map((p) =>
            p.id === targetPanelId ? { ...p, activeTabId: existingTab.id } : p,
          ),
          activePanelId: targetPanelId,
        }));
      } else {
        // Update source panel and switch to existing tab in target
        set((state) => ({
          panels: state.panels.map((p) => {
            if (p.id === sourcePanelId) {
              const newActiveTabId =
                p.activeTabId === sourceTabId
                  ? newSourceTabs[
                      Math.min(
                        sourcePanel.tabs.findIndex((t) => t.id === sourceTabId),
                        newSourceTabs.length - 1,
                      )
                    ].id
                  : p.activeTabId;
              return { ...p, tabs: newSourceTabs, activeTabId: newActiveTabId };
            }
            if (p.id === targetPanelId) {
              return { ...p, activeTabId: existingTab.id };
            }
            return p;
          }),
          activePanelId: targetPanelId,
          dragState: {
            isDragging: false,
            sourcePanelId: null,
            sourceTabId: null,
          },
        }));
      }
      return;
    }

    // Remove tab from source panel
    const newSourceTabs = sourcePanel.tabs.filter((t) => t.id !== sourceTabId);

    // Calculate new active tab for source if needed
    const sourceActiveTabId =
      sourcePanel.activeTabId === sourceTabId
        ? newSourceTabs.length > 0
          ? newSourceTabs[
              Math.min(
                sourcePanel.tabs.findIndex((t) => t.id === sourceTabId),
                newSourceTabs.length - 1,
              )
            ].id
          : null
        : sourcePanel.activeTabId;

    // Add tab to target panel at specified position
    let newTargetTabs = [...targetPanel.tabs];
    if (position === "start") {
      newTargetTabs = [tab, ...newTargetTabs];
    } else if (position === "end") {
      newTargetTabs = [...newTargetTabs, tab];
    } else {
      newTargetTabs.splice(position, 0, tab);
    }

    // If source panel is now empty, close it
    if (newSourceTabs.length === 0) {
      endDrag();
      closePanel(sourcePanelId);
      set((state) => ({
        panels: state.panels.map((p) =>
          p.id === targetPanelId
            ? { ...p, tabs: newTargetTabs, activeTabId: tab.id }
            : p,
        ),
        activePanelId: targetPanelId,
      }));
      return;
    }

    set({
      panels: panels.map((p) => {
        if (p.id === sourcePanelId) {
          return { ...p, tabs: newSourceTabs, activeTabId: sourceActiveTabId };
        }
        if (p.id === targetPanelId) {
          return { ...p, tabs: newTargetTabs, activeTabId: tab.id };
        }
        return p;
      }),
      activePanelId: targetPanelId,
      dragState: {
        isDragging: false,
        sourcePanelId: null,
        sourceTabId: null,
      },
    });
  },

  moveTabToNewPanel: (targetPanelId: string, side: "left" | "right") => {
    const { panels, dragState, endDrag } = get();
    const { sourcePanelId, sourceTabId } = dragState;

    if (!sourcePanelId || !sourceTabId) return;

    const sourcePanel = panels.find((p) => p.id === sourcePanelId);
    const targetPanel = panels.find((p) => p.id === targetPanelId);
    if (!sourcePanel || !targetPanel) {
      endDrag();
      return;
    }

    const targetPanelIndex = panels.findIndex((p) => p.id === targetPanelId);
    const tab = sourcePanel.tabs.find((t) => t.id === sourceTabId);
    if (!tab || targetPanelIndex === -1) {
      endDrag();
      return;
    }

    // Calculate new widths - split target panel
    const halfWidth = targetPanel.width / 2;
    if (halfWidth < MIN_PANEL_WIDTH) {
      endDrag();
      return;
    }

    // Create new panel with the dragged tab
    const newPanel: Panel = {
      id: generateId("panel"),
      tabs: [tab],
      activeTabId: tab.id,
      width: halfWidth,
    };

    // Remove tab from source panel
    const newSourceTabs = sourcePanel.tabs.filter((t) => t.id !== sourceTabId);
    const sourceActiveTabId =
      sourcePanel.activeTabId === sourceTabId
        ? newSourceTabs.length > 0
          ? newSourceTabs[
              Math.min(
                sourcePanel.tabs.findIndex((t) => t.id === sourceTabId),
                newSourceTabs.length - 1,
              )
            ].id
          : null
        : sourcePanel.activeTabId;

    // Build updated panels array
    const isSamePanel = sourcePanelId === targetPanelId;
    let updatedPanels = panels.map((p) => {
      if (isSamePanel && p.id === sourcePanelId) {
        // Same panel: remove tab AND set half width
        return {
          ...p,
          tabs: newSourceTabs,
          activeTabId: sourceActiveTabId,
          width: halfWidth,
        };
      }
      if (p.id === sourcePanelId) {
        return { ...p, tabs: newSourceTabs, activeTabId: sourceActiveTabId };
      }
      if (p.id === targetPanelId) {
        return { ...p, width: halfWidth };
      }
      return p;
    });

    // Insert new panel at correct position
    const insertIndex =
      side === "left" ? targetPanelIndex : targetPanelIndex + 1;
    updatedPanels.splice(insertIndex, 0, newPanel);

    // Remove empty source panel if needed
    if (newSourceTabs.length === 0) {
      const emptyPanelIndex = updatedPanels.findIndex(
        (p) => p.id === sourcePanelId,
      );
      if (emptyPanelIndex !== -1) {
        const emptyPanel = updatedPanels[emptyPanelIndex];
        updatedPanels = updatedPanels.filter((p) => p.id !== sourcePanelId);

        // Redistribute width to the NEW panel we just created (keep 50/50 split)
        if (updatedPanels.length > 0) {
          const newPanelIndex = updatedPanels.findIndex(
            (p) => p.id === newPanel.id,
          );
          if (newPanelIndex !== -1) {
            updatedPanels[newPanelIndex] = {
              ...updatedPanels[newPanelIndex],
              width: updatedPanels[newPanelIndex].width + emptyPanel.width,
            };
          }
        }
      }
    }

    set({
      panels: updatedPanels,
      activePanelId: newPanel.id,
      dragState: {
        isDragging: false,
        sourcePanelId: null,
        sourceTabId: null,
      },
    });
  },

  checkDropZone: (sourcePanelId: string, clientX: number, clientY: number) => {
    const dropZone = document.querySelector(
      `[data-drop-zone-panel="${sourcePanelId}"]`,
    ) as HTMLElement | null;

    if (!dropZone) return;

    const rect = dropZone.getBoundingClientRect();

    // Check if drop is within the drop zone
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      const midpoint = rect.left + rect.width / 2;
      const side = clientX < midpoint ? "left" : "right";
      get().moveTabToNewPanel(sourcePanelId, side);
    }
  },

  setLayout: (panels: Panel[], activePanelId: string | null) => {
    set({ panels, activePanelId });
  },
}));
