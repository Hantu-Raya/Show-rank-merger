import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TOPBAR_RANK_SOURCE_BASE_URLS, TOPBAR_RANK_SOURCE_PATHS } from "../src/topbarRankSourceManifest.js";
import {
  TOPBAR_RANK_NO_MISSING_SOURCE_OVERRIDES,
  TOPBAR_RANK_SOURCE_TEXTS
} from "../src/payload/topbarRankSources.generated.js";

const EDITION_IDS = Object.keys(TOPBAR_RANK_SOURCE_BASE_URLS);
const LOCAL_SOURCE_ROOTS = {
  showrank_barebones: process.env.TOPBAR_RANK_SOURCE_ROOT || "",
  showrank_barebones_no_missing: process.env.TOPBAR_RANK_NO_MISSING_SOURCE_ROOT || ""
};
const OUTPUT_ROOT = new URL("../src/payload/topbar_rank/", import.meta.url);
const GENERATED_OUTPUT = new URL("../src/payload/topbarRankSources.generated.js", import.meta.url);

async function fetchText(editionId, path) {
  const localSourceRoot = LOCAL_SOURCE_ROOTS[editionId];
  if (localSourceRoot) return readFile(join(localSourceRoot, path), "utf8");

  const baseUrl = TOPBAR_RANK_SOURCE_BASE_URLS[editionId];
  const url = `${baseUrl.replace(/\/$/, "")}/${path}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "rank-merger-payload-sync"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}
function bundledSourceTexts(editionId) {
  if (editionId === "showrank_barebones") return TOPBAR_RANK_SOURCE_TEXTS;
  return { ...TOPBAR_RANK_SOURCE_TEXTS, ...TOPBAR_RANK_NO_MISSING_SOURCE_OVERRIDES };
}

async function loadEditionSources(editionId) {
  try {
    return Object.fromEntries(await Promise.all(
      TOPBAR_RANK_SOURCE_PATHS.map(async (path) => [path, await fetchText(editionId, path)])
    ));
  } catch (error) {
    if (LOCAL_SOURCE_ROOTS[editionId]) throw error;
    console.warn(`Could not refresh ${editionId}; keeping bundled payload: ${error.message}`);
    return bundledSourceTexts(editionId);
  }
}


const sourceTextsByEdition = {};
for (const editionId of EDITION_IDS) {
  sourceTextsByEdition[editionId] = await loadEditionSources(editionId);
}

const alertSources = sourceTextsByEdition.showrank_barebones;
const noMissingSources = sourceTextsByEdition.showrank_barebones_no_missing;
const noMissingOverrides = Object.fromEntries(
  TOPBAR_RANK_SOURCE_PATHS
    .filter((path) => noMissingSources[path] !== alertSources[path])
    .map((path) => [path, noMissingSources[path]])
);

const outputRootPath = fileURLToPath(OUTPUT_ROOT).replace(/[\\/]+$/, "");
const generatedOutputPath = fileURLToPath(GENERATED_OUTPUT);
const stagedOutputRoot = await mkdtemp(`${outputRootPath}.stage-`);
const stagedGeneratedOutput = `${generatedOutputPath}.stage-${process.pid}-${Date.now()}`;

async function replaceAtomically(stagedPath, destinationPath) {
  const backupPath = `${destinationPath}.previous`;
  await rm(backupPath, { recursive: true, force: true });
  await rename(destinationPath, backupPath);
  try {
    await rename(stagedPath, destinationPath);
  } catch (error) {
    await rename(backupPath, destinationPath);
    throw error;
  }
  await rm(backupPath, { recursive: true, force: true });
}

try {
  for (const path of TOPBAR_RANK_SOURCE_PATHS) {
    const outputPath = join(stagedOutputRoot, path);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, alertSources[path]);
  }

  let generated = "export const TOPBAR_RANK_SOURCE_TEXTS = {\n";
  for (const path of TOPBAR_RANK_SOURCE_PATHS) {
    generated += `  ${JSON.stringify(path)}: ${JSON.stringify(alertSources[path])},\n`;
  }
  generated += "};\n\nexport const TOPBAR_RANK_NO_MISSING_SOURCE_OVERRIDES = {\n";
  for (const path of Object.keys(noMissingOverrides)) {
    generated += `  ${JSON.stringify(path)}: ${JSON.stringify(noMissingOverrides[path])},\n`;
  }
  generated += "};\n";
  await writeFile(stagedGeneratedOutput, generated);

  await replaceAtomically(stagedOutputRoot, outputRootPath);
  await replaceAtomically(stagedGeneratedOutput, generatedOutputPath);
} catch (error) {
  await rm(stagedOutputRoot, { recursive: true, force: true });
  await rm(stagedGeneratedOutput, { force: true });
  throw error;
}

console.log(`synced ${TOPBAR_RANK_SOURCE_PATHS.length} paths and wrote ${GENERATED_OUTPUT.pathname}`);
