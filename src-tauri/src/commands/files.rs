use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub path: String,
    pub name: String,
    pub modified: u64,
    pub size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub sources: Vec<Source>,
    pub exclusions: Vec<String>,
    pub theme: String,
    pub last_opened_file: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Source {
    pub path: String,
    pub enabled: bool,
}

/// Expands ~ to the user's home directory
fn expand_tilde(path: &str) -> PathBuf {
    if path.starts_with('~') {
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(path.replacen('~', &home, 1));
        }
    }
    PathBuf::from(path)
}

/// Checks if a directory name should be excluded from scanning
fn should_exclude(name: &str, exclusions: &[&str]) -> bool {
    // Exclude hidden directories (starting with .)
    if name.starts_with('.') {
        return true;
    }
    // Exclude directories in the exclusions list
    exclusions.iter().any(|ex| name == *ex)
}

#[tauri::command]
pub async fn scan_directories(paths: Vec<String>) -> Result<Vec<FileEntry>, String> {
    let exclusions = ["node_modules", ".git", "vendor", "dist", "build", "target"];
    let mut entries: Vec<FileEntry> = Vec::new();

    for path in paths {
        let expanded_path = expand_tilde(&path);

        if !expanded_path.exists() {
            continue;
        }

        for entry in WalkDir::new(&expanded_path)
            .into_iter()
            .filter_entry(|e| {
                // Skip excluded directories
                if e.file_type().is_dir() {
                    if let Some(name) = e.file_name().to_str() {
                        return !should_exclude(name, &exclusions);
                    }
                }
                true
            })
            .filter_map(|e| e.ok())
        {
            let entry_path = entry.path();

            // Only include .md and .mdx files
            if let Some(ext) = entry_path.extension() {
                let ext_str = ext.to_string_lossy().to_lowercase();
                if ext_str == "md" || ext_str == "mdx" {
                    if let Ok(metadata) = entry.metadata() {
                        let modified = metadata
                            .modified()
                            .ok()
                            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                            .map(|d| d.as_secs())
                            .unwrap_or(0);

                        let name = entry_path
                            .file_name()
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_default();

                        entries.push(FileEntry {
                            path: entry_path.to_string_lossy().to_string(),
                            name,
                            modified,
                            size: metadata.len(),
                        });
                    }
                }
            }
        }
    }

    // Sort by modified time (newest first)
    entries.sort_by(|a, b| b.modified.cmp(&a.modified));

    Ok(entries)
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    let expanded_path = expand_tilde(&path);

    fs::read_to_string(&expanded_path)
        .map_err(|e| format!("Failed to read file '{}': {}", path, e))
}

#[tauri::command]
pub async fn get_settings() -> Result<Settings, String> {
    Ok(Settings {
        sources: vec![],
        exclusions: vec![
            "node_modules".to_string(),
            ".git".to_string(),
            "vendor".to_string(),
            "dist".to_string(),
            "build".to_string(),
        ],
        theme: "system".to_string(),
        last_opened_file: None,
    })
}

#[tauri::command]
pub async fn save_settings(settings: Settings) -> Result<(), String> {
    // Stub: will be implemented in Phase 7
    let _ = settings;
    Ok(())
}
