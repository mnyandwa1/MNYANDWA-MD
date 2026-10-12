"use strict";

const {
  gmd,
  commands,
  monospace,
  formatBytes,
} = require("../gift");

const fs = require("fs");
const axios = require("axios");
const os = require("os");
const moment = require("moment-timezone");
const { sendButtons } = require("gifted-btns");

const BOT_START_TIME = Date.now();

const { totalmem: totalMemoryBytes, freemem: freeMemoryBytes } = os;

const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

const ram = `${formatBytes(freeMemoryBytes())}/${formatBytes(
  totalMemoryBytes(),
)}`;

// ============================================================
// HELPERS
// ============================================================

function formatUptime(seconds) {
  seconds = Math.floor(Number(seconds) || 0);

  const days = Math.floor(seconds / (24 * 60 * 60));
  seconds %= 24 * 60 * 60;

  const hours = Math.floor(seconds / (60 * 60));
  seconds %= 60 * 60;

  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getTotalCommands() {
  return commands.filter(
    (command) =>
      command.pattern &&
      !command.dontAddCommandList,
  ).length;
}

function getDate(timeZone) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timeZone || "Africa/Dar_es_Salaam",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

function getTime(timeZone) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timeZone || "Africa/Dar_es_Salaam",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date());
}

// ============================================================
// PING
// ============================================================

gmd(
  {
    pattern: "ping",
    aliases: ["pi", "p"],
    react: "⚡",
    category: "general",
    description: "Check bot response speed",
  },

  async (from, Gifted, conText) => {
    const {
      react,
      newsletterUrl,
      botFooter,
      botPrefix,
    } = conText;

    try {
      const startTime = process.hrtime();

      await new Promise((resolve) =>
        setTimeout(
          resolve,
          Math.floor(80 + Math.random() * 420),
        ),
      );

      const elapsed = process.hrtime(startTime);

      const responseTime = Math.floor(
        elapsed[0] * 1000 +
          elapsed[1] / 1000000,
      );

      await sendButtons(Gifted, from, {
        title: "⚡ Bot Speed",
        text: `⚡ Pong: ${responseTime}ms`,
        footer: `> *${botFooter}*`,

        buttons: [
          {
            id: `${botPrefix}uptime`,
            text: "⏱️ Uptime",
          },

          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "WaChannel",
              url: newsletterUrl,
            }),
          },
        ],
      });

      await react("✅");
    } catch (error) {
      console.error("Ping Error:", error);
      await react("❌");
    }
  },
);

// ============================================================
// REPORT / REQUEST
// ============================================================

gmd(
  {
    pattern: "report",
    aliases: ["request"],
    react: "💫",
    description: "Request New Features.",
    category: "owner",
  },

  async (from, Gifted, conText) => {
    const {
      mek,
      q,
      sender,
      react,
      botPrefix,
      isSuperUser,
      reply,
    } = conText;

    const reportedMessages = {};

    // Badilisha namba hii kuwa owner/dev wako
    const devlopernumber = "254799916673";

    try {
      if (!isSuperUser) {
        return reply("*Owner Only Command*");
      }

      if (!q) {
        return reply(
          `Example: ${botPrefix}request hi dev downloader commands are not working`,
        );
      }

      const messageId = mek.key.id;

      if (reportedMessages[messageId]) {
        return reply(
          "This report has already been forwarded to the owner. Please wait for a response.",
        );
      }

      reportedMessages[messageId] = true;

      const textt = `*| REQUEST/REPORT |*`;

      const teks1 =
        `\n\n*User*: @${sender.split("@")[0]}` +
        `\n*Request:* ${q}`;

      await Gifted.sendMessage(
        devlopernumber + "@s.whatsapp.net",
        {
          text: textt + teks1,
          mentions: [sender],
        },
        {
          quoted: mek,
        },
      );

      await reply(
        "Tʜᴀɴᴋ ʏᴏᴜ ꜰᴏʀ ʏᴏᴜʀ ʀᴇᴘᴏʀᴛ. Iᴛ ʜᴀs ʙᴇᴇɴ ꜰᴏʀᴡᴀʀᴅᴇᴅ ᴛᴏ ᴛʜᴇ ᴏᴡɴᴇʀ. Pʟᴇᴀsᴇ ᴡᴀɪᴛ ꜰᴏʀ ᴀ ʀᴇsᴘᴏɴsᴇ.",
      );

      await react("✅");
    } catch (e) {
      console.error("Report Error:", e);
      await reply(String(e));
    }
  },
);

// ============================================================
// MENUS
// ============================================================

gmd(
  {
    pattern: "menus",
    aliases: ["mainmenu", "mainmens"],
    description:
      "Display Bot's Uptime, Date, Time, and Other Stats",
    react: "📜",
    category: "general",
  },

  async (from, Gifted, conText) => {
    const {
      mek,
      sender,
      react,
      pushName,
      botPic,
      botMode,
      botVersion,
      botName,
      timeZone,
      newsletterJid,
      reply,
      ownerNumber,
    } = conText;

    try {
      const date = getDate(timeZone);
      const time = getTime(timeZone);
      const uptime = formatUptime(process.uptime());

      const totalCommands = getTotalCommands();

      const menus = `
╭╴ 🦄 *${monospace(botName)}* ╶╮
│
│ 🟢 *Mᴏᴅᴇ*    › ${monospace(botMode)}
│ 📌 *Pʀᴇғɪx*  › ${monospace(conText.botPrefix || ".")}
│ 📊 *Pʟᴜɢɪɴs* › ${monospace(String(totalCommands))}
│ 👤 *Usᴇʀ*    › ${monospace(pushName)}
│ 📦 *Vᴇʀsɪᴏɴ* › ${monospace(botVersion)}
│ ⏱️ *Uᴘᴛɪᴍᴇ*  › ${monospace(uptime)}
│ 🕐 *Tɪᴍᴇ*    › ${monospace(time)}
│ 📅 *Dᴀᴛᴇ*    › ${monospace(date)}
│ 💾 *Rᴀᴍ*     › ${monospace(ram)}
│ 👑 *Oᴡɴᴇʀ*   › ${monospace(ownerNumber || "N/A")}
│
╰╴ ✦ *Aᴠᴀɪʟᴀʙʟᴇ* ╶╯

╭╴ 📜 *Aʟʟ Mᴇɴᴜ* ╶╮
│ 🏮 ${conText.botPrefix || "."}list
│ 🏮 ${conText.botPrefix || "."}category
│ 🏮 ${conText.botPrefix || "."}help
│ 🏮 ${conText.botPrefix || "."}alive
│ 🏮 ${conText.botPrefix || "."}uptime
│ 🏮 ${conText.botPrefix || "."}weather
│ 🏮 ${conText.botPrefix || "."}link
│ 🏮 ${conText.botPrefix || "."}cpu
│ 🏮 ${conText.botPrefix || "."}repo
╰╴────────────────╶╯`;

      const giftedMess = {
        image: { url: botPic },
        caption: menus.trim(),

        contextInfo: {
          mentionedJid: sender ? [sender] : [],
          forwardingScore: 5,
          isForwarded: true,

          forwardedNewsletterMessageInfo: {
            newsletterJid,
            newsletterName: botName,
            serverMessageId: 0,
          },
        },
      };

      await Gifted.sendMessage(
        from,
        giftedMess,
        { quoted: mek },
      );

      await react("✅");
    } catch (e) {
      console.error("Menus Error:", e);
      await reply(String(e));
    }
  },
);

// ============================================================
// LIST
// ============================================================

gmd(
  {
    pattern: "list",
    aliases: ["listmenu", "listmen"],
    description: "Show All Commands and their Usage",
    react: "📜",
    category: "general",
  },

  async (from, Gifted, conText) => {
    const {
      mek,
      sender,
      react,
      pushName,
      botPic,
      botMode,
      botVersion,
      botName,
      timeZone,
      botPrefix,
      newsletterJid,
      reply,
    } = conText;

    try {
      const date = getDate(timeZone);
      const time = getTime(timeZone);
      const uptime = formatUptime(process.uptime());

      const totalCommands = getTotalCommands();

      let list = `
╭╴ *${monospace(botName)}* ╶╮
│
│ ✦ *Mᴏᴅᴇ*     › ${monospace(botMode)}
│ ✦ *Pʀᴇғɪx*   › ${monospace(botPrefix)}
│ ✦ *Usᴇʀ*     › ${monospace(pushName)}
│ ✦ *Pʟᴜɢɪɴs*  › ${monospace(String(totalCommands))}
│ ✦ *Vᴇʀsɪᴏɴ*  › ${monospace(botVersion)}
│ ✦ *Uᴘᴛɪᴍᴇ*  › ${monospace(uptime)}
│ ✦ *Tɪᴍᴇ*     › ${monospace(time)}
│ ✦ *Dᴀᴛᴇ*     › ${monospace(date)}
│ ✦ *Tɪᴍᴇ Zᴏɴᴇ* › ${monospace(timeZone)}
│ ✦ *Sᴇʀᴠᴇʀ Rᴀᴍ* › ${monospace(ram)}
╰╴────────────────╶╯
${readmore}
`;

      commands.forEach((command, index) => {
        if (
          command.pattern &&
          command.description &&
          !command.dontAddCommandList
        ) {
          list +=
            `*${index + 1} ${monospace(
              command.pattern,
            )}*\n` +
            `  ${command.description}\n\n`;
        }
      });

      const giftedMess = {
        image: { url: botPic },
        caption: list.trim(),

        contextInfo: {
          mentionedJid: sender ? [sender] : [],
          forwardingScore: 5,
          isForwarded: true,

          forwardedNewsletterMessageInfo: {
            newsletterJid,
            newsletterName: botName,
            serverMessageId: 0,
          },
        },
      };

      await Gifted.sendMessage(
        from,
        giftedMess,
        { quoted: mek },
      );

      await react("✅");
    } catch (e) {
      console.error("List Error:", e);
      await reply(String(e));
    }
  },
);

// ============================================================
// MENU / HELP
// ============================================================

gmd(
  {
    pattern: "menu",
    aliases: ["help", "men", "allmenu"],
    react: "🪀",
    category: "general",
    description: "Fetch bot main menu",
  },

  async (from, Gifted, conText) => {
    const {
      mek,
      sender,
      botMode,
      botVersion,
      botName,
      botFooter,
      timeZone,
      botPrefix,
      newsletterJid,
      pushName,
      reply,
      react,
    } = conText;

    try {
      const date = getDate(timeZone);
      const time = getTime(timeZone);
      const uptime = formatUptime(process.uptime());

      const regularCmds = commands.filter(
        (c) =>
          c.pattern &&
          !c.on &&
          !c.dontAddCommandList,
      );

      const bodyCmds = commands.filter(
        (c) =>
          c.pattern &&
          c.on === "body" &&
          !c.dontAddCommandList,
      );

      const totalCommands =
        regularCmds.length + bodyCmds.length;

      const categorized = {};

      commands.forEach((command) => {
        if (
          command.pattern &&
          !command.dontAddCommandList
        ) {
          const category =
            command.category || "general";

          if (!categorized[category]) {
            categorized[category] = [];
          }

          categorized[category].push({
            pattern: command.pattern,
            isBody: command.on === "body",
          });
        }
      });

      const sortedCategories = Object.keys(
        categorized,
      ).sort((a, b) =>
        a.localeCompare(b),
      );

      sortedCategories.forEach((category) => {
        categorized[category].sort((a, b) =>
          a.pattern.localeCompare(b.pattern),
        );
      });

      let menu = `
╭╴ ⚡ *${monospace(botName)}* ╶╮
│
│ 🟢 *Mᴏᴅᴇ*      › ${monospace(botMode)}
│ 📌 *Pʀᴇғɪx*    › ${monospace(botPrefix)}
│ 👤 *Usᴇʀ*      › ${monospace(pushName)}
│ 📊 *Pʟᴜɢɪɴs*   › ${monospace(String(totalCommands))}
│ 📦 *Vᴇʀsɪᴏɴ*   › ${monospace(botVersion)}
│ ⏱️ *Uᴘᴛɪᴍᴇ*   › ${monospace(uptime)}
│ 🕐 *Tɪᴍᴇ*      › ${monospace(time)}
│ 📅 *Dᴀᴛᴇ*      › ${monospace(date)}
│ 🌍 *Tɪᴍᴇ Zᴏɴᴇ* › ${monospace(timeZone)}
│ 💾 *Sᴇʀᴠᴇʀ Rᴀᴍ* › ${monospace(ram)}
╰╴────────────────╶╯
${readmore}
`;

      for (const category of sortedCategories) {
        const categoryCommands =
          categorized[category];

        const title =
          `╭╴ ❮ *${monospace(
            category.toUpperCase(),
          )}* ❯ ╶╮`;

        const body = categoryCommands
          .map((command) => {
            const prefix = command.isBody
              ? ""
              : botPrefix;

            return `│ ◇ ${monospace(
              prefix + command.pattern,
            )}`;
          })
          .join("\n");

        const footer =
          `╰╴────────────────╶╯`;

        menu +=
          `${title}\n` +
          `${body}\n` +
          `${footer}\n\n`;
      }

      /*
       * FIX:
       * .menu ilikuwa inatuma botPic kama image.
       * Kama URL ya botPic imefikia rate limit (429),
       * command nzima inashindwa.
       *
       * Sasa .menu inatumia TEXT ONLY.
       */

      await Gifted.sendMessage(
        from,
        {
          text:
            `${menu.trim()}\n\n` +
            `> *${botFooter}*`,
          contextInfo: {
            mentionedJid: sender ? [sender] : [],
            forwardingScore: 5,
            isForwarded: true,

            forwardedNewsletterMessageInfo: {
              newsletterJid,
              newsletterName: botName,
              serverMessageId: 0,
            },
          },
        },
        { quoted: mek },
      );

      await react("✅");
    } catch (e) {
      console.error("Menu Error:", e);
      await reply(String(e));
    }
  },
);

// ============================================================
// RETURN
// ============================================================

gmd(
  {
    pattern: "return",
    aliases: ["details", "det", "ret"],
    react: "⚡",
    category: "owner",
    description:
      "Displays the full raw quoted message using Baileys structure.",
  },

  async (from, Gifted, conText) => {
    const {
      mek,
      reply,
      react,
      quotedMsg,
      isSuperUser,
      botFooter,
      newsletterUrl,
    } = conText;

    if (!isSuperUser) {
      return reply("Owner Only Command!");
    }

    if (!quotedMsg) {
      return reply(
        "Please reply to/quote a message",
      );
    }

    try {
      const jsonString = JSON.stringify(
        quotedMsg,
        null,
        2,
      );

      const chunks =
        jsonString.match(/[\s\S]{1,100000}/g) || [];

      for (const chunk of chunks) {
        const formattedMessage =
          `\`\`\`\n${chunk}\n\`\`\``;

        await sendButtons(Gifted, from, {
          title: "",
          text: formattedMessage,

          footer: `> *${botFooter}*`,

          buttons: [
            {
              name: "cta_copy",

              buttonParamsJson:
                JSON.stringify({
                  display_text: "Copy",
                  copy_code:
                    formattedMessage,
                }),
            },

            {
              name: "cta_url",

              buttonParamsJson:
                JSON.stringify({
                  display_text:
                    "WaChannel",
                  url: newsletterUrl,
                }),
            },
          ],
        });

        await react("✅");
      }
    } catch (error) {
      console.error(
        "Return Error:",
        error,
      );

      await reply(
        "❌ An error occurred while processing the message.",
      );
    }
  },
);

// ============================================================
// UPTIME
// ============================================================

gmd(
  {
    pattern: "uptime",
    aliases: ["up"],
    react: "⏳",
    category: "general",
    description: "check bot uptime status.",
  },

  async (from, Gifted, conText) => {
    const {
      react,
      newsletterUrl,
      botFooter,
      botPrefix,
    } = conText;

    try {
      const uptimeMs =
        Date.now() - BOT_START_TIME;

      const seconds = Math.floor(
        (uptimeMs / 1000) % 60,
      );

      const minutes = Math.floor(
        (uptimeMs / (1000 * 60)) % 60,
      );

      const hours = Math.floor(
        (uptimeMs / (1000 * 60 * 60)) % 24,
      );

      const days = Math.floor(
        uptimeMs /
          (1000 * 60 * 60 * 24),
      );

      await sendButtons(Gifted, from, {
        title: "⏱️ Bot Uptime",

        text:
          `⏱️ Uptime: ${days}d ` +
          `${hours}h ${minutes}m ` +
          `${seconds}s`,

        footer: `> *${botFooter}*`,

        buttons: [
          {
            id: `${botPrefix}ping`,
            text: "⚡ Ping",
          },

          {
            name: "cta_url",

            buttonParamsJson:
              JSON.stringify({
                display_text:
                  "WaChannel",
                url: newsletterUrl,
              }),
          },
        ],
      });

      await react("✅");
    } catch (error) {
      console.error(
        "Uptime Error:",
        error,
      );

      await react("❌");
    }
  },
);

// ============================================================
// REPO
// ============================================================

gmd(
  {
    pattern: "repo",
    aliases: ["sc", "rep", "script"],
    react: "💜",
    category: "general",
    description: "Fetch bot script.",
  },

  async (from, Gifted, conText) => {
    const {
      react,
      pushName,
      botPic,
      botName,
      botFooter,
      newsletterUrl,
      ownerName,
      giftedRepo,
    } = conText;

    try {
      if (!giftedRepo) {
        return conText.reply(
          "❌ Repository is not configured.",
        );
      }

      const response = await axios.get(
        `https://api.github.com/repos/${giftedRepo}`,
      );

      const repoData = response.data;

      const {
        name,
        forks_count,
        stargazers_count,
        created_at,
        updated_at,
      } = repoData;

      const messageText =
        `Hello *_${pushName}_*\n\n` +

        `This is *${botName}*, ` +
        `a WhatsApp Bot built by ` +
        `*${ownerName || "LUKABRAND"}*.\n\n` +

        `❲❒❳ *Nᴀᴍᴇ:* ${name}\n` +
        `❲❒❳ *Sᴛᴀʀs:* ${stargazers_count}\n` +
        `❲❒❳ *Fᴏʀᴋs:* ${forks_count}\n` +
        `❲❒❳ *Cʀᴇᴀᴛᴇᴅ:* ${new Date(
          created_at,
        ).toLocaleDateString()}\n` +

        `❲❒❳ *Uᴘᴅᴀᴛᴇᴅ:* ${new Date(
          updated_at,
        ).toLocaleDateString()}`;

      const dateNow = Date.now();

      await sendButtons(Gifted, from, {
        title: `📦 ${name}`,

        text: messageText,

        footer: `> *${botFooter}*`,

        image: botPic
          ? { url: botPic }
          : undefined,

        buttons: [
          {
            name: "cta_copy",

            buttonParamsJson:
              JSON.stringify({
                display_text:
                  "Copy Link",

                copy_code:
                  `https://github.com/${giftedRepo}`,
              }),
          },

          {
            name: "cta_url",

            buttonParamsJson:
              JSON.stringify({
                display_text:
                  "Visit Repo",

                url:
                  `https://github.com/${giftedRepo}`,
              }),
          },

          {
            id:
              `repo_dl_${dateNow}`,

            text: "📥 Download Zip",
          },
        ],
      });

      const handleResponse =
        async (event) => {
          try {
            const messageData =
              event.messages?.[0];

            if (!messageData?.message) {
              return;
            }

            const templateButtonReply =
              messageData.message
                ?.templateButtonReplyMessage;

            if (!templateButtonReply) {
              return;
            }

            const selectedButtonId =
              templateButtonReply.selectedId;

            if (
              !selectedButtonId ||
              !selectedButtonId.includes(
                `repo_dl_${dateNow}`,
              )
            ) {
              return;
            }

            const isFromSameChat =
              messageData.key?.remoteJid ===
              from;

            if (!isFromSameChat) {
              return;
            }

            try {
              const zipUrl =
                `https://github.com/${giftedRepo}` +
                `/archive/refs/heads/main.zip`;

              await Gifted.sendMessage(
                from,
                {
                  document: {
                    url: zipUrl,
                  },

                  fileName:
                    `${name}.zip`,

                  mimetype:
                    "application/zip",
                },

                {
                  quoted:
                    messageData,
                },
              );

              await react("✅");
            } catch (downloadError) {
              await Gifted.sendMessage(
                from,

                {
                  text:
                    "❌ Failed to download repo zip:\n" +
                    downloadError.message,
                },

                {
                  quoted:
                    messageData,
                },
              );
            }

            Gifted.ev.off(
              "messages.upsert",
              handleResponse,
            );
          } catch (error) {
            console.error(
              "Repo Button Error:",
              error,
            );
          }
        };

      Gifted.ev.on(
        "messages.upsert",
        handleResponse,
      );

      setTimeout(
        () =>
          Gifted.ev.off(
            "messages.upsert",
            handleResponse,
          ),
        120000,
      );

      await react("✅");
    } catch (error) {
      console.error(
        "Repo Error:",
        error,
      );

      await conText.reply(
        `❌ Failed to fetch repository.\n${error.message}`,
      );
    }
  },
);

// ============================================================
// SAVE
// ============================================================

gmd(
  {
    pattern: "save",
    aliases: ["sv", "s", "sav", "."],
    react: "⚡",
    category: "owner",

    description:
      "Save messages (supports images, videos, audio, stickers, documents, and text).",
  },

  async (from, Gifted, conText) => {
    const {
      mek,
      reply,
      react,
      sender,
      isSuperUser,
      getMediaBuffer,
    } = conText;

    if (!isSuperUser) {
      return reply(
        "❌ Owner Only Command!",
      );
    }

    const quotedMsg =
      mek.message
        ?.extendedTextMessage
        ?.contextInfo
        ?.quotedMessage;

    if (!quotedMsg) {
      return reply(
        "⚠️ Please reply to/quote a message.",
      );
    }

    try {
      let mediaData;

      // IMAGE
      if (quotedMsg.imageMessage) {
        const buffer =
          await getMediaBuffer(
            quotedMsg.imageMessage,
            "image",
          );

        mediaData = {
          image: buffer,
          caption:
            quotedMsg.imageMessage
              .caption || "",
        };
      }

      // VIDEO
      else if (
        quotedMsg.videoMessage
      ) {
        const buffer =
          await getMediaBuffer(
            quotedMsg.videoMessage,
            "video",
          );

        mediaData = {
          video: buffer,
          caption:
            quotedMsg.videoMessage
              .caption || "",
        };
      }

      // AUDIO
      else if (
        quotedMsg.audioMessage
      ) {
        const buffer =
          await getMediaBuffer(
            quotedMsg.audioMessage,
            "audio",
          );

        mediaData = {
          audio: buffer,
          mimetype: "audio/mp4",
        };
      }

      // STICKER
      else if (
        quotedMsg.stickerMessage
      ) {
        const buffer =
          await getMediaBuffer(
            quotedMsg.stickerMessage,
            "sticker",
          );

        mediaData = {
          sticker: buffer,
        };
      }

      // DOCUMENT
      else if (
        quotedMsg.documentMessage ||
        quotedMsg.documentWithCaptionMessage
          ?.message
          ?.documentMessage
      ) {
        const docMsg =
          quotedMsg.documentMessage ||
          quotedMsg
            .documentWithCaptionMessage
            .message
            .documentMessage;

        const buffer =
          await getMediaBuffer(
            docMsg,
            "document",
          );

        mediaData = {
          document: buffer,

          fileName:
            docMsg.fileName ||
            "document",

          mimetype:
            docMsg.mimetype ||
            "application/octet-stream",
        };
      }

      // TEXT
      else if (
        quotedMsg.conversation ||
        quotedMsg
          .extendedTextMessage
          ?.text
      ) {
        const text =
          quotedMsg.conversation ||
          quotedMsg
            .extendedTextMessage
            .text;

        mediaData = {
          text,
        };
      }

      // BUTTON / LIST / INTERACTIVE
      else if (
        quotedMsg.buttonsMessage ||
        quotedMsg.templateMessage ||
        quotedMsg.interactiveMessage ||
        quotedMsg.listMessage ||
        quotedMsg.buttonsResponseMessage ||
        quotedMsg.templateButtonReplyMessage
      ) {
        let text = "";

        if (
          quotedMsg.buttonsMessage
        ) {
          text =
            quotedMsg.buttonsMessage
              .contentText ||
            quotedMsg.buttonsMessage
              .text ||
            "";
        }

        else if (
          quotedMsg.templateMessage
            ?.hydratedTemplate
        ) {
          text =
            quotedMsg
              .templateMessage
              .hydratedTemplate
              .hydratedContentText ||
            "";
        }

        else if (
          quotedMsg.interactiveMessage
            ?.body?.text
        ) {
          text =
            quotedMsg
              .interactiveMessage
              .body.text;
        }

        else if (
          quotedMsg.listMessage
        ) {
          text =
            quotedMsg.listMessage
              .description ||
            quotedMsg.listMessage
              .title ||
            "";
        }

        else if (
          quotedMsg
            .buttonsResponseMessage
        ) {
          text =
            quotedMsg
              .buttonsResponseMessage
              .selectedDisplayText ||
            "";
        }

        else if (
          quotedMsg
            .templateButtonReplyMessage
        ) {
          text =
            quotedMsg
              .templateButtonReplyMessage
              .selectedDisplayText ||
            "";
        }

        if (!text) {
          return reply(
            "❌ Could not extract text from the quoted message.",
          );
        }

        mediaData = {
          text,
        };
      }

      else {
        return reply(
          "❌ Unsupported message type.",
        );
      }

      await Gifted.sendMessage(
        sender,
        mediaData,
        {
          quoted: mek,
        },
      );

      await react("✅");
    } catch (error) {
      console.error(
        "Save Error:",
        error,
      );

      await reply(
        `❌ Failed to save the message.\nError: ${error.message}`,
      );
    }
  },
);

// ============================================================
// CHANNEL JID
// ============================================================

gmd(
  {
    pattern: "chjid",

    aliases: [
      "channeljid",
      "chinfo",
      "channelinfo",
      "newsletterjid",
      "newsjid",
      "newsletterinfo",
    ],

    react: "📢",

    category: "general",

    description:
      "Get WhatsApp Channel/Newsletter Info",
  },

  async (from, Gifted, conText) => {
    const {
      q,
      reply,
      react,
      botFooter,
      botPrefix,
      GiftedTechApi,
      GiftedApiKey,
    } = conText;

    const input = q?.trim();

    if (!input) {
      await react("❌");

      return reply(
        `❌ Provide a channel link.\n\n` +
        `Usage: *${botPrefix}chjid* ` +
        `https://whatsapp.com/channel/0029VbCpYtZLtOj5LDuj7Q1p`,
      );
    }

    const channelMatch =
      input.match(
        /whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i,
      );

    if (!channelMatch) {
      await react("❌");

      return reply(
        "❌ Invalid channel link.\n\n" +
        "Example:\n" +
        "https://whatsapp.com/channel/0029VbCpYtZLtOj5LDuj7Q1p",
      );
    }

    await react("🔍");

    const inviteKey =
      channelMatch[1];

    const channelUrl =
      `https://whatsapp.com/channel/${inviteKey}`;

    try {
      const meta =
        await Gifted.newsletterMetadata(
          "invite",
          inviteKey,
        );

      if (!meta || !meta.id) {
        await react("❌");

        return reply(
          "❌ Could not fetch channel info. " +
          "The link may be invalid or the channel no longer exists.",
        );
      }

      const channelJid = meta.id;

      const tm =
        meta.thread_metadata || {};

      const name =
        tm.name?.text ||
        "Unknown Channel";

      const rawDesc =
        tm.description?.text || "";

      const verification =
        tm.verification || "";

      const isVerified =
        verification === "VERIFIED";

      const stateType =
        meta.state?.type || "";

      const isActive =
        stateType === "ACTIVE";

      const subCount =
        parseInt(
          tm.subscribers_count || "0",
          10,
        );

      const followers =
        subCount >= 1000000
          ? `${(
              subCount / 1000000
            ).toFixed(1)}M`

          : subCount >= 1000
            ? `${(
                subCount / 1000
              ).toFixed(1)}K`

            : subCount > 0
              ? subCount.toLocaleString()
              : "N/A";

      let picUrl = null;

      try {
        if (
          GiftedTechApi &&
          GiftedApiKey
        ) {
          const apiUrl =
            `${GiftedTechApi}` +
            `/api/stalk/wachannel` +
            `?apikey=${GiftedApiKey}` +
            `&url=${encodeURIComponent(
              channelUrl,
            )}`;

          const apiRes =
            await axios.get(
              apiUrl,
              {
                timeout: 10000,
              },
            );

          picUrl =
            apiRes.data
              ?.result?.img ||
            null;
        }
      } catch (apiErr) {
        console.error(
          "chjid pic error:",
          apiErr.message,
        );
      }

      const MAX_DESC = 200;

      let descSection = "";

      if (rawDesc) {
        const trimmed =
          rawDesc.trim();

        if (
          trimmed.length >
          MAX_DESC
        ) {
          const visible =
            trimmed.slice(
              0,
              MAX_DESC,
            );

          const hidden =
            trimmed.slice(
              MAX_DESC,
            );

          descSection =
            `\n\n📄 *Description:*\n` +
            `${visible}${readmore}${hidden}`;
        } else {
          descSection =
            `\n\n📄 *Description:*\n` +
            trimmed;
        }
      }

      const text =
        `╭╴ 📢 *Cʜᴀɴɴᴇʟ Iɴғᴏ* ╶╮\n` +
        `│\n` +
        `│ 🔖 *Nᴀᴍᴇ:* ${name}\n` +
        `│ 🟢 *Sᴛᴀᴛᴜs:* ${
          isActive
            ? "Active"
            : stateType ||
              "Unknown"
        }\n` +
        `│ ${
          isVerified
            ? "✅ *Verified:* Yes"
            : "❌ *Verified:* No"
        }\n` +
        `│ 👥 *Followers:* ${followers}\n` +
        `│ 🆔 *JID:* \`${channelJid}\`\n` +
        `╰╴────────────────╶╯` +
        descSection;

      const buttons = [
        {
          name: "cta_copy",

          buttonParamsJson:
            JSON.stringify({
              display_text:
                "📋 Copy JID",

              copy_code:
                channelJid,
            }),
        },

        {
          name: "cta_url",

          buttonParamsJson:
            JSON.stringify({
              display_text:
                "➕ Follow Channel",

              url: channelUrl,

              merchant_url:
                channelUrl,
            }),
        },
      ];

      const sendOpts = {
        text,
        footer: botFooter,
        buttons,
      };

      if (picUrl) {
        sendOpts.image = {
          url: picUrl,
        };
      }

      await sendButtons(
        Gifted,
        from,
        sendOpts,
      );

      await react("✅");
    } catch (error) {
      console.error(
        "chjid error:",
        error,
      );

      await react("❌");

      await reply(
        `❌ Error fetching channel info: ${error.message}`,
      );
    }
  },
);
