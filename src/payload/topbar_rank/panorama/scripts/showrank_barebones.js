(function () {
    "use strict";

    var STEAM64_BASE = "76561197960265728";
    var STATLOCKER_MATCHES_URL_PREFIX = "https://statlocker.gg/profile/";
    var STATLOCKER_MATCHES_URL_SUFFIX = "/matches";
    var TEAM_AVERAGE_URL_PREFIX = "https://api.deadlock-api.com/v1/players/rank-predict/image?account_ids=";
    var TEAM_AVERAGE_URL_SUFFIX = "&format=webp";
    var TEAM_AVERAGE_ACCOUNTS = 6;
    var STARTUP_REFRESH_DELAYS = [0.25, 1.0];
    var PROFILE_REFRESH_DELAYS = [0.05, 0.15, 0.3, 0.6, 1.0, 1.5, 2.0];
    var ESCAPE_WITNESS_DELAYS = [0.05, 0.15, 0.3, 0.6];
    var ESCAPE_ROW_DELAYS = [0.25, 1.0, 2.0, 4.0, 8.0];
    var PROFILE_CONTEXT_CLOSE_DELAY = 0.5;
    var MISSING_WINDOW_END_SECONDS = 8 * 60;
    var MISSING_WINDOW_RETRY_INTERVAL = 0.5;
    var MISSING_WINDOW_MAX_RETRIES = 1800;
    var MISSING_WINDOW_CLASS = "ShowRankBarebonesMissingWindowExpired";
    var MISSING_NOTIFICATION_ROOT_ID = "ShowRankBarebonesNotificationRoot";
    var MISSING_TOAST_ID = "ShowRankBarebonesMissingToast";
    var MISSING_TOAST_VISIBLE_CLASS = "ShowRankBarebonesToastVisible";
    var MISSING_TOAST_EXPIRED_CLASS = "ShowRankBarebonesToastExpired";
    var MISSING_TOAST_AGED_CLASS = "ShowRankBarebonesToastAged";
    var MISSING_TOAST_REVEAL_DELAY = 0.03;
    var MISSING_TOAST_DURATION = 3.0;
    var MISSING_TOAST_DELETE_DELAY = 0.4;
    var MISSING_HERO_ICON_URL_PREFIX = "s2r://panorama/images/heroes/";
    var MISSING_HERO_ICON_FILES = {
        "abrams": "bull_sm_psd.vtex",
        "apollo": "fencer_sm_psd.vtex",
        "bebop": "bebop_sm_psd.vtex",
        "billy": "punkgoat_sm_psd.vtex",
        "cadence": "cadence_sm_psd.vtex",
        "calico": "nano_sm_psd.vtex",
        "celeste": "unicorn_sm_psd.vtex",
        "drifter": "drifter_sm_psd.vtex",
        "dynamo": "sumo_sm_psd.vtex",
        "fathom": "slork_sm_psd.vtex",
        "fortuna": "fortuna_sm_psd.vtex",
        "generic person": "genericperson_sm_psd.vtex",
        "graf": "graf_sm_psd.vtex",
        "graves": "necro_sm_psd.vtex",
        "grey talon": "archer_sm_psd.vtex",
        "gunslinger": "gunslinger_sm_psd.vtex",
        "haze": "haze_sm_psd.vtex",
        "holliday": "astro_sm_psd.vtex",
        "infernus": "inferno_sm_psd.vtex",
        "ivy": "tengu_sm_psd.vtex",
        "kali": "kali_sm_psd.vtex",
        "kelvin": "kelvin_sm_psd.vtex",
        "lady geist": "spectre_sm_psd.vtex",
        "lash": "lash_sm_psd.vtex",
        "mcginnis": "engineer_sm_psd.vtex",
        "mina": "vampirebat_sm_psd.vtex",
        "mirage": "mirage_sm_psd.vtex",
        "mo & krill": "digger_sm_psd.vtex",
        "paige": "bookworm_sm_psd.vtex",
        "paradox": "chrono_sm_psd.vtex",
        "pocket": "synth_sm_psd.vtex",
        "raven": "operative_sm_psd.vtex",
        "rem": "familiar_sm_psd.vtex",
        "rutger": "rutger_sm_psd.vtex",
        "seven": "gigawatt_sm_psd.vtex",
        "shiv": "shiv_sm_psd.vtex",
        "silver": "werewolf_sm_psd.vtex",
        "sinclair": "magician_sm_psd.vtex",
        "skyrunner": "skyrunner_sm_psd.vtex",
        "swan": "swan_sm_psd.vtex",
        "targetdummy": "targetdummy_sm_psd.vtex",
        "the boss": "yakuza_sm_psd.vtex",
        "the doorman": "doorman_sm_psd.vtex",
        "thumper": "thumper_sm_psd.vtex",
        "tokamak": "tokamak_sm_psd.vtex",
        "trapper": "trapper_sm_psd.vtex",
        "vandal": "vandal_sm_psd.vtex",
        "venator": "priest_sm_psd.vtex",
        "victor": "frank_sm_psd.vtex",
        "vindicta": "hornet_sm_psd.vtex",
        "viscous": "viscous_sm_psd.vtex",
        "vyper": "kali_sm_psd.vtex",
        "warden": "warden_sm_psd.vtex",
        "wraith": "wraith_sm_psd.vtex",
        "wrecker": "wrecker_sm_psd.vtex",
        "yamato": "yamato_sm_psd.vtex"
    };
    var PROFILE_CARD_CLASS = "ShowRankBarebonesProfileCard";
    var TOPBAR_PLAYER_CLASS = "ShowRankBarebonesTopbarPlayer";
    var PLAYER_ROW_CLASS = "ShowRankBarebonesPlayerRow";
    var root = $.GetContextPanel();
    var state;

    function isValid(panel) {
        try {
            return !!(panel && panel.IsValid && panel.IsValid());
        } catch (ignore) {
            return false;
        }
    }

    function getDocumentRoot(panel) {
        var current = panel;
        var parent;
        var depth = 0;
        if (!isValid(current)) {
            return null;
        }
        while (depth < 64) {
            try {
                parent = current.GetParent && current.GetParent();
            } catch (ignore) {
                parent = null;
            }
            if (!isValid(parent)) {
                break;
            }
            current = parent;
            depth += 1;
        }
        return current;
    }

    function isEscapeMenuOpen(escapeRoot) {
        var current = escapeRoot;
        var parent;
        var depth = 0;
        while (isValid(current) && depth < 8) {
            try {
                if (current.paneltype === "CitadelHud" && current.id === "Hud") {
                    return !!(current.BHasClass && current.BHasClass("ShowEscapeMenu"));
                }
                parent = current.GetParent && current.GetParent();
            } catch (ignore) {
                return false;
            }
            current = parent;
            depth += 1;
        }
        return false;
    }

    function isHideoutDocumentRoot(documentRoot) {
        try {
            return panelHasClass(documentRoot, "connectedToHideout") ||
                (!(documentRoot.paneltype === "CitadelHud" && documentRoot.id === "Hud") &&
                    panelHasClass(findChild(documentRoot, "Hud"), "connectedToHideout"));
        } catch (ignore) {
            return false;
        }
    }

    function findChild(panel, id, type) {
        var child;
        try {
            child = panel.FindChildTraverse(id);
            return child && (!type || child.paneltype === type) ? child : null;
        } catch (ignore) {
            return null;
        }
    }

    function findByClass(panel, className) {
        if (!isValid(panel) || !panel.FindChildrenWithClassTraverse) {
            return null;
        }
        try {
            return panel.FindChildrenWithClassTraverse(className) || [];
        } catch (ignore) {
            return null;
        }
    }

    function readText(panel) {
        try {
            return typeof panel.text === "string" ? panel.text : null;
        } catch (ignore) {
            return null;
        }
    }

    function setPanelClass(panel, className, enabled) {
        try {
            if (!isValid(panel)) { return; }
            if (enabled && panel.AddClass) { panel.AddClass(className); }
            if (!enabled && panel.RemoveClass) { panel.RemoveClass(className); }
        } catch (ignore) {
        }
    }

    function panelHasClass(panel, className) {
        try {
            return !!(isValid(panel) && panel.BHasClass && panel.BHasClass(className));
        } catch (ignore) {
            return false;
        }
    }

    function readAttribute(panel, name) {
        try {
            return panel.GetAttributeString(name, "");
        } catch (ignore) {
            return null;
        }
    }

    function normalizeHero(value) {
        if (typeof value !== "string") {
            return "";
        }
        value = value.replace(/^\s+|\s+$/g, "").toLowerCase();
        return value && value !== "#" ? value : "";
    }

    function normalizeAccount(value) {
        if (typeof value !== "string" || !/^[1-9][0-9]*$/.test(value) ||
                value.length > 10 || (value.length === 10 && value > "4294967295")) {
            return null;
        }
        return value;
    }

    function subtractSteamBase(value) {
        var index;
        var digit;
        var baseDigit;
        var borrow = 0;
        var result = "";
        if (value.length !== STEAM64_BASE.length || value < STEAM64_BASE) {
            return null;
        }
        for (index = value.length - 1; index >= 0; index -= 1) {
            digit = value.charCodeAt(index) - 48 - borrow;
            baseDigit = STEAM64_BASE.charCodeAt(index) - 48;
            if (digit < baseDigit) {
                digit += 10;
                borrow = 1;
            } else {
                borrow = 0;
            }
            result = String.fromCharCode(48 + digit - baseDigit) + result;
        }
        return normalizeAccount(result.replace(/^0+/, ""));
    }

    function normalizeIdentity(value) {
        var steam3;
        if (typeof value !== "string") {
            return null;
        }
        steam3 = /^\[U:1:([1-9][0-9]*)\]$/.exec(value) || /^U:1:([1-9][0-9]*)$/.exec(value);
        if (steam3) {
            return normalizeAccount(steam3[1]);
        }
        if (/^[1-9][0-9]*$/.test(value) && value.length === STEAM64_BASE.length) {
            return subtractSteamBase(value);
        }
        return normalizeAccount(value);
    }

    function setRankImage(record, account) {
        var image;

        if (!record || !isValid(record.rankImage)) {
            return;
        }
        image = record.rankImage;
        try {
            if (!account) {
                if (record.shownAccount !== null || image.visible !== false) {
                    image.SetImage("");
                }
                image.visible = false;
                record.shownAccount = null;
            } else {
                if (record.shownAccount !== account) {
                    image.SetImage("https://api.deadlock-api.com/v1/players/" + account +
                        "/rank-predict/image?format=webp");
                    record.shownAccount = account;
                }
                image.visible = true;
            }
        } catch (ignore) {
            record.shownAccount = null;
        }
    }


    function setTeamAverageImage(documentRoot, side, url) {
        var image = findChild(documentRoot, side === "friendly" ?
            "ShowRankBarebonesAverageFriendlyImage" : "ShowRankBarebonesAverageEnemyImage", "Image");
        url = typeof url === "string" ? url : "";
        if (!isValid(image)) {
            return false;
        }
        try {
            if (image.__showrankBarebonesAverageUrl !== url) {
                if (url || image.__showrankBarebonesAverageUrl) {
                    image.SetImage(url);
                }
                image.__showrankBarebonesAverageUrl = url;
            }
            return !!url;
        } catch (ignore) {
            return false;
        }
    }

    function clearTeamAverages(documentRoot) {
        setTeamAverageImage(documentRoot, "friendly");
        setTeamAverageImage(documentRoot, "enemy");
    }

    function updateTeamAverages(shared) {
        var accounts = { friendly: [], enemy: [] };
        var seen = { friendly: {}, enemy: {} };
        var index;
        var record;
        var side;
        var account;
        var friendlyUrl;
        var enemyUrl;
        if (!shared || shared.topbars.length !== 12) {
            clearTeamAverages(shared && shared.documentRoot);
            return false;
        }
        for (index = 0; index < shared.topbars.length; index += 1) {
            record = shared.topbars[index];
            side = detectTopbarTeamSide(record.root);
            account = normalizeAccount(record.shownAccount);
            if ((side !== "friendly" && side !== "enemy") || !account || seen[side][account]) {
                clearTeamAverages(shared.documentRoot);
                return false;
            }
            seen[side][account] = true;
            accounts[side].push(account);
        }
        if (accounts.friendly.length !== TEAM_AVERAGE_ACCOUNTS ||
                accounts.enemy.length !== TEAM_AVERAGE_ACCOUNTS) {
            clearTeamAverages(shared.documentRoot);
            return false;
        }
        friendlyUrl = TEAM_AVERAGE_URL_PREFIX + accounts.friendly.join(",") + TEAM_AVERAGE_URL_SUFFIX;
        enemyUrl = TEAM_AVERAGE_URL_PREFIX + accounts.enemy.join(",") + TEAM_AVERAGE_URL_SUFFIX;
        if (!setTeamAverageImage(shared.documentRoot, "friendly", friendlyUrl) ||
                !setTeamAverageImage(shared.documentRoot, "enemy", enemyUrl)) {
            clearTeamAverages(shared.documentRoot);
            return false;
        }
        return true;
    }


    function clearTopbars(shared) {
        var index;
        if (!shared) {
            return;
        }
        for (index = 0; index < shared.topbars.length; index += 1) {
            setRankImage(shared.topbars[index], null);
        }
        for (index = 0; index < shared.completedTopbars.length; index += 1) {
            setRankImage(shared.completedTopbars[index], null);
        }
        clearTeamAverages(shared.documentRoot);
    }

    function resetProbeCache(shared) {
        if (!shared) {
            return;
        }
        clearTopbars(shared);
        shared.probeCompleted = false;
        shared.completedTopbars = [];
        shared.topbars = [];
        shared.escapeOpenLatched = false;
        shared.escapeRoot = null;
        if (shared.escape) {
            shared.escapeToken += 1;
            shared.escape = null;
        }
    }

    function getState(panel) {
        var documentRoot = getDocumentRoot(panel);
        var shared;
        if (!documentRoot) { return null; }
        try {
            shared = documentRoot.__showrank_barebones_state_v1;
            if (!shared) {
                shared = {
                    escapeToken: 0, escapeOpenLatched: false,
                    escape: null, escapeRoot: null, probeCompleted: false, completedTopbars: [], topbars: []
                };
                documentRoot.__showrank_barebones_state_v1 = shared;
            }
            shared.documentRoot = documentRoot;
            if (isHideoutDocumentRoot(documentRoot)) { resetProbeCache(shared); }
            return shared;
        } catch (ignore) { return null; }
    }

    function resolveProfileAccount(record) {
        var account = null;
        var hidden;
        var accountId;
        var steamId;
        function accept(raw) {
            var normalized;
            if (raw === "") { return true; }
            normalized = normalizeIdentity(raw);
            if (!normalized || (account && account !== normalized)) { return false; }
            account = normalized;
            return true;
        }
        if (!record || !isValid(record.root) || !isValid(record.accountLabel)) { return null; }
        hidden = readText(record.accountLabel);
        accountId = readAttribute(record.root, "accountid");
        steamId = readAttribute(record.root, "steamid");
        if (hidden === null || accountId === null || steamId === null ||
                !accept(hidden) || !accept(accountId) || !accept(steamId)) { return null; }
        return account;
    }

    function openStatlocker(record) {
        var account = resolveProfileAccount(record);
        var url;
        if (!account) { return false; }
        url = STATLOCKER_MATCHES_URL_PREFIX + encodeURIComponent(account) + STATLOCKER_MATCHES_URL_SUFFIX;
        try { $.DispatchEvent("ExternalBrowserGoToURL", url); return true; } catch (ignore) { return false; }
    }

    function copyAccountId(record) {
        var account = resolveProfileAccount(record);
        if (!account) { return false; }
        try { $.DispatchEvent("CopyStringToClipboard", account, account); return true; } catch (ignore) { return false; }
    }

    function refreshProfile(record) {
        if (record && isValid(record.root) && isValid(record.accountLabel) && isValid(record.rankImage)) {
            setRankImage(record, resolveProfileAccount(record));
        }
    }

    function refreshTopbar(record) {
        var hero;
        if (!record || !isValid(record.root) || !isValid(record.heroLabel) || !isValid(record.rankImage)) {
            return "";
        }
        hero = normalizeHero(readText(record.heroLabel));
        if (record.hero !== hero) { setRankImage(record, null); record.hero = hero; }
        return hero;
    }

    function schedule(delay, callback) { $.Schedule(delay, callback); }

    function getMissingNotificationRoot(record) {
        var current = record && record.root;
        var parent;
        var candidate;
        var depth = 0;
        while (isValid(current) && depth < 64) {
            if (current.id === MISSING_NOTIFICATION_ROOT_ID) {
                return current;
            }
            candidate = findChild(current, MISSING_NOTIFICATION_ROOT_ID);
            if (isValid(candidate)) {
                return candidate;
            }
            try { parent = current.GetParent && current.GetParent(); } catch (ignoreParent) {
                parent = null;
            }
            current = parent;
            depth += 1;
        }
        return null;
    }

    function getMissingToastState(notificationRoot) {
        var toastState;
        if (!isValid(notificationRoot)) {
            return null;
        }
        try {
            toastState = notificationRoot.__showrank_barebones_missing_toast_state_v2;
            if (!toastState) {
                toastState = {
                    refreshScheduled: false, refreshProminent: false,
                    activeHeroes: [], activeHeroKeys: Object.create(null),
                    toastToken: 0, toast: null
                };
                notificationRoot.__showrank_barebones_missing_toast_state_v2 = toastState;
            }
            return toastState;
        } catch (ignoreState) {
            return null;
        }
    }

    function missingToastStateIsCurrent(notificationRoot, toastState) {
        try {
            return !!(isValid(notificationRoot) &&
                notificationRoot.__showrank_barebones_missing_toast_state_v2 === toastState);
        } catch (ignoreState) {
            return false;
        }
    }

    function missingToastIsCurrent(notificationRoot, toastState, toast, token) {
        return !!(missingToastStateIsCurrent(notificationRoot, toastState) &&
            toastState.toast === toast && toastState.toastToken === token &&
            isValid(toast.panel));
    }



    function clearMissingToastIcons(toast) {
        var index;
        var icon;
        if (!toast || !toast.icons) {
            return;
        }
        for (index = 0; index < toast.icons.length; index += 1) {
            icon = toast.icons[index];
            try {
                if (isValid(icon) && icon.DeleteAsync) {
                    icon.DeleteAsync(0);
                }
            } catch (ignoreDelete) {
            }
        }
        toast.icons = [];
    }

    function setMissingToastIcons(toast, heroKeys) {
        var index;
        var fileName;
        var icon;
        clearMissingToastIcons(toast);
        for (index = 0; index < heroKeys.length; index += 1) {
            fileName = MISSING_HERO_ICON_FILES[heroKeys[index]];
            if (!fileName) {
                continue;
            }
            icon = null;
            try {
                icon = $.CreatePanel("Image", toast.iconRow, "");
                icon.AddClass("ShowRankBarebonesMissingToastIcon");
                icon.hittest = false;
                icon.SetImage(MISSING_HERO_ICON_URL_PREFIX + fileName);
                toast.icons.push(icon);
            } catch (ignoreCreate) {
                try {
                    if (isValid(icon) && icon.DeleteAsync) {
                        icon.DeleteAsync(0);
                    }
                } catch (ignoreDelete) {
                }
            }
        }
        try {
            toast.iconRow.visible = toast.icons.length > 0;
        } catch (ignoreVisible) {
        }
    }

    function scheduleMissingToastAging(notificationRoot, toastState, toast, token) {
        schedule(MISSING_TOAST_DURATION, function () {
            if (!missingToastIsCurrent(notificationRoot, toastState, toast, token)) {
                return;
            }
            setPanelClass(toast.panel, MISSING_TOAST_AGED_CLASS, true);
        });
    }

    function hideMissingToast(notificationRoot, toastState) {
        var toast = toastState && toastState.toast;
        var token;
        if (!isValid(toast && toast.panel)) {
            return;
        }
        toastState.toastToken += 1;
        token = toastState.toastToken;
        setPanelClass(toast.panel, MISSING_TOAST_AGED_CLASS, false);
        setPanelClass(toast.panel, MISSING_TOAST_EXPIRED_CLASS, true);
        schedule(MISSING_TOAST_DELETE_DELAY, function () {
            if (!missingToastIsCurrent(notificationRoot, toastState, toast, token)) {
                return;
            }
            try {
                if (toast.panel.DeleteAsync) {
                    toast.panel.DeleteAsync(0);
                }
            } catch (ignoreDelete) {
            }
            if (toastState.toast === toast && toastState.toastToken === token) {
                toastState.toast = null;
            }
        });
    }

    function showMissingToast(notificationRoot, toastState, heroKeys, prominent) {
        var toast = toastState.toast;
        var token;
        var title;
        if (!isValid(toast && toast.panel)) {
            try {
                toast = {
                    panel: $.CreatePanel("Panel", notificationRoot, MISSING_TOAST_ID),
                    icons: []
                };
                toast.panel.AddClass("GenericAnnouncement");
                toast.panel.hittest = false;
                title = $.CreatePanel("Label", toast.panel, "");
                title.AddClass("AnnouncementTitle");
                title.text = "ENEMY MISSING";
                toast.iconRow = $.CreatePanel("Panel", toast.panel, "");
                toast.iconRow.AddClass("ShowRankBarebonesMissingToastIcons");
                toastState.toast = toast;
                prominent = true;
            } catch (ignoreCreate) {
                toastState.toast = null;
                return;
            }
        }
        setMissingToastIcons(toast, heroKeys);
        setPanelClass(toast.panel, MISSING_TOAST_EXPIRED_CLASS, false);
        if (prominent) {
            toastState.toastToken += 1;
            token = toastState.toastToken;
            setPanelClass(toast.panel, MISSING_TOAST_AGED_CLASS, false);
            if (!panelHasClass(toast.panel, MISSING_TOAST_VISIBLE_CLASS)) {
                schedule(MISSING_TOAST_REVEAL_DELAY, function () {
                    if (missingToastIsCurrent(notificationRoot, toastState, toast, token)) {
                        setPanelClass(toast.panel, MISSING_TOAST_VISIBLE_CLASS, true);
                    }
                });
            }
            scheduleMissingToastAging(notificationRoot, toastState, toast, token);
        }
    }

    function readMissingHeroKey(record) {
        var labels = findByClass(record && record.root, "HeroName");
        return labels && labels.length === 1 ? normalizeHero(readText(labels[0])) : "";
    }


    function scheduleMissingToastRefresh(notificationRoot, toastState, prominent) {
        toastState.refreshProminent = toastState.refreshProminent || !!prominent;
        if (toastState.refreshScheduled) {
            return;
        }
        toastState.refreshScheduled = true;
        schedule(0, function () {
            var refreshProminent;
            if (!missingToastStateIsCurrent(notificationRoot, toastState) ||
                    !toastState.refreshScheduled) {
                return;
            }
            toastState.refreshScheduled = false;
            refreshProminent = toastState.refreshProminent;
            toastState.refreshProminent = false;
            if (toastState.activeHeroes.length) {
                showMissingToast(notificationRoot, toastState,
                    toastState.activeHeroes, refreshProminent);
            } else {
                hideMissingToast(notificationRoot, toastState);
            }
        });
    }

    function activateMissingPlayer(record) {
        var notificationRoot = getMissingNotificationRoot(record);
        var toastState = getMissingToastState(notificationRoot);
        var heroKey;
        if (!toastState || !record || !isValid(record.root)) {
            return;
        }
        heroKey = readMissingHeroKey(record);
        if (!heroKey) {
            return;
        }
        record.missingActiveKey = heroKey;
        try {
            record.root.__showrank_barebones_missing_active_key = heroKey;
        } catch (ignoreKey) {
        }
        if (!toastState.activeHeroKeys[heroKey]) {
            toastState.activeHeroKeys[heroKey] = true;
            toastState.activeHeroes.push(heroKey);
        }
        scheduleMissingToastRefresh(notificationRoot, toastState, true);
    }

    function deactivateMissingPlayer(record) {
        var notificationRoot;
        var toastState;
        var heroKey = record && record.missingActiveKey;
        var index;
        if (!heroKey && record && isValid(record.root)) {
            try {
                heroKey = record.root.__showrank_barebones_missing_active_key || "";
            } catch (ignoreKey) {
                heroKey = "";
            }
        }
        if (!heroKey) {
            return;
        }
        record.missingActiveKey = "";
        try {
            record.root.__showrank_barebones_missing_active_key = "";
        } catch (ignoreClear) {
        }
        notificationRoot = getMissingNotificationRoot(record);
        toastState = getMissingToastState(notificationRoot);
        if (!toastState || !toastState.activeHeroKeys[heroKey]) {
            return;
        }
        delete toastState.activeHeroKeys[heroKey];
        for (index = toastState.activeHeroes.length - 1; index >= 0; index -= 1) {
            if (toastState.activeHeroes[index] === heroKey) {
                toastState.activeHeroes.splice(index, 1);
            }
        }
        scheduleMissingToastRefresh(notificationRoot, toastState, false);
    }

    function parseGameClockSeconds(text) {
        var match;
        var minutes;
        var seconds;
        if (typeof text !== "string") { return null; }
        match = /^(-)?([0-9]+):([0-5][0-9])$/.exec(text.replace(/^\s+|\s+$/g, ""));
        if (!match) { return null; }
        minutes = Number(match[2]);
        seconds = Number(match[3]);
        if (!isFinite(minutes) || !isFinite(seconds)) { return null; }
        return match[1] ? 0 : (minutes * 60) + seconds;
    }

    function readMissingWindowSeconds(record) {
        var current;
        var parent;
        var candidate;
        var clocks;
        var index;
        var seconds;
        var depth = 0;
        if (!record || !isValid(record.root)) { return null; }
        candidate = record.gameClockPanel;
        if (isValid(candidate)) {
            seconds = parseGameClockSeconds(readText(candidate));
            if (seconds !== null) {
                return seconds;
            }
        }
        current = record.root;
        while (isValid(current) && depth < 64) {
            candidate = findChild(current, "GameTime", "Label");
            if (isValid(candidate)) {
                seconds = parseGameClockSeconds(readText(candidate));
                if (seconds !== null) {
                    record.gameClockPanel = candidate;
                    record.documentRoot = getDocumentRoot(record.root);
                    return seconds;
                }
            }
            clocks = findByClass(current, "GameTime") || [];
            for (index = 0; index < clocks.length; index += 1) {
                candidate = clocks[index];
                if (isValid(candidate)) {
                    seconds = parseGameClockSeconds(readText(candidate));
                    if (seconds !== null) {
                        record.gameClockPanel = candidate;
                        record.documentRoot = getDocumentRoot(record.root);
                        return seconds;
                    }
                }
            }
            try { parent = current.GetParent && current.GetParent(); } catch (ignoreParent) {
                parent = null;
            }
            if (!isValid(parent)) { break; }
            current = parent;
            depth += 1;
        }
        record.gameClockPanel = null;
        return null;
    }


    function setMissingWindowExpired(record, expired) {
        expired = !!expired;
        if (!record || !isValid(record.root) || record.missingWindowExpired === expired) {
            return;
        }
        record.missingWindowExpired = expired;
        setPanelClass(record.root, MISSING_WINDOW_CLASS, expired);
    }


    function scheduleMissingWindowWatch(record, token, delay) {
        schedule(delay, function () {
            continueMissingWindowWatch(record, token);
        });
    }

    function continueMissingWindowWatch(record, token) {
        var documentRoot;
        var seconds;
        var healthVisible;
        var unavailable;
        if (!record || token !== record.missingWindowToken || !isValid(record.root)) { return; }
        try {
            if (record.root.__showrank_barebones_missing_window_token !== token) { return; }
        } catch (ignoreToken) {
            return;
        }
        seconds = readMissingWindowSeconds(record);
        documentRoot = record.documentRoot;
        if (!isValid(documentRoot)) {
            documentRoot = getDocumentRoot(record.root);
        }
        if (isHideoutDocumentRoot(documentRoot) || seconds === null) {
            setMissingWindowExpired(record, false);
        } else {
            if (seconds >= MISSING_WINDOW_END_SECONDS) {
                setMissingWindowExpired(record, true);
                deactivateMissingPlayer(record);
                return;
            }
            setMissingWindowExpired(record, false);
            healthVisible = panelHasClass(record.root, "HealthVisible");
            unavailable = panelHasClass(record.root, "Dead") ||
                panelHasClass(record.root, "Disconnected");
            if (healthVisible || unavailable) {
                deactivateMissingPlayer(record);
            }
            if (healthVisible) {
                record.missingHealthArmed = true;
                record.missingHealthWasVisible = true;
            } else if (!unavailable && record.missingHealthArmed &&
                    record.missingHealthWasVisible) {
                record.missingHealthWasVisible = false;
                activateMissingPlayer(record);
            }
        }
        record.missingWindowChecks += 1;
        if (record.missingWindowChecks < MISSING_WINDOW_MAX_RETRIES) {
            scheduleMissingWindowWatch(record, token, MISSING_WINDOW_RETRY_INTERVAL);
        }
    }

    function startMissingWindowWatch(record) {
        var token;
        if (!record || !isValid(record.root)) { return; }
        deactivateMissingPlayer(record);
        try {
            token = Number(record.root.__showrank_barebones_missing_window_token || 0) + 1;
            record.root.__showrank_barebones_missing_window_token = token;
        } catch (ignoreToken) {
            return;
        }
        record.missingWindowToken = token;
        record.missingWindowChecks = 0;
        record.missingWindowExpired = null;
        record.missingHealthArmed = false;
        record.missingHealthWasVisible = false;
        record.missingActiveKey = "";
        record.gameClockPanel = null;
        record.documentRoot = null;
        continueMissingWindowWatch(record, token);
    }

    function startTopbarWatch(record) {
        var index;
        getState(record && record.root);
        refreshTopbar(record);
        for (index = 0; index < STARTUP_REFRESH_DELAYS.length; index += 1) {
            schedule(STARTUP_REFRESH_DELAYS[index], function () { refreshTopbar(record); });
        }
    }

    function continueProfileWatch(record, delays, token, index, elapsed) {
        if (index >= delays.length) { return; }
        schedule(delays[index] - elapsed, function () {
            if (token !== record.refreshToken) { return; }
            refreshProfile(record);
            continueProfileWatch(record, delays, token, index + 1, delays[index]);
        });
    }

    function startProfileWatch(record, delays) {
        var token;
        if (!record) { return; }
        token = record.refreshToken + 1;
        record.refreshToken = token;
        refreshProfile(record);
        continueProfileWatch(record, delays, token, 0, 0);
    }


    function detectTopbarTeamSide(panel) {
        var current = panel;
        var depth = 0;
        var id;
        while (isValid(current) && depth < 32) {
            id = String(current.id || "");
            if (id === "TeamFriendly") { return "friendly"; }
            if (id === "TeamEnemy") { return "enemy"; }
            try { current = current.GetParent && current.GetParent(); } catch (ignore) { current = null; }
            depth += 1;
        }
        return "";
    }

    function buildProfileRecord(panel) {
        var accountLabel = findChild(panel, "ShowRankBarebonesAccount", "Label");
        return isValid(panel) && isValid(accountLabel) ? { root: panel, accountLabel: accountLabel } : null;
    }

    function buildTopbarRecord(panel) {
        var heroLabels = findByClass(panel, "HeroName");
        var heroLabel = heroLabels && heroLabels.length === 1 ? heroLabels[0] : null;
        var rankImage = findChild(panel, "ShowRankBarebonesTopbarRankImage", "Image");
        return isValid(panel) && isValid(heroLabel) && isValid(rankImage) ? {
            root: panel, heroLabel: heroLabel, rankImage: rankImage,
            hero: "", shownAccount: null
        } : null;
    }

    function buildRowRecord(panel) {
        var heroLabel = findChild(panel, "ShowRankBarebonesRowHero", "Label");
        var mainContents = findChild(panel, "MainContents", "Panel");
        var rankImage = findChild(panel, "ShowRankBarebonesPlayerListRankImage", "Image");
        return isValid(panel) && isValid(heroLabel) && isValid(mainContents) && isValid(rankImage) ? {
            root: panel, heroLabel: heroLabel, mainContents: mainContents,
            rankImage: rankImage, shownAccount: null, account: null
        } : null;
    }

    function scanRecords(documentRoot, className, build) {
        var roots = findByClass(documentRoot, className);
        var records = [];
        var index;
        var record;
        if (roots === null) { return null; }
        for (index = 0; index < roots.length; index += 1) {
            record = build(roots[index]);
            if (record) { records.push(record); }
        }
        return records;
    }

    function scanTopbars(shared) {
        var records = scanRecords(shared && shared.documentRoot, TOPBAR_PLAYER_CLASS, buildTopbarRecord);
        if (records === null) { return false; }
        shared.topbars = records;
        return true;
    }

    function cacheCompletedTopbars(shared) {
        var cached = [];
        var seenHeroes = Object.create(null);
        var seenAccounts = Object.create(null);
        var index;
        var record;
        var hero;
        var account;
        if (!shared || (shared.topbars.length !== 6 && shared.topbars.length !== 12)) { return false; }
        for (index = 0; index < shared.topbars.length; index += 1) {
            record = shared.topbars[index];
            hero = normalizeHero(record.hero);
            account = normalizeAccount(record.shownAccount);
            if (!hero || !account || seenHeroes[hero] || seenAccounts[account]) { return false; }
            seenHeroes[hero] = true;
            seenAccounts[account] = true;
            record.cachedAccount = account;
            cached.push(record);
        }
        shared.completedTopbars = cached;
        return true;
    }

    function completedTopbarsAreCurrent(shared) {
        var cached = shared && shared.completedTopbars;
        var cachedByHero = Object.create(null);
        var seenAccounts = Object.create(null);
        var matches = [];
        var index;
        var record;
        var hero;
        var account;
        if (!cached || (cached.length !== 6 && cached.length !== 12) ||
                !scanTopbars(shared) || shared.topbars.length !== cached.length) {
            return false;
        }
        for (index = 0; index < cached.length; index += 1) {
            hero = normalizeHero(cached[index].hero);
            account = normalizeAccount(cached[index].cachedAccount);
            if (!hero || !account || cachedByHero[hero] || seenAccounts[account]) { return false; }
            cachedByHero[hero] = cached[index];
            seenAccounts[account] = true;
        }
        for (index = 0; index < shared.topbars.length; index += 1) {
            record = shared.topbars[index];
            hero = normalizeHero(readText(record.heroLabel));
            record.hero = hero;
            if (!hero || !cachedByHero[hero]) { return false; }
            matches.push({ current: record, cached: cachedByHero[hero] });
            delete cachedByHero[hero];
        }
        for (index = 0; index < matches.length; index += 1) {
            record = matches[index].current;
            account = matches[index].cached.cachedAccount;
            if (record.root === matches[index].cached.root &&
                    record.rankImage === matches[index].cached.rankImage) {
                record.shownAccount = account;
            } else {
                setRankImage(record, account);
                if (record.shownAccount !== account) { return false; }
            }
        }
        updateTeamAverages(shared);
        return cacheCompletedTopbars(shared);
    }

    function currentRowHero(record) {
        return record && isValid(record.root) && isValid(record.heroLabel) && isValid(record.mainContents) ?
            normalizeHero(readText(record.heroLabel)) : "";
    }

    function snapshotProfiles(documentRoot) {
        var profiles = scanRecords(documentRoot, PROFILE_CARD_CLASS, buildProfileRecord) || [];
        var index;
        for (index = 0; index < profiles.length; index += 1) {
            profiles[index].accountAtSnapshot = resolveProfileAccount(profiles[index]);
        }
        return profiles;
    }

    function changedProfileAccount(documentRoot, snapshot) {
        var profiles = scanRecords(documentRoot, PROFILE_CARD_CLASS, buildProfileRecord) || [];
        var index;
        var snapshotIndex;
        var beforeIndex;
        var account;
        var accepted = null;
        var count = 0;
        for (index = 0; index < profiles.length; index += 1) {
            snapshotIndex = -1;
            for (beforeIndex = 0; beforeIndex < snapshot.length; beforeIndex += 1) {
                if (snapshot[beforeIndex].root === profiles[index].root) { snapshotIndex = beforeIndex; break; }
            }
            account = resolveProfileAccount(profiles[index]);
            if (account && (snapshotIndex < 0 || account !== snapshot[snapshotIndex].accountAtSnapshot)) {
                accepted = account;
                count += 1;
                if (count > 1) { return null; }
            }
        }
        return count === 1 ? accepted : null;
    }

    function escapeIsCurrent(session, token) {
        var shared = session && session.shared;
        return !!(shared && shared.escape === session && shared.escapeToken === token &&
            !isHideoutDocumentRoot(shared.documentRoot) &&
            isValid(session.root) && isEscapeMenuOpen(session.root));
    }

    function scheduleEscape(delay, session, token, callback) {
        schedule(delay, function () { if (escapeIsCurrent(session, token)) { callback(); } });
    }

    function closePlayerCards() {
        try {
            if (typeof DismissAllContextMenus === "function") { DismissAllContextMenus(); }
            else { $.DispatchEvent("DismissAllContextMenus"); }
        } catch (ignoreDismiss) {
        }
        try {
            if (typeof DropInputFocus === "function") { DropInputFocus(); }
            else { $.DispatchEvent("DropInputFocus"); }
        } catch (ignoreFocus) {
        }
    }

    function renderTopbarMatches(session, shouldRender) {
        var shared = session.shared;
        var topbarCounts = Object.create(null);
        var rowCounts = Object.create(null);
        var rowByHero = Object.create(null);
        var index;
        var record;
        var hero;
        var required = 0;
        var matched = 0;
        if (!scanTopbars(shared) || !escapeIsCurrent(session, session.token)) { return false; }
        for (index = 0; index < shared.topbars.length; index += 1) {
            record = shared.topbars[index];
            hero = refreshTopbar(record);
            if (hero) { topbarCounts[hero] = (topbarCounts[hero] || 0) + 1; }
        }
        for (index = 0; index < session.rows.length; index += 1) {
            record = session.rows[index];
            hero = currentRowHero(record);
            if (hero) {
                rowCounts[hero] = (rowCounts[hero] || 0) + 1;
                rowByHero[hero] = record;
            }
        }
        for (index = 0; index < shared.topbars.length; index += 1) {
            record = shared.topbars[index];
            hero = record.hero;
            if (hero && topbarCounts[hero] === 1) {
                required += 1;
                if (rowCounts[hero] === 1 && rowByHero[hero].account) {
                    matched += 1;
                    if (shouldRender) { setRankImage(record, rowByHero[hero].account); }
                }
            }
        }
        return (required === 6 || required === 12) && matched === required;
    }

    function finishEscapePass(session) {
        var shared = session.shared;
        var filled;
        if (session.finished || !escapeIsCurrent(session, session.token)) { return; }
        filled = renderTopbarMatches(session, true);
        session.finished = true;
        shared.completedTopbars = [];
        shared.probeCompleted = filled && cacheCompletedTopbars(shared);
        if (shared.probeCompleted) {
            updateTeamAverages(shared);
        } else { clearTeamAverages(shared.documentRoot); }
        session.rows = [];
        if (shared.escape === session) { shared.escape = null; }
        schedule(PROFILE_CONTEXT_CLOSE_DELAY, function () {
            if (shared.escapeToken === session.token) { closePlayerCards(); }
        });
    }

    function completeRowProbe(session, record, account) {
        if (session.finished || !escapeIsCurrent(session, session.token)) { return; }
        session.index += 1;
        if (account) {
            record.account = account;
            setRankImage(record, account);
            if (renderTopbarMatches(session, false)) { finishEscapePass(session); return; }
        }
        if (session.index >= session.rows.length) { finishEscapePass(session); return; }
        probeNextRow(session);
    }

    function inspectRow(session, record, snapshot, attempt) {
        var account;
        if (session.finished || !escapeIsCurrent(session, session.token)) { return; }
        account = changedProfileAccount(session.shared.documentRoot, snapshot);
        if (account) { completeRowProbe(session, record, account); }
        else if (attempt < ESCAPE_WITNESS_DELAYS.length) {
            scheduleEscape(ESCAPE_WITNESS_DELAYS[attempt], session, session.token, function () {
                inspectRow(session, record, snapshot, attempt + 1);
            });
        } else { completeRowProbe(session, record, null); }
    }

    function probeNextRow(session) {
        var record;
        var snapshot;
        if (session.finished || !escapeIsCurrent(session, session.token)) { return; }
        if (session.index >= session.rows.length) { finishEscapePass(session); return; }
        record = session.rows[session.index];
        if (!isValid(record.mainContents)) {
            session.index += 1;
            probeNextRow(session);
            return;
        }
        snapshot = snapshotProfiles(session.shared.documentRoot);
        try { $.DispatchEvent("Activated", record.mainContents, "mouse"); }
        catch (ignore) { session.index += 1; probeNextRow(session); return; }
        scheduleEscape(ESCAPE_WITNESS_DELAYS[0], session, session.token, function () {
            inspectRow(session, record, snapshot, 1);
        });
    }

    function collectEscapeRows(session, attempt) {
        var rows = scanRecords(session.shared.documentRoot, PLAYER_ROW_CLASS, buildRowRecord) || [];
        var index;
        if (!escapeIsCurrent(session, session.token) || session.started) { return; }
        session.rows = [];
        for (index = 0; index < rows.length; index += 1) {
            setRankImage(rows[index], null);
            if (currentRowHero(rows[index])) { session.rows.push(rows[index]); }
        }
        if (session.rows.length > 0 || attempt >= ESCAPE_ROW_DELAYS.length) {
            session.started = true;
            probeNextRow(session);
        } else {
            scheduleEscape(ESCAPE_ROW_DELAYS[attempt], session, session.token, function () {
                collectEscapeRows(session, attempt + 1);
            });
        }
    }

    function startEscapePass(escapeRoot) {
        var shared = getState(escapeRoot);
        var playersTab;
        var session;
        state = shared || state;
        if (!shared || !isValid(escapeRoot) || isHideoutDocumentRoot(shared.documentRoot)) { return; }
        if (shared.escapeOpenLatched && shared.escapeRoot !== escapeRoot) {
            shared.escapeToken += 1;
            shared.escape = null;
            shared.escapeOpenLatched = false;
        }
        if (!isEscapeMenuOpen(escapeRoot)) {
            shared.escapeOpenLatched = false;
            shared.escapeRoot = null;
            if (shared.escape) { shared.escapeToken += 1; shared.escape = null; }
            return;
        }
        if (shared.probeCompleted) {
            if (completedTopbarsAreCurrent(shared)) { return; }
            resetProbeCache(shared);
        }
        if (shared.escapeOpenLatched) { return; }
        shared.escapeOpenLatched = true;
        shared.escapeRoot = escapeRoot;
        shared.escapeToken += 1;
        session = {
            shared: shared, token: shared.escapeToken, root: escapeRoot, rows: [], index: 0,
            started: false, finished: false
        };
        shared.escape = session;
        clearTopbars(shared);
        playersTab = findChild(escapeRoot, "PlayersTab");
        if (isValid(playersTab)) {
            try { $.DispatchEvent("Activated", playersTab); } catch (ignore) {
            }
        }
        collectEscapeRows(session, 0);
    }

    function resetEscapePassAfterClose(escapeRoot) {
        var shared = getState(escapeRoot) || state;
        if (!shared || isEscapeMenuOpen(escapeRoot)) { return; }
        state = shared;
        shared.escapeOpenLatched = false;
        shared.escapeRoot = null;
        shared.escapeToken += 1;
        shared.escape = null;
    }

    if (root && root.paneltype === "CitadelProfileCard") {
        var profileRecord = {
            root: root,
            accountLabel: findChild(root, "ShowRankBarebonesAccount", "Label"),
            rankImage: findChild(root, "ShowRankBarebonesRankImage", "Image"),
            shownAccount: null,
            refreshToken: 0
        };
        root.ShowRankBarebonesRefresh = function () { startProfileWatch(profileRecord, PROFILE_REFRESH_DELAYS); };
        root.ShowRankBarebonesOpenStatlocker = function () { return openStatlocker(profileRecord); };
        root.ShowRankBarebonesCopyAccount = function () { return copyAccountId(profileRecord); };
        startProfileWatch(profileRecord, STARTUP_REFRESH_DELAYS);
    } else if (isValid(root) && root.paneltype === "CitadelHudTopBarPlayer") {
        var topbarRecord = buildTopbarRecord(root);
        var missingWindowRecord = {
            root: root, missingWindowToken: 0, missingWindowChecks: 0
        };
        startMissingWindowWatch(missingWindowRecord);
        startTopbarWatch(topbarRecord);
    } else if (isValid(root) && root.paneltype === "CitadelHudEscapeMenu") {
        $.ShowRankBarebonesEscapeOpen = function () { startEscapePass(root); };
        $.ShowRankBarebonesEscapeOut = function () {
            schedule(0, function () { resetEscapePassAfterClose(root); });
        };
    }
}());
