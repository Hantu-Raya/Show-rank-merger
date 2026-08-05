import { buildTopbarRankPayload } from "./topbarRankPayload.js";
import { fetchLatestTopbarRankSourceTexts } from "./topbarRankSourceFetch.js";
import { mergeFilesWithPriority } from "./rankMerge.js";
import { parseVpk } from "./vpkReader.js";
import { TOPBAR_SOURCE } from "./gamebananaSources.js";
import { validateShowrankArchive, validateTopbarArchive } from "./sourceValidation.js";
import { writeVpk } from "./vpkWriter.js";

function toBytes(input) {
  if (input == null) return null;
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  throw new Error("Expected bytes");
}

function outputFilenameForMergedVpk(expectedVariantId, baseName = "") {
  if (!baseName) return `topbar-rank-${expectedVariantId}_dir.vpk`;
  const clean = String(baseName).replace(/[\\/:*?"<>|]+/g, "_");
  const withExtension = clean.toLowerCase().endsWith(".vpk") ? clean : `${clean}.vpk`;
  return `topbar-rank-${expectedVariantId}-${withExtension}`;
}

export async function buildMergedRankVpk({
  baseVpkBytes = null,
  topbarArchiveBytes,
  showrankArchiveBytes,
  expectedVariantId = "",
  baseName = "",
  payloadSourceTexts = null,
  fetchLatestPayloadSource = true
}) {
  const topbarValidation = await validateTopbarArchive(
    { name: TOPBAR_SOURCE.expectedFileName },
    toBytes(topbarArchiveBytes)
  );
  const showrankValidation = await validateShowrankArchive(
    { name: "showrank.7z" },
    toBytes(showrankArchiveBytes),
    expectedVariantId
  );
  const variantId = showrankValidation.variantId;
  const baseParsed = baseVpkBytes ? parseVpk(toBytes(baseVpkBytes)) : { files: [] };
  let payload;
  let sourceOrigin = payloadSourceTexts ? "provided" : "bundled";
  if (payloadSourceTexts) {
    payload = await buildTopbarRankPayload({
      expectedVariantId: variantId,
      sourceTexts: payloadSourceTexts
    });
  } else if (fetchLatestPayloadSource) {
    try {
      const latestSourceTexts = await fetchLatestTopbarRankSourceTexts({ expectedVariantId: variantId });
      payload = await buildTopbarRankPayload({
        expectedVariantId: variantId,
        sourceTexts: latestSourceTexts
      });
      sourceOrigin = "latest";
    } catch {
      // A missing or incompatible upstream source uses the checked-in payload.
      payload = await buildTopbarRankPayload({ expectedVariantId: variantId });
    }
  } else {
    payload = await buildTopbarRankPayload({ expectedVariantId: variantId });
  }
  const { files: outputFiles, overwrittenPaths } = mergeFilesWithPriority(baseParsed.files, payload.files);
  const bytes = writeVpk(outputFiles);

  return {
    bytes,
    variantId,
    outputFiles,
    overwrittenPaths,
    filename: outputFilenameForMergedVpk(variantId, baseName),
    sourceOrigin,
    validation: {
      topbar: topbarValidation,
      showrank: showrankValidation,
      payload
    }
  };
}
