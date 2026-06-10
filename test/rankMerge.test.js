import test from "node:test";
import assert from "node:assert/strict";

import { mergeFilesWithPriority, normalizeVpkPath } from "../src/rankMerge.js";
import { parseVpk } from "../src/vpkReader.js";
import { writeVpk } from "../src/vpkWriter.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

test("normalizeVpkPath lowercases and normalizes separators", () => {
  assert.equal(normalizeVpkPath("\\Panorama\\Layout\\HUD.vxml_c"), "panorama/layout/hud.vxml_c");
});

test("mergeFilesWithPriority overwrites normalized conflicts", () => {
  const result = mergeFilesWithPriority(
    [{ path: "panorama/layout/a.vxml_c", bytes: encoder.encode("base") }],
    [{ path: "Panorama/Layout/A.vxml_c", bytes: encoder.encode("priority") }]
  );

  assert.equal(result.files.length, 1);
  assert.equal(decoder.decode(result.files[0].bytes), "priority");
  assert.deepEqual(result.overwrittenPaths, [{
    path: "panorama/layout/a.vxml_c",
    basePath: "panorama/layout/a.vxml_c",
    priorityPath: "Panorama/Layout/A.vxml_c"
  }]);

  const reparsed = parseVpk(writeVpk(result.files));
  assert.equal(normalizeVpkPath(reparsed.files[0].path), "panorama/layout/a.vxml_c");
  assert.equal(decoder.decode(reparsed.files[0].bytes), "priority");
});
