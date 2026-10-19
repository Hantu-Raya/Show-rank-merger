import { useEffect, useRef, useState } from "react";

import { buildMergedRankVpk } from "../buildMergedRankVpk.js";
import { downloadBytes } from "../download.js";
import { SHOWRANK_RELEASES, TOPBAR_SOURCE } from "../gamebananaSources.js";
import { buildGitCommitInfoRequestUrl, isGitCommitInfoPayload } from "../gitCommitInfoRefresh.js";
import { validateShowrankArchive, validateTopbarArchive } from "../sourceValidation.js";

const EDITION_NOTES = {
  alert: "Normal edition, with MISSING tags and the ENEMY MISSING alert",
  no_missing: "No Missing edition, without MISSING tags or the alert"
};

const EMPTY_SLOT = { file: null, bytes: null, state: "empty", message: "", editionId: "", sha256: "", vpkSha256: "" };
const EMPTY_RESULT = { bytes: null, filename: "", fileCount: 0, error: "" };

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function CheckIcon() {
  return (
    <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FileStep({ number, title, inputId, accept, slot, disabled, onFile, children }) {
  const [isDragging, setIsDragging] = useState(false);
  const statusId = `${inputId}-status`;
  const pick = (files) => {
    if (files?.[0] && !disabled) onFile(files[0]);
  };

  return (
    <li
      className={`step${isDragging ? " is-dragging" : ""}`}
      data-state={slot.state}
      onDragOver={(event) => event.preventDefault()}
      onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false); }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        pick(event.dataTransfer.files);
      }}
    >
      <span className="step-number" aria-hidden="true">{number}</span>
      <div className="step-body">
        <h2 id={`${inputId}-title`}>{title}</h2>
        <div className="step-help">{children}</div>
        <div className="file-row">
          <label id={`${inputId}-label`} className={`file-button${disabled ? " is-disabled" : ""}`} htmlFor={inputId}>
            {slot.file ? "Replace file" : "Choose file"}
          </label>
          <input
            id={inputId}
            className="visually-hidden"
            type="file"
            accept={accept}
            disabled={disabled}
            aria-labelledby={`${inputId}-label ${inputId}-title`}
            aria-describedby={statusId}
            aria-invalid={slot.state === "error" ? "true" : undefined}
            onChange={(event) => { pick(event.currentTarget.files); event.currentTarget.value = ""; }}
          />
          <span className="file-name">{slot.file ? slot.file.name : "or drop it here"}</span>
        </div>
        <p id={statusId} className={`status status-${slot.state}`} role="status" aria-live={slot.state === "error" ? "assertive" : "polite"}>
          {slot.state === "ok" ? <CheckIcon /> : null}
          {slot.message}
        </p>
      </div>
    </li>
  );
}

export default function RankMergerIsland({ gitCommitInfo = null }) {
  const runs = useRef({ topbar: 0, showrank: 0, build: 0 });
  const [topbar, setTopbar] = useState(EMPTY_SLOT);
  const [showrank, setShowrank] = useState(EMPTY_SLOT);
  const [result, setResult] = useState(EMPTY_RESULT);
  const [isBuilding, setIsBuilding] = useState(false);
  const [commitInfo, setCommitInfo] = useState(gitCommitInfo);

  useEffect(() => {
    let ignore = false;
    fetch(buildGitCommitInfoRequestUrl(import.meta.env.BASE_URL), { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((info) => { if (!ignore && isGitCommitInfoPayload(info)) setCommitInfo(info); })
      .catch(() => {});
    return () => { ignore = true; };
  }, []);

  async function check(key, file, setSlot, validate, describe) {
    const run = ++runs.current[key];
    runs.current.build += 1;
    setResult(EMPTY_RESULT);
    setSlot({ ...EMPTY_SLOT, file, state: "checking", message: "Checking…" });
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const validation = await validate(file, bytes);
      if (run !== runs.current[key]) return;
      setSlot({ file, bytes, state: "ok", message: describe(validation), editionId: validation.editionId || "", sha256: validation.sha256, vpkSha256: validation.vpkSha256 });
    } catch (error) {
      if (run !== runs.current[key]) return;
      setSlot({ ...EMPTY_SLOT, file, state: "error", message: error?.message || String(error) });
    }
  }

  const handleTopbar = (file) => check("topbar", file, setTopbar, validateTopbarArchive, () => `${TOPBAR_SOURCE.label}, verified`);
  const handleShowrank = (file) => check("showrank", file, setShowrank, validateShowrankArchive, (validation) => `${EDITION_NOTES[validation.editionId]}, verified`);

  // Dropping files anywhere on the page sends a .zip to step 1 and a .7z to step 2.
  function handlePageDrop(event) {
    event.preventDefault();
    if (isBuilding) return;
    for (const file of event.dataTransfer.files) {
      const name = file.name.toLowerCase();
      if (name.endsWith(".zip")) handleTopbar(file);
      else if (name.endsWith(".7z")) handleShowrank(file);
    }
  }

  const ready = topbar.state === "ok" && showrank.state === "ok";
  const outputName = SHOWRANK_RELEASES[showrank.editionId]?.outputFileName || SHOWRANK_RELEASES.alert.outputFileName;

  async function handleBuild() {
    if (!ready || isBuilding) return;
    if (result.bytes) {
      downloadBytes(result.filename, result.bytes);
      return;
    }
    const run = ++runs.current.build;
    setIsBuilding(true);
    try {
      const merged = await buildMergedRankVpk({
        topbarFile: topbar.file,
        topbarBytes: topbar.bytes,
        showrankFile: showrank.file,
        showrankBytes: showrank.bytes
      });
      if (run !== runs.current.build) return;
      downloadBytes(merged.filename, merged.bytes);
      setResult({ bytes: merged.bytes, filename: merged.filename, fileCount: merged.files.length, error: "" });
    } catch (error) {
      if (run === runs.current.build) setResult({ ...EMPTY_RESULT, error: error?.message || String(error) });
    } finally {
      setIsBuilding(false);
    }
  }

  let buildNote = "Add both files to build.";
  if (isBuilding) buildNote = "Building…";
  else if (result.error) buildNote = result.error;
  else if (result.bytes) buildNote = `Downloaded ${result.filename} (${formatSize(result.bytes.byteLength)}).`;
  else if (ready) buildNote = `Ready. You'll get ${outputName}.`;

  return (
    <div className="page" onDragOver={(event) => event.preventDefault()} onDrop={handlePageDrop}>
      <header className="intro">
        <p className="eyebrow">Deadlock mod tool</p>
        <h1>ShowRank + Top Bar Plus</h1>
        <p className="lede">
          ShowRank and Top Bar Plus replace the same two top bar layouts, so with both installed one of them loses its
          top bar changes. This page combines ShowRank v1.0.0 and Top Bar Plus v5 into one VPK that keeps both. Your files
          are processed in your browser and are not uploaded.
        </p>
      </header>

      <ol className="steps">
        <FileStep number="1" title="Top Bar Plus v5" inputId="topbar-file" accept=".zip,application/zip" slot={topbar} disabled={isBuilding} onFile={handleTopbar}>
          <p>
            Download <a href={TOPBAR_SOURCE.modUrl} target="_blank" rel="noreferrer"><code>{TOPBAR_SOURCE.fileName}</code></a> from
            GameBanana and add it here unchanged.
          </p>
        </FileStep>

        <FileStep number="2" title="ShowRank v1.0.0" inputId="showrank-file" accept=".7z,application/x-7z-compressed" slot={showrank} disabled={isBuilding} onFile={handleShowrank}>
          <p>Add one of the two downloads. The result matches the one you choose.</p>
          <ul className="choices">
            <li>
              <a href={SHOWRANK_RELEASES.alert.modUrl} target="_blank" rel="noreferrer"><code>{SHOWRANK_RELEASES.alert.fileName}</code></a>
              <span>Normal: MISSING tags and the ENEMY MISSING alert for enemies who disappear early in a match.</span>
            </li>
            <li>
              <a href={SHOWRANK_RELEASES.no_missing.modUrl} target="_blank" rel="noreferrer"><code>{SHOWRANK_RELEASES.no_missing.fileName}</code></a>
              <span>No Missing: everything else, without those alerts.</span>
            </li>
          </ul>
        </FileStep>

        <li className="step" data-state={result.bytes ? "ok" : result.error ? "error" : "empty"}>
          <span className="step-number" aria-hidden="true">3</span>
          <div className="step-body">
            <h2>Build and install</h2>
            <div className="file-row">
              <button className="primary" type="button" disabled={!ready || isBuilding} aria-describedby="build-status" onClick={handleBuild}>
                {isBuilding ? "Building…" : result.bytes ? "Download again" : "Build VPK"}
              </button>
            </div>
            <p id="build-status" className={`status ${result.error ? "status-error" : result.bytes ? "status-ok" : ""}`} role="status" aria-live="polite">
              {result.bytes ? <CheckIcon /> : null}
              {buildNote}
            </p>
            <p className="step-help">
              Remove the separate ShowRank and Top Bar Plus VPKs from <code>Deadlock\game\citadel\addons</code>, then put
              the new file there with a free pak name, for example <code>pak89_dir.vpk</code>.
            </p>
          </div>
        </li>
      </ol>

      <details className="details">
        <summary>File details</summary>
        <dl>
          <dt>Top Bar Plus archive</dt><dd><code>{topbar.sha256 || "not added"}</code></dd>
          <dt>Top Bar Plus VPK</dt><dd><code>{topbar.vpkSha256 || "not added"}</code></dd>
          <dt>ShowRank archive</dt><dd><code>{showrank.sha256 || "not added"}</code></dd>
          <dt>ShowRank VPK</dt><dd><code>{showrank.vpkSha256 || "not added"}</code></dd>
          <dt>Output</dt><dd><code>{result.bytes ? `${result.filename}, ${result.fileCount} files` : "not built"}</code></dd>
        </dl>
        <p>
          Every file from both mods is copied unchanged, except <code>citadel_hud_top_bar</code> and{" "}
          <code>citadel_hud_top_bar_player</code>, which both mods replace. Those two come from a merged layout with both mods' additions.
        </p>
      </details>

      <footer className="footer">
        <p>
          Top Bar Plus by <a href="https://gamebanana.com/members/2408486" target="_blank" rel="noreferrer">bonclide</a>.
          {" "}ShowRank and this page by <a href="https://github.com/Hantu-Raya" target="_blank" rel="noreferrer">Hantu-Raya</a>.
          {" "}Not affiliated with Valve.
        </p>
        <p>
          <a href="https://github.com/Hantu-Raya/Show-rank-merger" target="_blank" rel="noreferrer">Source</a>
          {" · "}<a href="https://ko-fi.com/hantuaraya" target="_blank" rel="noreferrer">Ko-fi</a>
          {commitInfo?.url && commitInfo?.shortHash ? (
            <>{" · "}<a href={commitInfo.url} target="_blank" rel="noreferrer" title={commitInfo.title || undefined}>Build <code>{commitInfo.shortHash.slice(0, 7)}</code></a></>
          ) : null}
        </p>
      </footer>
    </div>
  );
}
