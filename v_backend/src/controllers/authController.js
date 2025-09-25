// src/controllers/authController.js
const { user, role } = require('../models');
const { generateToken } = require('../utils/jwtUtils');
// const { sendPasswordResetEmail } = require('../utils/emailUtils');
const {sendPasswordResetEmail} = require('../emailUtils');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');


/**
 * Register a new user (customer only)
 */
exports.register = async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    const { email, password, firstname, lastname } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Ensure firstname and lastname are not null (use empty string if not provided)
    const userFirstname = firstname || "";
    const userLastname = lastname || "";
    
    // Check if user already exists
    const existinguser = await user.findOne({ where: { email } });
    if (existinguser) {
      return res.status(409).json({ message: 'user with this email already exists' });
    }
    
    // Get the customer role id
    const customerrole = await role.findOne({ where: { name: 'customer' } });
    if (!customerrole) {
      return res.status(500).json({ message: 'Customer role not found' });
    }
    
    // Create the new user with validated firstname and lastname
    const newuser = await user.create({
      firstname: userFirstname,
      lastname: userLastname,
      email,
      password,
      roleid: customerrole.id
    });
    
    // Generate JWT token
    const token = generateToken({
      id: newuser.id,
      email: newuser.email,
      roleid: newuser.roleid
    });

    // Set Token in HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    return res.status(201).json({
      message: 'user registered successfully',
      token,
      user: {
        id: newuser.id,
        firstname: newuser.firstname,
        lastname: newuser.lastname,
        email: newuser.email,
        role: 'customer'
      },
      redirectTo: '/customer/dashboard' // Redirect URL for frontend
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * user login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find the user
    const userRecord = await user.findOne({
      where: { email },
      include: [{ model: role }]
    });
    
    // Check if user exists and password is correct
    if (!userRecord || !(await userRecord.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if user is active
    if (userRecord.isactive === false) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    
    // Generate JWT token
    const token = generateToken({
      id: userRecord.id,
      email: userRecord.email,
      roleid: userRecord.roleid
    });

    // Set Token in HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Determine redirect URL based on role
    const redirectTo = userRecord.role.name === 'admin' ? '/admin/dashboard' : '/customer/dashboard';
    
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: userRecord.id,
        firstname: userRecord.firstname,
        lastname: userRecord.lastname,
        email: userRecord.email,
        role: userRecord.role.name
      },
      redirectTo
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const userRecord = await user.findByPk(req.user.id, {
      include: [{ model: role }],
      attributes: { exclude: ['password'] }
    });
    
    if (!userRecord) {
      return res.status(404).json({ message: 'user not found' });
    }
    
    return res.status(200).json({
      user: {
        id: userRecord.id,
        firstname: userRecord.firstname,
        lastname: userRecord.lastname,
        email: userRecord.email,
        role: userRecord.role.name,
        createdAt: userRecord.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getallusers = async (req, res) => {
  try {
    const users = await user.findAll({
      attributes: { exclude: ['password'] },
      include: [{ model: role }]
    });
    
    return res.status(200).json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * user logout
 */
exports.logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  return res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * Forgot Password - Send reset email
 */
exports.forgotPassword = async (req, res) => {
  try {
    console.log('Forgot password request received:', req.body);
    const { email } = req.body;
    
    if (!email) {
      console.log('No email provided');
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('Looking for user with email:', email);
    // Find user by email
    const userRecord = await user.findOne({ where: { email } });
    
    if (!userRecord) {
      console.log('User not found for email:', email);
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        message: 'If an account with that email exists, we have sent a password reset link.' 
      });
    }

    console.log('User found:', userRecord.id);
    
    // Generate 6-digit OTP
    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP');
    
    // Set OTP expiration (10 minutes from now)
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    console.log('Updating user with OTP...');
    await userRecord.update({
      resetOTP: resetOTP,
      resetOTPExpires: otpExpires
    });
    console.log('User updated with OTP');

    console.log("🔢 Generated OTP:", resetOTP);

    // Nodemailer function to send OTP
    defaultTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    async function sendOTPWithNodemailer(toEmail, otp) {
      const mailOptions = {
        from: `Virtual Ecom <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: '🔐 Password Reset OTP - Virtual Ecom',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset OTP</h2>
            <p>Hello,</p>
            <p>You requested a password reset. Use the OTP below to reset your password:</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p style="margin-top: 30px;">Thanks,<br>Virtual Ecom Team</p>
          </div>
        `
      };
      await defaultTransporter.sendMail(mailOptions);
    }

    // Always send OTP to the user's email
    try {
      await sendOTPWithNodemailer(email, resetOTP);
      return res.status(200).json({
        message: 'Password reset OTP has been sent to your email'
      });
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      // Clear the OTP if email fails
      await userRecord.update({
        resetOTP: null,
        resetOTPExpires: null
      });
      return res.status(500).json({
        message: 'Failed to send reset OTP. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verify OTP for password reset
 */
exports.verifyOTP = async (req, res) => {
  try {
    console.log('Verify OTP request received:', req.body);
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      console.log('Missing email or OTP');
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    console.log('Looking for user with email:', email);
    // Find user by email
    const userRecord = await user.findOne({ where: { email } });
    
    if (!userRecord) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: 'Invalid email or OTP' });
    }

    console.log('User found:', userRecord.id);
    console.log('Stored OTP:', userRecord.resetOTP);
    console.log('Provided OTP:', otp);
    console.log('OTP Expires:', userRecord.resetOTPExpires);
    
    // Check if OTP exists and hasn't expired
    if (!userRecord.resetOTP || !userRecord.resetOTPExpires) {
      console.log('No OTP found for user');
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }
    
    // Check if OTP has expired
    if (new Date() > userRecord.resetOTPExpires) {
      console.log('OTP has expired');
      // Clear expired OTP
      await userRecord.update({
        resetOTP: null,
        resetOTPExpires: null
      });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    
    // Verify OTP
    if (userRecord.resetOTP !== otp) {
      console.log('Invalid OTP provided');
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    console.log('OTP verified successfully');
    return res.status(200).json({ 
      message: 'OTP verified successfully',
      email: email // Return email for the next step
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Reset Password - Verify OTP and update password
 */
exports.resetPassword = async (req, res) => {
  try {
    console.log('Reset password request received:', req.body);
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    console.log('Looking for user with email:', email);
    // Find user by email
    const userRecord = await user.findOne({ where: { email } });

    if (!userRecord) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: 'Invalid email or OTP' });
    }

    console.log('User found:', userRecord.id);
    console.log('Stored OTP:', userRecord.resetOTP);
    console.log('Provided OTP:', otp);
    
    // Check if OTP exists and hasn't expired
    if (!userRecord.resetOTP || !userRecord.resetOTPExpires) {
      console.log('No OTP found for user');
      return res.status(400).json({ message: 'No valid OTP found. Please request a new one.' });
    }
    
    // Check if OTP has expired
    if (new Date() > userRecord.resetOTPExpires) {
      console.log('OTP has expired');
      // Clear expired OTP
      await userRecord.update({
        resetOTP: null,
        resetOTPExpires: null
      });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    
    // Verify OTP
    if (userRecord.resetOTP !== otp) {
      console.log('Invalid OTP provided');
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    console.log('OTP verified, updating password...');
    // Update password and clear OTP
    await userRecord.update({
      password: newPassword, // This will be hashed by the beforeUpdate hook
      resetOTP: null,
      resetOTPExpires: null
    });

    console.log('Password updated successfully');
    return res.status(200).json({ 
      message: 'Password has been reset successfully. You can now login with your new password.' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Verify Reset Token - Check if token is valid
 */
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (jwtError) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Find user and verify reset token
    const userRecord = await user.findOne({
      where: {
        id: decoded.userId,
        email: decoded.email,
        resetPasswordToken: decoded.resetToken
      }
    });

    if (!userRecord) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    // Check if token has expired
    if (!userRecord.resetPasswordExpires || new Date() > userRecord.resetPasswordExpires) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    return res.status(200).json({ 
      message: 'Token is valid',
      email: userRecord.email 
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};