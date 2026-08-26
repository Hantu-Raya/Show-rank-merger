import test from "node:test";
import assert from "node:assert/strict";

import * as sources from "../src/gamebananaSources.js";
import { SHOWRANK_RELEASES, TOPBAR_REQUIRED_VPK_PATHS, TOPBAR_SOURCE } from "../src/gamebananaSources.js";
import { validateRequiredPaths, validateTopbarArchive } from "../src/sourceValidation.js";

test("runtime source metadata tracks Top Bar Plus and the live ShowRank 10.8 files", () => {
  assert.equal(TOPBAR_SOURCE.id, "topbar_plus_v40d");
  assert.equal(TOPBAR_SOURCE.expectedFileName, "v40d_top_bar_plus.zip");
  assert.equal(TOPBAR_SOURCE.expectedVpkSha256, "986d28a49f06919d84a090e9921929075fb2b9c5a445df58de13b1e06921d10d");
  assert.deepEqual(Object.keys(SHOWRANK_RELEASES), ["alert", "no_missing"]);
  assert.deepEqual(
    Object.values(SHOWRANK_RELEASES).map((release) => [release.fileId, release.fileName, release.size, release.md5]),
    [
      ["1778935", "showrank_barebones_10_8.7z", 23230, "3609e47d6d39a70ea595aca41a1d1488"],
      ["1778934", "showrank_barebones_no_missing_10_8.7z", 19486, "bd06807b9a07aa1f9eb62569341f81ab"]
    ]
  );
  assert.deepEqual(Object.keys(sources).sort(), ["SHOWRANK_RELEASES", "TOPBAR_REQUIRED_VPK_PATHS", "TOPBAR_SOURCE"]);
});

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

test("validateTopbarArchive requires the exact outer archive identity before embedded VPK checks", async () => {
  await assert.rejects(
    () => validateTopbarArchive(
      { name: TOPBAR_SOURCE.expectedFileName },
      new Uint8Array(TOPBAR_SOURCE.expectedSize)
    ),
    /Top Bar Plus archive SHA-256 mismatch/
  );
});
