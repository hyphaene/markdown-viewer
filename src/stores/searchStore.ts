import { create } from "zustand";
import MiniSearch from "minisearch";
import type { FileEntry } from "../types";

interface SearchResult {
  id: string;
  path: string;
  name: string;
  score: number;
}

interface SearchStore {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  miniSearch: MiniSearch<FileEntry> | null;
  setQuery: (query: string) => void;
  indexFiles: (files: FileEntry[]) => void;
  search: (query: string) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: "",
  results: [],
  isSearching: false,
  miniSearch: null,

  indexFiles: (files: FileEntry[]) => {
    const miniSearch = new MiniSearch<FileEntry>({
      fields: ["name", "path"],
      storeFields: ["path", "name"],
      searchOptions: {
        fuzzy: 0.2,
        prefix: true,
      },
    });

    const indexedFiles = files.map((file, index) => ({
      ...file,
      id: String(index),
    }));

    miniSearch.addAll(indexedFiles);
    set({ miniSearch });

    // Re-run search if there's an active query
    const { query } = get();
    if (query) {
      get().search(query);
    }
  },

  setQuery: (query: string) => {
    set({ query });
    get().search(query);
  },

  search: (query: string) => {
    const { miniSearch } = get();

    if (!query.trim()) {
      set({ results: [], isSearching: false });
      return;
    }

    if (!miniSearch) {
      set({ results: [], isSearching: false });
      return;
    }

    set({ isSearching: true });

    const searchResults = miniSearch.search(query, {
      fuzzy: 0.2,
      prefix: true,
      boost: { name: 2 },
    });

    const results: SearchResult[] = searchResults
      .slice(0, 20)
      .map((result) => ({
        id: result.id,
        path: result.path,
        name: result.name,
        score: result.score,
      }));

    set({ results, isSearching: false });
  },

  clearSearch: () => {
    set({ query: "", results: [], isSearching: false });
  },
}));
