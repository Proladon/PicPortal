use super::*;
use serde_json::json;
use tempfile::TempDir;

struct Fixture {
    temp: TempDir,
    root: PathBuf,
    file: PathBuf,
    state: ProjectState,
}
impl Fixture {
    fn new() -> Self {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("圖片 (測試) #100% [來源]");
        fs::create_dir_all(root.join("多層/第二層")).unwrap();
        for name in [
            "圖片 #100%.png",
            "重複.png",
            "多層/第二層/重複.png",
            "大寫.JPG",
            "小寫.jpg",
            ".隱藏.png",
            "test.webp",
            "test.gif",
            "test.jpeg",
            "非圖片.txt",
        ] {
            fs::write(root.join(name), b"fixture").unwrap();
        }
        let file = temp.path().join("normal.db");
        let mut data: Value =
            serde_json::from_str(include_str!("../../../tests/fixtures/migration/normal.db"))
                .unwrap();
        data["mainFolder"]["path"] = json!(root);
        data["dockings"][0]["target"] = json!(root.join("圖片 #100%.png"));
        fs::write(&file, serde_json::to_vec_pretty(&data).unwrap()).unwrap();
        let mut state = ProjectState::default();
        state.selected(file.clone(), false).unwrap();
        Self {
            temp,
            root,
            file,
            state,
        }
    }
    fn open(&mut self) -> Value {
        self.state.connect(self.file.to_str().unwrap()).unwrap()
    }
    fn scan(&self, types: &[&str]) -> Result<Vec<PathBuf>> {
        self.state.scan(
            self.root.to_str().unwrap(),
            &types.iter().map(|s| s.to_string()).collect::<Vec<_>>(),
        )
    }
}

#[test]
fn reading_and_scanning_preserve_bytes_ids_unknown_fields_and_legacy_paths() {
    let mut f = Fixture::new();
    let before = fs::read(&f.file).unwrap();
    let data = f.open();
    assert_eq!(data["id"], "project-001");
    assert_eq!(data["extraProject"]["keep"], true);
    assert_eq!(data["portals"][0]["childs"][0]["extraPortal"], true);
    assert_eq!(
        data["dockings"][0]["target"],
        json!(f.root.join("圖片 #100%.png"))
    );
    assert_eq!(f.state.get("portals").unwrap(), data["portals"]);
    assert_eq!(f.scan(&["png"]).unwrap().len(), 3);
    assert_eq!(f.scan(&["PNG", "JPG"]).unwrap().len(), 5);
    let images = f.scan(IMAGE_TYPES).unwrap();
    assert_eq!(images.len(), 8);
    assert!(images.windows(2).all(|pair| pair[0] <= pair[1]));
    assert_eq!(fs::read(&f.file).unwrap(), before);
    assert_eq!(f.scan(&["*"]).unwrap_err().code, "INVALID_EXTENSION");
}
#[test]
fn empty_and_legacy_projects_remain_unchanged() {
    for text in [
        include_str!("../../../tests/fixtures/migration/empty.db"),
        include_str!("../../../tests/fixtures/migration/legacy.db"),
    ] {
        let mut f = Fixture::new();
        fs::write(&f.file, text).unwrap();
        let data = f.open();
        assert_eq!(data, serde_json::from_str::<Value>(text).unwrap());
        assert!(f.state.source().unwrap().is_none());
        assert_eq!(f.scan(&["png"]).unwrap_err().code, "NO_SOURCE");
        assert_eq!(fs::read(&f.file).unwrap(), text.as_bytes());
    }
}
#[test]
fn only_native_selection_and_current_source_allow_access() {
    let mut f = Fixture::new();
    assert_eq!(
        ProjectState::default()
            .connect(f.file.to_str().unwrap())
            .unwrap_err()
            .code,
        "OUTSIDE_SCOPE"
    );
    f.open();
    let outside = f.temp.path().join("private.png");
    fs::write(&outside, b"private").unwrap();
    assert_eq!(
        f.state.exists(outside.to_str().unwrap()).unwrap_err().code,
        "OUTSIDE_SCOPE"
    );
    assert_eq!(
        f.state
            .scan(f.temp.path().to_str().unwrap(), &["png".into()])
            .unwrap_err()
            .code,
        "OUTSIDE_SCOPE"
    );
    assert_eq!(
        f.state
            .scan(f.root.join("../").to_str().unwrap(), &["png".into()])
            .unwrap_err()
            .code,
        "OUTSIDE_SCOPE"
    );
    assert_eq!(
        f.state
            .set_source(f.root.to_str().unwrap())
            .unwrap_err()
            .code,
        "OUTSIDE_SCOPE"
    );
    assert!(f.state.exists(f.file.to_str().unwrap()).unwrap());
    assert!(!f
        .state
        .exists(f.root.join("missing.png").to_str().unwrap())
        .unwrap());
    assert_eq!(
        ProjectState::default().get("id").unwrap_err().code,
        "NO_PROJECT"
    );
}
#[test]
fn source_selection_is_session_only_and_reopening_restores_original_source() {
    let mut f = Fixture::new();
    let data = f.open();
    let bytes = fs::read(&f.file).unwrap();
    let other = f.temp.path().join("目的資料夾");
    fs::create_dir(&other).unwrap();
    f.state.selected(other.clone(), true).unwrap();
    assert_eq!(
        f.state.set_source(other.to_str().unwrap()).unwrap().path,
        other.to_string_lossy()
    );
    assert_eq!(f.scan(&["png"]).unwrap_err().code, "OUTSIDE_SCOPE");
    assert_eq!(f.state.get("mainFolder").unwrap(), data["mainFolder"]);
    assert_eq!(f.state.get("dockings").unwrap(), data["dockings"]);
    f.open();
    assert_eq!(f.scan(&["png"]).unwrap().len(), 3);
    assert_eq!(fs::read(&f.file).unwrap(), bytes);
}
#[test]
fn damaged_invalid_and_missing_projects_do_not_replace_active_session() {
    let mut f = Fixture::new();
    f.open();
    fs::write(&f.file, "{bad").unwrap();
    assert_eq!(
        f.state.connect(f.file.to_str().unwrap()).unwrap_err().code,
        "INVALID_JSON"
    );
    fs::write(
        &f.file,
        r#"{"mainFolder":"","portals":[],"dockings":[{"target":12,"portals":[]}]}"#,
    )
    .unwrap();
    assert_eq!(
        f.state.connect(f.file.to_str().unwrap()).unwrap_err().code,
        "INVALID_PROJECT"
    );
    fs::remove_file(&f.file).unwrap();
    assert_eq!(
        f.state.connect(f.file.to_str().unwrap()).unwrap_err().code,
        "NOT_FOUND"
    );
    assert_eq!(f.state.get("id").unwrap(), "project-001");
}
#[test]
fn relative_source_and_deleted_source_are_handled() {
    let mut f = Fixture::new();
    let mut data = f.open();
    data["mainFolder"]["path"] = json!(f.root.file_name().unwrap().to_str().unwrap());
    fs::write(&f.file, serde_json::to_vec(&data).unwrap()).unwrap();
    f.open();
    assert_eq!(f.scan(&["png"]).unwrap().len(), 3);
    fs::rename(&f.root, f.temp.path().join("moved")).unwrap();
    assert_eq!(f.scan(&["png"]).unwrap_err().code, "NOT_FOUND");
}
#[test]
fn scan_and_exists_reject_outside_links_and_hidden_files() {
    let mut f = Fixture::new();
    let outside = f.temp.path().join("outside");
    fs::create_dir(&outside).unwrap();
    fs::write(outside.join("secret.png"), b"private").unwrap();
    let link = f.root.join("linked");
    #[cfg(windows)]
    {
        assert!(std::process::Command::new("cmd")
            .args(["/c", "mklink", "/J"])
            .arg(&link)
            .arg(&outside)
            .output()
            .unwrap()
            .status
            .success());
        let hidden = f.root.join("hidden.png");
        fs::write(&hidden, b"hidden").unwrap();
        assert!(std::process::Command::new("attrib")
            .arg("+H")
            .arg(&hidden)
            .status()
            .unwrap()
            .success());
    }
    #[cfg(unix)]
    std::os::unix::fs::symlink(&outside, &link).unwrap();
    f.open();
    assert_eq!(f.scan(&["png"]).unwrap().len(), 3);
    assert_eq!(
        f.state
            .exists(link.join("secret.png").to_str().unwrap())
            .unwrap_err()
            .code,
        "OUTSIDE_SCOPE"
    );
    #[cfg(windows)]
    fs::remove_dir(&link).unwrap(); // Unlink the junction itself, never recurse.
}
#[test]
fn serialized_project_switches_never_scan_previous_source() {
    let mut f = Fixture::new();
    f.open();
    let other = f.temp.path().join("other.db");
    fs::write(
        &other,
        include_str!("../../../tests/fixtures/migration/empty.db"),
    )
    .unwrap();
    f.state.selected(other.clone(), false).unwrap();
    let state = std::sync::Arc::new(std::sync::Mutex::new(f.state));
    let worker = state.clone();
    let path = other.to_string_lossy().into_owned();
    std::thread::spawn(move || worker.lock().unwrap().connect(&path).unwrap())
        .join()
        .unwrap();
    assert_eq!(
        state
            .lock()
            .unwrap()
            .scan(f.root.to_str().unwrap(), &["png".into()])
            .unwrap_err()
            .code,
        "NO_SOURCE"
    );
}

#[test]
fn access_denied_is_reported_without_changing_the_project() {
    let error = io_error(std::io::Error::from(std::io::ErrorKind::PermissionDenied));
    assert_eq!(error.code, "ACCESS_DENIED");
    assert!(error.message.contains("沒有讀取"));
    #[cfg(windows)]
    {
        use std::os::windows::fs::OpenOptionsExt;
        let mut f = Fixture::new();
        f.open();
        let before = fs::read(&f.file).unwrap();
        // Windows exclusive file handles deny the read without changing ACLs
        // or user/system permissions. Only this anonymous fixture is locked.
        let locked = fs::OpenOptions::new()
            .read(true)
            .share_mode(0)
            .open(&f.file)
            .unwrap();
        let denied = f.state.connect(f.file.to_str().unwrap()).unwrap_err();
        assert!(matches!(denied.code, "ACCESS_DENIED" | "IO_ERROR"));
        assert_eq!(f.state.get("id").unwrap(), "project-001");
        drop(locked);
        assert_eq!(fs::read(&f.file).unwrap(), before);
    }
}
