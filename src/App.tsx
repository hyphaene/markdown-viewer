import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import { Sidebar } from "./components/Sidebar";
import { MarkdownViewer } from "./components/MarkdownViewer";
import { SearchBar } from "./components/SearchBar";
import { SettingsModal } from "./components/Settings";
import { useFileStore } from "./stores/fileStore";
import { useSettingsStore, initializeTheme } from "./stores/settingsStore";
import type { FileEntry } from "./types";

function App() {
  const {
    scan,
    addFile,
    updateFile,
    removeFile,
    reloadSelectedFile,
    selectedFile,
  } = useFileStore();
  const { settings, isLoaded, loadSettings, openSettings } = useSettingsStore();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Apply theme once settings are loaded
  useEffect(() => {
    if (isLoaded) {
      initializeTheme(settings.theme);
    }
  }, [isLoaded, settings.theme]);

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
      // Reload content if the changed file is currently selected
      if (selectedFile === event.payload.path) {
        reloadSelectedFile();
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
  }, [addFile, updateFile, removeFile, reloadSelectedFile, selectedFile]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700">
        <SearchBar />
        <Sidebar />
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={openSettings}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
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
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </button>
        </div>
      </div>
      <MarkdownViewer />
      <SettingsModal />
    </div>
  );
}

export default App;
