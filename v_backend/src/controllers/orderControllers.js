const db = require("../models");
const Order = db.orders;
const OrderItem = db.orderitems;
const User = db.user;
const Product = db.productdescription;
const ProductImage = db.productimage;
const Sizes = db.sizes;
const sequelize = db.sequelize;

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

exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    console.log('[createOrder] Authenticated User ID:', userId);

    const {
      items,
      paymentMode,
      fullName,
      email,
      phone,
      addressStreet,
      city,
      state,
      zipCode,
      country,
      shippingCharge
    } = req.body;

    console.log('[createOrder] Received payload:', req.body);
    console.log('[createOrder] Items with sizes:', items.map(item => ({
      productId: item.productId,
      selectedSize: item.selectedSize,
      hasSize: !!item.selectedSize
    })));

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "No items in the order" });
    }

    if (!fullName || !email || !phone || !addressStreet || !city || !state || !zipCode || !country || !paymentMode) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Missing required order details (contact, address, or payment)." });
    }
    
    const fullAddressComposite = `${addressStreet}, ${city}, ${state} ${zipCode}, ${country}`;

    const productIds = items.map(item => item.productId);
    const uniqueProductIds = [...new Set(productIds)]; // Get unique product IDs
    
    console.log('[createOrder] Product IDs from items:', productIds);
    console.log('[createOrder] Unique Product IDs:', uniqueProductIds);
    const productsInDb = await Product.findAll({
      where: { id: uniqueProductIds },
      include: [{
        model: Sizes,
        as: 'productSizes',
        attributes: ['id', 'size_type', 'size_value', 'display_order', 'is_available', 'price', 'mrp', 'price_modifier_type', 'price_modifier_value'],
        required: false
      }],
      transaction: t
    });

    console.log('[createOrder] Products found in DB:', productsInDb.map(p => ({ id: p.id, name: p.productname })));
    
    if (productsInDb.length !== uniqueProductIds.length) {
      const foundProductIds = productsInDb.map(p => p.id);
      const missingProductIds = uniqueProductIds.filter(id => !foundProductIds.includes(id));
      console.log('[createOrder] Found product IDs:', foundProductIds);
      console.log('[createOrder] Missing product IDs:', missingProductIds);
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: `One or more products not found. Missing product IDs: ${missingProductIds.join(', ')}`
      });
    }
    
    const productMap = productsInDb.reduce((map, product) => {
        map[product.id] = product;
        return map;
    }, {});

    console.log('[createOrder] Creating order record...');
    const order = await Order.create({
      userid: userId,
      address: addressStreet,
      paymentmode: paymentMode,
      status: "pending",
      fullname: fullName,
      phonenumber: phone,
      email: email,
      city: city,
      state: state,
      country: country,
      pincode: zipCode,
      shippingcharge: shippingCharge || 0
    }, { transaction: t });
    console.log('[createOrder] Order record created with ID:', order.id);

    const orderItemsData = items.map(item => {
      const product = productMap[item.productId];
      
      // Calculate size-specific pricing
      let actualPrice = parseFloat(product.price);
      const selectedSize = item.selectedSize;
      
      if (selectedSize && product.productSizes && product.productSizes.length > 0) {
        const sizeData = product.productSizes.find(size => size.size_value === selectedSize);
        if (sizeData) {
          const sizePrice = calculateSizePrice(product.price, product.mrp, sizeData);
          actualPrice = sizePrice.price;
          console.log(`[createOrder] Item ${item.productId} - Size: ${selectedSize}, Base Price: ${product.price}, Size Price: ${actualPrice}`);
        }
      }
      
      const orderItemData = {
        orderid: order.id,
        productid: item.productId,
        quantity: item.quantity,
        priceatpurchase: actualPrice, // Use size-specific price
        selectedSize: item.selectedSize || null // Include selected size if provided
      };
      
      // Log each item's size information for debugging
      console.log(`[createOrder] Item ${item.productId} - selectedSize: "${item.selectedSize}", finalPrice: ${actualPrice}`);
      
      return orderItemData;
    });

    console.log('[createOrder] Creating order items with data:', orderItemsData);
    await OrderItem.bulkCreate(orderItemsData, { transaction: t });
    console.log('[createOrder] Order items created successfully.');

    await t.commit();
    console.log('[createOrder] Transaction committed successfully.');

    return res.status(200).json({ 
        success: true, 
        message: "Order created successfully",
        orderId: order.id
    });

  } catch (error) {
    await t.rollback();
    console.error('[createOrder] Error creating order:', error);
    
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message);
        return res.status(400).json({ success: false, message: "Validation Error", errors: messages });
    }
    
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while creating order.",
      error: error.message
    });
  }
};

exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const userOrders = await Order.findAll({
            where: { userid: userId },
            include: [{
                model: OrderItem,
                as: "orderItems",
                include: [
                    {
                        model: Product,
                        as: "product",
                        required: false, // LEFT JOIN
                        include: [
                            {
                                model: ProductImage,
                                as: "productimages",
                                required: false
                            }
                        ]
                    },
                ]
            },
            ],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(userOrders)
    } catch (error) {
        console.log("[getUserOrders] Error:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}

exports.getAllOrders = async(req,res) => {
    try{
        const statusFilter = req.query.status;
        const whereClause = statusFilter && statusFilter !== "all" ? {status:statusFilter} : {};
        
        console.log("[getAllOrders] Fetching all orders with filter:", whereClause);

        const allOrders = await Order.findAll({
            where:whereClause,
            include:[
                {
                    model: User, 
                    as: "user", 
                    attributes:['id','firstName','lastName','email', 'createdAt'] 
                },
                {
                    model: OrderItem,
                    as: "orderItems", 
                    attributes: ['id', 'priceatpurchase','quantity', 'selectedSize'], 
                    include:[   
                        {
                            model: Product, 
                            as: "product", 
                            attributes: ['id', 'productname', 'price', 'gst', 'gst_type'], 
                            include:[
                                {
                                    model: ProductImage,
                                    as: "productimages", 
                                    attributes: ['imageurl'] 
                                }
                            ]
                        }
                    ]
                }
            ],
            order:[['createdAt','DESC']]
        });

        // Format orders with GST calculations
        const formattedOrders = allOrders.map(order => {
            let subtotalBeforeGST = 0;
            let totalGSTAmount = 0;
            let grandTotal = 0;
            
            // Calculate GST for each order item
            const formattedOrderItems = order.orderItems.map(item => {
                const basePrice = parseFloat(item.priceatpurchase) || 0;
                const quantity = item.quantity || 1;
                const gst = parseFloat(item.product?.gst) || 0;
                const gstType = item.product?.gst_type || 'exclusive';
                
                let priceBeforeGST, gstAmount, finalPrice;
                
                if (gstType === 'inclusive') {
                    // For inclusive GST, extract GST from the given price
                    priceBeforeGST = basePrice / (1 + (gst / 100));
                    gstAmount = basePrice - priceBeforeGST;
                    finalPrice = basePrice;
                } else {
                    // For exclusive GST, add GST to the given price
                    priceBeforeGST = basePrice;
                    gstAmount = basePrice * (gst / 100);
                    finalPrice = basePrice + gstAmount;
                }
                
                // Add to totals
                subtotalBeforeGST += priceBeforeGST * quantity;
                totalGSTAmount += gstAmount * quantity;
                grandTotal += finalPrice * quantity;
                
                return {
                    ...item.toJSON(),
                    priceBeforeGST: Number(priceBeforeGST.toFixed(2)),
                    gstAmount: Number(gstAmount.toFixed(2)),
                    finalPrice: Number(finalPrice.toFixed(2)),
                    gstRate: gst,
                    gstType: gstType
                };
            });

            return {
                ...order.toJSON(),
                orderItems: formattedOrderItems,
                priceBreakdown: {
                    subtotalBeforeGST: Number(subtotalBeforeGST.toFixed(2)),
                    totalGSTAmount: Number(totalGSTAmount.toFixed(2)),
                    grandTotal: Number(grandTotal.toFixed(2))
                }
            };
        });

        console.log("[getAllOrders] Fetched orders count:", formattedOrders.length);
        return res.status(200).json(formattedOrders);

    }catch(error){
        console.error("[getAllOrders] Error fetching all orders:", error); 
        return res.status(500).json({message : "Internal Server Error fetching all orders.", error:error.message})
    }
}

exports.updateOrderStatus = async(req,res) => {
    try{
        const orderId = req.params.orderId;
        const {status} = req.body;
        console.log(`[updateOrderStatus] Attempting to update order ${orderId} to status ${status}`);

        if(!status){
            return res.status(400).json({message:"Status is required"})
        }
        const validStatus = ["pending","dispatched","delivered","cancelled"];
        if(!validStatus.includes(status.toLowerCase())){
            return res.status(400).json({message:`Invalid status: ${status}. Valid statuses are: ${validStatus.join(', ')}`})
        }
        const orderRecord = await Order.findByPk(orderId);
        if(!orderRecord){
            return res.status(404).json({message:"Order not found"})
        }
        orderRecord.status = status.toLowerCase();
        
        if (status.toLowerCase() === 'dispatched') {
            if (req.body.trackingid) orderRecord.trackingid = req.body.trackingid;
            if (req.body.couriercompany) orderRecord.couriercompany = req.body.couriercompany;
        }
        if (status.toLowerCase() === 'cancelled') {
            if (req.body.rejectreason) orderRecord.rejectreason = req.body.rejectreason;
        }

        await orderRecord.save();
        console.log(`[updateOrderStatus] Order ${orderId} status updated to ${orderRecord.status}`);
        return res.status(200).json({message:"Order status updated successfully", order: orderRecord})

       }catch(error){
        console.error("[updateOrderStatus] Error:", error);
        return res.status(500).json({message : "Internal Server Error",error:error.message})
       }
}

exports.getUserOrderHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('[getUserOrderHistory] Fetching order history for user:', userId);
        
        // Debug: Check what products exist
        const allProducts = await Product.findAll({ attributes: ['id', 'productname'] });
        console.log('[getUserOrderHistory] Available products:', allProducts.map(p => ({ id: p.id, name: p.productname })));

        const orders = await Order.findAll({
            where: { userid: userId },
            include: [{
                model: OrderItem,
                as: "orderItems",
                include: [
                    {
                        model: Product,
                        as: "product",
                        required: false, // LEFT JOIN - include order items even if product doesn't exist
                        include: [
                            {
                                model: ProductImage,
                                as: "productimages",
                                required: false
                            }
                        ]
                    },
                ]
            }],
            order: [['createdAt', 'DESC']]
        });

        console.log('[getUserOrderHistory] Found orders:', orders.length);
        if (orders.length > 0) {
            console.log('[getUserOrderHistory] First order orderItems:', orders[0].orderItems?.length || 0);
            if (orders[0].orderItems && orders[0].orderItems.length > 0) {
                console.log('[getUserOrderHistory] First orderItem product:', orders[0].orderItems[0].product ? 'Found' : 'NULL');
                console.log('[getUserOrderHistory] First orderItem productid:', orders[0].orderItems[0].productid);
                if (orders[0].orderItems[0].product) {
                    console.log('[getUserOrderHistory] Product name:', orders[0].orderItems[0].product.productname);
                }
            }
        }

        // Format the response to include summary information
        const formattedOrders = orders.map(order => {
            const totalItems = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalAmount = order.orderItems.reduce((sum, item) => sum + (item.priceatpurchase * item.quantity), 0);
            
            // Format the order items with product details and images
            const items = order.orderItems.map(item => ({
                id: item.id,
                productId: item.productid,
                productName: item.product ? item.product.productname : 'Product not found',
                price: Number(item.priceatpurchase),
                quantity: item.quantity,
                subtotal: Number(item.priceatpurchase * item.quantity),
                selectedSize: item.selectedSize || null, // Include selected size
                imageUrl: item.product && item.product.productimages && item.product.productimages.length > 0 
                    ? (item.product.productimages[0].imageurl.startsWith('/') 
                        ? item.product.productimages[0].imageurl 
                        : `/uploads/${item.product.productimages[0].imageurl}`)
                    : null
            }));
            
            return {
                id: order.id,
                status: order.status,
                createdAt: order.createdAt,
                totalItems,
                totalAmount: Number(totalAmount),
                shippingCharge: Number(order.dataValues.shippingcharge || 0),
                trackingId: order.trackingid,
                courierCompany: order.couriercompany,
                rejectReason: order.rejectreason,
                paymentMode: order.paymentmode,
                items, // Include the formatted items
                shippingDetails: {
                    fullName: order.fullname,
                    address: order.address,
                    city: order.city,
                    state: order.state,
                    country: order.country,
                    pinCode: order.pincode,
                    phone: order.phonenumber,
                    email: order.email
                }
            };
        });

        return res.status(200).json({
            success: true,
            count: orders.length,
            orders: formattedOrders
        });
    } catch (error) {
        console.error('[getUserOrderHistory] Error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch order history",
            error: error.message
        });
    }
};

exports.getLatestOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('[getLatestOrder] Fetching latest order for user:', userId);

        const latestOrder = await Order.findOne({
            where: { userid: userId },
            include: [{
                model: OrderItem,
                as: "orderItems",
                include: [
                    {
                        model: Product,
                        as: "product",
                        required: false, // LEFT JOIN
                        include: [
                            {
                                model: ProductImage,
                                as: "productimages",
                                required: false
                            }
                        ]
                    },
                ]
            }],
            order: [['createdAt', 'DESC']]
        });

        if (!latestOrder) {
            return res.status(404).json({
                success: false,
                message: "No orders found for this user"
            });
        }

        // Calculate totals
        const totalItems = latestOrder.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = latestOrder.orderItems.reduce((sum, item) => sum + (item.priceatpurchase * item.quantity), 0);
        
        // Format the order items
        const items = latestOrder.orderItems.map(item => ({
            id: item.id,
            productId: item.productid,
            productName: item.product ? item.product.productname : 'Product not found',
            price: Number(item.priceatpurchase),
            quantity: item.quantity,
            subtotal: Number(item.priceatpurchase * item.quantity),
            imageUrl: item.product && item.product.productimages && item.product.productimages.length > 0 
                ? (item.product.productimages[0].imageurl.startsWith('/') 
                    ? item.product.productimages[0].imageurl 
                    : `/uploads/${item.product.productimages[0].imageurl}`)
                : null
        }));

        const formattedOrder = {
            id: latestOrder.id,
            status: latestOrder.status,
            createdAt: latestOrder.createdAt,
            updatedAt: latestOrder.updatedAt,
            paymentMode: latestOrder.paymentmode,
            totalItems,
            totalAmount: Number(totalAmount),
            shippingCharge: Number(latestOrder.dataValues.shippingcharge || 0),
            trackingId: latestOrder.trackingid,
            courierCompany: latestOrder.couriercompany,
            rejectReason: latestOrder.rejectreason,
            shippingDetails: {
                fullName: latestOrder.fullname,
                address: latestOrder.address,
                city: latestOrder.city,
                state: latestOrder.state,
                country: latestOrder.country,
                pinCode: latestOrder.pincode,
                phone: latestOrder.phonenumber,
                email: latestOrder.email
            },
            items
        };

        return res.status(200).json({
            success: true,
            order: formattedOrder
        });
    } catch (error) {
        console.error('[getLatestOrder] Error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch latest order",
            error: error.message
        });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.orderId;
        console.log(`[getOrderById] Fetching order ${orderId} for user ${userId}`);

        const order = await Order.findOne({
            where: { 
                id: orderId,
                userid: userId  // Ensure the order belongs to the requesting user
            },
            include: [{
                model: OrderItem,
                as: "orderItems",
                attributes: ['id', 'orderid', 'productid', 'quantity', 'priceatpurchase', 'selectedSize', 'createdAt', 'updatedAt'], // Explicitly include selectedSize
                include: [
                    {
                        model: Product,
                        as: "product",
                        required: false, // LEFT JOIN
                        include: [
                            {
                                model: ProductImage,
                                as: "productimages",
                                required: false
                            }
                        ]
                    },
                ]
            }]
        });

        console.log(`[getOrderById] Raw order data:`, JSON.stringify(order, null, 2));

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found or does not belong to this user"
            });
        }

        // Calculate totals with GST breakdown
        const totalItems = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        
        let subtotalBeforeGST = 0;
        let totalGSTAmount = 0;
        let grandTotal = 0;
        
        // Format the order items with GST calculations
        const items = order.orderItems.map(item => {
            console.log(`[getOrderById] Processing item:`, {
                id: item.id,
                productid: item.productid,
                selectedSize: item.selectedSize,
                rawItem: item.toJSON ? item.toJSON() : item
            });
            
            const basePrice = parseFloat(item.priceatpurchase) || 0;
            const quantity = item.quantity || 1;
            const gst = parseFloat(item.product?.gst) || 0;
            const gstType = item.product?.gst_type || 'exclusive';
            
            let priceBeforeGST, gstAmount, finalPrice;
            
            if (gstType === 'inclusive') {
                // For inclusive GST, extract GST from the given price
                priceBeforeGST = basePrice / (1 + (gst / 100));
                gstAmount = basePrice - priceBeforeGST;
                finalPrice = basePrice;
            } else {
                // For exclusive GST, add GST to the given price
                priceBeforeGST = basePrice;
                gstAmount = basePrice * (gst / 100);
                finalPrice = basePrice + gstAmount;
            }
            
            // Add to totals
            subtotalBeforeGST += priceBeforeGST * quantity;
            totalGSTAmount += gstAmount * quantity;
            grandTotal += finalPrice * quantity;
            
            const formattedItem = {
                id: item.id,
                productId: item.productid,
                productName: item.product ? item.product.productname : 'Product not found',
                price: Number(basePrice),
                quantity: quantity,
                subtotal: Number(basePrice * quantity),
                selectedSize: item.selectedSize || null, // Include selected size
                // GST breakdown for each item
                priceBeforeGST: Number(priceBeforeGST.toFixed(2)),
                gstAmount: Number(gstAmount.toFixed(2)),
                finalPrice: Number(finalPrice.toFixed(2)),
                gstRate: gst,
                gstType: gstType,
                imageUrl: item.product && item.product.productimages && item.product.productimages.length > 0 
                    ? (item.product.productimages[0].imageurl.startsWith('/') 
                        ? item.product.productimages[0].imageurl 
                        : `/uploads/${item.product.productimages[0].imageurl}`)
                    : null
            };
            
            console.log(`[getOrderById] Formatted item:`, formattedItem);
            return formattedItem;
        });

        // Create status timeline
        const statusTimeline = [
            { status: 'Order Placed', date: order.createdAt, completed: true },
            { status: 'Processing', date: order.status !== 'pending' ? order.updatedAt : null, completed: order.status !== 'pending' },
            { status: 'Dispatched', date: order.status === 'dispatched' || order.status === 'delivered' ? order.updatedAt : null, completed: order.status === 'dispatched' || order.status === 'delivered' },
            { status: 'Delivered', date: order.status === 'delivered' ? order.updatedAt : null, completed: order.status === 'delivered' }
        ];

        const formattedOrder = {
            id: order.id,
            status: order.status,
            statusTimeline,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            paymentMode: order.paymentmode,
            totalItems,
            // GST breakdown totals
            subtotalBeforeGST: Number(subtotalBeforeGST.toFixed(2)),
            totalGSTAmount: Number(totalGSTAmount.toFixed(2)),
            totalAmount: Number(grandTotal.toFixed(2)),
            shippingCharge: Number(order.dataValues.shippingcharge || 0),
            // Legacy field for backward compatibility
            originalTotalAmount: Number(order.orderItems.reduce((sum, item) => sum + (item.priceatpurchase * item.quantity), 0)),
            trackingId: order.trackingid,
            courierCompany: order.couriercompany,
            rejectReason: order.rejectreason,
            shippingDetails: {
                fullName: order.fullname,
                address: order.address,
                city: order.city,
                state: order.state,
                country: order.country,
                pinCode: order.pincode,
                phone: order.phonenumber,
                email: order.email
            },
            items
        };

        return res.status(200).json({
            success: true,
            order: formattedOrder
        });
    } catch (error) {
        console.error('[getOrderById] Error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch order details",
            error: error.message
        });
    }
};

exports.deleteOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const orderId = req.params.orderId;
    
    console.log('[deleteOrder] Request from user:', { userId, userRole, orderId });
    
    // Build query based on user role
    let whereClause = { id: orderId };
    
    // If user is not admin, they can only delete their own orders
    if (userRole !== 'admin') {
      whereClause.userid = userId;
    }
    
    const order = await db.orders.findOne({ where: whereClause });
    
    if (!order) {
      console.log('[deleteOrder] Order not found with criteria:', whereClause);
      return res.status(404).json({ 
        success: false, 
        message: userRole === 'admin' ? 'Order not found' : 'Order not found or access denied'
      });
    }
    
    console.log('[deleteOrder] Found order:', { id: order.id, userid: order.userid, status: order.status });
    
    // Delete order items first (foreign key constraint)
    await db.orderitems.destroy({ where: { orderid: orderId } });
    console.log('[deleteOrder] Deleted order items for order:', orderId);
    
    // Delete the order
    await order.destroy();
    console.log('[deleteOrder] Deleted order:', orderId);
    
    return res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('[deleteOrder] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete order', error: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, orderId, rating, review } = req.body;
    // Optionally: check if the order is delivered and belongs to the user
    const order = await db.orders.findOne({ where: { id: orderId, userid: userId, status: 'delivered' } });
    if (!order) {
      return res.status(400).json({ success: false, message: 'Order not found or not delivered' });
    }
    // Save review
    await db.productreview.create({
      userid: userId,
      productid: productId,
      orderid: orderId,
      rating,
      review
    });
    return res.status(200).json({ success: true, message: 'Review submitted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit review', error: error.message });
  }
};

// Test function to verify size storage and retrieval
exports.testSizeStorage = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`[testSizeStorage] Testing size storage for user ${userId}`);

        // Get all order items for this user with size information
        const orderItems = await OrderItem.findAll({
            include: [
                {
                    model: Order,
                    where: { userid: userId },
                    attributes: ['id', 'status', 'createdAt']
                },
                {
                    model: Product,
                    as: "product",
                    attributes: ['id', 'productname'],
                    required: false
                }
            ],
            attributes: ['id', 'orderid', 'productid', 'quantity', 'priceatpurchase', 'selectedSize'],
            order: [['createdAt', 'DESC']]
        });

        console.log(`[testSizeStorage] Found ${orderItems.length} order items`);
        
        const itemsWithSizes = orderItems.filter(item => item.selectedSize);
        console.log(`[testSizeStorage] Items with sizes: ${itemsWithSizes.length}`);

        const response = {
            totalOrderItems: orderItems.length,
            itemsWithSizes: itemsWithSizes.length,
            items: orderItems.map(item => ({
                id: item.id,
                orderId: item.orderid,
                productId: item.productid,
                productName: item.product?.productname || 'Unknown',
                quantity: item.quantity,
                selectedSize: item.selectedSize,
                hasSize: !!item.selectedSize
            }))
        };

        return res.status(200).json({
            success: true,
            message: 'Size storage test completed',
            data: response
        });

    } catch (error) {
        console.error('[testSizeStorage] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error testing size storage',
            error: error.message
        });
    }
};

// Function to update existing order items with size for testing
exports.updateOrderItemSize = async (req, res) => {
    try {
        const { orderItemId, selectedSize } = req.body;
        const userId = req.user.id;

        console.log(`[updateOrderItemSize] Updating order item ${orderItemId} with size "${selectedSize}" for user ${userId}`);

        // Find the order item and verify it belongs to the user
        const orderItem = await OrderItem.findOne({
            include: [{
                model: Order,
                where: { userid: userId },
                attributes: ['id', 'userid']
            }],
            where: { id: orderItemId }
        });

        if (!orderItem) {
            return res.status(404).json({
                success: false,
                message: 'Order item not found or does not belong to this user'
            });
        }

        // Update the size
        await orderItem.update({ selectedSize: selectedSize });

        console.log(`[updateOrderItemSize] Successfully updated order item ${orderItemId} with size "${selectedSize}"`);

        return res.status(200).json({
            success: true,
            message: 'Order item size updated successfully',
            data: {
                orderItemId: orderItem.id,
                orderId: orderItem.orderid,
                selectedSize: orderItem.selectedSize
            }
        });

    } catch (error) {
        console.error('[updateOrderItemSize] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating order item size',
            error: error.message
        });
    }
};
