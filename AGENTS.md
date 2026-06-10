# Repository Guidelines

## Project Overview

This repository is a static Astro + React app for building a local Deadlock `topbar_rank` VPK. Users upload Top Bar Plus v34d and one exact ShowRank 2026-06-08 archive; the browser verifies identity, required VPK contents, fetches latest `topbar_rank` source from GitHub at build time, generates the payload, and downloads the merged VPK. There is no server-side processing.

## Architecture & Data Flow

- `src/pages/index.astro` is the single Astro entry point. It imports `src/styles/global.css` and renders `<RankMergerIsland client:load />`.
- `src/components/RankMergerIsland.jsx` owns UI state with React local state only. It reads files with `file.arrayBuffer()`, displays inline status/errors, validates archives, builds output, and calls `downloadBytes`.
- Archive validation flow:
  1. `sha256Hex` hashes uploaded bytes.
  2. `sourceValidation.js` checks ShowRank by exact byte size/SHA-256 and Top Bar by exact archive or compatible embedded VPK SHA-256 from `gamebananaSources.js`.
  3. `archiveExtractor.js` lazy-loads `7z-wasm`, extracts `pak01_dir.vpk` or `pak89_dir.vpk`.
  4. `vpkReader.js` parses VPKs and `validateRequiredPaths` checks normalized required paths.
- Merge/build flow:
  1. `buildMergedRankVpk.js` validates Top Bar and ShowRank, fetches latest `topbar_rank` source from GitHub by default, builds variant payload, merges with payload priority, then writes VPK bytes.
  2. `topbarRankPayload.js` applies exact ShowRank variant patches to source text, minifies generated JS with Terser, validates source invariants, compiles XML/JS/CSS resources, and verifies required output paths.
  3. `rankMerge.js` normalizes VPK paths and replaces base files with priority payload files on conflicts.
  4. `vpkWriter.js` writes embedded VPK v2 output.

## Key Directories

- `src/components/` — React island UI; currently `RankMergerIsland.jsx`.
- `src/pages/` — Astro routes; currently one page.
- `src/payload/topbar_rank/panorama/` — checked-in payload source material. Keep synchronized with generated payload text.
- `src/payload/topbarRankSources.generated.js` — generated source-text map consumed by `topbarRankPayload.js`.
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
npm run sync:payload # fetch latest topbar_rank source from GitHub and regenerate bundled source map
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
- Generated `topbar_rank` payload wins conflicts. Do not add conflict UI or compatibility aliases unless the product contract changes.
- Prefer explicit errors at archive/VPK boundaries. UI errors must be visible inline, not console-only.
- Async UI work uses run-id cancellation (`runRef`) for topbar/showrank uploads to avoid stale validation updates.
- Byte helpers accept `ArrayBuffer`, `Uint8Array`, and views. Preserve `Uint8Array` data; avoid unnecessary string conversions for binary data.
- Payload patches in `topbarRankPayload.js` are exact string replacements with invariant checks. If source changes, update tests and generated source text together.
- Keep styles neo-brutalist and minimal: CSS variable themes, `prefers-color-scheme` auto dark/light detection, hard borders, square controls, restrained accents, and mobile-first behavior.

## Important Files

- `astro.config.mjs` — Astro React integration, `site: "https://hantu-raya.github.io"`, `base: "/Show-rank-merger/"`.
- `package.json` — npm scripts and dependencies (`astro`, `@astrojs/react`, React 19, `7z-wasm`).
- `.fallowrc.json` — Fallow entries/ignores and `audit.gate: "new-only"`.
- `public/7zz.wasm` — required by browser archive extraction. Keep available at `/Show-rank-merger/7zz.wasm`.
- `.github/workflows/deploy-pages.yml` — GitHub Pages deployment; syncs latest `topbar_rank`, runs `npm run check`, publishes `dist/` to the `gh-pages` branch.
- `src/gamebananaSources.js` — canonical GameBanana file IDs, URLs, expected sizes, SHA-256 hashes, archive members, and required VPK paths.
- `src/archiveExtractor.js` — browser/Node archive member extraction via `7z-wasm`.
- `src/sourceValidation.js` — archive identity and required-path validation.
- `src/topbarRankPayload.js` — ShowRank variant generation and Source 2 resource compilation.
- `src/topbarRankSourceFetch.js`, `src/topbarRankSourceManifest.js` — runtime GitHub source fetcher and canonical `topbar_rank` source path list.
- `src/buildMergedRankVpk.js` — top-level build orchestration.
- `src/vpkReader.js` / `src/vpkWriter.js` — VPK parse/write primitives.
- `src/gitCommitInfo.js`, `src/gitCommitInfoRefresh.js`, `src/pages/commit-info.json.js` — commit-version badge data for the header.
- `scripts/verify-gamebanana-fixtures.mjs` — manual end-to-end verifier for live GameBanana fixtures and all variants.
- `scripts/sync-topbar-rank-payload.mjs` — fetches `topbar_rank/panorama/**` from `Hantu-Raya/Deadlock-mods-collection@main` and regenerates `src/payload/topbarRankSources.generated.js`.

## Runtime/Tooling Preferences

- Required runtime: Node compatible with Astro 6 lockfile requirements; use Node >= 22.12.0.
- Package manager: npm only unless intentionally replacing `package-lock.json`.
- Static deploy base is `/Show-rank-merger/`; use `import.meta.env.BASE_URL` for runtime asset URLs.
- Pages workflow runs on pushes, manual dispatch, and every 6 hours so hosted bundled fallback source can pick up upstream `topbar_rank` changes. Runtime VPK builds also fetch latest upstream source directly from GitHub. Configure GitHub Pages to deploy from the `gh-pages` branch.
- Build artifacts (`dist/`, `.astro/`, `.vite/`, `node_modules/`) are ignored and should not be edited.
- `7z-wasm` is the browser archive extractor. Do not replace it with server-side extraction.
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
  - `test/topbarRankPayload.test.js` — all four ShowRank variants, exact patches, required output paths.
  - `test/sourceValidation.test.js` — missing required paths and SHA-256 variant detection.
- Keep network checks out of `npm test`. Use `scripts/verify-gamebanana-fixtures.mjs` only when constants, archive extraction, required paths, or merged output behavior changes.
- Before handing off non-trivial changes, run `npm run check`. For archive/source identity changes, also run the GameBanana verifier. For UI changes, smoke test upload/build/download behavior in a browser at `http://localhost:4321/Show-rank-merger/` and check narrow mobile width for no horizontal overflow.
