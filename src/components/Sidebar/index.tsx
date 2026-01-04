import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useFileStore } from "../../stores/fileStore";
import { useTabStore } from "../../stores/tabStore";
import { useSearchStore } from "../../stores/searchStore";
import { useFilterStore, SortOption } from "../../stores/filterStore";
import type { FileEntry } from "../../types";

interface FlatItem {
  type: "header" | "file";
  directory?: string;
  file?: FileEntry;
}

export function Sidebar() {
  const parentRef = useRef<HTMLDivElement>(null);
  const { files, isLoading, allTags } = useFileStore();
  const { tabs, activeTabId, openTab } = useTabStore();
  const { query, results } = useSearchStore();
  const {
    selectedTags,
    sortBy,
    toggleTagFilter,
    removeTagFilter,
    clearTagFilters,
    setSortBy,
  } = useFilterStore();
  const [showFilters, setShowFilters] = useState(false);

  // Find the currently active file path from tabs
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const selectedFile = activeTab?.path ?? null;

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let result = files;

    // Apply search filter if there's a query
    if (query.trim()) {
      const searchPaths = new Set(results.map((r) => r.path));
      result = result.filter((f) => searchPaths.has(f.path));
    }

    // Apply tag filters (OR logic - file matches if it has any selected tag)
    if (selectedTags.length > 0) {
      result = result.filter((f) => {
        const fileTags = f.frontmatter?.tags ?? [];
        return selectedTags.some((tag) => fileTags.includes(tag));
      });
    }

    // Sort files
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "date": {
          const dateA = a.frontmatter?.date ?? "";
          const dateB = b.frontmatter?.date ?? "";
          if (!dateA && !dateB) return b.modified - a.modified;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateB.localeCompare(dateA);
        }
        case "name":
          return a.name.localeCompare(b.name);
        case "modified":
        default:
          return b.modified - a.modified;
      }
    });
  }, [files, query, results, selectedTags, sortBy]);

  const flatItems = useMemo(() => {
    const groups: { [directory: string]: FileEntry[] } = {};
    for (const file of filteredFiles) {
      const dir = file.path.substring(0, file.path.lastIndexOf("/"));
      if (!groups[dir]) {
        groups[dir] = [];
      }
      groups[dir].push(file);
    }

    const items: FlatItem[] = [];
    const directories = Object.keys(groups).sort();

    for (const dir of directories) {
      items.push({ type: "header", directory: dir });
      for (const file of groups[dir]) {
        items.push({ type: "file", file, directory: dir });
      }
    }

    return items;
  }, [filteredFiles]);

  const hasActiveFilters = selectedTags.length > 0 || sortBy !== "modified";

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (flatItems[index].type === "header" ? 32 : 36),
    overscan: 10,
  });

  if (isLoading && files.length === 0) {
    return (
      <aside className="flex-1 overflow-auto p-4">
        <div className="flex items-center gap-2 text-muted text-sm">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Scanning...
        </div>
      </aside>
    );
  }

  if (files.length === 0) {
    return (
      <aside className="flex-1 overflow-auto p-4">
        <div className="text-muted text-sm">No markdown files found</div>
      </aside>
    );
  }

  return (
    <aside className="flex-1 flex flex-col overflow-hidden">
      {/* Header with file count and filter toggle */}
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b border-white/5">
        <div className="text-xs text-muted">
          <span className="text-accent font-medium">
            {filteredFiles.length}
          </span>
          {filteredFiles.length !== files.length && (
            <span className="text-muted/60"> / {files.length}</span>
          )}{" "}
          files
        </div>
        {allTags.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-md transition-colors ${
              showFilters || hasActiveFilters
                ? "text-accent bg-accent/10"
                : "text-muted hover:text-text hover:bg-white/5"
            }`}
            title="Toggle filters"
          >
            <FilterIcon />
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && allTags.length > 0 && (
        <div className="px-4 py-3 border-b border-white/5 bg-surface/50 space-y-3">
          {/* Sort options */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Sort:</span>
            <div className="flex gap-1">
              {(["modified", "date", "name"] as SortOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    sortBy === option
                      ? "bg-accent text-white"
                      : "text-muted hover:text-text hover:bg-white/5"
                  }`}
                >
                  {option === "modified"
                    ? "Modified"
                    : option === "date"
                      ? "Date"
                      : "Name"}
                </button>
              ))}
            </div>
          </div>

          {/* Tag filters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted">Tags:</span>
              {selectedTags.length > 0 && (
                <button
                  onClick={clearTagFilters}
                  className="text-xs text-muted hover:text-accent transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {allTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTagFilter(tag)}
                    className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                      isSelected
                        ? "bg-accent text-white"
                        : "bg-white/5 text-muted hover:text-text hover:bg-white/10"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active filters summary (when filter panel is closed) */}
      {!showFilters && selectedTags.length > 0 && (
        <div className="px-4 py-2 border-b border-white/5 flex flex-wrap gap-1 items-center">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-accent/10 text-accent"
            >
              {tag}
              <button
                onClick={() => removeTagFilter(tag)}
                className="hover:text-white transition-colors"
              >
                <CloseIcon />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Empty state when filters match nothing */}
      {filteredFiles.length === 0 && files.length > 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="text-muted text-sm mb-2">No files match filters</div>
          <button
            onClick={clearTagFilters}
            className="text-xs text-accent hover:text-accent/80 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* File list */}
      {filteredFiles.length > 0 && (
        <div ref={parentRef} className="flex-1 overflow-auto">
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = flatItems[virtualRow.index];

              if (item.type === "header") {
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="px-4 py-2 text-xs font-medium text-muted truncate flex items-center gap-2"
                    title={item.directory}
                  >
                    <svg
                      className="w-3.5 h-3.5 text-accent/50"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    {shortenPath(item.directory!)}
                  </div>
                );
              }

              const file = item.file!;
              const isSelected = selectedFile === file.path;

              return (
                <button
                  key={virtualRow.key}
                  onClick={() => openTab(file.path)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`
                  text-left px-4 py-2 text-sm truncate transition-all flex items-center gap-2
                  ${
                    isSelected
                      ? "bg-accent/10 text-accent border-r-2 border-r-accent"
                      : "text-text/80 hover:bg-white/5 hover:text-text"
                  }
                `}
                  title={file.path}
                >
                  <svg
                    className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-accent" : "text-muted"}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {file.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

function FilterIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="w-3 h-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function shortenPath(path: string): string {
  const home = path.replace(/^\/Users\/[^/]+/, "~");
  const parts = home.split("/");
  if (parts.length <= 3) return home;
  return `${parts[0]}/.../${parts.slice(-2).join("/")}`;
}
