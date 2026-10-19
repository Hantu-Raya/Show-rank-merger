# Repository Guidelines

## Product contract

This static Astro + React app merges two exact GameBanana downloads into one Deadlock VPK, entirely in the browser:

- Top Bar Plus v5: `v5_top_bar_plus.zip` (file 1834013).
- ShowRank v1.0.0, one of `showrank_barebones_v100.7z` (file 1855939, normal) or `showrank_barebones_no_missing_v100.7z` (file 1855938, no MISSING tags or ENEMY MISSING alert).

The edition is detected from the ShowRank archive hash; there is no edition toggle. Output is `topbar_rank_barebones_dir.vpk` (normal) or `topbar_rank_barebones_no_missing_dir.vpk`. "Missing" always means missing enemies, never missing rank or API data.

## Build flow

1. `src/sourceValidation.js` checks each archive by exact size and SHA-256, extracts the pinned VPK member with 7z-wasm, checks the VPK SHA-256, and requires the exact path inventory from `src/gamebananaSources.js`.
2. `src/rankMerge.js` copies every resource from both VPKs byte for byte. The only paths both mods may share are the two top bar layouts; any other shared path, a missing shared layout, or a duplicate path fails the merge.
3. The two shared layouts come from `src/mergedLayouts.js` (one pair per edition), compiled by `src/source2ResourceWriter.js`.
4. `src/vpkWriter.js` writes the output: 22 entries per edition.

There is no source compilation, Closure step, or network fetch of mod source. Do not add one.

## Merged layouts

`src/mergedLayouts.js` holds Top Bar Plus v5's layout plus exactly the lines ShowRank v1.0.0 adds to the stock layout. `test/fixtures/layouts/` holds those layouts decompiled (VRF 19.2) from the pinned VPKs. `test/mergedLayouts.test.js` requires every line of both mods, in order and at the same depth, and nothing that neither mod has.

When either mod releases a new version: pin the new file in `src/gamebananaSources.js`, refresh the fixtures from the new VPKs, rebuild the merged layouts from them, and keep the tests passing. Support one version pair at a time.

## Editing rules

- Keep processing browser-only. Do not add a server or upload.
- Never edit the decompiled fixtures by hand; regenerate them from the pinned VPKs.
- Keep output file names and pinned hashes in `src/gamebananaSources.js` in sync with the tests.
- Do not edit ignored build output (`dist/`, `tmp-smoke/`) or dependencies.

## Verification

```bash
npm test                       # contracts: pins, inventories, merge policy, merged layouts
npm run build
npm run verify:release         # E2E: builds both editions from the real downloads into tmp-smoke/
```

`verify:release` downloads from GameBanana unless `TOPBAR_ARCHIVE`, `SHOWRANK_ARCHIVE` and `SHOWRANK_NO_MISSING_ARCHIVE` point to local copies. It checks that 20 resources are byte-identical to the sources and that the two layouts are the merged ones, then writes both VPKs and `report.json`.

For UI changes, run the built site (`npx astro preview`) and confirm both uploads, wrong-file errors, the detected edition, build, and download. Whether the game loads the merged VPK is only proven in game.
