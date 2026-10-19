import test from "node:test";
import assert from "node:assert/strict";

import { MERGED_LAYOUT_PATHS } from "../src/mergedLayouts.js";
import { SHOWRANK_VPK_PATHS, TOPBAR_VPK_PATHS } from "../src/gamebananaSources.js";
import { mergeReleaseFiles, normalizeVpkPath } from "../src/rankMerge.js";
import { extractPanoramaLayoutSource } from "../src/source2ResourceReader.js";
import { parseVpk } from "../src/vpkReader.js";
import { writeVpk } from "../src/vpkWriter.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function filesFor(paths, owner) {
  return paths.map((path) => ({ path, bytes: encoder.encode(`${owner}:${path}`) }));
}

const layouts = Object.fromEntries(MERGED_LAYOUT_PATHS.map((path) => [path, `<root><!-- merged ${path} --></root>`]));

test("normalizeVpkPath lowercases and normalizes separators", () => {
  assert.equal(normalizeVpkPath("\\Panorama\\Layout\\HUD.vxml_c"), "panorama/layout/hud.vxml_c");
});

test("the merge keeps every resource of both mods and replaces only the two shared layouts", () => {
  const { files, replacedPaths } = mergeReleaseFiles({
    topbarFiles: filesFor(TOPBAR_VPK_PATHS, "topbar"),
    showrankFiles: filesFor(SHOWRANK_VPK_PATHS, "showrank"),
    layouts
  });

  assert.equal(files.length, 22);
  assert.deepEqual(replacedPaths, MERGED_LAYOUT_PATHS);
  const byPath = new Map(files.map((file) => [file.path, file.bytes]));
  for (const path of TOPBAR_VPK_PATHS.filter((entry) => !MERGED_LAYOUT_PATHS.includes(entry))) {
    assert.equal(decoder.decode(byPath.get(path)), `topbar:${path}`);
  }
  for (const path of SHOWRANK_VPK_PATHS.filter((entry) => !MERGED_LAYOUT_PATHS.includes(entry))) {
    assert.equal(decoder.decode(byPath.get(path)), `showrank:${path}`);
  }
  for (const path of MERGED_LAYOUT_PATHS) {
    assert.equal(extractPanoramaLayoutSource(byPath.get(path)), layouts[path]);
  }

  const reparsed = parseVpk(writeVpk(files));
  assert.deepEqual(
    reparsed.files.map((file) => normalizeVpkPath(file.path)).sort(),
    files.map((file) => file.path).sort()
  );
});

test("any other shared path stops the merge", () => {
  assert.throws(() => mergeReleaseFiles({
    topbarFiles: filesFor(TOPBAR_VPK_PATHS, "topbar"),
    showrankFiles: filesFor([...SHOWRANK_VPK_PATHS, "panorama/styles/hud.vcss_c"], "showrank"),
    layouts
  }), /panorama\/styles\/hud\.vcss_c/);
});

test("a missing shared layout stops the merge", () => {
  assert.throws(() => mergeReleaseFiles({
    topbarFiles: filesFor(TOPBAR_VPK_PATHS.filter((path) => path !== MERGED_LAYOUT_PATHS[1]), "topbar"),
    showrankFiles: filesFor(SHOWRANK_VPK_PATHS, "showrank"),
    layouts
  }), /citadel_hud_top_bar_player/);
});

test("a duplicated path inside one archive stops the merge", () => {
  assert.throws(() => mergeReleaseFiles({
    topbarFiles: [...filesFor(TOPBAR_VPK_PATHS, "topbar"), { path: "Panorama\\Scripts\\TOPBAR_RANK_HUD.vjs_c", bytes: new Uint8Array(1) }],
    showrankFiles: filesFor(SHOWRANK_VPK_PATHS, "showrank"),
    layouts
  }), /duplicate/i);
});
