# Topbar Rank VPK Merger

Static Astro + React app for building a local Deadlock `topbar_rank` VPK. The app runs in the browser: users upload the exact Top Bar Plus v40 archive, validation happens locally, the current combined `topbar_rank` source is fetched from GitHub at build time, and the generated VPK downloads to the user's machine.

Hosted app: <https://hantu-raya.github.io/Show-rank-merger/>

## What it does

- Validates the exact Top Bar Plus v40 GameBanana archive and embedded VPK.
- Fetches the current normal-only `topbar_rank/panorama/**` source from `Hantu-Raya/Deadlock-mods-collection` when building.
- Verifies that the copied `showrank_common.js` is byte-identical to canonical ShowRank.
- Generates all 19 Source 2 resources, keeps canonical ShowRank source unchanged, and Closure ADVANCED-minifies all four staged scripts with the builder’s extern contract.
- Falls back to the bundled current source when GitHub is unavailable.
- Keeps files local. There is no server-side archive processing.

## Supported input

- Top Bar Plus v40: `v40_top_bar_plus.zip`

Filename is only a hint. Archive size, archive SHA-256, embedded VPK SHA-256, and required VPK paths decide compatibility. The current Topbar Rank integration supports only its normal build; legacy ShowRank variants are not patched into it.

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

To synchronize from a local `topbar_rank` checkout instead:

```powershell
$env:TOPBAR_RANK_SOURCE_ROOT = "F:\path\to\Deadlock-mods-collection\topbar_rank"
npm run sync:payload
```

Refresh the checked-in Closure externs after changing `build_showrank_variants.ps1`:

```powershell
$env:SHOWRANK_VARIANT_BUILDER = "F:\path\to\Deadlock-mods-collection\build_showrank_variants.ps1"
npm run sync:externs
```

The deployed app fetches the latest upstream source and canonical ShowRank bridge before building. Network failures use the bundled source; a canonical bridge mismatch fails closed.

## Verification

Run the standard local gate:

```bash
npm run check
```

Verify the live Top Bar Plus fixture and generated 19-resource VPK:

```bash
node scripts/verify-gamebanana-fixtures.mjs
```

The fixture verifier needs network access to GameBanana. GitHub is used when available; otherwise it exercises the bundled source fallback.

## Deployment

GitHub Pages deploys from `.github/workflows/deploy-pages.yml` on pushes to `main`, manual dispatch, and a 6-hour schedule. The workflow:

1. Installs dependencies with `npm ci --ignore-scripts`.
2. Syncs latest bundled `topbar_rank` payload.
3. Runs `npm run check`.
4. Publishes `dist/` to the `gh-pages` branch.

Astro is configured with:

- `site: "https://hantu-raya.github.io"`
- `base: "/Show-rank-merger/"`

## License

Apache-2.0. See `LICENSE`.

This is an unofficial fan-made tool. It is not affiliated with Valve.
