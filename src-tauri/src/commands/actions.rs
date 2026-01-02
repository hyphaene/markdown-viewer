#[tauri::command]
pub async fn open_in_vscode(path: String) -> Result<(), String> {
    // Stub: would run `code <path>`
    let _ = path;
    Ok(())
}

#[tauri::command]
pub async fn reveal_in_finder(path: String) -> Result<(), String> {
    // Stub: would open Finder at path
    let _ = path;
    Ok(())
}
