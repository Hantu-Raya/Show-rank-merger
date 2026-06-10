function toBytes(bytes) {
  if (bytes instanceof Uint8Array) return new Uint8Array(bytes);
  return new Uint8Array(bytes);
}

function cloneFile(file) {
  return {
    path: String(file.path),
    bytes: toBytes(file.bytes)
  };
}

export function normalizeVpkPath(path) {
  return String(path || "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .toLowerCase();
}

export function mergeFilesWithPriority(baseFiles, priorityFiles) {
  const files = [];
  const indexByPath = new Map();
  const overwrittenPaths = [];

  for (const file of baseFiles || []) {
    const cloned = cloneFile(file);
    const normalized = normalizeVpkPath(cloned.path);
    if (!normalized) continue;
    if (!indexByPath.has(normalized)) {
      indexByPath.set(normalized, files.length);
      files.push(cloned);
    }
  }

  for (const file of priorityFiles || []) {
    const cloned = cloneFile(file);
    const normalized = normalizeVpkPath(cloned.path);
    if (!normalized) continue;
    const existingIndex = indexByPath.get(normalized);
    if (existingIndex === undefined) {
      indexByPath.set(normalized, files.length);
      files.push(cloned);
      continue;
    }

    overwrittenPaths.push({
      path: normalized,
      basePath: files[existingIndex].path,
      priorityPath: cloned.path
    });
    files[existingIndex] = cloned;
  }

  return { files, overwrittenPaths };
}
