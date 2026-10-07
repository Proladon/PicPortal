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
        data["portals"][0]["childs"][0]["link"] = json!(temp.path().join("目的/收藏"));
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
fn source_selection_is_persisted_and_clears_dockings_atomically() {
    let mut f = Fixture::new();
    f.open();
    let other = f.temp.path().join("目的資料夾");
    fs::create_dir(&other).unwrap();
    f.state.selected(other.clone(), true).unwrap();
    assert_eq!(
        f.state.set_source(other.to_str().unwrap()).unwrap().path,
        other.to_string_lossy()
    );
    assert_eq!(f.scan(&["png"]).unwrap_err().code, "OUTSIDE_SCOPE");
    assert_eq!(f.state.get("mainFolder").unwrap()["path"], json!(other));
    assert_eq!(f.state.get("dockings").unwrap(), json!([]));
    f.open();
    assert_eq!(
        f.state.source().unwrap().unwrap().path,
        other.to_string_lossy()
    );
    assert_eq!(f.state.get("id").unwrap(), "project-001");
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

fn destination(f: &Fixture, filename: &str) -> PathBuf {
    f.temp.path().join("目的/收藏").join(filename)
}

#[test]
fn writes_preserve_ids_unknown_fields_and_survive_a_fresh_session() {
    let mut f = Fixture::new();
    let mut original = f.open();
    original["dockings"][0]["extension"] = json!({"keep": 42});
    fs::write(&f.file, serialize_test(&original)).unwrap();
    f.open();
    let token = f.state.token().unwrap();
    let mut portals = f.state.get("portals").unwrap();
    portals[0]["childs"][0]
        .as_object_mut()
        .unwrap()
        .remove("extraPortal");
    portals[0]["childs"][0]["name"] = json!("新名稱");
    f.state
        .save(&token, "portals", &portals.to_string())
        .unwrap();
    f.state
        .deep_save(
            &token,
            &["dockings".into(), "0".into(), "portals".into()],
            "[]",
        )
        .unwrap();
    let disk: Value = serde_json::from_slice(&fs::read(&f.file).unwrap()).unwrap();
    assert_eq!(disk["id"], original["id"]);
    assert_eq!(disk["extraProject"], original["extraProject"]);
    assert_eq!(disk["portals"][0]["childs"][0]["extraPortal"], true);
    assert_eq!(disk["dockings"][0]["extension"]["keep"], 42);
    let mut restarted = ProjectState::default();
    restarted.selected(f.file.clone(), false).unwrap();
    assert_eq!(restarted.connect(f.file.to_str().unwrap()).unwrap(), disk);
    let token = restarted.token().unwrap();
    restarted.slice(&token, "dockings", 0).unwrap();
    assert_eq!(restarted.get("dockings").unwrap(), json!([]));
    assert_eq!(
        restarted.slice(&token, "dockings", 0).unwrap_err().code,
        "INVALID_INDEX"
    );
}
fn serialize_test(data: &Value) -> Vec<u8> {
    serde_json::to_vec_pretty(data).unwrap()
}

#[test]
fn invalid_or_external_writes_preserve_disk_and_memory() {
    let mut f = Fixture::new();
    let before = f.open();
    let bytes = fs::read(&f.file).unwrap();
    let token = f.state.token().unwrap();
    for (key, data, expected) in [
        ("id", "\"different\"", "INVALID_PROJECT"),
        ("dockings", "{", "INVALID_JSON"),
        ("portals", "null", "INVALID_PROJECT"),
    ] {
        assert_eq!(f.state.save(&token, key, data).unwrap_err().code, expected);
        assert_eq!(fs::read(&f.file).unwrap(), bytes);
    }
    assert_eq!(
        f.state
            .deep_save(&token, &["__proto__".into()], "{}")
            .unwrap_err()
            .code,
        "INVALID_KEY"
    );
    fs::write(&f.file, b"external content").unwrap();
    assert_eq!(
        f.state.save(&token, "dockings", "[]").unwrap_err().code,
        "PROJECT_CHANGED"
    );
    assert_eq!(fs::read(&f.file).unwrap(), b"external content");
    assert_eq!(f.state.get("dockings").unwrap(), before["dockings"]);
    assert_eq!(
        fs::read_dir(f.temp.path()).unwrap().count(),
        2,
        "failed writes must remove temporary files"
    );
}

#[test]
fn legacy_writes_keep_project_key_and_unknown_nested_fields() {
    let mut f = Fixture::new();
    let mut data: Value =
        serde_json::from_str(include_str!("../../../tests/fixtures/migration/legacy.db")).unwrap();
    data["future"] = json!({"name":"unknown nested name","id":"unknown nested id"});
    fs::write(&f.file, serialize_test(&data)).unwrap();
    f.open();
    let token = f.state.token().unwrap();
    f.state.save(&token, "dockings", "[]").unwrap();
    let saved: Value = serde_json::from_slice(&fs::read(&f.file).unwrap()).unwrap();
    assert_eq!(saved["project"], data["project"]);
    assert_eq!(saved.get("id"), data.get("id"));
    assert_eq!(saved["future"], data["future"]);
    assert_eq!(saved["mainFolder"], "");
}

#[test]
fn new_projects_require_save_selection_and_never_overwrite() {
    let mut f = Fixture::new();
    let new = f.temp.path().join("新專案 #100%.db");
    let data = json!({"id":"new-id","mainFolder":"","portals":[],"dockings":[],"extra":true});
    assert_eq!(
        f.state
            .write_json(new.to_str().unwrap(), data.clone())
            .unwrap_err()
            .code,
        "OUTSIDE_SCOPE"
    );
    f.state.save_target(new.clone()).unwrap();
    f.state.create(new.to_str().unwrap()).unwrap();
    assert!(
        !new.exists(),
        "create validates without writing an empty placeholder"
    );
    f.state
        .write_json(new.to_str().unwrap(), data.clone())
        .unwrap();
    assert_eq!(f.state.connect(new.to_str().unwrap()).unwrap(), data);
    let bytes = fs::read(&new).unwrap();
    f.state.save_target(new.clone()).unwrap();
    assert_eq!(
        f.state.create(new.to_str().unwrap()).unwrap_err().code,
        "FILE_EXIST"
    );
    assert_eq!(
        f.state
            .write_json(new.to_str().unwrap(), data)
            .unwrap_err()
            .code,
        "FILE_EXIST"
    );
    assert_eq!(fs::read(&new).unwrap(), bytes);
}

#[test]
fn copy_move_overwrite_same_file_and_pull_have_safe_results() {
    let mut f = Fixture::new();
    f.open();
    let token = f.state.token().unwrap();
    let src = f.root.join("圖片 #100%.png");
    let dest = destination(&f, "巢狀/圖片 #100%.png");
    f.state
        .transfer(
            &token,
            src.to_str().unwrap(),
            dest.to_str().unwrap(),
            false,
            false,
        )
        .unwrap();
    assert!(src.exists());
    assert_eq!(fs::read(&dest).unwrap(), b"fixture");
    fs::write(&dest, b"old destination").unwrap();
    assert_eq!(
        f.state
            .transfer(
                &token,
                src.to_str().unwrap(),
                dest.to_str().unwrap(),
                true,
                false
            )
            .unwrap_err()
            .code,
        "FILE_EXIST"
    );
    assert_eq!(fs::read(&dest).unwrap(), b"old destination");
    assert!(src.exists());
    f.state
        .transfer(
            &token,
            src.to_str().unwrap(),
            dest.to_str().unwrap(),
            false,
            true,
        )
        .unwrap();
    assert!(src.exists(), "copy overwrite must retain source");
    f.state
        .transfer(
            &token,
            src.to_str().unwrap(),
            dest.to_str().unwrap(),
            true,
            true,
        )
        .unwrap();
    assert!(!src.exists());
    assert_eq!(fs::read(&dest).unwrap(), b"fixture");
    f.state
        .pull_dockings(&token, &json!([{ "target": src }]).to_string())
        .unwrap();
    assert_eq!(f.state.get("dockings").unwrap(), json!([]));
    assert!(f.state.exists(dest.to_str().unwrap()).unwrap());
    assert!(!f
        .state
        .exists(destination(&f, "missing.png").to_str().unwrap())
        .unwrap());
    let second = f.root.join("重複.png");
    let hardlink = destination(&f, "hardlink.png");
    fs::hard_link(&second, &hardlink).unwrap();
    assert_eq!(
        f.state
            .transfer(
                &token,
                second.to_str().unwrap(),
                hardlink.to_str().unwrap(),
                true,
                true
            )
            .unwrap_err()
            .code,
        "SAME_FILE"
    );
    assert!(second.exists());
}

#[test]
fn outside_deleted_and_unselected_paths_cannot_write_or_delete() {
    let mut f = Fixture::new();
    f.open();
    let token = f.state.token().unwrap();
    let src = f.root.join("重複.png");
    let outside = f.temp.path().join("private.png");
    fs::write(&outside, b"private").unwrap();
    assert_eq!(
        f.state
            .transfer(
                &token,
                src.to_str().unwrap(),
                outside.to_str().unwrap(),
                true,
                true
            )
            .unwrap_err()
            .code,
        "OUTSIDE_SCOPE"
    );
    assert_eq!(
        f.state
            .delete(&token, outside.to_str().unwrap())
            .unwrap_err()
            .code,
        "OUTSIDE_SCOPE"
    );
    let traversal = destination(&f, "../escape.png");
    assert_eq!(
        f.state
            .transfer(
                &token,
                src.to_str().unwrap(),
                traversal.to_str().unwrap(),
                false,
                false
            )
            .unwrap_err()
            .code,
        "OUTSIDE_SCOPE"
    );
    let mut portals = f.state.get("portals").unwrap();
    portals[0]["childs"][0]["link"] = json!(f.temp.path());
    assert_eq!(
        f.state
            .save(&token, "portals", &portals.to_string())
            .unwrap_err()
            .code,
        "OUTSIDE_SCOPE"
    );
    fs::remove_file(&src).unwrap();
    assert_eq!(
        f.state
            .transfer(
                &token,
                src.to_str().unwrap(),
                destination(&f, "x.png").to_str().unwrap(),
                true,
                true
            )
            .unwrap_err()
            .code,
        "NOT_FOUND"
    );
    assert!(!destination(&f, "x.png").exists());
    assert_eq!(fs::read(&outside).unwrap(), b"private");
}

#[test]
fn old_session_tokens_reject_mutations_even_after_reopening_the_same_file() {
    let mut f = Fixture::new();
    let before = f.open();
    let token = f.state.token().unwrap();
    f.open();
    assert_eq!(
        f.state.save(&token, "dockings", "[]").unwrap_err().code,
        "STALE_PROJECT"
    );
    assert_eq!(
        f.state
            .delete(&token, f.root.join("重複.png").to_str().unwrap())
            .unwrap_err()
            .code,
        "STALE_PROJECT"
    );
    assert_eq!(f.state.get("dockings").unwrap(), before["dockings"]);
    let other = f.temp.path().join("other.db");
    fs::write(
        &other,
        include_str!("../../../tests/fixtures/migration/empty.db"),
    )
    .unwrap();
    f.state.selected(other.clone(), false).unwrap();
    f.state.connect(other.to_str().unwrap()).unwrap();
    let other_bytes = fs::read(&other).unwrap();
    assert_eq!(
        f.state.pull_dockings(&token, "[]").unwrap_err().code,
        "STALE_PROJECT"
    );
    assert_eq!(fs::read(&other).unwrap(), other_bytes);
}

#[test]
fn concurrent_deep_updates_are_serialized_without_lost_fields() {
    let mut f = Fixture::new();
    f.open();
    let token = f.state.token().unwrap();
    let shared = std::sync::Arc::new(std::sync::Mutex::new(f.state));
    let workers: Vec<_> = (0..12)
        .map(|index| {
            let state = shared.clone();
            let token = token.clone();
            std::thread::spawn(move || {
                state
                    .lock()
                    .unwrap()
                    .deep_save(&token, &["extension".into(), index.to_string()], "true")
                    .unwrap()
            })
        })
        .collect();
    for worker in workers {
        worker.join().unwrap();
    }
    let data: Value = serde_json::from_slice(&fs::read(&f.file).unwrap()).unwrap();
    assert_eq!(data["extension"].as_object().unwrap().len(), 12);
    assert_eq!(data["id"], "project-001");
}

#[cfg(windows)]
#[test]
fn locked_json_or_destination_never_destroys_originals() {
    use std::os::windows::fs::OpenOptionsExt;
    let mut f = Fixture::new();
    let data = f.open();
    let token = f.state.token().unwrap();
    let original = fs::read(&f.file).unwrap();
    let lock = fs::OpenOptions::new()
        .read(true)
        .share_mode(0)
        .open(&f.file)
        .unwrap();
    assert!(f.state.save(&token, "dockings", "[]").is_err());
    assert_eq!(f.state.get("dockings").unwrap(), data["dockings"]);
    drop(lock);
    assert_eq!(fs::read(&f.file).unwrap(), original);
    let src = f.root.join("重複.png");
    let dest = destination(&f, "locked.png");
    fs::create_dir_all(dest.parent().unwrap()).unwrap();
    fs::write(&dest, b"original destination").unwrap();
    let lock = fs::OpenOptions::new()
        .read(true)
        .share_mode(0)
        .open(&dest)
        .unwrap();
    assert!(f
        .state
        .transfer(
            &token,
            src.to_str().unwrap(),
            dest.to_str().unwrap(),
            true,
            true
        )
        .is_err());
    assert!(src.exists());
    drop(lock);
    assert_eq!(fs::read(&dest).unwrap(), b"original destination");
    assert_eq!(fs::read_dir(dest.parent().unwrap()).unwrap().count(), 1);
}

#[cfg(windows)]
#[test]
fn failed_source_delete_keeps_both_complete_files() {
    use std::os::windows::fs::OpenOptionsExt;
    let mut f = Fixture::new();
    f.open();
    let token = f.state.token().unwrap();
    let src = f.root.join("重複.png");
    let dest = destination(&f, "delete-denied.png");
    let lock = fs::OpenOptions::new()
        .read(true)
        .share_mode(1)
        .open(&src)
        .unwrap();
    assert!(f
        .state
        .transfer(
            &token,
            src.to_str().unwrap(),
            dest.to_str().unwrap(),
            true,
            false
        )
        .is_err());
    assert_eq!(fs::read(&src).unwrap(), b"fixture");
    assert_eq!(fs::read(&dest).unwrap(), b"fixture");
    assert!(!f
        .state
        .get("dockings")
        .unwrap()
        .as_array()
        .unwrap()
        .is_empty());
    drop(lock);
}

#[cfg(windows)]
#[test]
fn replaced_destination_junction_is_rejected_before_creating_files() {
    let mut f = Fixture::new();
    f.open();
    let token = f.state.token().unwrap();
    let dest_root = f.temp.path().join("目的").join("收藏");
    fs::create_dir_all(dest_root.parent().unwrap()).unwrap();
    let outside = f.temp.path().join("external");
    fs::create_dir(&outside).unwrap();
    assert!(std::process::Command::new("cmd")
        .args(["/c", "mklink", "/J"])
        .arg(&dest_root)
        .arg(&outside)
        .output()
        .unwrap()
        .status
        .success());
    let src = f.root.join("重複.png");
    assert_eq!(
        f.state
            .transfer(
                &token,
                src.to_str().unwrap(),
                dest_root.join("x.png").to_str().unwrap(),
                true,
                true
            )
            .unwrap_err()
            .code,
        "OUTSIDE_SCOPE"
    );
    assert!(src.exists());
    assert!(!outside.join("x.png").exists());
    fs::remove_dir(dest_root).unwrap();
}

#[cfg(windows)]
#[test]
fn cross_volume_move_copies_before_removing_source() {
    let Some(directory) = std::env::var_os("PICPORTAL_TEST_OTHER_VOLUME") else {
        return;
    };
    let other = tempfile::tempdir_in(directory).unwrap();
    let mut f = Fixture::new();
    assert_ne!(
        f.root.components().next(),
        other.path().components().next(),
        "cross-volume test must use another drive"
    );
    let mut data: Value = serde_json::from_slice(&fs::read(&f.file).unwrap()).unwrap();
    data["portals"][0]["childs"][0]["link"] = json!(other.path());
    fs::write(&f.file, serialize_test(&data)).unwrap();
    f.open();
    let token = f.state.token().unwrap();
    let src = f.root.join("重複.png");
    let dest = other.path().join("跨磁碟.png");
    f.state
        .transfer(
            &token,
            src.to_str().unwrap(),
            dest.to_str().unwrap(),
            true,
            false,
        )
        .unwrap();
    assert_eq!(fs::read(&dest).unwrap(), b"fixture");
    assert!(!src.exists());
    let next = f.root.join("大寫.JPG");
    assert_eq!(
        f.state
            .transfer(
                &token,
                next.to_str().unwrap(),
                dest.to_str().unwrap(),
                true,
                false
            )
            .unwrap_err()
            .code,
        "FILE_EXIST"
    );
    assert!(next.exists());
    assert_eq!(fs::read(&dest).unwrap(), b"fixture");
}
