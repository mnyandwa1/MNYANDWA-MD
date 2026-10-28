import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  jidNormalizedUser,
} from "@whiskeysockets/baileys";
import pino from "pino";
import readline from "node:readline";
import os from "node:os";

const CONFIG = {
  name: "MNYANDWA-MD",
  version: "2.0.0",
  prefix: process.env.PREFIX || ".",
  ownerName: process.env.OWNER_NAME || "MNYANDWA",
  // Put your number here with country code, digits only, e.g. 2557XXXXXXXX.
  // Or set OWNER_NUMBER as an environment variable on your host.
  ownerNumber: (process.env.OWNER_NUMBER || "").replace(/\D/g, ""),
  sessionDir: process.env.SESSION_DIR || "./session",
  timezone: process.env.TZ || "Africa/Dar_es_Salaam",
};

const logger = pino({ level: process.env.LOG_LEVEL || "silent" });
const startedAt = Date.now();
let reconnecting = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function uptimeText() {
  let seconds = Math.floor((Date.now() - startedAt) / 1000);
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  return [
    days ? `${days}d` : null,
    hours ? `${hours}h` : null,
    minutes ? `${minutes}m` : null,
    `${seconds}s`,
  ].filter(Boolean).join(" ");
}

function getText(message) {
  let msg = message?.message;
  if (!msg) return "";
  msg = msg.ephemeralMessage?.message || msg;
  msg = msg.viewOnceMessage?.message || msg;
  msg = msg.viewOnceMessageV2?.message || msg;
  msg = msg.documentWithCaptionMessage?.message || msg;

  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.buttonsResponseMessage?.selectedButtonId ||
    msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg.templateButtonReplyMessage?.selectedId ||
    ""
  ).trim();
}

function dateTimeText() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: CONFIG.timezone,
    dateStyle: "full",
  }).format(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: CONFIG.timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
  return `${date}\n${time} EAT`;
}

function menuText() {
  const p = CONFIG.prefix;
  return [
    `╭━━━〔 ⚡ ${CONFIG.name} 〕━━━╮`,
    `┃ 🤖 Version: ${CONFIG.version}`,
    `┃ 📌 Prefix: ${p}`,
    "┣━━━━━━━━━━━━━━━━━━",
    "┃ 📋 GENERAL",
    `┃ ${p}menu — Show this menu`,
    `┃ ${p}ping — Check response speed`,
    `┃ ${p}alive — Check bot status`,
    `┃ ${p}uptime — Show online time`,
    `┃ ${p}botinfo — Bot information`,
    `┃ ${p}owner — Owner information`,
    `┃ ${p}date — Date and time`,
    `┃ ${p}jid — Chat and sender IDs`,
    "┣━━━━━━━━━━━━━━━━━━",
    "┃ 👥 GROUPS",
    `┃ ${p}groupinfo — Group details`,
    `┃ ${p}tagall — Mention all members (admin)`,
    `┃ ${p}hidetag — Hidden mention all (admin)`,
    "┣━━━━━━━━━━━━━━━━━━",
    "┃ 🖥️ SYSTEM",
    `┃ ${p}system — Runtime information`,
    `┃ ${p}ram — Memory usage`,
    "╰━━━━━━━━━━━━━━━━━━",
    `✨ ${CONFIG.name} • Fast • Smart • Online`,
  ].join("\n");
}

async function isGroupAdmin(sock, groupJid, senderJid) {
  const metadata = await sock.groupMetadata(groupJid);
  const participant = metadata.participants.find(
    (item) => jidNormalizedUser(item.id) === jidNormalizedUser(senderJid)
  );
  return {
    metadata,
    isAdmin: Boolean(participant?.admin),
    isBotAdmin: Boolean(
      metadata.participants.find(
        (item) => jidNormalizedUser(item.id) === jidNormalizedUser(sock.user.id)
          && item.admin
      )
    ),
  };
}

async function handleCommand(sock, message) {
  const jid = message.key.remoteJid;
  if (!jid || jid === "status@broadcast") return;
  if (message.key.fromMe) {
    // Owner can still run commands from the bot's linked WhatsApp account.
  }

  const text = getText(message);
  if (!text.startsWith(CONFIG.prefix)) return;

  const senderJid = message.key.participant || message.key.remoteJid;
  const isGroup = jid.endsWith("@g.us");
  const [rawCommand, ...args] = text.slice(CONFIG.prefix.length).trim().split(/\s+/);
  const command = (rawCommand || "").toLowerCase();
  const argumentText = args.join(" ");
  const start = Date.now();

  if (!command) return;

  try {
    switch (command) {
      case "menu":
      case "help":
      case "commands":
        await sock.sendMessage(jid, { text: menuText() }, { quoted: message });
        break;

      case "ping":
      case "p":
        await sock.sendMessage(jid, {
          text: `⚡ *${CONFIG.name} PONG!*\nResponse: ${Date.now() - start} ms\nStatus: 🟢 Online`,
        }, { quoted: message });
        break;

      case "alive":
        await sock.sendMessage(jid, {
          text: `╭━━〔 🟢 ${CONFIG.name} 〕━━╮\n┃ Status: Online\n┃ Version: ${CONFIG.version}\n┃ Uptime: ${uptimeText()}\n╰━━━━━━━━━━━━━━━━━━╯`,
        }, { quoted: message });
        break;

      case "uptime":
      case "runtime":
        await sock.sendMessage(jid, {
          text: `⏱️ *${CONFIG.name} UPTIME*\n${uptimeText()}`,
        }, { quoted: message });
        break;

      case "botinfo":
      case "info":
      case "about":
        await sock.sendMessage(jid, {
          text: `╭━━〔 🤖 ${CONFIG.name} 〕━━╮\n┃ Version: ${CONFIG.version}\n┃ Prefix: ${CONFIG.prefix}\n┃ Owner: ${CONFIG.ownerName}\n┃ Library: Baileys\n┃ Uptime: ${uptimeText()}\n╰━━━━━━━━━━━━━━━━━━╯`,
        }, { quoted: message });
        break;

      case "owner": {
        const ownerJid = CONFIG.ownerNumber ? `${CONFIG.ownerNumber}@s.whatsapp.net` : "";
        await sock.sendMessage(jid, {
          text: `👑 *${CONFIG.name} OWNER*\nName: ${CONFIG.ownerName}\n${ownerJid ? `WhatsApp: @${CONFIG.ownerNumber}` : "Set OWNER_NUMBER to display the owner's WhatsApp number."}`,
          ...(ownerJid ? { mentions: [ownerJid] } : {}),
        }, { quoted: message });
        break;
      }

      case "date":
      case "time":
        await sock.sendMessage(jid, {
          text: `📅 *${CONFIG.name} DATE & TIME*\n${dateTimeText()}`,
        }, { quoted: message });
        break;

      case "jid":
        await sock.sendMessage(jid, {
          text: `🆔 *CHAT ID*\n${jid}\n\n*SENDER ID*\n${senderJid}`,
        }, { quoted: message });
        break;

      case "groupinfo": {
        if (!isGroup) {
          await sock.sendMessage(jid, { text: "⚠️ Command hii inafanya kazi ndani ya group tu." }, { quoted: message });
          break;
        }
        const metadata = await sock.groupMetadata(jid);
        await sock.sendMessage(jid, {
          text: `👥 *GROUP INFO*\nName: ${metadata.subject || "Unknown"}\nMembers: ${metadata.participants.length}\nCreated: ${metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString("en-GB") : "Unknown"}\nDescription: ${metadata.desc || "No description"}`,
        }, { quoted: message });
        break;
      }

      case "tagall":
      case "hidetag": {
        if (!isGroup) {
          await sock.sendMessage(jid, { text: "⚠️ Command hii inafanya kazi ndani ya group tu." }, { quoted: message });
          break;
        }
        const { metadata, isAdmin, isBotAdmin } = await isGroupAdmin(sock, jid, senderJid);
        if (!isAdmin) {
          await sock.sendMessage(jid, { text: "⛔ Admin wa group pekee ndiye anayeweza kutumia command hii." }, { quoted: message });
          break;
        }

        const mentions = metadata.participants.map((participant) => participant.id);
        if (command === "tagall") {
          const lines = mentions.map((id, index) => `${index + 1}. @${id.split("@")[0]}`);
          await sock.sendMessage(jid, {
            text: `📣 *MNYANDWA-MD TAG ALL*\n${argumentText ? `Message: ${argumentText}\n\n` : ""}${lines.join("\n")}`,
            mentions,
          }, { quoted: message });
        } else {
          await sock.sendMessage(jid, {
            text: argumentText || "📢 Attention everyone!",
            mentions,
          }, { quoted: message });
        }
        break;
      }

      case "system": {
        const memory = process.memoryUsage();
        await sock.sendMessage(jid, {
          text: `🖥️ *SYSTEM INFO*\nPlatform: ${os.platform()}\nArchitecture: ${os.arch()}\nCPU cores: ${os.cpus().length}\nNode.js: ${process.version}\nProcess uptime: ${uptimeText()}\nRSS memory: ${(memory.rss / 1024 / 1024).toFixed(1)} MB`,
        }, { quoted: message });
        break;
      }

      case "ram": {
        const total = os.totalmem();
        const free = os.freemem();
        await sock.sendMessage(jid, {
          text: `💾 *SERVER MEMORY*\nTotal: ${(total / 1024 ** 3).toFixed(2)} GB\nUsed: ${((total - free) / 1024 ** 3).toFixed(2)} GB\nFree: ${(free / 1024 ** 3).toFixed(2)} GB\nBot RSS: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB`,
        }, { quoted: message });
        break;
      }

      default:
        // Unknown commands are ignored to avoid spamming chats.
        break;
    }
  } catch (error) {
    console.error(`Command "${command}" failed:`, error?.message || error);
    await sock.sendMessage(jid, {
      text: "❌ Command imepata hitilafu. Angalia logs za bot kisha ujaribu tena.",
    }, { quoted: message }).catch(() => {});
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(CONFIG.sessionDir);

  let version;
  try {
    const latest = await fetchLatestBaileysVersion();
    version = latest.version;
  } catch {
    console.warn("⚠️ Imeshindikana kupata WhatsApp Web version; Baileys itatumia default.");
  }

  const sock = makeWASocket({
    ...(version ? { version } : {}),
    auth: state,
    logger,
    browser: Browsers.ubuntu(CONFIG.name),
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      reconnecting = false;
      console.log(`\n✅ ${CONFIG.name} imeunganishwa WhatsApp!`);
      console.log(`🤖 Version: ${CONFIG.version}`);
      console.log(`📌 Prefix: ${CONFIG.prefix}`);
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log("⚠️ Connection imefungwa:", statusCode || "unknown");

      if (shouldReconnect && !reconnecting) {
        reconnecting = true;
        setTimeout(() => {
          reconnecting = false;
          startBot().catch((error) => console.error("Reconnect error:", error));
        }, 3000);
      } else if (!shouldReconnect) {
        console.error("Session imelogout. Futa session folder na pair tena ikiwa unataka kuunganisha upya.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const message of messages) {
      if (!message.message) continue;
      await handleCommand(sock, message);
    }
  });

  if (!state.creds.registered) {
    let number = CONFIG.ownerNumber;
    if (!number) {
      number = (await ask("Weka namba ya WhatsApp yenye country code (mfano 2557XXXXXXXX), bila +: ")).replace(/\D/g, "");
    }

    if (!/^\d{10,15}$/.test(number)) {
      console.error("❌ Namba si sahihi. Tumia country code, namba pekee; mfano 2557XXXXXXXX.");
      process.exit(1);
    }

    try {
      const code = await sock.requestPairingCode(number);
      console.log("\n════════════════════════════════════");
      console.log(`🔐 ${CONFIG.name} PAIRING CODE: ${code}`);
      console.log("════════════════════════════════════");
      console.log("WhatsApp > Linked devices > Link a device > Link with phone number");
      console.log("Ingiza code hapo juu kwenye simu yako.");
      console.log("Usimpe mtu mwingine pairing code au session files zako.\n");
    } catch (error) {
      console.error("❌ Pairing code imeshindikana:", error?.message || error);
      console.error("Jaribu tena baada ya muda mfupi na hakikisha namba imeandikwa vizuri.");
    }
  }
}

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

console.log(`\n⚡ Starting ${CONFIG.name} v${CONFIG.version}...`);
startBot().catch((error) => {
  console.error("❌ Bot failed to start:", error);
  process.exit(1);
});
