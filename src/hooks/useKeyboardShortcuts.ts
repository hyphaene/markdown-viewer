import { useEffect } from "react";
import { useFileStore } from "../stores/fileStore";
import { useSettingsStore } from "../stores/settingsStore";
import { openInVscode, revealInFinder } from "../lib/tauri";

export function useKeyboardShortcuts() {
  const selectedFile = useFileStore((state) => state.selectedFile);
  const openSettings = useSettingsStore((state) => state.openSettings);
  const isSettingsOpen = useSettingsStore((state) => state.isSettingsOpen);
  const closeSettings = useSettingsStore((state) => state.closeSettings);

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

      // Escape - Close Settings
      if (e.key === "Escape" && isSettingsOpen) {
        e.preventDefault();
        closeSettings();
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFile, openSettings, isSettingsOpen, closeSettings]);
}
