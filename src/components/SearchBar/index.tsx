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
    <div className="relative p-3">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search... ⌘K"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-text placeholder-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
        />
      </div>
      {results.length > 0 && (
        <div className="absolute left-3 right-3 top-full mt-2 bg-surface border border-white/10 rounded-xl shadow-xl max-h-80 overflow-auto z-50 animate-fade-in">
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result.path)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                index === selectedIndex
                  ? "bg-accent/10 text-accent"
                  : "hover:bg-white/5"
              }`}
            >
              <svg
                className={`w-4 h-4 flex-shrink-0 ${index === selectedIndex ? "text-accent" : "text-muted"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">
                  {result.name}
                </div>
                <div className="text-xs text-muted truncate">
                  {shortenPath(result.path)}
                </div>
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
