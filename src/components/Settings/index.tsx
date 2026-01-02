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

  // Sync local state when settings change
  useEffect(() => {
    setLocalSources(settings.sources);
    setLocalExclusions(settings.exclusions.join(", "));
    setLocalTheme(settings.theme);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={closeSettings}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 overflow-auto max-h-[60vh]">
          {/* Theme */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Theme</label>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setLocalTheme(theme)}
                  className={`px-4 py-2 rounded-lg border ${
                    localTheme === theme
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Source Directories */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Source Directories
            </label>
            <div className="space-y-2">
              {localSources.map((source, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={source.enabled}
                    onChange={(e) =>
                      handleSourceChange(index, "enabled", e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                  <input
                    type="text"
                    value={source.path}
                    onChange={(e) =>
                      handleSourceChange(index, "path", e.target.value)
                    }
                    placeholder="~/path/to/directory"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                  <button
                    onClick={() => handleRemoveSource(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddSource}
                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 dark:hover:border-gray-500"
              >
                + Add Directory
              </button>
            </div>
          </div>

          {/* Exclusions */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Excluded Directories
            </label>
            <input
              type="text"
              value={localExclusions}
              onChange={(e) => setLocalExclusions(e.target.value)}
              placeholder="node_modules, .git, vendor"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Comma-separated list of directories to exclude
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={closeSettings}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
          >
            Save & Reload
          </button>
        </div>
      </div>
    </div>
  );
}
