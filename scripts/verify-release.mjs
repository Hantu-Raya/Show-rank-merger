// End-to-end check with the real GameBanana files: builds both editions exactly as the page does and
// writes the merged VPKs plus a JSON report to tmp-smoke/.
// Uses local copies when TOPBAR_ARCHIVE / SHOWRANK_ARCHIVE / SHOWRANK_NO_MISSING_ARCHIVE are set, else downloads.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

import { buildMergedRankVpk } from "../src/buildMergedRankVpk.js";
import { SHOWRANK_RELEASES, TOPBAR_SOURCE } from "../src/gamebananaSources.js";
import { MERGED_LAYOUTS, MERGED_LAYOUT_PATHS } from "../src/mergedLayouts.js";
import { normalizeVpkPath } from "../src/rankMerge.js";
import { sha256Hex } from "../src/sha256.js";
import { extractPanoramaLayoutSource } from "../src/source2ResourceReader.js";
import { validateShowrankArchive, validateTopbarArchive } from "../src/sourceValidation.js";
import { parseVpk } from "../src/vpkReader.js";

const LOCAL_PATHS = {
  topbar: process.env.TOPBAR_ARCHIVE,
  alert: process.env.SHOWRANK_ARCHIVE,
  no_missing: process.env.SHOWRANK_NO_MISSING_ARCHIVE
};

async function load(key, release) {
  if (LOCAL_PATHS[key]) {
    console.log(`Reading ${LOCAL_PATHS[key]}`);
    return { name: basename(LOCAL_PATHS[key]), bytes: new Uint8Array(readFileSync(LOCAL_PATHS[key])) };
  }
  console.log(`Downloading ${release.fileName} (${release.downloadUrl})`);
  const response = await fetch(release.downloadUrl, { redirect: "follow" });
  assert.equal(response.ok, true, `${release.downloadUrl} returned ${response.status}`);
  return { name: release.fileName, bytes: new Uint8Array(await response.arrayBuffer()) };
}

function byPath(files) {
  return new Map(files.map((file) => [normalizeVpkPath(file.path), file.bytes]));
}

const outDir = new URL("../tmp-smoke/", import.meta.url);
mkdirSync(outDir, { recursive: true });
const topbar = await load("topbar", TOPBAR_SOURCE);
const topbarFiles = byPath((await validateTopbarArchive({ name: topbar.name }, topbar.bytes)).parsed.files);
const report = { topbar: { file: topbar.name, sha256: await sha256Hex(topbar.bytes) }, editions: {} };

for (const [editionId, release] of Object.entries(SHOWRANK_RELEASES)) {
  const showrank = await load(editionId, release);
  const showrankFiles = byPath((await validateShowrankArchive({ name: showrank.name }, showrank.bytes)).parsed.files);
  const merged = await buildMergedRankVpk({
    topbarFile: { name: topbar.name },
    topbarBytes: topbar.bytes,
    showrankFile: { name: showrank.name },
    showrankBytes: showrank.bytes
  });
  assert.equal(merged.editionId, editionId);
  assert.equal(merged.filename, release.outputFileName);

  const output = byPath(parseVpk(merged.bytes).files);
  const expectedPaths = new Set([...topbarFiles.keys(), ...showrankFiles.keys()]);
  assert.deepEqual([...output.keys()].sort(), [...expectedPaths].sort());
  let copied = 0;
  for (const [path, bytes] of output) {
    if (MERGED_LAYOUT_PATHS.includes(path)) {
      assert.equal(extractPanoramaLayoutSource(bytes), MERGED_LAYOUTS[editionId][path], `${path} is not the merged layout`);
      continue;
    }
    const source = topbarFiles.get(path) || showrankFiles.get(path);
    assert.deepEqual(bytes, source, `${path} changed while copying`);
    copied += 1;
  }

  writeFileSync(new URL(merged.filename, outDir), merged.bytes);
  report.editions[editionId] = {
    showrank: { file: showrank.name, sha256: await sha256Hex(showrank.bytes) },
    output: merged.filename,
    outputSha256: await sha256Hex(merged.bytes),
    outputBytes: merged.bytes.byteLength,
    entries: output.size,
    copiedUnchanged: copied,
    mergedLayouts: MERGED_LAYOUT_PATHS
  };
  console.log(`OK ${editionId}: ${merged.filename}, ${output.size} entries, ${copied} copied unchanged, 2 merged layouts`);
}

writeFileSync(new URL("report.json", outDir), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${new URL("report.json", outDir).pathname}`);
