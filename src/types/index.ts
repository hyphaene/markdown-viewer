export interface FileEntry {
  path: string;
  name: string;
  modified: number;
  size: number;
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
  contentPadding: number; // in pixels, default 16
  contentWidth: number; // in pixels, default 896 (max-w-4xl)
  lastOpenedFile: string | null;
}

export interface UpdateInfo {
  version: string;
  download_url: string;
  release_notes: string;
  published_at: string;
}
