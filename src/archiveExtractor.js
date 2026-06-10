import { toUint8Array } from "./bytes.js";

function archiveFsName(archiveName) {
  const clean = String(archiveName || "archive.7z").replace(/[\\/:*?"<>|]+/g, "_");
  if (clean.toLowerCase().endsWith(".zip") || clean.toLowerCase().endsWith(".7z")) return clean;
  return `${clean}.7z`;
}

function sevenZipOptions() {
  if (typeof window === "undefined") return undefined;
  const baseUrl = typeof import.meta.env?.BASE_URL === "string" ? import.meta.env.BASE_URL : "/";
  return {
    locateFile(path) {
      return path.endsWith(".wasm") ? `${baseUrl.replace(/\/?$/, "/")}7zz.wasm` : path;
    }
  };
}

export async function extractArchiveMember(archiveBytes, archiveName, memberName) {
  const { default: SevenZip } = await import("7z-wasm");
  const sevenZip = await SevenZip(sevenZipOptions());
  const safeArchiveName = archiveFsName(archiveName);
  sevenZip.FS.writeFile(safeArchiveName, toUint8Array(archiveBytes, "Archive input"));

  const result = sevenZip.callMain(["x", "-y", safeArchiveName, memberName]);
  if (typeof result === "number" && result !== 0) {
    throw new Error(`Could not extract ${memberName}`);
  }

  try {
    return sevenZip.FS.readFile(memberName);
  } catch {
    throw new Error(`Archive member not found: ${memberName}`);
  }
}
