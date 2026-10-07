//! Project sessions. Paths can be authorized only by native selection
//! or by the validated source folder in an explicitly selected project.
use serde::Serialize;
use serde_json::Value;
use std::{
    collections::HashMap,
    fs,
    path::{Component, Path, PathBuf},
};
use walkdir::WalkDir;

#[cfg(test)]
mod tests;
mod write;
pub(crate) use write::atomic_write;

pub const IMAGE_TYPES: &[&str] = &["png", "jpg", "jpeg", "gif", "webp"];

#[derive(Debug, Clone, Serialize)]
pub struct Error {
    pub code: &'static str,
    pub message: String,
}
pub type Result<T> = std::result::Result<T, Error>;
pub fn error(code: &'static str, message: impl Into<String>) -> Error {
    Error {
        code,
        message: message.into(),
    }
}
fn io_error(e: std::io::Error) -> Error {
    let (code, message) = match e.kind() {
        std::io::ErrorKind::NotFound => ("NOT_FOUND", "檔案或資料夾不存在"),
        std::io::ErrorKind::PermissionDenied => ("ACCESS_DENIED", "沒有讀取或寫入檔案的權限"),
        std::io::ErrorKind::AlreadyExists => ("FILE_EXIST", "目的檔案已存在"),
        _ => ("IO_ERROR", "無法讀取或寫入檔案"),
    };
    error(code, format!("{message}：{e}"))
}
fn canonical(path: &Path) -> Result<PathBuf> {
    dunce::canonicalize(path).map_err(io_error)
}
fn path_key(path: &Path) -> Result<String> {
    if !path.is_absolute() || path.components().any(|c| c == Component::ParentDir) {
        return Err(error("OUTSIDE_SCOPE", "路徑不在目前專案的允許範圍"));
    }
    let key = path.to_string_lossy().into_owned();
    #[cfg(windows)]
    let key = key.replace('/', "\\").to_lowercase();
    Ok(key)
}

#[derive(Default)]
pub struct ProjectState {
    selected_files: HashMap<String, PathBuf>,
    selected_folders: HashMap<String, PathBuf>,
    active: Option<Session>,
    generation: u64,
    save_targets: HashMap<String, PathBuf>,
}
struct Session {
    data: Value,
    file: PathBuf,
    source: Option<PathBuf>,
    bytes: Vec<u8>,
    destinations: Vec<write::Root>,
    token: String,
}

impl ProjectState {
    pub(crate) fn has_selection(&self, path: &str) -> bool {
        path_key(Path::new(path)).is_ok_and(|key| self.selected_files.contains_key(&key))
    }
    /// Called with native picker/drop results or validated saved project paths.
    pub fn selected(&mut self, path: PathBuf, directory: bool) -> Result<String> {
        let resolved = canonical(&path)?;
        let key = path_key(&path)?;
        if directory != resolved.is_dir() {
            return Err(error("INVALID_PATH", "選取的檔案類型不符"));
        }
        let selections = if directory {
            &mut self.selected_folders
        } else {
            &mut self.selected_files
        };
        selections.insert(key, resolved.clone());
        selections.insert(path_key(&resolved)?, resolved.clone());
        Ok(resolved.to_string_lossy().into_owned())
    }

    pub(crate) fn selected_path(&self, path: &str, directory: bool) -> Result<PathBuf> {
        let path = Path::new(path);
        let selections = if directory {
            &self.selected_folders
        } else {
            &self.selected_files
        };
        let approved = selections
            .get(&path_key(path)?)
            .ok_or_else(|| error("OUTSIDE_SCOPE", "請先透過原生對話框選取路徑"))?;
        let resolved = canonical(path)?;
        if &resolved != approved {
            return Err(error("OUTSIDE_SCOPE", "選取的路徑已變更，請重新選取"));
        }
        Ok(resolved)
    }

    pub fn connect(&mut self, path: &str) -> Result<Value> {
        let file = self.selected_path(path, false)?;
        if !file
            .extension()
            .is_some_and(|ext| ext.eq_ignore_ascii_case("db"))
        {
            return Err(error("INVALID_PROJECT", "請選取 JSON 格式的 .db 專案檔"));
        }
        let bytes = fs::read(&file).map_err(io_error)?;
        let data: Value = serde_json::from_slice(&bytes)
            .map_err(|e| error("INVALID_JSON", format!("專案 JSON 損毀：{e}")))?;
        validate(&data)?;
        let source = data["mainFolder"]
            .get("path")
            .and_then(Value::as_str)
            .filter(|p| !p.is_empty())
            .map(|p| {
                let path = Path::new(p);
                let path = if path.is_absolute() {
                    path.to_path_buf()
                } else {
                    file.parent().unwrap().join(path)
                };
                source_folder(&path)
            })
            .transpose()?;
        let destinations = write::roots(&data, &file)?;
        self.generation += 1;
        self.active = Some(Session {
            data: data.clone(),
            file,
            source,
            bytes,
            destinations,
            token: self.generation.to_string(),
        });
        Ok(data)
    }
    fn session(&self) -> Result<&Session> {
        self.active
            .as_ref()
            .ok_or_else(|| error("NO_PROJECT", "尚未開啟專案"))
    }
    pub fn get(&self, key: &str) -> Result<Value> {
        Ok(self
            .session()?
            .data
            .get(key)
            .cloned()
            .unwrap_or(Value::Null))
    }
    pub fn source(&self) -> Result<Option<Folder>> {
        Ok(self.session()?.source.as_deref().map(Folder::from))
    }
    pub fn set_source(&mut self, path: &str) -> Result<Folder> {
        let token = self.token()?;
        let source = source_folder(&self.selected_path(path, true)?)?;
        let folder = Folder::from(source.as_path());
        let mut data = self.session()?.data.clone();
        data["mainFolder"] = serde_json::to_value(&folder).unwrap();
        data["dockings"] = serde_json::json!([]);
        self.commit(&token, data)?;
        self.active.as_mut().unwrap().source = Some(source);
        Ok(folder)
    }
    pub fn scan(&self, directory: &str, extensions: &[String]) -> Result<Vec<PathBuf>> {
        let source = self
            .session()?
            .source
            .as_ref()
            .ok_or_else(|| error("NO_SOURCE", "請選取圖片來源資料夾"))?;
        if path_key(Path::new(directory))? != path_key(source)? || canonical(source)? != *source {
            return Err(error("OUTSIDE_SCOPE", "只能掃描目前專案的圖片來源資料夾"));
        }
        scan(source, extensions)
    }
    pub fn exists(&self, path: &str) -> Result<bool> {
        self.scoped_exists(path)
    }
}

#[derive(Debug, Serialize)]
pub struct Folder {
    pub name: String,
    pub path: String,
}
impl From<&Path> for Folder {
    fn from(path: &Path) -> Self {
        Self {
            name: path
                .file_name()
                .unwrap_or(path.as_os_str())
                .to_string_lossy()
                .into_owned(),
            path: path.to_string_lossy().into_owned(),
        }
    }
}
fn source_folder(path: &Path) -> Result<PathBuf> {
    let resolved = canonical(path)?;
    if !resolved.is_dir() {
        return Err(error("INVALID_SOURCE", "圖片來源必須是資料夾"));
    }
    fs::read_dir(&resolved).map_err(io_error)?;
    Ok(resolved)
}
fn hidden_or_link(entry: &walkdir::DirEntry) -> bool {
    if entry.file_type().is_symlink() || entry.file_name().to_string_lossy().starts_with('.') {
        return true;
    }
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        // Skip hidden files and all reparse points, including junctions.
        if fs::symlink_metadata(entry.path())
            .map_or(true, |m| m.file_attributes() & (0x2 | 0x400) != 0)
        {
            return true;
        }
    }
    false
}
fn scan(root: &Path, extensions: &[String]) -> Result<Vec<PathBuf>> {
    let extensions: Vec<_> = extensions
        .iter()
        .map(|ext| ext.trim_start_matches('.').to_ascii_lowercase())
        .collect();
    if extensions
        .iter()
        .any(|ext| !IMAGE_TYPES.contains(&ext.as_str()))
    {
        return Err(error(
            "INVALID_EXTENSION",
            "只支援 png、jpg、jpeg、gif、webp 圖片",
        ));
    }
    let mut files = Vec::new();
    for entry in WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| e.depth() == 0 || !hidden_or_link(e))
    {
        let entry = entry.map_err(|e| {
            e.into_io_error()
                .map_or_else(|| error("IO_ERROR", "無法掃描圖片來源"), io_error)
        })?;
        if !entry.file_type().is_file() {
            continue;
        }
        let ext = entry
            .path()
            .extension()
            .map(|e| e.to_string_lossy().to_ascii_lowercase());
        if !ext.is_some_and(|ext| extensions.contains(&ext)) {
            continue;
        }
        let path = canonical(entry.path())?;
        if !path.starts_with(root) {
            return Err(error("OUTSIDE_SCOPE", "圖片路徑指向來源資料夾之外"));
        }
        files.push(path);
    }
    files.sort();
    files.dedup();
    Ok(files)
}

fn validate(data: &Value) -> Result<()> {
    let invalid = || {
        error(
            "INVALID_PROJECT",
            "專案欄位格式不正確（mainFolder、portals 或 dockings）",
        )
    };
    if !data.is_object() {
        return Err(invalid());
    }
    for key in ["id", "project"] {
        if data.get(key).is_some_and(|v| !v.is_string()) {
            return Err(invalid());
        }
    }
    if data["mainFolder"] != ""
        && !(data["mainFolder"].is_object()
            && data["mainFolder"]["name"].is_string()
            && data["mainFolder"]["path"].is_string())
    {
        return Err(invalid());
    }
    for group in data["portals"].as_array().ok_or_else(invalid)? {
        if !group["id"].is_string() || !group["group"].is_string() {
            return Err(invalid());
        }
        for portal in group["childs"].as_array().ok_or_else(invalid)? {
            if ["id", "name", "link", "bg", "fg"]
                .iter()
                .any(|key| !portal[*key].is_string())
            {
                return Err(invalid());
            }
        }
    }
    for docking in data["dockings"].as_array().ok_or_else(invalid)? {
        if !docking["target"].is_string()
            || !docking["portals"]
                .as_array()
                .is_some_and(|p| p.iter().all(Value::is_string))
        {
            return Err(invalid());
        }
    }
    Ok(())
}
