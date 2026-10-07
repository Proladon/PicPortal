use crate::project::{self, Folder, ProjectState, Result};
use serde::Deserialize;
use serde_json::Value;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

#[derive(Default)]
pub struct DesktopState(pub Mutex<ProjectState>);

// All disk I/O and blocking native dialogs run off the UI thread. A single
// session lock serializes reads/scans/switches, including asset authorization.
async fn blocking<T: Send + 'static>(
    operation: impl FnOnce() -> Result<T> + Send + 'static,
) -> Result<T> {
    tauri::async_runtime::spawn_blocking(operation)
        .await
        .map_err(|e| project::error("INTERNAL", e.to_string()))?
}
fn with_state<T>(
    app: &AppHandle,
    operation: impl FnOnce(&mut ProjectState) -> Result<T>,
) -> Result<T> {
    let state = app.state::<DesktopState>();
    let mut state = state
        .0
        .lock()
        .map_err(|_| project::error("INTERNAL", "專案狀態無法讀取"))?;
    operation(&mut state)
}

#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenOptions {
    title: Option<String>,
    default_path: Option<String>,
    filters: Option<Vec<Filter>>,
    #[serde(default)]
    directory: bool,
    #[serde(default)]
    multiple: bool,
}
#[derive(Deserialize)]
struct Filter {
    name: String,
    extensions: Vec<String>,
}

#[tauri::command]
pub async fn desktop_open_dialog(
    app: AppHandle,
    window: WebviewWindow,
    options: OpenOptions,
) -> Result<Option<Vec<String>>> {
    blocking(move || {
        let mut dialog = app.dialog().file().set_parent(&window);
        if let Some(title) = options.title {
            dialog = dialog.set_title(title);
        }
        if let Some(path) = options.default_path {
            dialog = dialog.set_directory(path);
        }
        for filter in options.filters.unwrap_or_default() {
            let extensions: Vec<_> = filter.extensions.iter().map(String::as_str).collect();
            dialog = dialog.add_filter(filter.name, &extensions);
        }
        // Rust picker results do not automatically grant the plugin's broad
        // directory scopes. Only our validated image list receives asset access.
        let selected = match (options.directory, options.multiple) {
            (true, true) => dialog.blocking_pick_folders(),
            (true, false) => dialog.blocking_pick_folder().map(|p| vec![p]),
            (false, true) => dialog.blocking_pick_files(),
            (false, false) => dialog.blocking_pick_file().map(|p| vec![p]),
        };
        selected
            .map(|paths| {
                with_state(&app, |state| {
                    paths
                        .into_iter()
                        .map(|path| {
                            let path = path
                                .into_path()
                                .map_err(|e| project::error("INVALID_PATH", e.to_string()))?;
                            state.selected(path, options.directory)
                        })
                        .collect()
                })
            })
            .transpose()
    })
    .await
}
#[tauri::command]
pub async fn project_connect(app: AppHandle, path: String) -> Result<Value> {
    blocking(move || with_state(&app, |state| state.connect(&path))).await
}
#[tauri::command]
pub async fn project_get(app: AppHandle, key: String) -> Result<Value> {
    blocking(move || with_state(&app, |state| state.get(&key))).await
}
#[tauri::command]
pub async fn project_source(app: AppHandle) -> Result<Option<Folder>> {
    blocking(move || with_state(&app, |state| state.source())).await
}
#[tauri::command]
pub async fn project_set_source(app: AppHandle, path: String) -> Result<Folder> {
    blocking(move || with_state(&app, |state| state.set_source(&path))).await
}
#[tauri::command]
pub async fn scan_images(
    app: AppHandle,
    directory: String,
    extensions: Vec<String>,
) -> Result<Vec<String>> {
    blocking(move || {
        with_state(&app, |state| {
            let files = state.scan(&directory, &extensions)?;
            let scope = app.asset_protocol_scope();
            for path in &files {
                scope
                    .allow_file(path)
                    .map_err(|e| project::error("ASSET_SCOPE", format!("無法授權圖片：{e}")))?;
            }
            Ok(files
                .iter()
                .map(|p| p.to_string_lossy().into_owned())
                .collect())
        })
    })
    .await
}
#[tauri::command]
pub async fn file_exists(app: AppHandle, path: String) -> Result<bool> {
    blocking(move || with_state(&app, |state| state.exists(&path))).await
}
