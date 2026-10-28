JavaScript

"use strict";

const { gmd, commands } = require("../kevo");
const {
    getSetting,
    setSetting
} = require("../kevo/database/settings");

const moment = require("moment-timezone");

const MENU_IMAGE_URL = "https://i.imgur.com/S0vFsHt.jpeg";

const CAT_ORDER = [
    "general", "ai", "downloader", "tools", "search",
    "games", "group", "owner", "settings", "fun",
    "converter", "religion", "texttools", "notes",
    "channels", "sports", "extras", "restrictions",
    "sticker", "media", "ultracore"
];

const CAT_ICONS = {
    general: "◈",
    ai: "✦",
    downloader: "⇩",
    tools: "⚙",
    search: "⌕",
    games: "♟",
    group: "♧",
    owner: "♛",
    settings: "⚙",
    fun: "☻",
    converter: "⇄",
    religion: "☪",
    texttools: "Aa",
    notes: "▤",
    channels: "◉",
    sports: "⚽",
    extras: "✧",
    restrictions: "⛨",
    sticker: "✿",
    media: "▶",
    ultracore: "⚡"
};

function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

function cleanNumber(sender) {
    return String(sender || "")
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
}

function getSortedCategories() {
    const map = {};

    for (const cmd of commands) {
        if (!cmd.pattern || cmd.dontAddCommandList) continue;
        if (typeof cmd.pattern !== "string") continue;

        const cat = String(cmd.category || "general").toLowerCase();
        if (!map[cat]) map[cat] = [];
        map[cat].push(cmd);
    }

    return Object.keys(map)
        .sort((a, b) => {
            const ai = CAT_ORDER.indexOf(a);
            const bi = CAT_ORDER.indexOf(b);

            if (ai === -1 && bi === -1) return a.localeCompare(b);
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        })
        .map(cat => ({ cat, cmds: map[cat] }));
}

async function buildMenuData(conText = {}) {
    const categories = getSortedCategories();
    const memory = process.memoryUsage();
    const timezone = process.env.TIME_ZONE || "Africa/Dar_es_Salaam";
    const hour = Number(moment().tz(timezone).format("HH"));

    let greeting = "GOOD NIGHT";
    if (hour < 12) greeting = "GOOD MORNING";
    else if (hour < 17) greeting = "GOOD AFTERNOON";
    else if (hour < 21) greeting = "GOOD EVENING";

    let expiryLine = "Lifetime";

    try {
        const expiryModule = require("../kevo/expiry");
        if (typeof expiryModule.getExpiryStatus === "function") {
            const status = await expiryModule.getExpiryStatus();
            expiryLine = status?.line || "Lifetime";
        }
    } catch {
        expiryLine = "Lifetime";
    }

    const categoryLines = categories.map(({ cat }, index) => {
        const icon = CAT_ICONS[cat] || "◇";
        return `│ ${String(index + 1).padStart(2, "0")} ${icon} ${cat.toUpperCase()}`;
    }).join("\n");

    return {
        pushName: conText.pushName || "User",
        sender: conText.sender || "",
        userNumber: cleanNumber(conText.sender) || "User",
        botName: conText.botName || "MNYANDWA-MD",
        botPrefix: conText.botPrefix || ".",
        botVersion: conText.botVersion || "5.0.0",
        botMode: conText.botMode || "public",
        botFooter: conText.botFooter || "POWERED BY MNYANDWA",
        totalCmds: commands.filter(c => c.pattern && !c.dontAddCommandList).length,
        uptime: formatUptime(process.uptime()),
        memDetail: `${(memory.heapUsed / 1048576).toFixed(1)} / ${(memory.heapTotal / 1048576).toFixed(1)} MB`,
        greeting,
        expiryLine,
        categoryLines,
        numCats: categories.length
    };
}

const THEMES = {
    premium: {
        name: "◆ PREMIUM",
        description: "Modern premium dashboard",
        render(data) {
            return `╭━━〔 ✦ ${data.botName.toUpperCase()} ✦ 〕━━╮
┃ ◉ STATUS   : ONLINE
┃ ◈ USER     : ${data.pushName}
┃ ◇ COMMANDS : ${data.totalCmds}
┃ ⌁ PREFIX   : ${data.botPrefix}
┃ ◎ MODE     : ${data.botMode.toUpperCase()}
┃ ◷ UPTIME   : ${data.uptime}
┃ ◇ VERSION  : ${data.botVersion}
┃ 🔒 LICENCE : ${data.expiryLine}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 ◈ COMMAND CENTER 〕━━╮
${data.categoryLines}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

${data.greeting}, ${data.pushName}!
Reply with a category number: 1-${data.numCats}

${data.botFooter}`;
        }
    },

    cyber: {
        name: "⌁ CYBER",
        description: "Futuristic terminal",
        render(data) {
            return `> SYSTEM :: ${data.botName.toUpperCase()}
> STATUS  :: ONLINE
> USER    :: ${data.pushName}
> COMMANDS:: ${data.totalCmds}
> PREFIX  :: ${data.botPrefix}
> MODE    :: ${data.botMode.toUpperCase()}
> UPTIME  :: ${data.uptime}
> RAM     :: ${data.memDetail}
> LICENCE :: ${data.expiryLine}

> MODULES
${data.categoryLines}

> SELECT MODULE: 1-${data.numCats}

${data.botFooter}`;
        }
    },

    matrix: {
        name: "▣ MATRIX",
        description: "Matrix terminal layout",
        render(data) {
            return `╔══════════════════════════════╗
║ ${data.botName.toUpperCase()}
╠══════════════════════════════╣
║ SYSTEM ONLINE
║ USER     : ${data.pushName}
║ COMMANDS : ${data.totalCmds}
║ PREFIX   : ${data.botPrefix}
║ VERSION  : ${data.botVersion}
║ UPTIME   : ${data.uptime}
╠══════════════════════════════╣
${data.categoryLines}
╠══════════════════════════════╣
║ REPLY 1-${data.numCats}
╚══════════════════════════════╝

${data.botFooter}`;
        }
    }
};

const THEME_KEYS = Object.keys(THEMES);

async function buildThemedMenu(conText) {
    let key = "premium";

    try {
        key = (await getSetting("MENU_THEME")) || "premium";
    } catch (error) {
        console.error("[MNYANDWA-MD] Menu setting error:", error.message);
    }

    const theme = THEMES[key] || THEMES.premium;
    const data = await buildMenuData(conText);
    return theme.render(data);
}

async function sendMenuMsg(Guru, from, text, conText = {}) {
    const quoted = conText.mek ? { quoted: conText.mek } : {};

    try {
        let picUrl = MENU_IMAGE_URL;

        try {
            picUrl = (await getSetting("MENU_PIC_CUSTOM")) || MENU_IMAGE_URL;
        } catch {}

        return await Guru.sendMessage(
            from,
            {
                image: { url: picUrl },
                caption: String(text).trim()
            },
            quoted
        );
    } catch (error) {
        console.error("[MNYANDWA-MD] Menu image send failed:", error.message);

        return Guru.sendMessage(
            from,
            { text: String(text).trim() },
            quoted
        );
    }
}

gmd({
    pattern: "setmenu",
    aliases: ["menutheme", "menudesign", "themenu"],
    category: "owner",
    description: "Change menu theme"
}, async (from, Guru, conText) => {
    const { reply, isSuperUser, args = [], react } = conText;

    if (!isSuperUser) return reply("❌ Owner Only Command!");

    if (!args[0]) {
        const current = (await getSetting("MENU_THEME")) || "premium";
        const list = THEME_KEYS.map((key, i) =>
            `${i + 1}. ${THEMES[key].name}${key === current ? " ✅ ACTIVE" : ""}\n   ${THEMES[key].description}`
        ).join("\n\n");

        return reply(`🎨 MNYANDWA-MD MENU THEMES\n\n${list}\n\nUsage: .setmenu <number>`);
    }

    const number = Number(args[0]);

    if (!Number.isInteger(number) || number < 1 || number > THEME_KEYS.length) {
        return reply(`❌ Choose a number from 1-${THEME_KEYS.length}.`);
    }

    const key = THEME_KEYS[number - 1];
    await setSetting("MENU_THEME", key);

    if (react) await react("✅");
    return reply(`✅ Theme changed to ${THEMES[key].name}\nSend .menu to view it.`);
});

gmd({
    pattern: "previewmenu",
    aliases: ["menupreview", "prevmenu"],
    category: "owner",
    description: "Preview a menu theme"
}, async (from, Guru, conText) => {
    const { reply, isSuperUser, args = [] } = conText;

    if (!isSuperUser) return reply("❌ Owner Only Command!");

    const number = Number(args[0]);

    if (!Number.isInteger(number) || number < 1 || number > THEME_KEYS.length) {
        return reply(`Usage: .previewmenu <number>\nAvailable: 1-${THEME_KEYS.length}`);
    }

    const key = THEME_KEYS[number - 1];
    const data = await buildMenuData(conText);
    return sendMenuMsg(Guru, from, `👁️ PREVIEW: ${THEMES[key].name}\n\n${THEMES[key].render(data)}`, conText);
});

module.exports = {
    buildThemedMenu,
    THEMES,
    THEME_KEYS,
    buildMenuData,
    sendMenuMsg,
    getSortedCategories,
    CAT_ICONS
};
