const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware.isAuthenticated);

// Get all addresses for the logged-in user
router.get('/get', addressController.getUserAddresses);
// GET http://localhost:3000/api/addresses/get
// Add a new address
router.post('/create', addressController.addUserAddress);
//post http://localhost:3000/api/addresses/create

// Update an existing address
router.put('/:id', addressController.updateUserAddress);


// Delete an address
router.delete('/:id', addressController.deleteUserAddress);


module.exports = router;
