export interface Frontmatter {
  title?: string;
  date?: string;
  tags?: string[];
  author?: string;
}

export interface FileEntry {
  path: string;
  name: string;
  modified: number;
  size: number;
  frontmatter?: Frontmatter;
}

export interface Source {
  path: string;
  enabled: boolean;
}

export interface Settings {
  sources: Source[];
  exclusions: string[];
  theme: "light" | "dark" | "system";
  fontSize: number; // in pixels, default 18
  contentPadding: number; // vertical padding in pixels, default 16
  contentMargin: number; // horizontal margin in pixels, default 200
  lastOpenedFile: string | null;
  panelLayout?: PanelLayout; // split view layout
}

export interface UpdateInfo {
  version: string;
  download_url: string;
  release_notes: string;
  published_at: string;
}

export interface Tab {
  id: string;
  path: string;
  name: string;
  content: string;
  isLoading: boolean;
  isDirty: boolean;
  scrollPosition?: number;
}

export interface Panel {
  id: string;
  tabs: Tab[];
  activeTabId: string | null;
  width: number; // percentage (0-100)
}

export interface PanelLayout {
  panels: Panel[];
  activePanelId: string | null;
}
