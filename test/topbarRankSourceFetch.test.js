import test from "node:test";
import assert from "node:assert/strict";

import { fetchLatestTopbarRankSourceTexts } from "../src/topbarRankSourceFetch.js";
import { TOPBAR_RANK_SOURCE_PATHS } from "../src/topbarRankSourceManifest.js";

test("fetchLatestTopbarRankSourceTexts fetches every source path", async () => {
  const originalFetch = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async (url, options) => {
    requested.push({ url: String(url), cache: options?.cache });
    return new Response(`source:${new URL(url).pathname.split("/topbar_rank/")[1]}`);
  };

  try {
    const sourceTexts = await fetchLatestTopbarRankSourceTexts({ baseUrl: "https://example.test/topbar_rank", cacheKey: "test" });
    assert.deepEqual(Object.keys(sourceTexts), TOPBAR_RANK_SOURCE_PATHS);
    assert.equal(sourceTexts["panorama/scripts/topbar_rank_v40_hud.js"], "source:panorama/scripts/topbar_rank_v40_hud.js");
    assert.equal(requested.length, TOPBAR_RANK_SOURCE_PATHS.length);
    assert.equal(requested.every((request) => request.cache === "no-store"), true);
    assert.equal(requested.every((request) => request.url.includes("v=test")), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
