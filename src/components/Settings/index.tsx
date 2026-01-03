import { useState, useEffect } from "react";
import { useSettingsStore } from "../../stores/settingsStore";
import type { Source, Settings } from "../../types";

export function SettingsModal() {
  const { settings, isSettingsOpen, closeSettings, saveSettings } =
    useSettingsStore();

  const [localSources, setLocalSources] = useState<Source[]>(settings.sources);
  const [localExclusions, setLocalExclusions] = useState<string>(
    settings.exclusions.join(", "),
  );
  const [localTheme, setLocalTheme] = useState<Settings["theme"]>(
    settings.theme,
  );
  const [localFontSize, setLocalFontSize] = useState<number>(
    settings.fontSize ?? 18,
  );
  const [localContentPadding, setLocalContentPadding] = useState<number>(
    settings.contentPadding ?? 16,
  );
  const [localContentWidth, setLocalContentWidth] = useState<number>(
    settings.contentWidth ?? 896,
  );

  // Sync local state when settings change
  useEffect(() => {
    setLocalSources(settings.sources);
    setLocalExclusions(settings.exclusions.join(", "));
    setLocalTheme(settings.theme);
    setLocalFontSize(settings.fontSize ?? 18);
    setLocalContentPadding(settings.contentPadding ?? 16);
    setLocalContentWidth(settings.contentWidth ?? 896);
  }, [settings, isSettingsOpen]);

  if (!isSettingsOpen) return null;

  const handleSave = async () => {
    const exclusions = localExclusions
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await saveSettings({
      ...settings,
      sources: localSources,
      exclusions,
      theme: localTheme,
      fontSize: localFontSize,
      contentPadding: localContentPadding,
      contentWidth: localContentWidth,
    });
    closeSettings();
    // Trigger rescan if sources changed
    window.location.reload();
  };

  const handleAddSource = () => {
    setLocalSources([...localSources, { path: "", enabled: true }]);
  };

  const handleRemoveSource = (index: number) => {
    setLocalSources(localSources.filter((_, i) => i !== index));
  };

  const handleSourceChange = (
    index: number,
    field: keyof Source,
    value: string | boolean,
  ) => {
    setLocalSources(
      localSources.map((source, i) =>
        i === index ? { ...source, [field]: value } : source,
      ),
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-xl font-semibold text-text">Settings</h2>
          <button
            onClick={closeSettings}
            className="p-2 rounded-lg text-muted hover:text-text hover:bg-white/5 transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 overflow-auto max-h-[60vh] space-y-6">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-text mb-3">
              Theme
            </label>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setLocalTheme(theme)}
                  className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    localTheme === theme
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-white/10 text-muted hover:border-white/20 hover:text-text"
                  }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-text mb-3">
              Font Size
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  setLocalFontSize(Math.max(12, localFontSize - 2))
                }
                disabled={localFontSize <= 12}
                className="w-10 h-10 rounded-lg border border-white/10 text-muted hover:text-text hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-semibold text-text">
                  {localFontSize}
                </span>
                <span className="text-muted ml-1">px</span>
              </div>
              <button
                onClick={() =>
                  setLocalFontSize(Math.min(32, localFontSize + 2))
                }
                disabled={localFontSize >= 32}
                className="w-10 h-10 rounded-lg border border-white/10 text-muted hover:text-text hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
              >
                +
              </button>
            </div>
            <p className="mt-2 text-xs text-muted text-center">
              Tip: Use ⌘+ and ⌘− to adjust font size anytime
            </p>
          </div>

          {/* Content Padding */}
          <div>
            <label className="block text-sm font-medium text-text mb-3">
              Content Padding
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  setLocalContentPadding(Math.max(8, localContentPadding - 8))
                }
                disabled={localContentPadding <= 8}
                className="w-10 h-10 rounded-lg border border-white/10 text-muted hover:text-text hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-semibold text-text">
                  {localContentPadding}
                </span>
                <span className="text-muted ml-1">px</span>
              </div>
              <button
                onClick={() =>
                  setLocalContentPadding(Math.min(64, localContentPadding + 8))
                }
                disabled={localContentPadding >= 64}
                className="w-10 h-10 rounded-lg border border-white/10 text-muted hover:text-text hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
              >
                +
              </button>
            </div>
            <p className="mt-2 text-xs text-muted text-center">
              Adjustable in Settings only
            </p>
          </div>

          {/* Content Width */}
          <div>
            <label className="block text-sm font-medium text-text mb-3">
              Content Width
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  setLocalContentWidth(Math.max(600, localContentWidth - 100))
                }
                disabled={localContentWidth <= 600}
                className="w-10 h-10 rounded-lg border border-white/10 text-muted hover:text-text hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-semibold text-text">
                  {localContentWidth}
                </span>
                <span className="text-muted ml-1">px</span>
              </div>
              <button
                onClick={() =>
                  setLocalContentWidth(Math.min(1600, localContentWidth + 100))
                }
                disabled={localContentWidth >= 1600}
                className="w-10 h-10 rounded-lg border border-white/10 text-muted hover:text-text hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
              >
                +
              </button>
            </div>
            <p className="mt-2 text-xs text-muted text-center">
              Tip: Use ⇧+ and ⇧− to adjust width anytime
            </p>
          </div>

          {/* Source Directories */}
          <div>
            <label className="block text-sm font-medium text-text mb-3">
              Source Directories
            </label>
            <div className="space-y-2">
              {localSources.map((source, index) => (
                <div key={index} className="flex items-center gap-3">
                  <label className="relative flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={source.enabled}
                      onChange={(e) =>
                        handleSourceChange(index, "enabled", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 rounded border border-white/20 peer-checked:bg-accent peer-checked:border-accent transition-all flex items-center justify-center">
                      {source.enabled && (
                        <svg
                          className="w-3 h-3 text-background"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </label>
                  <input
                    type="text"
                    value={source.path}
                    onChange={(e) =>
                      handleSourceChange(index, "path", e.target.value)
                    }
                    placeholder="~/path/to/directory"
                    className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-text placeholder-muted focus:outline-none focus:border-accent/50 transition-all"
                  />
                  <button
                    onClick={() => handleRemoveSource(index)}
                    className="p-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddSource}
                className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-muted hover:border-accent/30 hover:text-accent transition-all"
              >
                + Add Directory
              </button>
            </div>
          </div>

          {/* Exclusions */}
          <div>
            <label className="block text-sm font-medium text-text mb-3">
              Excluded Directories
            </label>
            <input
              type="text"
              value={localExclusions}
              onChange={(e) => setLocalExclusions(e.target.value)}
              placeholder="node_modules, .git, vendor"
              className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-text placeholder-muted focus:outline-none focus:border-accent/50 transition-all"
            />
            <p className="mt-2 text-xs text-muted">
              Comma-separated list of directories to exclude
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5">
          <button
            onClick={closeSettings}
            className="px-5 py-2.5 rounded-lg border border-white/10 text-text hover:bg-white/5 transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-lg bg-accent text-background hover:bg-accent/90 transition-all font-medium"
          >
            Save & Reload
          </button>
        </div>
      </div>
    </div>
  );
}
