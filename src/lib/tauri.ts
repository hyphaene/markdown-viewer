import { invoke } from "@tauri-apps/api/core";
import type { FileEntry, Settings } from "../types";

export async function scanDirectories(paths: string[]): Promise<FileEntry[]> {
  return invoke("scan_directories", { paths });
}

export async function readFile(path: string): Promise<string> {
  return invoke("read_file", { path });
}

export async function getSettings(): Promise<Settings> {
  return invoke("get_settings");
}

export async function saveSettings(settings: Settings): Promise<void> {
  return invoke("save_settings", { settings });
}

export async function openInVscode(path: string): Promise<void> {
  return invoke("open_in_vscode", { path });
}

export async function revealInFinder(path: string): Promise<void> {
  return invoke("reveal_in_finder", { path });
}

export async function startWatching(paths: string[]): Promise<void> {
  return invoke("start_watching", { paths });
}
