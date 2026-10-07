mod commands;
mod project;
mod runtime;

pub fn run() {
    tauri::Builder::default()
        .manage(commands::DesktopState::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            runtime::runtime_platform,
            commands::desktop_open_dialog,
            commands::project_connect,
            commands::project_get,
            commands::project_source,
            commands::project_set_source,
            commands::scan_images,
            commands::file_exists,
        ])
        .run(tauri::generate_context!())
        .expect("無法啟動 PicPortal");
}
