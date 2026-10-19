import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { MERGED_LAYOUTS, MERGED_LAYOUT_PATHS } from "../src/mergedLayouts.js";

const FIXTURES = new URL("./fixtures/layouts/", import.meta.url);
const LAYOUT_NAMES = {
  "panorama/layout/citadel_hud_top_bar.vxml_c": "citadel_hud_top_bar.xml",
  "panorama/layout/citadel_hud_top_bar_player.vxml_c": "citadel_hud_top_bar_player.xml"
};

function fixture(folder, name) {
  return readFileSync(new URL(`${folder}/${name}`, FIXTURES), "utf8");
}

// One entry per markup line with its nesting depth, comments dropped, so order and nesting are both compared.
function lines(xml) {
  let depth = 0;
  const result = xml
    .replace(/<!--[\s\S]*?-->/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("</")) {
        depth -= 1;
        return { text: line, depth };
      }
      const open = /^<([A-Za-z0-9_]+)((?:\s+[A-Za-z_:-]+="[^"]*")*)\s*(\/?)>$/.exec(line);
      assert.ok(open, `unexpected layout line: ${line}`);
      const attrs = Object.fromEntries([...open[2].matchAll(/([A-Za-z_:-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
      const entry = { text: line, depth, tag: open[1], attrs, selfClosing: open[3] === "/" };
      if (!entry.selfClosing) depth += 1;
      return entry;
    });
  assert.equal(depth, 0, "layout elements must be balanced");
  return result;
}

// A merged line covers a source line at the same depth when it is the same line,
// or the same element with every source attribute kept.
function covers(merged, source) {
  if (merged.depth !== source.depth) return false;
  if (merged.text === source.text) return true;
  if (!merged.tag || merged.tag !== source.tag || merged.selfClosing !== source.selfClosing) return false;
  return Object.entries(source.attrs).every(([key, value]) => merged.attrs[key] === value);
}

function assertSubsequence(mergedLines, sourceLines, label) {
  let index = 0;
  for (const line of mergedLines) {
    if (index < sourceLines.length && covers(line, sourceLines[index])) index += 1;
  }
  assert.equal(index, sourceLines.length, `${label}: merged layout drops or reorders "${sourceLines[index]?.text}"`);
}

for (const editionId of ["alert", "no_missing"]) {
  for (const path of MERGED_LAYOUT_PATHS) {
    const name = LAYOUT_NAMES[path];
    const merged = lines(MERGED_LAYOUTS[editionId][path]);
    const topbar = lines(fixture("topbar_plus_v5", name));
    const showrank = lines(fixture(`showrank_v1_0_0_${editionId}`, name));

    test(`${editionId} ${name} keeps every Top Bar Plus v5 line in order`, () => {
      assertSubsequence(merged, topbar, "Top Bar Plus v5");
    });

    test(`${editionId} ${name} keeps every ShowRank v1.0.0 line in order`, () => {
      assertSubsequence(merged, showrank, "ShowRank v1.0.0");
    });

    test(`${editionId} ${name} adds nothing that neither mod has, and nothing twice`, () => {
      for (const line of merged) {
        const mergedCount = merged.filter((other) => other.text === line.text && other.depth === line.depth).length;
        const topbarCount = topbar.filter((source) => covers(line, source)).length;
        const showrankCount = showrank.filter((source) => covers(line, source)).length;
        assert.ok(topbarCount + showrankCount > 0, `unexpected merged line: ${line.text}`);
        assert.ok(mergedCount <= Math.max(topbarCount, showrankCount), `merged layout repeats: ${line.text}`);
      }
    });
  }
}

test("the merged root keeps the one Top Bar Plus onload and the player keeps the ShowRank script", () => {
  for (const editionId of ["alert", "no_missing"]) {
    const root = MERGED_LAYOUTS[editionId]["panorama/layout/citadel_hud_top_bar.vxml_c"];
    const player = MERGED_LAYOUTS[editionId]["panorama/layout/citadel_hud_top_bar_player.vxml_c"];
    assert.equal(root.match(/onload=/g)?.length, 1);
    assert.match(root, /\$\.TopbarRankHudRootLoaded\(&apos;topbar_root_onload&apos;\)/);
    assert.equal(root.match(/topbar_rank_hud\.vjs_c/g)?.length, 1);
    assert.equal(player.match(/showrank_barebones\.vjs_c/g)?.length, 1);
    assert.doesNotMatch(player, /onload=/);
  }
});

test("only the alert edition carries the missing-enemy layout", () => {
  const alertPlayer = MERGED_LAYOUTS.alert["panorama/layout/citadel_hud_top_bar_player.vxml_c"];
  assert.match(alertPlayer, /ShowRankBarebonesMissingIndicator/);
  for (const path of MERGED_LAYOUT_PATHS) {
    assert.doesNotMatch(MERGED_LAYOUTS.no_missing[path], /MISSING|ShowRankBarebonesMissing|citadel_hud_game_announcements/);
  }
});
