import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import { Sidebar } from "./components/Sidebar";
import { MarkdownViewer } from "./components/MarkdownViewer";
import { SearchBar } from "./components/SearchBar";
import { useFileStore } from "./stores/fileStore";
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

  useEffect(() => {
    scan(["~/Code", "~/Notes"]);
  }, [scan]);

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

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700">
        <SearchBar />
        <Sidebar />
      </div>
      <MarkdownViewer />
    </div>
  );
}

export default App;
