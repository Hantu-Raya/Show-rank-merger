import test from "node:test";
import assert from "node:assert/strict";

import { TOPBAR_REQUIRED_VPK_PATHS } from "../src/gamebananaSources.js";
import { validateRequiredPaths } from "../src/sourceValidation.js";

test("validateRequiredPaths reports missing topbar paths", () => {
  const files = TOPBAR_REQUIRED_VPK_PATHS.slice(1).map((path) => ({ path, bytes: new Uint8Array() }));
  const result = validateRequiredPaths(files, TOPBAR_REQUIRED_VPK_PATHS);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [TOPBAR_REQUIRED_VPK_PATHS[0]]);
});

test("validateRequiredPaths accepts normalized topbar paths", () => {
  const files = TOPBAR_REQUIRED_VPK_PATHS.map((path) => ({ path: path.toUpperCase().replaceAll("/", "\\"), bytes: new Uint8Array() }));
  assert.deepEqual(validateRequiredPaths(files, TOPBAR_REQUIRED_VPK_PATHS), { ok: true, missing: [] });
});
