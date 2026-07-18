import { extractArchiveMember } from "./archiveExtractor.js";
import { toUint8Array } from "./bytes.js";
import {
  TOPBAR_REQUIRED_VPK_PATHS,
  TOPBAR_SOURCE
} from "./gamebananaSources.js";
import { normalizeVpkPath } from "./rankMerge.js";
import { sha256Hex } from "./sha256.js";
import { parseVpk } from "./vpkReader.js";


function displayName(file) {
  return String(file?.name || "archive");
}

function assertSize(bytes, expectedSize, label) {
  if (bytes.byteLength !== expectedSize) {
    throw new Error(`${label} size mismatch: expected ${expectedSize} bytes, got ${bytes.byteLength}`);
  }
}

function assertSha256(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} SHA-256 mismatch: expected ${expected}, got ${actual}`);
  }
}

async function extractCompatibleTopbarVpk(bytes, archiveName) {
  let lastError = null;
  for (const memberName of TOPBAR_SOURCE.compatibleArchiveMembers || [TOPBAR_SOURCE.archiveMember]) {
    try {
      const vpkBytes = await extractArchiveMember(bytes, archiveName, memberName);
      const vpkSha256 = await sha256Hex(vpkBytes);
      if (vpkSha256 !== TOPBAR_SOURCE.expectedVpkSha256) {
        throw new Error(`Top Bar Plus embedded VPK SHA-256 mismatch in ${memberName}: expected ${TOPBAR_SOURCE.expectedVpkSha256}, got ${vpkSha256}`);
      }
      return { vpkBytes, archiveMember: memberName, vpkSha256 };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Top Bar Plus archive does not contain a supported VPK member");
}

function assertExactTopbarArchive(bytes, sha256) {
  if (bytes.byteLength === TOPBAR_SOURCE.expectedSize && sha256 === TOPBAR_SOURCE.expectedSha256) return;
  if (TOPBAR_SOURCE.expectedVpkSha256) return;
  assertSize(bytes, TOPBAR_SOURCE.expectedSize, "Top Bar Plus archive");
  assertSha256(sha256, TOPBAR_SOURCE.expectedSha256, "Top Bar Plus archive");
}

export function validateRequiredPaths(files, requiredPaths) {
  const paths = new Set((files || []).map((file) => normalizeVpkPath(file.path)));
  const missing = (requiredPaths || []).filter((path) => !paths.has(normalizeVpkPath(path)));
  return { ok: missing.length === 0, missing };
}

export async function validateTopbarArchive(file, bytesInput) {
  const bytes = toUint8Array(bytesInput, "Archive input");
  const sha256 = await sha256Hex(bytes);
  assertExactTopbarArchive(bytes, sha256);
  const { vpkBytes, archiveMember, vpkSha256 } = await extractCompatibleTopbarVpk(bytes, displayName(file));
  const parsed = parseVpk(vpkBytes);
  const { missing } = validateRequiredPaths(parsed.files, TOPBAR_REQUIRED_VPK_PATHS);
  if (missing.length > 0) {
    throw new Error(`Top Bar Plus VPK missing required paths: ${missing.join(", ")}`);
  }
  return { sha256, parsed, missing, archiveMember, vpkSha256 };
}

