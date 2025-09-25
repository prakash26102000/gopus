// emailutils.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Missing email credentials in .env');
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transporter verification failed:', error.message);
    } else {
      console.log('✅ Email transporter is ready');
    }
  });

  return transporter;
};

const sendPasswordResetEmail = async (email, resetToken, userFirstname) => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email transporter not configured.');
  }

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"carmelprakash02@gmail.com" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Password Reset Request - Virtual Ecom',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hello ${userFirstname || 'User'},</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display:inline-block;background:#007bff;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Reset Password</a>
        <p>This link will expire in 1 hour. If you didn't request it, please ignore this email.</p>
        <p style="margin-top:20px;">Thanks,<br>Virtual Ecom Team</p>
      </div>
    `
  };

  try {
    console.log('📤 Sending email to:', email);
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', result.messageId);
    return { success: true, messageId: result.messageId, resetUrl };
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return {
      success: false,
      error: 'Failed to send email. Check credentials or internet.',
      resetUrl
    };
  }
};

module.exports = {
  sendPasswordResetEmail
};
