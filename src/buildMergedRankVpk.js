import { buildTopbarRankPayload } from "./topbarRankPayload.js";
import { fetchLatestTopbarRankSourceTexts } from "./topbarRankSourceFetch.js";
import { mergeFilesWithPriority } from "./rankMerge.js";
import { parseVpk } from "./vpkReader.js";
import { TOPBAR_SOURCE } from "./gamebananaSources.js";
import { validateTopbarArchive } from "./sourceValidation.js";
import { writeVpk } from "./vpkWriter.js";

function toBytes(input) {
  if (input == null) return null;
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  throw new Error("Expected bytes");
}

function outputFilenameForMergedVpk(baseName = "") {
  if (!baseName) return "topbar-rank-normal_dir.vpk";
  const clean = String(baseName).replace(/[\\/:*?"<>|]+/g, "_");
  const withExtension = clean.toLowerCase().endsWith(".vpk") ? clean : `${clean}.vpk`;
  return `topbar-rank-normal-${withExtension}`;
}

export async function buildMergedRankVpk({
  baseVpkBytes = null,
  topbarArchiveBytes,
  baseName = "",
  payloadSourceTexts = null,
  fetchLatestPayloadSource = true
}) {
  const topbarValidation = await validateTopbarArchive(
    { name: TOPBAR_SOURCE.expectedFileName },
    toBytes(topbarArchiveBytes)
  );
  const baseParsed = baseVpkBytes ? parseVpk(toBytes(baseVpkBytes)) : { files: [] };
  let sourceTexts = payloadSourceTexts;
  let sourceOrigin = sourceTexts ? "provided" : "bundled";
  if (!sourceTexts && fetchLatestPayloadSource) {
    try {
      sourceTexts = await fetchLatestTopbarRankSourceTexts();
      sourceOrigin = "latest";
    } catch (error) {
      if (String(error?.message || error).includes("differs byte-for-byte")) throw error;
    }
  }
  const payload = await buildTopbarRankPayload(sourceTexts ? { sourceTexts } : undefined);
  const { files: outputFiles, overwrittenPaths } = mergeFilesWithPriority(baseParsed.files, payload.files);
  const bytes = writeVpk(outputFiles);

  return {
    bytes,
    outputFiles,
    overwrittenPaths,
    filename: outputFilenameForMergedVpk(baseName),
    sourceOrigin,
    validation: {
      topbar: topbarValidation,
      payload
    }
  };
}
