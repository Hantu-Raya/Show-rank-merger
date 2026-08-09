# Topbar Rank VPK Merger

Static Astro + React app for building a local Deadlock `topbar_rank` VPK. The app runs in the browser: users upload the exact Top Bar Plus V40D archive and the ShowRank Barebones archive selected by the missing-alert ON/OFF toggle, then download the generated VPK. The selected integrated payload is fetched from GitHub at build time.

Hosted app: <https://hantu-raya.github.io/Show-rank-merger/>

## What it does

- Validates the exact Top Bar Plus V40D archive and the selected current ShowRank Barebones alert or no-missing GameBanana archive.
- Fetches the current `topbar_rank/panorama/**` integrated source when missing alerts are ON or `topbar_rank_no_missing/panorama/**` when they are OFF.
- Validates and compiles all 23 Source 2 resources in the selected integrated payload, Closure ADVANCED-minifying `showrank_barebones.js`.
- Falls back to the matching bundled source when GitHub is unavailable.
- Keeps files local. There is no server-side archive processing.

## Supported input

- Top Bar Plus V40D: `v40d_top_bar_plus.zip`
- ShowRank Barebones alert archive
- ShowRank Barebones no-missing archive

Filenames are only hints. Archive identity, embedded VPK identity, and required VPK paths decide compatibility.

## Development

Requires Node 22.12 or newer.

```bash
npm install
npm run dev
npm test
npm run build
npm run check
```

Local dev URL with the configured GitHub Pages base:

```text
http://localhost:4321/Show-rank-merger/
```

## Payload sync

Refresh the bundled fallback copy from upstream:

```bash
npm run sync:payload
```

To synchronize both payloads from local checkouts instead:

```powershell
$env:TOPBAR_RANK_SOURCE_ROOT = "F:\path\to\Deadlock-mods-collection\topbar_rank"
$env:TOPBAR_RANK_NO_MISSING_SOURCE_ROOT = "F:\path\to\Deadlock-mods-collection\topbar_rank_no_missing"
npm run sync:payload
```
The deployed app fetches the latest public upstream source before building. Network failures use the bundled source.

## Verification

Run the standard local gate:

```bash
npm run check
```

Verify the live Top Bar Plus V40D and both ShowRank Barebones fixtures, then generate both 23-resource VPKs:

```bash
node scripts/verify-gamebanana-fixtures.mjs
```

The fixture verifier needs network access to GameBanana. GitHub is used when available; otherwise it verifies both bundled payload fallbacks.

## Deployment

GitHub Pages deploys from `.github/workflows/deploy-pages.yml` on pushes to `main`, manual dispatch, and a 6-hour schedule. The workflow:

1. Installs dependencies with `npm ci --ignore-scripts`.
2. Syncs the latest bundled `topbar_rank` and `topbar_rank_no_missing` payloads.
3. Runs `npm run check`.
4. Publishes `dist/` to the `gh-pages` branch.

Astro is configured with:

- `site: "https://hantu-raya.github.io"`
- `base: "/Show-rank-merger/"`

## License

Apache-2.0. See `LICENSE`.

This is an unofficial fan-made tool. It is not affiliated with Valve.
