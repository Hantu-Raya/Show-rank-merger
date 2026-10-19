import { SHOWRANK_RELEASES } from "./gamebananaSources.js";
import { MERGED_LAYOUTS } from "./mergedLayouts.js";
import { mergeReleaseFiles } from "./rankMerge.js";
import { validateShowrankArchive, validateTopbarArchive } from "./sourceValidation.js";
import { writeVpk } from "./vpkWriter.js";

// Validates both GameBanana archives, then packs one VPK: every Top Bar Plus and ShowRank resource
// as released, plus the merged top bar layouts for the ShowRank edition that was uploaded.
export async function buildMergedRankVpk({ topbarFile, topbarBytes, showrankFile, showrankBytes }) {
  const topbar = await validateTopbarArchive(topbarFile, topbarBytes);
  const showrank = await validateShowrankArchive(showrankFile, showrankBytes);
  const { files, replacedPaths } = mergeReleaseFiles({
    topbarFiles: topbar.parsed.files,
    showrankFiles: showrank.parsed.files,
    layouts: MERGED_LAYOUTS[showrank.editionId]
  });
  return {
    bytes: writeVpk(files),
    filename: SHOWRANK_RELEASES[showrank.editionId].outputFileName,
    editionId: showrank.editionId,
    files,
    replacedPaths,
    topbar: { sha256: topbar.sha256, vpkSha256: topbar.vpkSha256 },
    showrank: { sha256: showrank.sha256, vpkSha256: showrank.vpkSha256 }
  };
}
