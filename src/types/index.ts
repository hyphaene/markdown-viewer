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
}

export interface UpdateInfo {
  version: string;
  download_url: string;
  release_notes: string;
  published_at: string;
}
