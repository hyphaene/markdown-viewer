import { create } from "zustand";
import type { FileEntry } from "../types";
import { scanDirectories, readFile } from "../lib/tauri";
import { useSearchStore } from "./searchStore";

interface FileStore {
  files: FileEntry[];
  selectedFile: string | null;
  content: string;
  isLoading: boolean;
  error: string | null;
  scan: (paths: string[]) => Promise<void>;
  selectFile: (path: string) => Promise<void>;
  clearSelection: () => void;
}

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  selectedFile: null,
  content: "",
  isLoading: false,
  error: null,

  scan: async (paths: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const files = await scanDirectories(paths);
      set({ files, isLoading: false });
      // Index files for search
      useSearchStore.getState().indexFiles(files);
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
}));
