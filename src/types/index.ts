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
  lastOpenedFile: string | null;
}

export interface UpdateInfo {
  version: string;
  download_url: string;
  release_notes: string;
  published_at: string;
}
