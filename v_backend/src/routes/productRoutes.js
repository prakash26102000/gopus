const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middlewares/multerMiddleware');
const { excelUpload } = require('../middlewares/multerMiddleware');

// Universal Product Search Route
// IMPORTANT: This must be defined before routes like /products/:id
router.get('/products/search', productController.searchProducts);

// Get available categories and subcategories for import reference
// get - http://localhost:3000/api/products/import-reference
router.get('/products/import-reference', productController.getImportReference);

// Download Excel template for product import
// get - http://localhost:3000/api/products/excel-template
router.get('/products/excel-template', productController.generateExcelTemplate);

// Import products from Excel file
// post - http://localhost:3000/api/products/import-excel
router.post('/products/import-excel', excelUpload.single('excel'), productController.importProductsFromExcel);

// Create a product
// post - http://localhost:5001/api/products
router.post('/products', productController.createProduct);
// Get all products
// get - http://localhost:3000/api/products
router.get('/products', productController.getAllProducts);
// Get product details by id
// get - http://localhost:3000/api/products/:id
router.get('/products/:id', productController.getProductDetails);
// Get consolidated/full product details by id (public)
// get - http://localhost:5001/api/products/:id/full
router.get('/products/:id/full', productController.getProductFull);
// Update a product
// put - http://localhost:3000/api/products/:id
router.put('/products/:id', productController.updateProduct);
// Update product size
// patch - http://localhost:3000/api/products/:id/size
router.patch('/products/:id/size', productController.updateProductSize);
// Delete a product
// delete - http://localhost:3000/api/products/:id
router.delete('/products/:id', productController.deleteProduct);











// Upload images for a product
// post - http://localhost:3000/api/products/upload-images
router.post('/products/upload-images', upload.any(), productController.uploadProductImages);
// Get product images by productId
// get - http://localhost:3000/api/products/:productId/images
router.get('/products/:productId/images', productController.getProductImages);
// Delete a specific product image
// delete - http://localhost:3000/api/product-images/:id
router.delete('/product-images/:id', productController.deleteProductImage);
// Update a specific product image
// put - http://localhost:3000/api/product-images/:id
router.put('/product-images/:id', upload.single('image'), productController.updateProductImage);











// Batch add product specifications
// post - http://localhost:3000/api/productspecifications
router.post('/productspecifications', productController.addProductSpecifications);

// Get all specifications for a product
// get - http://localhost:3000/api/products/:productId/specifications
router.get('/products/:productId/specifications', productController.getProductSpecifications);

// Create a specification key
// post - http://localhost:3000/api/specificationkeys
router.post('/specificationkeys', productController.createSpecificationKey);

// Get all specification keys for a subcategory
// get - http://localhost:3000/api/specificationkeys?category=category&subCategory=subCategory
router.get('/specificationkeys', productController.getSpecificationKeys);

// Update a specification key
// put - http://localhost:3000/api/specificationkeys/:id
router.put('/specificationkeys/:id', productController.updateSpecificationKey);

// Delete a specification key
// delete - http://localhost:3000/api/specificationkeys/:id
router.delete('/specificationkeys/:id', productController.deleteSpecificationKey);

// =================== SIZES ROUTES =================== //

// Get sizes for a product
// get - http://localhost:3000/api/products/:id/sizes
router.get('/products/:id/sizes', productController.getProductSizes);

// Update sizes for a product
// put - http://localhost:3000/api/products/:id/sizes
router.put('/products/:id/sizes', productController.updateProductSizes);

// Delete a specific size
// delete - http://localhost:3000/api/sizes/:sizeId
router.delete('/sizes/:sizeId', productController.deleteProductSize);

// Get size-based pricing for a product
// get - http://localhost:3000/api/products/:id/pricing?sizeValue=M
router.get('/products/:id/pricing', productController.getSizePricing);

module.exports = router;