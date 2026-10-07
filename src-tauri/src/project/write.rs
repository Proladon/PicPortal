use super::*;
use serde_json::json;
use std::io::Write;

#[derive(Clone)]
pub(super) struct Root {
    path: PathBuf,
    anchor: PathBuf,
}

// Pin the nearest existing directory, also for a Portal not created yet.
impl Root {
    fn new(path: PathBuf) -> Result<Self> {
        path_key(&path)?;
        let mut anchor = path.as_path();
        while !anchor.try_exists().map_err(io_error)? {
            anchor = anchor
                .parent()
                .ok_or_else(|| error("INVALID_PATH", "找不到目的目錄"))?;
        }
        no_links(anchor)?;
        if !anchor.is_dir() {
            return Err(error("OUTSIDE_SCOPE", "目的目錄包含連結或不合法路徑"));
        }
        let suffix = path.strip_prefix(anchor).unwrap().to_owned();
        let anchor = canonical(anchor)?;
        Ok(Self {
            path: anchor.join(suffix),
            anchor,
        })
    }
    fn check(&self, path: &Path) -> Result<()> {
        if !within(path, &self.path)? || canonical(&self.anchor)? != self.anchor {
            return Err(error("OUTSIDE_SCOPE", "路徑不在專案授權的目錄內"));
        }
        no_links(path)
    }
}
fn within(path: &Path, root: &Path) -> Result<bool> {
    let path = path_key(path)?;
    let root = path_key(root)?;
    let separator = std::path::MAIN_SEPARATOR;
    let path = path.trim_end_matches(separator);
    let root = root.trim_end_matches(separator);
    Ok(path == root || path.starts_with(&format!("{root}{separator}")))
}
fn no_links(path: &Path) -> Result<()> {
    path_key(path)?;
    for part in path.ancestors() {
        match fs::symlink_metadata(part) {
            Ok(meta) => {
                #[cfg(windows)]
                let link = {
                    use std::os::windows::fs::MetadataExt;
                    meta.file_attributes() & 0x400 != 0
                };
                #[cfg(not(windows))]
                let link = meta.file_type().is_symlink();
                if link {
                    return Err(error("OUTSIDE_SCOPE", "檔案操作不接受符號連結或 junction"));
                }
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
            Err(e) => return Err(io_error(e)),
        }
    }
    #[cfg(windows)]
    for component in path.components() {
        if let Component::Normal(name) = component {
            let name = name.to_string_lossy();
            if name.contains(':') || name.ends_with(['.', ' ']) {
                return Err(error(
                    "INVALID_PATH",
                    "檔名不可包含替代資料流或尾端點號／空白",
                ));
            }
        }
    }
    Ok(())
}
fn resolve(file: &Path, path: &str) -> PathBuf {
    let path = Path::new(path);
    let path = if path.is_absolute() {
        path.to_owned()
    } else {
        file.parent().unwrap().join(path)
    };
    // Resolve trusted project-relative paths once, preserving their JSON text.
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                normalized.pop();
            }
            component => normalized.push(component.as_os_str()),
        }
    }
    normalized
}
pub(super) fn roots(data: &Value, file: &Path) -> Result<Vec<Root>> {
    let mut result = Vec::new();
    for group in data["portals"].as_array().unwrap() {
        for portal in group["childs"].as_array().unwrap() {
            let link = portal["link"].as_str().unwrap();
            if !link.is_empty() {
                result.push(Root::new(resolve(file, link))?);
            }
        }
    }
    Ok(result)
}
fn serialize(data: &Value) -> Result<Vec<u8>> {
    serde_json::to_vec_pretty(data).map_err(|e| error("INVALID_JSON", e.to_string()))
}
pub(crate) fn atomic_write(
    path: &Path,
    bytes: &[u8],
    overwrite: bool,
    check: impl FnOnce() -> Result<()>,
) -> Result<()> {
    let parent = path
        .parent()
        .ok_or_else(|| error("INVALID_PATH", "檔案沒有父目錄"))?;
    let mut temp = tempfile::NamedTempFile::new_in(parent).map_err(io_error)?;
    temp.write_all(bytes).map_err(io_error)?;
    temp.as_file().sync_all().map_err(io_error)?;
    check()?;
    // tempfile uses MoveFileExW on Windows. Never delete the original first.
    if overwrite {
        temp.persist(path)
    } else {
        temp.persist_noclobber(path)
    }
    .map_err(|e| io_error(e.error))?;
    Ok(())
}

impl ProjectState {
    pub fn token(&self) -> Result<String> {
        Ok(self.session()?.token.clone())
    }
    pub fn require_token(&self, token: &str) -> Result<()> {
        if self.session()?.token != token {
            return Err(error("STALE_PROJECT", "專案已切換，舊作業已停止"));
        }
        Ok(())
    }
    pub fn save_target(&mut self, path: PathBuf) -> Result<String> {
        path_key(&path)?;
        no_links(&path)?;
        if !path
            .extension()
            .is_some_and(|e| e.eq_ignore_ascii_case("db"))
        {
            return Err(error("INVALID_PROJECT", "新專案須使用 .db 副檔名"));
        }
        let parent = canonical(
            path.parent()
                .ok_or_else(|| error("INVALID_PATH", "沒有父目錄"))?,
        )?;
        let path = parent.join(path.file_name().unwrap());
        self.save_targets.insert(path_key(&path)?, parent);
        Ok(path.to_string_lossy().into_owned())
    }
    fn new_target(&self, path: &str) -> Result<PathBuf> {
        let path = Path::new(path);
        let parent = self
            .save_targets
            .get(&path_key(path)?)
            .ok_or_else(|| error("OUTSIDE_SCOPE", "請透過儲存對話框選取新專案位置"))?;
        if canonical(path.parent().unwrap())? != *parent {
            return Err(error("OUTSIDE_SCOPE", "專案位置已變更"));
        }
        no_links(path)?;
        Ok(path.to_owned())
    }
    pub fn create(&mut self, path: &str) -> Result<()> {
        let path = self.new_target(path)?;
        // Creating a project is one atomic JSON operation; no empty placeholder.
        if path.try_exists().map_err(io_error)? {
            return Err(error("FILE_EXIST", "專案檔已存在，請選擇新位置"));
        }
        Ok(())
    }
    pub fn write_json(&mut self, path: &str, data: Value) -> Result<()> {
        let file = self.new_target(path)?;
        validate(&data)?;
        if data["mainFolder"] != ""
            || !data["portals"].as_array().unwrap().is_empty()
            || !data["dockings"].as_array().unwrap().is_empty()
        {
            return Err(error("INVALID_PROJECT", "新建專案必須為空白專案"));
        }
        atomic_write(&file, &serialize(&data)?, false, || {
            self.new_target(path).map(|_| ())
        })?;
        self.save_targets.remove(&path_key(&file)?);
        self.selected(file, false)?;
        Ok(())
    }
    pub(super) fn commit(&mut self, token: &str, mut data: Value) -> Result<String> {
        self.require_token(token)?;
        let session = self.session()?;
        preserve_unknown(&session.data, &mut data);
        validate(&data)?;
        for key in ["id", "project"] {
            if data.get(key) != session.data.get(key) {
                return Err(error("INVALID_PROJECT", "不可變更既有專案 ID"));
            }
        }
        let source = if data["mainFolder"] == session.data["mainFolder"] {
            session.source.clone()
        } else if data["mainFolder"] == "" {
            None
        } else {
            Some(source_folder(&self.selected_path(
                data["mainFolder"]["path"].as_str().unwrap(),
                true,
            )?)?)
        };
        let destinations = roots(&data, &session.file)?;
        for root in &destinations {
            if let Some(old) = session
                .destinations
                .iter()
                .find(|old| old.path == root.path)
            {
                old.check(&root.path)?;
            } else {
                let selected = self.selected_path(root.path.to_str().unwrap(), true)?;
                if selected != root.path {
                    return Err(error("OUTSIDE_SCOPE", "新增 Portal 請先選取目的資料夾"));
                }
            }
        }
        let bytes = serialize(&data)?;
        atomic_write(&session.file, &bytes, true, || {
            no_links(&session.file)?;
            if canonical(&session.file)? != session.file
                || fs::read(&session.file).map_err(io_error)? != session.bytes
            {
                return Err(error(
                    "PROJECT_CHANGED",
                    "專案檔已被其他程式修改，請重新開啟",
                ));
            }
            Ok(())
        })?;
        let session = self.active.as_mut().unwrap();
        session.data = data;
        session.bytes = bytes;
        session.source = source;
        session.destinations = destinations;
        Ok("success".into())
    }
    pub fn save(&mut self, token: &str, key: &str, serialized: &str) -> Result<String> {
        self.deep_save(token, &[key.to_owned()], serialized)
    }
    pub fn deep_save(&mut self, token: &str, keys: &[String], serialized: &str) -> Result<String> {
        self.require_token(token)?;
        if keys.is_empty()
            || keys.iter().any(|k| {
                k.is_empty() || ["__proto__", "constructor", "prototype"].contains(&k.as_str())
            })
        {
            return Err(error("INVALID_KEY", "不合法的更新路徑"));
        }
        let value =
            serde_json::from_str(serialized).map_err(|e| error("INVALID_JSON", e.to_string()))?;
        let mut data = self.session()?.data.clone();
        set_value(&mut data, keys, value)?;
        self.commit(token, data)
    }
    pub fn slice(&mut self, token: &str, key: &str, index: usize) -> Result<String> {
        self.require_token(token)?;
        let mut data = self.session()?.data.clone();
        let array = data
            .get_mut(key)
            .and_then(Value::as_array_mut)
            .ok_or_else(|| error("INVALID_KEY", "刪除目標必須為陣列"))?;
        if index >= array.len() {
            return Err(error("INVALID_INDEX", "刪除位置已失效"));
        }
        array.remove(index);
        self.commit(token, data)
    }
    pub fn pull_dockings(&mut self, token: &str, serialized: &str) -> Result<String> {
        self.require_token(token)?;
        let list: Value =
            serde_json::from_str(serialized).map_err(|e| error("INVALID_JSON", e.to_string()))?;
        let targets: Vec<_> = list
            .as_array()
            .ok_or_else(|| error("INVALID_PROJECT", "待清理資料須為陣列"))?
            .iter()
            .map(|d| {
                d["target"]
                    .as_str()
                    .ok_or_else(|| error("INVALID_PROJECT", "待清理路徑格式錯誤"))
            })
            .collect::<Result<_>>()?;
        let mut data = self.session()?.data.clone();
        data["dockings"]
            .as_array_mut()
            .unwrap()
            .retain(|d| !targets.contains(&d["target"].as_str().unwrap()));
        self.commit(token, data)
    }
    fn source_file(&self, path: &str) -> Result<PathBuf> {
        let source = self
            .session()?
            .source
            .as_ref()
            .ok_or_else(|| error("NO_SOURCE", "尚未選取來源"))?;
        let path = Path::new(path);
        Root {
            path: source.clone(),
            anchor: source.clone(),
        }
        .check(path)?;
        let meta = fs::metadata(path).map_err(io_error)?;
        if !meta.is_file()
            || !path.extension().is_some_and(|e| {
                IMAGE_TYPES.contains(&e.to_string_lossy().to_ascii_lowercase().as_str())
            })
        {
            return Err(error("INVALID_PATH", "檔案操作僅接受來源圖片"));
        }
        Ok(path.to_owned())
    }
    fn destination(&self, path: &str) -> Result<PathBuf> {
        let path = Path::new(path);
        let session = self.session()?;
        let root = session
            .destinations
            .iter()
            .find(|r| within(path, &r.path).unwrap_or(false))
            .ok_or_else(|| error("OUTSIDE_SCOPE", "目的路徑不在 Portal 目錄內"))?;
        root.check(path)?;
        if path == root.path
            || !path.extension().is_some_and(|e| {
                IMAGE_TYPES.contains(&e.to_string_lossy().to_ascii_lowercase().as_str())
            })
        {
            return Err(error("INVALID_PATH", "目的路徑須為圖片檔案"));
        }
        Ok(path.to_owned())
    }
    pub fn transfer(
        &mut self,
        token: &str,
        source: &str,
        destination: &str,
        move_source: bool,
        overwrite: bool,
    ) -> Result<()> {
        self.require_token(token)?;
        let source_path = self.source_file(source)?;
        let dest = self.destination(destination)?;
        if path_key(&source_path)? == path_key(&dest)?
            || same_file::is_same_file(&source_path, &dest).unwrap_or(false)
        {
            return Err(error("SAME_FILE", "來源與目的為同一檔案"));
        }
        if dest.try_exists().map_err(io_error)? && !overwrite {
            return Err(error("FILE_EXIST", "目的檔案已存在"));
        }
        fs::create_dir_all(dest.parent().unwrap()).map_err(io_error)?;
        self.destination(destination)?;
        let mut input = fs::File::open(&source_path).map_err(io_error)?;
        let source_identity =
            same_file::Handle::from_file(input.try_clone().map_err(io_error)?).map_err(io_error)?;
        let mut temp = tempfile::NamedTempFile::new_in(dest.parent().unwrap()).map_err(io_error)?;
        std::io::copy(&mut input, &mut temp).map_err(io_error)?;
        temp.as_file().sync_all().map_err(io_error)?;
        self.source_file(source)?;
        self.destination(destination)?;
        if same_file::Handle::from_path(&source_path).map_err(io_error)? != source_identity {
            return Err(error("SOURCE_CHANGED", "來源檔案在複製期間被替換"));
        }
        if overwrite {
            temp.persist(&dest)
        } else {
            temp.persist_noclobber(&dest)
        }
        .map_err(|e| io_error(e.error))?;
        // This copy/commit/delete sequence also works across volumes. Failure to
        // delete keeps both complete files and reports failure for retry.
        drop(input);
        if move_source {
            self.source_file(source)?;
            if same_file::Handle::from_path(&source_path).map_err(io_error)? != source_identity {
                return Err(error(
                    "SOURCE_CHANGED",
                    "來源檔案已被替換，保留複製結果並停止刪除",
                ));
            }
            fs::remove_file(source_path).map_err(io_error)?;
        }
        Ok(())
    }
    pub fn delete(&mut self, token: &str, path: &str) -> Result<String> {
        self.require_token(token)?;
        let path = self.source_file(path)?;
        fs::remove_file(path).map_err(io_error)?;
        Ok("ok".into())
    }
    pub fn open_folder(&self, path: &str) -> Result<PathBuf> {
        let path = Path::new(path);
        let session = self.session()?;
        let source = session
            .source
            .as_ref()
            .filter(|root| within(path, root).unwrap_or(false));
        if let Some(source) = source {
            Root {
                path: source.clone(),
                anchor: source.clone(),
            }
            .check(path)?;
        } else if let Some(root) = session
            .destinations
            .iter()
            .find(|root| within(path, &root.path).unwrap_or(false))
        {
            root.check(path)?;
        } else {
            return Err(error("OUTSIDE_SCOPE", "只能開啟來源或 Portal 資料夾"));
        }
        no_links(path)?;
        let resolved = canonical(path)?;
        if !resolved.is_dir() {
            return Err(error("INVALID_PATH", "必須選取資料夾"));
        }
        Ok(resolved)
    }
    pub(super) fn scoped_exists(&self, path: &str) -> Result<bool> {
        let session = self.session()?;
        let file = Path::new(path);
        if path_key(file)? == path_key(&session.file)? {
            no_links(file)?;
        } else if session
            .source
            .as_ref()
            .is_some_and(|root| within(file, root).unwrap_or(false))
        {
            let source = session.source.as_ref().unwrap();
            Root {
                path: source.clone(),
                anchor: source.clone(),
            }
            .check(file)?;
        } else {
            self.destination(path)?;
        }
        file.try_exists().map_err(io_error)
    }
}
fn set_value(data: &mut Value, keys: &[String], value: Value) -> Result<()> {
    let key = &keys[0];
    let target = if let Some(array) = data.as_array_mut() {
        let index: usize = key
            .parse()
            .map_err(|_| error("INVALID_KEY", "陣列位置須為數字"))?;
        array
            .get_mut(index)
            .ok_or_else(|| error("INVALID_INDEX", "陣列位置不存在"))?
    } else if let Some(object) = data.as_object_mut() {
        object.entry(key.clone()).or_insert_with(|| json!({}))
    } else {
        return Err(error("INVALID_KEY", "更新路徑不是物件或陣列"));
    };
    if keys.len() == 1 {
        *target = value;
        Ok(())
    } else {
        set_value(target, &keys[1..], value)
    }
}
// Preserve extension fields even when an older UI replaces a known record.
fn preserve_unknown(old: &Value, new: &mut Value) {
    if let (Some(old), Some(new)) = (old.as_object(), new.as_object_mut()) {
        let known: &[&str] = if old.contains_key("mainFolder") {
            &["id", "project", "mainFolder", "portals", "dockings"]
        } else if old.contains_key("childs") {
            &["id", "group", "childs"]
        } else if old.contains_key("link") {
            &["id", "name", "link", "bg", "fg"]
        } else if old.contains_key("target") {
            &["target", "portals"]
        } else if old.contains_key("path") && old.contains_key("name") {
            &["name", "path"]
        } else {
            &[]
        };
        for (key, value) in old {
            if let Some(next) = new.get_mut(key) {
                preserve_unknown(value, next);
            } else if !known.contains(&key.as_str()) {
                new.insert(key.clone(), value.clone());
            }
        }
    } else if let (Some(old), Some(new)) = (old.as_array(), new.as_array_mut()) {
        for next in new {
            let identity = next.get("id").or_else(|| next.get("target"));
            if let Some(previous) = identity.and_then(|id| {
                old.iter()
                    .find(|p| p.get("id").or_else(|| p.get("target")) == Some(id))
            }) {
                preserve_unknown(previous, next);
            }
        }
    }
}
