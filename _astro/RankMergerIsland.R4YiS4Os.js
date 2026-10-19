var z=Object.freeze,pe=Object.defineProperty;var B=(e,a)=>z(pe(e,"raw",{value:z(a||e.slice())}));import{a as x}from"./index.UEuQJ2Tp.js";var H={exports:{}},C={};var W;function me(){if(W)return C;W=1;var e=Symbol.for("react.transitional.element"),a=Symbol.for("react.fragment");function t(n,r,l){var o=null;if(l!==void 0&&(o=""+l),r.key!==void 0&&(o=""+r.key),"key"in r){l={};for(var i in r)i!=="key"&&(l[i]=r[i])}else l=r;return r=l.ref,{$$typeof:e,type:n,key:o,ref:r!==void 0?r:null,props:l}}return C.Fragment=a,C.jsx=t,C.jsxs=t,C}var Y;function be(){return Y||(Y=1,H.exports=me()),H.exports}var s=be();const k=Object.freeze({label:"Top Bar Plus v5",fileId:"1834013",modUrl:"https://gamebanana.com/mods/download/623518#FileInfo_1834013",downloadUrl:"https://gamebanana.com/dl/1834013",fileName:"v5_top_bar_plus.zip",size:170896,md5:"06d9aabeee4ca8a5f2f53917671916c7",sha256:"9aeb1d73474640a0ef476ec82152dfc1622c94b842396d8c660ba40c539885f8",vpkSha256:"5ee2c41f9ec1b1664d8858e84c0506c445d25a7bc7d1932b75cef2cf5a05ae67",archiveMember:"pak01_dir.vpk"}),_=Object.freeze({alert:Object.freeze({label:"ShowRank v1.0.0",fileId:"1855939",modUrl:"https://gamebanana.com/mods/download/681028#FileInfo_1855939",downloadUrl:"https://gamebanana.com/dl/1855939",fileName:"showrank_barebones_v100.7z",size:50270,md5:"5c5df5c10348d760c45ac6c384d7640f",sha256:"3eb4c2edb35a212a0039fb67a72d805fa2da7bfb3ed7416f0186ccdc147a9912",vpkSha256:"8cd270b48e76679371d15ad31a9f93219dc5b49e19a7574e419ae78e79f000dd",archiveMember:"showrank_barebones_dir.vpk",outputFileName:"topbar_rank_barebones_dir.vpk"}),no_missing:Object.freeze({label:"ShowRank v1.0.0 No Missing",fileId:"1855938",modUrl:"https://gamebanana.com/mods/download/681028#FileInfo_1855938",downloadUrl:"https://gamebanana.com/dl/1855938",fileName:"showrank_barebones_no_missing_v100.7z",size:46429,md5:"cded4425541980f98c5b68eacbdde4f0",sha256:"be404215d870c8b956d5f47b666e0898a626f0ae4de728b69f7f42afce8cb0f9",vpkSha256:"46f3e9b17215f8b94beae70b5035f8dbbea5fe6d283fb4d976c8db4c3b444026",archiveMember:"showrank_barebones_no_missing_dir.vpk",outputFileName:"topbar_rank_barebones_no_missing_dir.vpk"})}),fe=Object.freeze(["panorama/layout/citadel_hud_hero_shop.vxml_c","panorama/layout/citadel_hud_top_bar.vxml_c","panorama/layout/citadel_hud_top_bar_player.vxml_c","panorama/layout/hud_paused.vxml_c","panorama/scripts/recent_purchases_redux.vjs_c","panorama/scripts/recent_purchases_redux_data.vjs_c","panorama/scripts/topbar_rank_hud.vjs_c","panorama/styles/base/citadel_hud_top_bar.vcss_c","panorama/styles/base/hud.vcss_c","panorama/styles/base/hud_paused.vcss_c","panorama/styles/citadel_hud_top_bar.vcss_c","panorama/styles/hud.vcss_c","panorama/styles/hud_paused.vcss_c","readme.txt"]),Pe=Object.freeze(["panorama/layout/citadel_db_page_profile.vxml_c","panorama/layout/citadel_hud_top_bar.vxml_c","panorama/layout/citadel_hud_top_bar_player.vxml_c","panorama/layout/citadel_ui_context_menu_player.vxml_c","panorama/layout/hud_escape_menu.vxml_c","panorama/layout/players_list_entry.vxml_c","panorama/layout/post_game/citadel_db_post_game_scoreboard_new.vxml_c","panorama/layout/profile_card.vxml_c","panorama/scripts/showrank_barebones.vjs_c","panorama/styles/showrank_barebones_topbar.vcss_c"]);var te,se,re,ne;const _e=Object.freeze({alert:Object.freeze({"panorama/layout/citadel_hud_top_bar.vxml_c":String.raw(te||(te=B([`<!-- ShowRank Barebones v1.0.0 + Top Bar Plus v5 merged layout. Generated for Show-rank-merger; do not edit by hand. -->
<root>
	<styles>
		<include src="s2r://panorama/styles/citadel_base_styles.vcss_c" />
		<include src="s2r://panorama/styles/hud_common.vcss_c" />
		<include src="s2r://panorama/styles/citadel_hud_top_bar.vcss_c" />
		<include src="s2r://panorama/styles/unit_status_icons.vcss_c" />
		<include src="s2r://panorama/styles/citadel_hud_game_announcements.vcss_c" />
		<include src="s2r://panorama/styles/showrank_barebones_topbar.vcss_c" />
	</styles>
	<scripts>
		<include src="s2r://panorama/scripts/topbar_rank_hud.vjs_c" />
	<\/scripts>
	<CitadelHudTopBar hittest="false" onload="if ($.TopbarRankHudRootLoaded) $.TopbarRankHudRootLoaded(&apos;topbar_root_onload&apos;);">
		<GlobalClassListener classes="gDetailView gShopOpen gScoreboardOpen gStreetBrawl gPVE" />
		<Panel id="ShowRankBarebonesNotificationRoot" hittest="false" />
		<Panel id="GradientBacker" />
		<Panel class="GameClock">
			<Label class="GameTime" id="GameTime" text="{s:game_clock}" />
			<Label class="Overtime" text="#Citadel_Overtime" />
		</Panel>
		<Panel class="TeamNetworth">
			<Panel id="TeamScoreFriendly" class="TeamScore">
				<Panel class="ScoreBG" />
				<Panel class="ScoreContainer">
					<Label class="ScoreLabel" html="true" text="{s:team_networth}" />
					<Panel class="TeamIcon" />
				</Panel>
			</Panel>
			<Panel id="TeamScoreEnemy" class="TeamScore Right">
				<Panel class="ScoreBG" />
				<Panel class="ScoreContainer">
					<Panel class="TeamIcon" />
					<Label class="ScoreLabel" html="true" text="{s:team_networth}" />
				</Panel>
			</Panel>
			<Panel id="TopbarRankAdvantage" class="TopbarRankAdvantage TopbarRankAdvantageNeutral" hittest="false">
				<Label id="TopbarRankAdvantageLabel" class="TopbarRankAdvantageLabel" text="--" />
			</Panel>
		</Panel>
		<Panel id="ShowRankBarebonesTeamAverageLayer" class="ShowRankBarebonesTeamAverageLayer" hittest="false">
			<Image id="ShowRankBarebonesAverageFriendlyImage" class="ShowRankBarebonesTeamAverageRankImage ShowRankBarebonesTeamAverageFriendlyImage ShowRankBarebonesTeamAverageRankVisible" scaling="stretch-to-fit-preserve-aspect" hittest="false" />
			<Image id="ShowRankBarebonesAverageEnemyImage" class="ShowRankBarebonesTeamAverageRankImage ShowRankBarebonesTeamAverageEnemyImage ShowRankBarebonesTeamAverageRankVisible" scaling="stretch-to-fit-preserve-aspect" hittest="false" />
		</Panel>
		<Panel id="StretBrawlContainer">
			<Label class="roundTitle" text="#Citadel_StreetBrawl_RoundTitle" />
			<Panel id="ScoreCounter">
				<Panel class="point pt1" />
				<Panel class="point pt2" />
				<Panel class="point pt3 matchpoint" />
				<Panel class="point pt4" />
				<Panel class="point pt5" />
			</Panel>
			<Label class="subTitle" text="#Citadel_StreetBrawl_RoundSubtitle" />
		</Panel>
		<Panel class="ChatContainer" hittest="false">
			<CitadelHudTopBarChat id="Team1Chat" team="TEAM_AMBER" />
			<CitadelHudTopBarChat id="Team2Chat" team="TEAM_SAPPHIRE" />
		</Panel>
		<Panel id="TeamsContainer" hittest="false">
			<CitadelHudTopBarTeam id="TeamFriendly" team="2" />
			<CitadelHudTopBarTeam id="TeamEnemy" team="3" />
		</Panel>
		<CitadelObjectivesMap id="ObjectivesMap" liveGame="true" />
		<Panel id="RejuvenatorCharges">
			<Panel id="RejuvenatorFriendly">
				<Panel class="rejuvIcon" />
			</Panel>
			<Panel id="RejuvenatorTimer">
				<Panel class="rejuvTimer">
					<Panel id="StatusEffectsBorder" />
					<Panel id="StatusEffectCooldownOverlay" />
					<Panel id="StatusEffectInner" />
					<Image id="StatusEffectImage" />
					<Panel class="statusEffectImage" />
				</Panel>
				<Label id="MidbossTimerLabel" class="midbossTimerLabel" text="{s:midboss_timer}" />
				<Label id="RejuvenationTimer" class="RejuvenationTimer" text="-:--" />
			</Panel>
			<Panel id="BridgeTimer">
				<Panel class="bridgTimer">
					<Panel id="StatusEffectsBorder" />
					<Panel id="StatusEffectCooldownOverlay" />
					<Panel id="BridgeBackground" />
					<Image id="StatusEffectImage" />
					<Panel class="statusEffectImage" />
				</Panel>
				<Label id="BridgeTimerLabel" class="bridgeTimerLabel" text="..." />
			</Panel>
			<Panel id="RejuvenatorEnemy">
				<Panel class="rejuvIcon" />
			</Panel>
		</Panel>
		<Panel class="KillsAndAbilityPointsContainer">
			<Panel class="ScoreRow TeamKills LeftRightFlow">
				<Panel class="ScoreTypeIcon" />
				<Panel class="ScoreNumbers">
					<Panel class="ScoreNumber">
						<Label class="FriendlyKills KillsLabel" text="{i:friendly_kills}" />
					</Panel>
					<Label class="ScoreTypeLabel" text="#Citadel_Scoreboard_TeamKills" />
					<Panel class="ScoreNumber">
						<Label class="EnemyKills KillsLabel" text="{i:enemy_kills}" />
					</Panel>
				</Panel>
			</Panel>
			<Panel class="ScoreRow TeamAbilityPoints LeftRightFlow">
				<Panel class="ScoreTypeIcon" />
				<Panel class="ScoreNumbers">
					<Panel class="ScoreNumber">
						<Label class="FriendlyAP APLabel" text="{i:friendly_ap}" />
					</Panel>
					<Label class="ScoreTypeLabel" text="#Citadel_Scoreboard_TeamAP" />
					<Panel class="ScoreNumber">
						<Label class="EnemyAP APLabel" text="{i:enemy_ap}" />
					</Panel>
				</Panel>
			</Panel>
		</Panel>
		<Citadel_Hud_Koth id="KothCashInMeter" />
	</CitadelHudTopBar>
</root>
`]))),"panorama/layout/citadel_hud_top_bar_player.vxml_c":String.raw(se||(se=B([`<!-- ShowRank Barebones v1.0.0 + Top Bar Plus v5 merged layout. Generated for Show-rank-merger; do not edit by hand. -->
<root>
	<styles>
		<include src="s2r://panorama/styles/citadel_base_styles.vcss_c" />
		<include src="s2r://panorama/styles/hud_common.vcss_c" />
		<include src="s2r://panorama/styles/citadel_hud_top_bar.vcss_c" />
		<include src="s2r://panorama/styles/showrank_barebones_topbar.vcss_c" />
	</styles>
	<scripts>
		<include src="s2r://panorama/scripts/showrank_barebones.vjs_c" />
	<\/scripts>
	<CitadelHudTopBarPlayer class="ShowRankBarebonesTopbarPlayer" hittest="false">
		<GlobalClassListener classes="gDetailView" />
		<Panel id="PauseIndicator">
			<Panel id="PauseIcon" />
			<Label text="#Citadel_Notification_Paused_Title" />
		</Panel>
		<Panel class="VoiceBar" />
		<Panel id="PlayerDetailsContainer" onmouseover="CitadelTopDownScoreboardPlayerHovered();">
			<Panel id="KillStreakContainer" hittest="false">
				<ParticleScenePanel id="KillStreakParticlePanel" particleonly="false" particleName="particles/ui/ui_topbar_killstreak_stylized.vpcf" fov="33" lookAt="0 0 0" squarePixels="true" renderdeferred="true" deferredalpha="true" />
				<Panel id="KillStreakText">
					<Label class="KillStreakNum" text="#kill_hype_KillStreak_count" />
					<Panel class="KillStreakLabelContainer">
						<Label class="KillStreakLabel SpreeText TopLine" html="true" text="#kill_hype_KillStreak:f" />
						<Label class="KillStreakLabel FirstBlood TopLine" html="true" text="#kill_hype_FirstBlood" />
					</Panel>
				</Panel>
			</Panel>
			<CitadelBinding id="SpectateTeammateKeybind" class="TeammateKeybind" />
			<Image class="SpectatorImage" src="s2r://panorama/images/hud/spec_icon_png.vtex" />
			<Panel id="HeroContents" class="HeroContents">
				<Panel class="SoulsValueContainer">
					<Panel class="SoulsImage" />
					<Label id="SoulsValue" class="SoulsValue" html="true" text="{s:gold}" />
				</Panel>
				<Image id="ShowRankBarebonesTopbarRankImage" visible="false" hittest="false" scaling="stretch-to-fit-preserve-aspect" />
				<Panel id="HeroImageArea">
					<Panel class="HeroContentsCoinBackground" />
					<Panel class="HeroIconContainer">
						<CitadelHeroBadge id="HeroBadge" class="TopBar" />
						<Panel id="FrogImage" />
					</Panel>
					<Panel id="ShowRankBarebonesMissingIndicator" hittest="false">
						<Label text="MISSING" hittest="false" />
					</Panel>
					<Panel class="HeroContentsCoinInnerBorder" />
				</Panel>
				<Panel class="HeroInnerContent">
					<Panel class="HeroLevelBacker">
						<Label class="HeroLevelLabel" text="{i:player_level}" />
					</Panel>
					<Panel id="HealthBar">
						<Panel id="HealthBar_Contents">
							<Panel id="HealthBar_Fill" />
						</Panel>
						<Panel id="HealthBar_Border" />
					</Panel>
					<Panel class="DeathStatus">
						<Label class="DeadLabel" text="{d:hero_level}" />
						<Panel class="RespawnContainer">
							<Panel class="DeathIcon" />
							<Label class="RespawnTimer" text="{d:respawn_time}" />
						</Panel>
					</Panel>
					<Panel class="NetworkStatus">
						<Image class="NetworkIcon" />
					</Panel>
				</Panel>
			</Panel>
			<Panel id="CriticalIndicator">
				<Label text="#Citadel_Hud_Critical" />
			</Panel>
			<Panel id="StatusRow">
				<Panel id="UltimateStatus" class="UltimateStatus">
					<Panel id="UltimateStatusBG" class="UltimateStatusBG" />
					<Panel id="UltimateAbilityIconMini" />
					<Panel class="LockedOverlay">
						<Panel class="LockedIcon" />
					</Panel>
				</Panel>
				<Panel class="Rejuvenator">
					<Panel class="RejuvenatorIcon" />
					<Panel class="RebirthIcon" />
					<Panel class="RebirthAndRejuvenator" />
				</Panel>
			</Panel>
		</Panel>
		<Panel id="PlayerNameNWContainer" onmouseover="CitadelTopDownScoreboardPlayerHovered();">
			<Panel id="BackgroundStrip" />
			<Panel class="PlayerInfoContainer TopBottomFlow">
				<Label class="PlayerName" text="{s:player_name}" />
				<Label class="HeroName" text="{s:hero_name}" />
				<Label class="HeroNameHidden" text="{g:citadel_hero_name:hero_id}" />
				<Panel id="KDAContainer" class="TopBottomFlow">
					<Panel class="KDALabels LeftRightFlow">
						<Label class="StatLabel" text="#Citadel_Scoreboard_KDA_Kills" />
						<Label class="StatLabel" text="#Citadel_Scoreboard_KDA_Deaths" />
						<Label class="StatLabel" text="#Citadel_Scoreboard_KDA_Assists" />
					</Panel>
					<Panel class="KDAStats LeftRightFlow">
						<Label class="PlayerStat kills" text="{i:kills}" />
						<Label class="ForwardSlash" text="/" />
						<Label class="PlayerStat deaths" text="{i:deaths}" />
						<Label class="ForwardSlash" text="/" />
						<Label class="PlayerStat assists" text="{i:assists}" />
					</Panel>
					<Panel class="LeftRightFlow AlignHorizontalCenter objDamageContainer">
						<Label class="objDamageLabel objDamageTitle" text="#Citadel_Scoreboard_Obj_Damage" />
						<Label class="objDamageLabel" text="{i:objective_damage}" />
					</Panel>
				</Panel>
				<CitadelHudItemBarGraph class="TopBarStyle" id="ItemBarGraph" interactive_tooltip="true" tooltip_style="stats_panel" />
				<CitadelTopBarPlayerDetails id="PlayerStatDetails" />
			</Panel>
			<Panel id="PlayerAbilitiesContainer" always-cache-composition-layer="true">
				<CitadelAbilityIcon id="AbilityButton1" class="abilityButton1" read_only="true" ability_slot="1" show_upgrade_pips="true" />
				<CitadelAbilityIcon id="AbilityButton2" class="abilityButton2" read_only="true" ability_slot="2" show_upgrade_pips="true" />
				<CitadelAbilityIcon id="AbilityButton3" class="abilityButton3" read_only="true" ability_slot="3" show_upgrade_pips="true" />
				<CitadelAbilityIcon id="AbilityButton4" class="abilityButton4" read_only="true" ability_slot="4" show_upgrade_pips="true" />
			</Panel>
			<Panel id="PlayerModsContainer" class="TopBottomFlow">
				<CitadelModsPurchasedPanel id="mod_universal" class="mod_universal" mod_category="Universal" read_only="true" is_top_bar="true" />
				<CitadelModsPurchasedPanel id="mod_universal_locked" class="mod_universal_locked" mod_category="Locked Universal" read_only="true" is_top_bar="true" />
			</Panel>
		</Panel>
		<CitadelHudTopBarLaneSwapContainer id="LaneSwapContainer" onmouseout="UIHideTextTooltip()">
			<Panel id="LaneSwapIcon" />
		</CitadelHudTopBarLaneSwapContainer>
		<Panel id="SpectatePlayerButtonPanel" onmouseover="$.GetContextPanel().AddClass(&apos;SpectateHover&apos;)" onmouseout="$.GetContextPanel().RemoveClass(&apos;SpectateHover&apos;)" />
		<Panel class="PlayerHeroReleaseVote">
			<Panel id="BackgroundTexture" />
			<Panel id="BackgroundTexture2" />
			<CitadelHeroImage id="HeroReleaseVoteHeroImage" heroimagestyle="vote_sticker" />
			<Label class="VotedLabel" text="#Citadel_HeroReleaseVote_Voted" />
		</Panel>
	</CitadelHudTopBarPlayer>
</root>
`])))}),no_missing:Object.freeze({"panorama/layout/citadel_hud_top_bar.vxml_c":String.raw(re||(re=B([`<!-- ShowRank Barebones v1.0.0 + Top Bar Plus v5 merged layout. Generated for Show-rank-merger; do not edit by hand. -->
<root>
	<styles>
		<include src="s2r://panorama/styles/citadel_base_styles.vcss_c" />
		<include src="s2r://panorama/styles/hud_common.vcss_c" />
		<include src="s2r://panorama/styles/citadel_hud_top_bar.vcss_c" />
		<include src="s2r://panorama/styles/unit_status_icons.vcss_c" />
		<include src="s2r://panorama/styles/showrank_barebones_topbar.vcss_c" />
	</styles>
	<scripts>
		<include src="s2r://panorama/scripts/topbar_rank_hud.vjs_c" />
	<\/scripts>
	<CitadelHudTopBar hittest="false" onload="if ($.TopbarRankHudRootLoaded) $.TopbarRankHudRootLoaded(&apos;topbar_root_onload&apos;);">
		<GlobalClassListener classes="gDetailView gShopOpen gScoreboardOpen gStreetBrawl gPVE" />
		<Panel id="GradientBacker" />
		<Panel class="GameClock">
			<Label class="GameTime" id="GameTime" text="{s:game_clock}" />
			<Label class="Overtime" text="#Citadel_Overtime" />
		</Panel>
		<Panel class="TeamNetworth">
			<Panel id="TeamScoreFriendly" class="TeamScore">
				<Panel class="ScoreBG" />
				<Panel class="ScoreContainer">
					<Label class="ScoreLabel" html="true" text="{s:team_networth}" />
					<Panel class="TeamIcon" />
				</Panel>
			</Panel>
			<Panel id="TeamScoreEnemy" class="TeamScore Right">
				<Panel class="ScoreBG" />
				<Panel class="ScoreContainer">
					<Panel class="TeamIcon" />
					<Label class="ScoreLabel" html="true" text="{s:team_networth}" />
				</Panel>
			</Panel>
			<Panel id="TopbarRankAdvantage" class="TopbarRankAdvantage TopbarRankAdvantageNeutral" hittest="false">
				<Label id="TopbarRankAdvantageLabel" class="TopbarRankAdvantageLabel" text="--" />
			</Panel>
		</Panel>
		<Panel id="ShowRankBarebonesTeamAverageLayer" class="ShowRankBarebonesTeamAverageLayer" hittest="false">
			<Image id="ShowRankBarebonesAverageFriendlyImage" class="ShowRankBarebonesTeamAverageRankImage ShowRankBarebonesTeamAverageFriendlyImage ShowRankBarebonesTeamAverageRankVisible" scaling="stretch-to-fit-preserve-aspect" hittest="false" />
			<Image id="ShowRankBarebonesAverageEnemyImage" class="ShowRankBarebonesTeamAverageRankImage ShowRankBarebonesTeamAverageEnemyImage ShowRankBarebonesTeamAverageRankVisible" scaling="stretch-to-fit-preserve-aspect" hittest="false" />
		</Panel>
		<Panel id="StretBrawlContainer">
			<Label class="roundTitle" text="#Citadel_StreetBrawl_RoundTitle" />
			<Panel id="ScoreCounter">
				<Panel class="point pt1" />
				<Panel class="point pt2" />
				<Panel class="point pt3 matchpoint" />
				<Panel class="point pt4" />
				<Panel class="point pt5" />
			</Panel>
			<Label class="subTitle" text="#Citadel_StreetBrawl_RoundSubtitle" />
		</Panel>
		<Panel class="ChatContainer" hittest="false">
			<CitadelHudTopBarChat id="Team1Chat" team="TEAM_AMBER" />
			<CitadelHudTopBarChat id="Team2Chat" team="TEAM_SAPPHIRE" />
		</Panel>
		<Panel id="TeamsContainer" hittest="false">
			<CitadelHudTopBarTeam id="TeamFriendly" team="2" />
			<CitadelHudTopBarTeam id="TeamEnemy" team="3" />
		</Panel>
		<CitadelObjectivesMap id="ObjectivesMap" liveGame="true" />
		<Panel id="RejuvenatorCharges">
			<Panel id="RejuvenatorFriendly">
				<Panel class="rejuvIcon" />
			</Panel>
			<Panel id="RejuvenatorTimer">
				<Panel class="rejuvTimer">
					<Panel id="StatusEffectsBorder" />
					<Panel id="StatusEffectCooldownOverlay" />
					<Panel id="StatusEffectInner" />
					<Image id="StatusEffectImage" />
					<Panel class="statusEffectImage" />
				</Panel>
				<Label id="MidbossTimerLabel" class="midbossTimerLabel" text="{s:midboss_timer}" />
				<Label id="RejuvenationTimer" class="RejuvenationTimer" text="-:--" />
			</Panel>
			<Panel id="BridgeTimer">
				<Panel class="bridgTimer">
					<Panel id="StatusEffectsBorder" />
					<Panel id="StatusEffectCooldownOverlay" />
					<Panel id="BridgeBackground" />
					<Image id="StatusEffectImage" />
					<Panel class="statusEffectImage" />
				</Panel>
				<Label id="BridgeTimerLabel" class="bridgeTimerLabel" text="..." />
			</Panel>
			<Panel id="RejuvenatorEnemy">
				<Panel class="rejuvIcon" />
			</Panel>
		</Panel>
		<Panel class="KillsAndAbilityPointsContainer">
			<Panel class="ScoreRow TeamKills LeftRightFlow">
				<Panel class="ScoreTypeIcon" />
				<Panel class="ScoreNumbers">
					<Panel class="ScoreNumber">
						<Label class="FriendlyKills KillsLabel" text="{i:friendly_kills}" />
					</Panel>
					<Label class="ScoreTypeLabel" text="#Citadel_Scoreboard_TeamKills" />
					<Panel class="ScoreNumber">
						<Label class="EnemyKills KillsLabel" text="{i:enemy_kills}" />
					</Panel>
				</Panel>
			</Panel>
			<Panel class="ScoreRow TeamAbilityPoints LeftRightFlow">
				<Panel class="ScoreTypeIcon" />
				<Panel class="ScoreNumbers">
					<Panel class="ScoreNumber">
						<Label class="FriendlyAP APLabel" text="{i:friendly_ap}" />
					</Panel>
					<Label class="ScoreTypeLabel" text="#Citadel_Scoreboard_TeamAP" />
					<Panel class="ScoreNumber">
						<Label class="EnemyAP APLabel" text="{i:enemy_ap}" />
					</Panel>
				</Panel>
			</Panel>
		</Panel>
		<Citadel_Hud_Koth id="KothCashInMeter" />
	</CitadelHudTopBar>
</root>
`]))),"panorama/layout/citadel_hud_top_bar_player.vxml_c":String.raw(ne||(ne=B([`<!-- ShowRank Barebones v1.0.0 + Top Bar Plus v5 merged layout. Generated for Show-rank-merger; do not edit by hand. -->
<root>
	<styles>
		<include src="s2r://panorama/styles/citadel_base_styles.vcss_c" />
		<include src="s2r://panorama/styles/hud_common.vcss_c" />
		<include src="s2r://panorama/styles/citadel_hud_top_bar.vcss_c" />
		<include src="s2r://panorama/styles/showrank_barebones_topbar.vcss_c" />
	</styles>
	<scripts>
		<include src="s2r://panorama/scripts/showrank_barebones.vjs_c" />
	<\/scripts>
	<CitadelHudTopBarPlayer class="ShowRankBarebonesTopbarPlayer" hittest="false">
		<GlobalClassListener classes="gDetailView" />
		<Panel id="PauseIndicator">
			<Panel id="PauseIcon" />
			<Label text="#Citadel_Notification_Paused_Title" />
		</Panel>
		<Panel class="VoiceBar" />
		<Panel id="PlayerDetailsContainer" onmouseover="CitadelTopDownScoreboardPlayerHovered();">
			<Panel id="KillStreakContainer" hittest="false">
				<ParticleScenePanel id="KillStreakParticlePanel" particleonly="false" particleName="particles/ui/ui_topbar_killstreak_stylized.vpcf" fov="33" lookAt="0 0 0" squarePixels="true" renderdeferred="true" deferredalpha="true" />
				<Panel id="KillStreakText">
					<Label class="KillStreakNum" text="#kill_hype_KillStreak_count" />
					<Panel class="KillStreakLabelContainer">
						<Label class="KillStreakLabel SpreeText TopLine" html="true" text="#kill_hype_KillStreak:f" />
						<Label class="KillStreakLabel FirstBlood TopLine" html="true" text="#kill_hype_FirstBlood" />
					</Panel>
				</Panel>
			</Panel>
			<CitadelBinding id="SpectateTeammateKeybind" class="TeammateKeybind" />
			<Image class="SpectatorImage" src="s2r://panorama/images/hud/spec_icon_png.vtex" />
			<Panel id="HeroContents" class="HeroContents">
				<Panel class="SoulsValueContainer">
					<Panel class="SoulsImage" />
					<Label id="SoulsValue" class="SoulsValue" html="true" text="{s:gold}" />
				</Panel>
				<Image id="ShowRankBarebonesTopbarRankImage" visible="false" hittest="false" scaling="stretch-to-fit-preserve-aspect" />
				<Panel id="HeroImageArea">
					<Panel class="HeroContentsCoinBackground" />
					<Panel class="HeroIconContainer">
						<CitadelHeroBadge id="HeroBadge" class="TopBar" />
						<Panel id="FrogImage" />
					</Panel>
					<Panel class="HeroContentsCoinInnerBorder" />
				</Panel>
				<Panel class="HeroInnerContent">
					<Panel class="HeroLevelBacker">
						<Label class="HeroLevelLabel" text="{i:player_level}" />
					</Panel>
					<Panel id="HealthBar">
						<Panel id="HealthBar_Contents">
							<Panel id="HealthBar_Fill" />
						</Panel>
						<Panel id="HealthBar_Border" />
					</Panel>
					<Panel class="DeathStatus">
						<Label class="DeadLabel" text="{d:hero_level}" />
						<Panel class="RespawnContainer">
							<Panel class="DeathIcon" />
							<Label class="RespawnTimer" text="{d:respawn_time}" />
						</Panel>
					</Panel>
					<Panel class="NetworkStatus">
						<Image class="NetworkIcon" />
					</Panel>
				</Panel>
			</Panel>
			<Panel id="CriticalIndicator">
				<Label text="#Citadel_Hud_Critical" />
			</Panel>
			<Panel id="StatusRow">
				<Panel id="UltimateStatus" class="UltimateStatus">
					<Panel id="UltimateStatusBG" class="UltimateStatusBG" />
					<Panel id="UltimateAbilityIconMini" />
					<Panel class="LockedOverlay">
						<Panel class="LockedIcon" />
					</Panel>
				</Panel>
				<Panel class="Rejuvenator">
					<Panel class="RejuvenatorIcon" />
					<Panel class="RebirthIcon" />
					<Panel class="RebirthAndRejuvenator" />
				</Panel>
			</Panel>
		</Panel>
		<Panel id="PlayerNameNWContainer" onmouseover="CitadelTopDownScoreboardPlayerHovered();">
			<Panel id="BackgroundStrip" />
			<Panel class="PlayerInfoContainer TopBottomFlow">
				<Label class="PlayerName" text="{s:player_name}" />
				<Label class="HeroName" text="{s:hero_name}" />
				<Label class="HeroNameHidden" text="{g:citadel_hero_name:hero_id}" />
				<Panel id="KDAContainer" class="TopBottomFlow">
					<Panel class="KDALabels LeftRightFlow">
						<Label class="StatLabel" text="#Citadel_Scoreboard_KDA_Kills" />
						<Label class="StatLabel" text="#Citadel_Scoreboard_KDA_Deaths" />
						<Label class="StatLabel" text="#Citadel_Scoreboard_KDA_Assists" />
					</Panel>
					<Panel class="KDAStats LeftRightFlow">
						<Label class="PlayerStat kills" text="{i:kills}" />
						<Label class="ForwardSlash" text="/" />
						<Label class="PlayerStat deaths" text="{i:deaths}" />
						<Label class="ForwardSlash" text="/" />
						<Label class="PlayerStat assists" text="{i:assists}" />
					</Panel>
					<Panel class="LeftRightFlow AlignHorizontalCenter objDamageContainer">
						<Label class="objDamageLabel objDamageTitle" text="#Citadel_Scoreboard_Obj_Damage" />
						<Label class="objDamageLabel" text="{i:objective_damage}" />
					</Panel>
				</Panel>
				<CitadelHudItemBarGraph class="TopBarStyle" id="ItemBarGraph" interactive_tooltip="true" tooltip_style="stats_panel" />
				<CitadelTopBarPlayerDetails id="PlayerStatDetails" />
			</Panel>
			<Panel id="PlayerAbilitiesContainer" always-cache-composition-layer="true">
				<CitadelAbilityIcon id="AbilityButton1" class="abilityButton1" read_only="true" ability_slot="1" show_upgrade_pips="true" />
				<CitadelAbilityIcon id="AbilityButton2" class="abilityButton2" read_only="true" ability_slot="2" show_upgrade_pips="true" />
				<CitadelAbilityIcon id="AbilityButton3" class="abilityButton3" read_only="true" ability_slot="3" show_upgrade_pips="true" />
				<CitadelAbilityIcon id="AbilityButton4" class="abilityButton4" read_only="true" ability_slot="4" show_upgrade_pips="true" />
			</Panel>
			<Panel id="PlayerModsContainer" class="TopBottomFlow">
				<CitadelModsPurchasedPanel id="mod_universal" class="mod_universal" mod_category="Universal" read_only="true" is_top_bar="true" />
				<CitadelModsPurchasedPanel id="mod_universal_locked" class="mod_universal_locked" mod_category="Locked Universal" read_only="true" is_top_bar="true" />
			</Panel>
		</Panel>
		<CitadelHudTopBarLaneSwapContainer id="LaneSwapContainer" onmouseout="UIHideTextTooltip()">
			<Panel id="LaneSwapIcon" />
		</CitadelHudTopBarLaneSwapContainer>
		<Panel id="SpectatePlayerButtonPanel" onmouseover="$.GetContextPanel().AddClass(&apos;SpectateHover&apos;)" onmouseout="$.GetContextPanel().RemoveClass(&apos;SpectateHover&apos;)" />
		<Panel class="PlayerHeroReleaseVote">
			<Panel id="BackgroundTexture" />
			<Panel id="BackgroundTexture2" />
			<CitadelHeroImage id="HeroReleaseVoteHeroImage" heroimagestyle="vote_sticker" />
			<Label class="VotedLabel" text="#Citadel_HeroReleaseVote_Voted" />
		</Panel>
	</CitadelHudTopBarPlayer>
</root>
`])))})}),M=new Uint32Array(256);for(let e=0;e<M.length;e+=1){let a=e;for(let t=0;t<8;t+=1)a=a&1?3988292384^a>>>1:a>>>1;M[e]=a>>>0}function le(e){let a=4294967295;for(let t=0;t<e.length;t+=1)a=M[(a^e[t])&255]^a>>>8;return(a^4294967295)>>>0}const ye=16,ge=12,Se=16;function we(e,a){return Math.ceil(e/a)*a}function ve(e,a,t){for(let n=0;n<4;n+=1)e[a+n]=t.charCodeAt(n)}function xe(e,a){const t=a+e,n=new Uint8Array(t),r=new DataView(n.buffer);return r.setUint32(0,t,!0),r.setUint16(4,12,!0),r.setUint16(6,0,!0),r.setUint32(8,8,!0),r.setUint32(12,1,!0),ve(n,16,"DATA"),r.setUint32(20,a-20,!0),r.setUint32(24,e,!0),{bytes:n,view:r}}function ke(e){const a=new TextEncoder().encode(String(e??"")),t=6+a.byteLength,n=we(ye+ge,Se),{bytes:r,view:l}=xe(t,n);return l.setUint32(n,le(a),!0),l.setUint16(n+4,0,!0),r.set(a,n+6),r}function R(e){return String(e||"").trim().replaceAll("\\","/").replace(/^\/+/,"").replace(/\/+/g,"/").toLowerCase()}function q(e,a){const t=new Map;for(const n of e||[]){const r=R(n.path);if(r){if(t.has(r))throw new Error(`${a} has a duplicate path: ${r}`);t.set(r,new Uint8Array(n.bytes))}}return t}function Te({topbarFiles:e,showrankFiles:a,layouts:t}){const n=q(e,"Top Bar Plus"),r=q(a,"ShowRank"),l=Object.keys(t).map(R),o=[...r.keys()].filter(c=>n.has(c)),i=o.filter(c=>!l.includes(c));if(i.length>0)throw new Error(`Both mods replace ${i.join(", ")}; this pair is not supported.`);const d=l.filter(c=>!o.includes(c));if(d.length>0)throw new Error(`Expected both mods to replace ${d.join(", ")}.`);const h=[];for(const[c,m]of n)l.includes(c)||h.push({path:c,bytes:m});for(const[c,m]of r)l.includes(c)||h.push({path:c,bytes:m});for(const[c,m]of Object.entries(t))h.push({path:R(c),bytes:ke(m)});return{files:h,replacedPaths:l}}const Le=(function(){const a=typeof document<"u"&&document.createElement("link").relList;return a&&a.supports&&a.supports("modulepreload")?"modulepreload":"preload"})(),Be=function(e){return"/Show-rank-merger/"+e},Z={},Ce=function(a,t,n){let r=Promise.resolve();if(t&&t.length>0){let d=function(h){return Promise.all(h.map(c=>Promise.resolve(c).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),i=o?.nonce||o?.getAttribute("nonce");r=d(t.map(h=>{if(h=Be(h),h in Z)return;Z[h]=!0;const c=h.endsWith(".css"),m=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${h}"]${m}`))return;const b=document.createElement("link");if(b.rel=c?"stylesheet":Le,c||(b.as="script"),b.crossOrigin="",b.href=h,i&&b.setAttribute("nonce",i),document.head.appendChild(b),c)return new Promise((p,P)=>{b.addEventListener("load",p),b.addEventListener("error",()=>P(new Error(`Unable to preload CSS for ${h}`)))})}))}function l(o){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=o,window.dispatchEvent(i),!i.defaultPrevented)throw o}return r.then(o=>{for(const i of o||[])i.status==="rejected"&&l(i.reason);return a().catch(l)})};function V(e,a="Input"){if(e instanceof Uint8Array)return e;if(e instanceof ArrayBuffer)return new Uint8Array(e);if(ArrayBuffer.isView(e))return new Uint8Array(e.buffer,e.byteOffset,e.byteLength);throw new Error(`${a} must be an ArrayBuffer or Uint8Array`)}function Re(e){const a=String(e||"archive.7z").replace(/[\\/:*?"<>|]+/g,"_");return a.toLowerCase().endsWith(".zip")||a.toLowerCase().endsWith(".7z")?a:`${a}.7z`}function je(){const e={print(){},printErr(){}};if(typeof window>"u")return e;const a="/Show-rank-merger/";return{...e,locateFile(t){return t.endsWith(".wasm")?`${a.replace(/\/?$/,"/")}7zz.wasm`:t}}}async function Ae(e,a,t){const{default:n}=await Ce(async()=>{const{default:i}=await import("./7zz.es6.B9ogagE5.js");return{default:i}},[]),r=await n(je()),l=Re(a);r.FS.writeFile(l,V(e,"Archive input"));const o=r.callMain(["x","-y",l,t]);if(typeof o=="number"&&o!==0)throw new Error(`Could not extract ${t}`);try{return r.FS.readFile(t)}catch{throw new Error(`Archive member not found: ${t}`)}}function Ie(e){if(e instanceof Uint8Array)return e;if(e instanceof ArrayBuffer)return new Uint8Array(e);if(ArrayBuffer.isView(e))return new Uint8Array(e.buffer,e.byteOffset,e.byteLength);if(typeof e=="string")return new TextEncoder().encode(e);throw new Error("SHA-256 input must be an ArrayBuffer or Uint8Array")}function Ee(e){return[...e].map(a=>a.toString(16).padStart(2,"0")).join("")}async function O(e){const a=Ie(e);if(globalThis.crypto?.subtle)return Ee(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256",a)));if(typeof process<"u"){const{createHash:t}=await Function("return import('node:crypto')")();return t("sha256").update(a).digest("hex")}throw new Error("Web Crypto SHA-256 is unavailable")}const Ne=1437209140,He=2,J=28,Ue=32767,X=18,De=65535;function Ke(e){if(e instanceof Uint8Array)return e;if(e instanceof ArrayBuffer)return new Uint8Array(e);if(ArrayBuffer.isView(e))return new Uint8Array(e.buffer,e.byteOffset,e.byteLength);throw new Error("VPK input must be a Uint8Array or ArrayBuffer")}function $e(e){return String(e||"").trim().replaceAll("\\","/").replace(/^\/+/,"").replace(/\/+/g,"/").toLowerCase()}function U(e,a,t){let n=a;for(;n<t&&e[n]!==0;)n+=1;if(n>=t)throw new Error("Malformed VPK tree: unterminated string");return{value:new TextDecoder().decode(e.slice(a,n)),next:n+1}}function I(e,a,t){const n=`${a}.${t}`;return e===" "||e===""?n:`${e}/${n}`}function Fe(e,a,t,n,r,l,o,i,d){if(t+X>n)throw new Error("Malformed VPK tree: truncated entry");const h=a.getUint32(t,!0),c=a.getUint16(t+4,!0),m=a.getUint16(t+6,!0),b=a.getUint32(t+8,!0),p=a.getUint32(t+12,!0),P=a.getUint16(t+16,!0);if(t+=X,P!==De)throw new Error("Malformed VPK tree: invalid entry terminator");if(t+c>n)throw new Error("Malformed VPK tree: preload data exceeds tree size");if(m!==Ue)throw new Error(`VPK entry uses external archive ${m}: ${I(i,d,o)}`);if(b+p>l)throw new Error(`VPK entry file data is out of bounds: ${I(i,d,o)}`);const S=e.slice(t,t+c);t+=c;const g=r+b,T=e.slice(g,g+p),w=new Uint8Array(S.byteLength+T.byteLength);return w.set(S,0),w.set(T,S.byteLength),{cursor:t,entry:{path:I(i,d,o),crc:h,preloadBytes:c,archiveIndex:m,entryOffset:b,entryLength:p},file:{path:I(i,d,o),bytes:w}}}function Me(e){const a=Ke(e);if(a.byteLength<J)throw new Error("VPK file is too small");const t=new DataView(a.buffer,a.byteOffset,a.byteLength);if(t.getUint32(0,!0)!==Ne)throw new Error("Invalid VPK magic");const r=t.getUint32(4,!0);if(r!==He)throw new Error(`Unsupported VPK version: ${r}`);const l=t.getUint32(8,!0),o=t.getUint32(12,!0),i=J,d=i+l,h=d,c=h+o;if(d>a.byteLength||c>a.byteLength)throw new Error("Malformed VPK tree size or file data size");const m=[],b=[],p=new Map;let P=i;for(;P<d;){const S=U(a,P,d);P=S.next;const g=S.value;if(g==="")break;for(;P<d;){const T=U(a,P,d);P=T.next;const w=T.value;if(w==="")break;for(;P<d;){const v=U(a,P,d);P=v.next;const f=v.value;if(f==="")break;const u=Fe(a,t,P,d,h,o,g,w,f);P=u.cursor;const y=u.file.path,j=$e(y);if(p.has(j))throw new Error(`Duplicate VPK path: ${y}`);p.set(j,y),m.push(u.entry),b.push(u.file)}}}return{entries:m,files:b,treeSize:l,fileDataSize:o}}const Ve=Object.values(_).map(e=>e.fileName).join(" or ");function Oe(e,a){const t=new Set((e||[]).map(r=>R(r.path))),n=new Set(a.map(R));return{missing:[...n].filter(r=>!t.has(r)),unexpected:[...t].filter(r=>!n.has(r))}}async function oe(e,a,t,n){const r=await Ae(e,a,t.archiveMember),l=await O(r);if(l!==t.vpkSha256)throw new Error(`${n} contains a changed ${t.archiveMember}.`);return{parsed:Me(r),vpkSha256:l}}function ie(e,a,t){const{missing:n,unexpected:r}=Oe(e,a);if(n.length>0||r.length>0)throw new Error(`${t} VPK files differ (missing: ${n.join(", ")||"none"}; unexpected: ${r.join(", ")||"none"}).`)}async function ce(e,a){const t=V(a,"Archive input"),n=await O(t);if(t.byteLength!==k.size||n!==k.sha256)throw new Error(`This is not Top Bar Plus v5. Upload ${k.fileName} from GameBanana.`);const{parsed:r,vpkSha256:l}=await oe(t,String(e?.name||k.fileName),k,"Top Bar Plus");return ie(r.files,fe,"Top Bar Plus"),{sha256:n,vpkSha256:l,parsed:r}}function Ge(e){for(const[a,t]of Object.entries(_))if(t.sha256===e)return a;return""}async function de(e,a){const t=V(a,"Archive input"),n=await O(t),r=Ge(n);if(!r||t.byteLength!==_[r].size)throw new Error(`This is not ShowRank v1.0.0. Upload ${Ve} from GameBanana.`);const l=_[r],{parsed:o,vpkSha256:i}=await oe(t,String(e?.name||l.fileName),l,"ShowRank");return ie(o.files,Pe,"ShowRank"),{editionId:r,sha256:n,vpkSha256:i,parsed:o}}const ze=1437209140,We=2,Q=28,Ye=32767,qe=65535;function Ze(e){return new TextEncoder().encode(e)}function Je(e,a){for(let t=0;t<a.length;t+=1)e.push(a[t])}function D(e,a){Je(e,Ze(a)),e.push(0)}function K(e,a){e.push(a&255,a>>>8&255)}function $(e,a){e.push(a&255,a>>>8&255,a>>>16&255,a>>>24&255)}function Xe(e){const a=String(e).replaceAll("\\","/").replace(/^\/+/,""),t=a.lastIndexOf("/"),n=t>=0?a.slice(0,t):" ",r=t>=0?a.slice(t+1):a,l=r.lastIndexOf(".");if(l<=0||l===r.length-1)throw new Error(`VPK path needs extension: ${e}`);return{ext:r.slice(l+1),dir:n,name:r.slice(0,l)}}function Qe(e,a){const t=new Map;e.forEach((r,l)=>{const o=Xe(r.path);t.has(o.ext)||t.set(o.ext,new Map);const i=t.get(o.ext);i.has(o.dir)||i.set(o.dir,[]),i.get(o.dir).push({...o,index:l,bytes:r.bytes})});const n=[];return Array.from(t.keys()).toSorted().forEach(r=>{D(n,r);const l=t.get(r);Array.from(l.keys()).toSorted().forEach(o=>{D(n,o),l.get(o).sort((i,d)=>i.name.localeCompare(d.name)).forEach(i=>{D(n,i.name),$(n,le(i.bytes)),K(n,0),K(n,Ye),$(n,a[i.index]),$(n,i.bytes.byteLength),K(n,qe)}),n.push(0)}),n.push(0)}),n.push(0),new Uint8Array(n)}function ea(e){const a=e.map(c=>({path:c.path,bytes:c.bytes instanceof Uint8Array?c.bytes:new Uint8Array(c.bytes)}));let t=0;const n=a.map(c=>{const m=t;return t+=c.bytes.byteLength,m}),r=Qe(a,n),l=t,o=Q+r.byteLength+l,i=new Uint8Array(o),d=new DataView(i.buffer);d.setUint32(0,ze,!0),d.setUint32(4,We,!0),d.setUint32(8,r.byteLength,!0),d.setUint32(12,l,!0),d.setUint32(16,0,!0),d.setUint32(20,0,!0),d.setUint32(24,0,!0);let h=Q;return i.set(r,h),h+=r.byteLength,a.forEach(c=>{i.set(c.bytes,h),h+=c.bytes.byteLength}),i}async function aa({topbarFile:e,topbarBytes:a,showrankFile:t,showrankBytes:n}){const r=await ce(e,a),l=await de(t,n),{files:o,replacedPaths:i}=Te({topbarFiles:r.parsed.files,showrankFiles:l.parsed.files,layouts:_e[l.editionId]});return{bytes:ea(o),filename:_[l.editionId].outputFileName,editionId:l.editionId,files:o,replacedPaths:i,topbar:{sha256:r.sha256,vpkSha256:r.vpkSha256},showrank:{sha256:l.sha256,vpkSha256:l.vpkSha256}}}function ee(e,a,t="application/octet-stream"){const n=new Blob([a],{type:t}),r=URL.createObjectURL(n),l=document.createElement("a");l.href=r,l.download=e,document.body.appendChild(l),l.click(),l.remove(),URL.revokeObjectURL(r)}function ta(e="/",a=Date.now()){return`${String(e||"/").endsWith("/")?String(e||"/"):`${e}/`}commit-info.json?v=${encodeURIComponent(String(a))}`}function sa(e){return!!(e&&typeof e=="object"&&!Array.isArray(e)&&typeof e.url=="string"&&e.url&&typeof e.shortHash=="string"&&e.shortHash)}const ra={alert:"Normal edition, with MISSING tags and the ENEMY MISSING alert",no_missing:"No Missing edition, without MISSING tags or the alert"},E={file:null,bytes:null,state:"empty",message:"",editionId:"",sha256:"",vpkSha256:""},F={bytes:null,filename:"",fileCount:0,error:""};function na(e){return e<1024*1024?`${Math.round(e/1024)} KB`:`${(e/1024/1024).toFixed(1)} MB`}const N=e=>`${"/Show-rank-merger/".replace(/\/?$/,"/")}${e}`;function ue(){return s.jsx("svg",{className:"icon",viewBox:"0 0 16 16","aria-hidden":"true",children:s.jsx("path",{d:"M3.5 8.5l3 3 6-7",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"})})}function ae({number:e,tone:a,title:t,inputId:n,accept:r,slot:l,disabled:o,onFile:i,children:d}){const[h,c]=x.useState(!1),m=`${n}-status`,b=p=>{p?.[0]&&!o&&i(p[0])};return s.jsxs("li",{className:`step tone-${a}${h?" is-dragging":""}`,"data-state":l.state,onDragOver:p=>p.preventDefault(),onDragEnter:p=>{p.preventDefault(),c(!0)},onDragLeave:p=>{p.currentTarget.contains(p.relatedTarget)||c(!1)},onDrop:p=>{p.preventDefault(),p.stopPropagation(),c(!1),b(p.dataTransfer.files)},children:[s.jsxs("div",{className:"step-head",children:[s.jsx("span",{className:"step-number","aria-hidden":"true",children:`0${e}`}),s.jsx("h3",{id:`${n}-title`,children:t})]}),s.jsxs("div",{className:"step-body",children:[s.jsx("div",{className:"step-help",children:d}),s.jsxs("div",{className:"file-row",children:[s.jsx("label",{id:`${n}-label`,className:`file-button${o?" is-disabled":""}`,htmlFor:n,children:l.file?"Replace file":"Choose file"}),s.jsx("input",{id:n,className:"visually-hidden",type:"file",accept:r,disabled:o,"aria-labelledby":`${n}-label ${n}-title`,"aria-describedby":m,"aria-invalid":l.state==="error"?"true":void 0,onChange:p=>{b(p.currentTarget.files),p.currentTarget.value=""}}),s.jsx("span",{className:"file-name",children:l.file?l.file.name:"or drop it here"})]}),s.jsxs("p",{id:m,className:`status status-${l.state}`,role:"status","aria-live":l.state==="error"?"assertive":"polite",children:[l.state==="ok"?s.jsx(ue,{}):null,l.message]})]})]})}function ia({gitCommitInfo:e=null}){const a=x.useRef({topbar:0,showrank:0,build:0}),[t,n]=x.useState(E),[r,l]=x.useState(E),[o,i]=x.useState(F),[d,h]=x.useState(!1),[c,m]=x.useState(e);x.useEffect(()=>{let f=!1;return fetch(ta("/Show-rank-merger/"),{cache:"no-store"}).then(u=>u.ok?u.json():null).then(u=>{!f&&sa(u)&&m(u)}).catch(()=>{}),()=>{f=!0}},[]);async function b(f,u,y,j,he){const G=++a.current[f];a.current.build+=1,i(F),y({...E,file:u,state:"checking",message:"Checking…"});try{const L=new Uint8Array(await u.arrayBuffer()),A=await j(u,L);if(G!==a.current[f])return;y({file:u,bytes:L,state:"ok",message:he(A),editionId:A.editionId||"",sha256:A.sha256,vpkSha256:A.vpkSha256})}catch(L){if(G!==a.current[f])return;y({...E,file:u,state:"error",message:L?.message||String(L)})}}const p=f=>b("topbar",f,n,ce,()=>`${k.label}, verified`),P=f=>b("showrank",f,l,de,u=>`${ra[u.editionId]}, verified`);function S(f){if(f.preventDefault(),!d)for(const u of f.dataTransfer.files){const y=u.name.toLowerCase();y.endsWith(".zip")?p(u):y.endsWith(".7z")&&P(u)}}const g=t.state==="ok"&&r.state==="ok",T=_[r.editionId]?.outputFileName||_.alert.outputFileName;async function w(){if(!g||d)return;if(o.bytes){ee(o.filename,o.bytes);return}const f=++a.current.build;h(!0);try{const u=await aa({topbarFile:t.file,topbarBytes:t.bytes,showrankFile:r.file,showrankBytes:r.bytes});if(f!==a.current.build)return;ee(u.filename,u.bytes),i({bytes:u.bytes,filename:u.filename,fileCount:u.files.length,error:""})}catch(u){f===a.current.build&&i({...F,error:u?.message||String(u)})}finally{h(!1)}}let v="Add both files to build.";return d?v="Building…":o.error?v=o.error:o.bytes?v=`Downloaded ${o.filename} (${na(o.bytes.byteLength)}).`:g&&(v=`Ready. You'll get ${T}.`),s.jsxs("div",{className:"page",onDragOver:f=>f.preventDefault(),onDrop:S,children:[s.jsx("div",{className:"backdrop","aria-hidden":"true",style:{backgroundImage:`url(${N("img/backdrop.webp")})`}}),s.jsxs("header",{className:"hero",children:[s.jsxs("div",{className:"hero-copy",children:[s.jsxs("div",{className:"brand",children:[s.jsx("img",{className:"brand-badge",src:N("img/badge.webp"),alt:"",width:"72",height:"68"}),s.jsx("p",{className:"eyebrow",children:"Deadlock mod merger"})]}),s.jsxs("h1",{children:[s.jsxs("span",{className:"h1-showrank",children:["Show",s.jsx("em",{children:"Rank"})]}),s.jsxs("span",{className:"h1-plus",children:[s.jsx("span",{"aria-hidden":"true",children:"+"}),s.jsx("span",{className:"visually-hidden",children:" and "})]}),s.jsx("span",{className:"h1-topbar",children:"Top Bar Plus"})]}),s.jsx("p",{className:"lede",children:"Both mods replace the same two top bar layouts, so with both installed one of them loses its top bar. Merge ShowRank v1.0.0 and Top Bar Plus v5 into one VPK that keeps both. Your files stay in your browser."}),s.jsxs("ul",{className:"chips","aria-label":"What you keep",children:[s.jsx("li",{className:"chip chip-showrank",children:"Top bar ranks"}),s.jsx("li",{className:"chip chip-showrank",children:"Escape menu"}),s.jsx("li",{className:"chip chip-showrank",children:"Profiles"}),s.jsx("li",{className:"chip chip-showrank",children:"Rank history"}),s.jsx("li",{className:"chip chip-topbar",children:"Rejuv timer"}),s.jsx("li",{className:"chip chip-topbar",children:"Bridge timer"}),s.jsx("li",{className:"chip chip-topbar",children:"Recent purchases"})]})]}),s.jsxs("figure",{className:"hero-shot",children:[s.jsx("span",{className:"shot-label",children:"Escape menu"}),s.jsx("img",{src:N("img/escape.webp"),width:"390",height:"795",alt:"ShowRank's Escape menu Players tab: each player's rank badge and party stacks."})]})]}),s.jsxs("figure",{className:"strip",children:[s.jsx("span",{className:"shot-label",children:"Top bar"}),s.jsx("img",{src:N("img/topbar.webp"),width:"1265",height:"150",alt:"ShowRank rank badges on every hero portrait in the top bar."})]}),s.jsxs("section",{className:"merge","aria-labelledby":"merge-title",children:[s.jsx("h2",{id:"merge-title",className:"section-title",children:"Merge in three steps"}),s.jsxs("ol",{className:"steps",children:[s.jsx(ae,{number:"1",tone:"topbar",title:"Top Bar Plus v5",inputId:"topbar-file",accept:".zip,application/zip",slot:t,disabled:d,onFile:p,children:s.jsxs("p",{children:["Download ",s.jsx("a",{href:k.modUrl,target:"_blank",rel:"noreferrer",children:s.jsx("code",{children:k.fileName})})," from GameBanana and add it unchanged."]})}),s.jsxs(ae,{number:"2",tone:"showrank",title:"ShowRank v1.0.0",inputId:"showrank-file",accept:".7z,application/x-7z-compressed",slot:r,disabled:d,onFile:P,children:[s.jsx("p",{children:"Add one of the two downloads. Your result matches it."}),s.jsxs("ul",{className:"choices",children:[s.jsxs("li",{children:[s.jsx("a",{href:_.alert.modUrl,target:"_blank",rel:"noreferrer",children:s.jsx("code",{children:_.alert.fileName})}),s.jsx("span",{children:"Normal, with MISSING tags and the ENEMY MISSING alert."})]}),s.jsxs("li",{children:[s.jsx("a",{href:_.no_missing.modUrl,target:"_blank",rel:"noreferrer",children:s.jsx("code",{children:_.no_missing.fileName})}),s.jsx("span",{children:"No Missing, without those alerts."})]})]})]}),s.jsxs("li",{className:"step tone-build","data-state":o.bytes?"ok":o.error?"error":"empty",children:[s.jsxs("div",{className:"step-head",children:[s.jsx("span",{className:"step-number","aria-hidden":"true",children:"03"}),s.jsx("h3",{children:"Build and install"})]}),s.jsxs("div",{className:"step-body",children:[s.jsx("div",{className:"file-row",children:s.jsx("button",{className:"primary",type:"button",disabled:!g||d,"aria-describedby":"build-status",onClick:w,children:d?"Building…":o.bytes?"Download again":"Build VPK"})}),s.jsxs("p",{id:"build-status",className:`status ${o.error?"status-error":o.bytes?"status-ok":""}`,role:"status","aria-live":"polite",children:[o.bytes?s.jsx(ue,{}):null,v]}),s.jsxs("p",{className:"step-help",children:["Remove the separate ShowRank and Top Bar Plus VPKs from ",s.jsx("code",{children:"Deadlock\\game\\citadel\\addons"}),", then put the new file there with a free pak name, for example ",s.jsx("code",{children:"pak89_dir.vpk"}),"."]})]})]})]})]}),s.jsxs("details",{className:"details",children:[s.jsx("summary",{children:"File details"}),s.jsxs("dl",{children:[s.jsx("dt",{children:"Top Bar Plus archive"}),s.jsx("dd",{children:s.jsx("code",{children:t.sha256||"not added"})}),s.jsx("dt",{children:"Top Bar Plus VPK"}),s.jsx("dd",{children:s.jsx("code",{children:t.vpkSha256||"not added"})}),s.jsx("dt",{children:"ShowRank archive"}),s.jsx("dd",{children:s.jsx("code",{children:r.sha256||"not added"})}),s.jsx("dt",{children:"ShowRank VPK"}),s.jsx("dd",{children:s.jsx("code",{children:r.vpkSha256||"not added"})}),s.jsx("dt",{children:"Output"}),s.jsx("dd",{children:s.jsx("code",{children:o.bytes?`${o.filename}, ${o.fileCount} files`:"not built"})})]}),s.jsxs("p",{children:["Every file from both mods is copied unchanged, except ",s.jsx("code",{children:"citadel_hud_top_bar"})," and"," ",s.jsx("code",{children:"citadel_hud_top_bar_player"}),", which both mods replace. Those two come from a merged layout with both mods' additions."]})]}),s.jsxs("footer",{className:"footer",children:[s.jsxs("p",{children:["Top Bar Plus by ",s.jsx("a",{href:"https://gamebanana.com/members/2408486",target:"_blank",rel:"noreferrer",children:"bonclide"}),"."," ","ShowRank and this page by ",s.jsx("a",{href:"https://github.com/Hantu-Raya",target:"_blank",rel:"noreferrer",children:"Hantu-Raya"}),"."," ","Not affiliated with Valve."]}),s.jsxs("p",{children:[s.jsx("a",{href:"https://github.com/Hantu-Raya/Show-rank-merger",target:"_blank",rel:"noreferrer",children:"Source"})," · ",s.jsx("a",{href:"https://ko-fi.com/hantuaraya",target:"_blank",rel:"noreferrer",children:"Ko-fi"}),c?.url&&c?.shortHash?s.jsxs(s.Fragment,{children:[" · ",s.jsxs("a",{href:c.url,target:"_blank",rel:"noreferrer",title:c.title||void 0,children:["Build ",s.jsx("code",{children:c.shortHash.slice(0,7)})]})]}):null]})]})]})}export{ia as R,Ce as _};
