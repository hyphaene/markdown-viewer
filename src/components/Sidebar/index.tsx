import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useFileStore } from "../../stores/fileStore";
import { useTabStore } from "../../stores/tabStore";
import type { FileEntry } from "../../types";

interface FlatItem {
  type: "header" | "file";
  directory?: string;
  file?: FileEntry;
}

export function Sidebar() {
  const parentRef = useRef<HTMLDivElement>(null);
  const { files, isLoading } = useFileStore();
  const { tabs, activeTabId, openTab } = useTabStore();

  // Find the currently active file path from tabs
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const selectedFile = activeTab?.path ?? null;

  const flatItems = useMemo(() => {
    const groups: { [directory: string]: FileEntry[] } = {};
    for (const file of files) {
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
  }, [files]);

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
      <div className="text-xs text-muted px-4 py-2.5 shrink-0 border-b border-white/5">
        <span className="text-accent font-medium">{files.length}</span> files
      </div>
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
    </aside>
  );
}

function shortenPath(path: string): string {
  const home = path.replace(/^\/Users\/[^/]+/, "~");
  const parts = home.split("/");
  if (parts.length <= 3) return home;
  return `${parts[0]}/.../${parts.slice(-2).join("/")}`;
}
