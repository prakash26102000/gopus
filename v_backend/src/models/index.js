'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/database.js')[env];
const db = {};

// Create Sequelize instance
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Read and initialize all model files
fs.readdirSync(__dirname)
  .filter(file =>
    file.indexOf('.') !== 0 &&
    file !== basename &&
    file.slice(-3) === '.js' &&
    file.indexOf('.test.js') === -1
  )
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Apply associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});


// =================== ASSOCIATIONS =================== //

// productdescription -> productspecification
if (db.productdescription && db.productspecification) {
  db.productdescription.hasMany(db.productspecification, { foreignKey: 'productid', onDelete: 'CASCADE' });
  db.productspecification.belongsTo(db.productdescription, { foreignKey: 'productid' });
}

// specificationkey -> productspecification
if (db.specificationkey && db.productspecification) {
  db.specificationkey.hasMany(db.productspecification, {
    foreignKey: 'speckeyid', onDelete: 'CASCADE'
  });
  db.productspecification.belongsTo(db.specificationkey, {
    foreignKey: 'speckeyid'
  });
}

// maincategory -> subcategory
if (db.maincategory && db.subcategory) {
  db.maincategory.hasMany(db.subcategory, { foreignKey: 'maincategoryid', onDelete: 'CASCADE' });
  db.subcategory.belongsTo(db.maincategory, { foreignKey: 'maincategoryid' });
}

// maincategory/subcategory -> productdescription
if (db.maincategory && db.productdescription) {
  db.maincategory.hasMany(db.productdescription, { foreignKey: 'category', onDelete: 'CASCADE' });
  db.productdescription.belongsTo(db.maincategory, { foreignKey: 'category', as: 'maincategory' });
}
if (db.subcategory && db.productdescription) {
  db.subcategory.hasMany(db.productdescription, { foreignKey: 'subcategory', onDelete: 'CASCADE' });
  db.productdescription.belongsTo(db.subcategory, { foreignKey: 'subcategory', as: 'subcategoryDetails' });
}

// user -> cartitems
if (db.user && db.cartitems) {
  db.user.hasMany(db.cartitems, { foreignKey: 'userid', as: 'cartEntries', onDelete: 'CASCADE' });
  db.cartitems.belongsTo(db.user, { foreignKey: 'userid', as: 'userDetails' });
}

// productdescription -> cartitems
if (db.productdescription && db.cartitems) {
  db.productdescription.hasMany(db.cartitems, { foreignKey: 'productid', as: 'cartItems', onDelete: 'CASCADE' });
  db.cartitems.belongsTo(db.productdescription, { foreignKey: 'productid', as: 'productDescription' });
}



// productdescription -> productimage (One-to-Many)
if (db.productdescription && db.productimage) {
  db.productdescription.hasMany(db.productimage, {
    foreignKey: 'productid',
    as: 'productimages' // ✅ this alias must match include
  });
  db.productimage.belongsTo(db.productdescription, {
    foreignKey: 'productid',
    as: 'product' // optional reverse link
  });
}

// productdescription -> sizes (One-to-Many)
if (db.productdescription && db.sizes) {
  db.productdescription.hasMany(db.sizes, {
    foreignKey: 'product_id',
    as: 'productSizes',
    onDelete: 'CASCADE'
  });
  db.sizes.belongsTo(db.productdescription, {
    foreignKey: 'product_id',
    as: 'product'
  });
}




// orders -> user
if (db.orders && db.user) {
  db.user.hasMany(db.orders, { foreignKey: 'userid', onDelete: 'CASCADE' });
  db.orders.belongsTo(db.user, { foreignKey: 'userid', as: 'user' });
}

// orders -> orderitems
if (db.orders && db.orderitems) {
  db.orders.hasMany(db.orderitems, { foreignKey: 'orderid', as: 'orderItems', onDelete: 'CASCADE' });
  db.orderitems.belongsTo(db.orders, { foreignKey: 'orderid' });
}

// productdescription -> orderitems
if (db.orderitems && db.productdescription) {
  db.orderitems.belongsTo(db.productdescription, { foreignKey: 'productid', as: 'product' });
  db.productdescription.hasMany(db.orderitems, { foreignKey: 'productid' });
}

// productdescription -> productimage
// if (db.productdescription && db.productimage) {
//   db.productdescription.hasMany(db.productimage, { foreignKey: 'productid', as: 'productimages' });
//   db.productimage.belongsTo(db.productdescription, { foreignKey: 'productid', as: 'product' });
// }

// productreview
if (db.productreview && db.user) {
  db.user.hasMany(db.productreview, { foreignKey: 'userId', onDelete: 'CASCADE' });
  db.productreview.belongsTo(db.user, { foreignKey: 'userId', as: 'reviewedBy' });
}

if (db.productreview && db.productdescription) {
  db.productdescription.hasMany(db.productreview, { foreignKey: 'productId', onDelete: 'CASCADE' });
  db.productreview.belongsTo(db.productdescription, { foreignKey: 'productId', as: 'reviewedProduct' });
}

// =================== HOOKS =================== //
if (db.productdescription) {
  db.productdescription.addHook('beforeDestroy', async (product, options) => {
    console.log(`Preparing to delete product: ${product.id}`);
  });
}
if (db.subcategory) {
  db.subcategory.addHook('beforeDestroy', async (subcategory, options) => {
    console.log(`Preparing to delete subcategory: ${subcategory.id}`);
  });
}
if (db.maincategory) {
  db.maincategory.addHook('beforeDestroy', async (maincategory, options) => {
    console.log(`Preparing to delete main category: ${maincategory.id}`);
  });
}

// Export sequelize instance and all models
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
