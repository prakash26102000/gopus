const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

// Admin dashboard route
router.get('/dashboard', isAuthenticated, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Admin dashboard access granted' });
});

module.exports = router;