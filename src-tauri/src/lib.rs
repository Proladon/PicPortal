mod runtime;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![runtime::runtime_platform])
        .run(tauri::generate_context!())
        .expect("無法啟動 PicPortal");
}
