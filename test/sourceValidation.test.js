import test from "node:test";
import assert from "node:assert/strict";

import { SHOWRANK_SOURCES, TOPBAR_REQUIRED_VPK_PATHS } from "../src/gamebananaSources.js";
import { detectShowrankVariantBySha256, validateRequiredPaths } from "../src/sourceValidation.js";

test("validateRequiredPaths reports missing topbar paths", () => {
  const files = TOPBAR_REQUIRED_VPK_PATHS.slice(1).map((path) => ({ path, bytes: new Uint8Array() }));
  const result = validateRequiredPaths(files, TOPBAR_REQUIRED_VPK_PATHS);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [TOPBAR_REQUIRED_VPK_PATHS[0]]);
});

test("detectShowrankVariantBySha256 maps supported variants", () => {
  for (const [variantId, source] of Object.entries(SHOWRANK_SOURCES)) {
    assert.equal(detectShowrankVariantBySha256(source.expectedSha256), variantId);
  }
  assert.equal(detectShowrankVariantBySha256("00"), "");
});
