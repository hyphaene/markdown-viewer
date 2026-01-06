import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";
import type { Settings, Source, PanelLayout } from "../types";

interface SettingsStore {
  settings: Settings;
  isLoaded: boolean;
  isSettingsOpen: boolean;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
  updateSources: (sources: Source[]) => Promise<void>;
  updateExclusions: (exclusions: string[]) => Promise<void>;
  updateTheme: (theme: Settings["theme"]) => Promise<void>;
  updateFontSize: (fontSize: number) => Promise<void>;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  updateContentPadding: (padding: number) => Promise<void>;
  increaseContentPadding: () => void;
  decreaseContentPadding: () => void;
  updateContentMargin: (margin: number) => Promise<void>;
  increaseContentMargin: () => void;
  decreaseContentMargin: () => void;
  updatePanelLayout: (layout: PanelLayout) => Promise<void>;
  getPanelLayout: () => PanelLayout | undefined;
  openSettings: () => void;
  closeSettings: () => void;
}

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 32;
const FONT_SIZE_STEP = 2;

const MIN_CONTENT_PADDING = 8;
const MAX_CONTENT_PADDING = 64;
const CONTENT_PADDING_STEP = 8;

const MIN_CONTENT_MARGIN = 50;
const MAX_CONTENT_MARGIN = 1200;
const CONTENT_MARGIN_STEP = 50;

const defaultSettings: Settings = {
  sources: [
    { path: "~/Code", enabled: true },
    { path: "~/Notes", enabled: true },
  ],
  exclusions: ["node_modules", ".git", "vendor", "dist", "build", "target"],
  theme: "system",
  fontSize: 18,
  contentPadding: 16,
  contentMargin: 200,
  lastOpenedFile: null,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoaded: false,
  isSettingsOpen: false,

  loadSettings: async () => {
    try {
      const store = await load("settings.json");
      const savedSettings = await store.get<Settings>("settings");

      if (savedSettings) {
        set({ settings: savedSettings, isLoaded: true });
      } else {
        // Save defaults if no settings exist
        await store.set("settings", defaultSettings);
        await store.save();
        set({ settings: defaultSettings, isLoaded: true });
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
      set({ settings: defaultSettings, isLoaded: true });
    }
  },

  saveSettings: async (settings: Settings) => {
    try {
      const store = await load("settings.json");
      await store.set("settings", settings);
      await store.save();
      set({ settings });
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  },

  updateSources: async (sources: Source[]) => {
    const { settings, saveSettings } = get();
    await saveSettings({ ...settings, sources });
  },

  updateExclusions: async (exclusions: string[]) => {
    const { settings, saveSettings } = get();
    await saveSettings({ ...settings, exclusions });
  },

  updateTheme: async (theme: Settings["theme"]) => {
    const { settings, saveSettings } = get();
    await saveSettings({ ...settings, theme });
    applyTheme(theme);
  },

  updateFontSize: async (fontSize: number) => {
    const { settings, saveSettings } = get();
    const clampedSize = Math.min(
      MAX_FONT_SIZE,
      Math.max(MIN_FONT_SIZE, fontSize),
    );
    await saveSettings({ ...settings, fontSize: clampedSize });
  },

  increaseFontSize: () => {
    const { settings, updateFontSize } = get();
    updateFontSize(settings.fontSize + FONT_SIZE_STEP);
  },

  decreaseFontSize: () => {
    const { settings, updateFontSize } = get();
    updateFontSize(settings.fontSize - FONT_SIZE_STEP);
  },

  updateContentPadding: async (padding: number) => {
    const { settings, saveSettings } = get();
    const clampedPadding = Math.min(
      MAX_CONTENT_PADDING,
      Math.max(MIN_CONTENT_PADDING, padding),
    );
    await saveSettings({ ...settings, contentPadding: clampedPadding });
  },

  increaseContentPadding: () => {
    const { settings, updateContentPadding } = get();
    updateContentPadding(
      (settings.contentPadding ?? 16) + CONTENT_PADDING_STEP,
    );
  },

  decreaseContentPadding: () => {
    const { settings, updateContentPadding } = get();
    updateContentPadding(
      (settings.contentPadding ?? 16) - CONTENT_PADDING_STEP,
    );
  },

  updateContentMargin: async (margin: number) => {
    const { settings, saveSettings } = get();
    const clampedMargin = Math.min(
      MAX_CONTENT_MARGIN,
      Math.max(MIN_CONTENT_MARGIN, margin),
    );
    await saveSettings({ ...settings, contentMargin: clampedMargin });
  },

  increaseContentMargin: () => {
    const { settings, updateContentMargin } = get();
    updateContentMargin((settings.contentMargin ?? 200) + CONTENT_MARGIN_STEP);
  },

  decreaseContentMargin: () => {
    const { settings, updateContentMargin } = get();
    updateContentMargin((settings.contentMargin ?? 200) - CONTENT_MARGIN_STEP);
  },

  updatePanelLayout: async (layout: PanelLayout) => {
    const { settings, saveSettings } = get();
    await saveSettings({ ...settings, panelLayout: layout });
  },

  getPanelLayout: () => {
    const { settings } = get();
    return settings.panelLayout;
  },

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
}));

function applyTheme(theme: Settings["theme"]) {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // System preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

// Apply theme on initial load
export function initializeTheme(theme: Settings["theme"]) {
  applyTheme(theme);

  // Listen for system theme changes if using system preference
  if (theme === "system") {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (useSettingsStore.getState().settings.theme === "system") {
          if (e.matches) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      });
  }
}
