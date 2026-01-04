import { create } from "zustand";
import type { FileEntry, Frontmatter } from "../types";
import { scanDirectories, readFile, startWatching } from "../lib/tauri";
import { useSearchStore } from "./searchStore";
import { parseMarkdown } from "../lib/markdown";

interface FileStore {
  files: FileEntry[];
  selectedFile: string | null;
  content: string;
  isLoading: boolean;
  error: string | null;
  watchedPaths: string[];
  allTags: string[];
  scan: (paths: string[]) => Promise<void>;
  selectFile: (path: string) => Promise<void>;
  clearSelection: () => void;
  addFile: (file: FileEntry) => void;
  updateFile: (file: FileEntry) => void;
  removeFile: (path: string) => void;
  reloadSelectedFile: () => Promise<void>;
  updateFileFrontmatter: (
    path: string,
    frontmatter: Frontmatter | undefined,
  ) => void;
}

function collectAllTags(files: FileEntry[]): string[] {
  const tagSet = new Set<string>();
  for (const file of files) {
    if (file.frontmatter?.tags) {
      for (const tag of file.frontmatter.tags) {
        tagSet.add(tag);
      }
    }
  }
  return Array.from(tagSet).sort();
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  selectedFile: null,
  content: "",
  isLoading: false,
  error: null,
  watchedPaths: [],
  allTags: [],

  scan: async (paths: string[]) => {
    set({ isLoading: true, error: null, watchedPaths: paths });
    try {
      const files = await scanDirectories(paths);
      // Parse frontmatter for all files in parallel
      const filesWithFrontmatter = await Promise.all(
        files.map(async (file) => {
          try {
            const content = await readFile(file.path);
            const { frontmatter } = parseMarkdown(content);
            return { ...file, frontmatter };
          } catch {
            return file;
          }
        }),
      );
      const allTags = collectAllTags(filesWithFrontmatter);
      set({ files: filesWithFrontmatter, allTags, isLoading: false });
      // Index files for search
      useSearchStore.getState().indexFiles(filesWithFrontmatter);
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

  updateFileFrontmatter: (
    path: string,
    frontmatter: Frontmatter | undefined,
  ) => {
    set((state) => {
      const newFiles = state.files.map((f) =>
        f.path === path ? { ...f, frontmatter } : f,
      );
      const allTags = collectAllTags(newFiles);
      return { files: newFiles, allTags };
    });
  },
}));
