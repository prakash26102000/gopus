const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');

// Create new pincode shipping amount
router.post('/pincode', shippingController.create);

// List pincodes (optional ?active=true|false) or get by pincode (?pin=XXXXXX)
router.get('/pincode', shippingController.list);

// Update by id
router.put('/pincode/:id', shippingController.update);

// Delete by id
router.delete('/pincode/:id', shippingController.remove);

module.exports = router;
