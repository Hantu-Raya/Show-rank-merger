import test from "node:test";
import assert from "node:assert/strict";

import { fetchLatestTopbarRankSourceTexts } from "../src/topbarRankSourceFetch.js";
import { TOPBAR_RANK_SOURCE_BASE_URLS, TOPBAR_RANK_SOURCE_PATHS } from "../src/topbarRankSourceManifest.js";

const EDITION_IDS = ["showrank_barebones", "showrank_barebones_no_missing"];

test("fetchLatestTopbarRankSourceTexts fetches the selected edition's complete 22-resource manifest", async () => {
  const originalFetch = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async (url, options) => {
    const value = String(url);
    requested.push({ url: value, cache: options?.cache });
    return new Response(`source:${new URL(value).pathname}`);
  };

  try {
    for (const expectedVariantId of EDITION_IDS) {
      requested.length = 0;
      const sourceTexts = await fetchLatestTopbarRankSourceTexts({ expectedVariantId, cacheKey: "test" });
      assert.deepEqual(Object.keys(sourceTexts), TOPBAR_RANK_SOURCE_PATHS);
      assert.equal(requested.length, 22);
      assert.equal(requested.every((request) => request.cache === "no-store"), true);
      for (const path of TOPBAR_RANK_SOURCE_PATHS) {
        assert.equal(
          requested.some((request) => request.url.startsWith(`${TOPBAR_RANK_SOURCE_BASE_URLS[expectedVariantId]}/${path}?v=test`)),
          true,
          `${expectedVariantId} did not request ${path}`
        );
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchLatestTopbarRankSourceTexts rejects a failed selected-edition source request", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const pathname = new URL(url).pathname;
    return pathname.endsWith(TOPBAR_RANK_SOURCE_PATHS[0])
      ? new Response("missing", { status: 404, statusText: "Not Found" })
      : new Response("source");
  };

  try {
    await assert.rejects(
      () => fetchLatestTopbarRankSourceTexts({ expectedVariantId: "showrank_barebones_no_missing", cacheKey: "test" }),
      /Could not fetch latest topbar_rank source/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchLatestTopbarRankSourceTexts rejects an unknown edition without fetching", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response("source");
  };

  try {
    await assert.rejects(
      () => fetchLatestTopbarRankSourceTexts({ expectedVariantId: "unknown" }),
      /Unknown Topbar Rank edition: unknown/
    );
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
