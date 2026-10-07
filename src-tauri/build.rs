fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "runtime_platform",
            "desktop_open_dialog",
            "project_connect",
            "project_get",
            "project_source",
            "project_set_source",
            "scan_images",
            "file_exists",
        ]),
    ))
    .expect("無法建立桌面命令權限");
}
