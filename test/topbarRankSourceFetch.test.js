import test from "node:test";
import assert from "node:assert/strict";

import { fetchLatestTopbarRankSourceTexts, SHOWRANK_CANONICAL_SOURCE_URL } from "../src/topbarRankSourceFetch.js";
import { TOPBAR_RANK_SOURCE_PATHS } from "../src/topbarRankSourceManifest.js";

function sourceForUrl(url) {
  const pathname = new URL(url).pathname;
  if (pathname.endsWith("/panorama/scripts/showrank_common.js")) return "canonical-bridge";
  return `source:${pathname.split("/topbar_rank/")[1]}`;
}

test("fetchLatestTopbarRankSourceTexts fetches the manifest and canonical bridge", async () => {
  const originalFetch = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async (url, options) => {
    requested.push({ url: String(url), cache: options?.cache });
    return new Response(sourceForUrl(url));
  };

  try {
    const sourceTexts = await fetchLatestTopbarRankSourceTexts({ baseUrl: "https://example.test/topbar_rank", cacheKey: "test" });
    assert.deepEqual(Object.keys(sourceTexts), TOPBAR_RANK_SOURCE_PATHS);
    assert.equal(sourceTexts["panorama/scripts/showrank_common.js"], "canonical-bridge");
    assert.equal(requested.length, TOPBAR_RANK_SOURCE_PATHS.length + 1);
    assert.equal(requested.every((request) => request.cache === "no-store"), true);
    assert.equal(requested.every((request) => request.url.includes("v=test")), true);
    assert.equal(requested.some((request) => request.url.includes("/showrank/panorama/scripts/showrank_common.js")), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("default fetch reads canonical ShowRank from its own repository", async () => {
  const originalFetch = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async (url) => {
    requested.push(String(url));
    return new Response(sourceForUrl(url));
  };

  try {
    await fetchLatestTopbarRankSourceTexts({ cacheKey: "test" });
    assert.equal(requested.some((url) => url.startsWith(`${SHOWRANK_CANONICAL_SOURCE_URL}?v=test`)), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchLatestTopbarRankSourceTexts rejects a non-canonical copied bridge", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const pathname = new URL(url).pathname;
    if (pathname.includes("/showrank/")) return new Response("canonical");
    if (pathname.endsWith("/panorama/scripts/showrank_common.js")) return new Response("modified-copy");
    return new Response("source");
  };

  try {
    await assert.rejects(
      () => fetchLatestTopbarRankSourceTexts({ baseUrl: "https://example.test/topbar_rank", cacheKey: "test" }),
      /differs byte-for-byte/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
