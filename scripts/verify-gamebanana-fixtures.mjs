import assert from "node:assert/strict";

import { extractArchiveMember } from "../src/archiveExtractor.js";
import { buildMergedRankVpk } from "../src/buildMergedRankVpk.js";
import {
  SHOWRANK_REQUIRED_VPK_PATHS,
  SHOWRANK_SOURCES,
  TOPBAR_REQUIRED_VPK_PATHS,
  TOPBAR_SOURCE
} from "../src/gamebananaSources.js";
import { normalizeVpkPath } from "../src/rankMerge.js";
import { sha256Hex } from "../src/sha256.js";
import { validateRequiredPaths } from "../src/sourceValidation.js";
import { TOPBAR_RANK_REQUIRED_OUTPUT_PATHS } from "../src/topbarRankPayload.js";
import { parseVpk } from "../src/vpkReader.js";

async function download(source) {
  const response = await fetch(source.downloadUrl, { redirect: "follow" });
  assert.equal(response.ok, true, `${source.downloadUrl} returned ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

async function verifyArchive(label, source, requiredPaths) {
  console.log(`Downloading ${label} (${source.fileId})`);
  const bytes = await download(source);
  assert.equal(bytes.byteLength, source.expectedSize, `${label} size mismatch`);
  assert.equal(await sha256Hex(bytes), source.expectedSha256, `${label} SHA-256 mismatch`);
  const vpkBytes = await extractArchiveMember(bytes, source.expectedFileName, source.archiveMember);
  const parsed = parseVpk(vpkBytes);
  const required = validateRequiredPaths(parsed.files, requiredPaths);
  assert.equal(required.ok, true, `${label} missing ${required.missing.join(", ")}`);
  console.log(`OK ${label}: ${parsed.files.length} VPK files`);
  return { bytes, parsed };
}

const topbar = await verifyArchive("Top Bar Plus v34d", TOPBAR_SOURCE, TOPBAR_REQUIRED_VPK_PATHS);
const showranks = new Map();

for (const [variantId, source] of Object.entries(SHOWRANK_SOURCES)) {
  const verified = await verifyArchive(variantId, source, SHOWRANK_REQUIRED_VPK_PATHS);
  showranks.set(variantId, verified);
}

for (const [variantId, verified] of showranks) {
  const merged = await buildMergedRankVpk({
    topbarArchiveBytes: topbar.bytes,
    showrankArchiveBytes: verified.bytes
  });
  assert.equal(merged.variantId, variantId);
  const parsed = parseVpk(merged.bytes);
  const paths = new Set(parsed.files.map((file) => normalizeVpkPath(file.path)));
  for (const path of [
    "panorama/scripts/topbar_rank_rank_bridge.vjs_c",
    "panorama/scripts/topbar_rank_hud.vjs_c",
    ...TOPBAR_RANK_REQUIRED_OUTPUT_PATHS
  ]) {
    assert.equal(paths.has(normalizeVpkPath(path)), true, `${variantId} merged output missing ${path}`);
  }
  console.log(`OK merged ${variantId}: ${parsed.files.length} files`);
}

console.log("OK: GameBanana fixtures verified");
