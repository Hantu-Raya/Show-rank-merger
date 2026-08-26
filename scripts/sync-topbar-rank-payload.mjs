import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TOPBAR_RANK_BAREBONES_SOURCE_BASE_URLS,
  TOPBAR_RANK_COMPOSITION_SOURCE_BASE_URL,
  TOPBAR_RANK_COMPOSITION_SOURCE_PATHS,
  TOPBAR_RANK_EDITIONS,
  TOPBAR_RANK_SOURCE_BASE_URLS,
  TOPBAR_RANK_SOURCE_PATHS
} from "../src/topbarRankSourceManifest.js";
import { composeTopbarRankSourceTexts } from "../src/topbarRankSourceFetch.js";
import { TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION } from "../src/payload/topbarRankSources.generated.js";

const BAREBONES_SOURCE_PATH = "panorama/scripts/showrank_barebones.js";
const OUTPUT_ROOT = new URL("../src/payload/topbar_rank/", import.meta.url);
const GENERATED_OUTPUT = new URL("../src/payload/topbarRankSources.generated.js", import.meta.url);

function editionEnvironmentName(editionId) {
  return editionId.toUpperCase();
}

function localSourceRoot(editionId, path) {
  const suffix = editionEnvironmentName(editionId);
  const variable = path === BAREBONES_SOURCE_PATH
    ? `TOPBAR_RANK_BAREBONES_SOURCE_ROOT_${suffix}`
    : `TOPBAR_RANK_SOURCE_ROOT_${suffix}`;
  return process.env[variable] || "";
}

function sourceBaseUrl(editionId, path) {
  return path === BAREBONES_SOURCE_PATH
    ? TOPBAR_RANK_BAREBONES_SOURCE_BASE_URLS[editionId]
    : TOPBAR_RANK_SOURCE_BASE_URLS[editionId];
}

function sourceUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/$/, "")}/${path}`;
}

function localCompositionRoot() {
  if (process.env.TOPBAR_RANK_COMPOSITION_SOURCE_ROOT) return process.env.TOPBAR_RANK_COMPOSITION_SOURCE_ROOT;
  const localRoot = localSourceRoot("alert", TOPBAR_RANK_SOURCE_PATHS[0]);
  return localRoot ? dirname(localRoot) : "";
}

async function fetchText(url, label) {
  const response = await fetch(url, { headers: { "User-Agent": "rank-merger-payload-sync" } });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  const text = await response.text();
  if (!text) throw new Error(`${label} was empty`);
  return text;
}

async function fetchSourceText(editionId, path) {
  const localRoot = localSourceRoot(editionId, path);
  if (localRoot) return readFile(join(localRoot, path), "utf8");
  return fetchText(sourceUrl(sourceBaseUrl(editionId, path), path), `${editionId}/${path}`);
}

async function fetchCompositionText(path) {
  const localRoot = localCompositionRoot();
  if (localRoot) return readFile(join(localRoot, path), "utf8");
  return fetchText(sourceUrl(TOPBAR_RANK_COMPOSITION_SOURCE_BASE_URL, path), `composition/${path}`);
}

function hasLocalSourceOverrides() {
  if (localCompositionRoot()) return true;
  return TOPBAR_RANK_EDITIONS.some((editionId) => (
    TOPBAR_RANK_SOURCE_PATHS.some((path) => localSourceRoot(editionId, path))
  ));
}

async function loadFreshEditionSources() {
  const compositionSources = Object.fromEntries(
    await Promise.all(TOPBAR_RANK_COMPOSITION_SOURCE_PATHS.map(async (path) => [
      path,
      await fetchCompositionText(path)
    ]))
  );

  return Object.fromEntries(await Promise.all(TOPBAR_RANK_EDITIONS.map(async (editionId) => {
    const rawSourceTexts = Object.fromEntries(await Promise.all(
      TOPBAR_RANK_SOURCE_PATHS.map(async (path) => [path, await fetchSourceText(editionId, path)])
    ));
    return [editionId, composeTopbarRankSourceTexts(rawSourceTexts, compositionSources)];
  })));
}

export async function loadSynchronizedEditionSources({
  loadFresh = loadFreshEditionSources,
  bundled = TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION,
  localOverrides = hasLocalSourceOverrides(),
  warn = console.warn
} = {}) {
  try {
    return await loadFresh();
  } catch (error) {
    if (localOverrides) throw error;
    warn(`Could not refresh both Barebones editions; keeping bundled payloads: ${error.message}`);
    return bundled;
  }
}

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

async function writeSynchronizedPayload(sourceTextsByEdition) {
  const outputRootPath = fileURLToPath(OUTPUT_ROOT).replace(/[\\/]+$/, "");
  const generatedOutputPath = fileURLToPath(GENERATED_OUTPUT);
  const stagedOutputRoot = await mkdtemp(`${outputRootPath}.stage-`);
  const stagedGeneratedOutput = `${generatedOutputPath}.stage-${process.pid}-${Date.now()}`;

  try {
    for (const editionId of TOPBAR_RANK_EDITIONS) {
      for (const path of TOPBAR_RANK_SOURCE_PATHS) {
        const outputPath = join(stagedOutputRoot, editionId, path);
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, sourceTextsByEdition[editionId][path]);
      }
    }

    let generated = "export const TOPBAR_RANK_SOURCE_TEXTS_BY_EDITION = {\n";
    for (const editionId of TOPBAR_RANK_EDITIONS) {
      generated += `  ${JSON.stringify(editionId)}: {\n`;
      for (const path of TOPBAR_RANK_SOURCE_PATHS) {
        generated += `    ${JSON.stringify(path)}: ${JSON.stringify(sourceTextsByEdition[editionId][path])},\n`;
      }
      generated += "  },\n";
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
}

async function syncPayload() {
  await writeSynchronizedPayload(await loadSynchronizedEditionSources());
  console.log(`synced ${TOPBAR_RANK_EDITIONS.length} editions with ${TOPBAR_RANK_SOURCE_PATHS.length} paths each`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await syncPayload();
}
