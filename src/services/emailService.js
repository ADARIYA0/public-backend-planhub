const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
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
    subject: 'Kode Verifikasi Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; background-color: #fafafa;">
        <h2 style="text-align: center; color: #333;">🔒 Verifikasi Akun Anda</h2>
        <p style="font-size: 16px; color: #555;">
          Halo,<br><br>
          Terima kasih telah mendaftar di aplikasi kami. 
          Gunakan kode OTP berikut untuk menyelesaikan proses verifikasi akun Anda:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #2e86de; letter-spacing: 5px;">
            ${otp}
          </span>
        </div>
        
        <p style="font-size: 16px; color: #555;">
          Kode ini berlaku selama <b>${expiresMinutes} menit</b>. 
          Jangan bagikan kode ini kepada siapapun demi keamanan akun Anda.
        </p>

        <p style="font-size: 14px; color: #888; margin-top: 30px;">
          Jika Anda tidak melakukan permintaan ini, abaikan email ini.
        </p>

        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />

        <p style="font-size: 12px; color: #aaa; text-align: center;">
          &copy; ${new Date().getFullYear()} PT PlanHub Kreatif Nusantara. Semua Hak Dilindungi.
        </p>
      </div>
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
