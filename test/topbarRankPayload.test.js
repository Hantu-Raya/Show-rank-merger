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

test("source manifest defines exactly the two Barebones editions and 22 resources", () => {
  assert.deepEqual(Object.keys(TOPBAR_RANK_SOURCE_BASE_URLS), EDITION_IDS);
  assert.equal(TOPBAR_RANK_SOURCE_PATHS.length, 22);
  assert.deepEqual(Object.keys(TOPBAR_RANK_SOURCE_TEXTS), TOPBAR_RANK_SOURCE_PATHS);
  assert.equal(Object.keys(TOPBAR_RANK_NO_MISSING_SOURCE_OVERRIDES).length, 4);
  assert.equal(
    Object.keys(TOPBAR_RANK_NO_MISSING_SOURCE_OVERRIDES).every((path) => TOPBAR_RANK_SOURCE_PATHS.includes(path)),
    true
  );
});

test("each edition produces exactly the 22 declared binary resources", async () => {
  for (const expectedVariantId of EDITION_IDS) {
    const payload = await buildTopbarRankPayload({ expectedVariantId });
    assert.deepEqual(Object.keys(payload.sourceTexts), TOPBAR_RANK_SOURCE_PATHS);
    assert.equal(payload.files.length, 22);
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

test("edition scripts preserve their source text verbatim in versioned text resources", async () => {
  for (const expectedVariantId of EDITION_IDS) {
    const payload = await buildTopbarRankPayload({ expectedVariantId });
    for (const sourcePath of TOPBAR_RANK_SOURCE_PATHS.filter((path) => path.endsWith(".js"))) {
      const file = fileByPath(payload, sourcePath.replace(/\.js$/, ".vjs_c"));
      assert.equal(resourceVersion(file.bytes), 4, `${sourcePath} has the wrong resource version`);
      assert.equal(extractTextResource(file.bytes), payload.sourceTexts[sourcePath], `${sourcePath} was transformed`);
    }
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
