import { compilePanoramaLayoutResource, compilePanoramaStyleResource, compileTextResource } from "./source2ResourceWriter.js";
import { normalizeVpkPath } from "./rankMerge.js";
import {
  TOPBAR_RANK_NO_MISSING_SOURCE_OVERRIDES,
  TOPBAR_RANK_SOURCE_TEXTS
} from "./payload/topbarRankSources.generated.js";
import { TOPBAR_RANK_SOURCE_BASE_URLS, TOPBAR_RANK_SOURCE_PATHS } from "./topbarRankSourceManifest.js";

const ALERT_MARKERS = ["ShowRankBarebonesMissing", "ShowRankBarebonesNotification", "MISSING_WINDOW", "ENEMY MISSING"];
const NO_MISSING_PORTRAIT_NEUTRALIZATION = "CitadelHudTopBarPlayer.ShowRankBarebonesTopbarPlayer #HeroContents";

export const TOPBAR_RANK_REQUIRED_OUTPUT_PATHS = TOPBAR_RANK_SOURCE_PATHS.map(outputPathForSource);

function bundledSourceTextsForEdition(expectedVariantId) {
  if (expectedVariantId === "showrank_barebones") return TOPBAR_RANK_SOURCE_TEXTS;
  if (expectedVariantId === "showrank_barebones_no_missing") {
    return { ...TOPBAR_RANK_SOURCE_TEXTS, ...TOPBAR_RANK_NO_MISSING_SOURCE_OVERRIDES };
  }
  throw new Error(`Unknown Topbar Rank edition: ${expectedVariantId}`);
}

function requireTokens(text, tokens, label) {
  for (const token of tokens) {
    if (!text.includes(token)) throw new Error(`${label} missing required token: ${token}`);
  }
}

function forbidTokens(text, tokens, label) {
  for (const token of tokens) {
    if (text.includes(token)) throw new Error(`${label} contains forbidden token: ${token}`);
  }
}

function validateSourceInvariants(sourceTexts, expectedVariantId) {
  if (!TOPBAR_RANK_SOURCE_BASE_URLS[expectedVariantId]) {
    throw new Error(`Unknown Topbar Rank edition: ${expectedVariantId}`);
  }

  const sourcePaths = Object.keys(sourceTexts);
  const missingSources = TOPBAR_RANK_SOURCE_PATHS.filter((path) => !(path in sourceTexts));
  const unexpectedSources = sourcePaths.filter((path) => !TOPBAR_RANK_SOURCE_PATHS.includes(path));
  if (missingSources.length > 0) throw new Error(`topbar_rank source missing: ${missingSources.join(", ")}`);
  if (unexpectedSources.length > 0) throw new Error(`topbar_rank source has unexpected paths: ${unexpectedSources.join(", ")}`);

  const topbar = sourceTexts["panorama/layout/citadel_hud_top_bar.xml"];
  const player = sourceTexts["panorama/layout/citadel_hud_top_bar_player.xml"];
  const escapeMenu = sourceTexts["panorama/layout/hud_escape_menu.xml"];
  const playerList = sourceTexts["panorama/layout/players_list_entry.xml"];
  const profileCard = sourceTexts["panorama/layout/profile_card.xml"];
  const dashboardProfile = sourceTexts["panorama/layout/citadel_db_page_profile.xml"];
  const heroShop = sourceTexts["panorama/layout/citadel_hud_hero_shop.xml"];
  const barebonesRuntime = sourceTexts["panorama/scripts/showrank_barebones.js"];
  const modIcons = sourceTexts["panorama/scripts/recent_purchases_redux_data.js"];

  requireTokens(topbar, [
    "rejuvnbufftimer.vjs_c",
    "urntracker.vjs_c",
    "ShowRankBarebonesTeamAverageLayer"
  ], "citadel_hud_top_bar.xml");
  requireTokens(player, [
    "unspent.vjs_c",
    "showrank_barebones.vjs_c",
    "ShowRankBarebonesTopbarRankImage"
  ], "citadel_hud_top_bar_player.xml");
  requireTokens(heroShop, [
    "recent_purchases_redux_data.vjs_c",
    "recent_purchases_redux.vjs_c"
  ], "citadel_hud_hero_shop.xml");
  requireTokens(playerList, ["ShowRankBarebonesPlayerListRankImage"], "players_list_entry.xml");
  requireTokens(profileCard, ["ShowRankBarebonesRankImage"], "profile_card.xml");
  requireTokens(dashboardProfile, [
    "ShowRankBarebonesProfilePage",
    "showrank_barebones.vjs_c"
  ], "citadel_db_page_profile.xml");
  requireTokens(escapeMenu, ["CitadelResumePlaying()", "showrank_barebones.vjs_c"], "hud_escape_menu.xml");
  requireTokens(barebonesRuntime, [
    "ShowRankBarebonesEscapeOpen",
    "ShowRankBarebonesOpenStatlocker"
  ], "showrank_barebones.js");
  requireTokens(modIcons, ["MOD_ICONS"], "recent_purchases_redux_data.js");

  const combinedSource = sourcePaths.map((path) => sourceTexts[path]).join("\n");
  if (expectedVariantId === "showrank_barebones") {
    requireTokens(combinedSource, ALERT_MARKERS, "Barebones alert edition");
  } else {
    forbidTokens(combinedSource, ALERT_MARKERS, "Barebones no-missing edition");
    requireTokens(
      sourceTexts["panorama/styles/showrank_barebones_topbar.css"],
      [NO_MISSING_PORTRAIT_NEUTRALIZATION, "opacity: 1;"],
      "showrank_barebones_topbar.css"
    );
  }
}

function outputPathForSource(path) {
  if (path.endsWith(".xml")) return path.replace(/\.xml$/, ".vxml_c");
  if (path.endsWith(".js")) return path.replace(/\.js$/, ".vjs_c");
  if (path.endsWith(".css")) return path.replace(/\.css$/, ".vcss_c");
  throw new Error(`Unsupported topbar_rank source type: ${path}`);
}

const BAREBONES_PUBLIC_APIS = [
  "ShowRankBarebonesRefresh",
  "ShowRankBarebonesOpenStatlocker",
  "ShowRankBarebonesCopyAccount",
  "ShowRankBarebonesEscapeOpen",
  "ShowRankBarebonesEscapeOut"
];
async function compileBarebonesRuntime(source, expectedVariantId) {
  const closureCompilerModule = await import("google-closure-compiler-js");
  const compile = closureCompilerModule.compile
    || closureCompilerModule.default?.compile
    || closureCompilerModule.default;
  if (typeof compile !== "function") {
    throw new Error("google-closure-compiler-js does not expose a compiler function");
  }
  const propertyNames = [...new Set(
    [...source.matchAll(/\.([A-Za-z_$][A-Za-z0-9_$]*)/g)].map((match) => match[1])
  )].sort();
  const externs = [
    "var $;",
    "function DismissAllContextMenus() {}",
    "function DropInputFocus() {}",
    ...propertyNames.map((propertyName) => `Object.prototype.${propertyName};`)
  ].join("\n");
  const publicApis = expectedVariantId === "showrank_barebones"
    ? [...BAREBONES_PUBLIC_APIS, "ShowRankBarebonesMissingWindowExpired"]
    : BAREBONES_PUBLIC_APIS;
  const result = await compile({
    compilationLevel: "ADVANCED",
    externs: [{ path: "showrank_barebones.externs.js", src: externs }],
    jsCode: [{ path: "showrank_barebones.js", src: source }],
    languageIn: "ECMASCRIPT5",
    languageOut: "ECMASCRIPT5",
    warningLevel: "QUIET"
  });
  if (result.errors?.length > 0) {
    throw new Error(`Closure Compiler failed: ${result.errors.map((error) => error.description || String(error)).join("; ")}`);
  }
  const compiledSource = result.compiledCode;
  if (typeof compiledSource !== "string" || compiledSource.length === 0) {
    throw new Error("Closure Compiler did not produce a showrank_barebones runtime");
  }
  if (compiledSource.length >= source.length) {
    throw new Error(`Closure Compiler did not reduce showrank_barebones.js: ${compiledSource.length} >= ${source.length}`);
  }
  for (const publicApi of publicApis) {
    if (!compiledSource.includes(publicApi)) {
      throw new Error(`Closure Compiler removed public Barebones API: ${publicApi}`);
    }
  }
  return {
    source: compiledSource,
    metadata: {
      compilationLevel: "ADVANCED",
      externs,
      inputLanguage: "ECMASCRIPT5",
      outputLanguage: "ECMASCRIPT5",
      sourceBytes: new TextEncoder().encode(source).byteLength,
      outputBytes: new TextEncoder().encode(compiledSource).byteLength,
      publicApis
    }
  };
}

function compileSource(path, text) {
  if (path.endsWith(".xml")) return compilePanoramaLayoutResource(text);
  if (path.endsWith(".js")) return compileTextResource(text, { resourceVersion: 4 });
  if (path.endsWith(".css")) return compilePanoramaStyleResource(text);
  throw new Error(`Unsupported topbar_rank source type: ${path}`);
}

export async function buildTopbarRankPayload({
  expectedVariantId = "showrank_barebones",
  sourceTexts = bundledSourceTextsForEdition(expectedVariantId)
} = {}) {
  validateSourceInvariants(sourceTexts, expectedVariantId);
  const barebonesRuntime = await compileBarebonesRuntime(
    sourceTexts["panorama/scripts/showrank_barebones.js"],
    expectedVariantId
  );
  const files = await Promise.all(TOPBAR_RANK_SOURCE_PATHS.map(async (path) => ({
    path: outputPathForSource(path),
    bytes: await compileSource(
      path,
      path === "panorama/scripts/showrank_barebones.js" ? barebonesRuntime.source : sourceTexts[path]
    )
  })));
  const outputPathSet = new Set(files.map((file) => normalizeVpkPath(file.path)));
  const missing = TOPBAR_RANK_REQUIRED_OUTPUT_PATHS.filter((path) => !outputPathSet.has(normalizeVpkPath(path)));
  if (missing.length > 0) throw new Error(`Generated topbar_rank payload missing: ${missing.join(", ")}`);

  return { files, sourceTexts, closureMetadata: barebonesRuntime.metadata };
}
