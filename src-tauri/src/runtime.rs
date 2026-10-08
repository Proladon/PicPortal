/// A read-only command; file and project commands are added in later stages.
#[tauri::command]
pub fn runtime_platform() -> &'static str {
    match std::env::consts::OS {
        "windows" => "win32",
        "macos" => "darwin",
        other => other,
    }
}
