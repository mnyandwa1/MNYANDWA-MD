// MNYANDWA-MD — SET MY CHANNEL FROM LINK
gmd(
  {
    pattern: "setmychannel",
    aliases: ["mychlink", "linkchannel"],
    react: "📡",
    category: "owner",
    description: "Configure my WhatsApp channel using its invite link",
  },
  async (from, Guru, conText) => {
    const { reply, react, isSuperUser, botFooter } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }

    const channelLink =
      "https://whatsapp.com/channel/0029VbEhfyDICVfdBoziED0t";

    try {
      const inviteCode = channelLink.split("/channel/")[1]
        ?.split("?")[0]
        ?.trim();

      if (!inviteCode) {
        return reply("❌ Invalid WhatsApp channel link.");
      }

      if (typeof Guru.newsletterMetadata !== "function") {
        return reply(
          "❌ Your WhatsApp library does not support " +
          "newsletterMetadata(). Check the Baileys version."
        );
      }

      const metadata = await Guru.newsletterMetadata(
        "invite",
        inviteCode
      );

      const jid = metadata?.id;

      if (!jid || !jid.endsWith("@newsletter")) {
        return reply(
          "❌ Could not retrieve the channel JID. " +
          "Check your WhatsApp connection and library version."
        );
      }

      await setSetting("NEWSLETTER_JID", jid);

      // Add to custom tracked channels if not already present.
      const saved = await getSetting("OWNER_CHANNELS");
      const channels = saved
        ? saved.split(",").map(j => j.trim()).filter(Boolean)
        : [];

      if (!OWNER_CHANNELS.includes(jid) && !channels.includes(jid)) {
        channels.push(jid);
        await setSetting("OWNER_CHANNELS", channels.join(","));
      }

      let followMessage = "";

      try {
        const followed = await safeNewsletterFollow(Guru, jid);
        followMessage = followed
          ? "✅ Follow request successful."
          : "⚠️ Follow could not be confirmed; check manually.";
      } catch (_) {
        followMessage = "⚠️ Follow failed; check the connection.";
      }

      await react("✅");
      return reply(
        `📡 *MNYANDWA-MD CHANNEL CONFIGURED*\n\n` +
        `🔗 Link: ${channelLink}\n` +
        `🆔 JID: ${jid}\n\n` +
        `💾 Settings saved successfully.\n` +
        `${followMessage}\n\n` +
        `> _${botFooter}_`
      );
    } catch (err) {
      await react("❌");
      return reply(`❌ Channel setup failed: ${err.message}`);
    }
  }
);
