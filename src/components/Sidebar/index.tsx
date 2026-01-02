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
    estimateSize: (index) => (flatItems[index].type === "header" ? 28 : 32),
    overscan: 10,
  });

  if (isLoading && files.length === 0) {
    return (
      <aside className="flex-1 overflow-auto p-4">
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          Scanning...
        </div>
      </aside>
    );
  }

  if (files.length === 0) {
    return (
      <aside className="flex-1 overflow-auto p-4">
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          No markdown files found
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex-1 flex flex-col overflow-hidden">
      <div className="text-xs text-gray-500 dark:text-gray-400 px-4 py-2 shrink-0">
        {files.length} files
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
                  className="px-4 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 truncate"
                  title={item.directory}
                >
                  {shortenPath(item.directory!)}
                </div>
              );
            }

            const file = item.file!;
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
                className={`text-left px-4 py-1.5 text-sm truncate hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  selectedFile === file.path
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    : ""
                }`}
                title={file.path}
              >
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
