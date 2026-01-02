import { useMemo } from "react";
import { useFileStore } from "../../stores/fileStore";
import type { FileEntry } from "../../types";

interface GroupedFiles {
  [directory: string]: FileEntry[];
}

export function Sidebar() {
  const { files, selectedFile, selectFile, isLoading } = useFileStore();

  const groupedFiles = useMemo(() => {
    const groups: GroupedFiles = {};
    for (const file of files) {
      const dir = file.path.substring(0, file.path.lastIndexOf("/"));
      if (!groups[dir]) {
        groups[dir] = [];
      }
      groups[dir].push(file);
    }
    return groups;
  }, [files]);

  const directories = Object.keys(groupedFiles).sort();

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
    <aside className="flex-1 overflow-auto">
      <div className="text-xs text-gray-500 dark:text-gray-400 px-4 py-2">
        {files.length} files
      </div>
      {directories.map((dir) => (
        <div key={dir} className="mb-2">
          <div
            className="px-4 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 truncate"
            title={dir}
          >
            {shortenPath(dir)}
          </div>
          {groupedFiles[dir].map((file) => (
            <button
              key={file.path}
              onClick={() => selectFile(file.path)}
              className={`w-full text-left px-4 py-1.5 text-sm truncate hover:bg-gray-200 dark:hover:bg-gray-700 ${
                selectedFile === file.path
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : ""
              }`}
              title={file.path}
            >
              {file.name}
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}

function shortenPath(path: string): string {
  const home = path.replace(/^\/Users\/[^/]+/, "~");
  const parts = home.split("/");
  if (parts.length <= 3) return home;
  return `${parts[0]}/.../${parts.slice(-2).join("/")}`;
}
