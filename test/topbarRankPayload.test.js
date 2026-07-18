import test from "node:test";
import assert from "node:assert/strict";

import { extractPanoramaLayoutSource, extractPanoramaStyleSource, extractTextResource } from "../src/source2ResourceReader.js";
import { normalizeVpkPath } from "../src/rankMerge.js";
import { TOPBAR_RANK_SOURCE_TEXTS } from "../src/payload/topbarRankSources.generated.js";
import {
  buildTopbarRankPayload,
  SCOREBOARD_ONLY_CSS,
  SHOWRANK_VARIANTS,
  TOPBAR_RANK_REQUIRED_OUTPUT_PATHS
} from "../src/topbarRankPayload.js";
import { TOPBAR_RANK_SOURCE_PATHS } from "../src/topbarRankSourceManifest.js";

function fileByPath(payload, path) {
  const normalized = normalizeVpkPath(path);
  return payload.files.find((file) => normalizeVpkPath(file.path) === normalized);
}

function resourceVersion(bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(6, true);
}

const defaultPayload = buildTopbarRankPayload();
const variantPayloads = new Map([["showrank_normal", defaultPayload]]);

function payloadForVariant(variantId) {
  if (!variantPayloads.has(variantId)) {
    variantPayloads.set(variantId, buildTopbarRankPayload({ variantId }));
  }
  return variantPayloads.get(variantId);
}

test("bundled payload contains exactly the current topbar_rank source manifest", () => {
  assert.deepEqual(Object.keys(TOPBAR_RANK_SOURCE_TEXTS), TOPBAR_RANK_SOURCE_PATHS);
  assert.equal(TOPBAR_RANK_SOURCE_PATHS.length, 19);
  assert.equal("panorama/scripts/topbar_rank_rank_bridge.js" in TOPBAR_RANK_SOURCE_TEXTS, false);
});

test("exports exactly the four current ShowRank variants", () => {
  assert.deepEqual(Object.keys(SHOWRANK_VARIANTS), [
    "showrank_normal",
    "showrank_scoreboard_only_topbar",
    "showrank_minify_ranks",
    "showrank_minify_ranks_scoreboard_only_topbar"
  ]);
});

test("buildTopbarRankPayload compiles every current source without patches", async () => {
  const payload = await defaultPayload;
  assert.deepEqual(payload.appliedPatches, []);
  assert.equal(payload.files.length, TOPBAR_RANK_REQUIRED_OUTPUT_PATHS.length);
  assert.deepEqual(
    new Set(payload.files.map((file) => normalizeVpkPath(file.path))),
    new Set(TOPBAR_RANK_REQUIRED_OUTPUT_PATHS.map(normalizeVpkPath))
  );
  assert.equal(fileByPath(payload, "panorama/scripts/topbar_rank_rank_bridge.vjs_c"), undefined);
});

test("minify-ranks variants patch the rank image URL before Closure", async () => {
  const payload = await payloadForVariant("showrank_minify_ranks");
  assert.deepEqual(payload.appliedPatches, ["minify-ranks"]);
  const source = payload.sourceTexts["panorama/scripts/showrank_common.js"];
  assert.match(source, /rank-predict\/image\?size=small/);
  assert.doesNotMatch(source, /rank-predict\/image\?format=webp/);
  const compiled = extractTextResource(fileByPath(payload, "panorama/scripts/showrank_common.vjs_c").bytes);
  assert.match(compiled, /rank-predict\/image\?size=small/);
});

test("scoreboard-only variants patch the root class and rank visibility CSS", async () => {
  const payload = await payloadForVariant("showrank_scoreboard_only_topbar");
  assert.deepEqual(payload.appliedPatches, ["scoreboard-only-topbar"]);
  assert.match(payload.sourceTexts["panorama/layout/citadel_hud_top_bar.xml"], /class="ShowRankTopBarScoreboardOnly"/);
  assert.ok(payload.sourceTexts["panorama/styles/topbar_rank_topbar.css"].includes(SCOREBOARD_ONLY_CSS));
  const layout = extractPanoramaLayoutSource(fileByPath(payload, "panorama/layout/citadel_hud_top_bar.vxml_c").bytes);
  const css = extractPanoramaStyleSource(fileByPath(payload, "panorama/styles/topbar_rank_topbar.vcss_c").bytes);
  assert.match(layout, /ShowRankTopBarScoreboardOnly/);
  assert.match(css, /ShowRankTopBarScoreboardOnly/);
});

test("combined variant applies minify and scoreboard-only patches", async () => {
  const payload = await payloadForVariant("showrank_minify_ranks_scoreboard_only_topbar");
  assert.deepEqual(payload.appliedPatches, ["minify-ranks", "scoreboard-only-topbar"]);
  assert.match(payload.sourceTexts["panorama/scripts/showrank_common.js"], /rank-predict\/image\?size=small/);
  assert.match(payload.sourceTexts["panorama/layout/citadel_hud_top_bar.xml"], /ShowRankTopBarScoreboardOnly/);
});

test("unknown ShowRank variants fail closed", async () => {
  await assert.rejects(() => buildTopbarRankPayload({ variantId: "unknown" }), /Unknown ShowRank variant/);
});

test("canonical ShowRank source stays unchanged before Closure ADVANCED compilation", async () => {
  const payload = await defaultPayload;
  const source = TOPBAR_RANK_SOURCE_TEXTS["panorama/scripts/showrank_common.js"];
  const file = fileByPath(payload, "panorama/scripts/showrank_common.vjs_c");
  const compiled = extractTextResource(file.bytes);
  assert.equal(resourceVersion(file.bytes), 4);
  assert.equal(payload.sourceTexts["panorama/scripts/showrank_common.js"], source);
  assert.ok(compiled.length < source.length);
  for (const wrapper of ["ShowRankTriggerProfileCard", "ShowRankContextMenuOpenDeadlock", "ShowRankRegisterPlayerListRowReady"]) {
    assert.match(compiled, new RegExp(wrapper));
  }
});

test("Topbar and ShowRank scripts use Closure ADVANCED output", async () => {
  const payload = await defaultPayload;
  for (const [sourcePath, outputPath] of [
    ["panorama/scripts/showrank_common.js", "panorama/scripts/showrank_common.vjs_c"],
    ["panorama/scripts/topbar_rank_v40_hud.js", "panorama/scripts/topbar_rank_v40_hud.vjs_c"],
    ["panorama/scripts/recent_purchases_redux.js", "panorama/scripts/recent_purchases_redux.vjs_c"]
  ]) {
    const compiled = extractTextResource(fileByPath(payload, outputPath).bytes);
    assert.ok(compiled.length < TOPBAR_RANK_SOURCE_TEXTS[sourcePath].length, `${sourcePath} was not reduced`);
  }
});

test("Closure preserves the Recent Purchase MOD_ICONS global", async () => {
  const payload = await defaultPayload;
  const compiled = extractTextResource(fileByPath(payload, "panorama/scripts/recent_purchases_redux_data.vjs_c").bytes);
  assert.match(compiled, /MOD_ICONS/);
});

test("compiled Panorama styles use CRC-prefixed DATA resources", async () => {
  const payload = await defaultPayload;
  const cssFile = fileByPath(payload, "panorama/styles/topbar_rank_escape_menu.vcss_c");
  assert.equal(resourceVersion(cssFile.bytes), 0);
  assert.match(extractPanoramaStyleSource(cssFile.bytes), /ShowRank|Escape|Players/i);
});

test("payload rejects the removed Topbar rank bridge", async () => {
  const sourceTexts = {
    ...TOPBAR_RANK_SOURCE_TEXTS,
    "panorama/scripts/topbar_rank_rank_bridge.js": "obsolete"
  };
  await assert.rejects(() => buildTopbarRankPayload({ sourceTexts }), /removed topbar_rank_rank_bridge/);
});
