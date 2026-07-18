import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const builderPath = resolve(process.env.SHOWRANK_VARIANT_BUILDER || "../Deadlock-mods-collection/build_showrank_variants.ps1");
const outputUrl = new URL("../src/showrankClosureExterns.generated.js", import.meta.url);
const builder = await readFile(builderPath, "utf8");
const propertyBlock = builder.match(/\$externProperties\s*=\s*@\(([\s\S]*?)\n\s*\)/);
if (!propertyBlock) throw new Error(`Could not find Closure extern properties in ${builderPath}`);
const properties = [...propertyBlock[1].matchAll(/^\s*"([A-Za-z_$][A-Za-z0-9_$]*)",?\s*$/gm)].map((match) => match[1]);
if (properties.length < 100) throw new Error(`Suspiciously short Closure extern property list: ${properties.length}`);

const lines = [
  "/** @externs */",
  "/** @const */ var $ = {};",
  "$.GetContextPanel = function() {};",
  "$.Schedule = function(delay, callback) {};",
  "$.DispatchEvent = function(opt_a, opt_b, opt_c, opt_d, opt_e) {};",
  "$.RegisterEventHandler = function(opt_a, opt_b, opt_c, opt_d, opt_e) {};",
  "$.RegisterForUnhandledEvent = function(opt_a, opt_b, opt_c, opt_d, opt_e) {};",
  "$.Msg = function(opt_a, opt_b, opt_c, opt_d, opt_e) {};",
  "/** @const */ var GameUI = {};",
  "GameUI.CustomUIConfig = function() {};",
  "/** @const */ var Game = {};",
  "Game.GetMapInfo = function() {};",
  "Game.GetDOTATime = function() {};",
  "Game.GetGameTime = function() {};",
  "Game.Time = 0;",
  "Game.GameTime = 0;",
  "var MOD_ICONS = {};",
  "/** @const */ var SteamOverlayAPI = {};",
  "SteamOverlayAPI.OpenURL = function(url) {};",
  "SteamOverlayAPI.OpenExternalBrowserURL = function(url) {};",
  "var CitadelShowProfilePageForAccount = function(account) {};",
  "var CitadelTopDownScoreboardPlayerHovered = function() {};",
  ...properties.map((property) => `Object.prototype.${property};`)
];
const generated = `// Generated from build_showrank_variants.ps1 by scripts/sync-showrank-closure-externs.mjs.\nexport const SHOWRANK_CLOSURE_EXTERNS = ${JSON.stringify(lines.join("\n"))};\n`;
await writeFile(outputUrl, generated);
console.log(`wrote ${outputUrl.pathname} with ${properties.length} extern properties`);
