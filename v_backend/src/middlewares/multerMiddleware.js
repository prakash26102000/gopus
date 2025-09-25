const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create base upload directories on startup
const uploadPath = path.join(__dirname, '..', 'uploads');
const bannerPath = path.join(uploadPath, 'banners');
fs.mkdirSync(uploadPath, { recursive: true });
fs.mkdirSync(bannerPath, { recursive: true });

// Helper to sanitize productId to avoid path traversal
function sanitizeProductId(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, '');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    // Check both body.type and originalUrl for banner uploads
    if(req.body.type === 'banners' || req.originalUrl.includes('banner')){
      uploadPath = path.join(__dirname, '..', 'uploads', 'banners');
    } else {
      let productId = req.body.productId || req.query.productId || (req.params && req.params.productId);
      productId = sanitizeProductId(productId);
      uploadPath = path.join(__dirname, '..', 'uploads', 'products', productId);
    }
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Separate storage for Excel files
const excelStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'temp');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, uniqueName);
  }
});

const excelUpload = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload an Excel file (.xlsx or .xls)'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = upload;
module.exports.excelUpload = excelUpload;