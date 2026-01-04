import { create } from "zustand";

export type SortOption = "modified" | "date" | "name";

interface FilterStore {
  selectedTags: string[];
  sortBy: SortOption;
  addTagFilter: (tag: string) => void;
  removeTagFilter: (tag: string) => void;
  toggleTagFilter: (tag: string) => void;
  clearTagFilters: () => void;
  setSortBy: (sort: SortOption) => void;
  clearAll: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  selectedTags: [],
  sortBy: "modified",

  addTagFilter: (tag: string) => {
    set((state) => {
      if (state.selectedTags.includes(tag)) {
        return state;
      }
      return { selectedTags: [...state.selectedTags, tag] };
    });
  },

  removeTagFilter: (tag: string) => {
    set((state) => ({
      selectedTags: state.selectedTags.filter((t) => t !== tag),
    }));
  },

  toggleTagFilter: (tag: string) => {
    set((state) => {
      if (state.selectedTags.includes(tag)) {
        return { selectedTags: state.selectedTags.filter((t) => t !== tag) };
      }
      return { selectedTags: [...state.selectedTags, tag] };
    });
  },

  clearTagFilters: () => {
    set({ selectedTags: [] });
  },

  setSortBy: (sort: SortOption) => {
    set({ sortBy: sort });
  },

  clearAll: () => {
    set({ selectedTags: [], sortBy: "modified" });
  },
}));
