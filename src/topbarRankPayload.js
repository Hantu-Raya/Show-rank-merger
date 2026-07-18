import { compilePanoramaLayoutResource, compilePanoramaStyleResource, compileTextResource } from "./source2ResourceWriter.js";
import { normalizeVpkPath } from "./rankMerge.js";
import { TOPBAR_RANK_SOURCE_TEXTS } from "./payload/topbarRankSources.generated.js";
import { TOPBAR_RANK_SOURCE_PATHS } from "./topbarRankSourceManifest.js";
import { SHOWRANK_CLOSURE_EXTERNS } from "./showrankClosureExterns.generated.js";

const SHOWRANK_SOURCE_PATH = "panorama/scripts/showrank_common.js";
const MOD_ICONS_DATA_PATH = "panorama/scripts/recent_purchases_redux_data.js";
const MINIFY_FROM = 'var RANK_IMAGE_URL_SUFFIX = "/rank-predict/image?format=webp";';
const MINIFY_TO = 'var RANK_IMAGE_URL_SUFFIX = "/rank-predict/image?size=small";';
const SCOREBOARD_OPENER = '<CitadelHudTopBar hittest="false"';
const SCOREBOARD_PATCHED_OPENER = '<CitadelHudTopBar class="ShowRankTopBarScoreboardOnly" hittest="false"';
const CLOSURE_OPTIONS = {
  compilationLevel: "ADVANCED",
  externs: [{ path: "showrank_closure_advanced.externs.js", src: SHOWRANK_CLOSURE_EXTERNS }],
  languageIn: "ECMASCRIPT_2020",
  languageOut: "ECMASCRIPT5",
  rewritePolyfills: false,
  warningLevel: "QUIET"
};
const CLOSURE_ALLOWED_UNDECLARED = new Set(["$", "MOD_ICONS"]);
const CLOSURE_REQUIRED_TOKENS = {
  [SHOWRANK_SOURCE_PATH]: [
    "__ShowRankWebMediaBridgeClean",
    "ShowRankTriggerProfileCard",
    "ShowRankOpenStatlocker",
    "ShowRankContextMenuOpenStatlocker",
    "ShowRankContextMenuOpenDeadlock",
    "ShowRankMarkTopBarHover",
    "ShowRankMarkPlayerListHover",
    "ShowRankClearPlayerListHover",
    "ShowRankEscapePreloadFromPlayerList",
    "ShowRankRegisterPlayerListRowReady"
  ],
  "panorama/scripts/topbar_rank_v40_hud.js": [
    "__TopbarRankV40HudRootGeneration",
    "__TopbarRankV40HudPlayerGeneration",
    "SpentSoulDisplay"
  ],
  "panorama/scripts/recent_purchases_redux.js": [
    "RecentPurchasesContainer",
    "__TopbarRankRecentPurchaseName",
    "MOD_ICONS"
  ],
  [MOD_ICONS_DATA_PATH]: ["MOD_ICONS"]
};

export const TOPBAR_RANK_REQUIRED_OUTPUT_PATHS = TOPBAR_RANK_SOURCE_PATHS.map(outputPathForSource);

export const SHOWRANK_VARIANTS = {
  showrank_normal: { minifyRanks: false, scoreboardOnly: false },
  showrank_scoreboard_only_topbar: { minifyRanks: false, scoreboardOnly: true },
  showrank_minify_ranks: { minifyRanks: true, scoreboardOnly: false },
  showrank_minify_ranks_scoreboard_only_topbar: { minifyRanks: true, scoreboardOnly: true }
};

export const SCOREBOARD_ONLY_CSS = `.ShowRankTopBarScoreboardOnly .ShowRankTopBarRankImage.ShowRankTopBarRankVisible
{
\tvisibility: collapse;
\topacity: 0;
}

.ShowRankTopBarScoreboardOnly.wants_scoreboard .ShowRankTopBarRankImage.ShowRankTopBarRankVisible,
.ShowRankTopBarScoreboardOnly.gScoreboardOpen .ShowRankTopBarRankImage.ShowRankTopBarRankVisible
{
\tvisibility: visible;
\topacity: 1;
}`;

const RANK_XML_CONTRACTS = {
  "panorama/layout/citadel_hud_top_bar.xml": [],
  "panorama/layout/citadel_hud_top_bar_player.xml": ["ShowRankMarkTopBarHover"],
  "panorama/layout/profile_card.xml": ["ShowRankTriggerProfileCard", "ShowRankOpenStatlocker"],
  "panorama/layout/citadel_ui_context_menu_player.xml": ["ShowRankContextMenuOpenStatlocker", "ShowRankContextMenuOpenDeadlock"],
  "panorama/layout/hud_escape_menu.xml": ["ShowRankEscapePreloadFromPlayerList"],
  "panorama/layout/players_list_entry.xml": [
    "ShowRankRegisterPlayerListRowReady",
    "ShowRankMarkPlayerListHover",
    "ShowRankClearPlayerListHover"
  ]
};

function cloneSourceTexts(sourceTexts = TOPBAR_RANK_SOURCE_TEXTS) {
  return Object.fromEntries(Object.entries(sourceTexts).map(([path, text]) => [path, String(text)]));
}

function applyMinifyRanksPatch(sourceTexts) {
  const text = sourceTexts[SHOWRANK_SOURCE_PATH];
  if (text.includes(MINIFY_TO)) return;
  if (!text.includes(MINIFY_FROM)) throw new Error("Could not apply minify-ranks patch");
  sourceTexts[SHOWRANK_SOURCE_PATH] = text.replace(MINIFY_FROM, MINIFY_TO);
}

function applyScoreboardOnlyPatch(sourceTexts) {
  const layoutPath = "panorama/layout/citadel_hud_top_bar.xml";
  const layoutText = sourceTexts[layoutPath];
  if (!layoutText.includes(SCOREBOARD_PATCHED_OPENER)) {
    if (!layoutText.includes(SCOREBOARD_OPENER)) {
      throw new Error("Could not apply scoreboard-only top-bar layout patch");
    }
    sourceTexts[layoutPath] = layoutText.replace(SCOREBOARD_OPENER, SCOREBOARD_PATCHED_OPENER);
  }

  const cssPath = "panorama/styles/topbar_rank_topbar.css";
  if (!sourceTexts[cssPath].includes("ShowRankTopBarScoreboardOnly")) {
    sourceTexts[cssPath] = `${sourceTexts[cssPath].replace(/\s*$/, "")}\n\n${SCOREBOARD_ONLY_CSS}\n`;
  }
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

function countToken(text, token) {
  return text.split(token).length - 1;
}

function validateSourceInvariants(sourceTexts) {
  const missingSources = TOPBAR_RANK_SOURCE_PATHS.filter((path) => !(path in sourceTexts));
  if (missingSources.length > 0) throw new Error(`topbar_rank source missing: ${missingSources.join(", ")}`);
  if ("panorama/scripts/topbar_rank_rank_bridge.js" in sourceTexts) {
    throw new Error("topbar_rank source contains removed topbar_rank_rank_bridge.js");
  }

  const bridge = sourceTexts["panorama/scripts/showrank_common.js"] || "";
  requireTokens(bridge, [
    "InstallShowRankWrapper",
    "GuardShowRankAction",
    "/rank-predict/image?format=webp"
  ], "showrank_common.js");
  forbidTokens(bridge, ["SHOWRANK_DIAG_BUILD", "ShowRankDiag", "$.Msg", "console."], "showrank_common.js");

  for (const [path, wrappers] of Object.entries(RANK_XML_CONTRACTS)) {
    const text = sourceTexts[path] || "";
    if (countToken(text, "showrank_common.vjs_c") !== 1) {
      throw new Error(`${path} must load showrank_common.vjs_c exactly once`);
    }
    forbidTokens(text, ["topbar_rank_rank_bridge.vjs_c", "$.TopbarRank"], path);
    requireTokens(text, wrappers.map((wrapper) => `$.${wrapper}`), path);
  }

  const topbar = sourceTexts["panorama/layout/citadel_hud_top_bar.xml"] || "";
  requireTokens(topbar, ["topbar_rank_v40_hud.vjs_c", "ShowRankTeamAverageLayer"], "citadel_hud_top_bar.xml");
  const player = sourceTexts["panorama/layout/citadel_hud_top_bar_player.xml"] || "";
  requireTokens(player, ["topbar_rank_v40_hud.vjs_c", "ShowRankTopBarRankImage", "SpentSoulDisplay"], "citadel_hud_top_bar_player.xml");
}

function outputPathForSource(path) {
  if (path.endsWith(".xml")) return path.replace(/\.xml$/, ".vxml_c");
  if (path.endsWith(".js")) return path.replace(/\.js$/, ".vjs_c");
  if (path.endsWith(".css")) return path.replace(/\.css$/, ".vcss_c");
  throw new Error(`Unsupported topbar_rank source type: ${path}`);
}

function isAllowedClosureError(error) {
  const description = String(error?.description || error?.message || "");
  const match = description.match(/^variable ([A-Za-z_$][A-Za-z0-9_$]*) is undeclared$/);
  return !!match && CLOSURE_ALLOWED_UNDECLARED.has(match[1]);
}

function resolveClosureCompiler(closureModule) {
  for (const candidate of [closureModule.default, closureModule["module.exports"], closureModule.gjd, closureModule.j, closureModule]) {
    if (typeof candidate === "function") return candidate;
    if (candidate && typeof candidate.default === "function") return candidate.default;
    if (candidate && typeof candidate.gjd === "function") return candidate.gjd;
  }
  throw new Error("google-closure-compiler-js did not expose a compiler function");
}

async function minifyTopbarScript(path, text) {
  const sourceText = path === MOD_ICONS_DATA_PATH
    ? text.replace(/^\s*const MOD_ICONS\s*=/m, 'this["MOD_ICONS"] =')
    : text;
  if (path === MOD_ICONS_DATA_PATH && sourceText === text) {
    throw new Error("Could not preserve MOD_ICONS global in Closure input");
  }
  const closureCompiler = resolveClosureCompiler(await import("google-closure-compiler-js"));
  const result = closureCompiler({
    ...CLOSURE_OPTIONS,
    jsCode: [{ path, src: sourceText }]
  });
  const errors = (result.errors || []).filter((error) => !isAllowedClosureError(error));
  if (errors.length) {
    throw new Error(`Closure ADVANCED failed for ${path}: ${errors.map((error) => error.description || error.message || String(error)).join("; ")}`);
  }
  if (!result.compiledCode || (result.compiledCode.length >= sourceText.length && path !== MOD_ICONS_DATA_PATH)) {
    throw new Error(`Closure ADVANCED did not reduce ${path}`);
  }
  requireTokens(result.compiledCode, CLOSURE_REQUIRED_TOKENS[path] || [], `Closure ADVANCED output for ${path}`);
  return result.compiledCode;
}

async function compileSource(path, text) {
  if (path.endsWith(".xml")) return compilePanoramaLayoutResource(text);
  if (path.endsWith(".js")) return compileTextResource(await minifyTopbarScript(path, text), { resourceVersion: 4 });
  if (path.endsWith(".css")) return compilePanoramaStyleResource(text);
  throw new Error(`Unsupported topbar_rank source type: ${path}`);
}

export async function buildTopbarRankPayload({
  variantId = "showrank_normal",
  sourceTexts: inputSourceTexts = TOPBAR_RANK_SOURCE_TEXTS
} = {}) {
  const variant = SHOWRANK_VARIANTS[variantId];
  if (!variant) throw new Error(`Unknown ShowRank variant: ${variantId}`);

  const sourceTexts = cloneSourceTexts(inputSourceTexts);
  validateSourceInvariants(sourceTexts);
  const appliedPatches = [];

  if (variant.minifyRanks) {
    applyMinifyRanksPatch(sourceTexts);
    appliedPatches.push("minify-ranks");
  }
  if (variant.scoreboardOnly) {
    applyScoreboardOnlyPatch(sourceTexts);
    appliedPatches.push("scoreboard-only-topbar");
  }

  const files = await Promise.all(TOPBAR_RANK_SOURCE_PATHS.map(async (path) => ({
    path: outputPathForSource(path),
    bytes: await compileSource(path, sourceTexts[path])
  })));
  const outputPathSet = new Set(files.map((file) => normalizeVpkPath(file.path)));
  const missing = TOPBAR_RANK_REQUIRED_OUTPUT_PATHS.filter((path) => !outputPathSet.has(normalizeVpkPath(path)));
  if (missing.length > 0) throw new Error(`Generated topbar_rank payload missing: ${missing.join(", ")}`);

  return { files, sourceTexts, appliedPatches };
}
