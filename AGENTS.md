# Repository Guidelines

## Product contract

This static Astro + React app builds one mutually exclusive Topbar Rank Barebones edition from an exact Top Bar Plus v40d archive:

- `alert` (default) emits `topbar_rank_barebones_dir.vpk` and shows missing-enemy alerts during the first eight minutes when native health is hidden.
- `no_missing` emits `topbar_rank_barebones_no_missing_dir.vpk` and contains no missing-enemy runtime, XML, CSS, or clock-polling markers.
- Missing-enemy alerts never mean missing rank data or missing API data.
- Each edition contains exactly the 23 paths in `src/topbarRankSourceManifest.js`.

## Build flow

1. `src/components/RankMergerIsland.jsx` owns local upload, edition, and download state. The edition control is disabled while a build is in flight.
2. `src/sourceValidation.js` checks Top Bar Plus outer size/SHA-256, embedded VPK SHA-256, and required paths from `src/gamebananaSources.js`.
3. `src/topbarRankSourceFetch.js` fetches the selected edition and its three composition fragments, then applies each placeholder exactly once. Unresolved seams fail closed.
4. `src/buildMergedRankVpk.js` uses the composed latest source or the selected composed fallback from `src/payload/topbarRankSources.generated.js`.
5. `src/topbarRankPayload.js` validates identity, rank-image URL, profile/profile-stats APIs, edition markers, and Closure output before compiling Source 2 resources.
6. `src/rankMerge.js` gives generated payload paths priority; `src/vpkWriter.js` writes the final VPK.

## Source and generated files

- `src/topbarRankSourceManifest.js` — edition IDs, 23-path manifest, and composition fragment paths.
- `src/topbarRankSourceFetch.js` — browser-safe latest fetch and exact-once composition.
- `src/payload/topbar_rank/<edition>/` — checked-in composed fallback source; keep both editions complete.
- `src/payload/topbarRankSources.generated.js` — generated map consumed by payload building.
- `scripts/sync-topbar-rank-payload.mjs` — refreshes both editions, removes stale flat material, composes sources, and regenerates the map.
- `src/gamebananaSources.js` — canonical v40d metadata and required VPK paths.
- `src/sourceValidation.js` — archive and VPK identity checks.
- `test/*.test.js` — focused contract tests.

## Editing rules

- Preserve user-authored dirty changes and keep processing browser-safe. Do not add a server, native compiler, or compatibility alias.
- Keep latest and fallback source composition identical. Validate every source path before compilation.
- Keep viewed-profile identity resolution shared by Topbar Rank and Profile Stats Community. Keep Profile Stats Community Community-vs-Stats behavior and current Player Profile APIs intact.
- Keep output names underscore-normalized and metadata hashes synchronized with `src/gamebananaSources.js`.
- Treat `src/payload/topbar_rank/<edition>/` and the generated map as synchronized output; refresh them with the sync script rather than hand-editing one side.
- Do not edit ignored build output or dependencies.

## Verification

Use the focused Node tests for source, payload, merge, and archive contracts. The manual live fixture verifier is `scripts/verify-gamebanana-fixtures.mjs`. For UI changes, exercise the deployed surface and confirm archive upload, edition selection, build, and download behavior.
