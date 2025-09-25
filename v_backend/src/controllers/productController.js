const {
  productdescription,
  productimage,
  productspecification,
  specificationkey,
  sizes,
  maincategory,
  subcategory,
  sequelize
} = require('../models');

// Helper function to calculate size-based pricing
const calculateSizePrice = (basePrice, baseMrp, sizeData) => {
  if (!sizeData || sizeData.price_modifier_type === 'none') {
    return {
      price: parseFloat(basePrice),
      mrp: baseMrp ? parseFloat(baseMrp) : null
    };
  }

  if (sizeData.price_modifier_type === 'fixed') {
    return {
      price: sizeData.price ? parseFloat(sizeData.price) : parseFloat(basePrice),
      mrp: sizeData.mrp ? parseFloat(sizeData.mrp) : (baseMrp ? parseFloat(baseMrp) : null)
    };
  }

  if (sizeData.price_modifier_type === 'percentage' && sizeData.price_modifier_value) {
    const percentage = parseFloat(sizeData.price_modifier_value);
    const multiplier = 1 + (percentage / 100);
    return {
      price: parseFloat(basePrice) * multiplier,
      mrp: baseMrp ? parseFloat(baseMrp) * multiplier : null
    };
  }

  return {
    price: parseFloat(basePrice),
    mrp: baseMrp ? parseFloat(baseMrp) : null
  };
};
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    // Log full request body for debugging
    console.log('Received create product request with body:', JSON.stringify(req.body, null, 2));

    // Extract possible category keys
    let categoryRaw = req.body.category ?? req.body.categoryid ?? req.body.category_id ?? null;
    let subCategoryRaw = req.body.subCategory ?? req.body.subcategory ?? req.body.sub_category ?? null;
    console.log('Parsed raw:', { categoryRaw, subCategoryRaw });

    // Parse integers
    const category = parseInt(categoryRaw, 10);
    const subCategory = parseInt(subCategoryRaw, 10);

    // Validate required numeric fields
    if (isNaN(category) || isNaN(subCategory)) {
      return res.status(400).json({ message: 'category and subCategory are required and must be valid integers' });
    }

    // Validate other product fields
    const { productName, brand, price, mrp, rating, description } = req.body;
    
    // Check for missing required fields
    if (!productName || !brand || price === undefined) {
      return res.status(400).json({ message: 'Missing required productName, brand, or price' });
    }

    // Ensure description is at least an empty string
    const productDescription = description || "";
    
    // Handle rating - if not provided, default to 0
    const productRating = rating === undefined || rating === null ? 0 : parseFloat(rating);
    
    // Handle MRP - if not provided, set to null
    const productMrp = mrp === undefined || mrp === null || mrp === '' ? null : parseFloat(mrp);

    // Handle GST fields
    let gst = 0.00;
    try {
      gst = req.body.gst === undefined || req.body.gst === null || req.body.gst === '' 
        ? 0.00 
        : parseFloat(req.body.gst);
      if (isNaN(gst)) {
        return res.status(400).json({ message: 'GST must be a valid number' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid GST value provided' });
    }

    // Validate gst_type
    const gst_type = req.body.gst_type || req.body.gstType || 'exclusive';
    if (!['inclusive', 'exclusive'].includes(gst_type)) {
      return res.status(400).json({ message: 'GST type must be either "inclusive" or "exclusive"' });
    }

    // Handle size field (legacy support)
    const size = req.body.size || null;
    
    // Handle new sizes array
    const sizesData = req.body.sizes || [];
    const enableSizes = req.body.enableSizes || false;

    // Create product with validated data
    const product = await productdescription.create({
      category,
      subcategory: subCategory,
      productname: productName,
      brand,
      price: parseFloat(price),
      mrp: productMrp,
      rating: productRating,
      description: productDescription,
      gst: gst,
      gst_type: gst_type,
      size
    });

    // Create sizes if provided and enabled
    if (enableSizes && Array.isArray(sizesData) && sizesData.length > 0) {
      const sizeRecords = sizesData.map((sizeItem, index) => ({
        product_id: product.id,
        size_type: sizeItem.size_type || 'custom',
        size_value: sizeItem.size_value,
        display_order: sizeItem.display_order || index,
        is_available: sizeItem.is_available !== undefined ? sizeItem.is_available : true,
        price: sizeItem.price ? parseFloat(sizeItem.price) : null,
        mrp: sizeItem.mrp ? parseFloat(sizeItem.mrp) : null,
        price_modifier_type: sizeItem.price_modifier_type || 'none',
        price_modifier_value: sizeItem.price_modifier_value ? parseFloat(sizeItem.price_modifier_value) : null
      }));

      await sizes.bulkCreate(sizeRecords);
    } else if (!enableSizes) {
      // If sizes are not enabled, ensure no sizes exist for this product
      // This handles the case where user unchecks the size checkbox
      await sizes.destroy({
        where: { product_id: product.id }
      });
    }

    console.log('CREATED:', product.dataValues);
    return res.status(201).json(product);
  } catch (error) {
    console.error('CREATE ERROR:', error);
    return res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await productdescription.findAll({
      include: [
        {
          model: sequelize.models.maincategory,
          as: 'maincategory',
          attributes: ['id', 'name']
        },
        {
          model: sequelize.models.subcategory,
          as: 'subcategoryDetails',
          attributes: ['id', 'name']
        },
        {
          model: sizes,
          as: 'productSizes',
          attributes: ['id', 'size_type', 'size_value', 'display_order', 'is_available', 'price', 'mrp', 'price_modifier_type', 'price_modifier_value'],
          required: false
        }
      ]
    });
    
    // Format the response to include category and subcategory names
    const formattedProducts = products.map(product => {
      const productData = product.get({ plain: true });
      // Add category and subcategory name properties directly to the product object
      if (productData.maincategory) {
        productData.categoryName = productData.maincategory.name;
      }
      if (productData.subcategoryDetails) {
        productData.subcategoryName = productData.subcategoryDetails.name;
      }
      // Ensure productName is consistently available
      if (productData.productname && !productData.productName) {
        productData.productName = productData.productname;
      }
      // Add GST fields for frontend
      productData.gst = productData.gst || 0.00;
      productData.gst_type = productData.gst_type || 'exclusive';
      productData.gstType = productData.gst_type; // Add gstType for frontend compatibility
      return productData;
    });
    
    res.json(formattedProducts);
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// Get product details by ID
exports.getProductDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await productdescription.findByPk(id, {
      include: [
        {
          model: sequelize.models.maincategory,
          as: 'maincategory',
          attributes: ['id', 'name']
        },
        {
          model: sequelize.models.subcategory,
          as: 'subcategoryDetails',
          attributes: ['id', 'name']
        },
        {
          model: sizes,
          as: 'productSizes',
          attributes: ['id', 'size_type', 'size_value', 'display_order', 'is_available'],
          required: false
        }
      ]
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Format the response to include category and subcategory names
    const productData = product.get({ plain: true });
    if (productData.maincategory) {
      productData.categoryName = productData.maincategory.name;
    }
    if (productData.subcategoryDetails) {
      productData.subcategoryName = productData.subcategoryDetails.name;
    }
    if (productData.productname && !productData.productName) {
      productData.productName = productData.productname;
    }
    // Add GST fields for frontend
    productData.gst = productData.gst || 0.00;
    productData.gst_type = productData.gst_type || 'exclusive';
    productData.gstType = productData.gst_type; // Add gstType for frontend compatibility
    return res.json(productData);
  } catch (error) {
    console.error('Error in getProductDetails:', error);
    return res.status(500).json({ message: 'Error fetching product details', error: error.message });
  }
};

// Get consolidated/full product details by ID (public)
exports.getProductFull = async (req, res) => {
const { id } = req.params;
try {
  // Base product with category/subcategory and sizes (include pricing fields)
  const product = await productdescription.findByPk(id, {
    include: [
      {
        model: sequelize.models.maincategory,
        as: 'maincategory',
        attributes: ['id', 'name']
      },
      {
        model: sequelize.models.subcategory,
        as: 'subcategoryDetails',
        attributes: ['id', 'name']
      },
      {
        model: sizes,
        as: 'productSizes',
        attributes: [
          'id', 'size_type', 'size_value', 'display_order', 'is_available',
          'price', 'mrp', 'price_modifier_type', 'price_modifier_value'
        ],
        required: false
      }
    ]
  });

  if (!product) return res.status(404).json({ message: 'Product not found' });

  const base = product.get({ plain: true });
  // Normalize fields for frontend
  if (base.maincategory) base.categoryName = base.maincategory.name;
  if (base.subcategoryDetails) base.subcategoryName = base.subcategoryDetails.name;
  if (base.productname && !base.productName) base.productName = base.productname;
  base.gst = base.gst || 0.0;
  base.gst_type = base.gst_type || 'exclusive';
  base.gstType = base.gst_type;

  // Fetch images and specs in parallel
  const [images, specs] = await Promise.all([
    productimage.findAll({
      where: { productid: parseInt(id, 10) },
      order: [['ordernumber', 'ASC']],
      attributes: ['imageurl']
    }),
    productspecification.findAll({
      where: { productid: parseInt(id, 10) },
      attributes: ['speckeyid', 'value']
    })
  ]);

  const normalizedImages = images.map(img => {
    const plain = img.get({ plain: true });
    let path = plain.imageurl;
    if (path && !path.startsWith('/')) path = `/uploads/${path}`;
    return { imageUrl: path };
  });

  let specifications = [];
  if (specs.length > 0) {
    const keyIds = [...new Set(specs.map(s => s.speckeyid))];
    const keys = await specificationkey.findAll({ where: { id: keyIds }, attributes: ['id', 'keyname'] });
    const keyMap = {};
    keys.forEach(k => { keyMap[k.id] = k.get({ plain: true }); });
    specifications = specs.map(s => {
      const plain = s.get({ plain: true });
      const k = keyMap[plain.speckeyid];
      return {
        keyName: (k && (k.keyname || k.keyName)) || 'Spec',
        value: plain.value || ''
      };
    });
  }

  const response = {
    ...base,
    images: normalizedImages,
    sizes: Array.isArray(base.productSizes) ? base.productSizes : [],
    specifications
  };

  return res.json(response);
} catch (error) {
  console.error('Error in getProductFull:', error);
  res.status(500).json({ message: 'Error fetching full product details', error: error.message });
}
};

// Update a product
exports.updateProduct = async (req, res) => {
const { id } = req.params;
// ... (rest of the code remains the same)
console.log(`[Product Update] Received update request for ID: ${id}`);
console.log("[Product Update] Raw req.body:", JSON.stringify(req.body, null, 2));
  console.log(`[Product Update] Received update request for ID: ${id}`);
  console.log("[Product Update] Raw req.body:", JSON.stringify(req.body, null, 2));

  try {
    // Find the product first to ensure it exists
    const product = await productdescription.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found for update' });
    }

    // Validate size format if it's being updated
    if (req.body.size !== undefined) {
      const sizes = req.body.size ? req.body.size.split(',').map(s => s.trim()).filter(Boolean) : [];
      
      // If sizes are provided, validate them
      if (sizes.length > 0) {
        // You can add size validation rules here if needed
        // For example, check if sizes are valid (S, M, L, XL, etc.)
        const validSizes = sizes.every(size => size.length <= 10); // Example validation
        if (!validSizes) {
          return res.status(400).json({ 
            message: 'Invalid size format. Each size should be less than 10 characters.' 
          });
        }
      }
    }

    // Prepare data for update, mapping frontend names to backend schema names
    const updateData = {};

    if (req.body.productName !== undefined) updateData.productname = req.body.productName;
    if (req.body.brand !== undefined) updateData.brand = req.body.brand;
    if (req.body.price !== undefined) updateData.price = parseFloat(req.body.price);
    if (req.body.mrp !== undefined) updateData.mrp = req.body.mrp === null || req.body.mrp === '' ? null : parseFloat(req.body.mrp);
    if (req.body.rating !== undefined) updateData.rating = req.body.rating === null || req.body.rating === '' ? 0 : parseFloat(req.body.rating);
    if (req.body.description !== undefined) updateData.description = req.body.description;
    
    // Handle size field
    if (req.body.size !== undefined) {
      updateData.size = req.body.size ? req.body.size.trim() : null;
    }
    
    // Handle GST fields
    if (req.body.gst !== undefined) {
      updateData.gst = req.body.gst === null || req.body.gst === '' ? 0.00 : parseFloat(req.body.gst);
    }
    if (req.body.gst_type !== undefined) {
      const gst_type = req.body.gst_type || 'exclusive';
      if (!['inclusive', 'exclusive'].includes(gst_type)) {
        return res.status(400).json({ message: 'GST type must be either "inclusive" or "exclusive"' });
      }
      updateData.gst_type = gst_type;
    }
    
    // Handle category and subCategory, ensuring they are integers
    let categoryRaw = req.body.category ?? req.body.categoryid ?? req.body.category_id ?? null;
    let subCategoryRaw = req.body.subCategory ?? req.body.subcategory ?? req.body.sub_category ?? null;

    if (categoryRaw !== null && categoryRaw !== undefined) {
        const parsedCategory = parseInt(categoryRaw, 10);
        if (!isNaN(parsedCategory)) {
            updateData.category = parsedCategory;
        } else {
            console.warn(`[Product Update] Invalid category value received: ${categoryRaw}`);
        }
    }

    if (subCategoryRaw !== null && subCategoryRaw !== undefined) {
        const parsedSubCategory = parseInt(subCategoryRaw, 10);
        if (!isNaN(parsedSubCategory)) {
            updateData.subcategory = parsedSubCategory;
        } else {
            console.warn(`[Product Update] Invalid subCategory value received: ${subCategoryRaw}`);
        }
    }
    
    console.log("[Product Update] Data prepared for update:", JSON.stringify(updateData, null, 2));

    if (Object.keys(updateData).length === 0) {
      console.log("[Product Update] No valid fields to update.");
      // Optionally, you could return the product as is or a specific message
      const unchangedProduct = await productdescription.findByPk(id);
      return res.json(unchangedProduct); 
    }

    const [updatedCount] = await productdescription.update(updateData, { 
      where: { id },
      returning: true // Important for some dialects to get updated rows, though findByPk is more reliable
    });
    
    console.log(`[Product Update] Rows affected: ${updatedCount}`);

    if (updatedCount === 0) {
        // This might happen if the product was deleted just before update, or if data sent matched existing data perfectly
        // Re-fetch to be sure of current state
        const potentiallyUpdatedProduct = await productdescription.findByPk(id);
        if (!potentiallyUpdatedProduct) return res.status(404).json({ message: 'Product not found after update attempt (possibly deleted)' });
        return res.json(potentiallyUpdatedProduct); // Send current state if no rows were strictly updated
    }

    // Handle sizes if provided
    const sizesData = req.body.sizes || [];
    const enableSizes = req.body.enableSizes;
    
    if (enableSizes !== undefined) {
      if (enableSizes && Array.isArray(sizesData) && sizesData.length > 0) {
        // Update sizes - delete existing and create new ones
        await sizes.destroy({
          where: { product_id: id }
        });
        
        const sizeRecords = sizesData.map((sizeItem, index) => ({
          product_id: parseInt(id),
          size_type: sizeItem.size_type || 'custom',
          size_value: sizeItem.size_value,
          display_order: sizeItem.display_order !== undefined ? sizeItem.display_order : index,
          is_available: sizeItem.is_available !== undefined ? sizeItem.is_available : true,
          price: sizeItem.price ? parseFloat(sizeItem.price) : null,
          mrp: sizeItem.mrp ? parseFloat(sizeItem.mrp) : null,
          price_modifier_type: sizeItem.price_modifier_type || 'none',
          price_modifier_value: sizeItem.price_modifier_value ? parseFloat(sizeItem.price_modifier_value) : null
        }));
        
        await sizes.bulkCreate(sizeRecords);
      } else if (!enableSizes) {
        // If sizes are disabled, remove all sizes for this product
        await sizes.destroy({
          where: { product_id: id }
        });
      }
    }

      const updatedProduct = await productdescription.findByPk(id);
    console.log("[Product Update] Product updated successfully:", JSON.stringify(updatedProduct, null, 2));
    
    // Format response to ensure GST fields are included correctly
    const response = updatedProduct.get({ plain: true });
    response.gst = response.gst || 0.00;
    response.gst_type = response.gst_type || 'exclusive';
    response.gstType = response.gst_type; // Add gstType for frontend compatibility
    
    res.json(response);  } catch (error) {
    console.error('[Product Update] Error updating product:', error);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id, 10))) {
    return res.status(400).json({ message: 'Invalid product ID provided' });
  }
  
  console.log(`Attempting to delete product with ID: ${id}`);
  
  // Use a transaction to ensure data integrity
  const t = await sequelize.transaction();
  
  try {
    // Find the product first to verify it exists
    const product = await productdescription.findByPk(parseInt(id, 10), { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log(`Starting deletion cascade for product ID: ${id}`);
    
    try {
      // Delete all product specifications
      const specsDeleted = await productspecification.destroy({
        where: { productid: parseInt(id, 10) },
        transaction: t
      });
      
      console.log(`Deleted ${specsDeleted} specifications for product ID: ${id}`);
    } catch (specError) {
      console.error(`Error deleting specifications for product ${id}:`, specError);
    }
    
    try {
      // Delete all product images
      const imagesDeleted = await productimage.destroy({
        where: { productid: parseInt(id, 10) },
        transaction: t
      });
      
      console.log(`Deleted ${imagesDeleted} images for product ID: ${id}`);
    } catch (imageError) {
      console.error(`Error deleting images for product ${id}:`, imageError);
    }
    
    try {
      // Delete all product sizes
      const sizesDeleted = await sizes.destroy({
        where: { product_id: parseInt(id, 10) },
        transaction: t
      });
      
      console.log(`Deleted ${sizesDeleted} sizes for product ID: ${id}`);
    } catch (sizeError) {
      console.error(`Error deleting sizes for product ${id}:`, sizeError);
    }
    
    // Delete the product itself
    await product.destroy({ transaction: t });
    console.log(`Successfully deleted product ID: ${id}`);
    
    // Commit the transaction
    await t.commit();
    
    return res.status(200).json({ 
      success: true,
      message: 'Product and all associated data deleted successfully' 
    });
  } catch (error) {
    // Rollback transaction on error
    await t.rollback();
    console.error('Error in cascade delete of product:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error during deletion process', 
      error: error.message 
    });
  }
};

// Upload product images
exports.uploadProductImages = async (req, res) => {
  const productId = req.params.productId || req.body.productId;
  try {
    // Prepare image records
    const imagesData = req.files.map((file, index) => ({
      productid: parseInt(productId, 10),
      imageurl: `products/${productId}/${file.filename}`,
      ordernumber: index + 1
    }));

    // Insert into DB
    await productimage.bulkCreate(imagesData);

    // Fetch created records to include id and timestamps
    const images = await productimage.findAll({
      where: { productid: parseInt(productId, 10) },
      order: [['ordernumber', 'ASC']]
    });

    return res.status(201).json({ message: 'Images uploaded successfully', images });
  } catch (error) {
    console.error('Image upload failed:', error);
    return res.status(500).json({ message: 'Image upload failed', error: error.message });
  }
};

// Get images for a product
exports.getProductImages = async (req, res) => {
  try {
    // Allow productId via route param or query
    const productId = req.params.productId || req.query.productId;
    if (!productId) return res.status(400).json({ message: 'productId is required' });
    
    console.log(`Fetching images for product ID: ${productId}`);
    
    // Fetch and return all images for the given product
    const images = await productimage.findAll({
      where: { productid: parseInt(productId, 10) },
      order: [['ordernumber', 'ASC']]
    });
    
    console.log(`Found ${images.length} images for product ID: ${productId}`);
    
    // Add the full path to each image URL
    const imagesWithFullPaths = images.map(image => {
      const imageData = image.get({ plain: true });
      
      // Add proper URL format for frontend
      if (imageData.imageurl) {
        // Ensure the imageUrl starts with a slash for proper path joining
        if (!imageData.imageurl.startsWith('/')) {
          imageData.imageurl = '/uploads/' + imageData.imageurl;
        }
        
        // Add imageUrl and url fields for compatibility
        imageData.url = imageData.imageurl;
        imageData.imageUrl = imageData.imageurl;
      }
      
      return imageData;
    });
    
    return res.json(imagesWithFullPaths);
  } catch (error) {
    console.error('Error fetching product images:', error);
    return res.status(500).json({ message: 'Error fetching product images', error: error.message });
  }
};

exports.deleteProductImage = async (req, res) => {
  const { id } = req.params;

  try {
    const image = await productimage.findByPk(id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Get the image URL and extract the relative path
    let imagePath = image.imageurl;
    if (imagePath.startsWith('/uploads/')) {
      imagePath = imagePath.substring(9); // Remove '/uploads/' prefix
    }
    
    const fullImagePath = path.join(__dirname, '..', 'uploads', imagePath);
    console.log('Attempting to delete image at path:', fullImagePath);
    
    if (fs.existsSync(fullImagePath)) {
      fs.unlinkSync(fullImagePath);
      console.log('Successfully deleted image file');
    } else {
      console.log('Image file not found at path:', fullImagePath);
    }

    await image.destroy();
    console.log('Successfully deleted image record from database');

    return res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting product image:', error);
    return res.status(500).json({
      message: 'Error deleting product image',
      error: error.message
    });
  }
};

exports.updateProductImage = async (req, res) => {
  const { id } = req.params;

  try {
    const imageRecord = await productimage.findByPk(id);
    if (!imageRecord) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // If new image file is uploaded, delete the old one and update the path
    if (req.file) {
      // Get the image URL and extract the relative path
      let oldImagePath = imageRecord.imageurl;
      if (oldImagePath.startsWith('/uploads/')) {
        oldImagePath = oldImagePath.substring(9); // Remove '/uploads/' prefix
      }
      
      const fullOldImagePath = path.join(__dirname, '..', 'uploads', oldImagePath);
      console.log('Checking for old image at path:', fullOldImagePath);
      
      if (fs.existsSync(fullOldImagePath)) {
        fs.unlinkSync(fullOldImagePath);
        console.log('Successfully deleted old image file');
      } else {
        console.log('Old image file not found at path:', fullOldImagePath);
      }
      
      // Update with new image path
      imageRecord.imageurl = `products/${imageRecord.productid}/${req.file.filename}`;
      console.log('Updated image URL to:', imageRecord.imageurl);
    }

    // If orderNumber is sent in body, update it
    if (req.body.orderNumber !== undefined) {
      imageRecord.ordernumber = req.body.orderNumber;
    }

    await imageRecord.save();
    console.log('Successfully updated image record in database');

    return res.json({
      message: 'Image updated successfully',
      image: imageRecord
    });
  } catch (error) {
    console.error('Error updating product image:', error);
    return res.status(500).json({
      message: 'Error updating product image',
      error: error.message
    });
  }
};

// Create a new specification key
exports.createSpecificationKey = async (req, res) => {
  try {
    // Log the entire request body to see what's being received
    console.log('Received request body:', JSON.stringify(req.body));
    
    // Accept multiple field name formats
    const category = req.body.category;
    const subcategory = req.body.subcategory || req.body.subCategory;
    const keyName = req.body.keyName || req.body.keyname;
    
    console.log('Extracted values:', { category, subcategory, keyName });
    
    if (!category || !subcategory || !keyName) {
      return res.status(400).json({ message: 'category, subcategory, and keyName are required' });
    }
    
    // Log what we're about to send to the database
    const dbPayload = { category, subcategory, keyname: keyName };
    console.log('Creating specificationkey with payload:', dbPayload);
    
    const specKey = await specificationkey.create(dbPayload);
    console.log('Successfully created specificationkey:', specKey.toJSON());
    
    // Format the response to include keyName for frontend
    const formattedSpecKey = {
      ...specKey.toJSON(),
      keyName: specKey.keyname
    };
    
    res.status(201).json(formattedSpecKey);
  } catch (error) {
    console.error('Detailed error in createSpecificationKey:', error);
    res.status(500).json({ 
      message: 'Error creating specification key', 
      error: error.message,
      stack: error.stack 
    });
  }
};

// Get all specification keys for a subcategory
exports.getSpecificationKeys = async (req, res) => {
  // Accept multiple field name formats
  const category = req.query.category;
  const subcategory = req.query.subcategory || req.query.subCategory;
  
  if (!category || !subcategory) {
    return res.status(400).json({ message: 'category and subcategory required' });
  }
  
  try {
    const keys = await specificationkey.findAll({
      where: { category, subcategory }
    });
    
    // Map the result to include keyName field for frontend
    const formattedKeys = keys.map(key => ({
      ...key.toJSON(),
      keyName: key.keyname
    }));
    
    res.json(formattedKeys);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching specification keys', error });
  }
};

// Add product specifications
exports.addProductSpecifications = async (req, res) => {
  const { productId, specs } = req.body;
  if (!productId || !Array.isArray(specs) || specs.length === 0) {
    return res.status(400).json({ message: 'productId and specs[] required' });
  }
  
  try {
    // First, delete all existing specifications for this product
    console.log(`Deleting existing specifications for product ID: ${productId}`);
    await productspecification.destroy({
      where: { productid: parseInt(productId, 10) }
    });
    
    // Then create new records
    const records = specs.map(s => ({
      productid: parseInt(productId, 10),
      speckeyid: parseInt(s.specKeyId, 10),
      value: s.value
    }));
    
    await productspecification.bulkCreate(records);
    res.status(201).json({ message: 'Specifications updated successfully' });
  } catch (error) {
    console.error('Error updating specifications:', error);
    res.status(500).json({ message: 'Error updating specifications', error: error.message });
  }
};

// Get all specifications for a product
exports.getProductSpecifications = async (req, res) => {
  const { productId } = req.params;
  try {
    console.log(`Fetching specifications for product ID: ${productId}`);
    
    // Find all product specifications
    const specs = await productspecification.findAll({
      where: { productid: parseInt(productId, 10) }
    });
    
    console.log(`Found ${specs.length} specifications for product ID: ${productId}`);
    
    // If specifications exist, fetch the specification keys
    if (specs.length > 0) {
      // Extract all spec key IDs from the specifications
      const keyIds = [...new Set(specs.map(spec => spec.speckeyid))];
      
      console.log(`Found ${keyIds.length} unique specification key IDs: ${keyIds.join(', ')}`);
      
      // Fetch all spec keys in one query
      const keys = await specificationkey.findAll({
        where: { id: keyIds }
      });
      
      console.log(`Found ${keys.length} specification keys`);
      
      // Create lookup map for easier access
      const keyMap = {};
      keys.forEach(key => {
        keyMap[key.id] = key;
      });
      
      // Combine data for response
      const enrichedSpecs = specs.map(spec => {
        const plainSpec = spec.get({ plain: true });
        const key = keyMap[plainSpec.speckeyid];
        
        if (key) {
          plainSpec.SpecificationKey = {
            ...key.get({ plain: true }),
            keyName: key.keyname // Add keyName field for frontend compatibility
          };
        }
        
        return plainSpec;
      });
      
      return res.json(enrichedSpecs);
    } else {
      // No specifications found
      return res.json([]);
    }
  } catch (error) {
    console.error('Error fetching product specifications:', error);
    return res.status(500).json({ 
      message: 'Error fetching product specifications', 
      error: error.message 
    });
  }
};

// Update a specification key
exports.updateSpecificationKey = async (req, res) => {
  const { id } = req.params;
  try {
    // Extract keyName from request body and map to keyname for the database
    const updateData = { ...req.body };
    if (updateData.keyName !== undefined) {
      updateData.keyname = updateData.keyName;
      delete updateData.keyName;
    }
    
    const [updated] = await specificationkey.update(updateData, { where: { id } });
    if (!updated) return res.status(404).json({ message: 'Specification key not found' });
    
    const updatedSpecKey = await specificationkey.findByPk(id);
    
    // Format response with keyName for the frontend
    const formattedSpecKey = {
      ...updatedSpecKey.toJSON(),
      keyName: updatedSpecKey.keyname
    };
    
    res.json(formattedSpecKey);
  } catch (error) {
    res.status(500).json({ message: 'Error updating specification key', error });
  }
};

// Delete a specification key
exports.deleteSpecificationKey = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await specificationkey.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: 'Specification key not found' });
    res.json({ message: 'Specification key deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting specification key', error });
  }
};

// Update product size
exports.updateProductSize = async (req, res) => {
  const { id } = req.params;
  const { size } = req.body;

  try {
    // Find the product first to ensure it exists
    const product = await productdescription.findByPk(id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found'
      });
    }

    // Validate and format sizes
    const sizes = size ? size.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    // Validate size format if provided
    if (sizes.length > 0) {
      const validSizes = sizes.every(s => s.length <= 10); // Example validation
      if (!validSizes) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid size format. Each size should be less than 10 characters.'
        });
      }
    }

    // Update the size
    await product.update({ size: sizes.length > 0 ? sizes.join(', ') : null });

    return res.json({
      success: true,
      message: 'Product size updated successfully',
      size: product.size
    });

  } catch (error) {
    console.error('Error updating product size:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating product size',
      error: error.message
    });
  }
};

// Universal Product Search
exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query cannot be empty.",
      });
    }

    const searchTerm = `%${query.toLowerCase()}%`; // Prepare for case-insensitive LIKE search

    const products = await productdescription.findAll({
      where: {
        [Op.or]: [
          sequelize.where(sequelize.fn('LOWER', sequelize.col('productdescription.productname')), {
            [Op.like]: searchTerm,
          }),
          sequelize.where(sequelize.fn('LOWER', sequelize.col('productdescription.description')), {
            [Op.like]: searchTerm,
          }),
          sequelize.where(sequelize.fn('LOWER', sequelize.col('productdescription.brand')), {
            [Op.like]: searchTerm,
          }),
          // Search in main category name
          sequelize.where(sequelize.fn('LOWER', sequelize.col('maincategory.name')), {
            [Op.like]: searchTerm,
          }),
          // Search in subcategory name
          sequelize.where(sequelize.fn('LOWER', sequelize.col('subcategoryDetails.name')), {
            [Op.like]: searchTerm,
          }),
        ],
      },
      include: [
        {
          model: sequelize.models.maincategory,
          as: 'maincategory',
          attributes: ['id', 'name'],
          required: false, // Use left join
        },
        {
          model: sequelize.models.subcategory,
          as: 'subcategoryDetails',
          attributes: ['id', 'name'],
          required: false, // Use left join
        },
        {
          model: productimage,
          as: 'productimages',
          attributes: ['imageurl'],
          required: false,
        },
      ],
      // Add distinct to avoid duplicate products if they match in multiple categories
      distinct: true, 
      // Sequelize will automatically group by the primary key of productdescription
      // and any included associations' primary keys if needed due to `distinct: true`
    });

    const formattedProducts = products.map(product => {
      const productData = product.get({ plain: true });
      if (productData.maincategory) {
        productData.categoryName = productData.maincategory.name;
      }
      if (productData.subcategoryDetails) {
        productData.subcategoryName = productData.subcategoryDetails.name;
      }
      if (productData.productname && !productData.productName) {
        productData.productName = productData.productname;
      }
      // Format image URLs
      if (productData.productimages && productData.productimages.length > 0) {
        if (productData.productimages[0].imageurl && typeof productData.productimages[0].imageurl === 'string') {
          productData.imageUrl = productData.productimages[0].imageurl.startsWith('/')
            ? productData.productimages[0].imageurl
            : `/uploads/${productData.productimages[0].imageurl}`;
        } else {
          productData.imageUrl = null;
        }
      } else {
        productData.imageUrl = null;
      }
      // Add GST fields for frontend
      productData.gst = productData.gst || 0.00;
      productData.gst_type = productData.gst_type || 'exclusive';
      productData.gstType = productData.gst_type; // Add gstType for frontend compatibility
      // Remove raw associations to clean up the response
      delete productData.maincategory;
      delete productData.subcategoryDetails;
      delete productData.productimages; 
      return productData;
    });

    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (error) {
    console.error("Error in searchProducts:", error);
    return res.status(500).json({
      success: false,
      message: "Error searching products.",
      error: error.message,
    });
  }
};

// =================== SIZES MANAGEMENT =================== //

// Get sizes for a product
exports.getProductSizes = async (req, res) => {
  const { id } = req.params;
  try {
    const productSizes = await sizes.findAll({
      where: { product_id: id },
      order: [['display_order', 'ASC'], ['size_type', 'ASC']]
    });

    res.json(productSizes);
  } catch (error) {
    console.error('Error fetching product sizes:', error);
    res.status(500).json({ 
      message: 'Error fetching product sizes', 
      error: error.message 
    });
  }
};

// Add/Update sizes for a product
exports.updateProductSizes = async (req, res) => {
  const { id } = req.params;
  const { sizes: sizesData } = req.body;

  try {
    // Verify product exists
    const product = await productdescription.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Start transaction
    const t = await sequelize.transaction();

    try {
      // Delete existing sizes for this product
      await sizes.destroy({
        where: { product_id: id },
        transaction: t
      });

      // Create new sizes if provided
      if (Array.isArray(sizesData) && sizesData.length > 0) {
        const sizeRecords = sizesData.map((sizeItem, index) => ({
          product_id: parseInt(id),
          size_type: sizeItem.size_type || 'custom',
          size_value: sizeItem.size_value,
          display_order: sizeItem.display_order !== undefined ? sizeItem.display_order : index,
          is_available: sizeItem.is_available !== undefined ? sizeItem.is_available : true,
          price: sizeItem.price ? parseFloat(sizeItem.price) : null,
          mrp: sizeItem.mrp ? parseFloat(sizeItem.mrp) : null,
          price_modifier_type: sizeItem.price_modifier_type || 'none',
          price_modifier_value: sizeItem.price_modifier_value ? parseFloat(sizeItem.price_modifier_value) : null
        }));

        await sizes.bulkCreate(sizeRecords, { transaction: t });
      }

      await t.commit();

      // Fetch and return updated sizes
      const updatedSizes = await sizes.findAll({
        where: { product_id: id },
        order: [['display_order', 'ASC'], ['size_type', 'ASC']]
      });

      res.json({
        success: true,
        message: 'Product sizes updated successfully',
        sizes: updatedSizes
      });

    } catch (error) {
      await t.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error updating product sizes:', error);
    res.status(500).json({ 
      message: 'Error updating product sizes', 
      error: error.message 
    });
  }
};

// Delete a specific size
exports.deleteProductSize = async (req, res) => {
  const { sizeId } = req.params;

  try {
    const deleted = await sizes.destroy({
      where: { id: sizeId }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Size not found' });
    }

    res.json({
      success: true,
      message: 'Size deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting size:', error);
    res.status(500).json({ 
      message: 'Error deleting size', 
      error: error.message 
    });
  }
};

// Get size-based pricing for a product
exports.getSizePricing = async (req, res) => {
  const { id } = req.params;
  const { sizeValue } = req.query;

  try {
    // Get product details
    const product = await productdescription.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get all sizes for the product
    const productSizes = await sizes.findAll({
      where: { product_id: id },
      order: [['display_order', 'ASC']]
    });

    if (!sizeValue) {
      // Return all sizes with calculated pricing
      const sizesWithPricing = productSizes.map(size => {
        const pricing = calculateSizePrice(product.price, product.mrp, size);
        return {
          ...size.toJSON(),
          calculatedPrice: pricing.price,
          calculatedMrp: pricing.mrp
        };
      });

      return res.json({
        success: true,
        product: {
          id: product.id,
          name: product.productname,
          basePrice: parseFloat(product.price),
          baseMrp: product.mrp ? parseFloat(product.mrp) : null
        },
        sizes: sizesWithPricing
      });
    }

    // Find specific size
    const selectedSize = productSizes.find(size => size.size_value === sizeValue);
    if (!selectedSize) {
      return res.status(404).json({ message: 'Size not found' });
    }

    // Calculate pricing for the selected size
    const pricing = calculateSizePrice(product.price, product.mrp, selectedSize);

    res.json({
      success: true,
      product: {
        id: product.id,
        name: product.productname,
        basePrice: parseFloat(product.price),
        baseMrp: product.mrp ? parseFloat(product.mrp) : null
      },
      selectedSize: {
        ...selectedSize.toJSON(),
        calculatedPrice: pricing.price,
        calculatedMrp: pricing.mrp
      }
    });

  } catch (error) {
    console.error('Error getting size pricing:', error);
    res.status(500).json({ 
      message: 'Error getting size pricing', 
      error: error.message 
    });
  }
};

// Helper function to clean and parse JSON from Excel
const cleanAndParseJSON = (jsonString, rowNumber, fieldName) => {
  if (!jsonString) return null;
  
  try {
    // Convert to string and trim
    let cleanString = jsonString.toString().trim();
    
    // If it doesn't start with { or [, it's probably not JSON
    if (!cleanString.startsWith('{') && !cleanString.startsWith('[')) {
      console.warn(`Row ${rowNumber} - ${fieldName} doesn't appear to be JSON:`, cleanString);
      return null;
    }
    
    // Replace problematic characters that Excel might introduce
    cleanString = cleanString
      .replace(/[""]/g, '"')        // Replace smart quotes
      .replace(/['']/g, "'")        // Replace smart apostrophes  
      .replace(/\u00A0/g, ' ')      // Replace non-breaking spaces
      .replace(/\u2028/g, '')       // Remove line separator
      .replace(/\u2029/g, '')       // Remove paragraph separator
      .replace(/[\r\n\t]/g, ' ')    // Replace line breaks and tabs with spaces
      .replace(/\s+/g, ' ')         // Replace multiple spaces with single space
      .trim();
    
    // Try to parse
    const parsed = JSON.parse(cleanString);
    console.log(`Row ${rowNumber} - Successfully parsed ${fieldName}:`, parsed);
    return parsed;
    
  } catch (error) {
    console.error(`Row ${rowNumber} - Failed to parse ${fieldName}:`, error.message);
    console.error(`Row ${rowNumber} - Raw data:`, jsonString);
    console.error(`Row ${rowNumber} - Data type:`, typeof jsonString);
    throw new Error(`Invalid JSON in ${fieldName}: ${error.message}`);
  }
};

// Excel Import functionality
exports.importProductsFromExcel = async (req, res) => {
  try {
    console.log('Excel import request received');
    console.log('File info:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : 'No file');

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No Excel file uploaded' 
      });
    }

    // Read the Excel file
    console.log('Reading Excel file from:', req.file.path);
    let workbook, jsonData;
    
    try {
      workbook = XLSX.readFile(req.file.path);
      console.log('Workbook sheets:', workbook.SheetNames);
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      jsonData = XLSX.utils.sheet_to_json(worksheet);
      console.log('Parsed JSON data length:', jsonData.length);
      console.log('First row sample:', jsonData[0]);
    } catch (parseError) {
      console.error('Error parsing Excel file:', parseError);
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Error parsing Excel file: ' + parseError.message 
      });
    }
    
    if (jsonData.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Excel file is empty or has no valid data' 
      });
    }

    const results = {
      total: jsonData.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      try {
        // Validate required fields
        const requiredFields = ['productname', 'brand', 'price', 'category', 'subcategory'];
        const missingFields = requiredFields.filter(field => !row[field]);
        
        if (missingFields.length > 0) {
          results.failed++;
          results.errors.push({
            row: i + 2, // +2 because Excel rows start at 1 and we skip header
            error: `Missing required fields: ${missingFields.join(', ')}`
          });
          continue;
        }

        // Prepare product data
        const productData = {
          productname: row.productname,
          brand: row.brand,
          price: parseFloat(row.price),
          mrp: row.mrp ? parseFloat(row.mrp) : null,
          rating: row.rating ? parseFloat(row.rating) : 0,
          description: row.description || '',
          gst: row.gst ? parseFloat(row.gst) : 0,
          gst_type: row.gst_type || 'exclusive',
          size: row.size || null,
          category: parseInt(row.category),
          subcategory: parseInt(row.subcategory)
        };

        // Validate numeric fields
        if (isNaN(productData.price) || productData.price <= 0) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            error: 'Invalid price value'
          });
          continue;
        }

        if (productData.mrp && (isNaN(productData.mrp) || productData.mrp <= 0)) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            error: 'Invalid MRP value'
          });
          continue;
        }

        // Validate category and subcategory exist
        const categoryExists = await maincategory.findByPk(productData.category);
        if (!categoryExists) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            error: `Category ID ${productData.category} does not exist. Please check the Categories Reference sheet.`
          });
          continue;
        }

        const subcategoryExists = await subcategory.findByPk(productData.subcategory);
        if (!subcategoryExists) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            error: `Subcategory ID ${productData.subcategory} does not exist. Please check the Subcategories Reference sheet.`
          });
          continue;
        }

        // Validate that subcategory belongs to the specified category
        if (subcategoryExists.maincategoryid !== productData.category) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            error: `Subcategory ID ${productData.subcategory} does not belong to Category ID ${productData.category}. Please check the reference sheets.`
          });
          continue;
        }

        // Create the product
        const newProduct = await productdescription.create(productData);

        // Handle specifications if provided
        if (row.specifications) {
          try {
            const specs = cleanAndParseJSON(row.specifications, i + 2, 'specifications');
            
            if (specs && typeof specs === 'object' && specs !== null) {
              for (const [key, value] of Object.entries(specs)) {
                console.log(`Row ${i + 2} - Processing spec: ${key} = ${value}`);
                
                // Find or create the specification key
                let specKey = await specificationkey.findOne({
                  where: {
                    category: productData.category.toString(),
                    subcategory: productData.subcategory.toString(),
                    keyname: key
                  }
                });

                if (!specKey) {
                  // Create new specification key if it doesn't exist
                  specKey = await specificationkey.create({
                    category: productData.category.toString(),
                    subcategory: productData.subcategory.toString(),
                    keyname: key
                  });
                  console.log(`Created new specification key: ${key} for category ${productData.category}, subcategory ${productData.subcategory}`);
                }

                // Create the product specification with the correct field names
                await productspecification.create({
                  productid: newProduct.id,
                  speckeyid: specKey.id,
                  value: value.toString()
                });
                
                console.log(`Row ${i + 2} - Created specification: ${key} = ${value} (specKeyId: ${specKey.id})`);
              }
            }
          } catch (specError) {
            console.warn(`Row ${i + 2} - Failed to parse specifications:`, specError.message);
            
            // Add to results errors for better debugging
            results.errors.push({
              row: i + 2,
              error: `Specification parsing error: ${specError.message}`
            });
          }
        }

        // Handle sizes if provided
        if (row.sizes) {
          try {
            const sizesData = cleanAndParseJSON(row.sizes, i + 2, 'sizes');
            
            if (sizesData && Array.isArray(sizesData)) {
              for (const sizeData of sizesData) {
                await sizes.create({
                  product_id: newProduct.id,
                  size_type: sizeData.size_type || 'clothing',
                  size_value: sizeData.size_value,
                  is_available: sizeData.is_available !== false,
                  price_modifier_type: sizeData.price_modifier_type || 'none',
                  price_modifier_value: sizeData.price_modifier_value || null,
                  price: sizeData.price || null,
                  mrp: sizeData.mrp || null
                });
              }
            }
          } catch (sizeError) {
            console.warn(`Row ${i + 2} - Failed to parse sizes:`, sizeError.message);
            
            // Add to results errors for better debugging
            results.errors.push({
              row: i + 2,
              error: `Size parsing error: ${sizeError.message}`
            });
          }
        }

        results.successful++;

      } catch (error) {
        results.failed++;
        let errorMessage = error.message;
        
        // Handle specific database errors
        if (error.name === 'SequelizeForeignKeyConstraintError') {
          if (error.message.includes('productdescription_ibfk_1')) {
            errorMessage = `Invalid category ID. Category ${row.category} does not exist.`;
          } else if (error.message.includes('productdescription_ibfk_2')) {
            errorMessage = `Invalid subcategory ID. Subcategory ${row.subcategory} does not exist or doesn't belong to category ${row.category}.`;
          } else {
            errorMessage = 'Foreign key constraint error. Please check your category and subcategory IDs.';
          }
        } else if (error.name === 'SequelizeValidationError') {
          errorMessage = `Validation error: ${error.errors.map(e => e.message).join(', ')}`;
        }
        
        results.errors.push({
          row: i + 2,
          error: errorMessage
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Excel import completed',
      results
    });

  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error importing products from Excel:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error importing products from Excel', 
      error: error.message 
    });
  }
};

// Get available categories and subcategories for Excel import reference
exports.getImportReference = async (req, res) => {
  try {
    // Get all main categories
    const mainCategories = await maincategory.findAll({
      attributes: ['id', 'name'],
      order: [['id', 'ASC']]
    });

    // Get all subcategories with their main category info
    const subcategoriesData = await subcategory.findAll({
      attributes: ['id', 'name', 'maincategoryid'],
      include: [{
        model: maincategory,
        attributes: ['name'],
        required: true
      }],
      order: [['maincategoryid', 'ASC'], ['id', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        mainCategories,
        subcategories: subcategoriesData
      }
    });

  } catch (error) {
    console.error('Error fetching import reference data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching reference data', 
      error: error.message 
    });
  }
};

// Generate Excel template for product import
exports.generateExcelTemplate = async (req, res) => {
  try {
    // Get actual categories and subcategories from database
    const mainCategories = await maincategory.findAll({
      attributes: ['id', 'name'],
      order: [['id', 'ASC']]
    });

    const subcategoriesData = await subcategory.findAll({
      attributes: ['id', 'name', 'maincategoryid'],
      include: [{
        model: maincategory,
        attributes: ['name'],
        required: true
      }],
      order: [['maincategoryid', 'ASC'], ['id', 'ASC']]
    });

    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Use actual category and subcategory IDs from database
    const firstCategory = mainCategories[0];
    const firstSubcategory = subcategoriesData.find(sub => sub.maincategoryid === firstCategory?.id);
    const secondCategory = mainCategories[1] || firstCategory;
    const secondSubcategory = subcategoriesData.find(sub => sub.maincategoryid === secondCategory?.id && sub.id !== firstSubcategory?.id) || firstSubcategory;

    // Sample data with actual category/subcategory IDs
    const sampleData = [
      {
        productname: 'Cotton T-Shirt',
        brand: 'Fashion Brand',
        price: 999.99,
        mrp: 1299.99,
        rating: 4.5,
        description: 'Premium cotton t-shirt with comfortable fit',
        gst: 18.00,
        gst_type: 'exclusive',
        size: 'S,M,L,XL',
        category: firstCategory?.id || 1,
        subcategory: firstSubcategory?.id || 1,
        specifications: '{"Material": "100% Cotton", "Color": "Blue", "Fit": "Regular", "Care": "Machine Wash"}',
        sizes: '[{"size_type": "clothing", "size_value": "S", "is_available": true, "price_modifier_type": "none"}, {"size_type": "clothing", "size_value": "M", "is_available": true, "price_modifier_type": "none"}, {"size_type": "clothing", "size_value": "L", "is_available": true, "price_modifier_type": "percentage", "price_modifier_value": 110}, {"size_type": "clothing", "size_value": "XL", "is_available": true, "price_modifier_type": "fixed", "price": 1199.99, "mrp": 1499.99}]'
      },
      {
        productname: 'Sample Product 2',
        brand: 'Another Brand',
        price: 1499.99,
        mrp: 1999.99,
        rating: 4.0,
        description: 'Another sample product',
        gst: 12.00,
        gst_type: 'inclusive',
        size: 'M,L',
        category: secondCategory?.id || 1,
        subcategory: secondSubcategory?.id || 1,
        specifications: '{"Material": "Polyester", "Color": "Red"}',
        sizes: '[{"size_type": "clothing", "size_value": "M", "is_available": true, "price_modifier_type": "none"}, {"size_type": "clothing", "size_value": "L", "is_available": true, "price_modifier_type": "percentage", "price_modifier_value": 105}]'
      }
    ];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 20 }, // productname
      { wch: 15 }, // brand
      { wch: 10 }, // price
      { wch: 10 }, // mrp
      { wch: 8 },  // rating
      { wch: 40 }, // description
      { wch: 8 },  // gst
      { wch: 12 }, // gst_type
      { wch: 15 }, // size
      { wch: 10 }, // category
      { wch: 12 }, // subcategory
      { wch: 50 }, // specifications
      { wch: 80 }  // sizes
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    
    // Create instructions sheet
    const instructions = [
      { Field: 'productname', Required: 'YES', Description: 'Name of the product', Example: 'Cotton T-Shirt' },
      { Field: 'brand', Required: 'YES', Description: 'Brand name', Example: 'Fashion Brand' },
      { Field: 'price', Required: 'YES', Description: 'Base price of the product', Example: '999.99' },
      { Field: 'mrp', Required: 'NO', Description: 'Maximum Retail Price', Example: '1299.99' },
      { Field: 'rating', Required: 'NO', Description: 'Product rating (0-5)', Example: '4.5' },
      { Field: 'description', Required: 'NO', Description: 'Product description', Example: 'Premium cotton t-shirt' },
      { Field: 'gst', Required: 'NO', Description: 'GST percentage', Example: '18.00' },
      { Field: 'gst_type', Required: 'NO', Description: 'GST type: inclusive or exclusive', Example: 'exclusive' },
      { Field: 'size', Required: 'NO', Description: 'Comma-separated sizes (legacy field)', Example: 'S,M,L,XL' },
      { Field: 'category', Required: 'YES', Description: 'Main category ID (number)', Example: '1' },
      { Field: 'subcategory', Required: 'YES', Description: 'Subcategory ID (number)', Example: '1' },
      { Field: 'specifications', Required: 'NO', Description: 'JSON object with specifications', Example: '{"Material": "Cotton", "Color": "Blue"}' },
      { Field: 'sizes', Required: 'NO', Description: 'JSON array with size details', Example: 'See examples in Products sheet' }
    ];
    
    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [
      { wch: 15 }, // Field
      { wch: 10 }, // Required
      { wch: 40 }, // Description
      { wch: 30 }  // Example
    ];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
  
    // Create size types reference sheet
    const sizeTypes = [
      { size_type: 'clothing', description: 'For clothing items', examples: 'S, M, L, XL, XXL' },
      { size_type: 'shoes', description: 'For footwear', examples: '6, 7, 8, 9, 10, 11, 12' },
      { size_type: 'weight', description: 'For weight-based products', examples: '1kg, 2kg, 5kg, 500g' },
      { size_type: 'custom', description: 'For custom sizing', examples: 'Any custom value' }
    ];
    
    const sizeTypesSheet = XLSX.utils.json_to_sheet(sizeTypes);
    sizeTypesSheet['!cols'] = [
      { wch: 12 }, // size_type
      { wch: 30 }, // description
      { wch: 25 }  // examples
    ];
    XLSX.utils.book_append_sheet(workbook, sizeTypesSheet, 'Size Types');
    
    // Create price modifier types reference sheet
    const priceModifiers = [
      { 
        modifier_type: 'none', 
        description: 'Use base product price', 
        example: 'No additional fields needed',
        json_example: '{"price_modifier_type": "none"}'
      },
      { 
        modifier_type: 'fixed', 
        description: 'Set specific price for this size', 
        example: 'price: 1199.99, mrp: 1499.99',
        json_example: '{"price_modifier_type": "fixed", "price": 1199.99, "mrp": 1499.99}'
      },
      { 
        modifier_type: 'percentage', 
        description: 'Percentage of base price', 
        example: 'price_modifier_value: 110 (means 110% of base price)',
        json_example: '{"price_modifier_type": "percentage", "price_modifier_value": 110}'
      }
    ];
    
    const priceModifiersSheet = XLSX.utils.json_to_sheet(priceModifiers);
    priceModifiersSheet['!cols'] = [
      { wch: 15 }, // modifier_type
      { wch: 30 }, // description
      { wch: 40 }, // example
      { wch: 50 }  // json_example
    ];
    XLSX.utils.book_append_sheet(workbook, priceModifiersSheet, 'Price Modifiers');
    
    // Create categories reference sheet
    const categoriesReference = mainCategories.map(cat => ({
      category_id: cat.id,
      category_name: cat.name,
      subcategories: subcategoriesData
        .filter(sub => sub.maincategoryid === cat.id)
        .map(sub => `${sub.id}: ${sub.name}`)
        .join(', ')
    }));
    
    const categoriesSheet = XLSX.utils.json_to_sheet(categoriesReference);
    categoriesSheet['!cols'] = [
      { wch: 12 }, // category_id
      { wch: 20 }, // category_name
      { wch: 50 }  // subcategories
    ];
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categories Reference');
    
    // Create detailed subcategories reference sheet
    const subcategoriesReference = subcategoriesData.map(sub => ({
      subcategory_id: sub.id,
      subcategory_name: sub.name,
      category_id: sub.maincategoryid,
      category_name: sub.maincategory.name
    }));
    
    const subcategoriesSheet = XLSX.utils.json_to_sheet(subcategoriesReference);
    subcategoriesSheet['!cols'] = [
      { wch: 15 }, // subcategory_id
      { wch: 25 }, // subcategory_name
      { wch: 12 }, // category_id
      { wch: 20 }  // category_name
    ];
    XLSX.utils.book_append_sheet(workbook, subcategoriesSheet, 'Subcategories Reference');
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Set response headers
    res.setHeader('Content-Disposition', 'attachment; filename=product_import_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);
    
    // Send the file
    res.send(buffer);

  } catch (error) {
    console.error('Error generating Excel template:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating Excel template', 
      error: error.message 
    });
  }
};