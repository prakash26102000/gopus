# Forgot Password Feature - Complete Setup Guide

## Overview
This implementation provides a secure JWT-based password reset system with email notifications using Nodemailer.

## Features Implemented

### Backend Features:
- ✅ JWT-based reset tokens with 1-hour expiration
- ✅ Secure token storage in database
- ✅ Email sending with HTML templates
- ✅ Password strength validation
- ✅ Token verification endpoints
- ✅ Secure password hashing

### Frontend Features:
- ✅ Responsive forgot password form
- ✅ Email validation
- ✅ Reset password form with strength indicator
- ✅ Token verification
- ✅ Success/error handling with modals
- ✅ Password match validation

## Setup Instructions

### 1. Database Migration
The migration has already been run, but if you need to run it again:
```bash
cd v_backend
npm run db:migrate
```

### 2. Email Configuration
Update your `.env` file in `v_backend` with your email credentials:

```env
# Email Configuration for Password Reset
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

#### For Gmail Setup:
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in `EMAIL_PASS`

#### For Other Email Providers:
Update the transporter configuration in `v_backend/src/utils/emailUtils.js`:
```javascript
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: 'your-smtp-host.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};
```

### 3. Start the Servers

#### Backend:
```bash
cd v_backend
npm start
```

#### Frontend:
```bash
cd v_Frontend
npm run dev
```

## API Endpoints

### 1. Forgot Password
**POST** `/api/auth/forgot-password`
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset link has been sent to your email"
}
```

### 2. Verify Reset Token
**GET** `/api/auth/verify-reset-token/:token`

**Response:**
```json
{
  "message": "Token is valid",
  "email": "user@example.com"
}
```

### 3. Reset Password
**POST** `/api/auth/reset-password`
```json
{
  "token": "jwt-token-here",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

## Frontend Routes

- `/forgotpassword` - Forgot password form
- `/reset-password?token=<jwt-token>` - Reset password form

## Security Features

### Backend Security:
1. **JWT Token Expiration**: Tokens expire after 1 hour
2. **Database Token Storage**: Reset tokens are stored and verified in database
3. **Password Hashing**: Passwords are hashed using bcrypt before storage
4. **Email Validation**: Server-side email format validation
5. **Rate Limiting**: Prevents spam requests (can be enhanced)

### Frontend Security:
1. **Token Validation**: Verifies token before showing reset form
2. **Password Strength**: Visual password strength indicator
3. **Input Validation**: Client-side validation for better UX
4. **Secure Routing**: Public routes for unauthenticated users

## Email Template Features

The email includes:
- Professional HTML design
- Security warnings and instructions
- Clickable reset button
- Fallback URL for manual copy-paste
- 1-hour expiration notice
- Branded with your app name

## Testing the Feature

### 1. Test Forgot Password Flow:
1. Go to `/login`
2. Click "Forgot Password?"
3. Enter a valid email address
4. Check your email for the reset link
5. Click the reset link or copy-paste the URL
6. Enter a new password
7. Confirm the password reset
8. Login with the new password

### 2. Test Error Scenarios:
- Invalid email format
- Non-existent email address
- Expired token
- Invalid token
- Password mismatch
- Weak passwords

## Troubleshooting

### Common Issues:

#### 1. Email Not Sending
- Check EMAIL_USER and EMAIL_PASS in .env
- Verify Gmail App Password is correct
- Check spam folder
- Ensure 2FA is enabled for Gmail

#### 2. Token Verification Failed
- Check JWT_SECRET in .env matches between requests
- Verify token hasn't expired (1 hour limit)
- Check database connection

#### 3. Database Errors
- Ensure XAMPP MySQL is running
- Verify database connection in .env
- Check if migration ran successfully

#### 4. CORS Issues
- Verify FRONTEND_URL in .env
- Check CORS configuration in server.js

### Debug Mode:
Enable detailed logging by adding to your .env:
```env
NODE_ENV=development
```

## Customization Options

### 1. Token Expiration:
Change expiration time in `authController.js`:
```javascript
const jwtResetToken = jwt.sign(payload, secret, { expiresIn: '2h' }); // 2 hours
const resetExpires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
```

### 2. Email Template:
Modify the HTML template in `emailUtils.js` to match your branding.

### 3. Password Requirements:
Update validation in both frontend and backend:
- Minimum length
- Character requirements
- Complexity rules

### 4. Rate Limiting:
Add rate limiting middleware to prevent abuse:
```javascript
const rateLimit = require('express-rate-limit');

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many password reset attempts, please try again later.'
});

router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
```

## Production Considerations

1. **Environment Variables**: Use secure environment variable management
2. **HTTPS**: Ensure all communications are over HTTPS
3. **Email Service**: Consider using professional email services (SendGrid, AWS SES)
4. **Logging**: Implement proper logging for security events
5. **Monitoring**: Monitor failed attempts and suspicious activity
6. **Backup**: Regular database backups including user data

## Files Modified/Created

### Backend Files:
- ✅ `src/controllers/authController.js` - Added password reset methods
- ✅ `src/routes/authRoutes.js` - Added new routes
- ✅ `src/utils/emailUtils.js` - Email sending utility
- ✅ `src/models/User.js` - Added reset token fields
- ✅ `src/migrations/20241220000000-add-password-reset-fields.js` - Database migration
- ✅ `.env` - Added email configuration

### Frontend Files:
- ✅ `src/pages/ForgotPassword.jsx` - Enhanced existing component
- ✅ `src/pages/ResetPassword.jsx` - New reset password component
- ✅ `src/App.jsx` - Added new route

The implementation is now complete and ready for testing!