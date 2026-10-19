// Merged top bar layouts for Top Bar Plus v5 + ShowRank v1.0.0.
// Each is Top Bar Plus v5's layout plus exactly the lines ShowRank adds to the stock layout;
// test/mergedLayouts.test.js checks that against layouts decompiled from both pinned VPKs.

export const MERGED_LAYOUT_PATHS = Object.freeze([
  "panorama/layout/citadel_hud_top_bar.vxml_c",
  "panorama/layout/citadel_hud_top_bar_player.vxml_c"
]);

export const MERGED_LAYOUTS = Object.freeze({
  alert: Object.freeze({
    "panorama/layout/citadel_hud_top_bar.vxml_c": String.raw`<!-- ShowRank Barebones v1.0.0 + Top Bar Plus v5 merged layout. Generated for Show-rank-merger; do not edit by hand. -->
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
	</scripts>
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
`,
    "panorama/layout/citadel_hud_top_bar_player.vxml_c": String.raw`<!-- ShowRank Barebones v1.0.0 + Top Bar Plus v5 merged layout. Generated for Show-rank-merger; do not edit by hand. -->
<root>
	<styles>
		<include src="s2r://panorama/styles/citadel_base_styles.vcss_c" />
		<include src="s2r://panorama/styles/hud_common.vcss_c" />
		<include src="s2r://panorama/styles/citadel_hud_top_bar.vcss_c" />
		<include src="s2r://panorama/styles/showrank_barebones_topbar.vcss_c" />
	</styles>
	<scripts>
		<include src="s2r://panorama/scripts/showrank_barebones.vjs_c" />
	</scripts>
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
`
  }),
  no_missing: Object.freeze({
    "panorama/layout/citadel_hud_top_bar.vxml_c": String.raw`<!-- ShowRank Barebones v1.0.0 + Top Bar Plus v5 merged layout. Generated for Show-rank-merger; do not edit by hand. -->
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
	</scripts>
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
`,
    "panorama/layout/citadel_hud_top_bar_player.vxml_c": String.raw`<!-- ShowRank Barebones v1.0.0 + Top Bar Plus v5 merged layout. Generated for Show-rank-merger; do not edit by hand. -->
<root>
	<styles>
		<include src="s2r://panorama/styles/citadel_base_styles.vcss_c" />
		<include src="s2r://panorama/styles/hud_common.vcss_c" />
		<include src="s2r://panorama/styles/citadel_hud_top_bar.vcss_c" />
		<include src="s2r://panorama/styles/showrank_barebones_topbar.vcss_c" />
	</styles>
	<scripts>
		<include src="s2r://panorama/scripts/showrank_barebones.vjs_c" />
	</scripts>
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
`
  })
});
