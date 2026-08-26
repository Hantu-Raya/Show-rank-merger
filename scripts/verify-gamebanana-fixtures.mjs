import assert from "node:assert/strict";

import { buildMergedRankVpk } from "../src/buildMergedRankVpk.js";
import { SHOWRANK_RELEASES, TOPBAR_REQUIRED_VPK_PATHS, TOPBAR_SOURCE } from "../src/gamebananaSources.js";
import { normalizeVpkPath } from "../src/rankMerge.js";
import { sha256Hex } from "../src/sha256.js";
import { validateRequiredPaths, validateTopbarArchive } from "../src/sourceValidation.js";
import { TOPBAR_RANK_EDITIONS } from "../src/topbarRankSourceManifest.js";
import { TOPBAR_RANK_REQUIRED_OUTPUT_PATHS } from "../src/topbarRankPayload.js";
import { parseVpk } from "../src/vpkReader.js";

async function download(source) {
  const response = await fetch(source.downloadUrl, { redirect: "follow" });
  assert.equal(response.ok, true, `${source.downloadUrl} returned ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

async function verifyRelease(editionId, source) {
  console.log(`Downloading ShowRank Barebones ${editionId} (${source.fileId})`);
  const bytes = await download(source);
  assert.equal(bytes.byteLength, source.size, `ShowRank Barebones ${editionId} size mismatch`);
  assert.equal(await sha256Hex(bytes), source.sha256, `ShowRank Barebones ${editionId} SHA-256 mismatch`);
  return bytes;
}

console.log(`Downloading Top Bar Plus v40d (${TOPBAR_SOURCE.fileId})`);
const topbarBytes = await download(TOPBAR_SOURCE);
assert.equal(topbarBytes.byteLength, TOPBAR_SOURCE.expectedSize, "Top Bar Plus size mismatch");
assert.equal(await sha256Hex(topbarBytes), TOPBAR_SOURCE.expectedSha256, "Top Bar Plus SHA-256 mismatch");
const topbarValidation = await validateTopbarArchive(
  { name: TOPBAR_SOURCE.expectedFileName },
  topbarBytes
);
assert.equal(topbarValidation.vpkSha256, TOPBAR_SOURCE.expectedVpkSha256, "Top Bar Plus embedded VPK SHA-256 mismatch");
assert.deepEqual(validateRequiredPaths(topbarValidation.parsed.files, TOPBAR_REQUIRED_VPK_PATHS), { ok: true, missing: [] });
console.log(`OK Top Bar Plus v40d: ${topbarValidation.parsed.files.length} VPK files`);

for (const editionId of TOPBAR_RANK_EDITIONS) {
  await verifyRelease(editionId, SHOWRANK_RELEASES[editionId]);
  const merged = await buildMergedRankVpk({
    topbarArchiveBytes: topbarBytes,
    editionId,
    fetchLatestPayloadSource: false
  });
  assert.equal(merged.editionId, editionId);
  assert.equal(
    merged.filename,
    editionId === "alert" ? "topbar_rank_barebones_dir.vpk" : "topbar_rank_barebones_no_missing_dir.vpk"
  );
  const parsed = parseVpk(merged.bytes);
  const paths = new Set(parsed.files.map((file) => normalizeVpkPath(file.path)));
  for (const path of TOPBAR_RANK_REQUIRED_OUTPUT_PATHS) {
    assert.equal(paths.has(normalizeVpkPath(path)), true, `${editionId} merged output missing ${path}`);
  }
  assert.equal(paths.has("panorama/scripts/showrank_common.vjs_c"), false);
  assert.equal(paths.has("panorama/scripts/topbar_rank_v40_hud.vjs_c"), false);
  console.log(`OK merged ${editionId}: ${parsed.files.length} files`);
}

console.log("OK: GameBanana fixtures verified");
