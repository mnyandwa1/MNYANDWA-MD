
"use strict";

const os = require("os");
const { gmd, commands } = require("../kevo");

const {
    buildThemedMenu,
    sendMenuMsg,
    getSortedCategories,
    CAT_ICONS,
    getMenuPicUrl,
} = require("./design");

const { sendButtons } = require("gifted-btns");

// ═══════════════════════════════════════════════
//              MNYANDWA-MD
//              GENERAL COMMANDS
// ═══════════════════════════════════════════════

const BOT_NAME = "MNYANDWA-MD";
const BOT_VERSION = "1.0.0";
const BOT_OWNER = "MNYANDWA";
const BOT_FOOTER = "POWERED BY MNYANDWA-MD";

if (!global._botStartTime) {
    global._botStartTime = Date.now();
}

function getUptime() {
    const total = Math.floor(
        (Date.now() - global._botStartTime) / 1000
    );

    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    return [
        days ? `${days}d` : null,
        hours ? `${hours}h` : null,
        minutes ? `${minutes}m` : null,
        `${seconds}s`,
    ].filter(Boolean).join(" ");
}

function getSystemInfo() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
        platform: os.platform(),
        architecture: os.arch(),
        cpus: os.cpus().length,
        totalRam: (totalMemory / 1024 ** 3).toFixed(2),
        usedRam: (usedMemory / 1024 ** 3).toFixed(2),
        freeRam: (freeMemory / 1024 ** 3).toFixed(2),
    };
}

// ─── MENU ─────────────────────────────────────

gmd({
    pattern: "menu",
    aliases: ["help", "cmds", "commands", "start"],
    react: "📋",
    category: "general",
    description: "Show MNYANDWA-MD command menu",
}, async (from, Guru, conText) => {
    const { react } = conText;

    try {
        await react("📋");

        const text = await buildThemedMenu(conText, Guru);

        await sendMenuMsg(Guru, from, text, conText);

        await react("✅");
    } catch (error) {
        console.error("MNYANDWA-MD Menu Error:", error);
        await react("❌");
    }
});

// ─── CATEGORY MENU ────────────────────────────

gmd({
    pattern: /^\d+$/,
    on: "body",
    dontAddCommandList: true,
    category: "general",
    description: "Browse command categories",
}, async (from, Guru, conText) => {
    const {
        body,
        mek,
        botPrefix,
        sender,
        botId,
    } = conText;

    const n = parseInt(body.trim(), 10);
    const cats = getSortedCategories();

    if (!Number.isInteger(n) || n < 1 || n > cats.length) {
        return;
    }

    const { cat, cmds } = cats[n - 1];
    const icon = CAT_ICONS[cat] || "⚡";
    const label = cat.charAt(0).toUpperCase() + cat.slice(1);
    const prefix = botPrefix || ".";

    const cmdList = cmds.map((c) => {
        const pattern = typeof c.pattern === "string"
            ? c.pattern
            : c.pattern instanceof RegExp
                ? c.pattern.source
                : "command";

        const desc = c.description ? ` — _${c.description}_` : "";
        const aliases = (c.aliases || []).length
            ? `\n> │   ↳ _${c.aliases.map(a => `${prefix}${a}`).join(", ")}_`
            : "";

        return `> │ ◈ *${prefix}${pattern}*${desc}${aliases}`;
    }).join("\n");

    const text = [
        `> ╭─⌈ ${icon} *${label.toUpperCase()}* ⌋`,
        `> │ _${cmds.length} commands available_`,
        "> │",
        cmdList,
        `> ╰⊷ ✨ _${BOT_FOOTER}_`,
    ].join("\n");

    try {
        const picUrl = await getMenuPicUrl(Guru, botId);

        if (picUrl) {
            await Guru.sendMessage(from, {
                image: { url: picUrl },
                caption: text,
                contextInfo: {
                    mentionedJid: sender ? [sender] : [],
                },
            }, { quoted: mek });
        } else {
            await Guru.sendMessage(from, {
                text,
                contextInfo: {
                    mentionedJid: sender ? [sender] : [],
                },
            }, { quoted: mek });
        }
    } catch (error) {
        console.error("Category Menu Error:", error);
        await Guru.sendMessage(from, { text }, { quoted: mek });
    }
});

// ─── PING ─────────────────────────────────────

gmd({
    pattern: "ping",
    aliases: ["p", "speed"],
    react: "⚡",
    category: "general",
    description: "Check bot response speed",
}, async (from, Guru, conText) => {
    const { react, mek, botPrefix } = conText;
    const start = Date.now();

    try {
        const speed = Date.now() - start;

        await sendButtons(Guru, from, {
            title: `⚡ ${BOT_NAME}`,
            text: `Pong! 🏓\n\nResponse: ${speed} ms\nStatus: Online 🟢`,
            footer: BOT_FOOTER,
            buttons: [
                {
                    id: `${botPrefix || "."}uptime`,
                    text: "⏱️ Uptime",
                },
                {
                    id: `${botPrefix || "."}botinfo`,
                    text: "🤖 Bot Info",
                },
            ],
        });

        await react("✅");
    } catch (error) {
        console.error("Ping Error:", error);
        await Guru.sendMessage(from, {
            text: `⚡ ${BOT_NAME}\nResponse: ${Date.now() - start} ms`,
        }, { quoted: mek });
    }
});

// ─── UPTIME ───────────────────────────────────

gmd({
    pattern: "uptime",
    aliases: ["runtime", "ut"],
    react: "⏱️",
    category: "general",
    description: "Check bot uptime",
}, async (from, Guru, conText) => {
    const { reply, react } = conText;

    try {
        await reply(
            `╭━━〔 ⏱️ ${BOT_NAME} 〕━━╮\n` +
            `┃ Online: ${getUptime()}\n` +
            `┃ Status: 🟢 Running\n` +
            `╰━━━━━━━━━━━━━━━━━━╯`
        );

        await react("✅");
    } catch (error) {
        console.error("Uptime Error:", error);
        await react("❌");
    }
});

// ─── BOT INFO ─────────────────────────────────

gmd({
    pattern: "botinfo",
    aliases: ["info", "about", "mybot"],
    react: "🤖",
    category: "general",
    description: "Show bot information",
}, async (from, Guru, conText) => {
    const { reply, botPrefix, botMode } = conText;

    const totalCmds = commands.filter(c =>
        c.pattern && !c.dontAddCommandList
    ).length;

    await reply(
        `╭━━〔 🤖 ${BOT_NAME} 〕━━╮\n` +
        `┃ 📦 Version: ${BOT_VERSION}\n` +
        `┃ 📌 Prefix: ${botPrefix || "."}\n` +
        `┃ 🌐 Mode: ${(botMode || "public").toUpperCase()}\n` +
        `┃ 📚 Commands: ${totalCmds}\n` +
        `┃ ⏱️ Uptime: ${getUptime()}\n` +
        `┃ 👑 Owner: ${BOT_OWNER}\n` +
        `┃ 📖 Library: Baileys\n` +
        `╰━━━━━━━━━━━━━━━━━━╯`
    );
});

// ─── OWNER ────────────────────────────────────

gmd({
    pattern: "owner",
    aliases: ["creator", "dev"],
    react: "👑",
    category: "general",
    description: "Show bot owner information",
}, async (from, Guru, conText) => {
    const { reply } = conText;

    await reply(
        `╭━━〔 👑 BOT OWNER 〕━━╮\n` +
        `┃ Bot: ${BOT_NAME}\n` +
        `┃ Owner: ${BOT_OWNER}\n` +
        `┃ Developer: MNYANDWA\n` +
        `╰━━━━━━━━━━━━━━━━━━╯`
    );
});

// ─── DATE & TIME ──────────────────────────────

gmd({
    pattern: "date",
    aliases: ["time", "today"],
    react: "📅",
    category: "general",
    description: "Show current date and time",
}, async (from, Guru, conText) => {
    const { reply } = conText;

    const now = new Date();

    const date = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Dar_es_Salaam",
        dateStyle: "full",
    }).format(now);

    const time = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Dar_es_Salaam",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(now);

    await reply(
        `╭━━〔 📅 ${BOT_NAME} 〕━━╮\n` +
        `┃ Date: ${date}\n` +
        `┃ Time: ${time} EAT\n` +
        `╰━━━━━━━━━━━━━━━━━━╯`
    );
});

// ─── SYSTEM INFO ──────────────────────────────

gmd({
    pattern: "system",
    aliases: ["server", "host"],
    react: "🛠️",
    category: "general",
    description: "Show server system information",
}, async (from, Guru, conText) => {
    const { reply } = conText;
    const s = getSystemInfo();

    await reply(
        `╭━━〔 🛠️ SYSTEM INFO 〕━━╮\n` +
        `┃ Platform: ${s.platform}\n` +
        `┃ Architecture: ${s.architecture}\n` +
        `┃ CPU Cores: ${s.cpus}\n` +
        `┃ Total RAM: ${s.totalRam} GB\n` +
        `┃ Used RAM: ${s.usedRam} GB\n` +
        `┃ Free RAM: ${s.freeRam} GB\n` +
        `╰━━━━━━━━━━━━━━━━━━╯`
    );
});

// ─── RAM ──────────────────────────────────────

gmd({
    pattern: "ram",
    aliases: ["memory"],
    react: "💾",
    category: "general",
    description: "Check server RAM usage",
}, async (from, Guru, conText) => {
    const { reply } = conText;
    const s = getSystemInfo();

    await reply(
        `💾 *${BOT_NAME} RAM STATUS*\n\n` +
        `Total: ${s.totalRam} GB\n` +
        `Used: ${s.usedRam} GB\n` +
        `Free: ${s.freeRam} GB`
    );
});

// ─── HELP ─────────────────────────────────────

gmd({
    pattern: "aboutbot",
    aliases: ["bothelp"],
    react: "ℹ️",
    category: "general",
    description: "About MNYANDWA-MD",
}, async (from, Guru, conText) => {
    const { reply } = conText;

    await reply(
        `🔥 Welcome to ${BOT_NAME}!\n\n` +
        `A WhatsApp assistant powered by Baileys.\n\n` +
        `Commands:\n` +
        `• .menu\n` +
        `• .ping\n` +
        `• .uptime\n` +
        `• .botinfo\n` +
        `• .owner\n` +
        `• .date\n` +
        `• .system\n` +
        `• .ram\n\n` +
        `${BOT_FOOTER}`
    );
});

module.exports = {};
