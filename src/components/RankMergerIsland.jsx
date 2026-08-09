import { useEffect, useRef, useState } from "react";

import { buildMergedRankVpk } from "../buildMergedRankVpk.js";
import { downloadBytes } from "../download.js";
import { buildGitCommitInfoRequestUrl, isGitCommitInfoPayload } from "../gitCommitInfoRefresh.js";
import { SHOWRANK_REQUIRED_VPK_PATHS, SHOWRANK_SOURCES, TOPBAR_REQUIRED_VPK_PATHS, TOPBAR_SOURCE } from "../gamebananaSources.js";
import { sha256Hex } from "../sha256.js";
import { validateShowrankArchive, validateTopbarArchive } from "../sourceValidation.js";

const EMPTY_RESULT = { bytes: null, filename: "", overwrittenPaths: [], fileCount: 0, variantId: "", status: "", error: "" };
const SHOWRANK_EDITION_LABELS = {
  showrank_barebones: "Barebones — missing alerts on",
  showrank_barebones_no_missing: "Barebones — missing alerts off"
};

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

function emptySlot() {
  return {
    file: null,
    bytes: null,
    error: "",
    status: "",
    sha256: "",
    pathCount: 0,
    parsed: null,
    variantId: "",
    isDragging: false
  };
}

function initialState() {
  return {
    topbar: emptySlot(),
    showrank: emptySlot(),
    result: EMPTY_RESULT,
    isBusy: false
  };
}

function requiredMessage(topbar, showrank, selectedEditionLabel) {
  if (!topbar.bytes || !showrank.bytes) {
    const missing = [];
    if (!topbar.bytes) missing.push(TOPBAR_SOURCE.expectedFileName);
    if (!showrank.bytes) missing.push(`${selectedEditionLabel} ShowRank archive`);
    return `Upload ${missing.join(" and ")}.`;
  }
  if (topbar.error || showrank.error) return "Fix the archive validation error before downloading.";
  return "Ready to build the latest combined Topbar Rank VPK.";
}

async function readFileBytes(file) {
  return new Uint8Array(await file.arrayBuffer());
}

function patchSlot(setAppState, key, patch) {
  setAppState((state) => ({
    ...state,
    [key]: typeof patch === "function" ? patch(state[key]) : { ...state[key], ...patch }
  }));
}

function resetResult(setAppState) {
  setAppState((state) => ({ ...state, result: EMPTY_RESULT }));
}

function UploadCard({ title, hint, accept, slot, onFile, children }) {
  const inputId = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const handleFiles = (files) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <section
      className={`card${slot.isDragging ? " dragging" : ""}`}
      onDragOver={(event) => { event.preventDefault(); }}
      onDragEnter={(event) => { event.preventDefault(); onFile(null, true); }}
      onDragLeave={(event) => { event.preventDefault(); onFile(null, false); }}
      onDrop={(event) => {
        event.preventDefault();
        onFile(null, false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <label htmlFor={inputId}>
        <span>{title}</span>
        <small>{hint}</small>
        <span className="file-picker" aria-hidden="true">
          <span className="file-picker-button">Browse…</span>
          <span className={`file-picker-name${slot.file ? "" : " muted"}`}>
            {slot.file ? slot.file.name : "No file chosen"}
          </span>
        </span>
        <input
          id={inputId}
          className="file-input"
          type="file"
          accept={accept}
          onChange={(event) => handleFiles(event.currentTarget.files)}
        />
      </label>
      {children ? <div className="download-help">{children}</div> : null}
      <div className="status-list" aria-live="polite">
        {slot.file ? <span>{slot.file.name} ({formatBytes(slot.file.size)})</span> : <span className="muted">No file selected.</span>}
        {slot.status ? <span>{slot.status}</span> : null}
        {slot.sha256 ? <span className="success">SHA-256: {slot.sha256}</span> : null}
        {slot.pathCount ? <span className="success">Required paths OK: {slot.pathCount}</span> : null}
        {slot.error ? <span className="error">{slot.error}</span> : null}
      </div>
    </section>
  );
}

export default function RankMergerIsland({ gitCommitInfo = null }) {
  const topbarRunRef = useRef(0);
  const showrankRunRef = useRef(0);
  const [appState, setAppState] = useState(initialState);
  const { topbar, showrank, result, isBusy } = appState;
  const [freshGitCommitInfo, setFreshGitCommitInfo] = useState(null);
  const [missingAlertsEnabled, setMissingAlertsEnabled] = useState(true);
  const expectedVariantId = missingAlertsEnabled ? "showrank_barebones" : "showrank_barebones_no_missing";
  const selectedEditionLabel = SHOWRANK_EDITION_LABELS[expectedVariantId];
  const selectedShowrankSource = SHOWRANK_SOURCES[expectedVariantId];
  const helperText = requiredMessage(topbar, showrank, selectedEditionLabel);
  const canBuild = Boolean(topbar.bytes && showrank.bytes && !topbar.error && !showrank.error && !isBusy);
  const activeGitCommitInfo = freshGitCommitInfo || gitCommitInfo;

  useEffect(() => {
    let ignore = false;
    const refreshCommitInfo = async () => {
      try {
        const response = await fetch(buildGitCommitInfoRequestUrl(import.meta.env.BASE_URL), { cache: "no-store" });
        if (!response.ok) return;
        const nextGitCommitInfo = await response.json();
        if (!ignore && isGitCommitInfoPayload(nextGitCommitInfo)) {
          setFreshGitCommitInfo(nextGitCommitInfo);
        }
      } catch {
        // Keep the statically embedded commit info when the refresh endpoint is unavailable.
      }
    };
    refreshCommitInfo();
    return () => { ignore = true; };
  }, []);

  async function handleTopbarFile(file, dragging) {
    if (!file) {
      if (typeof dragging === "boolean") patchSlot(setAppState, "topbar", { isDragging: dragging });
      return;
    }

    const run = ++topbarRunRef.current;
    resetResult(setAppState);
    patchSlot(setAppState, "topbar", { ...emptySlot(), file, status: "Hashing…" });
    try {
      const bytes = await readFileBytes(file);
      const sha256 = await sha256Hex(bytes);
      if (run === topbarRunRef.current) {
        patchSlot(setAppState, "topbar", { bytes, sha256, status: "Extracting Top Bar Plus VPK…" });
        const validation = await validateTopbarArchive(file, bytes);
        if (run === topbarRunRef.current) {
          patchSlot(setAppState, "topbar", {
            bytes,
            sha256: validation.sha256,
            parsed: validation.parsed,
            pathCount: TOPBAR_REQUIRED_VPK_PATHS.length,
            status: "Validated Top Bar Plus V40D"
          });
        }
      }
    } catch (error) {
      if (run === topbarRunRef.current) {
        patchSlot(setAppState, "topbar", { bytes: null, error: error?.message || String(error), status: "" });
      }
    }
  }

  async function handleShowrankFile(file, dragging) {
    if (!file) {
      if (typeof dragging === "boolean") patchSlot(setAppState, "showrank", { isDragging: dragging });
      return;
    }

    const run = ++showrankRunRef.current;
    resetResult(setAppState);
    patchSlot(setAppState, "showrank", { ...emptySlot(), file, status: "Hashing…" });
    try {
      const bytes = await readFileBytes(file);
      const sha256 = await sha256Hex(bytes);
      if (run === showrankRunRef.current) {
        patchSlot(setAppState, "showrank", { bytes, sha256, status: "Extracting ShowRank VPK…" });
        const validation = await validateShowrankArchive(file, bytes, expectedVariantId);
        if (run === showrankRunRef.current) {
          patchSlot(setAppState, "showrank", {
            bytes,
            sha256: validation.sha256,
            parsed: validation.parsed,
            variantId: validation.variantId,
            pathCount: SHOWRANK_REQUIRED_VPK_PATHS.length,
            status: `Validated ${SHOWRANK_EDITION_LABELS[validation.variantId]}`
          });
        }
      }
    } catch (error) {
      if (run === showrankRunRef.current) {
        patchSlot(setAppState, "showrank", { bytes: null, error: error?.message || String(error), status: "" });
      }
    }
  }



  function handleMissingAlertsToggle() {
    ++showrankRunRef.current;
    setMissingAlertsEnabled((enabled) => !enabled);
    setAppState((state) => ({ ...state, showrank: emptySlot(), result: EMPTY_RESULT }));
  }

  async function handleBuild() {
    if (!canBuild) return;
    if (result.bytes && result.filename) {
      downloadBytes(result.filename, result.bytes);
      return;
    }
    setAppState((state) => ({ ...state, isBusy: true, result: { ...EMPTY_RESULT, status: `Fetching latest ${selectedEditionLabel} source and Closure ADVANCED-minifying all JavaScript…` } }));
    try {
      const merged = await buildMergedRankVpk({
        topbarArchiveBytes: topbar.bytes,
        showrankArchiveBytes: showrank.bytes,
        expectedVariantId
      });
      downloadBytes(merged.filename, merged.bytes);
      setAppState((state) => ({
        ...state,
        result: {
          bytes: merged.bytes,
          filename: merged.filename,
          overwrittenPaths: merged.overwrittenPaths,
          fileCount: merged.outputFiles.length,
          variantId: merged.variantId,
          status: `Built and downloaded ${merged.outputFiles.length} current ${selectedEditionLabel} files from ${merged.sourceOrigin} source; Closure ADVANCED ${Object.keys(merged.validation.payload.closureMetadata.scripts).length} scripts, ${merged.validation.payload.closureMetadata.sourceBytes.toLocaleString()} → ${merged.validation.payload.closureMetadata.outputBytes.toLocaleString()} bytes (${formatBytes(merged.bytes.byteLength)} VPK).`,
          error: ""
        }
      }));
    } catch (error) {
      setAppState((state) => ({ ...state, result: { ...EMPTY_RESULT, error: error?.message || String(error) } }));
    } finally {
      setAppState((state) => ({ ...state, isBusy: false }));
    }
  }

  return (
    <div className="rank-merger">
      <header className="header">
        <div className="header-main">
          <div className="title-row">
            <h1>Topbar Rank VPK Merger</h1>
            {activeGitCommitInfo?.url && activeGitCommitInfo?.shortHash ? (
              <a
                className="commit-version-link"
                href={activeGitCommitInfo.url}
                target="_blank"
                rel="noreferrer"
                aria-label={activeGitCommitInfo.title || `Latest commit ${activeGitCommitInfo.shortHash}`}
                title={activeGitCommitInfo.title || `Latest commit ${activeGitCommitInfo.shortHash}`}
              >
                <span aria-hidden="true">⌁</span>
                <span>Commit</span>
                <code>{activeGitCommitInfo.shortHash}</code>
              </a>
            ) : null}
          </div>
          <p>Build the latest combined Topbar Rank VPK from exact Top Bar Plus V40D and one of two current ShowRank Barebones editions. Files stay on your machine.</p>
        </div>
        <div className="header-actions" aria-label="Project support actions">
          <a className="support-button" href="https://ko-fi.com/hantuaraya" target="_blank" rel="noreferrer" aria-label="Donate on Ko-fi">
            <span aria-hidden="true">♥</span>
            <span>Donate</span>
          </a>
          <a className="support-button" href="https://github.com/Hantu-Raya/Show-rank-merger" target="_blank" rel="noreferrer" aria-label="Star the repository on GitHub">
            <span aria-hidden="true">★</span>
            <span>Star repo</span>
          </a>
        </div>
      </header>

      <div className="grid">
        <UploadCard
          title={`Required: ${TOPBAR_SOURCE.expectedFileName}`}
          hint={<>Exact current GameBanana <a href="https://gamebanana.com/mods/623518" target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>Top Bar Plus</a> archive. Archive and embedded VPK SHA-256 must match.</>}
          accept=".zip,application/zip"
          slot={topbar}
          onFile={handleTopbarFile}
        >
          <p>Do not have the file?</p>
          <a href={TOPBAR_SOURCE.modUrl} target="_blank" rel="noreferrer">
            Download Top Bar Plus
          </a>
        </UploadCard>
        <UploadCard
          key={expectedVariantId}
          title={`Required: ShowRank ${selectedEditionLabel}`}
          hint={<>Selected current <a href="https://gamebanana.com/mods/681028" target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>ShowRank Barebones</a> edition. Archive and embedded VPK SHA-256 must match.</>}
          accept=".7z,application/x-7z-compressed"
          slot={showrank}
          onFile={handleShowrankFile}
        >
          <button
            className="edition-toggle"
            type="button"
            aria-pressed={missingAlertsEnabled}
            disabled={isBusy}
            onClick={handleMissingAlertsToggle}
          >
            <span>Missing alerts</span>
            <strong>{missingAlertsEnabled ? "ON" : "OFF"}</strong>
          </button>
          <p>Download selected ShowRank edition:</p>
          <a href={selectedShowrankSource.modUrl} target="_blank" rel="noreferrer">
            {selectedShowrankSource.expectedFileName}
          </a>
        </UploadCard>
      </div>

      <section className="result-panel" aria-live="polite">
        <h2>Result</h2>
        <div className="result-grid">
          <span>Top Bar SHA-256</span><strong>{topbar.sha256 || "Not validated"}</strong>
          <span>ShowRank SHA-256</span><strong>{showrank.sha256 || "Not validated"}</strong>
          <span>ShowRank edition</span><strong>{SHOWRANK_EDITION_LABELS[showrank.variantId || result.variantId] || "Not detected"}</strong>
          <span>Generated files</span><strong>{result.fileCount || "Not built"}</strong>
        </div>
        {result.status ? <p className="success">{result.status}</p> : <p className="helper">{helperText}</p>}
        {result.error ? <p className="error">{result.error}</p> : null}
        <div>
          <button className="primary" type="button" disabled={!canBuild} onClick={handleBuild}>
            {isBusy ? "Building…" : result.bytes ? "Download VPK again" : "Build and download VPK"}
          </button>
          {!canBuild ? <p className="helper">{helperText}</p> : null}
        </div>
      </section>

      <footer className="page-footer" aria-label="Project notices">
        <p>
          Unofficial fan-made tool. Not affiliated with Valve. Files run locally and are not uploaded. Built by{" "}
          <a href="https://github.com/Hantu-Raya" target="_blank" rel="noreferrer">Hantu-Raya</a>.
          {" "}Top Bar Plus by{" "}
          <a href="https://gamebanana.com/members/2408486" target="_blank" rel="noreferrer">bonclide</a>.
          {" "}Apache-2.0 licensed; see LICENSE and NOTICE.
        </p>
      </footer>
    </div>
  );
}
