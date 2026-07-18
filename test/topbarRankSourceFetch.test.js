import test from "node:test";
import assert from "node:assert/strict";

import { fetchLatestTopbarRankSourceTexts } from "../src/topbarRankSourceFetch.js";
import { TOPBAR_RANK_SOURCE_PATHS } from "../src/topbarRankSourceManifest.js";

test("fetchLatestTopbarRankSourceTexts fetches the complete manifest", async () => {
  const originalFetch = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async (url, options) => {
    const value = String(url);
    requested.push({ url: value, cache: options?.cache });
    return new Response(`source:${new URL(value).pathname.split("/topbar_rank/")[1]}`);
  };

  try {
    const sourceTexts = await fetchLatestTopbarRankSourceTexts({ baseUrl: "https://example.test/topbar_rank", cacheKey: "test" });
    assert.deepEqual(Object.keys(sourceTexts), TOPBAR_RANK_SOURCE_PATHS);
    assert.equal(requested.length, TOPBAR_RANK_SOURCE_PATHS.length);
    assert.equal(requested.every((request) => request.cache === "no-store"), true);
    assert.equal(requested.every((request) => request.url.includes("v=test")), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchLatestTopbarRankSourceTexts rejects a failed source request", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const pathname = new URL(url).pathname;
    return pathname.endsWith(TOPBAR_RANK_SOURCE_PATHS[0])
      ? new Response("missing", { status: 404, statusText: "Not Found" })
      : new Response("source");
  };

  try {
    await assert.rejects(
      () => fetchLatestTopbarRankSourceTexts({ baseUrl: "https://example.test/topbar_rank", cacheKey: "test" }),
      /Could not fetch latest topbar_rank source/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
