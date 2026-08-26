import {
  TOPBAR_RANK_BAREBONES_SOURCE_BASE_URLS,
  TOPBAR_RANK_COMPOSITION_SOURCE_BASE_URL,
  TOPBAR_RANK_COMPOSITION_SOURCE_PATHS,
  TOPBAR_RANK_DEFAULT_EDITION,
  TOPBAR_RANK_SOURCE_BASE_URLS,
  TOPBAR_RANK_SOURCE_PATHS,
  assertTopbarRankEdition
} from "./topbarRankSourceManifest.js";

const BAREBONES_SOURCE_PATH = "panorama/scripts/showrank_barebones.js";
const BAREBONES_STYLE_PATH = "panorama/styles/showrank_barebones_topbar.css";
const PROFILE_RUNTIME_PATH = TOPBAR_RANK_COMPOSITION_SOURCE_PATHS[0];
const PROFILE_STYLE_PATH = TOPBAR_RANK_COMPOSITION_SOURCE_PATHS[1];
const IDENTITY_POLICY_PATH = TOPBAR_RANK_COMPOSITION_SOURCE_PATHS[2];
const RUNTIME_PLACEHOLDER = "        /* PROFILE_STATS_COMMUNITY_RUNTIME: profile_stats_community/panorama/scripts/profile_stats_community.js */";
const STYLE_PLACEHOLDER = "/* PROFILE_STATS_COMMUNITY_STYLES: profile_stats_community/panorama/styles/profile_stats_community.css */";
const IDENTITY_POLICY_PLACEHOLDER = "    /* VIEWED_PROFILE_IDENTITY_POLICY: scripts/viewed-profile-identity-policy.js */";
const UNRESOLVED_PLACEHOLDERS = [
  "PROFILE_STATS_COMMUNITY_RUNTIME",
  "PROFILE_STATS_COMMUNITY_STYLES",
  "VIEWED_PROFILE_IDENTITY_POLICY"
];

function sourceUrl(baseUrl, path, cacheKey) {
  const base = String(baseUrl).replace(/\/$/, "");
  const url = new URL(`${base}/${path}`);
  if (cacheKey) url.searchParams.set("v", String(cacheKey));
  return url.href;
}

function sourceBaseUrlForPath(editionId, path, baseUrl) {
  if (baseUrl) return baseUrl;
  return path === BAREBONES_SOURCE_PATH
    ? TOPBAR_RANK_BAREBONES_SOURCE_BASE_URLS[editionId]
    : TOPBAR_RANK_SOURCE_BASE_URLS[editionId];
}

function compositionBaseUrl(baseUrl, override) {
  return override || baseUrl || TOPBAR_RANK_COMPOSITION_SOURCE_BASE_URL;
}

async function fetchText(url, label) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not fetch latest ${label}: ${response.status} ${response.statusText}`);
  const text = await response.text();
  if (!text) throw new Error(`Latest ${label} was empty`);
  return text;
}

function assertText(label, text) {
  if (typeof text !== "string" || text.length === 0) throw new Error(`${label} must be non-empty text`);
  if (text.charCodeAt(0) === 0xfeff) throw new Error(`${label} must be UTF-8 without a byte-order mark`);
}

function composeText(template, fragment, placeholder, label) {
  assertText(`${label} template`, template);
  assertText(`${label} fragment`, fragment);
  const newline = template.includes("\r\n") ? "\r\n" : "\n";
  const normalizedTemplate = template.replace(/\r\n?/g, "\n");
  const normalizedFragment = fragment.replace(/\r\n?/g, "\n");
  const normalizedPlaceholder = placeholder.replace(/\r\n?/g, "\n");
  const first = normalizedTemplate.indexOf(normalizedPlaceholder);
  const second = first < 0 ? -1 : normalizedTemplate.indexOf(normalizedPlaceholder, first + normalizedPlaceholder.length);
  if (first < 0 || second >= 0) throw new Error(`${label} template must contain its placeholder exactly once`);
  if (normalizedFragment.includes(normalizedPlaceholder)) throw new Error(`${label} fragment must not contain its host placeholder`);
  const fragmentWithoutFinalNewline = normalizedFragment.endsWith("\n")
    ? normalizedFragment.slice(0, -1)
    : normalizedFragment;
  const composed = normalizedTemplate.slice(0, first)
    + fragmentWithoutFinalNewline
    + normalizedTemplate.slice(first + normalizedPlaceholder.length);
  if (composed.includes(normalizedPlaceholder)) throw new Error(`${label} composition left an unresolved placeholder`);
  return newline === "\r\n" ? composed.replace(/\n/g, "\r\n") : composed;
}

function assertNoUnresolvedCompositionPlaceholders(sourceTexts) {
  for (const [path, text] of Object.entries(sourceTexts)) {
    for (const marker of UNRESOLVED_PLACEHOLDERS) {
      if (text.includes(marker)) throw new Error(`${path} contains unresolved composition placeholder: ${marker}`);
    }
  }
}

export function composeTopbarRankSourceTexts(sourceTexts, compositionSources) {
  const composed = { ...sourceTexts };
  const identityPolicy = compositionSources[IDENTITY_POLICY_PATH];
  const profileRuntime = compositionSources[PROFILE_RUNTIME_PATH];
  const profileStyle = compositionSources[PROFILE_STYLE_PATH];
  try {
    const runtimeHost = composeText(
      composed[BAREBONES_SOURCE_PATH],
      identityPolicy,
      IDENTITY_POLICY_PLACEHOLDER,
      "barebones identity policy"
    );
    const nestedProfileRuntime = composeText(
      profileRuntime,
      "    /* viewed-profile identity policy is supplied by the barebones host */",
      IDENTITY_POLICY_PLACEHOLDER,
      "nested Profile Stats Community identity policy"
    );
    composed[BAREBONES_SOURCE_PATH] = composeText(
      runtimeHost,
      nestedProfileRuntime,
      RUNTIME_PLACEHOLDER,
      "barebones runtime"
    );
    composed[BAREBONES_STYLE_PATH] = composeText(
      composed[BAREBONES_STYLE_PATH],
      profileStyle,
      STYLE_PLACEHOLDER,
      "barebones stylesheet"
    );
    assertNoUnresolvedCompositionPlaceholders(composed);
    return composed;
  } catch (error) {
    error.code = "TOPBAR_COMPOSITION";
    throw error;
  }
}

export async function fetchLatestTopbarRankSourceTexts({
  editionId = TOPBAR_RANK_DEFAULT_EDITION,
  baseUrl,
  compositionBaseUrl: compositionBaseUrlOverride,
  cacheKey = Date.now()
} = {}) {
  const resolvedEditionId = assertTopbarRankEdition(editionId);
  const sourceEntries = await Promise.all(TOPBAR_RANK_SOURCE_PATHS.map(async (path) => [
    path,
    await fetchText(
      sourceUrl(sourceBaseUrlForPath(resolvedEditionId, path, baseUrl), path, cacheKey),
      `Topbar Rank ${resolvedEditionId} source ${path}`
    )
  ]));
  const sourceTexts = Object.fromEntries(sourceEntries);
  const compositionRoot = compositionBaseUrl(baseUrl, compositionBaseUrlOverride);
  const compositionEntries = await Promise.all(TOPBAR_RANK_COMPOSITION_SOURCE_PATHS.map(async (path) => [
    path,
    await fetchText(
      sourceUrl(compositionRoot, path, cacheKey),
      `Topbar Rank composition source ${path}`
    )
  ]));
  return composeTopbarRankSourceTexts(sourceTexts, Object.fromEntries(compositionEntries));
}
