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
  lastOpenedFile: string | null;
}
