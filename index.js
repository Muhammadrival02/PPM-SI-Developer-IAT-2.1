const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  delay,
} = require("@whiskeysockets/baileys");
const logger = require("pino")({ level: "silent" });
const { Boom } = require("@hapi/boom");
require('dotenv').config()
const API_KEY = process.env.API_KEY;

async function run() {
  const { state, saveCreds } = await useMultiFileAuthState("sessions");
  const client = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger,
  });
  
async function stopAndLogout() {
    // Menghentikan logger (misalnya dengan menghentikan pengaturan interval, dll.)
    logger.stop(); // Anda perlu mengganti ini sesuai dengan implementasi logger Anda
    
    // Mengubah status menjadi logout
    const newState = { loggedIn: false }; // Misalnya, Anda perlu mengganti ini sesuai dengan implementasi state Anda
    
    // Simpan status yang baru
    saveCreds(newState); // Anda perlu mengganti ini sesuai dengan implementasi saveCreds Anda

    // Mengenerate ulang QR code
    const newData = 'Data baru untuk QR code'; // Misalnya, data baru yang ingin Anda gunakan
    const newOutputPath = './output/new_qr_code.png'; // Misalnya, path baru untuk menyimpan QR code yang baru

    QRCode.toFile(newOutputPath, newData, (err) => {
        if (err) throw err;
        console.log('QR code baru berhasil dibuat');
    });
}

  //   connection
  client.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      if (
        new Boom(lastDisconnect.error).output?.statusCode ===
        DisconnectReason.loggedOut
      ) {
        client.logout();
        console.log("Logged out...");
      } else {
        run();
      }
    } else {
      console.log("BOT Running...");
    }
  });
  //   save creds
  client.ev.on("creds.update", saveCreds);

  //   message
  client.ev.on("messages.upsert", async (msg) => {
    try {
      if (!msg.messages) return;
      const m = msg.messages[0];
      if (m.key.fromMe) return;
      var from = m.key.remoteJid;
      let type = Object.keys(m.message)[0];
      const body =
        type === "conversation"
          ? m.message.conversation
          : type == "imageMessage"
            ? m.message.imageMessage.caption
            : type == "videoMessage"
              ? m.message.videoMessage.caption
              : type == "extendedTextMessage"
                ? m.message.extendedTextMessage.text
                : type == "buttonsResponseMessage"
                  ? m.message.buttonsResponseMessage.selectedButtonId
                  : type == "listResponseMessage"
                    ? m.message.listResponseMessage.singleSelectReply.selectedRowId
                    : type == "templateButtonReplyMessage"
                      ? m.message.templateButtonReplyMessage.selectedId
                      : type === "messageContextInfo"
                        ? m.message.listResponseMessage.singleSelectReply.selectedRowId ||
                        m.message.buttonsResponseMessage.selectedButtonId ||
                        m.text
                        : "";
      global.reply = async (text) => {
        await client.sendPresenceUpdate("composing", from);
        return client.sendMessage(from, { text }, { quoted: m });
      };

      //   auto reply
      if (body) {
        if (process.env.API_KEY == "SET_TOKEN_HERE")
          return reply(`Harap set token dahulu pada folder:\n*src/config.js*`);
        if (body.length < 10) return reply("Minimal 10 karakter!");
        const openAi = require("./lib/openai.js");
        try {
          const result = await openAi(body);
          await delay(2000);
          return reply(result.hasil)
        } catch (e) {
          console.log(e);
          await reply("Ups.. ada yang error nih :(");
        }
      }
    } catch (error) {
      console.log(error);
    }
  });
}

// running bot
try {
  run();
} catch (e) {
  console.log(e);
}
