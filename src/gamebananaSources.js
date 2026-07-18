export const TOPBAR_SOURCE = {
  id: "topbar_v40c",
  fileId: "1747474",
  modUrl: "https://gamebanana.com/mods/download/623518#FileInfo_1747474",
  downloadUrl: "https://gamebanana.com/dl/1747474",
  expectedFileName: "v40c_top_bar_plus.zip",
  expectedSize: 220302,
  expectedSha256: "147b03b39c2ca8148827d21085553ac0b6a706611bce09fe979cfa3712c2f1e2",
  expectedVpkSha256: "4082798990b217f9affa11f53492073dd16d9fd9563e7dba489ba960af404242",
  archiveMember: "pak01_dir.vpk",
  compatibleArchiveMembers: ["pak01_dir.vpk", "pak89_dir.vpk"]
};

export const SHOWRANK_SOURCES = {
  showrank_normal: {
    fileId: "1748325",
    modUrl: "https://gamebanana.com/mods/download/681028#FileInfo_1748325",
    downloadUrl: "https://gamebanana.com/dl/1748325",
    expectedFileName: "showrank_normal_20260707_105226.7z",
    expectedSize: 36322,
    expectedSha256: "f74ef76418d5ec5a4eedaba32a27651143c1f873c38e5c83c5d3f08b10d44ab9",
    expectedVpkSha256: "67a1f096af5f3100faf50f8e272eba986a399d59d71a88a768ce61a78adb4d3d",
    archiveMember: "archive_normal/pak89_dir.vpk"
  },
  showrank_scoreboard_only_topbar: {
    fileId: "1748326",
    modUrl: "https://gamebanana.com/mods/download/681028#FileInfo_1748326",
    downloadUrl: "https://gamebanana.com/dl/1748326",
    expectedFileName: "showrank_scoreboard_only_topbar_20260707_105226.7z",
    expectedSize: 36457,
    expectedSha256: "d200ebdd6ded8c1a38ced0d92b441a8bdf1a9471fcb1dc0ece73cd89f7492e04",
    expectedVpkSha256: "130d0ec3bad3d72c69137f975799a9dda92bf3bcf5a72be8ce292912f1ac9805",
    archiveMember: "archive_scoreboard_only_topbar/pak89_dir.vpk"
  },
  showrank_minify_ranks: {
    fileId: "1748324",
    modUrl: "https://gamebanana.com/mods/download/681028#FileInfo_1748324",
    downloadUrl: "https://gamebanana.com/dl/1748324",
    expectedFileName: "showrank_minify_ranks_20260707_105226.7z",
    expectedSize: 36377,
    expectedSha256: "78d87607cb650ccb56be41b00bdb6c8525e77a66557bdf2f857f46cd73b64f92",
    expectedVpkSha256: "ecebe06f81d2eb5a4e3550a151999e8ddc287a20f093408a8bc96a5d4ca4b1f7",
    archiveMember: "archive_minify_ranks/pak89_dir.vpk"
  },
  showrank_minify_ranks_scoreboard_only_topbar: {
    fileId: "1748323",
    modUrl: "https://gamebanana.com/mods/download/681028#FileInfo_1748323",
    downloadUrl: "https://gamebanana.com/dl/1748323",
    expectedFileName: "showrank_minify_ranks_scoreboard_only_topbar_20260707_105226.7z",
    expectedSize: 36535,
    expectedSha256: "8db2e65de5b06da8db32c8ee742cdb459b52a250131454e713265bb1f8aa1f49",
    expectedVpkSha256: "53a94ce670d7291d2dbaa8dc0be9908fa48c319871741bcfcfeaaecc7a537a3f",
    archiveMember: "archive_minify_ranks_scoreboard_only_topbar/pak89_dir.vpk"
  }
};

export const SHOWRANK_REQUIRED_VPK_PATHS = [
  "panorama/layout/citadel_hud_top_bar.vxml_c",
  "panorama/layout/citadel_hud_top_bar_player.vxml_c",
  "panorama/layout/citadel_ui_context_menu_player.vxml_c",
  "panorama/layout/hud_escape_menu.vxml_c",
  "panorama/layout/players_list_entry.vxml_c",
  "panorama/layout/profile_card.vxml_c",
  "panorama/scripts/showrank_common.vjs_c",
  "panorama/styles/showrank_player_list.vcss_c",
  "panorama/styles/showrank_profile_card.vcss_c",
  "panorama/styles/showrank_top_bar.vcss_c"
];


export const TOPBAR_REQUIRED_VPK_PATHS = [
  "panorama/layout/citadel_hud_hero_shop.vxml_c",
  "panorama/layout/citadel_hud_top_bar.vxml_c",
  "panorama/layout/citadel_hud_top_bar_player.vxml_c",
  "panorama/layout/hud_paused.vxml_c",
  "panorama/scripts/recent_purchases_redux.vjs_c",
  "panorama/scripts/recent_purchases_redux_data.vjs_c",
  "panorama/scripts/rejuvnbufftimer.vjs_c",
  "panorama/scripts/unspent.vjs_c",
  "panorama/scripts/urntracker.vjs_c",
  "panorama/styles/citadel_hud_hero_shop.vcss_c",
  "panorama/styles/citadel_hud_top_bar.vcss_c",
  "panorama/styles/hero_testing_menu.vcss_c",
  "panorama/styles/hud.vcss_c",
  "panorama/styles/hud_damage_report.vcss_c",
  "panorama/styles/hud_paused.vcss_c",
  "panorama/styles/objectives_map.vcss_c"
];

