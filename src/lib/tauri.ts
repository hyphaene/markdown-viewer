import { invoke } from "@tauri-apps/api/core";
import type { FileEntry, Settings, UpdateInfo } from "../types";

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

export async function checkForUpdates(): Promise<UpdateInfo | null> {
  return invoke("check_for_updates");
}

export async function downloadUpdate(downloadUrl: string): Promise<string> {
  return invoke("download_update", { downloadUrl });
}

export async function installUpdate(dmgPath: string): Promise<void> {
  return invoke("install_update", { dmgPath });
}

export async function getCurrentAppVersion(): Promise<string> {
  return invoke("get_current_app_version");
}
