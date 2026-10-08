use crate::preferences::{ImportStatus, Preferences};
use crate::project::{self, Folder, ProjectState, Result};
use serde::Deserialize;
use serde_json::Value;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

#[derive(Default)]
pub struct DesktopState(pub Mutex<ProjectState>, pub AtomicBool, pub AtomicBool);
#[derive(Default)]
pub struct PreferencesState(Mutex<Option<Preferences>>);

// All disk I/O and blocking native dialogs run off the UI thread. A single
// session lock serializes reads/scans/switches, including asset authorization.
pub(crate) async fn blocking<T: Send + 'static>(
    operation: impl FnOnce() -> Result<T> + Send + 'static,
) -> Result<T> {
    tauri::async_runtime::spawn_blocking(operation)
        .await
        .map_err(|e| project::error("INTERNAL", e.to_string()))?
}
pub(crate) fn with_state<T>(
    app: &AppHandle,
    operation: impl FnOnce(&mut ProjectState) -> Result<T>,
) -> Result<T> {
    let state = app.state::<DesktopState>();
    let mut state = state
        .0
        .lock()
        .map_err(|_| project::error("INTERNAL", "專案狀態無法讀取"))?;
    if app.state::<DesktopState>().1.load(Ordering::SeqCst) {
        return Err(project::error("CLOSING", "應用程式正在關閉"));
    }
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
    blocking(move || {
        with_state(&app, |state| {
            if !state.has_selection(&path) {
                if let Some(prefs) = app
                    .state::<PreferencesState>()
                    .0
                    .lock()
                    .map_err(|_| project::error("INTERNAL", "無法讀取設定"))?
                    .as_ref()
                {
                    if prefs
                        .data
                        .get("projects")
                        .and_then(Value::as_array)
                        .is_some_and(|list| {
                            list.iter().any(|p| {
                                crate::preferences::key(p["path"].as_str().unwrap())
                                    == crate::preferences::key(&path)
                            })
                        })
                    {
                        state.selected(PathBuf::from(&path), false)?;
                    }
                }
            }
            let data = state.connect(&path)?;
            Ok(serde_json::json!({ "data": data, "session": state.token()? }))
        })
    })
    .await
}

fn with_preferences<T>(
    app: &AppHandle,
    action: impl FnOnce(&mut ProjectState, &mut Preferences) -> Result<T>,
) -> Result<T> {
    with_state(app, |state| {
        let managed = app.state::<PreferencesState>();
        let mut prefs = managed
            .0
            .lock()
            .map_err(|_| project::error("INTERNAL", "無法讀取設定"))?;
        if prefs.is_none() {
            let path = app
                .path()
                .app_data_dir()
                .map_err(|e| project::error("SETTINGS_IO", e.to_string()))?
                .join("settings.json");
            *prefs = Some(Preferences::load(app, path)?);
        }
        action(state, prefs.as_mut().unwrap())
    })
}
#[tauri::command]
pub async fn preferences_init(app: AppHandle) -> Result<ImportStatus> {
    blocking(move || {
        with_preferences(&app, |state, prefs| {
            let mut result = ImportStatus {
                completed: prefs.completed(),
                ..Default::default()
            };
            #[cfg(windows)]
            if !prefs.completed() {
                if let Some(folder) = std::env::var_os("APPDATA") {
                    let legacy = PathBuf::from(folder).join("PicPortal/config.json");
                    if legacy
                        .try_exists()
                        .map_err(|e| project::error("SETTINGS_IO", e.to_string()))?
                    {
                        match prefs.import(&legacy) {
                            Ok(status) => result = status,
                            Err(e) => result.message = Some(format!("{}: {}", e.code, e.message)),
                        }
                    }
                }
            }
            authorize_saved(state, prefs);
            Ok(result)
        })
    })
    .await
}
fn authorize_saved(state: &mut ProjectState, prefs: &Preferences) {
    for project in prefs
        .data
        .get("projects")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
    {
        let path = project["path"].as_str().unwrap();
        if !state.has_selection(path) {
            let _ = state.selected(PathBuf::from(path), false);
        }
    }
}
#[tauri::command]
pub async fn preferences_get(app: AppHandle, key: String) -> Result<Value> {
    blocking(move || with_preferences(&app, |_, prefs| prefs.get(&key))).await
}
#[tauri::command]
pub async fn preferences_set(app: AppHandle, key: String, value: Value) -> Result<()> {
    blocking(move || {
        with_preferences(&app, |state, prefs| {
            if key == "projects" {
                crate::preferences::validate(&serde_json::json!({"projects":value}))?;
                for project in value.as_array().unwrap() {
                    let path = project["path"].as_str().unwrap();
                    let existing = prefs
                        .data
                        .get("projects")
                        .and_then(Value::as_array)
                        .is_some_and(|list| {
                            list.iter().any(|p| {
                                crate::preferences::key(p["path"].as_str().unwrap())
                                    == crate::preferences::key(path)
                            })
                        });
                    if !existing {
                        state.selected_path(path, false)?;
                    }
                }
            }
            prefs.set(&key, value)
        })
    })
    .await
}
#[tauri::command]
pub async fn preferences_remove(app: AppHandle, key: Option<String>) -> Result<()> {
    blocking(move || with_preferences(&app, |_, prefs| prefs.remove(key.as_deref()))).await
}
#[tauri::command]
pub async fn preferences_import(
    app: AppHandle,
    window: WebviewWindow,
) -> Result<Option<ImportStatus>> {
    blocking(move || {
        let selected = app
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("匯入 Electron 設定（保留目前設定）")
            .add_filter("JSON", &["json"])
            .blocking_pick_file();
        selected
            .map(|path| {
                let path = path
                    .into_path()
                    .map_err(|e| project::error("INVALID_PATH", e.to_string()))?;
                with_preferences(&app, |state, prefs| {
                    let result = prefs.import(&path)?;
                    authorize_saved(state, prefs);
                    Ok(result)
                })
            })
            .transpose()
    })
    .await
}
#[tauri::command]
pub async fn desktop_open_folder(app: AppHandle, session: String, path: String) -> Result<String> {
    blocking(move || {
        with_state(&app, |state| {
            state.require_token(&session)?;
            let path = state.open_folder(&path)?;
            app.opener()
                .open_path(path.to_string_lossy(), None::<&str>)
                .map_err(|e| project::error("OPEN_FOLDER", e.to_string()))?;
            Ok("ok".into())
        })
    })
    .await
}
#[tauri::command]
pub fn desktop_close_ready(app: AppHandle) {
    app.state::<DesktopState>().2.store(true, Ordering::SeqCst);
}
#[tauri::command]
pub async fn desktop_finish_close(app: AppHandle, window: WebviewWindow) -> Result<()> {
    blocking(move || {
        with_state(&app, |_| {
            let managed = app.state::<PreferencesState>();
            let _prefs = managed
                .0
                .lock()
                .map_err(|_| project::error("INTERNAL", "無法完成設定儲存"))?;
            app.state::<DesktopState>().1.store(true, Ordering::SeqCst);
            Ok(())
        })?;
        let result = window
            .destroy()
            .map_err(|e| project::error("CLOSE", e.to_string()));
        if result.is_err() {
            app.state::<DesktopState>().1.store(false, Ordering::SeqCst);
        }
        result
    })
    .await
}
#[tauri::command]
pub async fn project_get(app: AppHandle, key: String, session: Option<String>) -> Result<Value> {
    blocking(move || {
        with_state(&app, |state| {
            if let Some(session) = session {
                state.require_token(&session)?;
            }
            state.get(&key)
        })
    })
    .await
}
#[tauri::command]
pub async fn project_source(app: AppHandle, session: Option<String>) -> Result<Option<Folder>> {
    blocking(move || {
        with_state(&app, |state| {
            if let Some(session) = session {
                state.require_token(&session)?;
            }
            state.source()
        })
    })
    .await
}
#[tauri::command]
pub async fn project_set_source(app: AppHandle, session: String, path: String) -> Result<Folder> {
    blocking(move || {
        with_state(&app, |state| {
            state.require_token(&session)?;
            state.set_source(&path)
        })
    })
    .await
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
pub async fn file_exists(app: AppHandle, path: String, session: Option<String>) -> Result<bool> {
    blocking(move || {
        with_state(&app, |state| {
            if let Some(session) = session {
                state.require_token(&session)?;
            }
            state.exists(&path)
        })
    })
    .await
}

#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveOptions {
    title: Option<String>,
    default_path: Option<String>,
    filters: Option<Vec<Filter>>,
}
#[tauri::command]
pub async fn desktop_save_dialog(
    app: AppHandle,
    window: WebviewWindow,
    options: SaveOptions,
) -> Result<Option<String>> {
    blocking(move || {
        let mut dialog = app.dialog().file().set_parent(&window);
        if let Some(title) = options.title {
            dialog = dialog.set_title(title);
        }
        if let Some(path) = options.default_path {
            let path = std::path::Path::new(&path);
            if let Some(parent) = path.parent().filter(|p| !p.as_os_str().is_empty()) {
                dialog = dialog.set_directory(parent);
            }
            if let Some(name) = path.file_name() {
                dialog = dialog.set_file_name(name.to_string_lossy());
            }
        }
        for filter in options.filters.unwrap_or_default() {
            let extensions: Vec<_> = filter.extensions.iter().map(String::as_str).collect();
            dialog = dialog.add_filter(filter.name, &extensions);
        }
        dialog
            .blocking_save_file()
            .map(|path| {
                let path = path
                    .into_path()
                    .map_err(|e| project::error("INVALID_PATH", e.to_string()))?;
                with_state(&app, |state| state.save_target(path))
            })
            .transpose()
    })
    .await
}
#[tauri::command]
pub async fn project_save(
    app: AppHandle,
    session: String,
    keys: Vec<String>,
    data: String,
) -> Result<String> {
    blocking(move || {
        with_state(&app, |state| {
            if keys.len() == 1 {
                state.save(&session, &keys[0], &data)
            } else {
                state.deep_save(&session, &keys, &data)
            }
        })
    })
    .await
}
#[tauri::command]
pub async fn project_slice(
    app: AppHandle,
    session: String,
    key: String,
    index: usize,
) -> Result<String> {
    blocking(move || with_state(&app, |state| state.slice(&session, &key, index))).await
}
#[tauri::command]
pub async fn project_pull_dockings(
    app: AppHandle,
    session: String,
    data: String,
) -> Result<String> {
    blocking(move || with_state(&app, |state| state.pull_dockings(&session, &data))).await
}
#[tauri::command]
pub async fn file_create(app: AppHandle, path: String) -> Result<()> {
    blocking(move || with_state(&app, |state| state.create(&path))).await
}
#[tauri::command]
pub async fn project_create(app: AppHandle, path: String, data: Value) -> Result<()> {
    blocking(move || with_state(&app, |state| state.write_json(&path, data))).await
}
#[tauri::command]
pub async fn file_transfer(
    app: AppHandle,
    session: String,
    source: String,
    destination: String,
    move_source: bool,
    overwrite: bool,
) -> Result<()> {
    blocking(move || {
        with_state(&app, |state| {
            let result = state.transfer(&session, &source, &destination, move_source, overwrite);
            if result.is_ok() || result.as_ref().is_err_and(|e| e.code == "FILE_EXIST") {
                app.asset_protocol_scope()
                    .allow_file(&destination)
                    .map_err(|e| project::error("ASSET_SCOPE", e.to_string()))?;
            }
            result
        })
    })
    .await
}
#[tauri::command]
pub async fn file_delete(app: AppHandle, session: String, path: String) -> Result<String> {
    blocking(move || with_state(&app, |state| state.delete(&session, &path))).await
}
