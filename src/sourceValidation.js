import { extractArchiveMember } from "./archiveExtractor.js";
import { toUint8Array } from "./bytes.js";
import {
  SHOWRANK_REQUIRED_VPK_PATHS,
  SHOWRANK_SOURCES,
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

async function extractTopbarVpk(bytes, archiveName) {
  const vpkBytes = await extractArchiveMember(bytes, archiveName, TOPBAR_SOURCE.archiveMember);
  const vpkSha256 = await sha256Hex(vpkBytes);
  assertSha256(vpkSha256, TOPBAR_SOURCE.expectedVpkSha256, "Top Bar Plus embedded VPK");
  return { vpkBytes, archiveMember: TOPBAR_SOURCE.archiveMember, vpkSha256 };
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
  const { vpkBytes, archiveMember, vpkSha256 } = await extractTopbarVpk(bytes, displayName(file));
  const parsed = parseVpk(vpkBytes);
  const { missing } = validateRequiredPaths(parsed.files, TOPBAR_REQUIRED_VPK_PATHS);
  if (missing.length > 0) {
    throw new Error(`Top Bar Plus VPK missing required paths: ${missing.join(", ")}`);
  }
  return { sha256, parsed, missing, archiveMember, vpkSha256 };
}

export function detectShowrankVariantBySha256(sha256) {
  for (const [variantId, source] of Object.entries(SHOWRANK_SOURCES)) {
    if (source.expectedSha256 === sha256) return variantId;
  }
  return "";
}

export async function validateShowrankArchive(file, bytesInput, expectedVariantId = "") {
  const bytes = toUint8Array(bytesInput, "Archive input");
  const sha256 = await sha256Hex(bytes);
  const variantId = detectShowrankVariantBySha256(sha256);
  if (!variantId) {
    throw new Error(`ShowRank archive SHA-256 is not one of the supported Barebones editions: ${sha256}`);
  }
  if (expectedVariantId && variantId !== expectedVariantId) {
    throw new Error(`ShowRank archive edition mismatch: expected ${expectedVariantId}, got ${variantId}`);
  }

  const source = SHOWRANK_SOURCES[variantId];
  assertSize(bytes, source.expectedSize, "ShowRank archive");
  const vpkBytes = await extractArchiveMember(bytes, displayName(file), source.archiveMember);
  const vpkSha256 = await sha256Hex(vpkBytes);
  assertSha256(vpkSha256, source.expectedVpkSha256, "ShowRank embedded VPK");
  const parsed = parseVpk(vpkBytes);
  const { missing } = validateRequiredPaths(parsed.files, SHOWRANK_REQUIRED_VPK_PATHS);
  if (missing.length > 0) {
    throw new Error(`ShowRank VPK missing required paths: ${missing.join(", ")}`);
  }
  return { variantId, sha256, parsed, missing, archiveMember: source.archiveMember, vpkSha256 };
}

