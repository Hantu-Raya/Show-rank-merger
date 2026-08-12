import test from "node:test";
import assert from "node:assert/strict";
import { loadSynchronizedEditionSources } from "../scripts/sync-topbar-rank-payload.mjs";

const EDITION_IDS = ["showrank_barebones", "showrank_barebones_no_missing"];

function editionMap(prefix) {
  return Object.fromEntries(EDITION_IDS.map((editionId) => [editionId, { value: `${prefix}-${editionId}` }]));
}

test("payload sync uses both freshly loaded editions as one generation", async () => {
  const fresh = editionMap("fresh");
  const warnings = [];
  const result = await loadSynchronizedEditionSources({
    loadEdition: async (editionId) => fresh[editionId],
    bundledEdition: () => assert.fail("complete refresh must not use bundled sources"),
    localSourceRoots: {},
    warn: (message) => warnings.push(message)
  });

  assert.deepEqual(result, fresh);
  assert.deepEqual(warnings, []);
});

test("payload sync falls back both editions when either remote refresh fails", async () => {
  const bundled = editionMap("bundled");
  const warnings = [];
  const result = await loadSynchronizedEditionSources({
    loadEdition: async (editionId) => {
      if (editionId === "showrank_barebones_no_missing") throw new Error("404 Not Found");
      return { value: "fresh-alert" };
    },
    bundledEdition: (editionId) => bundled[editionId],
    localSourceRoots: {},
    warn: (message) => warnings.push(message)
  });

  assert.deepEqual(result, bundled);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /both Barebones editions/);
  assert.match(warnings[0], /404 Not Found/);
});

test("payload sync fails closed when configured local sources are incomplete", async () => {
  await assert.rejects(
    loadSynchronizedEditionSources({
      loadEdition: async () => { throw new Error("missing local resource"); },
      bundledEdition: () => assert.fail("local source failures must not use bundled sources"),
      localSourceRoots: { showrank_barebones: "../topbar_rank" },
      warn: () => assert.fail("local source failures must not be downgraded to warnings")
    }),
    /missing local resource/
  );
});
