export const TOPBAR_RANK_EDITIONS = Object.freeze(["alert", "no_missing"]);
export const TOPBAR_RANK_DEFAULT_EDITION = "alert";

export const TOPBAR_RANK_SOURCE_BASE_URLS = Object.freeze({
  alert: "https://raw.githubusercontent.com/Hantu-Raya/Deadlock-mods-collection/main/topbar_rank",
  no_missing: "https://raw.githubusercontent.com/Hantu-Raya/Deadlock-mods-collection/main/topbar_rank_no_missing"
});

export const TOPBAR_RANK_BAREBONES_SOURCE_BASE_URLS = Object.freeze({
  alert: "https://raw.githubusercontent.com/Hantu-Raya/Deadlock-mods-collection/main/showrank_barebones",
  no_missing: "https://raw.githubusercontent.com/Hantu-Raya/Deadlock-mods-collection/main/showrank_barebones_no_missing"
});

export const TOPBAR_RANK_COMPOSITION_SOURCE_BASE_URL =
  "https://raw.githubusercontent.com/Hantu-Raya/Deadlock-mods-collection/main";
export const TOPBAR_RANK_COMPOSITION_SOURCE_PATHS = Object.freeze([
  "profile_stats_community/panorama/scripts/profile_stats_community.js",
  "profile_stats_community/panorama/styles/profile_stats_community.css",
  "scripts/viewed-profile-identity-policy.js"
]);

export const TOPBAR_RANK_SOURCE_PATHS = [
  "panorama/layout/citadel_db_page_profile.xml",
  "panorama/layout/citadel_hud_hero_shop.xml",
  "panorama/layout/citadel_hud_top_bar.xml",
  "panorama/layout/citadel_hud_top_bar_player.xml",
  "panorama/layout/citadel_ui_context_menu_player.xml",
  "panorama/layout/hud_escape_menu.xml",
  "panorama/layout/hud_paused.xml",
  "panorama/layout/players_list_entry.xml",
  "panorama/layout/profile_card.xml",
  "panorama/scripts/recent_purchases_redux.js",
  "panorama/scripts/recent_purchases_redux_data.js",
  "panorama/scripts/rejuvnbufftimer.js",
  "panorama/scripts/showrank_barebones.js",
  "panorama/scripts/unspent.js",
  "panorama/scripts/urntracker.js",
  "panorama/styles/citadel_hud_hero_shop.css",
  "panorama/styles/citadel_hud_top_bar.css",
  "panorama/styles/hero_testing_menu.css",
  "panorama/styles/hud.css",
  "panorama/styles/hud_damage_report.css",
  "panorama/styles/hud_paused.css",
  "panorama/styles/objectives_map.css",
  "panorama/styles/showrank_barebones_topbar.css"
];

export function assertTopbarRankEdition(editionId) {
  if (!TOPBAR_RANK_EDITIONS.includes(editionId)) {
    throw new Error(`Unknown Topbar Rank edition: ${editionId}`);
  }
  return editionId;
}
