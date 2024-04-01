// Import library yang diperlukan
const { useMultiFileAuthState, makeWASocket, logger } = require('./library'); // Sesuaikan dengan library yang Anda gunakan
const { generateNewAuth, saveCreds } = require('./authFunctions'); // Sesuaikan dengan fungsi autentikasi Anda

// Fungsi logout
async function logout() {
  // Memberhentikan logger (jika ada)
  logger.stop();

  // Mengubah status menjadi logout
  state.status = "logout";

  // Menunggu 1 nano detik
  await new Promise((resolve) => setTimeout(resolve, 1));

  // Menghasilkan QR code
  const newAuth = await generateNewAuth(); // Fungsi untuk menghasilkan auth baru
  const { state: newState } = await useMultiFileAuthState("sessions");
  newState.auth = newAuth;
  saveCreds(newState.auth);

  const newClient = makeWASocket({
    auth: newAuth,
    printQRInTerminal: true,
    logger
  });
}

// Mengeksekusi logout jika script dijalankan dengan perintah "node logout"
if (process.argv[1].endsWith("logout.js")) {
  logout().then(() => {
    console.log('User telah logout');
  });
}
