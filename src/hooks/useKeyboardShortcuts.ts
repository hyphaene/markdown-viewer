import { useEffect } from "react";
import { useTabStore } from "../stores/tabStore";
import { useSettingsStore } from "../stores/settingsStore";
import { openInVscode, revealInFinder } from "../lib/tauri";

export function useKeyboardShortcuts() {
  const { tabs, activeTabId, closeTab, nextTab, previousTab } = useTabStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const selectedFile = activeTab?.path ?? null;

  const openSettings = useSettingsStore((state) => state.openSettings);
  const isSettingsOpen = useSettingsStore((state) => state.isSettingsOpen);
  const closeSettings = useSettingsStore((state) => state.closeSettings);
  const increaseFontSize = useSettingsStore((state) => state.increaseFontSize);
  const decreaseFontSize = useSettingsStore((state) => state.decreaseFontSize);
  const increaseContentMargin = useSettingsStore(
    (state) => state.increaseContentMargin,
  );
  const decreaseContentMargin = useSettingsStore(
    (state) => state.decreaseContentMargin,
  );

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Cmd+, - Open Settings
      if (isMod && e.key === ",") {
        e.preventDefault();
        openSettings();
        return;
      }

      // Cmd+= or Cmd++ - Increase font size
      if (isMod && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        increaseFontSize();
        return;
      }

      // Cmd+- - Decrease font size
      if (isMod && e.key === "-") {
        e.preventDefault();
        decreaseFontSize();
        return;
      }

      // Shift+= or Shift++ - Decrease content margin (more width for content)
      if (e.shiftKey && !isMod && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        decreaseContentMargin();
        return;
      }

      // Shift+- - Increase content margin (less width for content)
      if (e.shiftKey && !isMod && (e.key === "_" || e.key === "-")) {
        e.preventDefault();
        increaseContentMargin();
        return;
      }

      // Escape - Close Settings
      if (e.key === "Escape" && isSettingsOpen) {
        e.preventDefault();
        closeSettings();
        return;
      }

      // Cmd+W - Close current tab
      if (isMod && e.key === "w") {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
        return;
      }

      // Ctrl+Tab - Next tab
      if (e.ctrlKey && e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        nextTab();
        return;
      }

      // Ctrl+Shift+Tab - Previous tab
      if (e.ctrlKey && e.shiftKey && e.key === "Tab") {
        e.preventDefault();
        previousTab();
        return;
      }

      // Cmd+Shift+] - Next tab (alternative)
      if (isMod && e.shiftKey && e.key === "]") {
        e.preventDefault();
        nextTab();
        return;
      }

      // Cmd+Shift+[ - Previous tab (alternative)
      if (isMod && e.shiftKey && e.key === "[") {
        e.preventDefault();
        previousTab();
        return;
      }

      // Commands that require a selected file
      if (!selectedFile) return;

      // Cmd+O - Open in VS Code
      if (isMod && e.key === "o") {
        e.preventDefault();
        try {
          await openInVscode(selectedFile);
        } catch (err) {
          console.error("Failed to open in VS Code:", err);
        }
        return;
      }

      // Cmd+Shift+C - Copy Path
      if (isMod && e.shiftKey && e.key === "c") {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(selectedFile);
        } catch (err) {
          console.error("Failed to copy path:", err);
        }
        return;
      }

      // Cmd+Shift+R - Reveal in Finder
      if (isMod && e.shiftKey && e.key === "r") {
        e.preventDefault();
        try {
          await revealInFinder(selectedFile);
        } catch (err) {
          console.error("Failed to reveal in Finder:", err);
        }
        return;
      }
    };

    // Use capture phase to intercept before browser/Tauri handles zoom shortcuts
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [
    selectedFile,
    activeTabId,
    closeTab,
    nextTab,
    previousTab,
    openSettings,
    isSettingsOpen,
    closeSettings,
    increaseFontSize,
    decreaseFontSize,
    increaseContentMargin,
    decreaseContentMargin,
  ]);
}
