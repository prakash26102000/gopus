const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const customerRoutes = require('./customerRoutes');
const addressRoutes = require('./addressRoutes');
const profileRoutes = require('./profileRoutes');
// Note: reviews and products are mounted directly in server.js to control order

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/customer', customerRoutes);
router.use('/api/addresses', addressRoutes);
router.use('/api/profile', profileRoutes);
router.use('/api/users', profileRoutes);

router.get('/health-check', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

module.exports = router;