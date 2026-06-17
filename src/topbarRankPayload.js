import { compilePanoramaLayoutResource, compilePanoramaStyleResource, compileTextResource } from "./source2ResourceWriter.js";
import { normalizeVpkPath } from "./rankMerge.js";
import { TOPBAR_RANK_SOURCE_TEXTS } from "./payload/topbarRankSources.generated.js";

const MINIFY_FROM = 'var RANK_IMAGE_URL_SUFFIX = "/rank-predict/image?format=webp";';
const MINIFY_TO = 'var RANK_IMAGE_URL_SUFFIX = "/rank-predict/image?size=small";';
const SCOREBOARD_OPENER = '<CitadelHudTopBar hittest="false"';
const SCOREBOARD_PATCHED_OPENER = '<CitadelHudTopBar class="TopbarRankTopBarScoreboardOnly" hittest="false"';
const CLOSURE_LANGUAGE = "ECMASCRIPT_2020";
const CLOSURE_OUTPUT_LANGUAGE = "ECMASCRIPT_2015";
const CLOSURE_ALLOWED_UNDECLARED = new Set([
  "$",
  "GameUI",
  "SteamOverlayAPI",
  "CitadelShowProfilePageForAccount",
  "CitadelTopDownScoreboardPlayerHovered",
  "MOD_ICONS"
]);
const CLOSURE_REQUIRED_TOKENS = {
  "panorama/scripts/topbar_rank_rank_bridge.js": [
    "TopbarRankTriggerProfileCard",
    "TopbarRankRegisterTopBarPlayer",
    "TopbarRankEscapePreloadFromPlayerList",
    "__TopbarRankBridge",
    "https://api.deadlock-api.com/v1/players/"
  ],
  "panorama/scripts/topbar_rank_v40_hud.js": [
    "__TopbarRankV40HudRootGeneration",
    "__TopbarRankV40HudPlayerGeneration",
    "HudGameTime"
  ],
  "panorama/scripts/recent_purchases_redux.js": [
    "MOD_ICONS",
    "RecentPurchase"
  ],
  "panorama/scripts/recent_purchases_redux_data.js": [
    "MOD_ICONS",
    "s2r://panorama/images/items/"
  ]
};

export const SCOREBOARD_ONLY_CSS = `.TopbarRankTopBarScoreboardOnly .TopbarRankStatusImage.TopbarRankStatusVisible,
.TopbarRankTopBarScoreboardOnly .TopbarRankRankImage.TopbarRankRankVisible
{
	visibility: collapse;
	opacity: 0;
}

.TopbarRankTopBarScoreboardOnly.wants_scoreboard .TopbarRankRankImage.TopbarRankRankVisible,
.TopbarRankTopBarScoreboardOnly.gScoreboardOpen .TopbarRankRankImage.TopbarRankRankVisible
{
	visibility: visible;
	opacity: 1;
}

.TopbarRankTopBarScoreboardOnly.wants_scoreboard .TopbarRankStatusImage.TopbarRankStatusVisible,
.TopbarRankTopBarScoreboardOnly.gScoreboardOpen .TopbarRankStatusImage.TopbarRankStatusVisible
{
	visibility: visible;
	opacity: 0.75;
}`;

export const TOPBAR_RANK_REQUIRED_OUTPUT_PATHS = [
  "panorama/layout/citadel_hud_hero_shop.vxml_c",
  "panorama/layout/citadel_hud_top_bar.vxml_c",
  "panorama/layout/citadel_hud_top_bar_player.vxml_c",
  "panorama/layout/profile_card.vxml_c",
  "panorama/layout/citadel_ui_context_menu_player.vxml_c",
  "panorama/layout/hud_escape_menu.vxml_c",
  "panorama/layout/players_list_entry.vxml_c",
  "panorama/scripts/recent_purchases_redux.vjs_c",
  "panorama/scripts/recent_purchases_redux_data.vjs_c",
  "panorama/scripts/topbar_rank_rank_bridge.vjs_c",
  "panorama/scripts/topbar_rank_v40_hud.vjs_c",
  "panorama/styles/citadel_hud_hero_shop.vcss_c",
  "panorama/styles/topbar_rank_topbar.vcss_c",
  "panorama/styles/objectives_map.vcss_c",
  "panorama/styles/topbar_rank_profile_card.vcss_c",
  "panorama/styles/topbar_rank_player_list.vcss_c",
  "panorama/styles/topbar_rank_base/citadel_hud_top_bar.vcss_c",
  "panorama/styles/topbar_rank_base/objectives_map.vcss_c"
];

export const SHOWRANK_VARIANTS = {
  showrank_normal: { minifyRanks: false, scoreboardOnly: false },
  showrank_scoreboard: { minifyRanks: false, scoreboardOnly: true },
  showrank_minify_ranks: { minifyRanks: true, scoreboardOnly: false },
  showrank_minify_ranks_scoreboard_only_topbar: { minifyRanks: true, scoreboardOnly: true }
};

function cloneSourceTexts(sourceTexts = TOPBAR_RANK_SOURCE_TEXTS) {
  return Object.fromEntries(Object.entries(sourceTexts).map(([path, text]) => [path, String(text)]));
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

function validateSourceInvariants(sourceTexts) {
  const bridge = sourceTexts["panorama/scripts/topbar_rank_rank_bridge.js"] || "";
  requireTokens(bridge, [
    'RANK_API_URL_PREFIX = "https://api.deadlock-api.com/v1/players/"',
    "TEAM_AVERAGE_REQUIRED_ACCOUNTS = 6",
    "TopbarRankTopBarRootLoaded",
    "TopbarRankRegisterTopBarPlayer"
  ], "topbar_rank_rank_bridge.js");

  const hud = sourceTexts["panorama/scripts/topbar_rank_v40_hud.js"] || "";
  requireTokens(hud, [
    "ROOT_TICK_SECONDS = 1.0",
    "INITIAL_URN = 720",
    "URN_DURATION = 360",
    "TIER_COSTS = { isTier1: 800, isTier2: 1600, isTier3: 3200, isTier4: 6400 }"
  ], "topbar_rank_v40_hud.js");

  for (const path of [
    "panorama/layout/profile_card.xml",
    "panorama/layout/citadel_ui_context_menu_player.xml",
    "panorama/layout/hud_escape_menu.xml",
    "panorama/layout/players_list_entry.xml"
  ]) {
    const text = sourceTexts[path] || "";
    requireTokens(text, ["topbar_rank_rank_bridge.vjs_c"], path);
    forbidTokens(text, ["topbar_rank_hud.vjs_c", "topbar_rank_v40_hud.vjs_c"], path);
  }

  forbidTokens(sourceTexts["panorama/layout/hud_escape_menu.xml"] || "", ["topbar_rank_topbar.vcss_c"], "hud_escape_menu.xml");
}

function outputPathForSource(path) {
  if (path.endsWith(".xml")) return path.replace(/\.xml$/, ".vxml_c");
  if (path.endsWith(".js")) return path.replace(/\.js$/, ".vjs_c");
  if (path.endsWith(".css")) return path.replace(/\.css$/, ".vcss_c");
  throw new Error(`Unsupported topbar_rank source type: ${path}`);
}

function closureSourceForPath(path, text) {
  if (path === "panorama/scripts/recent_purchases_redux_data.js") {
    return `${text.replace(/\s*$/, "")}\nthis["MOD_ICONS"] = MOD_ICONS;\n`;
  }
  return text;
}

function isAllowedClosureError(error) {
  const description = String(error?.description || error?.message || "");
  const match = description.match(/^variable ([A-Za-z_$][A-Za-z0-9_$]*) is undeclared$/);
  return !!match && CLOSURE_ALLOWED_UNDECLARED.has(match[1]);
}

function assertClosureAdvancedOutput(path, sourceText, compiledCode) {
  if (!compiledCode || compiledCode.length < 16) {
    throw new Error(`Closure ADVANCED generated empty code for ${path}`);
  }
  if (compiledCode.length >= sourceText.length && path !== "panorama/scripts/recent_purchases_redux_data.js") {
    throw new Error(`Closure ADVANCED did not reduce ${path}`);
  }
  for (const token of CLOSURE_REQUIRED_TOKENS[path] || []) {
    if (!compiledCode.includes(token)) throw new Error(`Closure ADVANCED output for ${path} missing required token: ${token}`);
  }
}


function resolveClosureCompiler(closureModule) {
  const direct = closureModule.default || closureModule["module.exports"] || closureModule.gjd || closureModule.j || closureModule;
  if (typeof direct === "function") return direct;
  return direct.default || direct["module.exports"] || direct.gjd || direct.j || direct;
}

async function minifyScriptSource(path, text) {
  const sourceText = closureSourceForPath(path, text);
  const closureCompiler = resolveClosureCompiler(await import("google-closure-compiler-js"));
  const result = closureCompiler({
    jsCode: [{ path, src: sourceText }],
    compilationLevel: "ADVANCED",
    languageIn: CLOSURE_LANGUAGE,
    languageOut: CLOSURE_OUTPUT_LANGUAGE
  });
  const errors = (result.errors || []).filter((error) => !isAllowedClosureError(error));
  if (errors.length > 0) {
    throw new Error(`Closure ADVANCED failed for ${path}: ${errors.map((error) => error.description || error.message || String(error)).join("; ")}`);
  }
  assertClosureAdvancedOutput(path, text, result.compiledCode);
  return result.compiledCode;
}

async function compileSource(path, text) {
  if (path.endsWith(".xml")) return compilePanoramaLayoutResource(text);
  if (path.endsWith(".js")) return compileTextResource(await minifyScriptSource(path, text), { resourceVersion: 4 });
  if (path.endsWith(".css")) return compilePanoramaStyleResource(text);
  throw new Error(`Unsupported topbar_rank source type: ${path}`);
}

export async function buildTopbarRankPayload(variantId, { sourceTexts: inputSourceTexts = TOPBAR_RANK_SOURCE_TEXTS } = {}) {
  const variant = SHOWRANK_VARIANTS[variantId];
  if (!variant) throw new Error(`Unknown ShowRank variant: ${variantId}`);

  const sourceTexts = cloneSourceTexts(inputSourceTexts);
  const appliedPatches = [];

  if (variant.minifyRanks) {
    const path = "panorama/scripts/topbar_rank_rank_bridge.js";
    const text = sourceTexts[path];
    if (text.includes(MINIFY_FROM)) {
      sourceTexts[path] = text.replace(MINIFY_FROM, MINIFY_TO);
    } else if (!text.includes(MINIFY_TO)) {
      throw new Error("Could not apply minify-ranks patch");
    }
    appliedPatches.push("minify-ranks");
  }

  if (variant.scoreboardOnly) {
    const layoutPath = "panorama/layout/citadel_hud_top_bar.xml";
    const layoutText = sourceTexts[layoutPath];
    if (layoutText.includes(SCOREBOARD_PATCHED_OPENER)) {
      sourceTexts[layoutPath] = layoutText;
    } else if (layoutText.includes(SCOREBOARD_OPENER)) {
      sourceTexts[layoutPath] = layoutText.replace(SCOREBOARD_OPENER, SCOREBOARD_PATCHED_OPENER);
    } else {
      throw new Error("Could not apply scoreboard-only top-bar layout patch");
    }

    const cssPath = "panorama/styles/topbar_rank_topbar.css";
    if (!sourceTexts[cssPath].includes("TopbarRankTopBarScoreboardOnly")) {
      sourceTexts[cssPath] = `${sourceTexts[cssPath].replace(/\s*$/, "")}\n\n${SCOREBOARD_ONLY_CSS}\n`;
    }
    appliedPatches.push("scoreboard-only-topbar");
  }

  validateSourceInvariants(sourceTexts);

  const files = await Promise.all(Object.entries(sourceTexts).map(async ([path, text]) => ({
    path: outputPathForSource(path),
    bytes: await compileSource(path, text)
  })));

  const outputPathSet = new Set(files.map((file) => normalizeVpkPath(file.path)));
  const missing = TOPBAR_RANK_REQUIRED_OUTPUT_PATHS.filter((path) => !outputPathSet.has(normalizeVpkPath(path)));
  if (missing.length > 0) {
    throw new Error(`Generated topbar_rank payload missing: ${missing.join(", ")}`);
  }

  return { files, sourceTexts, appliedPatches };
}
