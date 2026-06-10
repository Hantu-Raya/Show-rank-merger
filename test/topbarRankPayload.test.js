import test from "node:test";
import assert from "node:assert/strict";

import { extractPanoramaLayoutSource, extractPanoramaStyleSource, extractTextResource } from "../src/source2ResourceReader.js";
import { buildTopbarRankPayload, SCOREBOARD_ONLY_CSS, SHOWRANK_VARIANTS, TOPBAR_RANK_REQUIRED_OUTPUT_PATHS } from "../src/topbarRankPayload.js";
import { normalizeVpkPath } from "../src/rankMerge.js";

function fileByPath(payload, path) {
  const normalized = normalizeVpkPath(path);
  return payload.files.find((file) => normalizeVpkPath(file.path) === normalized);
}

function assertRequiredPaths(payload) {
  const paths = new Set(payload.files.map((file) => normalizeVpkPath(file.path)));
  for (const path of TOPBAR_RANK_REQUIRED_OUTPUT_PATHS) {
    assert.equal(paths.has(normalizeVpkPath(path)), true, `${path} missing`);
  }
}

test("exports exactly four ShowRank variants", () => {
  assert.deepEqual(Object.keys(SHOWRANK_VARIANTS), [
    "showrank_normal",
    "showrank_scoreboard",
    "showrank_minify_ranks",
    "showrank_minify_ranks_scoreboard_only_topbar"
  ]);
});

function assertMinify(payload) {
  const bridge = extractTextResource(fileByPath(payload, "panorama/scripts/topbar_rank_rank_bridge.vjs_c").bytes);
  assert.match(bridge, /\/rank-predict\/image\?size=small/);
}

function assertScoreboard(payload) {
  const layout = extractPanoramaLayoutSource(fileByPath(payload, "panorama/layout/citadel_hud_top_bar.vxml_c").bytes);
  const css = extractPanoramaStyleSource(fileByPath(payload, "panorama/styles/topbar_rank_topbar.vcss_c").bytes);
  assert.match(layout, /TopbarRankTopBarScoreboardOnly/);
  assert.ok(css.includes(SCOREBOARD_ONLY_CSS));
}

function resourceVersion(bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(6, true);
}

test("compiled Panorama scripts use plaintext minified resources", async () => {
  const payload = await buildTopbarRankPayload("showrank_normal");
  const bridge = extractTextResource(fileByPath(payload, "panorama/scripts/topbar_rank_rank_bridge.vjs_c").bytes);
  assert.equal(resourceVersion(fileByPath(payload, "panorama/scripts/topbar_rank_rank_bridge.vjs_c").bytes), 4);
  assert.equal(resourceVersion(fileByPath(payload, "panorama/scripts/topbar_rank_hud.vjs_c").bytes), 4);
  assert.ok(bridge.length < payload.sourceTexts["panorama/scripts/topbar_rank_rank_bridge.js"].length);
});

test("compiled Panorama styles use CRC-prefixed DATA resources", async () => {
  const payload = await buildTopbarRankPayload("showrank_normal");
  const cssFile = fileByPath(payload, "panorama/styles/objectives_map.vcss_c");
  assert.equal(resourceVersion(cssFile.bytes), 0);
  assert.match(extractPanoramaStyleSource(cssFile.bytes), /TopbarRank|Objective|objectives/i);
});

test("showrank_normal keeps normal rank image suffix", async () => {
  const payload = await buildTopbarRankPayload("showrank_normal");
  const bridge = extractTextResource(fileByPath(payload, "panorama/scripts/topbar_rank_rank_bridge.vjs_c").bytes);
  assert.match(bridge, /\/rank-predict\/image\?format=webp/);
  assert.doesNotMatch(bridge, /\/rank-predict\/image\?size=small/);
  assertRequiredPaths(payload);
});

test("showrank_minify_ranks applies minify suffix", async () => {
  const payload = await buildTopbarRankPayload("showrank_minify_ranks");
  assertMinify(payload);
  assertRequiredPaths(payload);
});

test("showrank_scoreboard applies scoreboard-only topbar", async () => {
  const payload = await buildTopbarRankPayload("showrank_scoreboard");
  assertScoreboard(payload);
  assertRequiredPaths(payload);
});

test("combined variant applies minify and scoreboard patches", async () => {
  const payload = await buildTopbarRankPayload("showrank_minify_ranks_scoreboard_only_topbar");
  assertMinify(payload);
  assertScoreboard(payload);
  assertRequiredPaths(payload);
});
