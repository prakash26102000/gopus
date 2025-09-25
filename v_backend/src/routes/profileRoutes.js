const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads', 'profiles');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `profile-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
});

// All routes require authentication
router.use(isAuthenticated);

// Get user profile
router.get('/userprofile', profileController.getUserProfile);
//GET http://localhost:3000/api/userprofile

// Update user profile
router.put('/userprofile', profileController.updateProfile);
//http://localhost:3000/api/userprofile

// Upload profile picture
router.post('/userprofile/picture', upload.single('profilePicture'), profileController.uploadProfilePicture);
//http://localhost:5001/api/userprofile/picture

module.exports = router;
