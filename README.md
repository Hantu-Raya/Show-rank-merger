# ShowRank + Top Bar Plus merger

ShowRank and Top Bar Plus both replace Deadlock's two top bar layouts, so with both installed one of them loses its top bar changes. This static page combines ShowRank v1.0.0 and Top Bar Plus v5 into one VPK that keeps both. Files are processed in the browser and are not uploaded.

Live page: https://hantu-raya.github.io/Show-rank-merger/

## Inputs

| Mod | File | GameBanana file |
| --- | --- | --- |
| Top Bar Plus v5 | `v5_top_bar_plus.zip` | [1834013](https://gamebanana.com/mods/download/623518#FileInfo_1834013) |
| ShowRank v1.0.0 | `showrank_barebones_v100.7z` | [1855939](https://gamebanana.com/mods/download/681028#FileInfo_1855939) |
| ShowRank v1.0.0 No Missing | `showrank_barebones_no_missing_v100.7z` | [1855938](https://gamebanana.com/mods/download/681028#FileInfo_1855938) |

Only these exact files are accepted. The ShowRank file you add decides the result: `topbar_rank_barebones_dir.vpk` or `topbar_rank_barebones_no_missing_dir.vpk`.

## How it works

Every file from both mods is copied unchanged, except `citadel_hud_top_bar` and `citadel_hud_top_bar_player`, which both mods replace. Those two come from bundled merged layouts that contain both mods' additions (`src/mergedLayouts.js`), checked against layouts decompiled from both releases.

## Development

Requires Node 22.12 or newer.

```bash
npm install
npm run dev        # http://localhost:4321/Show-rank-merger/
npm test
npm run build
npm run verify:release
```

`verify:release` builds both editions from the real downloads and writes them, with a JSON report, to `tmp-smoke/`. Set `TOPBAR_ARCHIVE`, `SHOWRANK_ARCHIVE` and `SHOWRANK_NO_MISSING_ARCHIVE` to use local copies instead of downloading.

## Deployment

GitHub Pages deploys from `.github/workflows/deploy-pages.yml` when run manually. The workflow runs the tests and the build, then publishes `dist/`.

## License

Apache-2.0. See `LICENSE`. Top Bar Plus is by [bonclide](https://gamebanana.com/members/2408486).

This is an unofficial fan-made tool and is not affiliated with Valve.
