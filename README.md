# Topbar Rank VPK Merger

Static Astro + React app for building a local Deadlock `topbar_rank` VPK. The app runs in the browser: users upload Top Bar Plus v40 and a supported ShowRank archive, validation happens locally, latest `topbar_rank` source is fetched from GitHub at build time, and the merged VPK downloads to the user's machine.

Hosted app: <https://hantu-raya.github.io/Show-rank-merger/>

## What it does

- Validates the exact Top Bar Plus v40 GameBanana archive and embedded VPK.
- Validates supported ShowRank 2026-06-08 variants by SHA-256.
- Fetches current `topbar_rank/panorama/**` source from `Hantu-Raya/Deadlock-mods-collection` when building.
- Generates Source 2 resource payloads for XML, JavaScript, and CSS.
- Writes a local VPK with generated `topbar_rank` files winning conflicts.
- Keeps files local. There is no server-side archive processing.

## Supported inputs

- Top Bar Plus v40: `v40_top_bar_plus.zip`
- ShowRank variants listed in `src/gamebananaSources.js`

Filename is only a hint. Archive size, archive SHA-256, embedded VPK SHA-256, and required VPK paths decide compatibility.

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

Refresh the bundled fallback copy of upstream `topbar_rank` source:

```bash
npm run sync:payload
```

The deployed app also fetches latest upstream source at runtime before building a VPK. The bundled payload is the offline/fallback source map.

## Verification

Run the standard local gate:

```bash
npm run check
```

Verify live GameBanana fixtures and all ShowRank variants:

```bash
node scripts/verify-gamebanana-fixtures.mjs
```

The fixture verifier needs network access to GameBanana and GitHub.

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
