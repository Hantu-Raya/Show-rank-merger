const VPK_MAGIC = 0x55aa1234;
const VPK_VERSION = 2;
const HEADER_SIZE = 28;
const EMBEDDED_ARCHIVE_INDEX = 0x7fff;
const ENTRY_SIZE = 18;
const ENTRY_TERMINATOR = 0xffff;

function toBytes(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  throw new Error("VPK input must be a Uint8Array or ArrayBuffer");
}

function normalizePath(path) {
  return String(path || "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .toLowerCase();
}

function readCString(bytes, cursor, end) {
  let pos = cursor;
  while (pos < end && bytes[pos] !== 0) pos += 1;
  if (pos >= end) {
    throw new Error("Malformed VPK tree: unterminated string");
  }
  return {
    value: new TextDecoder().decode(bytes.slice(cursor, pos)),
    next: pos + 1
  };
}

function joinPath(dir, name, ext) {
  const fileName = `${name}.${ext}`;
  return dir === " " || dir === "" ? fileName : `${dir}/${fileName}`;
}

function readEntry(bytes, view, cursor, treeEnd, dataStart, fileDataSize, ext, dir, name) {
  if (cursor + ENTRY_SIZE > treeEnd) {
    throw new Error("Malformed VPK tree: truncated entry");
  }

  const crc = view.getUint32(cursor, true);
  const preloadBytes = view.getUint16(cursor + 4, true);
  const archiveIndex = view.getUint16(cursor + 6, true);
  const entryOffset = view.getUint32(cursor + 8, true);
  const entryLength = view.getUint32(cursor + 12, true);
  const terminator = view.getUint16(cursor + 16, true);
  cursor += ENTRY_SIZE;

  if (terminator !== ENTRY_TERMINATOR) {
    throw new Error("Malformed VPK tree: invalid entry terminator");
  }
  if (cursor + preloadBytes > treeEnd) {
    throw new Error("Malformed VPK tree: preload data exceeds tree size");
  }
  if (archiveIndex !== EMBEDDED_ARCHIVE_INDEX) {
    throw new Error(`VPK entry uses external archive ${archiveIndex}: ${joinPath(dir, name, ext)}`);
  }
  if (entryOffset + entryLength > fileDataSize) {
    throw new Error(`VPK entry file data is out of bounds: ${joinPath(dir, name, ext)}`);
  }

  const preload = bytes.slice(cursor, cursor + preloadBytes);
  cursor += preloadBytes;
  const dataOffset = dataStart + entryOffset;
  const archiveData = bytes.slice(dataOffset, dataOffset + entryLength);
  const fileBytes = new Uint8Array(preload.byteLength + archiveData.byteLength);
  fileBytes.set(preload, 0);
  fileBytes.set(archiveData, preload.byteLength);

  return {
    cursor,
    entry: {
      path: joinPath(dir, name, ext),
      crc,
      preloadBytes,
      archiveIndex,
      entryOffset,
      entryLength
    },
    file: {
      path: joinPath(dir, name, ext),
      bytes: fileBytes
    }
  };
}

export function parseVpk(input) {
  const bytes = toBytes(input);
  if (bytes.byteLength < HEADER_SIZE) {
    throw new Error("VPK file is too small");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = view.getUint32(0, true);
  if (magic !== VPK_MAGIC) {
    throw new Error("Invalid VPK magic");
  }

  const version = view.getUint32(4, true);
  if (version !== VPK_VERSION) {
    throw new Error(`Unsupported VPK version: ${version}`);
  }

  const treeSize = view.getUint32(8, true);
  const fileDataSize = view.getUint32(12, true);
  const treeStart = HEADER_SIZE;
  const treeEnd = treeStart + treeSize;
  const dataStart = treeEnd;
  const dataEnd = dataStart + fileDataSize;

  if (treeEnd > bytes.byteLength || dataEnd > bytes.byteLength) {
    throw new Error("Malformed VPK tree size or file data size");
  }

  const entries = [];
  const files = [];
  const seenPaths = new Map();
  let cursor = treeStart;

  while (cursor < treeEnd) {
    const extResult = readCString(bytes, cursor, treeEnd);
    cursor = extResult.next;
    const ext = extResult.value;
    if (ext === "") break;

    while (cursor < treeEnd) {
      const dirResult = readCString(bytes, cursor, treeEnd);
      cursor = dirResult.next;
      const dir = dirResult.value;
      if (dir === "") break;

      while (cursor < treeEnd) {
        const nameResult = readCString(bytes, cursor, treeEnd);
        cursor = nameResult.next;
        const name = nameResult.value;
        if (name === "") break;

        const result = readEntry(bytes, view, cursor, treeEnd, dataStart, fileDataSize, ext, dir, name);
        cursor = result.cursor;
        const entryPath = result.file.path;
        const normalized = normalizePath(entryPath);
        if (seenPaths.has(normalized)) {
          throw new Error(`Duplicate VPK path: ${entryPath}`);
        }
        seenPaths.set(normalized, entryPath);
        entries.push(result.entry);
        files.push(result.file);
      }
    }
  }

  return {
    entries,
    files,
    treeSize,
    fileDataSize
  };
}
