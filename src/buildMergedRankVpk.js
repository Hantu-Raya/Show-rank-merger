import { buildTopbarRankPayload } from "./topbarRankPayload.js";
import { fetchLatestTopbarRankSourceTexts } from "./topbarRankSourceFetch.js";
import { mergeFilesWithPriority } from "./rankMerge.js";
import { parseVpk } from "./vpkReader.js";
import { SHOWRANK_RELEASES, TOPBAR_SOURCE } from "./gamebananaSources.js";
import { validateShowrankArchive, validateTopbarArchive } from "./sourceValidation.js";
import { writeVpk } from "./vpkWriter.js";

function toBytes(input) {
  if (input == null) return null;
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  throw new Error("Expected bytes");
}

function outputFilenameForMergedVpk(editionId) {
  if (editionId === "alert") return "topbar_rank_barebones_dir.vpk";
  if (editionId === "no_missing") return "topbar_rank_barebones_no_missing_dir.vpk";
  throw new Error(`Unsupported Topbar Rank edition: ${editionId}`);
}

export async function buildMergedRankVpk({
  baseVpkBytes = null,
  topbarArchiveBytes,
  showrankArchiveBytes,
  editionId = "alert",
  payloadSourceTexts = null,
  fetchLatestPayloadSource = true
}) {
  const topbarValidation = await validateTopbarArchive(
    { name: TOPBAR_SOURCE.expectedFileName },
    toBytes(topbarArchiveBytes)
  );
  const showrankValidation = await validateShowrankArchive(
    { name: SHOWRANK_RELEASES[editionId]?.fileName || "showrank.7z" },
    toBytes(showrankArchiveBytes),
    editionId
  );
  const baseParsed = baseVpkBytes ? parseVpk(toBytes(baseVpkBytes)) : { files: [] };
  let sourceTexts = payloadSourceTexts;
  let sourceOrigin = sourceTexts ? "provided" : "bundled";
  if (!sourceTexts && fetchLatestPayloadSource) {
    try {
      sourceTexts = await fetchLatestTopbarRankSourceTexts({ editionId });
      sourceOrigin = "latest";
    } catch {
      // Network or incompatible upstream source falls back to the checked-in edition.
    }
  }
  const payload = await buildTopbarRankPayload({
    editionId,
    ...(sourceTexts ? { sourceTexts } : {})
  });
  const { files: outputFiles, overwrittenPaths } = mergeFilesWithPriority(baseParsed.files, payload.files);
  const bytes = writeVpk(outputFiles);

  return {
    bytes,
    editionId: payload.editionId,
    outputFiles,
    overwrittenPaths,
    filename: outputFilenameForMergedVpk(payload.editionId),
    sourceOrigin,
    validation: {
      topbar: topbarValidation,
      showrank: showrankValidation,
      payload
    }
  };
}
