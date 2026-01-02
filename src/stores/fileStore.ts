import { create } from "zustand";
import type { FileEntry } from "../types";
import { scanDirectories, readFile, startWatching } from "../lib/tauri";
import { useSearchStore } from "./searchStore";

interface FileStore {
  files: FileEntry[];
  selectedFile: string | null;
  content: string;
  isLoading: boolean;
  error: string | null;
  watchedPaths: string[];
  scan: (paths: string[]) => Promise<void>;
  selectFile: (path: string) => Promise<void>;
  clearSelection: () => void;
  addFile: (file: FileEntry) => void;
  updateFile: (file: FileEntry) => void;
  removeFile: (path: string) => void;
  reloadSelectedFile: () => Promise<void>;
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  selectedFile: null,
  content: "",
  isLoading: false,
  error: null,
  watchedPaths: [],

  scan: async (paths: string[]) => {
    set({ isLoading: true, error: null, watchedPaths: paths });
    try {
      const files = await scanDirectories(paths);
      set({ files, isLoading: false });
      // Index files for search
      useSearchStore.getState().indexFiles(files);
      // Start watching for changes
      await startWatching(paths);
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  selectFile: async (path: string) => {
    set({ selectedFile: path, isLoading: true, error: null });
    try {
      const content = await readFile(path);
      set({ content, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false, content: "" });
    }
  },

  clearSelection: () => {
    set({ selectedFile: null, content: "" });
  },

  addFile: (file: FileEntry) => {
    set((state) => {
      // Check if file already exists
      if (state.files.some((f) => f.path === file.path)) {
        return state;
      }
      const newFiles = [...state.files, file].sort(
        (a, b) => b.modified - a.modified,
      );
      // Re-index for search
      useSearchStore.getState().indexFiles(newFiles);
      return { files: newFiles };
    });
  },

  updateFile: (file: FileEntry) => {
    set((state) => {
      const newFiles = state.files.map((f) =>
        f.path === file.path ? file : f,
      );
      // Re-index for search
      useSearchStore.getState().indexFiles(newFiles);
      return { files: newFiles };
    });
  },

  removeFile: (path: string) => {
    set((state) => {
      const newFiles = state.files.filter((f) => f.path !== path);
      // Re-index for search
      useSearchStore.getState().indexFiles(newFiles);
      // Clear selection if removed file was selected
      if (state.selectedFile === path) {
        return { files: newFiles, selectedFile: null, content: "" };
      }
      return { files: newFiles };
    });
  },

  reloadSelectedFile: async () => {
    const { selectedFile } = get();
    if (selectedFile) {
      try {
        const content = await readFile(selectedFile);
        set({ content });
      } catch (e) {
        console.error("Failed to reload file:", e);
      }
    }
  },
}));
