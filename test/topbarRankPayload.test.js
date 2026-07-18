import test from "node:test";
import assert from "node:assert/strict";

import { extractPanoramaStyleSource, extractTextResource } from "../src/source2ResourceReader.js";
import { normalizeVpkPath } from "../src/rankMerge.js";
import { TOPBAR_RANK_SOURCE_TEXTS } from "../src/payload/topbarRankSources.generated.js";
import { buildTopbarRankPayload, TOPBAR_RANK_REQUIRED_OUTPUT_PATHS } from "../src/topbarRankPayload.js";
import { TOPBAR_RANK_SOURCE_PATHS } from "../src/topbarRankSourceManifest.js";

function fileByPath(payload, path) {
  const normalized = normalizeVpkPath(path);
  return payload.files.find((file) => normalizeVpkPath(file.path) === normalized);
}

function resourceVersion(bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(6, true);
}

const defaultPayload = buildTopbarRankPayload();

test("bundled payload contains exactly the current topbar_rank source manifest", () => {
  assert.deepEqual(Object.keys(TOPBAR_RANK_SOURCE_TEXTS), TOPBAR_RANK_SOURCE_PATHS);
  assert.equal(TOPBAR_RANK_SOURCE_PATHS.length, 19);
  assert.equal("panorama/scripts/topbar_rank_rank_bridge.js" in TOPBAR_RANK_SOURCE_TEXTS, false);
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
