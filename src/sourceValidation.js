import { extractArchiveMember } from "./archiveExtractor.js";
import { toUint8Array } from "./bytes.js";
import {
  SHOWRANK_RELEASES,
  SHOWRANK_REQUIRED_VPK_PATHS,
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

export function detectShowrankEditionBySha256(sha256) {
  for (const [editionId, source] of Object.entries(SHOWRANK_RELEASES)) {
    if (source.sha256 === sha256) return editionId;
  }
  return "";
}

export async function validateShowrankArchive(file, bytesInput, expectedEditionId = "") {
  const bytes = toUint8Array(bytesInput, "Archive input");
  const sha256 = await sha256Hex(bytes);
  const editionId = detectShowrankEditionBySha256(sha256);
  if (!editionId) {
    throw new Error(`ShowRank archive SHA-256 is not a supported 8/27 edition: ${sha256}`);
  }
  if (expectedEditionId && editionId !== expectedEditionId) {
    throw new Error(`ShowRank archive edition mismatch: expected ${expectedEditionId}, got ${editionId}`);
  }

  const source = SHOWRANK_RELEASES[editionId];
  assertSize(bytes, source.size, "ShowRank archive");
  const vpkBytes = await extractArchiveMember(bytes, displayName(file), source.archiveMember);
  const vpkSha256 = await sha256Hex(vpkBytes);
  assertSha256(vpkSha256, source.vpkSha256, "ShowRank embedded VPK");
  const parsed = parseVpk(vpkBytes);
  const { missing } = validateRequiredPaths(parsed.files, SHOWRANK_REQUIRED_VPK_PATHS);
  if (missing.length > 0) {
    throw new Error(`ShowRank VPK missing required paths: ${missing.join(", ")}`);
  }
  return { editionId, sha256, parsed, missing, archiveMember: source.archiveMember, vpkSha256 };
}
