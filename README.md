# Topbar Rank VPK Merger

Static Astro + React app for building a current Topbar Rank Barebones VPK from exact Top Bar Plus v40d and ShowRank 8/26 archives. Files stay in the browser; no server receives them.

## What it does

- Validates the Top Bar Plus v40d archive by exact outer size/SHA-256, embedded VPK SHA-256, and required VPK paths.
- Requires and validates the selected ShowRank 8/26 archive by the same checks.
- Offers two mutually exclusive editions: `alert` and `no_missing`.
- Fetches the selected edition's current 23-resource source map and composes the viewed-profile identity policy, Profile Stats Community runtime, and stylesheet exactly once.
- Uses the same composed rules for latest-source builds and bundled offline fallbacks, rejecting unresolved composition placeholders before Closure compilation.
- Compiles every Panorama JavaScript source with Closure ADVANCED and writes an embedded Source 2 VPK.

## Inputs and editions

- Required input: `v40d_top_bar_plus.zip`. The filename is only a hint; archive and embedded identities must match.
- `alert` requires `showrank_barebones_8_26.7z` from GameBanana file `1797773` and downloads `topbar_rank_barebones_dir.vpk`.
- `no_missing` requires `showrank_barebones_no_missing_8_26.7z` from GameBanana file `1797774` and downloads `topbar_rank_barebones_no_missing_dir.vpk`.
- Changing the edition clears the selected ShowRank archive. The edition toggle is locked while a build runs.

`alert` means missing-enemy alerts during the first eight minutes, based on native health visibility. It does not mean missing rank data, missing API data, or a failed rank lookup. `no_missing` removes the missing-enemy runtime, XML, CSS, and clock-polling markers.

## Development

Requires Node 22.12 or newer.

```bash
npm install
npm run dev
npm test
npm run build
npm run check
```

Local dev URL:

```text
http://localhost:4321/Show-rank-merger/
```

## Payload sync

Refresh both checked-in fallback editions from upstream:

```bash
npm run sync:payload
```

The sync removes stale flat payload material, writes `src/payload/topbar_rank/<edition>/`, composes the current fragments, and regenerates `src/payload/topbarRankSources.generated.js`. Set `TOPBAR_RANK_SOURCE_ROOT_ALERT`, `TOPBAR_RANK_SOURCE_ROOT_NO_MISSING`, and (when using local roots) `TOPBAR_RANK_COMPOSITION_SOURCE_ROOT` to read local source trees instead of fetching them.

The deployed app fetches the selected edition at build time. Network failures use that edition's composed bundled source; unresolved seams fail closed.

## Verification

```bash
npm run check
node scripts/verify-gamebanana-fixtures.mjs
```

Focused tests cover both required archive identities, both 23-resource editions, composition, Closure output guards, no-missing marker rejection, and exact output filenames.

## Deployment

GitHub Pages deploys from `.github/workflows/deploy-pages.yml`. The workflow syncs both current source editions, runs the test/build gate, and publishes `dist/`.

## License

Apache-2.0. See `LICENSE`.

This is an unofficial fan-made tool and is not affiliated with Valve.
