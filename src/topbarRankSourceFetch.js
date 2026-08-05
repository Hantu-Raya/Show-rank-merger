import { TOPBAR_RANK_SOURCE_BASE_URLS, TOPBAR_RANK_SOURCE_PATHS } from "./topbarRankSourceManifest.js";

function sourceUrl(baseUrl, path, cacheKey) {
  const base = String(baseUrl).replace(/\/$/, "");
  const url = new URL(`${base}/${path}`);
  if (cacheKey) url.searchParams.set("v", String(cacheKey));
  return url.href;
}

async function fetchText(url, label) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not fetch latest ${label}: ${response.status} ${response.statusText}`);
  return response.text();
}

export async function fetchLatestTopbarRankSourceTexts({
  expectedVariantId = "showrank_barebones",
  baseUrl = TOPBAR_RANK_SOURCE_BASE_URLS[expectedVariantId],
  cacheKey = Date.now()
} = {}) {
  if (!TOPBAR_RANK_SOURCE_BASE_URLS[expectedVariantId]) {
    throw new Error(`Unknown Topbar Rank edition: ${expectedVariantId}`);
  }
  if (!baseUrl) throw new Error(`Topbar Rank source URL missing for ${expectedVariantId}`);

  const entries = await Promise.all(TOPBAR_RANK_SOURCE_PATHS.map(async (path) => [
    path,
    await fetchText(sourceUrl(baseUrl, path, cacheKey), `topbar_rank source ${path}`)
  ]));
  return Object.fromEntries(entries);
}
