import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_BASE_URL = process.env.TOPBAR_RANK_SOURCE_BASE_URL
  || "https://raw.githubusercontent.com/Hantu-Raya/Deadlock-mods-collection/main/topbar_rank";
const OUTPUT_ROOT = new URL("../src/payload/topbar_rank/", import.meta.url);
const GENERATED_OUTPUT = new URL("../src/payload/topbarRankSources.generated.js", import.meta.url);

const SOURCE_PATHS = [
  "panorama/layout/citadel_hud_top_bar.xml",
  "panorama/layout/citadel_hud_top_bar_player.xml",
  "panorama/layout/profile_card.xml",
  "panorama/layout/citadel_ui_context_menu_player.xml",
  "panorama/layout/hud_escape_menu.xml",
  "panorama/layout/players_list_entry.xml",
  "panorama/scripts/topbar_rank_rank_bridge.js",
  "panorama/scripts/topbar_rank_hud.js",
  "panorama/styles/topbar_rank_topbar.css",
  "panorama/styles/objectives_map.css",
  "panorama/styles/topbar_rank_profile_card.css",
  "panorama/styles/topbar_rank_player_list.css",
  "panorama/styles/topbar_rank_base/citadel_hud_top_bar.css",
  "panorama/styles/topbar_rank_base/objectives_map.css"
];

async function fetchText(path) {
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

for (const path of SOURCE_PATHS) {
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
