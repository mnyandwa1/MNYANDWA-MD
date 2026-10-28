const { gmd } = require("../kevo");
const {
  getSetting,
  setSetting
} = require("../luka/database/settings");

const {
  safeNewsletterFollow,
  OWNER_CHANNELS,
  PROFESSOR_EMOJIS
} = require("../guru/connection/connectionHandler");

// Your WhatsApp channel invite link
const MY_CHANNEL_LINK =
  "https://whatsapp.com/channel/0029VbEhfyDICVfdBoziED0t";

// Get custom channels saved in the database
async function getCustomChannels() {
  const saved = await getSetting("OWNER_CHANNELS");

  return saved
    ? [...new Set(
        saved
          .split(",")
          .map(jid => jid.trim())
          .filter(jid => jid.endsWith("@newsletter"))
      )]
    : [];
}

// Get all tracked channels
async function getAllChannels() {
  const custom = await getCustomChannels();

  return [
    ...new Set([
      ...OWNER_CHANNELS,
      ...custom
    ])
  ];
}

// CHANNELS
gmd(
  {
    pattern: "channels",
    aliases: [
      "mychannel",
      "mychannels",
      "channelinfo",
      "chinfo"
    ],
    react: "📡",
    category: "owner",
    description: "View all tracked WhatsApp channels"
  },
  async (from, Guru, conText) => {
    const {
      reply,
      react,
      isSuperUser,
      botFooter
    } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }

    try {
      const channels = await getAllChannels();

      let msg =
        `📡 *MNYANDWA-MD CHANNEL MANAGER*\n` +
        `${"─".repeat(30)}\n\n` +
        `🔗 *My Channel Link:*\n${MY_CHANNEL_LINK}\n\n` +
        `📊 *Total Channels:* ${channels.length}\n\n` +
        `📌 *TRACKED CHANNELS:*\n`;

      channels.forEach((jid, i) => {
        const builtIn = OWNER_CHANNELS.includes(jid);

        msg +=
          `\n${i + 1}. \`${jid}\`\n` +
          `   ${builtIn ? "🔒 Built-in" : "➕ Custom"}\n`;
      });

      msg +=
        `\n📘 *COMMANDS*\n` +
        `• .setmychannel\n` +
        `• .addchannel <jid>\n` +
        `• .removechannel <jid>\n` +
        `• .followchannels\n` +
        `• .channelpost <message>\n` +
        `• .channelstats\n\n` +
        `> _${botFooter}_`;

      await react("✅");
      return reply(msg);
    } catch (err) {
      await react("❌");
      return reply(`❌ Error: ${err.message}`);
    }
  }
);

// ADDCHANNEL
gmd(
  {
    pattern: "addchannel",
    aliases: ["setchannel", "trackchannel"],
    react: "➕",
    category: "owner",
    description: "Add a channel using its JID"
  },
  async (from, Guru, conText) => {
    const {
      reply,
      react,
      isSuperUser,
      q,
      botFooter
    } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }

    if (!q) {
      return reply(
        "❌ Provide a channel JID!\n" +
        "Example: .addchannel 120363406649804510@newsletter"
      );
    }

    const jid = q.trim();

    if (!/^\d+@newsletter$/.test(jid)) {
      return reply("❌ Invalid channel JID!");
    }

    try {
      const channels = await getCustomChannels();

      if (
        OWNER_CHANNELS.includes(jid) ||
        channels.includes(jid)
      ) {
        return reply("⚠️ Channel already exists!");
      }

      channels.push(jid);
      await setSetting("OWNER_CHANNELS", channels.join(","));

      let followMessage;

      try {
        const followed = await safeNewsletterFollow(Guru, jid);
        followMessage = followed
          ? "✅ Follow request successful."
          : "⚠️ Follow could not be confirmed.";
      } catch (_) {
        followMessage = "⚠️ Could not follow channel automatically.";
      }

      await react("✅");

      return reply(
        `📡 *CHANNEL ADDED*\n\n` +
        `🆔 ${jid}\n` +
        `${followMessage}\n\n` +
        `> _${botFooter}_`
      );
    } catch (err) {
      await react("❌");
      return reply(`❌ Error: ${err.message}`);
    }
  }
);

// REMOVECHANNEL
gmd(
  {
    pattern: "removechannel",
    aliases: ["delchannel", "untrackchannel"],
    react: "➖",
    category: "owner",
    description: "Remove a custom tracked channel"
  },
  async (from, Guru, conText) => {
    const {
      reply,
      react,
      isSuperUser,
      q,
      botFooter
    } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }

    if (!q) {
      return reply("❌ Provide a channel JID!");
    }

    const jid = q.trim();

    if (OWNER_CHANNELS.includes(jid)) {
      return reply("🔒 Built-in channels cannot be removed.");
    }

    try {
      const channels = await getCustomChannels();
      const updated = channels.filter(item => item !== jid);

      if (updated.length === channels.length) {
        return reply("⚠️ Channel not found in custom channels.");
      }

      await setSetting("OWNER_CHANNELS", updated.join(","));

      await react("✅");

      return reply(
        `➖ *CHANNEL REMOVED*\n\n` +
        `🆔 ${jid}\n\n` +
        `> _${botFooter}_`
      );
    } catch (err) {
      await react("❌");
      return reply(`❌ Error: ${err.message}`);
    }
  }
);

// FOLLOWCHANNELS
gmd(
  {
    pattern: "followchannels",
    aliases: ["rechannels", "refollowchannels", "followall"],
    react: "📡",
    category: "owner",
    description: "Re-follow all tracked channels"
  },
  async (from, Guru, conText) => {
    const {
      reply,
      react,
      isSuperUser,
      botFooter
    } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }

    try {
      const channels = await getAllChannels();
      let success = 0;
      let failed = 0;

      for (const jid of channels) {
        try {
          const result = await safeNewsletterFollow(Guru, jid);

          if (result) success++;
          else failed++;
        } catch (_) {
          failed++;
        }
      }

      await react("✅");

      return reply(
        `📡 *FOLLOW COMPLETE*\n\n` +
        `✅ Successful: ${success}\n` +
        `❌ Failed: ${failed}\n` +
        `📊 Total: ${channels.length}\n\n` +
        `> _${botFooter}_`
      );
    } catch (err) {
      await react("❌");
      return reply(`❌ Error: ${err.message}`);
    }
  }
);

// PROFESSOR EMOJIS
gmd(
  {
    pattern: "professoremojis",
    aliases: [
      "profemojis",
      "channelemojis",
      "reactemojis"
    ],
    react: "🎓",
    category: "owner",
    description: "View channel reaction emojis"
  },
  async (from, Guru, conText) => {
    const {
      reply,
      react,
      isSuperUser,
      botFooter
    } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }

    await react("✅");

    return reply(
      `🎓 *PROFESSOR REACT EMOJIS*\n\n` +
      `${PROFESSOR_EMOJIS.join("  ")}\n\n` +
      `📊 Total: ${PROFESSOR_EMOJIS.length}\n\n` +
      `> _${botFooter}_`
    );
  }
);

// SETMYCHANNEL — resolve invite link to channel JID
gmd(
  {
    pattern: "setmychannel",
    aliases: ["mychlink", "linkchannel"],
    react: "🔗",
    category: "owner",
    description: "Configure your channel from its invite link"
  },
  async (from, Guru, conText) => {
    const {
      reply,
      react,
      isSuperUser,
      botFooter
    } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }

    try {
      if (typeof Guru.newsletterMetadata !== "function") {
        return reply(
          "❌ This WhatsApp library does not expose " +
          "newsletterMetadata(). Check its version."
        );
      }

      const inviteCode = MY_CHANNEL_LINK
        .split("/channel/")[1]
        ?.split("?")[0];

      if (!inviteCode) {
        return reply("❌ Invalid channel invite link.");
      }

      const metadata = await Guru.newsletterMetadata(
        "invite",
        inviteCode
      );

      const jid = metadata?.id;

      if (!jid || !jid.endsWith("@newsletter")) {
        return reply("❌ Could not resolve channel JID.");
      }

      await setSetting("NEWSLETTER_JID", jid);

      const channels = await getCustomChannels();

      if (
        !OWNER_CHANNELS.includes(jid) &&
        !channels.includes(jid)
      ) {
        channels.push(jid);
        await setSetting("OWNER_CHANNELS", channels.join(","));
      }

      let followStatus;

      try {
        const result = await safeNewsletterFollow(Guru, jid);
        followStatus = result
          ? "✅ Follow request successful."
          : "⚠️ Follow not confirmed.";
      } catch (_) {
        followStatus = "⚠️ Could not follow automatically.";
      }

      await react("✅");

      return reply(
        `📡 *MNYANDWA-MD CHANNEL SAVED*\n\n` +
        `🔗 ${MY_CHANNEL_LINK}\n` +
        `🆔 ${jid}\n\n` +
        `${followStatus}\n\n` +
        `> _${botFooter}_`
      );
    } catch (err) {
      await react("❌");
      return reply(`❌ Setup failed: ${err.message}`);
    }
  }
);
const { gmd } = require("../kevo");
const {
  getSetting,
  setSetting
} = require("../luka/database/settings");

const {
  safeNewsletterFollow,
  OWNER_CHANNELS,
  PROFESSOR_EMOJIS
} = require("../guru/connection/connectionHandler");

// Your WhatsApp channel invite link
const MY_CHANNEL_LINK =
  "https://whatsapp.com/channel/0029VbEhfyDICVfdBoziED0t";

// Get custom channels saved in the database
async function getCustomChannels() {
  const saved = await getSetting("OWNER_CHANNELS");

  return saved
    ? [...new Set(
        saved
          .split(",")
          .map(jid => jid.trim())
          .filter(jid => jid.endsWith("@newsletter"))
      )]
    : [];
}

// Get all tracked channels
async function getAllChannels() {
  const custom = await getCustomChannels();

  return [
    ...new Set([
      ...OWNER_CHANNELS,
      ...custom
    ])
  ];
}

// CHANNELS
gmd(
  {
    pattern: "channels",
    aliases: [
      "mychannel",
      "mychannels",
      "channelinfo",
      "chinfo"
    ],
    react: "📡",
    category: "owner",
    description: "View all tracked WhatsApp channels"
  },
  async (from, Guru, conText) => {
    const {
      reply,
      react,
      isSuperUser,
      botFooter
    } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }

    try {
      const channels = await getAllChannels();

      let msg =
        `📡 *MNYANDWA-MD CHANNEL MANAGER*\n` +
        `${"─".repeat(30)}\n\n` +
        `🔗 *My Channel Link:*\n${MY_CHANNEL_LINK}\n\n` +
        `📊 *Total Channels:* ${channels.length}\n\n` +
        `📌 *TRACKED CHANNELS:*\n`;

      channels.forEach((jid, i) => {
        const builtIn = OWNER_CHANNELS.includes(jid);

        msg +=
          `\n${i + 1}. \`${jid}\`\n` +
          `   ${builtIn ? "🔒 Built-in" : "➕ Custom"}\n`;
      });

      msg +=
        `\n📘 *COMMANDS*\n` +
        `• .setmychannel\n` +
        `• .addchannel <jid>\n` +
        `• .removechannel <jid>\n` +
        `• .followchannels\n` +
        `• .channelpost <message>\n` +
        `• .channelstats\n\n` +
        `> _${botFooter}_`;

      await react("✅");
      return reply(msg);
    } catch (err) {
      await react("❌");
      return reply(`❌ Error: ${err.message}`);
    }
  }
);

// ADDCHANNEL
gmd(
  {
    pattern: "addchannel",
    aliases: ["setchannel", "trackchannel"],
    react: "➕",
    category: "owner",
    description: "Add a channel using its JID"
  },
  async (from, Guru, conText) => {
    const {
      reply,
      react,
      isSuperUser,
      q,
      botFooter
    } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }

    if (!q) {
      return reply(
        "❌ Provide a channel JID!\n" +
        "Example: .addchannel 120363406649804510@newsletter"
      );
    }

    const jid = q.trim();

    if (!/^\d+@newsletter$/.test(jid)) {
      return reply("❌ Invalid channel JID!");
    }

    try {
      const channels = await getCustomChannels();

      if (
        OWNER_CHANNELS.includes(jid) ||
        channels.includes(jid)
      ) {
        return reply("⚠️ Channel already exists!");
      }

      channels.push(jid);
      await setSetting("OWNER_CHANNELS", channels.join(","));

      let followMessage;

      try {
        const followed = await safeNewsletterFollow(Guru, jid);
        followMessage = followed
          ? "✅ Follow request successful."
          : "⚠️ Follow could not be confirmed.";
      } catch (_) {
        followMessage = "⚠️ Could not follow channel automatically.";
      }

      await react("✅");

      return reply(
        `📡 *CHANNEL ADDED*\n\n` +
        `🆔 ${jid}\n` +
        `${followMessage}\n\n` +
        `> _${botFooter}_`
      );
    } catch (err) {
      await react("❌");
      return reply(`❌ Error: ${err.message}`);
    }
  }
);

// REMOVECHANNEL
gmd(
  {
    pattern: "removechannel",
    aliases: ["delchannel", "untrackchannel"],
    react: "➖",
    category: "owner",
    description: "Remove a custom tracked channel"
  },
  async (from, Guru, conText) => {
    const {
      reply,
      react,
      isSuperUser,
      q,
      botFooter
    } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }

    if (!q) {
      return reply("❌ Provide a channel JID!");
    }

    const jid = q.trim();

    if (OWNER_CHANNELS.includes(jid)) {
      return reply("🔒 Built-in channels cannot be removed.");
    }

    try {
      const channels = await getCustomChannels();
      const updated = channels.filter(item => item !== jid);

      if (updated.length === channels.length) {
        return reply("⚠️ Channel not found in custom channels.");
      }

      await setSetting("OWNER_CHANNELS", updated.join(","));

      await react("✅");

      return reply(
        `➖ *CHANNEL REMOVED*\n\n` +
        `🆔 ${jid}\n\n` +
        `> _${botFooter}_`
      );
    } catch (err) {
      await react("❌");
      return reply(`❌ Error: ${err.message}`);
    }
  }
);

// FOLLOWCHANNELS
gmd(
  {
    pattern: "followchannels",
    aliases: ["rechannels", "refollowchannels", "followall"],
    react: "📡",
    category: "owner",
    description: "Re-follow all tracked channels"
  },
  async (from, Guru, conText) => {
    const {
      reply,
      react,
      isSuperUser,
      botFooter
    } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }

    try {
      const channels = await getAllChannels();
      let success = 0;
      let failed = 0;

      for (const jid of channels) {
        try {
          const result = await safeNewsletterFollow(Guru, jid);

          if (result) success++;
          else failed++;
        } catch (_) {
          failed++;
        }
      }

      await react("✅");

      return reply(
        `📡 *FOLLOW COMPLETE*\n\n` +
        `✅ Successful: ${success}\n` +
        `❌ Failed: ${failed}\n` +
        `📊 Total: ${channels.length}\n\n` +
        `> _${botFooter}_`
      );
    } catch (err) {
      await react("❌");
      return reply(`❌ Error: ${err.message}`);
    }
  }
);

// PROFESSOR EMOJIS
gmd(
  {
    pattern: "professoremojis",
    aliases: [
      "profemojis",
      "channelemojis",
      "reactemojis"
    ],
    react: "🎓",
    category: "owner",
    description: "View channel reaction emojis"
  },
  async (from, Guru, conText) => {
    const {
      reply,
      react,
      isSuperUser,
      botFooter
    } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }

    await react("✅");

    return reply(
      `🎓 *PROFESSOR REACT EMOJIS*\n\n` +
      `${PROFESSOR_EMOJIS.join("  ")}\n\n` +
      `📊 Total: ${PROFESSOR_EMOJIS.length}\n\n` +
      `> _${botFooter}_`
    );
  }
);

// SETMYCHANNEL — resolve invite link to channel JID
gmd(
  {
    pattern: "setmychannel",
    aliases: ["mychlink", "linkchannel"],
    react: "🔗",
    category: "owner",
    description: "Configure your channel from its invite link"
  },
  async (from, Guru, conText) => {
    const {
      reply,
      react,
      isSuperUser,
      botFooter
    } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }

    try {
      if (typeof Guru.newsletterMetadata !== "function") {
        return reply(
          "❌ This WhatsApp library does not expose " +
          "newsletterMetadata(). Check its version."
        );
      }

      const inviteCode = MY_CHANNEL_LINK
        .split("/channel/")[1]
        ?.split("?")[0];

      if (!inviteCode) {
        return reply("❌ Invalid channel invite link.");
      }

      const metadata = await Guru.newsletterMetadata(
        "invite",
        inviteCode
      );

      const jid = metadata?.id;

      if (!jid || !jid.endsWith("@newsletter")) {
        return reply("❌ Could not resolve channel JID.");
      }

      await setSetting("NEWSLETTER_JID", jid);

      const channels = await getCustomChannels();

      if (
        !OWNER_CHANNELS.includes(jid) &&
        !channels.includes(jid)
      ) {
        channels.push(jid);
        await setSetting("OWNER_CHANNELS", channels.join(","));
      }

      let followStatus;

      try {
        const result = await safeNewsletterFollow(Guru, jid);
        followStatus = result
          ? "✅ Follow request successful."
          : "⚠️ Follow not confirmed.";
      } catch (_) {
        followStatus = "⚠️ Could not follow automatically.";
      }

      await react("✅");

      return reply(
        `📡 *MNYANDWA-MD CHANNEL SAVED*\n\n` +
        `🔗 ${MY_CHANNEL_LINK}\n` +
        `🆔 ${jid}\n\n` +
        `${followStatus}\n\n` +
        `> _${botFooter}_`
      );
    } catch (err) {
      await react("❌");
      return reply(`❌ Setup failed: ${err.message}`);
    }
  }
);
