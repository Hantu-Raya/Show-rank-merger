import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TOPBAR_RANK_SOURCE_BASE_URL, TOPBAR_RANK_SOURCE_PATHS } from "../src/topbarRankSourceManifest.js";

const SOURCE_BASE_URL = process.env.TOPBAR_RANK_SOURCE_BASE_URL || TOPBAR_RANK_SOURCE_BASE_URL;
const LOCAL_SOURCE_ROOT = process.env.TOPBAR_RANK_SOURCE_ROOT || "";
const OUTPUT_ROOT = new URL("../src/payload/topbar_rank/", import.meta.url);
const GENERATED_OUTPUT = new URL("../src/payload/topbarRankSources.generated.js", import.meta.url);


async function fetchText(path) {
  if (LOCAL_SOURCE_ROOT) return readFile(join(LOCAL_SOURCE_ROOT, path), "utf8");

  const url = `${SOURCE_BASE_URL.replace(/\/$/, "")}/${path}`;
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

const sourceTexts = new Map();

for (const path of TOPBAR_RANK_SOURCE_PATHS) {
  const text = await fetchText(path);
  sourceTexts.set(path, text);
  const outputUrl = new URL(path, OUTPUT_ROOT);
  await mkdir(dirname(fileURLToPath(outputUrl)), { recursive: true });
  await writeFile(outputUrl, text);
  console.log(`synced ${path}`);
}

let generated = "export const TOPBAR_RANK_SOURCE_TEXTS = {\n";
for (const [path, text] of sourceTexts) {
  generated += `  ${JSON.stringify(path)}: ${JSON.stringify(text)},\n`;
}
generated += "};\n";
await writeFile(GENERATED_OUTPUT, generated);
console.log(`wrote ${GENERATED_OUTPUT.pathname}`);
