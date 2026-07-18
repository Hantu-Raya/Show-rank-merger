import { TOPBAR_RANK_SOURCE_BASE_URL, TOPBAR_RANK_SOURCE_PATHS } from "./topbarRankSourceManifest.js";

export const SHOWRANK_CANONICAL_SOURCE_URL = "https://raw.githubusercontent.com/Hantu-Raya/showrank/main/panorama/scripts/showrank_common.js";

function sourceUrl(baseUrl, path, cacheKey) {
  const base = String(baseUrl || TOPBAR_RANK_SOURCE_BASE_URL).replace(/\/$/, "");
  const url = new URL(`${base}/${path}`);
  if (cacheKey) url.searchParams.set("v", String(cacheKey));
  return url.href;
}

function canonicalShowrankUrl(baseUrl, cacheKey, canonicalUrl) {
  if (canonicalUrl) {
    const url = new URL(canonicalUrl);
    if (cacheKey) url.searchParams.set("v", String(cacheKey));
    return url.href;
  }
  if (baseUrl === TOPBAR_RANK_SOURCE_BASE_URL) {
    const url = new URL(SHOWRANK_CANONICAL_SOURCE_URL);
    if (cacheKey) url.searchParams.set("v", String(cacheKey));
    return url.href;
  }
  const topbarBase = String(baseUrl).replace(/\/$/, "");
  const canonicalBase = topbarBase.replace(/\/topbar_rank$/, "/showrank");
  return sourceUrl(canonicalBase, "panorama/scripts/showrank_common.js", cacheKey);
}

async function fetchText(url, label) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not fetch latest ${label}: ${response.status} ${response.statusText}`);
  return response.text();
}

export async function fetchLatestTopbarRankSourceTexts({
  baseUrl = TOPBAR_RANK_SOURCE_BASE_URL,
  canonicalUrl = "",
  cacheKey = Date.now()
} = {}) {
  const [entries, canonicalBridge] = await Promise.all([
    Promise.all(TOPBAR_RANK_SOURCE_PATHS.map(async (path) => [
      path,
      await fetchText(sourceUrl(baseUrl, path, cacheKey), `topbar_rank source ${path}`)
    ])),
    fetchText(canonicalShowrankUrl(baseUrl, cacheKey, canonicalUrl), "canonical ShowRank bridge")
  ]);
  const sourceTexts = Object.fromEntries(entries);
  if (sourceTexts["panorama/scripts/showrank_common.js"] !== canonicalBridge) {
    throw new Error("Latest topbar_rank showrank_common.js differs byte-for-byte from canonical ShowRank");
  }
  return sourceTexts;
}
