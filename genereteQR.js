const QRCode = require('qrcode');
const fs = require('fs');

const data = 'Contoh data untuk QR code'; // Data yang akan dijadikan QR code
const outputPath = './output/qr_code.png'; // Path untuk menyimpan QR code

QRCode.toFile(outputPath, data, (err) => {
    if (err) throw err;
    console.log('QR code berhasil dibuat');
});
