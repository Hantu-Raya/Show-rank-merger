import { buildTopbarRankPayload } from "./topbarRankPayload.js";
import { fetchLatestTopbarRankSourceTexts } from "./topbarRankSourceFetch.js";
import { mergeFilesWithPriority } from "./rankMerge.js";
import { parseVpk } from "./vpkReader.js";
import { validateShowrankArchive, validateTopbarArchive } from "./sourceValidation.js";
import { writeVpk } from "./vpkWriter.js";

function toBytes(input) {
  if (input == null) return null;
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  throw new Error("Expected bytes");
}

export function outputFilenameForMergedVpk(variantId, baseName = "") {
  if (!baseName) return `topbar-rank-${variantId}_dir.vpk`;
  const clean = String(baseName).replace(/[\\/:*?"<>|]+/g, "_");
  const withExtension = clean.toLowerCase().endsWith(".vpk") ? clean : `${clean}.vpk`;
  return `topbar-rank-${variantId}-${withExtension}`;
}

export async function buildMergedRankVpk({
  baseVpkBytes = null,
  topbarArchiveBytes,
  showrankArchiveBytes,
  baseName = "",
  payloadSourceTexts = null,
  fetchLatestPayloadSource = true
}) {
  const [topbarValidation, showrankValidation] = await Promise.all([
    validateTopbarArchive({ name: "v34d_top_bar_plus.zip" }, toBytes(topbarArchiveBytes)),
    validateShowrankArchive({ name: "showrank.7z" }, toBytes(showrankArchiveBytes))
  ]);
  const variantId = showrankValidation.variantId;
  const baseParsed = baseVpkBytes ? parseVpk(toBytes(baseVpkBytes)) : { files: [] };
  const sourceTexts = payloadSourceTexts || (fetchLatestPayloadSource ? await fetchLatestTopbarRankSourceTexts() : null);
  const payload = await buildTopbarRankPayload(variantId, sourceTexts ? { sourceTexts } : undefined);
  const { files: outputFiles, overwrittenPaths } = mergeFilesWithPriority(baseParsed.files, payload.files);
  const bytes = writeVpk(outputFiles);

  return {
    bytes,
    variantId,
    outputFiles,
    overwrittenPaths,
    filename: outputFilenameForMergedVpk(variantId, baseName),
    validation: {
      topbar: topbarValidation,
      showrank: showrankValidation,
      payload
    }
  };
}
