use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::PathBuf;
use std::sync::mpsc;
use std::thread;
use tauri::{AppHandle, Emitter};

use crate::commands::files::FileEntry;

#[derive(Clone, serde::Serialize)]
pub struct FileEvent {
    pub path: String,
    pub name: String,
    pub modified: u64,
    pub size: u64,
}

impl From<FileEntry> for FileEvent {
    fn from(entry: FileEntry) -> Self {
        Self {
            path: entry.path,
            name: entry.name,
            modified: entry.modified,
            size: entry.size,
        }
    }
}

fn expand_tilde(path: &str) -> PathBuf {
    if path.starts_with('~') {
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(path.replacen('~', &home, 1));
        }
    }
    PathBuf::from(path)
}

fn is_markdown_file(path: &std::path::Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.eq_ignore_ascii_case("md") || ext.eq_ignore_ascii_case("mdx"))
        .unwrap_or(false)
}

fn should_exclude(path: &std::path::Path) -> bool {
    let exclusions = ["node_modules", ".git", "vendor", "dist", "build", "target"];

    for component in path.components() {
        if let std::path::Component::Normal(name) = component {
            if let Some(name_str) = name.to_str() {
                if name_str.starts_with('.') || exclusions.contains(&name_str) {
                    return true;
                }
            }
        }
    }
    false
}

fn get_file_entry(path: &std::path::Path) -> Option<FileEntry> {
    if !path.exists() || !is_markdown_file(path) {
        return None;
    }

    let metadata = path.metadata().ok()?;
    let modified = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .map(|s| s.to_string())
        .unwrap_or_default();

    Some(FileEntry {
        path: path.to_string_lossy().to_string(),
        name,
        modified,
        size: metadata.len(),
    })
}

pub fn start_watcher(app_handle: AppHandle, paths: Vec<String>) {
    thread::spawn(move || {
        let (tx, rx) = mpsc::channel::<Result<Event, notify::Error>>();

        let mut watcher = match RecommendedWatcher::new(tx, Config::default()) {
            Ok(w) => w,
            Err(e) => {
                eprintln!("Failed to create watcher: {}", e);
                return;
            }
        };

        for path in &paths {
            let expanded = expand_tilde(path);
            if expanded.exists() {
                if let Err(e) = watcher.watch(&expanded, RecursiveMode::Recursive) {
                    eprintln!("Failed to watch {}: {}", path, e);
                }
            }
        }

        for res in rx {
            match res {
                Ok(event) => {
                    handle_event(&app_handle, event);
                }
                Err(e) => {
                    eprintln!("Watch error: {}", e);
                }
            }
        }
    });
}

fn handle_event(app_handle: &AppHandle, event: Event) {
    for path in event.paths {
        // Skip excluded directories
        if should_exclude(&path) {
            continue;
        }

        // Only handle markdown files
        if !is_markdown_file(&path) {
            continue;
        }

        match event.kind {
            EventKind::Create(_) => {
                if let Some(entry) = get_file_entry(&path) {
                    let _ = app_handle.emit("file:added", FileEvent::from(entry));
                }
            }
            EventKind::Modify(_) => {
                if let Some(entry) = get_file_entry(&path) {
                    let _ = app_handle.emit("file:changed", FileEvent::from(entry));
                }
            }
            EventKind::Remove(_) => {
                let _ = app_handle.emit("file:removed", path.to_string_lossy().to_string());
            }
            _ => {}
        }
    }
}

#[tauri::command]
pub fn start_watching(app_handle: AppHandle, paths: Vec<String>) {
    start_watcher(app_handle, paths);
}
