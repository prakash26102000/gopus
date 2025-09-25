// Import models from the models index
const db = require('../models');
const { subcategory, maincategory, productdescription, productimage, productspecification, specificationkey, sequelize } = db;
const { Op } = require('sequelize');

// POST /api/admin/subcategories
exports.createSubCategories = async (req, res) => {
  // Accept either maincategoryid or mainCategoryId
  const maincategoryid = req.body.maincategoryid || req.body.mainCategoryId;
  const { subcategories } = req.body;

  if (!maincategoryid || !Array.isArray(subcategories) || subcategories.length === 0) {
    return res.status(400).json({ message: 'Invalid request data' });
  }

  try {
    const mainCategoryExists = await maincategory.findByPk(maincategoryid);
    if (!mainCategoryExists) {
      return res.status(404).json({ message: 'Main category not found' });
    }

    const createdSubs = await Promise.all(
      subcategories.map(sub =>
        subcategory.create({ name: sub.name, maincategoryid })
      )
    );

    res.status(201).json({ message: 'Subcategories saved', data: createdSubs });
  } catch (error) {
    console.error('Error saving subcategories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};  // End of createSubCategories function





exports.getsub = async (req,res) => {
  try {
    // Check if filtering by main category
    const { maincategoryid } = req.query;
    
    let query = {};
    if (maincategoryid) {
      query = { where: { maincategoryid } };
    }
    
    const subCategories = await subcategory.findAll(query);

    return res.status(200).json({
      subcategories: subCategories,
      message: 'Subcategories fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};







exports.getcat = async (req, res) => {
  try {
    const mainCategories = await maincategory.findAll();

    return res.status(200).json({
      mainCategories,
      message: 'Main categories with subcategories fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching main categories:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};






exports.updatesubcategory = async (req, res) => {
  const subcategoryId = req.params.id;
  const { name } = req.body;

  if (!subcategoryId || !name) {
    return res.status(400).json({ message: 'Invalid request data' });
  }

  try {
    const subCategoryRecord = await subcategory.findByPk(subcategoryId);
    if (!subCategoryRecord) {
      return res.status(404).json({ message: 'subcategory not found' });
    }
    subCategoryRecord.name = name;
    await subCategoryRecord.save();
    return res.status(200).json({
      message: 'subcategory updated successfully',
      subcategory: {
        id: subCategoryRecord.id,
        name: subCategoryRecord.name,
        maincategoryid: subCategoryRecord.maincategoryid
      }
    });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};






exports.deletesubcategory = async (req, res) => {
  const subcategoryId = req.params.id;

  if (!subcategoryId || isNaN(parseInt(subcategoryId, 10))) {
    return res.status(400).json({ message: 'Invalid subcategory ID provided' });
  }

  // Use a transaction to ensure data integrity
  const t = await sequelize.transaction();

  try {
    // Find the subcategory first to verify it exists
    const subCategoryRecord = await subcategory.findByPk(parseInt(subcategoryId, 10), { transaction: t });
    if (!subCategoryRecord) {
      await t.rollback();
      return res.status(404).json({ message: 'subcategory not found' });
    }
    
    console.log(`Starting deletion cascade for subcategory ID: ${subcategoryId}`);

    // Step 1: Find all products related to this subcategory
    const products = await productdescription.findAll({
      where: { subcategory: subcategoryId },
      transaction: t
    });
    
    console.log(`Found ${products.length} products to delete for subcategory ID: ${subcategoryId}`);
    
    // Step 2: For each product, delete related data
    for (const product of products) {
      const productId = product.id;
      
      // Delete product images
      const imagesDeleted = await productimage.destroy({
        where: { productId },
        transaction: t
      });
      
      // Delete product specifications
      const specsDeleted = await productspecification.destroy({
        where: { productId },
        transaction: t
      });
      
      console.log(`Deleted ${imagesDeleted} images and ${specsDeleted} specifications for product ID: ${productId}`);
      
      // Delete the product itself
      await product.destroy({ transaction: t });
      console.log(`Deleted product ID: ${productId}`);
    }
    
    // Step 3: Delete specification keys specific to this subcategory
    const specKeysDeleted = await specificationkey.destroy({
      where: { 
        subcategory: subcategoryId 
      },
      transaction: t
    });
    
    console.log(`Deleted ${specKeysDeleted} specification keys for subcategory ID: ${subcategoryId}`);
    
    // Step 4: Finally destroy the subcategory
    await subCategoryRecord.destroy({ transaction: t });
    console.log(`Successfully deleted subcategory ID: ${subcategoryId}`);
    
    // Commit the transaction
    await t.commit();
    
    return res.status(200).json({
      success: true,
      message: 'subcategory and all associated data deleted successfully'
    });
  } catch (error) {
    // Rollback transaction on error
    await t.rollback();
    console.error('Error in cascade delete of subcategory:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error during deletion process', 
      error: error.message 
    });
  }
};

// Delete a main category and all its related data
exports.deletemaincategory = async (req, res) => {
  const maincategoryid = req.params.id;

  if (!maincategoryid || isNaN(parseInt(maincategoryid, 10))) {
    return res.status(400).json({ message: 'Invalid main category ID provided' });
  }

  // Use a transaction to ensure data integrity
  const t = await sequelize.transaction();

  try {
    // Find the main category first to verify it exists
    const mainCategoryRecord = await maincategory.findByPk(parseInt(maincategoryid, 10), { transaction: t });
    if (!mainCategoryRecord) {
      await t.rollback();
      return res.status(404).json({ message: 'Main category not found' });
    }
    
    console.log(`Starting deletion cascade for main category ID: ${maincategoryid}`);
    
    // Step 1: Find all subcategories related to this main category
    const subcategories = await subcategory.findAll({
      where: { maincategoryid },
      transaction: t
    });
    
    console.log(`Found ${subcategories.length} subcategories to delete for main category ID: ${maincategoryid}`);
    
    // Step 2: Process each subcategory and its products
    for (const subcategory of subcategories) {
      const subId = subcategory.id;
      
      // Find all products for this subcategory
      const products = await productdescription.findAll({
        where: { subcategory: subId },
        transaction: t
      });
      
      console.log(`Found ${products.length} products to delete for subcategory ID: ${subId}`);
      
      // Delete each product's related data
      for (const product of products) {
        const productId = product.id;
        
        // Delete product images
        const imagesDeleted = await productimage.destroy({
          where: { productId },
          transaction: t
        });
        
        // Delete product specifications
        const specsDeleted = await productspecification.destroy({
          where: { productId },
          transaction: t
        });
        
        console.log(`Deleted ${imagesDeleted} images and ${specsDeleted} specifications for product ID: ${productId}`);
        
        // Delete the product
        await product.destroy({ transaction: t });
        console.log(`Deleted product ID: ${productId}`);
      }
      
      // Delete specification keys for this subcategory
      const specKeysDeleted = await specificationkey.destroy({
        where: { subcategory: subId },
        transaction: t
      });
      
      console.log(`Deleted ${specKeysDeleted} specification keys for subcategory ID: ${subId}`);
      
      // Delete the subcategory
      await subcategory.destroy({ transaction: t });
      console.log(`Deleted subcategory ID: ${subId}`);
    }
    
    // Step 3: Find and delete products directly assigned to this main category
    const directProducts = await productdescription.findAll({
      where: { 
        category: maincategoryid,
        [Op.or]: [
          { subcategory: null },
          { subcategory: { [Op.eq]: null } }
        ]
      },
      transaction: t
    });
    
    console.log(`Found ${directProducts.length} direct products to delete for main category ID: ${maincategoryid}`);
    
    // Delete these direct products and their related data
    for (const product of directProducts) {
      const productId = product.id;
      
      // Delete product images
      const imagesDeleted = await productimage.destroy({
        where: { productId },
        transaction: t
      });
      
      // Delete product specifications
      const specsDeleted = await productspecification.destroy({
        where: { productId },
        transaction: t
      });
      
      console.log(`Deleted ${imagesDeleted} images and ${specsDeleted} specifications for direct product ID: ${productId}`);
      
      // Delete the product
      await product.destroy({ transaction: t });
      console.log(`Deleted direct product ID: ${productId}`);
    }
    
    // Step 4: Delete specification keys directly assigned to this main category
    const directSpecKeysDeleted = await specificationkey.destroy({
      where: { 
        category: maincategoryid,
        [Op.or]: [
          { subcategory: null },
          { subcategory: { [Op.eq]: null } }
        ]
      },
      transaction: t
    });
    
    console.log(`Deleted ${directSpecKeysDeleted} direct specification keys for main category ID: ${maincategoryid}`);
    
    // Step 5: Finally destroy the main category
    await mainCategoryRecord.destroy({ transaction: t });
    console.log(`Successfully deleted main category ID: ${maincategoryid}`);
    
    // Commit the transaction
    await t.commit();
    
    return res.status(200).json({
      success: true,
      message: 'Main category and all associated data deleted successfully'
    });
  } catch (error) {
    // Rollback transaction on error
    await t.rollback();
    console.error('Error in cascade delete of main category:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error during deletion process', 
      error: error.message 
    });
  }
};