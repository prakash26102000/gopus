const db = require('../models');
const { Op } = require('sequelize');

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

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.body.productId || req.body.productid;
    const quantity = req.body.quantity;
    const selectedSize = req.body.size;

    console.log('Add to cart request:', { userId, productId, quantity, selectedSize });
    console.log('Selected size type:', typeof selectedSize);
    console.log('Selected size value:', selectedSize);

    // Check for invalid user ID
    if (!userId || userId === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID. Please log in again."
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const qnt = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;

    // Get the product to check if it's a fashion product
    const product = await db.productdescription.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check if product has sizes available
    let productHasSizes = false;
    let availableSizes = [];
    
    // Check for new sizes system
    const productSizes = await db.sizes.findAll({
      where: { product_id: productId, is_available: true }
    });
    
    if (productSizes && productSizes.length > 0) {
      productHasSizes = true;
      availableSizes = productSizes.map(s => s.size_value);
    } else if (product.size && product.size.trim()) {
      // Check legacy size system
      productHasSizes = true;
      availableSizes = product.size.split(',').map(s => s.trim());
    }
    
    // If a size is provided, validate it's available
    if (selectedSize && productHasSizes) {
      if (!availableSizes.includes(selectedSize)) {
        return res.status(400).json({
          success: false,
          message: `Size "${selectedSize}" is not available for this product. Available sizes: ${availableSizes.join(', ')}`
        });
      }
    }
    
    // Note: We allow adding products without size selection even if sizes are available
    // This creates separate cart items for sized vs non-sized versions

    let cartItem = await db.cartitems.findOne({
      where: {
        userid: userId,
        productid: productId,
        selectedSize: selectedSize || null // Include size in search to avoid duplicates
      }
    });

    if (cartItem) {
      console.log('Updating existing cart item:', cartItem.id);
      cartItem.quantity += qnt;
      await cartItem.save();
      
      return res.status(200).json({
        success: true,
        message: "Item quantity updated in cart",
        isUpdate: true,
        newQuantity: cartItem.quantity
      });
    } else {
      console.log('Creating new cart item');
      await db.cartitems.create({
        userid: userId,
        productid: productId,
        quantity: qnt,
        selectedSize: selectedSize || null // Save the selected size if provided
      });
      
      return res.status(200).json({
        success: true,
        message: "Product added to cart successfully",
        isUpdate: false
      });
    }
  } catch (error) {
    console.error('Error in addToCart:', error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    console.log('getCart called for user:', req.user?.id);

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const userId = req.user.id;

    const cartItems = await db.cartitems.findAll({
      where: { userid: userId },
      include: [{
        model: db.productdescription,
        as: 'productDescription',
        include: [
          {
            model: db.productimage,
            as: 'productimages'
          },
          {
            model: db.sizes,
            as: 'productSizes',
            attributes: ['id', 'size_type', 'size_value', 'display_order', 'is_available', 'price', 'mrp', 'price_modifier_type', 'price_modifier_value'],
            required: false
          }
        ]
      }]
    });

    console.log(`Found ${cartItems.length} items in cart`);

    const formattedCartItems = cartItems.map(item => {
      const plainItem = item.get({ plain: true });
      const product = plainItem.productDescription || {};

      let imageUrl = null;
      if (product.productimages && product.productimages.length > 0) {
        const firstImage = product.productimages[0];
        imageUrl = firstImage.imageurl;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
          imageUrl = `/uploads/${imageUrl}`;
        }
      }

      // Calculate size-specific pricing
      const basePrice = parseFloat(product.price) || 0;
      const baseMrp = parseFloat(product.mrp) || basePrice;
      const selectedSize = plainItem.selectedSize;
      
      // Find the size data if a size is selected
      let sizeData = null;
      if (selectedSize && product.productSizes && product.productSizes.length > 0) {
        sizeData = product.productSizes.find(size => size.size_value === selectedSize);
      }
      
      // Calculate the actual price based on size
      const sizePrice = calculateSizePrice(basePrice, baseMrp, sizeData);
      const actualPrice = sizePrice.price;
      const actualMrp = sizePrice.mrp || actualPrice;
      
      // Calculate GST values on the size-specific price
      const gst = parseFloat(product.gst) || 0;
      const gstType = product.gst_type || 'exclusive';
      
      let priceBeforeGST, gstAmount, finalPrice;
      
      if (gstType === 'inclusive') {
        // For inclusive GST, extract GST from the given price
        priceBeforeGST = actualPrice / (1 + (gst / 100));
        gstAmount = actualPrice - priceBeforeGST;
        finalPrice = actualPrice;
      } else {
        // For exclusive GST, add GST to the given price
        priceBeforeGST = actualPrice;
        gstAmount = actualPrice * (gst / 100);
        finalPrice = actualPrice + gstAmount;
      }
      
      // Calculate discount percentage if MRP is provided
      const discount = actualMrp > finalPrice ? Math.round(((actualMrp - finalPrice) / actualMrp) * 100) : 0;

      return {
        id: plainItem.id,
        productId: plainItem.productid,
        userId: plainItem.userid,
        quantity: plainItem.quantity,
        product: {
          id: product.id || plainItem.productid,
          name: product.productname || 'Product',
          price: actualPrice, // Use size-specific price
          mrp: actualMrp, // Use size-specific MRP
          basePrice: basePrice, // Keep base price for reference
          baseMrp: baseMrp, // Keep base MRP for reference
          brand: product.brand || '',
          description: product.description || '',
          category: product.category || null,
          subcategory: product.subcategory || null,
          gst: parseFloat(product.gst) || 0,
          gst_type: product.gst_type || 'exclusive',
          imageUrl: imageUrl,
          size: product.size || null, // Available sizes
          // Pre-calculated GST values from backend (based on size-specific price)
          priceBeforeGST: Number(priceBeforeGST.toFixed(2)),
          gstAmount: Number(gstAmount.toFixed(2)),
          finalPrice: Number(finalPrice.toFixed(2)),
          discount: discount,
          selectedSize: plainItem.selectedSize, // Add the selected size to the response
          sizeData: sizeData // Include size data for reference
        }
      };
    });

    return res.status(200).json({
      success: true,
      cartItems: formattedCartItems
    });
  } catch (error) {
    console.error('Error in getCart:', error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Update cart item quantity
exports.updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.body.productId || req.body.productid;
    const quantity = req.body.quantity;

    console.log('Update cart request:', { userId, productId, quantity });

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a non-negative integer"
      });
    }

    const cartItem = await db.cartitems.findOne({
      where: {
        userid: userId,
        productid: productId
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart"
      });
    }

    if (quantity === 0) {
      await cartItem.destroy();
      return res.status(200).json({
        success: true,
        message: "Product removed from cart"
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully"
    });

  } catch (error) {
    console.error('Error in updateCart:', error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.body.productId || req.body.productid;
    const size = req.body.size || null; // Optional size parameter

    console.log('Remove from cart request:', { userId, productId, size });

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    // Build where clause
    const whereClause = {
      userid: userId,
      productid: productId
    };

    // If size is provided and not null/empty, include it in the search to remove specific size variant
    if (size && size !== null && size !== '') {
      whereClause.selectedSize = size;
    } else {
      // If no size is provided, look for items with null or empty selectedSize
      whereClause.selectedSize = {
        [Op.or]: [null, '']
      };
    }

    console.log('Where clause for cart item removal:', whereClause);
    
    const cartItem = await db.cartitems.findOne({
      where: whereClause
    });

    console.log('Found cart item:', cartItem ? { id: cartItem.id, productid: cartItem.productid, selectedSize: cartItem.selectedSize } : 'null');

    if (!cartItem) {
      // Let's also try to find what items exist for this user and product
      const allItemsForProduct = await db.cartitems.findAll({
        where: {
          userid: userId,
          productid: productId
        }
      });
      console.log('All cart items for this product:', allItemsForProduct.map(item => ({ id: item.id, selectedSize: item.selectedSize })));
      
      return res.status(404).json({
        success: false,
        message: size ? 
          `Product with size "${size}" not found in cart` : 
          "Product not found in cart"
      });
    }

    await cartItem.destroy();
    return res.status(200).json({
      success: true,
      message: size ? 
        `Product with size "${size}" removed from cart successfully` :
        "Product removed from cart successfully"
    });
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Diagnostic test endpoint
exports.testCart = async (req, res) => {
  try {
    console.log('testCart called');

    const allCartItems = await db.cartitems.findAll({ 
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    const cartItemsWithProduct = await db.cartitems.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{
        model: db.productdescription,
        as: 'productDescription'
      }]
    });

    return res.json({
      success: true,
      message: 'Test successful',
      totalCartItems: allCartItems.length,
      cartItemsWithProduct: cartItemsWithProduct.length,
      allCartItems: allCartItems.map(item => ({
        id: item.id,
        userid: item.userid,
        productid: item.productid,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        createdAt: item.createdAt
      })),
      sampleData: cartItemsWithProduct.map(item => ({
        id: item.id,
        userid: item.userid,
        productid: item.productid,
        quantity: item.quantity,
        selectedSize: item.selectedSize, // Add selectedSize to check
        hasProduct: !!item.productDescription,
        productName: item.productDescription?.productname || 'No product',
        createdAt: item.createdAt
      }))
    });
  } catch (error) {
    console.error('Error in testCart:', error);
    return res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message,
      stack: error.stack
    });
  }
};
