export const TOPBAR_SOURCE = {
  id: "topbar_v40",
  fileId: "1723559",
  modUrl: "https://gamebanana.com/mods/download/623518#FileInfo_1723559",
  downloadUrl: "https://gamebanana.com/dl/1723559",
  expectedFileName: "v40_top_bar_plus.zip",
  expectedSize: 229255,
  expectedSha256: "bd4d095617af73ad90c62c01fe0e0de310a154527eed60f5baa57af66517f4d5",
  expectedVpkSha256: "239359991704a282eb923a2d7d82450df0bbc06ce3eaddfa8b74059a8ff779fe",
  archiveMember: "pak01_dir.vpk",
  compatibleArchiveMembers: ["pak01_dir.vpk", "pak89_dir.vpk"]
};

export const SHOWRANK_SOURCES = {
  showrank_minify_ranks: {
    fileId: "1723368",
    modUrl: "https://gamebanana.com/mods/download/681028#FileInfo_1723368",
    downloadUrl: "https://gamebanana.com/dl/1723368",
    expectedFileName: "showrank_minify_ranks_20260608_225332.7z",
    expectedSize: 37223,
    expectedSha256: "7900337a98aa7a9e3877919666f014f5fbf7fbce2e076dc5afc7d6ddc6376629",
    archiveMember: "pak89_dir.vpk"
  },
  showrank_minify_ranks_scoreboard_only_topbar: {
    fileId: "1723369",
    modUrl: "https://gamebanana.com/mods/download/681028#FileInfo_1723369",
    downloadUrl: "https://gamebanana.com/dl/1723369",
    expectedFileName: "showrank_minify_ranks_scoreboard_only_topbar_20260608_225332.7z",
    expectedSize: 37366,
    expectedSha256: "174dd723f6fb89c9dea4f72ca293edaa3e65cc66c56729d71548503c3f0827a3",
    archiveMember: "pak89_dir.vpk"
  },
  showrank_normal: {
    fileId: "1723370",
    modUrl: "https://gamebanana.com/mods/download/681028#FileInfo_1723370",
    downloadUrl: "https://gamebanana.com/dl/1723370",
    expectedFileName: "showrank_normal_20260608_225332.7z",
    expectedSize: 37187,
    expectedSha256: "5baaf9a31588162f35ad40c5875871bb61069bd8328e30436e4dc2bc9f8f0018",
    archiveMember: "pak89_dir.vpk"
  },
  showrank_scoreboard: {
    fileId: "1723371",
    modUrl: "https://gamebanana.com/mods/download/681028#FileInfo_1723371",
    downloadUrl: "https://gamebanana.com/dl/1723371",
    expectedFileName: "showrank_scoreboard_only_topbar_20260608_225332.7z",
    expectedSize: 37362,
    expectedSha256: "eb398a80e124ced6bf06d0620d95774da1b01a04118d27aae511d17225b3d341",
    archiveMember: "pak89_dir.vpk"
  }
};

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

export const SHOWRANK_REQUIRED_VPK_PATHS = [
  "panorama/layout/citadel_hud_top_bar.vxml_c",
  "panorama/layout/citadel_hud_top_bar_player.vxml_c",
  "panorama/layout/citadel_ui_context_menu_player.vxml_c",
  "panorama/layout/hud_escape_menu.vxml_c",
  "panorama/layout/players_list_entry.vxml_c",
  "panorama/layout/profile_card.vxml_c",
  "panorama/scripts/showrank_web_media_bridge.vjs_c",
  "panorama/styles/showrank_top_bar.vcss_c",
  "panorama/styles/showrank_player_list.vcss_c",
  "panorama/styles/showrank_profile_card.vcss_c"
];
