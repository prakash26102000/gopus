const express = require('express');
const router = express.Router();
const { isAuthenticated, isCustomer } = require('../middlewares/authMiddleware');

// Customer dashboard route
router.get('/dashboard', isAuthenticated, isCustomer, (req, res) => {
  res.status(200).json({ message: 'Customer dashboard access granted' });
});

module.exports = router;