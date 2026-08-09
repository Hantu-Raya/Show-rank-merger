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

test("validateRequiredPaths accepts normalized topbar paths", () => {
  const files = TOPBAR_REQUIRED_VPK_PATHS.map((path) => ({ path: path.toUpperCase().replaceAll("/", "\\"), bytes: new Uint8Array() }));
  assert.deepEqual(validateRequiredPaths(files, TOPBAR_REQUIRED_VPK_PATHS), { ok: true, missing: [] });
});

test("detectShowrankVariantBySha256 recognizes both Barebones editions", () => {
  assert.deepEqual(Object.keys(SHOWRANK_SOURCES), [
    "showrank_barebones",
    "showrank_barebones_no_missing"
  ]);
  for (const [variantId, source] of Object.entries(SHOWRANK_SOURCES)) {
    assert.equal(detectShowrankVariantBySha256(source.expectedSha256), variantId);
  }
  assert.equal(detectShowrankVariantBySha256("unknown"), "");
});

test("current ShowRank 10.8 GameBanana archives map to the selected editions", () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(SHOWRANK_SOURCES).map(([variantId, source]) => [
      variantId,
      {
        fileId: source.fileId,
        modUrl: source.modUrl,
        fileName: source.expectedFileName,
        size: source.expectedSize,
        sha256: source.expectedSha256,
        vpkSha256: source.expectedVpkSha256,
        archiveMember: source.archiveMember,
        detected: detectShowrankVariantBySha256(source.expectedSha256)
      }
    ])),
    {
      showrank_barebones: {
        fileId: "1778935",
        modUrl: "https://gamebanana.com/mods/download/681028#FileInfo_1778935",
        fileName: "showrank_barebones_10_8.7z",
        size: 23230,
        sha256: "016f1e6470785b1f78c2da4df956ca54bb477f84bf812cd1936b87bba837263b",
        vpkSha256: "7f34d6440ffecc0400119b101474e97e7c91e664a8a65a06a887cf605e6290d7",
        archiveMember: "showrank_barebones_dir.vpk",
        detected: "showrank_barebones"
      },
      showrank_barebones_no_missing: {
        fileId: "1778934",
        modUrl: "https://gamebanana.com/mods/download/681028#FileInfo_1778934",
        fileName: "showrank_barebones_no_missing_10_8.7z",
        size: 19486,
        sha256: "ba2cf9c965884859f0520ef126e03b60d69c32cb6a6efdf70b5d4ac69d115558",
        vpkSha256: "2d46ddf5285fbb6b9bffcb94b7b02cc3286b345ed7a1da310a193901327662f9",
        archiveMember: "showrank_barebones_no_missing_dir.vpk",
        detected: "showrank_barebones_no_missing"
      }
    }
  );
});
