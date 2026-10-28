
"use strict";

const os = require("os");
const moment = require("moment-timezone");
const { performance } = require("perf_hooks");

const { gmd } = require("../kevo");

const BOT_NAME = "MNYANDWA-MD";
const DEFAULT_PREFIX = ".";
const DEFAULT_TIMEZONE = "Africa/Dar_es_Salaam";

// Preserve the original process start time across module reloads.
if (!global._botStartTime) {
    global._botStartTime = Date.now();
}

// Avoid displaying raw errors, credentials or session information.
function logError(label, error) {
    console.error(
        `[${BOT_NAME}] ${label}:`,
        error?.message || "Unknown error"
    );
}

function formatDuration(seconds) {
    const total = Math.max(0, Math.floor(seconds));

    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    return [
        days ? `${days}d` : null,
        hours ? `${hours}h` : null,
        minutes ? `${minutes}m` : null,
        `${secs}s`,
    ].filter(Boolean).join(" ");
}

function getUptime() {
    return formatDuration(
        (Date.now() - global._botStartTime) / 1000
    );
}

function getMemoryInfo() {
    const used = process.memoryUsage();
    const totalSystem = os.totalmem();
    const freeSystem = os.freemem();

    return {
        rss: (used.rss / 1024 / 1024).toFixed(1),
        heapUsed: (used.heapUsed / 1024 / 1024).toFixed(1),
        heapTotal: (used.heapTotal / 1024 / 1024).toFixed(1),
        systemUsed: ((totalSystem - freeSystem) / 1024 / 1024).toFixed(0),
        systemTotal: (totalSystem / 1024 / 1024).toFixed(0),
    };
}

// ─── MENU ────────────────────────────────────────────────────────────

gmd(
    {
        pattern: "menu",
        aliases: ["help", "cmds", "commands", "start"],
        react: "📋",
        category: "general",
        description: "Show the bot command menu",
    },
    async (from, Guru, conText) => {
        const { react, mek } = conText;

        try {
            const { buildThemedMenu, sendMenuMsg } = require("./design");

            if (typeof buildThemedMenu !== "function" ||
                typeof sendMenuMsg !== "function") {
                throw new Error("Menu functions are unavailable");
            }

            if (typeof react === "function") {
                await react("📋");
            }

            const menuText = await buildThemedMenu(conText, Guru);
            await sendMenuMsg(Guru, from, menuText, conText);

            if (typeof react === "function") {
                await react("🚀");
            }
        } catch (error) {
            logError("Menu command failed", error);

            try {
                await Guru.sendMessage(
                    from,
                    {
                        text:
                            `╭─⌈ 📋 *${BOT_NAME}* ⌋\n` +
                            "│ Menu haikufunguka.\n" +
                            "│ Jaribu tena baada ya muda.\n" +
                            "╰⊷ Powered by MNYANDWA-MD",
                    },
                    mek ? { quoted: mek } : {}
                );
            } catch (sendError) {
                logError("Menu fallback failed", sendError);
            }
        }
    }
);

// ─── CATEGORY NUMBER HANDLER ─────────────────────────────────────────

gmd(
    {
        pattern: /^\d+$/,
        on: "body",
        dontAddCommandList: true,
        react: "📂",
        category: "general",
        description: "Browse a menu category by number",
    },
    async (from, Guru, conText) => {
        const {
            body, mek, botName, botPrefix, botFooter,
            newsletterJid, sender, botId
        } = conText;

        try {
            const {
                getSortedCategories,
                CAT_ICONS,
                getMenuPicUrl,
            } = require("./design");

            const n = Number(String(body).trim());

            if (!Number.isSafeInteger(n) || n < 1) return;

            const categories = getSortedCategories();

            if (n > categories.length) return;

            const { cat, cmds } = categories[n - 1];
            const icon = CAT_ICONS?.[cat] || "⚡";
            const label = String(cat)
                .replace(/[_-]/g, " ")
                .toUpperCase();

            const prefix = botPrefix || DEFAULT_PREFIX;

            const cmdList = cmds.map(command => {
                const pattern = String(command.pattern);
                const desc = command.description
                    ? ` — _${command.description}_`
                    : "";

                const aliases = Array.isArray(command.aliases)
                    ? command.aliases
                    : [];

                const altText = aliases.length
                    ? `\n> │   ↳ _${aliases.map(a => `${prefix}${a}`).join(", ")}_`
                    : "";

                return `> │ ◈ *${prefix}${pattern}*${desc}${altText}`;
            }).join("\n");

            const text =
`> ╭─⌈ ${icon} *${label}* ⌋
> │ ${cmds.length} command(s) available
> │
${cmdList}
> ╰⊷ ✨ _${botFooter || `Powered by ${BOT_NAME}`}_`;

            const picUrl = await getMenuPicUrl(Guru, botId);

            const options = mek ? { quoted: mek } : {};

            if (picUrl) {
                await Guru.sendMessage(
                    from,
                    { image: { url: picUrl }, caption: text },
                    options
                );
            } else {
                await Guru.sendMessage(from, { text }, options);
            }
        } catch (error) {
            logError("Category handler failed", error);
        }
    }
);

// ─── PING / ALIVE ────────────────────────────────────────────────────

gmd(
    {
        pattern: "ping",
        aliases: ["alive", "status", "check"],
        react: "🏓",
        category: "general",
        description: "Check bot responsiveness",
    },
    async (from, Guru, conText) => {
        const { mek, react, botName, botPrefix } = conText;
        const started = performance.now();

        try {
            if (typeof react === "function") {
                await react("🏓");
            }

            // Measures local handler overhead, not full network latency.
            const elapsed = (performance.now() - started).toFixed(1);
            const mem = getMemoryInfo();

            const text =
`╭─⌈ 🏓 *${botName || BOT_NAME}* ⌋
│ Status  : ✅ Online
│ Response: *${elapsed} ms*
│ Uptime  : *${getUptime()}*
│ RAM RSS : *${mem.rss} MB*
│ Prefix  : *${botPrefix || DEFAULT_PREFIX}*
╰⊷ ⚡ _MNYANDWA-MD SYSTEM_`;

            await Guru.sendMessage(
                from,
                { text },
                mek ? { quoted: mek } : {}
            );
        } catch (error) {
            logError("Ping command failed", error);
        }
    }
);

// ─── UPTIME ──────────────────────────────────────────────────────────

gmd(
    {
        pattern: "uptime",
        aliases: ["runtime", "ut"],
        react: "⏱️",
        category: "general",
        description: "Show bot uptime and local time",
    },
    async (from, Guru, conText) => {
        const { react, botName, timeZone, mek } = conText;

        try {
            if (typeof react === "function") {
                await react("⏱️");
            }

            const tz = timeZone || process.env.TIME_ZONE ||
                DEFAULT_TIMEZONE;

            const now = moment().tz(tz);
            const mem = getMemoryInfo();

            if (!now.isValid()) {
                throw new Error("Invalid timezone configuration");
            }

            const text =
`╭─⌈ ⏱️ *${botName || BOT_NAME}* ⌋
│ Uptime  : *${getUptime()}*
│ Time    : ${now.format("hh:mm:ss A")}
│ Date    : ${now.format("ddd, DD MMM YYYY")}
│ Heap    : *${mem.heapUsed}/${mem.heapTotal} MB*
│ RSS     : *${mem.rss} MB*
╰⊷ _SYSTEM OPERATIONAL_`;

            await Guru.sendMessage(
                from,
                { text },
                mek ? { quoted: mek } : {}
            );
        } catch (error) {
            logError("Uptime command failed", error);
        }
    }
);

// ─── PERFORMANCE / SYSTEM INFO ──────────────────────────────────────

gmd(
    {
        pattern: "system",
        aliases: ["performance", "sysinfo"],
        react: "🖥️",
        category: "general",
        description: "Show Node.js and system performance",
    },
    async (from, Guru, conText) => {
        const { react, mek, botName } = conText;

        try {
            if (typeof react === "function") {
                await react("🖥️");
            }

            const mem = getMemoryInfo();
            const cpus = os.cpus();
            const load = os.loadavg();

            const text =
`╭─⌈ 🖥️ *${botName || BOT_NAME} SYSTEM* ⌋
│ Platform : ${process.platform}
│ Node.js  : ${process.version}
│ CPU cores: ${cpus.length}
│ Load avg : ${load.map(n => n.toFixed(2)).join(" / ")}
│ RSS      : ${mem.rss} MB
│ Heap     : ${mem.heapUsed}/${mem.heapTotal} MB
│ System RAM: ${mem.systemUsed}/${mem.systemTotal} MB
│ Uptime   : ${getUptime()}
╰⊷ _MNYANDWA-MD MONITOR_`;

            await Guru.sendMessage(
                from,
                { text },
                mek ? { quoted: mek } : {}
            );
        } catch (error) {
            logError("System command failed", error);
        }
    }
);

// ─── BOT INFO ────────────────────────────────────────────────────────

gmd(
    {
        pattern: "botinfo",
        aliases: ["info", "about", "mybot"],
        react: "🤖",
        category: "general",
        description: "Show bot information",
    },
    async (from, Guru, conText) => {
        const {
            reply, react, botName, botPrefix, botVersion,
            botMode, ownerName
        } = conText;

        try {
            if (typeof react === "function") {
                await react("🤖");
            }

            const { commands } = require("../luka");

            const totalCmds = Array.isArray(commands)
                ? commands.filter(c =>
                    c.pattern && !c.dontAddCommandList
                ).length
                : "N/A";

            const text =
`╭─⌈ 🤖 *${botName || BOT_NAME}* ⌋
│ Version  : *v${botVersion || "5.0.0"}*
│ Prefix   : *${botPrefix || DEFAULT_PREFIX}*
│ Mode     : *${String(botMode || "public").toUpperCase()}*
│ Commands : *${totalCmds}*
│ Uptime   : *${getUptime()}*
│ Owner    : *${ownerName || "MNYANDWA"}*
│ Library  : Baileys
╰⊷ *${botName || BOT_NAME}*`;

            if (typeof reply === "function") {
                await reply(text);
            } else {
                await conText.Guru?.sendMessage?.(conText.from, { text });
            }
        } catch (error) {
            logError("Botinfo command failed", error);
        }
    }
);

module.exports = {};
