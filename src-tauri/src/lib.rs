mod commands;
mod preferences;
mod project;
mod runtime;
use std::sync::atomic::Ordering;
use tauri::{Emitter, Manager};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .manage(commands::DesktopState::default())
        .manage(commands::PreferencesState::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .on_window_event(|window, event| {
            if window.label() != "main" {
                return;
            }
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    if window
                        .state::<commands::DesktopState>()
                        .2
                        .load(Ordering::SeqCst)
                    {
                        api.prevent_close();
                        let _ = window.emit("desktop-close-requested", ());
                    }
                }
                tauri::WindowEvent::DragDrop(tauri::DragDropEvent::Drop { paths, position }) => {
                    let app = window.app_handle().clone();
                    let paths = paths.clone();
                    let x = position.x;
                    let y = position.y;
                    let time = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_millis();
                    tauri::async_runtime::spawn(async move {
                        let app_for_task = app.clone();
                        let result = commands::blocking(move || {
                            commands::with_state(&app_for_task, |state| {
                                paths
                                    .into_iter()
                                    .map(|path| {
                                        let directory = path.is_dir();
                                        let path = state.selected(path, directory)?;
                                        Ok(serde_json::json!({"path":path,"directory":directory}))
                                    })
                                    .collect::<project::Result<Vec<_>>>()
                            })
                        })
                        .await;
                        if let Some(window) = app.get_webview_window("main") {
                            match result {
                                Ok(paths) => {
                                    let _ = window.emit(
                                        "desktop-file-drop",
                                        serde_json::json!({"paths":paths,"x":x,"y":y,"time":time}),
                                    );
                                }
                                Err(e) => {
                                    let _ = window.emit("desktop-drop-error", e);
                                }
                            }
                        }
                    });
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            runtime::runtime_platform,
            commands::desktop_open_dialog,
            commands::project_connect,
            commands::project_get,
            commands::project_source,
            commands::project_set_source,
            commands::scan_images,
            commands::file_exists,
            commands::desktop_save_dialog,
            commands::project_save,
            commands::project_slice,
            commands::project_pull_dockings,
            commands::file_create,
            commands::project_create,
            commands::file_transfer,
            commands::file_delete,
            commands::preferences_init,
            commands::preferences_get,
            commands::preferences_set,
            commands::preferences_remove,
            commands::preferences_import,
            commands::desktop_open_folder,
            commands::desktop_close_ready,
            commands::desktop_finish_close,
        ])
        .run(tauri::generate_context!())
        .expect("無法啟動 PicPortal");
}
