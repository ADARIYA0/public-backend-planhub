// src/services/emailService.js
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // alamat gmail (contoh: your@gmail.com)
    pass: process.env.EMAIL_PASS  // app password Gmail (lihat instruksi di bawah)
  }
});

// verify transporter at startup (opsional)
transporter.verify((err, success) => {
  if (err) {
    logger.error(`Email transporter verify failed: ${err.message}`);
  } else {
    logger.info('Email transporter ready');
  }
});

async function sendOtpEmail(to, otp, expiresMinutes = 15) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: 'Kode Verifikasi (OTP) - Aplikasi',
    text:
`Halo,

Kode verifikasi (OTP) Anda adalah: ${otp}

Kode ini berlaku selama ${expiresMinutes} menit.

Jika Anda tidak meminta kode ini, abaikan email ini.
`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${to} (messageId=${info.messageId})`);
    return info;
  } catch (error) {
    logger.error(`Failed to send OTP email to ${to}: ${error.message}`);
    throw error;
  }
}

module.exports = { sendOtpEmail };
