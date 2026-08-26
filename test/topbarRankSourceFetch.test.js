import test from "node:test";
import assert from "node:assert/strict";

import {
  composeTopbarRankSourceTexts,
  fetchLatestTopbarRankSourceTexts
} from "../src/topbarRankSourceFetch.js";
import {
  TOPBAR_RANK_COMPOSITION_SOURCE_PATHS,
  TOPBAR_RANK_SOURCE_PATHS
} from "../src/topbarRankSourceManifest.js";

const BAREBONES_PATH = "panorama/scripts/showrank_barebones.js";
const BAREBONES_STYLE_PATH = "panorama/styles/showrank_barebones_topbar.css";
const RUNTIME_PLACEHOLDER = "        /* PROFILE_STATS_COMMUNITY_RUNTIME: profile_stats_community/panorama/scripts/profile_stats_community.js */";
const STYLE_PLACEHOLDER = "/* PROFILE_STATS_COMMUNITY_STYLES: profile_stats_community/panorama/styles/profile_stats_community.css */";
const IDENTITY_PLACEHOLDER = "    /* VIEWED_PROFILE_IDENTITY_POLICY: scripts/viewed-profile-identity-policy.js */";

function sourceForPath(path) {
  if (path === BAREBONES_PATH) return `(function () {\n${IDENTITY_PLACEHOLDER}\nfunction install() {\n${RUNTIME_PLACEHOLDER}\n}\n}());`;
  if (path === BAREBONES_STYLE_PATH) return `.root {\n${STYLE_PLACEHOLDER}\n}`;
  if (path === TOPBAR_RANK_COMPOSITION_SOURCE_PATHS[0]) return `(function () {\n${IDENTITY_PLACEHOLDER}\n}());`;
  if (path === TOPBAR_RANK_COMPOSITION_SOURCE_PATHS[1]) return ".profile-stats {}";
  if (path === TOPBAR_RANK_COMPOSITION_SOURCE_PATHS[2]) return "    var viewedProfileIdentityPolicy = {};";
  return `source:${path}`;
}

function responseFor(url) {
  const pathname = new URL(url).pathname;
  const compositionPath = TOPBAR_RANK_COMPOSITION_SOURCE_PATHS.find((path) => pathname.endsWith(`/${path}`));
  const path = compositionPath
    || pathname.split("/topbar_rank/")[1]
    || pathname.split("/topbar_rank_no_missing/")[1]
    || pathname.split("/showrank_barebones/")[1]
    || pathname.split("/showrank_barebones_no_missing/")[1]
    || pathname.replace(/^\//, "");
  return new Response(sourceForPath(path));
}

test("fetchLatestTopbarRankSourceTexts composes the complete manifest once", async () => {
  const originalFetch = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async (url, options) => {
    requested.push({ url: String(url), cache: options?.cache });
    return responseFor(url);
  };

  try {
    const sourceTexts = await fetchLatestTopbarRankSourceTexts({
      baseUrl: "https://example.test/topbar_rank",
      cacheKey: "test"
    });
    assert.deepEqual(Object.keys(sourceTexts), TOPBAR_RANK_SOURCE_PATHS);
    assert.equal(requested.length, TOPBAR_RANK_SOURCE_PATHS.length + TOPBAR_RANK_COMPOSITION_SOURCE_PATHS.length);
    assert.equal(requested.every((request) => request.cache === "no-store"), true);
    assert.equal(requested.every((request) => request.url.includes("v=test")), true);
    assert.doesNotMatch(sourceTexts[BAREBONES_PATH], /PROFILE_STATS_COMMUNITY|VIEWED_PROFILE_IDENTITY/);
    assert.match(sourceTexts[BAREBONES_PATH], /viewedProfileIdentityPolicy/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchLatestTopbarRankSourceTexts uses the selected integrated and standalone roots", async () => {
  const originalFetch = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async (url) => {
    requested.push(String(url));
    return responseFor(url);
  };

  try {
    await fetchLatestTopbarRankSourceTexts({ editionId: "no_missing", cacheKey: "test" });
    const runtimeUrl = requested.find((url) => url.includes("/panorama/scripts/showrank_barebones.js"));
    assert.match(runtimeUrl, /\/showrank_barebones_no_missing\/panorama\/scripts\/showrank_barebones\.js/);
    assert.equal(
      requested.filter((url) => url.includes("/topbar_rank_no_missing/")).length,
      TOPBAR_RANK_SOURCE_PATHS.length - 1
    );
    assert.equal(
      requested.filter((url) => url.includes("/profile_stats_community/") || url.includes("/scripts/viewed-profile-identity-policy.js")).length,
      TOPBAR_RANK_COMPOSITION_SOURCE_PATHS.length
    );
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
      : responseFor(url);
  };

  try {
    await assert.rejects(
      () => fetchLatestTopbarRankSourceTexts({ baseUrl: "https://example.test/topbar_rank", cacheKey: "test" }),
      /Could not fetch latest Topbar Rank alert source/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("composeTopbarRankSourceTexts rejects duplicate seams", () => {
  const sourceTexts = Object.fromEntries(TOPBAR_RANK_SOURCE_PATHS.map((path) => [path, sourceForPath(path)]));
  sourceTexts[BAREBONES_PATH] = `${sourceTexts[BAREBONES_PATH]}\n${RUNTIME_PLACEHOLDER}`;
  const compositionSources = Object.fromEntries(TOPBAR_RANK_COMPOSITION_SOURCE_PATHS.map((path) => [path, sourceForPath(path)]));
  assert.throws(
    () => composeTopbarRankSourceTexts(sourceTexts, compositionSources),
    (error) => error.code === "TOPBAR_COMPOSITION" && /exactly once/.test(error.message)
  );
});
