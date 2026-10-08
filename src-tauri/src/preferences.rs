use crate::project::{atomic_write, error, Error, Result};
use serde::Serialize;
use serde_json::{json, Value};
use std::{
    fs,
    path::{Path, PathBuf},
    sync::Arc,
};
use tauri::AppHandle;
use tauri_plugin_store::{Store, StoreExt};

const MARKER: &str = "__picportalMigration";
pub struct Preferences {
    store: Arc<Store<tauri::Wry>>,
    pub data: Value,
    path: PathBuf,
    stage: PathBuf,
    bytes: Option<Vec<u8>>,
}
#[derive(Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportStatus {
    pub completed: bool,
    pub added_projects: usize,
    pub message: Option<String>,
}
fn io(e: std::io::Error) -> Error {
    error("SETTINGS_IO", format!("無法讀寫設定：{e}"))
}
fn read(path: &Path) -> Result<Option<Vec<u8>>> {
    match fs::read(path) {
        Ok(bytes) => Ok(Some(bytes)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(io(e)),
    }
}
fn parse(bytes: &[u8]) -> Result<Value> {
    let data: Value = serde_json::from_slice(bytes)
        .map_err(|e| error("INVALID_SETTINGS", format!("設定 JSON 損毀：{e}")))?;
    validate(&data)?;
    Ok(data)
}
pub fn validate(data: &Value) -> Result<()> {
    let invalid = || error("INVALID_SETTINGS", "設定或專案清單欄位格式不正確");
    if !data.is_object() {
        return Err(invalid());
    }
    if let Some(projects) = data.get("projects") {
        for project in projects.as_array().ok_or_else(invalid)? {
            if !project.is_object()
                || !project["id"].as_str().is_some_and(|s| !s.is_empty())
                || !project["path"].as_str().is_some_and(|s| {
                    !s.is_empty()
                        && Path::new(s)
                            .extension()
                            .is_some_and(|e| e.eq_ignore_ascii_case("db"))
                })
                || project.get("name").is_some_and(|v| !v.is_string())
                // Electron's import form saves null when no color is selected.
                || project
                    .get("color")
                    .is_some_and(|v| !v.is_string() && !v.is_null())
            {
                return Err(invalid());
            }
        }
    }
    if let Some(settings) = data.get("settings") {
        if !settings.is_object() {
            return Err(invalid());
        }
        for key in ["general", "viewer", "hotkeys"] {
            if settings.get(key).is_some_and(|v| !v.is_object()) {
                return Err(invalid());
            }
        }
        if settings["general"]
            .get("locale")
            .is_some_and(|v| ![json!("en"), json!("tw")].contains(v))
            || settings["general"].get("theme").is_some_and(|v| {
                ![
                    json!("picportal"),
                    json!("naive"),
                    json!("zinc"),
                    json!("violet"),
                    json!("rose"),
                    json!("amber"),
                ]
                .contains(v)
            })
            || settings["general"]
                .get("appearance")
                .is_some_and(|v| ![json!("dark"), json!("light"), json!("system")].contains(v))
            || settings["viewer"]
                .get("portalPanelPosition")
                .is_some_and(|v| ![json!("left"), json!("right")].contains(v))
        {
            return Err(invalid());
        }
    }
    Ok(())
}
pub(crate) fn key(path: &str) -> String {
    #[cfg(windows)]
    {
        path.replace('/', "\\").to_lowercase()
    }
    #[cfg(not(windows))]
    {
        path.to_owned()
    }
}
fn fill_missing(current: &mut Value, imported: &Value) {
    if let (Some(current), Some(imported)) = (current.as_object_mut(), imported.as_object()) {
        for (key, value) in imported {
            if let Some(existing) = current.get_mut(key) {
                fill_missing(existing, value);
            } else {
                current.insert(key.clone(), value.clone());
            }
        }
    }
}
pub fn merge_import(current: &Value, imported: &Value) -> Result<(Value, usize)> {
    validate(current)?;
    validate(imported)?;
    let mut merged = current.clone();
    let mut added = 0;
    let mut projects = merged
        .get("projects")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    for project in imported
        .get("projects")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
    {
        if let Some(existing) = projects.iter_mut().find(|p| {
            p["id"] == project["id"]
                || key(p["path"].as_str().unwrap()) == key(project["path"].as_str().unwrap())
        }) {
            fill_missing(existing, project);
        } else {
            projects.push(project.clone());
            added += 1;
        }
    }
    if imported.get("projects").is_some() {
        merged["projects"] = Value::Array(projects);
    }
    for (key, value) in imported.as_object().unwrap() {
        if key == "projects" || key == MARKER {
            continue;
        }
        if let Some(existing) = merged.get_mut(key) {
            fill_missing(existing, value);
        } else {
            merged[key] = value.clone();
        }
    }
    merged[MARKER] = json!({"completed":true,"version":1});
    validate(&merged)?;
    Ok((merged, added))
}
impl Preferences {
    pub fn load(app: &AppHandle, path: PathBuf) -> Result<Self> {
        fs::create_dir_all(path.parent().unwrap()).map_err(io)?;
        let bytes = read(&path)?;
        let data = bytes
            .as_deref()
            .map(parse)
            .transpose()?
            .unwrap_or_else(|| json!({}));
        let stage = path.with_file_name(".settings.pending.json");
        // The plugin's save uses fs::write. Save to staging, then atomically
        // replace the real settings file; failed commits keep its old bytes.
        let store = app
            .store_builder(&stage)
            .disable_auto_save()
            .create_new()
            .build()
            .map_err(|e| error("SETTINGS_IO", e.to_string()))?;
        let result = Self {
            store,
            path,
            stage,
            bytes,
            data,
        };
        result.cache(&result.data);
        Ok(result)
    }
    fn cache(&self, data: &Value) {
        self.store.clear();
        for (key, value) in data.as_object().unwrap() {
            self.store.set(key, value.clone());
        }
    }
    pub fn commit(&mut self, data: Value) -> Result<()> {
        validate(&data)?;
        if fs::symlink_metadata(&self.stage).is_ok_and(|m| {
            #[cfg(windows)]
            {
                use std::os::windows::fs::MetadataExt;
                m.file_attributes() & 0x400 != 0
            }
            #[cfg(not(windows))]
            {
                m.file_type().is_symlink()
            }
        }) {
            return Err(error("OUTSIDE_SCOPE", "設定暫存位置不可為連結"));
        }
        self.cache(&data);
        let result = (|| {
            self.store
                .save()
                .map_err(|e| error("SETTINGS_IO", e.to_string()))?;
            let bytes = fs::read(&self.stage).map_err(io)?;
            atomic_write(&self.path, &bytes, self.bytes.is_some(), || {
                if read(&self.path)? != self.bytes {
                    return Err(error(
                        "SETTINGS_CHANGED",
                        "設定已被其他程式修改，請重新啟動",
                    ));
                }
                Ok(())
            })?;
            self.bytes = Some(bytes);
            Ok(())
        })();
        if result.is_err() {
            self.cache(&self.data);
            return result;
        }
        self.data = data;
        Ok(())
    }
    pub fn completed(&self) -> bool {
        self.data[MARKER]["completed"] == true
    }
    pub fn import(&mut self, path: &Path) -> Result<ImportStatus> {
        let original = fs::read(path).map_err(io)?;
        let source = parse(&original)?;
        let (data, added_projects) = merge_import(&self.data, &source)?;
        self.commit(data)?;
        Ok(ImportStatus {
            completed: true,
            added_projects,
            message: None,
        })
    }
    pub fn get(&self, key: &str) -> Result<Value> {
        known_key(key)?;
        let mut value = self.store.get(key).unwrap_or(Value::Null);
        if key == "settings" && !value.is_null() {
            fill_missing(
                &mut value,
                &json!({"general":{"locale":"en","theme":"picportal"},"viewer":{"portalPanelPosition":"right"},"hotkeys":{}}),
            );
        }
        if key == "projects" {
            if let Some(projects) = value.as_array_mut() {
                for project in projects {
                    let defaults = json!({"name": Path::new(project["path"].as_str().unwrap()).file_stem().unwrap_or_default().to_string_lossy(), "color":""});
                    fill_missing(project, &defaults);
                }
            }
        }
        Ok(value)
    }
    pub fn set(&mut self, key: &str, value: Value) -> Result<()> {
        known_key(key)?;
        let mut data = self.data.clone();
        data[key] = value;
        self.commit(data)
    }
    pub fn remove(&mut self, key: Option<&str>) -> Result<()> {
        let mut data = self.data.clone();
        if let Some(key) = key {
            known_key(key)?;
            data.as_object_mut().unwrap().remove(key);
        } else {
            for key in ["projects", "settings"] {
                data.as_object_mut().unwrap().remove(key);
            }
        }
        self.commit(data)
    }
}
fn known_key(key: &str) -> Result<()> {
    if ["projects", "settings"].contains(&key) {
        Ok(())
    } else {
        Err(error("INVALID_KEY", "只允許設定與專案清單操作"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn legacy_null_project_colors_survive_import_and_retry() {
        let old = json!({"projects":[{"id":"a","path":"C:/images/a.db","name":"legacy","color":null,"extra":true}]});
        let bytes = serde_json::to_vec(&old).unwrap();
        assert_eq!(parse(&bytes).unwrap(), old);
        let (merged, added) = merge_import(&json!({"projects":[]}), &old).unwrap();
        assert_eq!(added, 1);
        assert_eq!(merged["projects"][0], old["projects"][0]);
        assert_eq!(merge_import(&merged, &old).unwrap(), (merged, 0));
        for invalid in [json!(false), json!(123), json!({}), json!([])] {
            let mut data = old.clone();
            data["projects"][0]["color"] = invalid;
            assert!(validate(&data).is_err());
        }
    }
    #[test]
    fn migration_preserves_existing_settings_unknowns_and_deduplicates() {
        let old = json!({"settings":{"general":{"locale":"tw","theme":"picportal"},"extra":42},"projects":[{"id":"a","path":"C:/images/a.db","extra":true}],"future":{"keep":true}});
        let current = json!({"settings":{"general":{"locale":"en"}},"projects":[{"id":"new-a","path":"C:/images/a.db","name":"edited"}]});
        let (merged, added) = merge_import(&current, &old).unwrap();
        assert_eq!(added, 0);
        assert_eq!(merged["projects"].as_array().unwrap().len(), 1);
        assert_eq!(merged["projects"][0]["id"], "new-a");
        assert_eq!(merged["projects"][0]["extra"], true);
        assert_eq!(merged["settings"]["general"]["locale"], "en");
        assert_eq!(merged["settings"]["general"]["theme"], "picportal");
        assert_eq!(merged["future"]["keep"], true);
        assert_eq!(merge_import(&merged, &old).unwrap(), (merged, 0));
        assert_eq!(old["settings"]["general"]["locale"], "tw");
    }
    #[test]
    fn damaged_settings_never_become_empty_defaults() {
        assert!(parse(b"{broken").is_err());
        assert!(parse(b"[]").is_err());
        assert!(validate(&json!({"settings":{"general":{"locale":false}}})).is_err());
        assert!(validate(&json!({"projects":[{"id":"a","path":"secret.json"}]})).is_err());
        assert!(validate(&json!({"settings":{"hotkeys":{}}})).is_ok());
        assert!(validate(
            &json!({"settings":{"general":{"theme":"violet","appearance":"system"}}})
        )
        .is_ok());
        assert!(validate(&json!({"settings":{"general":{"theme":"unknown"}}})).is_err());
        assert!(validate(&json!({"settings":{"general":{"appearance":"dim"}}})).is_err());
    }
}
