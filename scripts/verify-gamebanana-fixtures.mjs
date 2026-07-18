import assert from "node:assert/strict";

import { extractArchiveMember } from "../src/archiveExtractor.js";
import { buildMergedRankVpk } from "../src/buildMergedRankVpk.js";
import { SHOWRANK_REQUIRED_VPK_PATHS, SHOWRANK_SOURCES, TOPBAR_REQUIRED_VPK_PATHS, TOPBAR_SOURCE } from "../src/gamebananaSources.js";
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
  if (source.expectedVpkSha256) {
    assert.equal(await sha256Hex(vpkBytes), source.expectedVpkSha256, `${label} embedded VPK SHA-256 mismatch`);
  }
  const parsed = parseVpk(vpkBytes);
  const required = validateRequiredPaths(parsed.files, requiredPaths);
  assert.equal(required.ok, true, `${label} missing ${required.missing.join(", ")}`);
  console.log(`OK ${label}: ${parsed.files.length} VPK files`);
  return { bytes, parsed };
}

const topbar = await verifyArchive("Top Bar Plus v40c", TOPBAR_SOURCE, TOPBAR_REQUIRED_VPK_PATHS);
for (const [variantId, source] of Object.entries(SHOWRANK_SOURCES)) {
  const showrank = await verifyArchive(`ShowRank ${variantId}`, source, SHOWRANK_REQUIRED_VPK_PATHS);
  const merged = await buildMergedRankVpk({
    topbarArchiveBytes: topbar.bytes,
    showrankArchiveBytes: showrank.bytes
  });
  assert.equal(merged.variantId, variantId);
  assert.match(merged.filename, new RegExp(variantId));
  const expectedPatches = [];
  if (variantId.includes("minify_ranks")) expectedPatches.push("minify-ranks");
  if (variantId.includes("scoreboard_only_topbar")) expectedPatches.push("scoreboard-only-topbar");
  assert.deepEqual(merged.validation.payload.appliedPatches, expectedPatches);
  const parsed = parseVpk(merged.bytes);
  const paths = new Set(parsed.files.map((file) => normalizeVpkPath(file.path)));
  for (const path of TOPBAR_RANK_REQUIRED_OUTPUT_PATHS) {
    assert.equal(paths.has(normalizeVpkPath(path)), true, `${variantId} merged output missing ${path}`);
  }
  assert.equal(paths.has("panorama/scripts/topbar_rank_rank_bridge.vjs_c"), false);
  console.log(`OK merged ${variantId}: ${parsed.files.length} files`);
}
console.log("OK: GameBanana fixtures verified");
