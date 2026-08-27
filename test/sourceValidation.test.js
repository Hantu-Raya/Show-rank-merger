import test from "node:test";
import assert from "node:assert/strict";

import * as sources from "../src/gamebananaSources.js";
import { SHOWRANK_RELEASES, SHOWRANK_REQUIRED_VPK_PATHS, TOPBAR_REQUIRED_VPK_PATHS, TOPBAR_SOURCE } from "../src/gamebananaSources.js";
import { detectShowrankEditionBySha256, validateRequiredPaths, validateShowrankArchive, validateTopbarArchive } from "../src/sourceValidation.js";

test("runtime source metadata tracks Top Bar Plus and the live ShowRank 8/27 files", () => {
  assert.equal(TOPBAR_SOURCE.id, "topbar_plus_v40d");
  assert.equal(TOPBAR_SOURCE.expectedFileName, "v40d_top_bar_plus.zip");
  assert.equal(TOPBAR_SOURCE.expectedVpkSha256, "986d28a49f06919d84a090e9921929075fb2b9c5a445df58de13b1e06921d10d");
  assert.deepEqual(Object.keys(SHOWRANK_RELEASES), ["alert", "no_missing"]);
  assert.deepEqual(
    Object.values(SHOWRANK_RELEASES).map((release) => [
      release.fileId,
      release.fileName,
      release.size,
      release.md5,
      release.modUrl,
      release.vpkSha256
    ]),
    [
      ["1798716", "showrank_barebones_8_27.7z", 41279, "300be4886f5e860f063b18a0a6faef7f", "https://gamebanana.com/mods/download/681028#FileInfo_1798716", "5bfdcac7a838177913be40325f3931df8d61caac0fa1671ebee0d02065cd21e7"],
      ["1798715", "showrank_barebones_no_missing_8_27.7z", 37501, "afb4e108546fa556760ab60278baf929", "https://gamebanana.com/mods/download/681028#FileInfo_1798715", "b92db2be0f9437ae5e62055cc9f5d734fa850d467f4931973860d3dd24d630d6"]
    ]
  );
  assert.equal(SHOWRANK_REQUIRED_VPK_PATHS.length, 9);
  assert.deepEqual(Object.keys(sources).sort(), ["SHOWRANK_RELEASES", "SHOWRANK_REQUIRED_VPK_PATHS", "TOPBAR_REQUIRED_VPK_PATHS", "TOPBAR_SOURCE"]);
});

test("ShowRank archive SHA-256 selects the required edition", () => {
  assert.equal(detectShowrankEditionBySha256(SHOWRANK_RELEASES.alert.sha256), "alert");
  assert.equal(detectShowrankEditionBySha256(SHOWRANK_RELEASES.no_missing.sha256), "no_missing");
  assert.equal(detectShowrankEditionBySha256("0".repeat(64)), "");
});

test("validateShowrankArchive rejects unsupported archives before extraction", async () => {
  await assert.rejects(
    () => validateShowrankArchive({ name: "unknown.7z" }, new Uint8Array(16), "alert"),
    /not a supported 8\/27 edition/
  );
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
