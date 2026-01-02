mod commands;
mod state;
mod watcher;

use commands::{
    check_for_updates, download_update, get_current_app_version, get_settings, install_update,
    open_in_vscode, read_file, reveal_in_finder, save_settings, scan_directories,
};
use state::AppState;
use watcher::start_watching;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(AppState::default())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            scan_directories,
            read_file,
            get_settings,
            save_settings,
            open_in_vscode,
            reveal_in_finder,
            start_watching,
            check_for_updates,
            download_update,
            install_update,
            get_current_app_version,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
