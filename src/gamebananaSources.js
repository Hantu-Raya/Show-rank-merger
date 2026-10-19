export const TOPBAR_SOURCE = Object.freeze({
  label: "Top Bar Plus v5",
  fileId: "1834013",
  modUrl: "https://gamebanana.com/mods/download/623518#FileInfo_1834013",
  downloadUrl: "https://gamebanana.com/dl/1834013",
  fileName: "v5_top_bar_plus.zip",
  size: 170896,
  md5: "06d9aabeee4ca8a5f2f53917671916c7",
  sha256: "9aeb1d73474640a0ef476ec82152dfc1622c94b842396d8c660ba40c539885f8",
  vpkSha256: "5ee2c41f9ec1b1664d8858e84c0506c445d25a7bc7d1932b75cef2cf5a05ae67",
  archiveMember: "pak01_dir.vpk"
});

// "alert" shows the MISSING tags and ENEMY MISSING alert for enemies hidden early in a match.
// It never refers to missing rank or API data.
export const SHOWRANK_RELEASES = Object.freeze({
  alert: Object.freeze({
    label: "ShowRank v1.0.0",
    fileId: "1855939",
    modUrl: "https://gamebanana.com/mods/download/681028#FileInfo_1855939",
    downloadUrl: "https://gamebanana.com/dl/1855939",
    fileName: "showrank_barebones_v100.7z",
    size: 50270,
    md5: "5c5df5c10348d760c45ac6c384d7640f",
    sha256: "3eb4c2edb35a212a0039fb67a72d805fa2da7bfb3ed7416f0186ccdc147a9912",
    vpkSha256: "8cd270b48e76679371d15ad31a9f93219dc5b49e19a7574e419ae78e79f000dd",
    archiveMember: "showrank_barebones_dir.vpk",
    outputFileName: "topbar_rank_barebones_dir.vpk"
  }),
  no_missing: Object.freeze({
    label: "ShowRank v1.0.0 No Missing",
    fileId: "1855938",
    modUrl: "https://gamebanana.com/mods/download/681028#FileInfo_1855938",
    downloadUrl: "https://gamebanana.com/dl/1855938",
    fileName: "showrank_barebones_no_missing_v100.7z",
    size: 46429,
    md5: "cded4425541980f98c5b68eacbdde4f0",
    sha256: "be404215d870c8b956d5f47b666e0898a626f0ae4de728b69f7f42afce8cb0f9",
    vpkSha256: "46f3e9b17215f8b94beae70b5035f8dbbea5fe6d283fb4d976c8db4c3b444026",
    archiveMember: "showrank_barebones_no_missing_dir.vpk",
    outputFileName: "topbar_rank_barebones_no_missing_dir.vpk"
  })
});

export const TOPBAR_VPK_PATHS = Object.freeze([
  "panorama/layout/citadel_hud_hero_shop.vxml_c",
  "panorama/layout/citadel_hud_top_bar.vxml_c",
  "panorama/layout/citadel_hud_top_bar_player.vxml_c",
  "panorama/layout/hud_paused.vxml_c",
  "panorama/scripts/recent_purchases_redux.vjs_c",
  "panorama/scripts/recent_purchases_redux_data.vjs_c",
  "panorama/scripts/topbar_rank_hud.vjs_c",
  "panorama/styles/base/citadel_hud_top_bar.vcss_c",
  "panorama/styles/base/hud.vcss_c",
  "panorama/styles/base/hud_paused.vcss_c",
  "panorama/styles/citadel_hud_top_bar.vcss_c",
  "panorama/styles/hud.vcss_c",
  "panorama/styles/hud_paused.vcss_c",
  "readme.txt"
]);

export const SHOWRANK_VPK_PATHS = Object.freeze([
  "panorama/layout/citadel_db_page_profile.vxml_c",
  "panorama/layout/citadel_hud_top_bar.vxml_c",
  "panorama/layout/citadel_hud_top_bar_player.vxml_c",
  "panorama/layout/citadel_ui_context_menu_player.vxml_c",
  "panorama/layout/hud_escape_menu.vxml_c",
  "panorama/layout/players_list_entry.vxml_c",
  "panorama/layout/post_game/citadel_db_post_game_scoreboard_new.vxml_c",
  "panorama/layout/profile_card.vxml_c",
  "panorama/scripts/showrank_barebones.vjs_c",
  "panorama/styles/showrank_barebones_topbar.vcss_c"
]);
