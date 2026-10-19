import { extractArchiveMember } from "./archiveExtractor.js";
import { toUint8Array } from "./bytes.js";
import { SHOWRANK_RELEASES, SHOWRANK_VPK_PATHS, TOPBAR_SOURCE, TOPBAR_VPK_PATHS } from "./gamebananaSources.js";
import { normalizeVpkPath } from "./rankMerge.js";
import { sha256Hex } from "./sha256.js";
import { parseVpk } from "./vpkReader.js";

const SHOWRANK_FILE_NAMES = Object.values(SHOWRANK_RELEASES).map((release) => release.fileName).join(" or ");

export function findPathProblems(files, expectedPaths) {
  const actual = new Set((files || []).map((file) => normalizeVpkPath(file.path)));
  const expected = new Set(expectedPaths.map(normalizeVpkPath));
  return {
    missing: [...expected].filter((path) => !actual.has(path)),
    unexpected: [...actual].filter((path) => !expected.has(path))
  };
}

async function readPinnedVpk(bytes, archiveName, release, label) {
  const vpkBytes = await extractArchiveMember(bytes, archiveName, release.archiveMember);
  const vpkSha256 = await sha256Hex(vpkBytes);
  if (vpkSha256 !== release.vpkSha256) throw new Error(`${label} contains a changed ${release.archiveMember}.`);
  const parsed = parseVpk(vpkBytes);
  return { parsed, vpkSha256 };
}

function assertExactInventory(files, expectedPaths, label) {
  const { missing, unexpected } = findPathProblems(files, expectedPaths);
  if (missing.length > 0 || unexpected.length > 0) {
    throw new Error(`${label} VPK files differ (missing: ${missing.join(", ") || "none"}; unexpected: ${unexpected.join(", ") || "none"}).`);
  }
}

export async function validateTopbarArchive(file, bytesInput) {
  const bytes = toUint8Array(bytesInput, "Archive input");
  const sha256 = await sha256Hex(bytes);
  if (bytes.byteLength !== TOPBAR_SOURCE.size || sha256 !== TOPBAR_SOURCE.sha256) {
    throw new Error(`This is not Top Bar Plus v5. Upload ${TOPBAR_SOURCE.fileName} from GameBanana.`);
  }
  const { parsed, vpkSha256 } = await readPinnedVpk(bytes, String(file?.name || TOPBAR_SOURCE.fileName), TOPBAR_SOURCE, "Top Bar Plus");
  assertExactInventory(parsed.files, TOPBAR_VPK_PATHS, "Top Bar Plus");
  return { sha256, vpkSha256, parsed };
}

export function detectShowrankEditionBySha256(sha256) {
  for (const [editionId, release] of Object.entries(SHOWRANK_RELEASES)) {
    if (release.sha256 === sha256) return editionId;
  }
  return "";
}

export async function validateShowrankArchive(file, bytesInput) {
  const bytes = toUint8Array(bytesInput, "Archive input");
  const sha256 = await sha256Hex(bytes);
  const editionId = detectShowrankEditionBySha256(sha256);
  if (!editionId || bytes.byteLength !== SHOWRANK_RELEASES[editionId].size) {
    throw new Error(`This is not ShowRank v1.0.0. Upload ${SHOWRANK_FILE_NAMES} from GameBanana.`);
  }
  const release = SHOWRANK_RELEASES[editionId];
  const { parsed, vpkSha256 } = await readPinnedVpk(bytes, String(file?.name || release.fileName), release, "ShowRank");
  assertExactInventory(parsed.files, SHOWRANK_VPK_PATHS, "ShowRank");
  return { editionId, sha256, vpkSha256, parsed };
}
