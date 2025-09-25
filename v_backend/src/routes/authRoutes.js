const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', authController.register);
//post http://localhost:3000/api/auth/register
router.post('/login', authController.login);
//post http://localhost:3000/api/auth/login

router.get('/getuser', authController.getallusers);
//get http://localhost:3000/api/auth/getuser

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working!', timestamp: new Date().toISOString() });
});

// Password reset routes
router.post('/forgot-password', authController.forgotPassword);
//post http://localhost:3000/api/auth/forgot-password
router.post('/verify-otp', authController.verifyOTP);
//post http://localhost:3000/api/auth/verify-otp
router.post('/reset-password', authController.resetPassword);
//post http://localhost:3000/api/auth/reset-password
router.get('/verify-reset-token/:token', authController.verifyResetToken);
//get http://localhost:3000/api/auth/verify-reset-token/:token

// Protected routes
router.get('/profile', isAuthenticated, authController.getProfile);
router.get('/protected', isAuthenticated, (req, res) => {
    res.json({ 
        message: "You accessed a protected route!", 
        user: req.user 
    });
});



module.exports = router;
