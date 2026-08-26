import test from "node:test";
import assert from "node:assert/strict";
import { loadSynchronizedEditionSources } from "../scripts/sync-topbar-rank-payload.mjs";

const EDITION_IDS = ["alert", "no_missing"];

function editionMap(prefix) {
  return Object.fromEntries(EDITION_IDS.map((editionId) => [editionId, { value: `${prefix}-${editionId}` }]));
}

test("payload sync uses both freshly loaded editions as one generation", async () => {
  const fresh = editionMap("fresh");
  const warnings = [];
  const result = await loadSynchronizedEditionSources({
    loadFresh: async () => fresh,
    bundled: editionMap("bundled"),
    localOverrides: false,
    warn: (message) => warnings.push(message)
  });

  assert.deepEqual(result, fresh);
  assert.deepEqual(warnings, []);
});

test("payload sync falls back both editions when either remote refresh fails", async () => {
  const bundled = editionMap("bundled");
  const warnings = [];
  const result = await loadSynchronizedEditionSources({
    loadFresh: async () => {
      throw new Error("404 Not Found");
    },
    bundled,
    localOverrides: false,
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
      loadFresh: async () => { throw new Error("missing local resource"); },
      bundled: editionMap("bundled"),
      localOverrides: true,
      warn: () => assert.fail("local source failures must not be downgraded to warnings")
    }),
    /missing local resource/
  );
});
