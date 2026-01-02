mod commands;
mod state;
mod watcher;

use commands::{
    check_for_updates, download_update, get_current_app_version, get_settings, install_update,
    open_in_vscode, read_file, reveal_in_finder, save_settings, scan_directories,
};
use state::AppState;
use tauri::menu::{AboutMetadataBuilder, MenuBuilder, SubmenuBuilder};
use watcher::start_watching;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(AppState::default())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let about_metadata = AboutMetadataBuilder::new()
                .name(Some("Markdown Viewer"))
                .version(Some(env!("CARGO_PKG_VERSION")))
                .authors(Some(vec!["hyphaene".to_string()]))
                .website(Some("https://github.com/hyphaene/markdown-viewer"))
                .website_label(Some("GitHub"))
                .build();

            let app_submenu = SubmenuBuilder::new(app, "Markdown Viewer")
                .about(Some(about_metadata))
                .separator()
                .services()
                .separator()
                .hide()
                .hide_others()
                .show_all()
                .separator()
                .quit()
                .build()?;

            let edit_submenu = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;

            let view_submenu = SubmenuBuilder::new(app, "View")
                .fullscreen()
                .build()?;

            let window_submenu = SubmenuBuilder::new(app, "Window")
                .minimize()
                .separator()
                .close_window()
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&app_submenu)
                .item(&edit_submenu)
                .item(&view_submenu)
                .item(&window_submenu)
                .build()?;

            app.set_menu(menu)?;

            Ok(())
        })
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
