(function () {
    "use strict";
    var viewedProfileIdentityPolicy = (function () {
        var STEAM_ID_BASE = "76561197960265728";
        var MAX_ACCOUNT_ID = "4294967295";

        function trim(value) {
            return String(value === null || value === undefined ? "" : value).replace(/^\s+|\s+$/g, "");
        }

        function stripLeadingZeroes(value) {
            var result = String(value).replace(/^0+/, "");
            return result || "0";
        }

        function normalizeAccount(value) {
            var normalized;
            if (typeof value !== "string") {
                return "";
            }
            normalized = trim(value);
            if (!/^\d{1,20}$/.test(normalized)) {
                return "";
            }
            normalized = stripLeadingZeroes(normalized);
            if (normalized === "0" || normalized.length > MAX_ACCOUNT_ID.length ||
                (normalized.length === MAX_ACCOUNT_ID.length && normalized > MAX_ACCOUNT_ID)) {
                return "";
            }
            return normalized;
        }

        function canonicalAccount(value) {
            var normalized = normalizeAccount(value);
            return normalized && normalized === value ? normalized : "";
        }

        function subtractSteamIdBase(value) {
            var index;
            var baseIndex;
            var digit;
            var baseDigit;
            var difference;
            var borrow = 0;
            var output = "";
            if (!/^\d{17}$/.test(value) || value < STEAM_ID_BASE) {
                return "";
            }
            index = value.length - 1;
            baseIndex = STEAM_ID_BASE.length - 1;
            while (index >= 0) {
                digit = parseInt(value.charAt(index), 10) - borrow;
                baseDigit = baseIndex >= 0 ? parseInt(STEAM_ID_BASE.charAt(baseIndex), 10) : 0;
                difference = digit - baseDigit;
                if (difference < 0) {
                    difference += 10;
                    borrow = 1;
                } else {
                    borrow = 0;
                }
                output = String(difference) + output;
                index -= 1;
                baseIndex -= 1;
            }
            return normalizeAccount(stripLeadingZeroes(output));
        }

        function normalizeSteamId(value) {
            var normalized;
            if (typeof value !== "string") {
                return "";
            }
            normalized = stripLeadingZeroes(trim(value));
            return normalizeAccount(normalized) || subtractSteamIdBase(normalized);
        }

        function normalizeIdentity(value) {
            var normalized;
            var steam3;
            if (typeof value !== "string") {
                return "";
            }
            normalized = trim(value);
            steam3 = /^\[U:1:([1-9][0-9]*)\]$/.exec(normalized) || /^U:1:([1-9][0-9]*)$/.exec(normalized);
            if (steam3) {
                return normalizeAccount(steam3[1]);
            }
            return normalizeAccount(normalized) || normalizeSteamId(normalized);
        }

        function normalize(value, format) {
            if (format === "account") {
                return normalizeAccount(value);
            }
            if (format === "steamid") {
                return normalizeSteamId(value);
            }
            if (format === "identity") {
                return normalizeIdentity(value);
            }
            return "";
        }

        function result(state, account) {
            return {
                state: state,
                account: account || ""
            };
        }

        function resolve(primary, corroborators) {
            var account;
            var index;
            var witness;
            var raw;
            var normalized;
            if (!primary) {
                return result("missing", "");
            }
            raw = typeof primary.value === "string" ? primary.value : "";
            account = normalize(raw, primary.format);
            if (!account) {
                return result("missing", "");
            }
            corroborators = corroborators || [];
            for (index = 0; index < corroborators.length; index += 1) {
                witness = corroborators[index];
                if (!witness || typeof witness.value !== "string") {
                    return result("mismatch", account);
                }
                raw = witness.value;
                if (trim(raw) === "") {
                    continue;
                }
                normalized = normalize(raw, witness.format);
                if (!normalized || normalized !== account) {
                    return result("mismatch", account);
                }
            }
            return result("valid", account);
        }

        function same(left, right) {
            return !!left && !!right && left.state === right.state && left.account === right.account;
        }

        function payloadMatches(value, account) {
            return typeof value === "number" && isFinite(value) && Math.floor(value) === value &&
                value > 0 && value <= 4294967295 && String(value) === account;
        }

        function accountNumber(account) {
            var normalized = normalizeAccount(account);
            return normalized ? Number(normalized) : null;
        }

        return {
            normalizeAccount: normalizeAccount,
            normalizeIdentity: normalizeIdentity,
            resolve: resolve,
            canonicalAccount: canonicalAccount,
            same: same,
            payloadMatches: payloadMatches,
            accountNumber: accountNumber
        };
    }());
    var STATLOCKER_MATCHES_URL_PREFIX = "https://statlocker.gg/profile/";
    var STATLOCKER_MATCHES_URL_SUFFIX = "/matches";
    var RANK_API_BASE_URL = "https://api.deadlock-api.com/v1/players";
    var RANK_IMAGE_FORMAT = "webp";
    var TEAM_AVERAGE_ACCOUNTS = 6;
    var STARTUP_REFRESH_DELAYS = [0.25, 1.0];
    var PROFILE_REFRESH_DELAYS = [0.05, 0.15, 0.3, 0.6, 1.0, 1.5, 2.0];
    var PROFILE_HOVER_FAST_TICKS = 13;
    var PROFILE_HOVER_MAX_TICKS = 56;
    var PROFILE_HOVER_FAST_DELAY = 0.2;
    var PROFILE_HOVER_IDLE_DELAY = 1.0;
    var ESCAPE_WITNESS_DELAYS = [0.05, 0.15, 0.3, 0.6];
    var ESCAPE_ROW_DELAYS = [0.25, 1.0, 2.0, 4.0, 8.0];
    var PROFILE_CONTEXT_CLOSE_DELAY = 0.5;
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
    function isHideoutDocumentRoot(panel) {
        var documentRoot;
        try {
            if (!isValid(panel)) {
                return false;
            }
            if (panelHasClass(panel, "connectedToHideout") || (panel.BAscendantHasClass &&
                panel.BAscendantHasClass("connectedToHideout"))) {
                return true;
            }
            documentRoot = getDocumentRoot(panel);
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
            return child && (!type || child.paneltype === type) ? child: null;
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
        var text;
        try {
            text = panel.text;
            return typeof text === "string" ? text: null;
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
        return value && value !== "#" ? value: "";
    }
    function canonicalAccountOrNull(value) {
        return viewedProfileIdentityPolicy.canonicalAccount(value) || null;
    }
    function rankImageUrl(account) {
        return RANK_API_BASE_URL + "/" + account + "/rank/image?format=" + RANK_IMAGE_FORMAT;
    }
    function teamAverageImageUrl(accounts) {
        return RANK_API_BASE_URL + "/rank/image?account_ids=" + accounts.join(",") + "&format=" + RANK_IMAGE_FORMAT;
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
                    if (record.shownAccount !== null) {
                        image.visible = false;
                        image.SetImage("");
                    }
                    record.shownAccount = null;
                    image.SetImage(rankImageUrl(account));
                    record.shownAccount = account;
                }
                image.visible = true;
            }
        } catch (ignore) {
            record.shownAccount = null;
        }
    }
    function setTeamAverageImage(documentRoot, side, url) {
        var image = findChild(documentRoot, side === "friendly" ? "ShowRankBarebonesAverageFriendlyImage":
            "ShowRankBarebonesAverageEnemyImage", "Image");
        url = typeof url === "string" ? url: "";
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
    function rankTarget(panel, id) {
        var rankImage = findChild(panel, id, "Image");
        return isValid(rankImage) ? {
            rankImage: rankImage,
            shownAccount: null
        } : null;
    }
    function clearTopbarRecords(records) {
        var index;
        for (index = 0; records && index < records.length; index += 1) {
            setRankImage(records[index], null);
        }
    }
    function clearTopbars(shared) {
        var roots;
        var index;
        var target;
        if (!shared) {
            return;
        }
        roots = findByClass(shared.documentRoot, TOPBAR_PLAYER_CLASS);
        for (index = 0; roots && index < roots.length; index += 1) {
            target = rankTarget(roots[index], "ShowRankBarebonesTopbarRankImage");
            if (target) {
                setRankImage(target, null);
            }
        }
        clearTeamAverages(shared.documentRoot);
        shared.escapeRendered = false;
    }
    function releaseEscapeSession(shared) {
        var session = shared && shared.escape;
        if (!session) {
            return;
        }
        session.roster = null;
        session.lastPlan = null;
        session.intent = null;
        session.root = null;
        session.shared = null;
        shared.escape = null;
    }
    function resetProbeCache(shared) {
        if (!shared) {
            return;
        }
        if (shared.completedRoster || shared.escape || shared.escapeRendered) {
            clearTopbars(shared);
        }
        shared.completedRoster = null;
        shared.escapeOpenLatched = false;
        shared.escapeRoot = null;
        if (shared.escape) {
            shared.escapeToken += 1;
            releaseEscapeSession(shared);
        }
    }
    function getState(panel) {
        var documentRoot = getDocumentRoot(panel);
        var shared;
        if (!documentRoot) {
            return null;
        }
        try {
            shared = documentRoot.__showrank_barebones_state_v1;
            if (!shared) {
                shared = {
                    escapeToken: 0,
                    escapeOpenLatched: false,
                    escape: null,
                    escapeRoot: null,
                    completedRoster: null,
                    escapeRendered: false
                };
                documentRoot.__showrank_barebones_state_v1 = shared;
            }
            shared.documentRoot = documentRoot;
            if (isHideoutDocumentRoot(documentRoot)) {
                resetProbeCache(shared);
            }
            return shared;
        } catch (ignore) {
            return null;
        }
    }
    function resolveProfileAccount(record) {
        var identity;
        if (!record || !isValid(record.root) || !isValid(record.accountLabel)) {
            return null;
        }
        identity = viewedProfileIdentityPolicy.resolve({
            value: readText(record.accountLabel),
            format: "account"
        }, [
            {
                value: isValid(record.contextAccountLabel) ? readText(record.contextAccountLabel) : "",
                format: "account"
            },
            {
                value: readAttribute(record.root, "accountid"),
                format: "account"
            },
            {
                value: readAttribute(record.root, "steamid"),
                format: "identity"
            }
        ]);
        return identity.state === "valid" ? identity.account : null;
    }
    function openStatlocker(record) {
        var account = resolveProfileAccount(record);
        var url;
        if (!account) {
            return false;
        }
        url = STATLOCKER_MATCHES_URL_PREFIX + encodeURIComponent(account) + STATLOCKER_MATCHES_URL_SUFFIX;
        try {
            $.DispatchEvent("ExternalBrowserGoToURL", url);
            return true;
        } catch (ignore) {
            return false;
        }
    }
    function openPlayerProfile(record) {
        var account = resolveProfileAccount(record);
        if (!account) {
            return false;
        }
        try {
            $.DispatchEvent("CitadelShowProfilePageForAccount", Number(account));
            return true;
        } catch (ignore) {
            return false;
        }
    }
    function copyAccountId(record) {
        var account = resolveProfileAccount(record);
        if (!account) {
            return false;
        }
        try {
            $.DispatchEvent("CopyStringToClipboard", account, account);
            return true;
        } catch (ignore) {
            return false;
        }
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
        if (record.hero !== hero) {
            setRankImage(record, null);
            record.hero = hero;
        }
        return hero;
    }
    function schedule(delay, callback) {
        $.Schedule(delay, callback);
    }
    function startTopbarWatch(record) {
        var index;
        getState(record && record.root);
        refreshTopbar(record);
        for (index = 0; index < STARTUP_REFRESH_DELAYS.length; index += 1) {
            schedule(STARTUP_REFRESH_DELAYS[index], function () {
                refreshTopbar(record);
            });
        }
    }
    function continueProfileWatch(record, delays, token, index, elapsed) {
        if (index >= delays.length) {
            return;
        }
        schedule(delays[index] - elapsed, function () {
            if (token !== record.refreshToken || isHideoutDocumentRoot(record.root)) {
                return;
            }
            refreshProfile(record);
            continueProfileWatch(record, delays, token, index + 1, delays[index]);
        });
    }
    function continueProfileVerification(record, delays, token, index, elapsed) {
        var account;
        if (index >= delays.length) {
            return;
        }
        schedule(delays[index] - elapsed, function () {
            if (token !== record.refreshToken) {
                return;
            }
            account = resolveProfileAccount(record);
            if (account && account === record.stableAccount) {
                record.stableSamples += 1;
                if (record.stableSamples >= 2) {
                    setRankImage(record, account);
                }
            } else {
                if (record.stableAccount && account !== record.stableAccount) {
                    setRankImage(record, null);
                }
                record.stableAccount = account;
                record.stableSamples = account ? 1: 0;
            }
            continueProfileVerification(record, delays, token, index + 1, delays[index]);
        });
    }
    function continueHideoutProfileWatch(record, token, tick) {
        var delay;
        if (tick >= PROFILE_HOVER_MAX_TICKS || !isValid(record.root) || !isValid(record.accountLabel) ||
            !isValid(record.rankImage)) {
            return;
        }
        delay = tick < PROFILE_HOVER_FAST_TICKS ? PROFILE_HOVER_FAST_DELAY: PROFILE_HOVER_IDLE_DELAY;
        schedule(delay, function () {
            var account;
            var nextTick = tick + 1;
            if (token !== record.refreshToken) {
                return;
            }
            account = resolveProfileAccount(record);
            if (account !== record.stableAccount) {
                setRankImage(record, null);
                record.stableAccount = account;
                record.stableSamples = account ? 1: 0;
                nextTick = 0;
            } else if (account) {
                record.stableSamples += 1;
                if (record.stableSamples >= 2) {
                    setRankImage(record, account);
                }
            }
            continueHideoutProfileWatch(record, token, nextTick);
        });
    }
    function startProfileWatch(record, delays, retryOutside) {
        var token;
        if (!record) {
            return;
        }
        token = record.refreshToken + 1;
        record.refreshToken = token;
        if (retryOutside && !isHideoutDocumentRoot(record.root)) {
            refreshProfile(record);
            continueProfileWatch(record, delays, token, 0, 0);
            return;
        }
        record.stableAccount = null;
        record.stableSamples = 0;
        setRankImage(record, null);
        if (isHideoutDocumentRoot(record.root)) {
            continueHideoutProfileWatch(record, token, 0);
            return;
        }
        continueProfileVerification(record, delays, token, 0, 0);
    }
    function detectTopbarTeamSide(panel) {
        var current = panel;
        var depth = 0;
        var id;
        while (isValid(current) && depth < 32) {
            id = String(current.id || "");
            if (id === "TeamFriendly") {
                return "friendly";
            }
            if (id === "TeamEnemy") {
                return "enemy";
            }
            try {
                current = current.GetParent && current.GetParent();
            } catch (ignore) {
                current = null;
            }
            depth += 1;
        }
        return "";
    }
    function buildProfileRecord(panel) {
        var page = panel && panel.paneltype === "CitadelProfilePage";
        var accountLabel = findChild(panel, page ? "ShowRankBarebonesProfilePageAccount":
            "ShowRankBarebonesAccount", "Label");
        var contextAccountLabel = page ? null : findChild(panel, "ProfileStatsCommunityContextAccount", "Label");
        var rankImage = findChild(panel, page ? "ShowRankBarebonesProfilePageRankImage":
            "ShowRankBarebonesRankImage", "Image");
        return isValid(panel) && isValid(accountLabel) && isValid(rankImage) ? {
            root: panel,
            accountLabel: accountLabel,
            contextAccountLabel: contextAccountLabel,
            rankImage: rankImage,
            shownAccount: null,
            refreshToken: 0,
            stableAccount: null,
            stableSamples: 0
        } : null;
    }
    function buildTopbarRecord(panel, rankImage) {
        var heroLabels = findByClass(panel, "HeroName");
        var heroLabel = heroLabels && heroLabels.length === 1 ? heroLabels[0]: null;
        if (rankImage === undefined) {
            rankImage = findChild(panel, "ShowRankBarebonesTopbarRankImage", "Image");
        }
        return isValid(panel) && isValid(heroLabel) && isValid(rankImage) ? {
            root: panel,
            heroLabel: heroLabel,
            rankImage: rankImage,
            hero: "",
            teamSide: "",
            shownAccount: null
        } : null;
    }
    function buildRowRecord(panel) {
        var heroLabel = findChild(panel, "ShowRankBarebonesRowHero", "Label");
        var mainContents = findChild(panel, "MainContents", "Panel");
        var rankImage = findChild(panel, "ShowRankBarebonesPlayerListRankImage", "Image");
        return isValid(panel) && isValid(heroLabel) && isValid(mainContents) && isValid(rankImage) ? {
            root: panel,
            heroLabel: heroLabel,
            mainContents: mainContents,
            rankImage: rankImage,
            shownAccount: null,
            account: null
        } : null;
    }
    function scanRecords(documentRoot, className, build) {
        var roots = findByClass(documentRoot, className);
        var records = [];
        var index;
        var record;
        if (roots === null) {
            return null;
        }
        for (index = 0; index < roots.length; index += 1) {
            record = build(roots[index]);
            if (record) {
                records.push(record);
            }
        }
        return records;
    }
    function currentRowHero(record) {
        return record && isValid(record.root) && isValid(record.heroLabel) && isValid(record.mainContents) &&
            isValid(record.rankImage) ? normalizeHero(readText(record.heroLabel)): "";
    }
    function scanEscapeRows(roots, preservedRows) {
        var rows = [];
        var index;
        var preservedIndex;
        var record;
        var hero;
        var target;
        var account;
        for (index = 0; roots && index < roots.length; index += 1) {
            record = buildRowRecord(roots[index]);
            hero = currentRowHero(record);
            account = null;
            for (preservedIndex = 0; hero && preservedRows && preservedIndex < preservedRows.length; preservedIndex += 1) {
                if (preservedRows[preservedIndex].root === roots[index] &&
                    preservedRows[preservedIndex].hero === hero) {
                    account = canonicalAccountOrNull(preservedRows[preservedIndex].account);
                    break;
                }
            }
            target = rankTarget(roots[index], "ShowRankBarebonesPlayerListRankImage");
            if (target && !account) {
                setRankImage(target, null);
            }
            if (hero) {
                record.hero = hero;
                record.account = account;
                rows.push(record);
            }
        }
        return rows;
    }
    function readTopbarEvidenceSnapshot(roots) {
        var candidates = [];
        var targets = [];
        var heroCounts = Object.create(null);
        var duplicateHeroes = Object.create(null);
        var uniqueHeroCount = 0;
        var index;
        var record;
        var target;
        var hero;
        roots = roots || [];
        for (index = 0; index < roots.length; index += 1) {
            target = rankTarget(roots[index], "ShowRankBarebonesTopbarRankImage");
            if (target) {
                targets.push(target);
            }
            record = buildTopbarRecord(roots[index], target ? target.rankImage: null);
            if (!record) {
                continue;
            }
            hero = refreshTopbar(record);
            record.hero = hero;
            candidates.push(record);
            if (!heroCounts[hero]) {
                heroCounts[hero] = 1;
                if (hero) {
                    uniqueHeroCount += 1;
                }
            } else {
                heroCounts[hero] += 1;
                if (hero) {
                    duplicateHeroes[hero] = true;
                }
            }
        }
        return {
            candidates: candidates,
            targets: targets,
            heroCounts: heroCounts,
            duplicateHeroes: duplicateHeroes,
            uniqueHeroCount: uniqueHeroCount,
            topbarCount: candidates.length,
            teamSideCandidates: {
                "friendly": [],
                "enemy": []
            },
            sideFactsRead: false,
            allTeamSidesKnown: false,
            readiness: {
                rankTargetsReady: candidates.length === roots.length && targets.length === roots.length,
                completeUniqueTopbarRoster: candidates.length > 0 && uniqueHeroCount === candidates.length,
                teamSidesReady: false
            }
        };
    }
    function hydrateTopbarSideEvidence(snapshot) {
        var candidates;
        var index;
        var side;
        if (!snapshot || snapshot.sideFactsRead) {
            return !!(snapshot && snapshot.allTeamSidesKnown);
        }
        snapshot.sideFactsRead = true;
        snapshot.allTeamSidesKnown = true;
        candidates = snapshot.candidates;
        for (index = 0; index < candidates.length; index += 1) {
            side = detectTopbarTeamSide(candidates[index].root);
            candidates[index].teamSide = side;
            if (side === "friendly" || side === "enemy") {
                snapshot.teamSideCandidates[side].push(candidates[index]);
            } else {
                snapshot.allTeamSidesKnown = false;
            }
        }
        snapshot.readiness.teamSidesReady = snapshot.allTeamSidesKnown &&
            snapshot.teamSideCandidates["friendly"].length === TEAM_AVERAGE_ACCOUNTS &&
            snapshot.teamSideCandidates["enemy"].length === TEAM_AVERAGE_ACCOUNTS;
        return snapshot.allTeamSidesKnown;
    }
    function buildRosterReadModel(rows, topbarEvidence, completedRoster, cacheReplay) {
        var rowCounts = Object.create(null);
        var rowsByHero = Object.create(null);
        var seenRowAccounts = Object.create(null);
        var cachedAccounts = Object.create(null);
        var seenCachedAccounts = Object.create(null);
        var matches = [];
        var rowsUnique = true;
        var topbarsUnique = !!(topbarEvidence &&
            topbarEvidence.readiness.completeUniqueTopbarRoster);
        var rowsCoverTopbars = topbarsUnique;
        var cacheValid = !!(cacheReplay && topbarEvidence && completedRoster &&
            topbarEvidence.candidates.length === completedRoster.length);
        var index;
        var hero;
        var account;
        var row;
        var candidate;
        rows = rows || [];
        for (index = 0; index < rows.length; index += 1) {
            row = rows[index];
            hero = row.hero;
            rowCounts[hero] = (rowCounts[hero] || 0) + 1;
            if (rowCounts[hero] > 1) {
                rowsUnique = false;
            } else {
                rowsByHero[hero] = row;
            }
            account = canonicalAccountOrNull(row.account);
            if (account && seenRowAccounts[account]) {
                rowsUnique = false;
            } else if (account) {
                seenRowAccounts[account] = true;
            }
        }
        if (cacheValid) {
            for (index = 0; index < completedRoster.length; index += 1) {
                hero = normalizeHero(completedRoster[index].hero);
                account = canonicalAccountOrNull(completedRoster[index].account);
                if (!hero || !account || cachedAccounts[hero] || seenCachedAccounts[account]) {
                    cacheValid = false;
                    break;
                }
                cachedAccounts[hero] = account;
                seenCachedAccounts[account] = true;
            }
        }
        if (topbarEvidence) {
            for (index = 0; index < topbarEvidence.candidates.length; index += 1) {
                candidate = topbarEvidence.candidates[index];
                hero = candidate.hero;
                row = rowCounts[hero] === 1 ? rowsByHero[hero]: null;
                account = cacheReplay ? canonicalAccountOrNull(cachedAccounts[hero]):
                    canonicalAccountOrNull(row && row.account);
                if (!row && !cacheReplay) {
                    rowsCoverTopbars = false;
                }
                if (cacheReplay && !account) {
                    cacheValid = false;
                }
                matches.push({
                    hero: hero,
                    row: row,
                    topbar: candidate,
                    account: account
                });
            }
        } else {
            topbarsUnique = false;
            rowsCoverTopbars = false;
            cacheValid = false;
        }
        return {
            probes: rows,
            matches: matches,
            evidence: topbarEvidence,
            cacheReplay: !!cacheReplay,
            readiness: {
                available: !!topbarEvidence,
                supported: !!(topbarEvidence && topbarEvidence.readiness.rankTargetsReady &&
                    (topbarEvidence.topbarCount === 6 || topbarEvidence.topbarCount === 12)),
                rowsUnique: rowsUnique,
                topbarsUnique: topbarsUnique,
                rowsCoverTopbars: rowsCoverTopbars,
                cacheValid: cacheValid
            }
        };
    }
    function readRosterModel(shared, preservedRows, completedRoster, cacheReplay) {
        var documentRoot = shared && shared.documentRoot;
        var rowRoots = cacheReplay ? []: findByClass(documentRoot, PLAYER_ROW_CLASS);
        var topbarRoots = findByClass(documentRoot, TOPBAR_PLAYER_CLASS);
        var rows = scanEscapeRows(rowRoots, preservedRows);
        var topbarEvidence = topbarRoots === null ? null: readTopbarEvidenceSnapshot(topbarRoots);
        return buildRosterReadModel(rows, topbarEvidence, completedRoster, cacheReplay);
    }
    function escapeReadinessDecision(source, step) {
        var decision = {
            source: source,
            step: step,
            mayStartPreload: step === "start_preload",
            mayProbeRows: step === "probe_rows",
            shouldReplayCache: step === "replay_cache",
            shouldScheduleRetry: step === "wait_roster",
            shouldFinish: step === "finish",
            shouldStop: step === "source_blocked" || step === "transition_stop"
        };
        decision.mayShowSpinner = false;
        return decision;
    }
    function classifyEscapeReadiness(input) {
        var source = String(input && input.source || "");
        var phase = String(input && input.phase || "");
        var readiness = input && input.rosterReadiness;
        var decision;
        if (source !== "escape_open" && source !== "escape_out" && source !== "escape_continue") {
            source = "passive";
        }
        decision = escapeReadinessDecision(source, "source_blocked");
        if (source === "passive") {
            return decision;
        }
        if (!input || input.transition !== "active") {
            return escapeReadinessDecision(source, "transition_stop");
        }
        if (phase === "open") {
            if (source !== "escape_open") {
                return decision;
            }
            if (input.rootChanged) {
                return escapeReadinessDecision(source, "replace_root");
            }
            if (!input.menuOpen) {
                return escapeReadinessDecision(source, "transition_stop");
            }
            if (input.hasCache) {
                return escapeReadinessDecision(source, "replay_cache");
            }
            if (input.latched) {
                return escapeReadinessDecision(source, "runtime_idle");
            }
            return escapeReadinessDecision(source, "start_preload");
        }
        if (phase === "close") {
            if (source !== "escape_out") {
                return decision;
            }
            return escapeReadinessDecision(source, input.menuOpen ? "runtime_idle": "transition_stop");
        }
        if (source !== "escape_continue") {
            return decision;
        }
        if (phase === "collect") {
            if (input.started) {
                return escapeReadinessDecision(source, "runtime_idle");
            }
            if (Number(input.attempt) >= Number(input.retryLimit) ||
                Number(input.probeCount) > 0 && (!readiness || !readiness.available ||
                    !readiness.supported || readiness.rowsCoverTopbars)) {
                return escapeReadinessDecision(source, "probe_rows");
            }
            return escapeReadinessDecision(source, "wait_roster");
        }
        if (phase === "probe") {
            if (input.finished) {
                return escapeReadinessDecision(source, "runtime_idle");
            }
            if (Number(input.probeIndex) >= Number(input.probeCount)) {
                return escapeReadinessDecision(source, "finish");
            }
            return escapeReadinessDecision(source, "probe_rows");
        }
        if (phase === "result") {
            if (input.invalid || input.complete ||
                Number(input.probeIndex) >= Number(input.probeCount)) {
                return escapeReadinessDecision(source, "finish");
            }
            return escapeReadinessDecision(source, "probe_rows");
        }
        if (phase === "finish") {
            return escapeReadinessDecision(source, "finish");
        }
        return decision;
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
            snapshotIndex = - 1;
            for (beforeIndex = 0; beforeIndex < snapshot.length; beforeIndex += 1) {
                if (snapshot[beforeIndex].root === profiles[index].root) {
                    snapshotIndex = beforeIndex;
                    break;
                }
            }
            account = resolveProfileAccount(profiles[index]);
            if (account && (snapshotIndex < 0 || account !== snapshot[snapshotIndex].accountAtSnapshot)) {
                accepted = account;
                count += 1;
                if (count > 1) {
                    return null;
                }
            }
        }
        return count === 1 ? accepted: null;
    }
    function escapeIsCurrent(session, token) {
        var shared = session && session.shared;
        return !!(shared && shared.escape === session && shared.escapeToken === token &&
            !isHideoutDocumentRoot(shared.documentRoot) && isValid(session.root) && isEscapeMenuOpen(session.root));
    }
    function scheduleEscape(delay, session, token, callback) {
        schedule(delay, function () {
            if (escapeIsCurrent(session, token)) {
                callback();
            }
        });
    }
    function closePlayerCards() {
        try {
            if (typeof DismissAllContextMenus === "function") {
                DismissAllContextMenus();
            } else {
                $.DispatchEvent("DismissAllContextMenus");
            }
        } catch (ignoreDismiss) {
        }
        try {
            if (typeof DropInputFocus === "function") {
                DropInputFocus();
            } else {
                $.DispatchEvent("DropInputFocus");
            }
        } catch (ignoreFocus) {
        }
    }
    function sessionIsCurrent(session) {
        return session.cacheReplay ? isValid(session.root) && isEscapeMenuOpen(session.root) &&
            !isHideoutDocumentRoot(session.root): escapeIsCurrent(session, session.token);
    }
    function rosterTopbarTargets(roster) {
        return roster && roster.evidence ? roster.evidence.targets: null;
    }
    function setRosterAccount(roster, hero, account) {
        var index;
        account = canonicalAccountOrNull(account);
        if (!roster || !hero || !account) {
            return false;
        }
        for (index = 0; index < roster.probes.length; index += 1) {
            if (roster.probes[index].hero === hero) {
                roster.probes[index].account = account;
            }
        }
        for (index = 0; index < roster.matches.length; index += 1) {
            if (roster.matches[index].hero === hero) {
                roster.matches[index].account = account;
            }
        }
        return true;
    }
    function planTeamAverages(roster, writes, documentRoot) {
        var accounts = {
            friendly: [],
            enemy: []
        };
        var seen = {
            friendly: Object.create(null),
            enemy: Object.create(null)
        };
        var index;
        var side;
        var account;
        var friendlyImage;
        var enemyImage;
        if (!roster || roster.matches.length !== 12 || writes.length !== 12) {
            return null;
        }
        if (!hydrateTopbarSideEvidence(roster.evidence) ||
            !roster.evidence.readiness.teamSidesReady) {
            return null;
        }
        for (index = 0; index < writes.length; index += 1) {
            side = writes[index].record.teamSide;
            account = writes[index].account;
            if ((side !== "friendly" && side !== "enemy") || seen[side][account]) {
                return null;
            }
            seen[side][account] = true;
            accounts[side].push(account);
        }
        if (accounts.friendly.length !== TEAM_AVERAGE_ACCOUNTS || accounts.enemy.length !== TEAM_AVERAGE_ACCOUNTS) {
            return null;
        }
        friendlyImage = findChild(documentRoot, "ShowRankBarebonesAverageFriendlyImage", "Image");
        enemyImage = findChild(documentRoot, "ShowRankBarebonesAverageEnemyImage", "Image");
        if (!isValid(friendlyImage) || !isValid(enemyImage)) {
            return null;
        }
        return {
            friendlyImage: friendlyImage,
            enemyImage: enemyImage,
            friendlyUrl: teamAverageImageUrl(accounts.friendly),
            enemyUrl: teamAverageImageUrl(accounts.enemy)
        };
    }
    function cacheRosterWrites(roster, writes, complete) {
        var cached = [];
        var index;
        if (!complete || !roster.readiness.supported) {
            return null;
        }
        for (index = 0; index < writes.length; index += 1) {
            cached.push({
                hero: writes[index].hero,
                account: writes[index].account
            });
        }
        return cached.length === roster.matches.length ? cached: null;
    }
    function planRosterWrites(session, terminal) {
        var roster = session && session.roster;
        var seenAccounts = Object.create(null);
        var writes = [];
        var complete = true;
        var index;
        var match;
        var record;
        var account;
        if (!sessionIsCurrent(session) || !roster || !roster.readiness.available) {
            return {
                stale: true
            };
        }
        if (!roster.readiness.topbarsUnique || !roster.readiness.rowsUnique ||
            roster.cacheReplay && !roster.readiness.cacheValid) {
            return {
                invalid: true
            };
        }
        for (index = 0; index < roster.matches.length; index += 1) {
            match = roster.matches[index];
            record = match.topbar;
            if (!isValid(record.root) || !isValid(record.heroLabel) || !isValid(record.rankImage)) {
                return {
                    stale: true
                };
            }
            account = canonicalAccountOrNull(match.account);
            if (!roster.cacheReplay && !match.row) {
                complete = false;
                continue;
            }
            if (!account) {
                complete = false;
                continue;
            }
            if (seenAccounts[account]) {
                return {
                    invalid: true
                };
            }
            if (!roster.cacheReplay && match.row.account !== account) {
                return {
                    stale: true
                };
            }
            seenAccounts[account] = true;
            writes.push({
                record: record,
                row: match.row,
                hero: match.hero,
                account: account
            });
        }
        if (!terminal && (!complete || !roster.readiness.supported)) {
            return {
                waiting: true
            };
        }
        return {
            writes: writes,
            complete: complete,
            cached: cacheRosterWrites(roster, writes, complete),
            average: complete ? planTeamAverages(roster, writes, session.shared.documentRoot): null
        };
    }
    function rosterPlanIsCurrent(session, plan) {
        var index;
        var record;
        var row;
        if (!sessionIsCurrent(session)) {
            return false;
        }
        for (index = 0; index < plan.writes.length; index += 1) {
            record = plan.writes[index].record;
            row = plan.writes[index].row;
            if (!isValid(record.root) || !isValid(record.heroLabel) || !isValid(record.rankImage) ||
                normalizeHero(readText(record.heroLabel)) !== plan.writes[index].hero ||
                !session.roster.cacheReplay && currentRowHero(row) !== plan.writes[index].hero ||
                plan.average && !session.roster.cacheReplay && detectTopbarTeamSide(record.root) !== record.teamSide) {
                return false;
            }
        }
        return !plan.average || (isValid(plan.average.friendlyImage) && isValid(plan.average.enemyImage));
    }
    function applyRosterPlan(session, terminal) {
        var plan = planRosterWrites(session, terminal);
        var index;
        if (plan.stale || !plan.waiting && !plan.invalid && !rosterPlanIsCurrent(session, plan)) {
            return "stale";
        }
        if (plan.waiting) {
            return "waiting";
        }
        if (plan.invalid) {
            clearTopbarRecords(rosterTopbarTargets(session.roster));
            clearTeamAverages(session.shared.documentRoot);
            return "invalid";
        }
        for (index = 0; index < plan.writes.length; index += 1) {
            setRankImage(plan.writes[index].record, plan.writes[index].account);
        }
        if (plan.average) {
            setTeamAverageImage(session.shared.documentRoot, "friendly", plan.average.friendlyUrl);
            setTeamAverageImage(session.shared.documentRoot, "enemy", plan.average.enemyUrl);
        } else if (terminal) {
            clearTeamAverages(session.shared.documentRoot);
        }
        session.lastPlan = plan;
        if (plan.writes.length) {
            session.shared.escapeRendered = true;
        }
        return "applied";
    }
    function renderRoster(session, terminal) {
        var result = applyRosterPlan(session, terminal);
        var preservedRows;
        if (result !== "stale") {
            return result;
        }
        if (session.stalePlans >= 1) {
            clearTopbarRecords(rosterTopbarTargets(session.roster));
            clearTeamAverages(session.shared.documentRoot);
            return "invalid";
        }
        session.stalePlans += 1;
        preservedRows = !session.cacheReplay && session.roster ? session.roster.probes: null;
        session.roster = session.cacheReplay ?
            readRosterModel(session.shared, null, session.shared.completedRoster, true):
            readRosterModel(session.shared, preservedRows, null, false);
        result = applyRosterPlan(session, terminal);
        if (result === "stale") {
            clearTopbarRecords(rosterTopbarTargets(session.roster));
            clearTeamAverages(session.shared.documentRoot);
            return "invalid";
        }
        return result;
    }
    function finishEscapePass(session) {
        var shared = session.shared;
        var intent = classifyEscapeReadiness({
            source: "escape_continue",
            phase: "finish",
            transition: !session.finished && escapeIsCurrent(session, session.token) ? "active": "stale"
        });
        var result;
        session.intent = intent;
        if (!intent.shouldFinish) {
            return;
        }
        result = session.lastPlan && session.lastPlan.cached ? "applied": renderRoster(session, true);
        session.finished = true;
        shared.completedRoster = result === "applied" && session.lastPlan && session.lastPlan.cached ?
            session.lastPlan.cached: null;
        if (!shared.completedRoster) {
            clearTeamAverages(shared.documentRoot);
        }
        schedule(PROFILE_CONTEXT_CLOSE_DELAY, function () {
            if (shared.escapeToken === session.token) {
                closePlayerCards();
            }
        });
        releaseEscapeSession(shared);
    }
    function completeRowProbe(session, record, account) {
        var result;
        var intent = classifyEscapeReadiness({
            source: "escape_continue",
            phase: "probe",
            transition: escapeIsCurrent(session, session.token) ? "active": "stale",
            finished: session.finished,
            probeIndex: session.index,
            probeCount: session.roster.probes.length
        });
        session.intent = intent;
        if (!intent.mayProbeRows) {
            if (intent.shouldFinish) {
                finishEscapePass(session);
            }
            return;
        }
        session.index += 1;
        account = canonicalAccountOrNull(account);
        if (account) {
            setRosterAccount(session.roster, record.hero, account);
            setRankImage(record, account);
            result = renderRoster(session, false);
        }
        intent = classifyEscapeReadiness({
            source: "escape_continue",
            phase: "result",
            transition: "active",
            invalid: result === "invalid",
            complete: !!(session.lastPlan && session.lastPlan.cached),
            probeIndex: session.index,
            probeCount: session.roster.probes.length
        });
        session.intent = intent;
        if (intent.shouldFinish) {
            finishEscapePass(session);
        } else if (intent.mayProbeRows) {
            probeNextRow(session);
        }
    }
    function inspectRow(session, record, snapshot, attempt) {
        var intent = classifyEscapeReadiness({
            source: "escape_continue",
            phase: "probe",
            transition: escapeIsCurrent(session, session.token) ? "active": "stale",
            finished: session.finished,
            probeIndex: session.index,
            probeCount: session.roster.probes.length
        });
        var account;
        session.intent = intent;
        if (!intent.mayProbeRows) {
            if (intent.shouldFinish) {
                finishEscapePass(session);
            }
            return;
        }
        account = changedProfileAccount(session.shared.documentRoot, snapshot);
        if (account) {
            completeRowProbe(session, record, account);
        } else if (attempt < ESCAPE_WITNESS_DELAYS.length) {
            scheduleEscape(ESCAPE_WITNESS_DELAYS[attempt], session, session.token, function () {
                inspectRow(session, record, snapshot, attempt + 1);
            });
        } else {
            completeRowProbe(session, record, null);
        }
    }
    function probeNextRow(session) {
        var intent = classifyEscapeReadiness({
            source: "escape_continue",
            phase: "probe",
            transition: escapeIsCurrent(session, session.token) ? "active": "stale",
            finished: session.finished,
            probeIndex: session.index,
            probeCount: session.roster.probes.length
        });
        var record;
        var snapshot;
        session.intent = intent;
        if (intent.shouldFinish) {
            finishEscapePass(session);
            return;
        }
        if (!intent.mayProbeRows) {
            return;
        }
        record = session.roster.probes[session.index];
        if (!isValid(record.mainContents)) {
            session.index += 1;
            probeNextRow(session);
            return;
        }
        snapshot = snapshotProfiles(session.shared.documentRoot);
        try {
            $.DispatchEvent("Activated", record.mainContents, "mouse");
        } catch (ignore) {
            session.index += 1;
            probeNextRow(session);
            return;
        }
        scheduleEscape(ESCAPE_WITNESS_DELAYS[0], session, session.token, function () {
            inspectRow(session, record, snapshot, 1);
        });
    }
    function collectEscapeRows(session, attempt) {
        var intent = classifyEscapeReadiness({
            source: "escape_continue",
            phase: "collect",
            transition: escapeIsCurrent(session, session.token) ? "active": "stale",
            started: session.started,
            attempt: attempt,
            retryLimit: ESCAPE_ROW_DELAYS.length,
            probeCount: 0
        });
        var roster;
        session.intent = intent;
        if (intent.shouldStop || intent.step === "runtime_idle") {
            return;
        }
        roster = readRosterModel(session.shared, null, null, false);
        clearTopbarRecords(rosterTopbarTargets(roster));
        session.roster = roster;
        intent = classifyEscapeReadiness({
            source: "escape_continue",
            phase: "collect",
            transition: "active",
            started: false,
            attempt: attempt,
            retryLimit: ESCAPE_ROW_DELAYS.length,
            probeCount: roster.probes.length,
            rosterReadiness: roster.readiness
        });
        session.intent = intent;
        if (intent.mayProbeRows) {
            session.started = true;
            probeNextRow(session);
            return;
        }
        if (intent.shouldScheduleRetry) {
            scheduleEscape(ESCAPE_ROW_DELAYS[attempt], session, session.token, function () {
                collectEscapeRows(session, attempt + 1);
            });
        }
    }
    function reuseCompletedRoster(shared, escapeRoot, intent) {
        var roster = readRosterModel(shared, null, shared.completedRoster, true);
        var session;
        var result;
        if (!roster.readiness.cacheValid || !roster.readiness.topbarsUnique) {
            clearTopbarRecords(rosterTopbarTargets(roster));
            clearTeamAverages(shared.documentRoot);
            shared.completedRoster = null;
            shared.escapeRendered = false;
            return false;
        }
        session = {
            shared: shared,
            root: escapeRoot,
            roster: roster,
            cacheReplay: true,
            stalePlans: 0,
            intent: intent
        };
        result = renderRoster(session, true);
        if (result === "applied" && session.lastPlan && session.lastPlan.cached) {
            return true;
        }
        shared.completedRoster = null;
        clearTopbarRecords(rosterTopbarTargets(session.roster));
        clearTeamAverages(shared.documentRoot);
        shared.escapeRendered = false;
        return false;
    }
    function startEscapePass(escapeRoot) {
        var shared = getState(escapeRoot);
        var transition = !shared || !isValid(escapeRoot) ? "unavailable":
            isHideoutDocumentRoot(shared.documentRoot) ? "hideout": "active";
        var intent = classifyEscapeReadiness({
            source: "escape_open",
            phase: "open",
            transition: transition,
            rootChanged: !!(shared && shared.escapeOpenLatched && shared.escapeRoot !== escapeRoot),
            menuOpen: transition === "active" && isEscapeMenuOpen(escapeRoot),
            hasCache: !!(shared && shared.completedRoster),
            latched: !!(shared && shared.escapeOpenLatched)
        });
        var playersTab;
        var session;
        state = shared || state;
        if (intent.shouldStop && transition !== "active") {
            if (transition === "unavailable") {
                state = null;
            }
            return;
        }
        if (intent.step === "replace_root") {
            shared.escapeToken += 1;
            releaseEscapeSession(shared);
            shared.escapeOpenLatched = false;
            intent = classifyEscapeReadiness({
                source: "escape_open",
                phase: "open",
                transition: "active",
                rootChanged: false,
                menuOpen: isEscapeMenuOpen(escapeRoot),
                hasCache: !!shared.completedRoster,
                latched: false
            });
        }
        if (intent.shouldStop) {
            shared.escapeOpenLatched = false;
            shared.escapeRoot = null;
            if (shared.escape) {
                shared.escapeToken += 1;
                releaseEscapeSession(shared);
            }
            state = null;
            return;
        }
        if (intent.shouldReplayCache) {
            if (reuseCompletedRoster(shared, escapeRoot, intent)) {
                shared.escapeOpenLatched = true;
                shared.escapeRoot = escapeRoot;
                return;
            }
            intent = classifyEscapeReadiness({
                source: "escape_open",
                phase: "open",
                transition: "active",
                rootChanged: false,
                menuOpen: true,
                hasCache: false,
                latched: shared.escapeOpenLatched
            });
        }
        if (!intent.mayStartPreload) {
            return;
        }
        shared.escapeOpenLatched = true;
        shared.escapeRoot = escapeRoot;
        shared.escapeToken += 1;
        session = {
            shared: shared,
            token: shared.escapeToken,
            root: escapeRoot,
            roster: null,
            index: 0,
            started: false,
            finished: false,
            stalePlans: 0,
            lastPlan: null,
            intent: intent
        };
        shared.escape = session;
        clearTeamAverages(shared.documentRoot);
        playersTab = findChild(escapeRoot, "PlayersTab");
        if (isValid(playersTab)) {
            try {
                $.DispatchEvent("Activated", playersTab);
            } catch (ignore) {
            }
        }
        closePlayerCards();
        scheduleEscape(ESCAPE_WITNESS_DELAYS[0], session, session.token, function () {
            collectEscapeRows(session, 0);
        });
    }
    function resetEscapePassAfterClose(escapeRoot) {
        var shared = getState(escapeRoot) || state;
        var intent;
        if (!shared) {
            state = null;
            return;
        }
        intent = classifyEscapeReadiness({
            source: "escape_out",
            phase: "close",
            transition: "active",
            menuOpen: isEscapeMenuOpen(escapeRoot)
        });
        if (!intent.shouldStop) {
            if (shared.escape) {
                shared.escape.intent = intent;
            }
            return;
        }
        shared.escapeOpenLatched = false;
        shared.escapeRoot = null;
        shared.escapeToken += 1;
        releaseEscapeSession(shared);
        state = null;
    }
    function installProfileStatsCommunity() {
(function () {
    "use strict";
    /* viewed-profile identity policy is supplied by the barebones host */


    var BRIDGE_URL = "https://hantu-raya.github.io/deadlock-stats-bridge/bridge.html";
    var BRIDGE_ORIGIN_PATH = "https://hantu-raya.github.io/deadlock-stats-bridge/bridge.html";
    var SUPPORTER_TICKER_URL = "https://hantu-raya.github.io/hp-colors-preset-builder/supporters-strip/";
    var STATLOCKER_PROFILE_URL_PREFIX = "https://statlocker.gg/profile/";
    var STATLOCKER_PROFILE_URL_SUFFIX = "/matches";
    var BRIDGE_TITLE_PREFIX = "DLSTATS2:";
    var BRIDGE_TITLE_MAX_LENGTH = 2048;
    var BRIDGE_URL_MAX_LENGTH = 4096;
    var BRIDGE_FRAGMENT_MAX_LENGTH = 4096;
    var DEFAULT_MATCH_LIMIT = 50;
    var MATCH_LIMITS = {
        "50": true,
        "100": true,
        "150": true
    };
    var MATCH_MODES = {
        "ranked": true,
        "standard": true
    };
    var COMPARISON_MODES = {
        "community": true,
        "percentile": true
    };
    var AUTHORITY_NAMES = ["accountid", "steamid"];
    var CACHE_TTL_MS = 10 * 60 * 1000;
    var CONTEXT_CHECK_SECONDS = 0.5;
    var BRIDGE_ASSIGN_DELAY_SECONDS = 0.25;

    var REQUEST_TIMEOUT_SECONDS = 25;
    var MAX_HERO_ROWS = 64;
    var MAX_GENERATED_LENGTH = 64;
    var MAX_ERROR_MESSAGE_LENGTH = 160;
    var MAX_PLAYER_NAME_LENGTH = 64;
    var STATE_STOCK = "stock";
    var STATE_LOADING = "loading";
    var STATE_READY = "ready";
    var STATE_ERROR = "error";
    var STATE_DISABLED = "disabled";

    var GROUPS = [
        {
            id: "combat",
            metrics: ["kd", "kda"]
        },
        {
            id: "kills",
            metrics: ["average_kills", "average_assists"]
        },
        {
            id: "survival",
            metrics: ["average_deaths", "damage_taken_per_minute"]
        },
        {
            id: "damage",
            metrics: ["player_damage_per_minute", "accuracy", "critical_hit_rate", "boss_damage_per_minute"]
        },
        {
            id: "economy",
            metrics: ["net_worth_per_minute"]
        },
        {
            id: "sustain",
            metrics: ["healing_per_minute"]
        }
    ];

    var METRIC_PANELS = {
        "kd": ["PSCMetricKdPlayer", "PSCMetricKdCommunity", "PSCMetricKdPercentile"],
        "kda": ["PSCMetricKdaPlayer", "PSCMetricKdaCommunity", "PSCMetricKdaPercentile"],
        "average_kills": ["PSCMetricAverageKillsPlayer", "PSCMetricAverageKillsCommunity", "PSCMetricAverageKillsPercentile"],
        "average_assists": ["PSCMetricAverageAssistsPlayer", "PSCMetricAverageAssistsCommunity", "PSCMetricAverageAssistsPercentile"],
        "average_deaths": ["PSCMetricAverageDeathsPlayer", "PSCMetricAverageDeathsCommunity", "PSCMetricAverageDeathsPercentile"],
        "damage_taken_per_minute": ["PSCMetricDamageTakenPerMinutePlayer", "PSCMetricDamageTakenPerMinuteCommunity", "PSCMetricDamageTakenPerMinutePercentile"],
        "player_damage_per_minute": ["PSCMetricPlayerDamagePerMinutePlayer", "PSCMetricPlayerDamagePerMinuteCommunity", "PSCMetricPlayerDamagePerMinutePercentile"],
        "accuracy": ["PSCMetricAccuracyPlayer", "PSCMetricAccuracyCommunity", "PSCMetricAccuracyPercentile"],
        "critical_hit_rate": ["PSCMetricCriticalHitRatePlayer", "PSCMetricCriticalHitRateCommunity", "PSCMetricCriticalHitRatePercentile"],
        "net_worth_per_minute": ["PSCMetricNetWorthPerMinutePlayer", "PSCMetricNetWorthPerMinuteCommunity", "PSCMetricNetWorthPerMinutePercentile"],
        "boss_damage_per_minute": ["PSCMetricBossDamagePerMinutePlayer", "PSCMetricBossDamagePerMinuteCommunity", "PSCMetricBossDamagePerMinutePercentile"],
        "healing_per_minute": ["PSCMetricHealingPerMinutePlayer", "PSCMetricHealingPerMinuteCommunity", "PSCMetricHealingPerMinutePercentile"]
    };

    var GROUP_PERCENTILE_PANELS = {
        "combat": "PSCGroupCombatPercentile",
        "kills": "PSCGroupKillsPercentile",
        "survival": "PSCGroupSurvivalPercentile",
        "damage": "PSCGroupDamagePercentile",
        "economy": "PSCGroupEconomyPercentile",
        "sustain": "PSCGroupSustainPercentile"
    };

    var PERCENTILE_TOP_CLASS = "ProfileStatsCommunityPercentileTop";
    var PERCENTILE_BOTTOM_CLASS = "ProfileStatsCommunityPercentileBottom";
    var PERCENTILE_UNAVAILABLE_CLASS = "ProfileStatsCommunityPercentileUnavailable";
    var VALUE_UNAVAILABLE_CLASS = "ProfileStatsCommunityValueUnavailable";

    var ERROR_CODES = {
        "invalid_query": true,
        "network_error": true,
        "upstream_error": true,
        "rate_limit": true,
        "empty_sample": true,
        "invalid_payload": true,
        "payload_too_large": true,
        "internal_error": true
    };

    var ERROR_TEXT = {
        "invalid_query": "The community request was rejected.",
        "network_error": "The community service could not be reached.",
        "upstream_error": "The community service is unavailable.",
        "rate_limit": "The community service is rate-limited. Try again later.",
        "empty_sample": "No community sample is available for this profile yet.",
        "invalid_payload": "The community response was invalid.",
        "payload_too_large": "The community response was too large.",
        "internal_error": "The community service returned an internal error."
    };

    var root = null;
    var heroList = null;
    var statsBlock = null;
    var stockTitle = null;
    var stockLeft = null;
    var stockRight = null;
    var stockSectionName = null;
    var communityButton = null;
    var customPanel = null;
    var selfNamePanel = null;
    var titleLabel = null;
    var statLockerButton = null;
    var playerHeadingLeft = null;
    var playerHeadingRight = null;
    var accountWitness = null;
    var statusLabel = null;
    var metricsPanel = null;
    var metadataPanel = null;
    var sampleLabel = null;
    var generatedLabel = null;
    var retryButton = null;
    var bridgePanel = null;
    var supporterTicker = null;
    var matchCountDropdown = null;
    var rankedTab = null;
    var standardTab = null;
    var displayCommunityTab = null;
    var displayPercentileTab = null;
    var communityHeadingLeft = null;
    var percentileHeadingLeft = null;
    var communityHeadingRight = null;
    var percentileHeadingRight = null;
    var metricRefs = {};
    var stockSectionSignature = "";
    var stockRowSignature = "";

    var currentIdentity = null;
    var currentDisplayName = "";
    var lifecycleState = STATE_STOCK;
    var requestGeneration = 0;
    var watcherGeneration = 0;
    var watcherHandle = null;
    var watcherPending = false;
    var watcherCallback = null;
    var bridgeAssignmentHandle = null;
    var nonceSerial = 0;
    var requestState = null;
    var memoryCache = null;
    var rateLimitUntil = 0;
    var rateLimitBlocked = false;
    var initialized = false;
    var selectedMatches = DEFAULT_MATCH_LIMIT;
    var selectedMode = "ranked";
    var selectedComparison = "percentile";

    function isCallable(value) {
        return typeof value === "function";
    }



    function isCustomActive() {
        return lifecycleState === STATE_LOADING || lifecycleState === STATE_READY || lifecycleState === STATE_ERROR;
    }

    function enterState(nextState) {
        if (lifecycleState !== nextState) {

            lifecycleState = nextState;
        }
    }

    function isValidPanel(panel) {
        if (!panel) {
            return false;
        }
        try {
            if (isCallable(panel.IsValid)) {
                return !!panel.IsValid();
            }
        } catch (error) {
            return false;
        }
        return true;
    }

    function findPanel(id) {
        if (!isValidPanel(root) || !id) {
            return null;
        }
        try {
            return root.FindChildTraverse(id);
        } catch (error) {
            return null;
        }
    }

    function findDirectChildByClass(panel, className) {
        var count;
        var index;
        var child;
        if (!isValidPanel(panel) || !className) {
            return null;
        }
        try {
            count = Math.min(panel.GetChildCount(), 8);
        } catch (error) {
            return null;
        }
        for (index = 0; index < count; index += 1) {
            try {
                child = panel.GetChild(index);
            } catch (error2) {
                return null;
            }
            if (!isValidPanel(child)) {
                continue;
            }
            try {
                if (isCallable(child.BHasClass) && child.BHasClass(className)) {
                    return child;
                }
            } catch (error3) {
                continue;
            }
        }
        return null;
    }

    function setPanelEvent(panel, eventName, handler) {
        if (!isValidPanel(panel) || !isCallable(handler)) {
            return false;
        }
        try {
            panel.SetPanelEvent(eventName, handler);
            return true;
        } catch (error) {
            return false;
        }
    }

    function registerPanelEvent(panel, eventName, handler) {
        if (!isValidPanel(panel) || !isCallable(handler) || !isCallable($.RegisterEventHandler)) {
            return false;
        }
        try {
            $.RegisterEventHandler(eventName, panel, handler);
            return true;
        } catch (error) {
            return false;
        }
    }


    function setStyle(panel, propertyName, value) {
        if (!isValidPanel(panel)) {
            return;
        }
        try {
            if (panel.style) {
                panel.style[propertyName] = value;
            }
        } catch (error) {
            return;
        }
    }

    function setVisibility(panel, visible) {
        setStyle(panel, "visibility", visible ? "visible" : "collapse");
    }

    function setVisibleProperty(panel, visible) {
        if (!isValidPanel(panel)) {
            return;
        }
        try {
            panel.visible = !!visible;
        } catch (error) {
            return;
        }
    }

    function setText(panel, value) {
        if (!isValidPanel(panel)) {
            return;
        }
        try {
            panel.text = value === null || value === undefined ? "" : String(value);
        } catch (error) {
            return;
        }
    }

    function setClass(panel, className, enabled) {
        if (!isValidPanel(panel) || !className) {
            return;
        }
        try {
            if (enabled && isCallable(panel.AddClass)) {
                panel.AddClass(className);
            } else if (!enabled && isCallable(panel.RemoveClass)) {
                panel.RemoveClass(className);
            }
        } catch (error) {
            return;
        }
    }

    function trim(value) {
        return String(value).replace(/^\s+|\s+$/g, "");
    }

    function textOf(panel) {
        var value;
        if (!isValidPanel(panel)) {
            return "";
        }
        try {
            value = panel.text;
            return value === null || value === undefined ? "" : String(value);
        } catch (error) {
            return "";
        }
    }

    function normalizeDisplayName(value) {
        var normalized = trim(String(value || "").replace(/[\x00-\x1f\x7f]/g, " ").replace(/\s+/g, " "));
        if (normalized.length > MAX_PLAYER_NAME_LENGTH) {
            normalized = normalized.substring(0, MAX_PLAYER_NAME_LENGTH);
        }
        return normalized;
    }

    function readDisplayName() {
        var displayName;
        var count;
        var index;
        var child;
        if (!isValidPanel(selfNamePanel)) {
            selfNamePanel = findPanel("SelfName");
        }
        displayName = normalizeDisplayName(textOf(selfNamePanel));
        if (displayName) {
            return displayName;
        }
        try {
            count = Math.min(selfNamePanel.GetChildCount(), 8);
        } catch (error) {
            return "";
        }
        for (index = 0; index < count; index += 1) {
            try {
                child = selfNamePanel.GetChild(index);
            } catch (error2) {
                return "";
            }
            displayName = normalizeDisplayName(textOf(child));
            if (displayName) {
                return displayName;
            }
        }
        return "";
    }

    function renderViewedName() {
        var displayName = readDisplayName() || "PLAYER";
        if (displayName === currentDisplayName) {
            return;
        }
        currentDisplayName = displayName;
        setText(titleLabel, displayName + " VS COMMUNITY");
        setText(playerHeadingLeft, displayName);
        setText(playerHeadingRight, displayName);
    }

    function openStatLockerProfile() {
        var identity;
        var url;
        if (!isCustomActive()) {
            return;
        }
        identity = readIdentity();
        if (identity.state !== "valid" || !identity.account) {
            return;
        }
        url = STATLOCKER_PROFILE_URL_PREFIX + encodeURIComponent(identity.account) + STATLOCKER_PROFILE_URL_SUFFIX;
        try {
            if (isCallable($.DispatchEvent)) {
                $.DispatchEvent("ExternalBrowserGoToURL", url);
            }
        } catch (error) {
            return;
        }
    }

    function readRootAuthority(name) {
        var value;
        if (!isValidPanel(root)) {
            return "";
        }
        try {
            if (isCallable(root.GetAttributeString)) {
                value = root.GetAttributeString(name, "");
                return value === null || value === undefined ? "" : String(value);
            }
        } catch (error) {
            return "";
        }
        try {
            if (root[name] !== undefined && root[name] !== null) {
                return String(root[name]);
            }
        } catch (error2) {
            return "";
        }
        return "";
    }

    function readIdentity() {
        var witness;
        var authorityNames = AUTHORITY_NAMES;
        var corroborators = [];
        var index;
        var identity;
        if (!isValidPanel(accountWitness)) {
            accountWitness = findPanel("ProfileStatsCommunityAccount");
        }
        witness = accountWitness;
        for (index = 0; index < authorityNames.length; index += 1) {
            corroborators.push({
                value: readRootAuthority(authorityNames[index]),
                format: authorityNames[index] === "steamid" ? "identity" : "account"
            });
        }
        identity = viewedProfileIdentityPolicy.resolve({
            value: textOf(witness),
            format: "account"
        }, corroborators);
        if (identity.state === "missing") {
            return {
                state: "missing",
                account: "",
                message: "The viewed profile account is unavailable."
            };
        }
        if (identity.state !== "valid") {
            return {
                state: "mismatch",
                account: identity.account,
                message: "The viewed profile account witness does not match the profile root."
            };
        }
        return {
            state: "valid",
            account: identity.account,
            message: ""
        };
    }

    function payloadAccountMatches(value, accountText) {
        return viewedProfileIdentityPolicy.payloadMatches(value, accountText);
    }

    function sameIdentity(left, right) {
        return viewedProfileIdentityPolicy.same(left, right);
    }



    function isAscii(value) {
        var index;
        var code;
        for (index = 0; index < value.length; index += 1) {
            code = value.charCodeAt(index);
            if (code < 32 || code > 126) {
                return false;
            }
        }
        return true;
    }

    function isPlainMessage(value) {
        return typeof value === "string" && value.length > 0 && value.length <= MAX_ERROR_MESSAGE_LENGTH && isAscii(value);
    }

    function finiteNumber(value) {
        return typeof value === "number" && isFinite(value);
    }

    function isArray(value) {
        return Object.prototype.toString.call(value) === "[object Array]";
    }

    function hasOwn(object, key) {
        return Object.prototype.hasOwnProperty.call(object, key);
    }

    function exactKeys(object, required, optional) {
        var allowed = {};
        var keys;
        var index;
        var key;
        if (!object || typeof object !== "object" || isArray(object)) {
            return false;
        }
        optional = optional || [];
        for (index = 0; index < required.length; index += 1) {
            allowed[required[index]] = true;
        }
        for (index = 0; index < optional.length; index += 1) {
            allowed[optional[index]] = true;
        }
        keys = Object.keys(object);
        for (index = 0; index < keys.length; index += 1) {
            key = keys[index];
            if (!hasOwn(allowed, key)) {
                return false;
            }
        }
        for (index = 0; index < required.length; index += 1) {
            if (!hasOwn(object, required[index])) {
                return false;
            }
        }
        return true;
    }

    function expectedMetric(groupIndex, metricIndex) {
        return GROUPS[groupIndex].metrics[metricIndex];
    }
    function validMatchLimit(value) {
        return finiteNumber(value) && Math.floor(value) === value && hasOwn(MATCH_LIMITS, String(value));
    }

    function validMatchMode(value) {
        return typeof value === "string" && hasOwn(MATCH_MODES, value);
    }
    function validComparisonMode(value) {
        return typeof value === "string" && hasOwn(COMPARISON_MODES, value);
    }

    function validateIdentityFields(payload, request) {
        if (!payload || typeof payload !== "object") {
            return "invalid";
        }
        if (payload.request !== request.nonce) {
            return "stale";
        }
        if (!payloadAccountMatches(payload.account, request.account) || payload.matches !== request.matches || payload.mode !== request.mode) {
            return "invalid";
        }
        return "ok";
    }

    function validateSuccessPayload(payload, request) {
        var identityResult;
        var groupIndex;
        var metricIndex;
        var group;
        var metric;
        var value;
        var percentile;
        identityResult = validateIdentityFields(payload, request);
        if (identityResult !== "ok") {
            return identityResult;
        }
        if (!exactKeys(payload, ["v", "kind", "request", "account", "matches", "mode", "sample", "generated", "groups"])) {
            return "invalid";
        }
        if (payload.v !== 3 || payload.kind !== "profile_stats" || typeof payload.account !== "number" || !viewedProfileIdentityPolicy.payloadMatches(payload.account, String(payload.account)) || typeof payload.request !== "string") {
            return "invalid";
        }
        if (!validMatchLimit(payload.matches) || !validMatchMode(payload.mode) || !finiteNumber(payload.sample) || Math.floor(payload.sample) !== payload.sample || payload.sample < 0 || payload.sample > request.matches) {
            return "invalid";
        }
        if (typeof payload.generated !== "string" || payload.generated.length === 0 || payload.generated.length > MAX_GENERATED_LENGTH || !isAscii(payload.generated)) {
            return "invalid";
        }
        if (!isArray(payload.groups) || payload.groups.length !== GROUPS.length) {
            return "invalid";
        }
        for (groupIndex = 0; groupIndex < GROUPS.length; groupIndex += 1) {
            group = payload.groups[groupIndex];
            if (!exactKeys(group, ["id", "metrics"]) || group.id !== GROUPS[groupIndex].id || !isArray(group.metrics) || group.metrics.length !== GROUPS[groupIndex].metrics.length) {
                return "invalid";
            }
            for (metricIndex = 0; metricIndex < GROUPS[groupIndex].metrics.length; metricIndex += 1) {
                metric = group.metrics[metricIndex];
                if (!exactKeys(metric, ["id", "player", "community", "percentile"]) || metric.id !== expectedMetric(groupIndex, metricIndex)) {
                    return "invalid";
                }
                value = metric.player;
                if (value !== null && !finiteNumber(value)) {
                    return "invalid";
                }
                value = metric.community;
                if (value !== null && !finiteNumber(value)) {
                    return "invalid";
                }
                percentile = metric.percentile;
                if (percentile !== null && (!finiteNumber(percentile) || percentile < 0 || percentile > 100)) {
                    return "invalid";
                }
            }
        }
        return "ok";
    }

    function validateErrorPayload(payload, request) {
        var identityResult;
        var status;
        var retryAfter;
        identityResult = validateIdentityFields(payload, request);
        if (identityResult !== "ok") {
            return identityResult;
        }
        if (!exactKeys(payload, ["v", "kind", "request", "account", "matches", "mode", "code"], ["status", "retry_after", "message"])) {
            return "invalid";
        }
        if (payload.v !== 3 || payload.kind !== "error" || typeof payload.account !== "number" || !viewedProfileIdentityPolicy.payloadMatches(payload.account, String(payload.account)) || typeof payload.request !== "string" || !validMatchLimit(payload.matches) || !validMatchMode(payload.mode) || !ERROR_CODES[payload.code]) {
            return "invalid";
        }
        if (hasOwn(payload, "status")) {
            status = payload.status;
            if (!finiteNumber(status) || Math.floor(status) !== status || status < 100 || status > 599) {
                return "invalid";
            }
        }
        if (hasOwn(payload, "retry_after")) {
            retryAfter = payload.retry_after;
            if (!finiteNumber(retryAfter) || retryAfter < 0 || retryAfter > 86400) {
                return "invalid";
            }
        }
        if (hasOwn(payload, "message") && !isPlainMessage(payload.message)) {
            return "invalid";
        }
        return "ok";
    }

    function parseTitle(title) {
        var body;
        if (typeof title !== "string" || title.length > BRIDGE_TITLE_MAX_LENGTH || !isAscii(title)) {
            return { kind: "invalid_title" };
        }
        if (title.indexOf(BRIDGE_TITLE_PREFIX) !== 0) {
            return null;
        }
        if (title.length === BRIDGE_TITLE_PREFIX.length) {
            return { kind: "invalid_title" };
        }
        body = title.substring(BRIDGE_TITLE_PREFIX.length);
        try {
            return { kind: "payload", value: JSON.parse(body) };
        } catch (error) {
            return { kind: "invalid_title" };
        }
    }



    function createNonce() {
        nonceSerial += 1;
        return "p" + new Date().getTime().toString(36) + nonceSerial.toString(36);
    }

    function now() {
        return new Date().getTime();
    }

    function freshCache(account, matches, mode) {
        var age;
        if (!memoryCache || memoryCache.account !== account || memoryCache.matches !== matches || memoryCache.mode !== mode) {
            return null;
        }
        age = now() - memoryCache.receivedAt;
        if (age < 0 || age >= CACHE_TTL_MS || generatedIsStale(memoryCache.payload.generated)) {
            memoryCache = null;
            return null;
        }
        return memoryCache.payload;
    }

    function formatValue(value) {
        if (value === null || value === undefined) {
            return "—";
        }
        if (!finiteNumber(value)) {
            return "—";
        }
        return String(value);
    }

    function formatPercentile(value) {
        var displayed;
        if (value === null || value === undefined || !finiteNumber(value)) {
            return "—";
        }
        displayed = value >= 50 ? 100 - value : value;
        return (value >= 50 ? "TOP " : "BOTTOM ") + String(Math.max(1, Math.round(displayed))) + "%";
    }

    function setPercentileState(panel, value) {
        var available = value !== null && value !== undefined && finiteNumber(value);
        setClass(panel, PERCENTILE_TOP_CLASS, available && value >= 50);
        setClass(panel, PERCENTILE_BOTTOM_CLASS, available && value < 50);
        setClass(panel, PERCENTILE_UNAVAILABLE_CLASS, !available);
    }

    function setValueState(panel, value) {
        setClass(panel, VALUE_UNAVAILABLE_CLASS, value === null || value === undefined || !finiteNumber(value));
    }
    function applyComparisonMode() {
        var showCommunity = selectedComparison === "community";
        var metricId;
        var refs;
        for (metricId in METRIC_PANELS) {
            if (!hasOwn(METRIC_PANELS, metricId)) {
                continue;
            }
            refs = resolveMetricRefs(metricId);
            if (!refs) {
                continue;
            }
            setVisibility(refs.community, showCommunity);
            setVisibility(refs.percentile, !showCommunity);
        }
        setVisibility(communityHeadingLeft, showCommunity);
        setVisibility(percentileHeadingLeft, !showCommunity);
        setVisibility(communityHeadingRight, showCommunity);
        setVisibility(percentileHeadingRight, !showCommunity);
        setClass(displayCommunityTab, "selected", showCommunity);
        setClass(displayPercentileTab, "selected", !showCommunity);
    }

    function selectComparisonMode(mode) {
        if (!validComparisonMode(mode) || mode === selectedComparison) {
            return;
        }
        selectedComparison = mode;
        applyComparisonMode();
    }

    function averagePercentile(metrics) {
        var total = 0;
        var count = 0;
        var index;
        var value;
        for (index = 0; index < metrics.length; index += 1) {
            value = metrics[index].percentile;
            if (value === null || value === undefined || !finiteNumber(value)) {
                continue;
            }
            total += value;
            count += 1;
        }
        return count > 0 ? total / count : null;
    }

    function resolveMetricRefs(metricId) {
        var refs = metricRefs[metricId];
        var pair = METRIC_PANELS[metricId];
        if (refs && isValidPanel(refs.player) && isValidPanel(refs.community) && isValidPanel(refs.percentile)) {
            return refs;
        }
        if (!pair) {
            return null;
        }
        refs = {
            player: findPanel(pair[0]),
            community: findPanel(pair[1]),
            percentile: findPanel(pair[2])
        };
        metricRefs[metricId] = refs;
        return refs;
    }

    function renderMetricGroups(groups) {
        var groupIndex;
        var metricIndex;
        var group;
        var metric;
        var refs;
        var groupBadge;
        var groupPercentile;
        for (groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
            group = groups[groupIndex];
            groupPercentile = averagePercentile(group.metrics);
            groupBadge = findPanel(GROUP_PERCENTILE_PANELS[group.id]);
            if (isValidPanel(groupBadge)) {
                setText(groupBadge, formatPercentile(groupPercentile));
                setPercentileState(groupBadge, groupPercentile);
            }
            for (metricIndex = 0; metricIndex < group.metrics.length; metricIndex += 1) {
                metric = group.metrics[metricIndex];
                refs = resolveMetricRefs(metric.id);
                if (!refs) {
                    continue;
                }
                if (isValidPanel(refs.player)) {
                    setText(refs.player, formatValue(metric.player));
                    setValueState(refs.player, metric.player);
                }
                if (isValidPanel(refs.community)) {
                    setText(refs.community, formatValue(metric.community));
                    setValueState(refs.community, metric.community);
                }
                if (isValidPanel(refs.percentile)) {
                    setText(refs.percentile, formatPercentile(metric.percentile));
                    setPercentileState(refs.percentile, metric.percentile);
                }
            }
        }
        applyComparisonMode();
    }


    function setRetryVisible(visible) {
        if (isValidPanel(retryButton)) {
            setVisibility(retryButton, visible);
        }
    }

    function setMetricsVisible(visible) {
        setVisibility(metricsPanel, visible);
        setVisibility(metadataPanel, visible);
    }

    function renderLoading() {
        var modeText = selectedMode === "ranked" ? "Ranked" : "Standard";
        setText(statusLabel, "Loading " + modeText + " comparison for up to " + String(selectedMatches) + " matches...");
        setMetricsVisible(false);
        setRetryVisible(false);
    }

    function renderIdentityError(identity) {
        setMetricsVisible(false);
        setRetryVisible(true);
        setText(statusLabel, identity && identity.message ? identity.message : "The viewed profile account is unavailable.");
    }
    function renderLocalError(code, status, retryVisible, retryAfter) {
        var message = ERROR_TEXT[code] || ERROR_TEXT.invalid_payload;
        if (status) {
            message += " (HTTP " + String(status) + ").";
        }
        if (finiteNumber(retryAfter) && retryAfter > 0) {
            message += " Retry after " + String(Math.ceil(retryAfter)) + " seconds.";
        }
        setMetricsVisible(false);
        setRetryVisible(retryVisible !== false);
        setText(statusLabel, message);
    }
    function generatedIsStale(value) {
        var timestamp;
        try {
            timestamp = Date.parse(value);
        } catch (error) {
            return false;
        }
        return finiteNumber(timestamp) && now() - timestamp >= CACHE_TTL_MS;
    }


    function renderSuccess(payload) {
        var modeText = payload.mode === "ranked" ? "Ranked" : "Standard";
        var sampleText = modeText + " sample: " + String(payload.sample) + " / " + String(payload.matches);
        var stale = generatedIsStale(payload.generated);
        var generatedText = "Generated: " + String(payload.generated) + (stale ? " (stale)" : "");
        renderMetricGroups(payload.groups);
        setText(sampleLabel, sampleText);
        setText(generatedLabel, generatedText);
        setMetricsVisible(true);
        setRetryVisible(stale);
        setText(statusLabel, stale ? "Showing cached comparison data. Retry for current values." : modeText + " comparison loaded.");
    }


    function setBridgeVisible(visible) {
        setVisibleProperty(bridgePanel, visible);
        if (!visible) {
            setStyle(bridgePanel, "visibility", "collapse");
        } else {
            setStyle(bridgePanel, "visibility", "visible");
        }
    }

    function unloadBridge() {
        if (!isValidPanel(bridgePanel)) {
            return;
        }
        try {
            if (isCallable(bridgePanel.SetURL)) {
                bridgePanel.SetURL("about:blank");
            }
        } catch (error) {
            /* A racing HTML panel is already on the unload path. */
        }
        setBridgeVisible(false);
    }

    function openSupporterTicker() {
        if (!isCustomActive() || !isValidPanel(supporterTicker) || !isCallable(supporterTicker.SetURL)) {
            return;
        }
        try {
            supporterTicker.SetURL(SUPPORTER_TICKER_URL);
        } catch (error) {
            return;
        }
        setVisibleProperty(supporterTicker, true);
        setVisibility(supporterTicker, true);
    }

    function closeSupporterTicker() {
        if (!isValidPanel(supporterTicker)) {
            return;
        }
        try {
            if (isCallable(supporterTicker.SetURL)) {
                supporterTicker.SetURL("about:blank");
            }
        } catch (error) {
            setVisibleProperty(supporterTicker, false);
            setVisibility(supporterTicker, false);
            return;
        }
        setVisibleProperty(supporterTicker, false);
        setVisibility(supporterTicker, false);
    }

    function cancelBridgeAssignment() {
        var handle = bridgeAssignmentHandle;
        bridgeAssignmentHandle = null;
        if (handle !== null && handle !== undefined && isCallable($.CancelScheduled)) {
            try {
                $.CancelScheduled(handle);
            } catch (error) {
                return;
            }
        }
    }

    function invalidateRequest(unload) {
        cancelBridgeAssignment();
        requestState = null;
        requestGeneration += 1;
        if (unload !== false) {
            unloadBridge();
        }
    }

    function renderBridgeError(payload) {
        var status = hasOwn(payload, "status") ? payload.status : null;
        var retryAfter = hasOwn(payload, "retry_after") ? payload.retry_after : 0;

        enterState(STATE_ERROR);
        rateLimitBlocked = payload.code === "rate_limit" && retryAfter > 0;
        if (rateLimitBlocked) {
            rateLimitUntil = Math.max(rateLimitUntil, now() + (retryAfter * 1000));
        }
        renderLocalError(payload.code, status, !rateLimitBlocked, rateLimitBlocked ? retryAfter : 0);
    }

    function finishError(code, status) {

        invalidateRequest(true);
        rateLimitBlocked = false;
        enterState(STATE_ERROR);
        renderLocalError(code, status, true, 0);
    }

    function finishSuccess(payload, request) {

        if (generatedIsStale(payload.generated)) {
            memoryCache = null;
        } else {
            memoryCache = {
                account: request.account,
                matches: request.matches,
                mode: request.mode,
                receivedAt: now(),
                payload: payload
            };
        }
        invalidateRequest(true);
        rateLimitBlocked = false;
        enterState(STATE_READY);
        renderSuccess(payload);
    }

    function bridgeUrl(request) {
        return BRIDGE_URL + "?account_id=" + encodeURIComponent(request.account) + "&matches=" + String(request.matches) + "&mode=" + encodeURIComponent(request.mode) + "&request=" + encodeURIComponent(request.nonce) + "&protocol=3";
    }

    function expectedBridgeUrl(url, request) {
        var boundary;
        if (typeof url !== "string" || !request) {
            return false;
        }
        if (url.indexOf(BRIDGE_ORIGIN_PATH) !== 0) {
            return false;
        }
        boundary = url.charAt(BRIDGE_ORIGIN_PATH.length);
        return boundary === "" || boundary === "?" || boundary === "#";
    }

    function bridgeFragment(url) {
        var hashIndex;
        var fragment;
        if (typeof url !== "string" || url.length > BRIDGE_URL_MAX_LENGTH) {
            return null;
        }
        hashIndex = url.indexOf("#");
        if (hashIndex < 0) {
            return "";
        }
        fragment = url.substring(hashIndex + 1);
        if (fragment.length === 0 || fragment.length > BRIDGE_FRAGMENT_MAX_LENGTH || fragment.indexOf("#") !== -1) {
            return null;
        }
        return fragment;
    }

    function eventString(value) {
        if (typeof value === "string") {
            return value;
        }
        if (value && typeof value.url === "string") {
            return value.url;
        }
        if (value && typeof value.title === "string") {
            return value.title;
        }
        return "";
    }

    function onBridgeUrlChanged(panelOrValue, eventValue) {
        var url = eventString(arguments.length > 1 ? eventValue : panelOrValue);
        var expected;
        var fragment;
        var decodedTitle;
        if (lifecycleState !== STATE_LOADING || !requestState || requestState.generation !== requestGeneration) {
            return;
        }
        if (url === "about:blank") {

            return;
        }
        expected = expectedBridgeUrl(url, requestState);

        if (!expected) {
            finishError("network_error", null);
            return;
        }
        fragment = bridgeFragment(url);
        if (fragment === "") {
            return;
        }
        if (fragment === null) {

            return;
        }
        try {
            decodedTitle = decodeURIComponent(fragment);
        } catch (error) {

            return;
        }
        if (typeof decodedTitle !== "string" || decodedTitle.length > BRIDGE_TITLE_MAX_LENGTH) {

            return;
        }
        if (decodedTitle.indexOf(BRIDGE_TITLE_PREFIX) !== 0) {

            return;
        }

        onBridgeTitle(decodedTitle);
    }


    function onBridgeTitle(panelOrValue, eventValue) {
        var parsed;
        var successResult;
        var errorResult;
        var request;
        var value = arguments.length > 1 ? eventValue : panelOrValue;
        if (lifecycleState !== STATE_LOADING || !requestState || requestState.generation !== requestGeneration) {
            return;
        }
        request = requestState;
        if (typeof value !== "string") {

            return;
        }

        if (request.lastTitle === value) {

            return;
        }
        request.lastTitle = value;
        parsed = parseTitle(value);
        if (!parsed) {

            return;
        }
        if (parsed.kind === "invalid_title") {

            finishError("invalid_payload", null);
            return;
        }
        if (!parsed.value || typeof parsed.value !== "object") {

            finishError("invalid_payload", null);
            return;
        }
        if (parsed.value.kind === "profile_stats") {
            successResult = validateSuccessPayload(parsed.value, request);
            if (successResult === "stale") {

                return;
            }
            if (successResult !== "ok") {

                finishError("invalid_payload", null);
                return;
            }
            if (parsed.value.sample === 0) {

                finishError("empty_sample", null);
                return;
            }
            finishSuccess(parsed.value, request);
            return;
        }
        if (parsed.value.kind === "error") {
            errorResult = validateErrorPayload(parsed.value, request);
            if (errorResult === "stale") {

                return;
            }
            if (errorResult !== "ok") {

                finishError("invalid_payload", null);
                return;
            }
            renderBridgeError(parsed.value);
            invalidateRequest(true);
            return;
        }

        finishError("invalid_payload", null);
    }

    function registerBridgeEvents() {
        registerPanelEvent(bridgePanel, "HTMLTitle", onBridgeTitle);
        registerPanelEvent(bridgePanel, "HTMLURLChanged", onBridgeUrlChanged);
    }
    function assignBridgeUrl(request) {
        if (requestState !== request || request.generation !== requestGeneration || !isCustomActive()) {
            return;
        }
        if (!runtimePanelsValid()) {
            disableRuntime("panel_invalid");
            return;
        }
        try {
            if (isCallable(bridgePanel.SetIgnoreCursor)) {
                bridgePanel.SetIgnoreCursor(true);
            }
            if (!isCallable(bridgePanel.SetURL)) {
                throw new Error("SetURL unavailable");
            }
            bridgePanel.SetURL(bridgeUrl(request));
        } catch (error) {
            finishError("network_error", null);
        }
    }

    function scheduleBridgeAssignment(request) {
        var generation = request.generation;
        cancelBridgeAssignment();
        try {
            bridgeAssignmentHandle = $.Schedule(BRIDGE_ASSIGN_DELAY_SECONDS, function () {
                if (requestState !== request || generation !== requestGeneration) {
                    return;
                }
                bridgeAssignmentHandle = null;
                inspectNativeHeroSignature();
                if (!isCustomActive()) {
                    return;
                }
                inspectStockSelection();
                if (!isCustomActive()) {
                    return;
                }
                assignBridgeUrl(request);
            });
        } catch (error) {
            bridgeAssignmentHandle = null;
            finishError("network_error", null);
        }
    }


    function beginRequest(deferBridgeAssignment) {
        var identity = readIdentity();
        var request;
        var cached;
        var remaining;
        if (!isCustomActive()) {
            return;
        }
        currentIdentity = identity;

        if (identity.state !== "valid") {
            invalidateRequest(true);
            rateLimitBlocked = false;
            enterState(STATE_ERROR);
            renderIdentityError(identity);
            return;
        }
        cached = freshCache(identity.account, selectedMatches, selectedMode);
        if (cached) {

            invalidateRequest(true);
            rateLimitBlocked = false;
            enterState(STATE_READY);
            renderSuccess(cached);
            return;
        }
        remaining = rateLimitUntil - now();
        if (remaining > 0) {
            invalidateRequest(true);
            rateLimitBlocked = true;
            enterState(STATE_ERROR);
            renderLocalError("rate_limit", 429, false, remaining / 1000);
            return;
        }
        rateLimitUntil = 0;
        rateLimitBlocked = false;
        invalidateRequest(true);
        request = {
            generation: requestGeneration,
            nonce: createNonce(),
            account: identity.account,
            matches: selectedMatches,
            mode: selectedMode,
            startedAt: now(),
            lastTitle: ""
        };
        requestState = request;
        enterState(STATE_LOADING);

        renderLoading();
        setBridgeVisible(true);
        if (deferBridgeAssignment) {
            scheduleBridgeAssignment(request);
        } else {
            assignBridgeUrl(request);
        }
    }

    function hasSelectionEvidence(panel) {
        try {
            if (isCallable(panel.BHasKeyFocus) && panel.BHasKeyFocus()) {
                return true;
            }
        } catch (error) {
            /* Try descendant focus and native selection signals. */
        }
        try {
            if (isCallable(panel.BHasDescendantKeyFocus) && panel.BHasDescendantKeyFocus()) {
                return true;
            }
        } catch (error2) {
            /* Try native selection signals. */
        }
        try {
            if (isCallable(panel.IsSelected) && panel.IsSelected()) {
                return true;
            }
        } catch (error3) {
            /* Try the direct class signal. */
        }
        try {
            if (isCallable(panel.BHasClass) && (panel.BHasClass("selected") || panel.BHasClass("Selected"))) {
                return true;
            }
        } catch (error4) {
            /* A replaced row has no usable selection signal. */
        }
        return false;
    }
    function readSelectedHeroSignature() {
        var childCount;
        var index;
        var row;
        var isHeroRow;
        var rowId;
        if (!isValidPanel(heroList)) {
            return "";
        }
        try {
            childCount = Math.min(heroList.GetChildCount(), MAX_HERO_ROWS);
        } catch (error) {
            return "";
        }
        for (index = 0; index < childCount; index += 1) {
            try {
                row = heroList.GetChild(index);
            } catch (error2) {
                return "";
            }
            if (!isValidPanel(row)) {
                continue;
            }
            isHeroRow = false;
            try {
                isHeroRow = isCallable(row.BHasClass) && row.BHasClass("heroRow");
            } catch (error3) {
                isHeroRow = false;
            }
            if (isHeroRow && hasSelectionEvidence(row)) {
                rowId = "";
                try {
                    if (row.id !== undefined && row.id !== null) {
                        rowId = String(row.id);
                    }
                } catch (error4) {
                    rowId = "";
                }
                return String(index) + ":" + rowId;
            }
        }
        return "";
    }


    function inspectStockSelection() {
        var signature;
        if (!isCustomActive()) {
            return;
        }
        signature = readSelectedHeroSignature();
        if (signature !== stockRowSignature) {

            restoreStock("stock_selection");
        }
    }

    function inspectNativeHeroSignature() {
        var signature;
        if (!isValidPanel(stockSectionName)) {
            stockSectionName = findDirectChildByClass(stockTitle, "statSectionName");
        }
        if (!isValidPanel(stockSectionName)) {
            return;
        }
        signature = textOf(stockSectionName);
        if (signature !== stockSectionSignature) {

            restoreStock("native_selection");
        }
    }

    function checkIdentity() {
        var nextIdentity = readIdentity();
        if (sameIdentity(currentIdentity, nextIdentity)) {
            return;
        }

        currentIdentity = nextIdentity;
        if (isCustomActive()) {
            restoreStock("profile_change");
        }
    }

    function runtimePanelsValid() {
        return isValidPanel(root) &&
            isValidPanel(heroList) &&
            isValidPanel(stockTitle) &&
            isValidPanel(customPanel) &&
            isValidPanel(selfNamePanel) &&
            isValidPanel(titleLabel) &&
            isValidPanel(statLockerButton) &&
            isValidPanel(playerHeadingLeft) &&
            isValidPanel(playerHeadingRight) &&
            isValidPanel(bridgePanel) &&
            isValidPanel(supporterTicker) &&
            isValidPanel(displayCommunityTab) &&
            isValidPanel(displayPercentileTab);
    }

    function stopWatcher() {
        var handle = watcherHandle;
        watcherGeneration += 1;
        watcherHandle = null;
        watcherPending = false;
        watcherCallback = null;
        if (handle !== null && handle !== undefined && isCallable($.CancelScheduled)) {
            try {
                $.CancelScheduled(handle);
            } catch (error) {
                return;
            }
        }
    }

    function disableRuntime(reason) {

        enterState(STATE_DISABLED);
        stopWatcher();
        invalidateRequest(true);
        closeSupporterTicker();
        setVisibility(customPanel, false);
        setRetryVisible(false);
    }

    function updateRateLimit() {
        if (!rateLimitBlocked || now() < rateLimitUntil) {
            return;
        }
        rateLimitBlocked = false;
        rateLimitUntil = 0;
        if (lifecycleState === STATE_ERROR) {
            setRetryVisible(true);
            setText(statusLabel, "The community service is ready for another request.");
        }
    }

    function scheduledCheck() {
        var elapsed;
        if (!isCustomActive()) {
            return;
        }
        if (!runtimePanelsValid()) {
            disableRuntime("panel_invalid");
            return;
        }
        checkIdentity();
        if (!isCustomActive()) {
            return;
        }
        renderViewedName();
        inspectNativeHeroSignature();
        if (!isCustomActive()) {
            return;
        }
        inspectStockSelection();
        if (!isCustomActive()) {
            return;
        }
        updateRateLimit();
        if (requestState && requestState.generation === requestGeneration) {
            elapsed = (now() - requestState.startedAt) / 1000;
            if (elapsed >= REQUEST_TIMEOUT_SECONDS) {

                finishError("network_error", null);
            }
        }
    }

    function startWatcher() {
        var token;
        function armWatcher() {
            if (token !== watcherGeneration || !isCustomActive() || watcherPending) {
                return;
            }
            watcherPending = true;
            try {
                watcherHandle = $.Schedule(CONTEXT_CHECK_SECONDS, watcherCallback);
            } catch (error) {
                watcherPending = false;
                watcherHandle = null;
                watcherCallback = null;
                disableRuntime("schedule_failed");
            }
        }
        if (!isCustomActive() || watcherPending || watcherCallback) {
            return;
        }
        watcherGeneration += 1;
        token = watcherGeneration;
        watcherCallback = function () {
            if (token !== watcherGeneration) {
                return;
            }
            watcherPending = false;
            watcherHandle = null;
            if (!isCustomActive()) {
                return;
            }
            scheduledCheck();
            armWatcher();
        };
        armWatcher();
    }

    function restoreStock(reason) {

        if (lifecycleState === STATE_DISABLED) {
            return;
        }
        enterState(STATE_STOCK);
        stockRowSignature = "";
        stopWatcher();
        invalidateRequest(true);
        closeSupporterTicker();
        setVisibility(customPanel, false);
        setRetryVisible(false);
        if (reason === "profile_change" || reason === "stock_selection" || reason === "page_leave" || reason === "native_selection") {
            setText(statusLabel, "");
        }
    }

    function showCustomMode() {
        if (lifecycleState === STATE_DISABLED || isCustomActive()) {
            return;
        }
        currentIdentity = readIdentity();


        enterState(STATE_LOADING);
        stockSectionSignature = textOf(stockSectionName);
        stockRowSignature = readSelectedHeroSignature();
        setVisibility(customPanel, true);
        openSupporterTicker();
        currentDisplayName = "";
        renderViewedName();
        beginRequest();
        startWatcher();
    }

    function readMatchLimitSelection() {
        var option;
        var value = "";
        if (!isValidPanel(matchCountDropdown) || !isCallable(matchCountDropdown.GetSelected)) {
            return selectedMatches;
        }
        try {
            option = matchCountDropdown.GetSelected();
        } catch (error) {
            return selectedMatches;
        }
        if (!isValidPanel(option)) {
            return selectedMatches;
        }
        if (option.id === "ProfileStatsCommunityMatchCount50") {
            return 50;
        }
        if (option.id === "ProfileStatsCommunityMatchCount100") {
            return 100;
        }
        if (option.id === "ProfileStatsCommunityMatchCount150") {
            return 150;
        }
        try {
            if (isCallable(option.GetAttributeString)) {
                value = option.GetAttributeString("value", "");
            }
        } catch (error2) {
            value = "";
        }
        return hasOwn(MATCH_LIMITS, value) ? Number(value) : selectedMatches;
    }

    function onMatchCountChanged() {
        var nextMatches = readMatchLimitSelection();
        if (nextMatches === selectedMatches) {
            return;
        }
        selectedMatches = nextMatches;
        beginRequest(true);
    }

    function selectMatchMode(mode) {
        if (!validMatchMode(mode) || mode === selectedMode) {
            return;
        }
        selectedMode = mode;
        beginRequest(true);
    }

    function onRankedSelected() {
        selectMatchMode("ranked");
    }

    function onStandardSelected() {
        selectMatchMode("standard");
    }
    function onDisplayCommunitySelected() {
        selectComparisonMode("community");
    }

    function onDisplayPercentileSelected() {
        selectComparisonMode("percentile");
    }

    function onRetry() {
        if (!isCustomActive() || rateLimitBlocked) {
            return;
        }
        beginRequest();
    }


    function collectMetricRefs() {
        var metricId;
        var pair;
        for (metricId in METRIC_PANELS) {
            if (hasOwn(METRIC_PANELS, metricId)) {
                pair = METRIC_PANELS[metricId];
                metricRefs[metricId] = {
                    player: findPanel(pair[0]),
                    community: findPanel(pair[1]),
                    percentile: findPanel(pair[2])
                };
            }
        }
    }

    function collectPanels() {
        root = $.GetContextPanel();
        if (!isValidPanel(root)) {
            return false;
        }
        heroList = findPanel("HeroList");
        statsBlock = findPanel("StatsBlock");
        stockTitle = findPanel("StatsTitle");
        stockLeft = findPanel("StatsLeft");
        stockRight = findPanel("StatsRight");
        stockSectionName = findDirectChildByClass(stockTitle, "statSectionName");
        communityButton = findPanel("ProfileStatsCommunityButton");
        customPanel = findPanel("ProfileStatsCommunityPanel");
        selfNamePanel = findPanel("SelfName");
        titleLabel = findPanel("ProfileStatsCommunityTitle");
        statLockerButton = findPanel("ProfileStatsCommunityStatLocker");
        playerHeadingLeft = findPanel("ProfileStatsCommunityPlayerHeadingLeft");
        playerHeadingRight = findPanel("ProfileStatsCommunityPlayerHeadingRight");
        accountWitness = findPanel("ProfileStatsCommunityAccount");
        matchCountDropdown = findPanel("ProfileStatsCommunityMatchCount");
        rankedTab = findPanel("ProfileStatsCommunityRanked");
        standardTab = findPanel("ProfileStatsCommunityStandard");
        displayCommunityTab = findPanel("ProfileStatsCommunityDisplayCommunity");
        displayPercentileTab = findPanel("ProfileStatsCommunityDisplayPercentile");
        communityHeadingLeft = findPanel("ProfileStatsCommunityCommunityHeadingLeft");
        percentileHeadingLeft = findPanel("ProfileStatsCommunityPercentileHeadingLeft");
        communityHeadingRight = findPanel("ProfileStatsCommunityCommunityHeadingRight");
        percentileHeadingRight = findPanel("ProfileStatsCommunityPercentileHeadingRight");
        statusLabel = findPanel("ProfileStatsCommunityStatus");
        metricsPanel = findPanel("ProfileStatsCommunityMetrics");
        metadataPanel = findPanel("ProfileStatsCommunityMetadata");
        sampleLabel = findPanel("ProfileStatsCommunitySample");
        generatedLabel = findPanel("ProfileStatsCommunityGenerated");
        retryButton = findPanel("ProfileStatsCommunityRetry");
        bridgePanel = findPanel("ProfileStatsCommunityBridge");
        supporterTicker = findPanel("ProfileStatsCommunitySupporterTicker");
        stockSectionSignature = textOf(stockSectionName);

        collectMetricRefs();
        return !!(heroList && statsBlock && stockTitle && stockLeft && stockRight && communityButton && customPanel && selfNamePanel && titleLabel && statLockerButton && playerHeadingLeft && playerHeadingRight && bridgePanel && supporterTicker && matchCountDropdown && rankedTab && standardTab && displayCommunityTab && displayPercentileTab);
    }

    function bindEvents() {
        setPanelEvent(communityButton, "onactivate", showCustomMode);
        setPanelEvent(statLockerButton, "onactivate", openStatLockerProfile);
        setPanelEvent(matchCountDropdown, "oninputsubmit", onMatchCountChanged);
        setPanelEvent(rankedTab, "onactivate", onRankedSelected);
        setPanelEvent(displayCommunityTab, "onactivate", onDisplayCommunitySelected);
        setPanelEvent(displayPercentileTab, "onactivate", onDisplayPercentileSelected);
        setPanelEvent(standardTab, "onactivate", onStandardSelected);
        setPanelEvent(retryButton, "onactivate", onRetry);
        registerBridgeEvents();
    }

    function boot() {
        if (initialized) {
            return;
        }
        if (!collectPanels()) {
            return;
        }
        initialized = true;
        currentIdentity = readIdentity();
        selectedComparison = "percentile";
        applyComparisonMode();

        renderViewedName();
        unloadBridge();
        closeSupporterTicker();
        setVisibility(customPanel, false);
        bindEvents();
    }

    try {
        $.Schedule(0.01, boot);
    } catch (error) {
        boot();
    }
}());
    }
    if (root && (root.paneltype === "CitadelProfileCard" || root.paneltype === "CitadelProfilePage")) {
        var profileRecord = buildProfileRecord(root);
        if (profileRecord) {
            root.ShowRankBarebonesRefresh = function () {
                startProfileWatch(profileRecord, PROFILE_REFRESH_DELAYS);
            };
            root.ShowRankBarebonesOpenStatlocker = function () {
                return openStatlocker(profileRecord);
            };
            root.ShowRankBarebonesOpenPlayerProfile = function () {
                return openPlayerProfile(profileRecord);
            };
            root.ShowRankBarebonesCopyAccount = function () {
                return copyAccountId(profileRecord);
            };
            startProfileWatch(profileRecord, STARTUP_REFRESH_DELAYS, true);
        }
        if (root.paneltype === "CitadelProfilePage") {
            installProfileStatsCommunity();
        }
    } else if (isValid(root) && root.paneltype === "CitadelHudTopBarPlayer") {
        var topbarRecord = buildTopbarRecord(root);
        startTopbarWatch(topbarRecord);
    } else if (isValid(root) && root.paneltype === "CitadelHudEscapeMenu") {
        $.ShowRankBarebonesEscapeOpen = function () {
            startEscapePass(root);
        };
        $.ShowRankBarebonesEscapeOut = function () {
            schedule(0, function () {
                resetEscapePassAfterClose(root);
            });
        };
    }
}
());
