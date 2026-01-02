import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchStore } from "../../stores/searchStore";
import { useTabStore } from "../../stores/tabStore";

export function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { query, results, setQuery, clearSearch } = useSearchStore();
  const openTab = useTabStore((state) => state.openTab);

  const handleSelect = useCallback(
    (path: string) => {
      openTab(path);
      clearSearch();
      inputRef.current?.blur();
    },
    [openTab, clearSearch],
  );

  // Keyboard shortcut: Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex].path);
        }
        break;
      case "Escape":
        e.preventDefault();
        clearSearch();
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className="relative p-2">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search... (⌘K)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {results.length > 0 && (
        <div className="absolute left-2 right-2 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-auto z-50">
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result.path)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-3 py-2 ${
                index === selectedIndex
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <div className="text-sm font-medium truncate">{result.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {shortenPath(result.path)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function shortenPath(path: string): string {
  return path.replace(/^\/Users\/[^/]+/, "~");
}
