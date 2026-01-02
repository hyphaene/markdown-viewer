use std::sync::Mutex;
use crate::commands::files::{FileEntry, Settings};

pub struct AppState {
    pub files: Mutex<Vec<FileEntry>>,
    pub settings: Mutex<Settings>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            files: Mutex::new(vec![]),
            settings: Mutex::new(Settings {
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
            }),
        }
    }
}
