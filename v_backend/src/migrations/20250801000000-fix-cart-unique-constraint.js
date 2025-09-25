'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the old unique constraint that only considers userid and productid
    await queryInterface.removeIndex('cartitems', 'unique_user_product');
    
    // Add new unique constraint that includes selectedSize
    // This allows same product with different sizes (or no size) for the same user
    await queryInterface.addIndex('cartitems', ['userid', 'productid', 'selectedSize'], {
      unique: true,
      name: 'unique_user_product_size'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the new constraint
    await queryInterface.removeIndex('cartitems', 'unique_user_product_size');
    
    // Restore the old constraint (this might fail if there are duplicate entries)
    await queryInterface.addIndex('cartitems', ['userid', 'productid'], {
      unique: true,
      name: 'unique_user_product'
    });
  }
};