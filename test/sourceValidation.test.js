import test from "node:test";
import assert from "node:assert/strict";

import { SHOWRANK_RELEASES, SHOWRANK_VPK_PATHS, TOPBAR_SOURCE, TOPBAR_VPK_PATHS } from "../src/gamebananaSources.js";
import { detectShowrankEditionBySha256, findPathProblems, validateShowrankArchive, validateTopbarArchive } from "../src/sourceValidation.js";

test("Top Bar Plus is pinned to the GameBanana v5 file", () => {
  assert.deepEqual(
    [TOPBAR_SOURCE.fileId, TOPBAR_SOURCE.fileName, TOPBAR_SOURCE.size, TOPBAR_SOURCE.md5, TOPBAR_SOURCE.sha256, TOPBAR_SOURCE.vpkSha256, TOPBAR_SOURCE.archiveMember],
    ["1834013", "v5_top_bar_plus.zip", 170896, "06d9aabeee4ca8a5f2f53917671916c7", "9aeb1d73474640a0ef476ec82152dfc1622c94b842396d8c660ba40c539885f8", "5ee2c41f9ec1b1664d8858e84c0506c445d25a7bc7d1932b75cef2cf5a05ae67", "pak01_dir.vpk"]
  );
  assert.equal(TOPBAR_VPK_PATHS.length, 14);
});

test("ShowRank is pinned to the GameBanana v1.0.0 files", () => {
  assert.deepEqual(
    Object.entries(SHOWRANK_RELEASES).map(([editionId, release]) => [editionId, release.fileId, release.fileName, release.size, release.md5, release.sha256, release.vpkSha256, release.archiveMember]),
    [
      ["alert", "1855939", "showrank_barebones_v100.7z", 50270, "5c5df5c10348d760c45ac6c384d7640f", "3eb4c2edb35a212a0039fb67a72d805fa2da7bfb3ed7416f0186ccdc147a9912", "8cd270b48e76679371d15ad31a9f93219dc5b49e19a7574e419ae78e79f000dd", "showrank_barebones_dir.vpk"],
      ["no_missing", "1855938", "showrank_barebones_no_missing_v100.7z", 46429, "cded4425541980f98c5b68eacbdde4f0", "be404215d870c8b956d5f47b666e0898a626f0ae4de728b69f7f42afce8cb0f9", "46f3e9b17215f8b94beae70b5035f8dbbea5fe6d283fb4d976c8db4c3b444026", "showrank_barebones_no_missing_dir.vpk"]
    ]
  );
  assert.equal(SHOWRANK_VPK_PATHS.length, 10);
});

test("the ShowRank archive hash decides the edition", () => {
  assert.equal(detectShowrankEditionBySha256(SHOWRANK_RELEASES.alert.sha256), "alert");
  assert.equal(detectShowrankEditionBySha256(SHOWRANK_RELEASES.no_missing.sha256), "no_missing");
  assert.equal(detectShowrankEditionBySha256("0".repeat(64)), "");
});

test("an unknown ShowRank archive is rejected before extraction with the expected file names", async () => {
  await assert.rejects(
    () => validateShowrankArchive({ name: "showrank_barebones_10_11.7z" }, new Uint8Array(16)),
    /not ShowRank v1\.0\.0.*showrank_barebones_v100\.7z.*showrank_barebones_no_missing_v100\.7z/
  );
});

test("a wrong Top Bar Plus archive is rejected before extraction with the expected file name", async () => {
  await assert.rejects(
    () => validateTopbarArchive({ name: "v40d_top_bar_plus.zip" }, new Uint8Array(TOPBAR_SOURCE.size)),
    /not Top Bar Plus v5.*v5_top_bar_plus\.zip/
  );
});

test("findPathProblems reports missing and unexpected paths after normalizing", () => {
  const files = [...TOPBAR_VPK_PATHS.slice(1), "panorama/scripts/extra.vjs_c"]
    .map((path) => ({ path: path.toUpperCase().replaceAll("/", "\\"), bytes: new Uint8Array() }));
  assert.deepEqual(findPathProblems(files, TOPBAR_VPK_PATHS), {
    missing: [TOPBAR_VPK_PATHS[0]],
    unexpected: ["panorama/scripts/extra.vjs_c"]
  });
  assert.deepEqual(
    findPathProblems(TOPBAR_VPK_PATHS.map((path) => ({ path, bytes: new Uint8Array() })), TOPBAR_VPK_PATHS),
    { missing: [], unexpected: [] }
  );
});
