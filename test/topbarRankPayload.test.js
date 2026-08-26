import test from "node:test";
import assert from "node:assert/strict";

import { extractPanoramaLayoutSource, extractPanoramaStyleSource, extractTextResource } from "../src/source2ResourceReader.js";
import { normalizeVpkPath } from "../src/rankMerge.js";
import { TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION } from "../src/payload/topbarRankSources.generated.js";
import {
  buildTopbarRankPayload,
  TOPBAR_RANK_REQUIRED_OUTPUT_PATHS
} from "../src/topbarRankPayload.js";
import { TOPBAR_RANK_DEFAULT_EDITION, TOPBAR_RANK_EDITIONS, TOPBAR_RANK_SOURCE_PATHS } from "../src/topbarRankSourceManifest.js";

function fileByPath(payload, path) {
  const normalized = normalizeVpkPath(path);
  return payload.files.find((file) => normalizeVpkPath(file.path) === normalized);
}

function resourceVersion(bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(6, true);
}

const payloads = new Map();

function payloadForEdition(editionId) {
  if (!payloads.has(editionId)) {
    payloads.set(editionId, buildTopbarRankPayload({ editionId }));
  }
  return payloads.get(editionId);
}

test("bundled payload contains both current 23-asset Topbar Rank editions", () => {
  assert.deepEqual(TOPBAR_RANK_EDITIONS, ["alert", "no_missing"]);
  assert.equal(TOPBAR_RANK_DEFAULT_EDITION, "alert");
  assert.deepEqual(Object.keys(TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION), TOPBAR_RANK_EDITIONS);
  assert.equal(TOPBAR_RANK_SOURCE_PATHS.length, 23);

  for (const editionId of TOPBAR_RANK_EDITIONS) {
    const sourceTexts = TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION[editionId];
    assert.deepEqual(Object.keys(sourceTexts), TOPBAR_RANK_SOURCE_PATHS);
    assert.equal(Object.keys(sourceTexts).length, 23);
    assert.ok(sourceTexts["panorama/scripts/showrank_barebones.js"]);
    assert.equal("panorama/scripts/showrank_common.js" in sourceTexts, false);
    assert.equal("panorama/scripts/topbar_rank_rank_bridge.js" in sourceTexts, false);
  }
});

test("bundled editions use the canonical standalone rank runtime and retain their alert distinction", () => {
  for (const editionId of TOPBAR_RANK_EDITIONS) {
    const barebones = TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION[editionId]["panorama/scripts/showrank_barebones.js"];
    assert.match(barebones, /\/rank\/image\?/);
    assert.doesNotMatch(barebones, /\/rank-predict\/image/);
  }

  assert.match(TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION.alert["panorama/scripts/showrank_barebones.js"], /MISSING_WINDOW_END_SECONDS/);
  assert.doesNotMatch(TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION.no_missing["panorama/scripts/showrank_barebones.js"], /MISSING_WINDOW_END_SECONDS/);
  assert.notEqual(
    TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION.alert["panorama/layout/citadel_hud_top_bar_player.xml"],
    TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION.no_missing["panorama/layout/citadel_hud_top_bar_player.xml"]
  );
});

test("buildTopbarRankPayload compiles each edition under the shared contract", async () => {
  for (const editionId of TOPBAR_RANK_EDITIONS) {
    const payload = await payloadForEdition(editionId);
    assert.equal(payload.editionId, editionId);
    assert.deepEqual(payload.sourceTexts, TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION[editionId]);
    assert.equal(payload.closure.compilationLevel, "ADVANCED");
    assert.equal(payload.closure.inputLanguage, "ECMASCRIPT_2020");
    assert.equal(payload.closure.outputLanguage, "ECMASCRIPT5");
    assert.deepEqual(
      Object.keys(payload.closure.scripts),
      TOPBAR_RANK_SOURCE_PATHS.filter((path) => path.endsWith(".js"))
    );
    assert.ok(payload.closure.outputBytes < payload.closure.sourceBytes);
    assert.equal(payload.files.length, TOPBAR_RANK_REQUIRED_OUTPUT_PATHS.length);
    assert.deepEqual(
      new Set(payload.files.map((file) => normalizeVpkPath(file.path))),
      new Set(TOPBAR_RANK_REQUIRED_OUTPUT_PATHS.map(normalizeVpkPath))
    );
  }
});

test("unknown Topbar Rank editions fail closed", async () => {
  await assert.rejects(() => buildTopbarRankPayload({ editionId: "unknown" }), /Unknown Topbar Rank edition/);
});

test("edition selection rejects the other edition's runtime", async () => {
  await assert.rejects(
    () => buildTopbarRankPayload({
      editionId: "no_missing",
      sourceTexts: TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION.alert
    }),
    /forbidden token: ShowRankBarebonesMissingWindowExpired/
  );
});

test("Closure ADVANCED reduces every script and preserves public globals", async () => {
  for (const editionId of TOPBAR_RANK_EDITIONS) {
    const payload = await payloadForEdition(editionId);
    const source = payload.sourceTexts["panorama/scripts/showrank_barebones.js"];
    const compiledFile = fileByPath(payload, "panorama/scripts/showrank_barebones.vjs_c");
    const compiled = extractTextResource(compiledFile.bytes);

    assert.equal(resourceVersion(compiledFile.bytes), 4);
    assert.ok(compiled.length < source.length, `${editionId} barebones runtime was not reduced`);
    assert.match(compiled, /\/rank\/image\?/);
    assert.doesNotMatch(compiled, /\/rank-predict\/image/);
    const publicApis = [
      "ShowRankBarebonesRefresh",
      "ShowRankBarebonesOpenStatlocker",
      "ShowRankBarebonesOpenPlayerProfile",
      "ShowRankBarebonesCopyAccount",
      "ShowRankBarebonesEscapeOpen",
      "ShowRankBarebonesEscapeOut"
    ];
    if (editionId === "alert") publicApis.push("ShowRankBarebonesMissingWindowExpired");
    for (const api of publicApis) {
      assert.match(compiled, new RegExp(api));
    }
  }
});

test("non-Barebones JavaScript is minified and retains data globals", async () => {
  const payload = await payloadForEdition("alert");
  for (const sourcePath of TOPBAR_RANK_SOURCE_PATHS.filter((path) => path.endsWith(".js") && path !== "panorama/scripts/showrank_barebones.js")) {
    const outputPath = sourcePath.replace(/\.js$/, ".vjs_c");
    const compiled = extractTextResource(fileByPath(payload, outputPath).bytes);
    assert.ok(compiled.length < payload.sourceTexts[sourcePath].length, `${sourcePath} was not reduced`);
  }
  const data = extractTextResource(fileByPath(payload, "panorama/scripts/recent_purchases_redux_data.vjs_c").bytes);
  assert.match(data, /MOD_ICONS/);
  assert.match(data, /HERO_IMAGES/);
});

test("compiled Panorama layouts and styles preserve Barebones resources", async () => {
  const payload = await payloadForEdition("alert");
  const layout = extractPanoramaLayoutSource(fileByPath(payload, "panorama/layout/profile_card.vxml_c").bytes);
  const profilePageLayout = extractPanoramaLayoutSource(fileByPath(payload, "panorama/layout/citadel_db_page_profile.vxml_c").bytes);
  const cssFile = fileByPath(payload, "panorama/styles/showrank_barebones_topbar.vcss_c");
  const css = extractPanoramaStyleSource(cssFile.bytes);

  assert.match(layout, /showrank_barebones\.vjs_c/);
  assert.match(layout, /ShowRankBarebonesRankImage/);
  assert.match(profilePageLayout, /ProfileStatsCommunityButton/);
  assert.match(profilePageLayout, /ProfileStatsCommunityPanel/);
  assert.equal(resourceVersion(cssFile.bytes), 0);
  assert.match(css, /ShowRankBarebones/);
});

test("payload rejects legacy ShowRank source and bridge files", async () => {
  for (const legacyPath of [
    "panorama/scripts/showrank_common.js",
    "panorama/scripts/topbar_rank_rank_bridge.js"
  ]) {
    await assert.rejects(
      () => buildTopbarRankPayload({
        sourceTexts: { ...TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION.alert, [legacyPath]: "obsolete" }
      }),
      /contains removed/
    );
  }
});

test("no-missing rejects missing-enemy markers in runtime, XML, and CSS", async () => {
  const cases = [
    ["panorama/scripts/showrank_barebones.js", "missingWindow"],
    ["panorama/layout/citadel_hud_top_bar_player.xml", "MISSING"],
    ["panorama/styles/showrank_barebones_topbar.css", "ShowRankBarebonesMissing"]
  ];
  for (const [path, marker] of cases) {
    await assert.rejects(
      () => buildTopbarRankPayload({
        editionId: "no_missing",
        sourceTexts: { ...TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION.no_missing, [path]: `${TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION.no_missing[path]}\n${marker}` }
      }),
      /forbidden no-missing marker/
    );
  }
});

test("bundled source maps contain no unresolved composition seams", () => {
  for (const sourceTexts of Object.values(TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION)) {
    for (const text of Object.values(sourceTexts)) {
      assert.doesNotMatch(text, /PROFILE_STATS_COMMUNITY_RUNTIME|PROFILE_STATS_COMMUNITY_STYLES|VIEWED_PROFILE_IDENTITY_POLICY/);
    }
  }
});
