# Repository Guidelines

## Project Overview

This repository is a static Astro + React app for building the current combined Deadlock `topbar_rank` VPK. Users upload the exact Top Bar Plus V40D archive and the current ShowRank Barebones archive selected by the missing-alert ON/OFF toggle. The browser verifies both identities and required VPK contents, selects the matching integrated upstream payload, generates 22 resources, and downloads the VPK. There is no server-side processing.

## Architecture & Data Flow

- `src/pages/index.astro` is the single Astro entry point. It imports `src/styles/global.css` and renders `<RankMergerIsland client:load />`.
- `src/components/RankMergerIsland.jsx` owns UI state with React local state only. It reads files with `file.arrayBuffer()`, displays inline status/errors, validates both archives, exposes the missing-alert ON/OFF toggle, builds output, and calls `downloadBytes`.
- Archive validation flow:
  1. `sha256Hex` hashes both uploaded archives.
  2. `sourceValidation.js` checks exact archive and embedded VPK identities from `gamebananaSources.js`.
  3. `archiveExtractor.js` lazy-loads `7z-wasm` and extracts each configured VPK member.
  4. `vpkReader.js` parses each VPK, and `validateRequiredPaths` checks normalized required paths.
- Build flow:
  1. `buildMergedRankVpk.js` validates Top Bar Plus and the selected ShowRank input, selects the integrated payload from the missing-alert toggle, fetches current source, falls back to the matching bundled source on network failure, and writes VPK bytes.
  2. `topbarRankSourceFetch.js` fetches all 22 public source files from `topbar_rank` when missing alerts are ON or `topbar_rank_no_missing` when they are OFF.
  3. `topbarRankPayload.js` validates the selected integrated source and compiles its 22 Source 2 resources.
  4. `vpkWriter.js` writes embedded VPK v2 output.

## Key Directories

- `src/components/` — React island UI; currently `RankMergerIsland.jsx`.
- `src/pages/` — Astro routes; currently one page.
- `src/payload/topbar_rank/panorama/` — checked-in alert fallback source material.
- `src/payload/topbarRankSources.generated.js` — generated alert source-text map plus the four no-missing overrides consumed by `topbarRankPayload.js`.
- `src/styles/` — global CSS for the app shell and upload/result UI.
- `test/` — Node built-in test suite.
- `scripts/` — manual/network verification scripts.
- `public/` — static assets served under Astro `base`; includes required `7zz.wasm`.

## Development Commands

Use npm; this repo has `package-lock.json`.

```bash
npm install
npm run dev      # astro dev
npm run build    # astro build
npm run preview  # astro preview
npm test         # node --test
npm run check    # npm test && npm run build
npm run sync:payload # fetch both current sources and regenerate bundled source maps
```

Manual/network fixture verification:

```bash
node scripts/verify-gamebanana-fixtures.mjs
```

Optional audits when requested:

```bash
npx -y react-doctor@latest . --json --offline
npx fallow audit --format json --quiet --explain || true
npx fallow health --score --format json --quiet --explain || true
```

## Code Conventions & Common Patterns

- Use ESM imports/exports throughout; `package.json` has `"type": "module"`.
- Keep processing browser-only. Do not introduce helper servers, native compilers, custom iframes, or server APIs.
- Validate external archives by exact size/SHA-256 and required VPK paths; filename is only a user-facing hint.
- Normalize VPK paths with `normalizeVpkPath` before comparisons. Paths are slash-normalized and lowercased.
- The selected integrated payload wins conflicts. Do not add conflict UI or compatibility aliases unless the product contract changes.
- Prefer explicit errors at archive, source, and VPK boundaries. UI errors must be visible inline, not console-only.
- Async UI upload work uses run-id cancellation (`runRef`) to avoid stale validation updates.
- Byte helpers accept `ArrayBuffer`, `Uint8Array`, and views. Preserve `Uint8Array` data; avoid unnecessary string conversions for binary data.
- Keep payload selection source-driven. Do not rewrite integrated payload scripts.
- Keep styles neo-brutalist and minimal: CSS variable themes, `prefers-color-scheme` auto dark/light detection, hard borders, square controls, restrained accents, and mobile-first behavior.

## Important Files

- `astro.config.mjs` — Astro React integration, `site: "https://hantu-raya.github.io"`, `base: "/Show-rank-merger/"`.
- `package.json` — npm scripts and dependencies (`astro`, `@astrojs/react`, React 19, and `7z-wasm`).
- `.fallowrc.json` — Fallow entries/ignores and `audit.gate: "new-only"`.
- `public/7zz.wasm` — required by browser archive extraction. Keep available at `/Show-rank-merger/7zz.wasm`.
- `.github/workflows/deploy-pages.yml` — GitHub Pages deployment; syncs both integrated payloads, runs `npm run check`, and publishes `dist/` to the `gh-pages` branch.
- `src/gamebananaSources.js` — supported Top Bar Plus and ShowRank GameBanana identities, archive members, and required VPK paths.
- `src/archiveExtractor.js` — browser/Node archive member extraction via `7z-wasm`.
- `src/sourceValidation.js` — both uploaded archive identities and required-path validation.
- `src/topbarRankPayload.js` — selected integrated source validation and 22-resource compilation.
- `src/topbarRankSourceFetch.js`, `src/topbarRankSourceManifest.js` — selected upstream source fetcher and 22-file manifests.
- `src/buildMergedRankVpk.js` — top-level build orchestration.
- `src/vpkReader.js` / `src/vpkWriter.js` — VPK parse/write primitives.
- `src/gitCommitInfo.js`, `src/gitCommitInfoRefresh.js`, `src/pages/commit-info.json.js` — commit-version badge data for the header.
- `scripts/verify-gamebanana-fixtures.mjs` — manual end-to-end verifier for the live Top Bar Plus and both supported ShowRank fixtures, alert modes, payload fallbacks, and generated 22-resource VPKs.
- `scripts/sync-topbar-rank-payload.mjs` — fetches both integrated payloads from `Hantu-Raya/Deadlock-mods-collection@main`, or reads `TOPBAR_RANK_SOURCE_ROOT` and `TOPBAR_RANK_NO_MISSING_SOURCE_ROOT`, then regenerates bundled files and `src/payload/topbarRankSources.generated.js`.

## Runtime/Tooling Preferences

- Required runtime: Node compatible with Astro 6 lockfile requirements; use Node >= 22.12.0.
- Package manager: npm only unless intentionally replacing `package-lock.json`.
- Static deploy base is `/Show-rank-merger/`; use `import.meta.env.BASE_URL` for runtime asset URLs.
- Pages workflow runs on pushes, manual dispatch, and every 6 hours so both bundled payloads follow upstream. Runtime builds fetch the selected current upstream source and use its bundled map only on network failure.
- Build artifacts (`dist/`, `.astro/`, `.vite/`, `node_modules/`) are ignored and should not be edited.
- `7z-wasm` is the browser archive extractor. Do not replace it with server-side extraction.
- Preserve both integrated payloads as shipped upstream. The toggle selects the payload; it does not rewrite scripts.
- No TypeScript, ESLint, Prettier, or Playwright config is present. Follow local style and avoid formatting-only churn.

## Testing & QA

- Tests use Node's built-in runner with ESM:

```js
import test from "node:test";
import assert from "node:assert/strict";
```

- Add focused tests under `test/*.test.js`. Prefer behavior and binary/resource round trips over plumbing tests.
- Existing coverage:
  - `test/sha256.test.js` — SHA-256 helper.
  - `test/rankMerge.test.js` — path normalization, priority overwrite behavior, VPK writer/reader round trip.
  - `test/topbarRankPayload.test.js` — both integrated payloads, 22 current resources, source validation, and resource compilation.
  - `test/topbarRankSourceFetch.test.js` — complete selected upstream source fetch behavior and matching bundled fallbacks.
  - `test/sourceValidation.test.js` — normalized required-path validation and all current input identities.
- Before handing off non-trivial changes, run `npm run check`. For archive/source identity changes, also run the GameBanana verifier across Top Bar Plus, both supported ShowRank fixtures, and both alert modes. For UI changes, smoke test upload/build/download behavior in a browser at `http://localhost:4321/Show-rank-merger/` and check narrow mobile width for no horizontal overflow.
