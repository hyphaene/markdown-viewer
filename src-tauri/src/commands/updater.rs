use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::AppHandle;
use tokio::fs;
use tokio::io::AsyncWriteExt;

const GITHUB_REPO: &str = "hyphaene/markdown-viewer";

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub download_url: String,
    pub release_notes: String,
    pub published_at: String,
}

#[derive(Debug, Deserialize)]
struct GitHubRelease {
    tag_name: String,
    body: Option<String>,
    published_at: String,
    assets: Vec<GitHubAsset>,
}

#[derive(Debug, Deserialize)]
struct GitHubAsset {
    name: String,
    browser_download_url: String,
}

fn get_current_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

fn get_arch_suffix() -> &'static str {
    if cfg!(target_arch = "aarch64") {
        "aarch64"
    } else {
        "x64"
    }
}

#[tauri::command]
pub async fn check_for_updates() -> Result<Option<UpdateInfo>, String> {
    let client = reqwest::Client::builder()
        .user_agent("markdown-viewer")
        .build()
        .map_err(|e| e.to_string())?;

    let url = format!(
        "https://api.github.com/repos/{}/releases/latest",
        GITHUB_REPO
    );

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch releases: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("GitHub API error: {}", response.status()));
    }

    let release: GitHubRelease = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse release: {}", e))?;

    let latest_version = release.tag_name.trim_start_matches('v');
    let current_version = get_current_version();

    let latest =
        semver::Version::parse(latest_version).map_err(|e| format!("Invalid version: {}", e))?;
    let current =
        semver::Version::parse(&current_version).map_err(|e| format!("Invalid version: {}", e))?;

    if latest <= current {
        return Ok(None);
    }

    let arch_suffix = get_arch_suffix();
    let dmg_asset = release
        .assets
        .iter()
        .find(|a| a.name.ends_with(".dmg") && a.name.contains(arch_suffix))
        .or_else(|| release.assets.iter().find(|a| a.name.ends_with(".dmg")));

    let download_url = dmg_asset
        .map(|a| a.browser_download_url.clone())
        .ok_or_else(|| "No DMG found for this architecture".to_string())?;

    Ok(Some(UpdateInfo {
        version: latest_version.to_string(),
        download_url,
        release_notes: release.body.unwrap_or_default(),
        published_at: release.published_at,
    }))
}

#[tauri::command]
pub async fn download_update(download_url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("markdown-viewer")
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| format!("Failed to download: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Download failed: {}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read download: {}", e))?;

    let download_dir = dirs::download_dir().ok_or("Cannot find Downloads folder")?;
    let dmg_path = download_dir.join("markdown-viewer-update.dmg");

    let mut file = fs::File::create(&dmg_path)
        .await
        .map_err(|e| format!("Failed to create file: {}", e))?;

    file.write_all(&bytes)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(dmg_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn install_update(dmg_path: String, app_handle: AppHandle) -> Result<(), String> {
    let volume_name = "markdown-viewer";
    let app_bundle_name = "markdown-viewer.app";
    let install_path = "/Applications/markdown-viewer.app";

    let script = format!(
        r#"#!/bin/bash
set -e

DMG_PATH="{dmg_path}"
VOLUME_NAME="{volume_name}"
APP_BUNDLE="{app_bundle_name}"
INSTALL_PATH="{install_path}"

sleep 1

# Detach ALL existing markdown-viewer volumes (including "markdown-viewer 2", etc.)
for vol in /Volumes/markdown-viewer*; do
    [ -d "$vol" ] && hdiutil detach "$vol" -quiet 2>/dev/null || true
done

# Mount the DMG and capture the mount point
MOUNT_OUTPUT=$(hdiutil attach "$DMG_PATH" -nobrowse 2>&1)
MOUNT_POINT=$(echo "$MOUNT_OUTPUT" | grep -o '/Volumes/[^"]*' | head -1)

if [ -z "$MOUNT_POINT" ] || [ ! -d "$MOUNT_POINT" ]; then
    echo "Failed to mount DMG"
    exit 1
fi

# Copy with admin privileges and clear quarantine
osascript -e 'do shell script "rm -rf \"'"$INSTALL_PATH"'\" && cp -R \"'"$MOUNT_POINT"'/'"$APP_BUNDLE"'\" \"/Applications/\" && xattr -cr \"'"$INSTALL_PATH"'\"" with administrator privileges'

# Cleanup
hdiutil detach "$MOUNT_POINT" -quiet || true
rm -f "$DMG_PATH"

# Relaunch
open "$INSTALL_PATH"

# Self-delete
rm -f "$0"
"#,
        dmg_path = dmg_path,
        volume_name = volume_name,
        app_bundle_name = app_bundle_name,
        install_path = install_path,
    );

    let script_path = std::env::temp_dir().join("markdown-viewer-update.sh");

    std::fs::write(&script_path, &script)
        .map_err(|e| format!("Failed to write update script: {}", e))?;

    Command::new("chmod")
        .args(["+x", script_path.to_str().unwrap()])
        .output()
        .map_err(|e| format!("Failed to chmod script: {}", e))?;

    Command::new("bash")
        .arg(&script_path)
        .spawn()
        .map_err(|e| format!("Failed to start update script: {}", e))?;

    app_handle.exit(0);

    Ok(())
}

#[tauri::command]
pub fn get_current_app_version() -> String {
    get_current_version()
}
