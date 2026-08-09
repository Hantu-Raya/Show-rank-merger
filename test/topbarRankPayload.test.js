import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";
import { extractPanoramaLayoutSource, extractPanoramaStyleSource, extractTextResource } from "../src/source2ResourceReader.js";
import { normalizeVpkPath } from "../src/rankMerge.js";
import {
  TOPBAR_RANK_NO_MISSING_SOURCE_OVERRIDES,
  TOPBAR_RANK_SOURCE_TEXTS
} from "../src/payload/topbarRankSources.generated.js";
import { buildTopbarRankPayload, TOPBAR_RANK_REQUIRED_OUTPUT_PATHS } from "../src/topbarRankPayload.js";
import { TOPBAR_RANK_SOURCE_BASE_URLS, TOPBAR_RANK_SOURCE_PATHS } from "../src/topbarRankSourceManifest.js";

const EDITION_IDS = ["showrank_barebones", "showrank_barebones_no_missing"];
const ALERT_MARKERS = ["ShowRankBarebonesMissing", "ShowRankBarebonesNotification", "MISSING_WINDOW", "ENEMY MISSING"];

function fileByPath(payload, path) {
  const normalized = normalizeVpkPath(path);
  return payload.files.find((file) => normalizeVpkPath(file.path) === normalized);
}

function resourceVersion(bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(6, true);
}

function resourceTag(bytes) {
  return new TextDecoder().decode(bytes.subarray(16, 20));
}

function sourceTextForResource(payload, sourcePath) {
  const outputPath = sourcePath.replace(/\.(xml|js|css)$/, (_, extension) => ({ xml: ".vxml_c", js: ".vjs_c", css: ".vcss_c" })[extension]);
  const file = fileByPath(payload, outputPath);
  assert.ok(file, `missing generated resource for ${sourcePath}`);
  if (sourcePath.endsWith(".js")) return extractTextResource(file.bytes);
  if (sourcePath.endsWith(".xml")) return extractPanoramaLayoutSource(file.bytes);
  return extractPanoramaStyleSource(file.bytes);
}

test("source manifest defines exactly the two Barebones editions and 23 resources", () => {
  assert.deepEqual(Object.keys(TOPBAR_RANK_SOURCE_BASE_URLS), EDITION_IDS);
  assert.equal(TOPBAR_RANK_SOURCE_PATHS.length, 23);
  assert.deepEqual(new Set(Object.keys(TOPBAR_RANK_SOURCE_TEXTS)), new Set(TOPBAR_RANK_SOURCE_PATHS));
  assert.equal(Object.keys(TOPBAR_RANK_NO_MISSING_SOURCE_OVERRIDES).length, 5);
  assert.equal(
    Object.keys(TOPBAR_RANK_NO_MISSING_SOURCE_OVERRIDES).every((path) => TOPBAR_RANK_SOURCE_PATHS.includes(path)),
    true
  );
});

test("each edition produces exactly the 23 declared binary resources", async () => {
  for (const expectedVariantId of EDITION_IDS) {
    const payload = await buildTopbarRankPayload({ expectedVariantId });
    assert.deepEqual(new Set(Object.keys(payload.sourceTexts)), new Set(TOPBAR_RANK_SOURCE_PATHS));
    assert.equal(payload.files.length, 23);
    assert.deepEqual(
      new Set(payload.files.map((file) => normalizeVpkPath(file.path))),
      new Set(TOPBAR_RANK_REQUIRED_OUTPUT_PATHS.map(normalizeVpkPath))
    );
    for (const file of payload.files) {
      assert.ok(file.bytes instanceof Uint8Array, `${file.path} is not binary data`);
      assert.ok(file.bytes.byteLength > 32, `${file.path} is unexpectedly empty`);
      assert.equal(resourceTag(file.bytes), "DATA", `${file.path} has no DATA resource block`);
    }
  }
});

test("bundled source texts exactly match both local Topbar Rank source trees", async (context) => {
  const sourceRoots = {
    showrank_barebones: "../../topbar_rank/",
    showrank_barebones_no_missing: "../../topbar_rank_no_missing/"
  };
  if (!existsSync(new URL(`${sourceRoots.showrank_barebones}${TOPBAR_RANK_SOURCE_PATHS[0]}`, import.meta.url))) {
    context.skip("sibling Topbar Rank source trees are unavailable");
    return;
  }

  for (const [editionId, sourceRoot] of Object.entries(sourceRoots)) {
    const payload = await buildTopbarRankPayload({ expectedVariantId: editionId });
    for (const sourcePath of TOPBAR_RANK_SOURCE_PATHS) {
      const expected = await readFile(new URL(`${sourceRoot}${sourcePath}`, import.meta.url), "utf8");
      assert.equal(payload.sourceTexts[sourcePath], expected, `${editionId} bundled ${sourcePath} is stale`);
    }
  }
});

test("Closure ADVANCED minifies every JavaScript resource and preserves public interfaces", async () => {
  const javascriptPaths = TOPBAR_RANK_SOURCE_PATHS.filter((path) => path.endsWith(".js"));
  for (const expectedVariantId of EDITION_IDS) {
    const payload = await buildTopbarRankPayload({ expectedVariantId });
    const requiredBarebonesApis = [
      "ShowRankBarebonesRefresh",
      "ShowRankBarebonesOpenStatlocker",
      "ShowRankBarebonesCopyAccount",
      "ShowRankBarebonesEscapeOpen",
      "ShowRankBarebonesEscapeOut"
    ];

    assert.deepEqual(Object.keys(payload.closureMetadata.scripts), javascriptPaths);
    for (const sourcePath of javascriptPaths) {
      const compiled = sourceTextForResource(payload, sourcePath);
      const source = payload.sourceTexts[sourcePath];
      const metadata = payload.closureMetadata.scripts[sourcePath];
      assert.equal(resourceVersion(fileByPath(payload, sourcePath.replace(/\.js$/, ".vjs_c")).bytes), 4);
      assert.notEqual(compiled, source, `${sourcePath} was not transformed`);
      assert.ok(metadata.outputBytes < metadata.sourceBytes, `${sourcePath} was not reduced`);
      assert.equal(new TextEncoder().encode(compiled).byteLength, metadata.outputBytes);
      assert.doesNotThrow(() => new Function(compiled), `${sourcePath} is not valid JavaScript`);
    }

    const barebones = sourceTextForResource(payload, "panorama/scripts/showrank_barebones.js");
    for (const api of requiredBarebonesApis) {
      assert.ok(barebones.includes(api), `${expectedVariantId} lost ${api}`);
    }
    if (expectedVariantId === "showrank_barebones") {
      assert.ok(barebones.includes("ShowRankBarebonesMissingWindowExpired"));
    }
    const purchaseData = sourceTextForResource(payload, "panorama/scripts/recent_purchases_redux_data.js");
    assert.ok(purchaseData.includes("MOD_ICONS"), `${expectedVariantId} lost MOD_ICONS`);
    assert.ok(purchaseData.includes("HERO_IMAGES"), `${expectedVariantId} lost HERO_IMAGES`);
    assert.ok(purchaseData.includes("A Bocajarro"), `${expectedVariantId} lost quoted item keys`);
    assert.ok(
      sourceTextForResource(payload, "panorama/scripts/recent_purchases_redux.js").includes("MOD_ICONS"),
      `${expectedVariantId} lost the MOD_ICONS consumer`
    );
    assert.equal(payload.closureMetadata.compilationLevel, "ADVANCED");
    assert.equal(payload.closureMetadata.inputLanguage, "ECMASCRIPT_2020");
    assert.equal(payload.closureMetadata.outputLanguage, "ECMASCRIPT5");
    assert.equal(payload.closureMetadata.outputBytes < payload.closureMetadata.sourceBytes, true);
    assert.match(payload.closureMetadata.externs, /^var \$;/m);
  }
});

test("generated resources retain required native, TopBarPlus, and Barebones integration markers", async () => {
  const payload = await buildTopbarRankPayload({ expectedVariantId: "showrank_barebones" });
  const requiredMarkers = {
    "panorama/layout/citadel_hud_top_bar.xml": ["rejuvnbufftimer.vjs_c", "urntracker.vjs_c", "ShowRankBarebonesTeamAverageLayer"],
    "panorama/layout/citadel_hud_top_bar_player.xml": ["unspent.vjs_c", "showrank_barebones.vjs_c", "ShowRankBarebonesTopbarRankImage"],
    "panorama/layout/citadel_hud_hero_shop.xml": ["recent_purchases_redux_data.vjs_c", "recent_purchases_redux.vjs_c"],
    "panorama/layout/hud_escape_menu.xml": ["CitadelResumePlaying()", "showrank_barebones.vjs_c"],
    "panorama/layout/players_list_entry.xml": ["ShowRankBarebonesPlayerListRankImage"],
    "panorama/layout/profile_card.xml": ["ShowRankBarebonesRankImage"],
    "panorama/layout/citadel_db_page_profile.xml": ["ShowRankBarebonesProfilePageRankImage", "showrank_barebones.vjs_c"],
    "panorama/scripts/showrank_barebones.js": ["ShowRankBarebonesEscapeOpen", "ShowRankBarebonesOpenStatlocker"],
    "panorama/scripts/recent_purchases_redux_data.js": ["MOD_ICONS"]
  };

  for (const [sourcePath, markers] of Object.entries(requiredMarkers)) {
    const text = sourceTextForResource(payload, sourcePath);
    for (const marker of markers) assert.ok(text.includes(marker), `${sourcePath} lost ${marker}`);
  }
});

test("alert and no-missing editions keep their behavior separate", async () => {
  const alertPayload = await buildTopbarRankPayload({ expectedVariantId: "showrank_barebones" });
  const noMissingPayload = await buildTopbarRankPayload({ expectedVariantId: "showrank_barebones_no_missing" });
  const alertSource = Object.values(alertPayload.sourceTexts).join("\n");
  const noMissingSource = Object.values(noMissingPayload.sourceTexts).join("\n");

  for (const marker of ALERT_MARKERS) {
    assert.ok(alertSource.includes(marker), `alert edition lost ${marker}`);
    assert.equal(noMissingSource.includes(marker), false, `no-missing edition retained ${marker}`);
  }
  const noMissingCss = sourceTextForResource(noMissingPayload, "panorama/styles/showrank_barebones_topbar.css");
  assert.match(
    noMissingCss,
    /CitadelHudTopBarPlayer\.ShowRankBarebonesTopbarPlayer #HeroContents\s*\{[\s\S]*?opacity:\s*1;/
  );
  assert.notEqual(
    noMissingPayload.sourceTexts["panorama/scripts/showrank_barebones.js"],
    alertPayload.sourceTexts["panorama/scripts/showrank_barebones.js"]
  );
});

test("unknown edition is rejected before a payload can be generated", async () => {
  await assert.rejects(
    () => buildTopbarRankPayload({ expectedVariantId: "unknown" }),
    /Unknown Topbar Rank edition: unknown/
  );
});
