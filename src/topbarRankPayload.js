import { compilePanoramaLayoutResource, compilePanoramaStyleResource, compileTextResource } from "./source2ResourceWriter.js";
import { normalizeVpkPath } from "./rankMerge.js";
import { TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION } from "./payload/topbarRankSources.generated.js";
import {
  TOPBAR_RANK_DEFAULT_EDITION,
  TOPBAR_RANK_SOURCE_PATHS,
  assertTopbarRankEdition
} from "./topbarRankSourceManifest.js";

const BAREBONES_SOURCE_PATH = "panorama/scripts/showrank_barebones.js";
const MOD_ICONS_DATA_PATH = "panorama/scripts/recent_purchases_redux_data.js";
const JAVASCRIPT_SOURCE_PATHS = TOPBAR_RANK_SOURCE_PATHS.filter((path) => path.endsWith(".js"));
const DATA_PUBLIC_GLOBALS = ["MOD_ICONS", "HERO_IMAGES"];
const BAREBONES_PANEL_APIS = [
  "ShowRankBarebonesRefresh",
  "ShowRankBarebonesOpenStatlocker",
  "ShowRankBarebonesOpenPlayerProfile",
  "ShowRankBarebonesCopyAccount"
];
const BAREBONES_GLOBAL_APIS = [
  "ShowRankBarebonesEscapeOpen",
  "ShowRankBarebonesEscapeOut"
];
const PROFILE_PAGE_MARKERS = [
  "ShowRankBarebonesProfilePageAccount",
  "ShowRankBarebonesProfilePageRankImage",
  "ProfileStatsCommunityButton",
  "ProfileStatsCommunityPanel",
  "ProfileStatsCommunityDisplayCommunity",
  "ProfileStatsCommunityDisplayPercentile"
];
const PROFILE_CARD_MARKERS = ["ProfileStatsCommunityContextAccount"];
const PROFILE_CONTEXT_MARKERS = [
  "ProfileStatsCommunityPlayerProfileRow",
  "ShowRankBarebonesOpenPlayerProfile"
];
const MISSING_ENEMY_RUNTIME_MARKERS = [
  "ShowRankBarebonesMissingWindowExpired",
  "ShowRankBarebonesMissing",
  "MISSING_",
  "missingSession",
  "missingLeader",
  "missingRunning",
  "missingChecks",
  "missingNotification",
  "missingRecords",
  "missingHealth",
  "missingWindow",
  "missingActive",
  "missingToast",
  "refreshMissing",
  "scheduleMissing",
  "setMissing",
  "resetMissing",
  "readMissing",
  "parseGameClock",
  "GameClock",
  "GameTime",
  "gameClock",
  "HealthVisible",
  "HealthHidden"
];
const MISSING_ENEMY_LAYOUT_MARKERS = [
  "ShowRankBarebonesMissing",
  "MISSING"
];
const MISSING_ENEMY_STYLE_MARKERS = [
  "ShowRankBarebonesMissing",
  "MISSING",
  "HealthVisible",
  "HealthHidden"
];
const UNRESOLVED_COMPOSITION_MARKERS = [
  "PROFILE_STATS_COMMUNITY_RUNTIME",
  "PROFILE_STATS_COMMUNITY_STYLES",
  "VIEWED_PROFILE_IDENTITY_POLICY"
];
const CLOSURE_OPTIONS = {
  compilationLevel: "ADVANCED",
  languageIn: "ECMASCRIPT_2020",
  languageOut: "ECMASCRIPT5",
  rewritePolyfills: false,
  warningLevel: "QUIET"
};

export const TOPBAR_RANK_REQUIRED_OUTPUT_PATHS = TOPBAR_RANK_SOURCE_PATHS.map(outputPathForSource);
function requireProfileMarkers(sourceTexts) {
  requireTokens(
    sourceTexts["panorama/layout/citadel_db_page_profile.xml"],
    PROFILE_PAGE_MARKERS,
    "panorama/layout/citadel_db_page_profile.xml"
  );
  requireTokens(
    sourceTexts["panorama/layout/profile_card.xml"],
    PROFILE_CARD_MARKERS,
    "panorama/layout/profile_card.xml"
  );
  requireTokens(
    sourceTexts["panorama/layout/citadel_ui_context_menu_player.xml"],
    PROFILE_CONTEXT_MARKERS,
    "panorama/layout/citadel_ui_context_menu_player.xml"
  );
}

function forbidMissingEnemyMarkers(sourceTexts, editionId) {
  if (editionId !== "no_missing") return;
  const checks = [
    ["panorama/scripts/showrank_barebones.js", MISSING_ENEMY_RUNTIME_MARKERS],
    ["panorama/layout/citadel_hud_top_bar_player.xml", MISSING_ENEMY_LAYOUT_MARKERS],
    ["panorama/styles/showrank_barebones_topbar.css", MISSING_ENEMY_STYLE_MARKERS]
  ];
  for (const [path, markers] of checks) {
    const text = sourceTexts[path];
    for (const marker of markers) {
      if (text.toLowerCase().includes(marker.toLowerCase())) {
        throw new Error(`${path} contains forbidden no-missing marker: ${marker}`);
      }
    }
  }
}

function cloneSourceTexts(sourceTexts) {
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
function forbidUnresolvedCompositionPlaceholders(sourceTexts) {
  for (const [path, text] of Object.entries(sourceTexts)) {
    for (const marker of UNRESOLVED_COMPOSITION_MARKERS) {
      if (text.includes(marker)) {
        throw new Error(`${path} contains unresolved composition placeholder: ${marker}`);
      }
    }
  }
}

function validateSourceInvariants(sourceTexts, editionId) {
  const missingSources = TOPBAR_RANK_SOURCE_PATHS.filter((path) => !(path in sourceTexts));
  if (missingSources.length > 0) throw new Error(`Topbar Rank source missing: ${missingSources.join(", ")}`);
  forbidUnresolvedCompositionPlaceholders(sourceTexts);
  if ("panorama/scripts/showrank_common.js" in sourceTexts) {
    throw new Error("Topbar Rank source contains removed showrank_common.js");
  }
  if ("panorama/scripts/topbar_rank_rank_bridge.js" in sourceTexts) {
    throw new Error("Topbar Rank source contains removed topbar_rank_rank_bridge.js");
  }

  for (const [path, text] of Object.entries(sourceTexts)) {
    forbidTokens(text, ["showrank_common", "topbar_rank_rank_bridge"], path);
  }

  const barebones = sourceTexts[BAREBONES_SOURCE_PATH];
  const requiredBarebonesTokens = [
    'RANK_API_BASE_URL = "https://api.deadlock-api.com/v1/players"',
    'return RANK_API_BASE_URL + "/" + account + "/rank/image?format="',
    'return RANK_API_BASE_URL + "/rank/image?account_ids="',
    "/rank/image?format=",
    "/rank/image?account_ids=",
    "CitadelShowProfilePageForAccount",
    ...BAREBONES_PANEL_APIS,
    ...BAREBONES_GLOBAL_APIS
  ];
  if (editionId === "alert") requiredBarebonesTokens.push("ShowRankBarebonesMissingWindowExpired");
  requireTokens(barebones, requiredBarebonesTokens, BAREBONES_SOURCE_PATH);
  if (editionId === "no_missing") {
    forbidTokens(barebones, ["ShowRankBarebonesMissingWindowExpired"], BAREBONES_SOURCE_PATH);
    forbidMissingEnemyMarkers(sourceTexts, editionId);
  }
  forbidTokens(barebones, ["/rank-predict/image"], BAREBONES_SOURCE_PATH);
  requireTokens(sourceTexts[MOD_ICONS_DATA_PATH], ["MOD_ICONS"], MOD_ICONS_DATA_PATH);
  requireProfileMarkers(sourceTexts);
}

function outputPathForSource(path) {
  if (path.endsWith(".xml")) return path.replace(/\.xml$/, ".vxml_c");
  if (path.endsWith(".js")) return path.replace(/\.js$/, ".vjs_c");
  if (path.endsWith(".css")) return path.replace(/\.css$/, ".vcss_c");
  throw new Error(`Unsupported Topbar Rank source type: ${path}`);
}

function resolveClosureCompiler(closureModule) {
  for (const candidate of [closureModule.default, closureModule["module.exports"], closureModule.gjd, closureModule.j, closureModule]) {
    if (typeof candidate === "function") return candidate;
    if (candidate && typeof candidate.default === "function") return candidate.default;
    if (candidate && typeof candidate.gjd === "function") return candidate.gjd;
  }
  throw new Error("google-closure-compiler-js did not expose a compiler function");
}

function replaceCompilerInputAtMostOnce(source, before, after, path) {
  const first = source.indexOf(before);
  if (first < 0) return source;
  if (first !== source.lastIndexOf(before)) {
    throw new Error(`Closure input adapter for ${path} found duplicate syntax: ${before}`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
}

function exportDataGlobal(source, symbol, path) {
  const declaration = new RegExp(`(^\\s*)(?:const|let|var)\\s+${symbol}\\s*=`, "m");
  const match = source.match(declaration);
  if (!match) {
    if (new RegExp(`\\b${symbol}\\s*=`).test(source)) return source;
    throw new Error(`Closure input adapter for ${path} did not find ${symbol}`);
  }
  const prepared = source.replace(declaration, `$1${symbol} =`);
  if (declaration.test(prepared)) {
    throw new Error(`Closure input adapter for ${path} found duplicate declaration: ${symbol}`);
  }
  return prepared;
}

function prepareJavascriptSource(path, source) {
  if (path === MOD_ICONS_DATA_PATH) {
    return DATA_PUBLIC_GLOBALS.reduce((prepared, symbol) => exportDataGlobal(prepared, symbol, path), source);
  }
  if (path === "panorama/scripts/rejuvnbufftimer.js") {
    let prepared = replaceCompilerInputAtMostOnce(
      source,
      "cachedGameTimePanel?.text",
      "cachedGameTimePanel ? cachedGameTimePanel.text : null",
      path
    );
    prepared = replaceCompilerInputAtMostOnce(
      prepared,
      "p.GetParent?.()",
      "p.GetParent && p.GetParent()",
      path
    );
    return prepared;
  }
  return source;
}

function buildClosureExterns(sourceTexts) {
  const propertyNames = [...new Set(JAVASCRIPT_SOURCE_PATHS.flatMap((path) => (
    [...sourceTexts[path].matchAll(/\.([A-Za-z_$][A-Za-z0-9_$]*)/g)].map((match) => match[1])
  )))].sort();
  return [
    "var $;",
    "var Game;",
    "var GameUI;",
    ...DATA_PUBLIC_GLOBALS.map((name) => `var ${name};`),
    "function DismissAllContextMenus() {}",
    "function DropInputFocus() {}",
    ...propertyNames.map((propertyName) => `Object.prototype.${propertyName};`)
  ].join("\n");
}

function decodeClosureUnicodeEscapes(source) {
  return source.replace(/\\u([0-9a-fA-F]{4})/g, (escape, hex) => {
    const codePoint = Number.parseInt(hex, 16);
    return codePoint === 0x2028 || codePoint === 0x2029 ? escape : String.fromCharCode(codePoint);
  });
}

function requiredPublicSymbols(path) {
  if (path === MOD_ICONS_DATA_PATH) return DATA_PUBLIC_GLOBALS;
  if (path !== BAREBONES_SOURCE_PATH) return [];
  return [...BAREBONES_PANEL_APIS, ...BAREBONES_GLOBAL_APIS];
}

async function compileJavascriptSource(path, source, editionId, compile, externs) {
  const result = await compile({
    ...CLOSURE_OPTIONS,
    externs: [{ path: "panorama.externs.js", src: externs }],
    jsCode: [{ path, src: prepareJavascriptSource(path, source) }]
  });
  if (result.errors?.length > 0) {
    throw new Error(`Closure Compiler failed for ${path}: ${result.errors.map((error) => (
      error.description || String(error)
    )).join("; ")}`);
  }
  const compiledSource = decodeClosureUnicodeEscapes(result.compiledCode);
  if (!compiledSource) throw new Error(`Closure Compiler did not produce ${path}`);

  const sourceBytes = new TextEncoder().encode(source).byteLength;
  const outputBytes = new TextEncoder().encode(compiledSource).byteLength;
  if (outputBytes >= sourceBytes) {
    throw new Error(`Closure Compiler did not reduce ${path}: ${outputBytes} >= ${sourceBytes}`);
  }
  const publicSymbols = requiredPublicSymbols(path);
  for (const publicSymbol of publicSymbols) {
    if (!compiledSource.includes(publicSymbol)) {
      throw new Error(`Closure Compiler removed public symbol from ${path}: ${publicSymbol}`);
    }
  }
  if (path === BAREBONES_SOURCE_PATH && editionId === "alert") {
    requireTokens(compiledSource, ["ShowRankBarebonesMissingWindowExpired"], "Closure ADVANCED output");
  }
  if (path === BAREBONES_SOURCE_PATH && editionId === "no_missing") {
    forbidMissingEnemyMarkers({
      [BAREBONES_SOURCE_PATH]: compiledSource,
      "panorama/layout/citadel_hud_top_bar_player.xml": "",
      "panorama/styles/showrank_barebones_topbar.css": ""
    }, editionId);
  }
  return { source: compiledSource, metadata: { sourceBytes, outputBytes, publicSymbols } };
}

async function compileJavascriptSources(sourceTexts, editionId) {
  const compile = resolveClosureCompiler(await import("google-closure-compiler-js"));
  const externs = buildClosureExterns(sourceTexts);
  const compiledEntries = await Promise.all(JAVASCRIPT_SOURCE_PATHS.map(async (path) => [
    path,
    await compileJavascriptSource(path, sourceTexts[path], editionId, compile, externs)
  ]));
  const compiledByPath = Object.fromEntries(compiledEntries);
  const scripts = Object.fromEntries(compiledEntries.map(([path, compiled]) => [path, compiled.metadata]));
  return {
    compiledByPath,
    metadata: {
      compilationLevel: CLOSURE_OPTIONS.compilationLevel,
      externs,
      inputLanguage: CLOSURE_OPTIONS.languageIn,
      outputLanguage: CLOSURE_OPTIONS.languageOut,
      sourceBytes: Object.values(scripts).reduce((total, script) => total + script.sourceBytes, 0),
      outputBytes: Object.values(scripts).reduce((total, script) => total + script.outputBytes, 0),
      scripts
    }
  };
}

function compileSource(path, text) {
  if (path.endsWith(".xml")) return compilePanoramaLayoutResource(text);
  if (path.endsWith(".js")) return compileTextResource(text, { resourceVersion: 4 });
  if (path.endsWith(".css")) return compilePanoramaStyleResource(text);
  throw new Error(`Unsupported Topbar Rank source type: ${path}`);
}

export async function buildTopbarRankPayload({
  editionId = TOPBAR_RANK_DEFAULT_EDITION,
  sourceTexts: inputSourceTexts
} = {}) {
  const resolvedEditionId = assertTopbarRankEdition(editionId);
  const sourceTexts = cloneSourceTexts(inputSourceTexts || TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION[resolvedEditionId]);
  validateSourceInvariants(sourceTexts, resolvedEditionId);

  const javascript = await compileJavascriptSources(sourceTexts, resolvedEditionId);
  const files = await Promise.all(TOPBAR_RANK_SOURCE_PATHS.map(async (path) => ({
    path: outputPathForSource(path),
    bytes: await compileSource(
      path,
      path.endsWith(".js") ? javascript.compiledByPath[path].source : sourceTexts[path]
    )
  })));
  const outputPathSet = new Set(files.map((file) => normalizeVpkPath(file.path)));
  const missing = TOPBAR_RANK_REQUIRED_OUTPUT_PATHS.filter((path) => !outputPathSet.has(normalizeVpkPath(path)));
  if (missing.length > 0) throw new Error(`Generated Topbar Rank payload missing: ${missing.join(", ")}`);

  return {
    editionId: resolvedEditionId,
    files,
    sourceTexts,
    closure: javascript.metadata
  };
}
