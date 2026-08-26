import test from "node:test";
import assert from "node:assert/strict";

import * as sources from "../src/gamebananaSources.js";
import { SHOWRANK_RELEASES, SHOWRANK_REQUIRED_VPK_PATHS, TOPBAR_REQUIRED_VPK_PATHS, TOPBAR_SOURCE } from "../src/gamebananaSources.js";
import { detectShowrankEditionBySha256, validateRequiredPaths, validateShowrankArchive, validateTopbarArchive } from "../src/sourceValidation.js";

test("runtime source metadata tracks Top Bar Plus and the live ShowRank 8/26 files", () => {
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
      ["1797773", "showrank_barebones_8_26.7z", 39992, "044e61b0c845aa167684052a7bddb7ef", "https://gamebanana.com/mods/download/681028#FileInfo_1797773", "9e780bba50720aa7964feb6252911a990b30f570726efc2be41f0d39b7f157fb"],
      ["1797774", "showrank_barebones_no_missing_8_26.7z", 36243, "eb6ba140786dd70ca6b4497cd68cb4fa", "https://gamebanana.com/mods/download/681028#FileInfo_1797774", "94daeaa5d96aee92c040e478cb00e4e957871f1b9fd0cb2064cba45ecce59d56"]
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
    /not a supported 8\/26 edition/
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
