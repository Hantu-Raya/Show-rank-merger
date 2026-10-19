import { compilePanoramaLayoutResource } from "./source2ResourceWriter.js";

export function normalizeVpkPath(path) {
  return String(path || "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .toLowerCase();
}

function indexByPath(files, label) {
  const index = new Map();
  for (const file of files || []) {
    const path = normalizeVpkPath(file.path);
    if (!path) continue;
    if (index.has(path)) throw new Error(`${label} has a duplicate path: ${path}`);
    index.set(path, new Uint8Array(file.bytes));
  }
  return index;
}

// Top Bar Plus and ShowRank resources are copied byte for byte. The two layouts both mods replace
// must be exactly the shared paths, and they come from the bundled merged layouts instead.
export function mergeReleaseFiles({ topbarFiles, showrankFiles, layouts }) {
  const topbar = indexByPath(topbarFiles, "Top Bar Plus");
  const showrank = indexByPath(showrankFiles, "ShowRank");
  const layoutPaths = Object.keys(layouts).map(normalizeVpkPath);
  const shared = [...showrank.keys()].filter((path) => topbar.has(path));

  const unexpected = shared.filter((path) => !layoutPaths.includes(path));
  if (unexpected.length > 0) throw new Error(`Both mods replace ${unexpected.join(", ")}; this pair is not supported.`);
  const unshared = layoutPaths.filter((path) => !shared.includes(path));
  if (unshared.length > 0) throw new Error(`Expected both mods to replace ${unshared.join(", ")}.`);

  const files = [];
  for (const [path, bytes] of topbar) {
    if (!layoutPaths.includes(path)) files.push({ path, bytes });
  }
  for (const [path, bytes] of showrank) {
    if (!layoutPaths.includes(path)) files.push({ path, bytes });
  }
  for (const [path, source] of Object.entries(layouts)) {
    files.push({ path: normalizeVpkPath(path), bytes: compilePanoramaLayoutResource(source) });
  }
  return { files, replacedPaths: layoutPaths };
}
