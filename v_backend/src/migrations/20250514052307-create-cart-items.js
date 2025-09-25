'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cartitems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userid: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      productid: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'productdescription',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    
    // Add index for faster cart querying by user
    await queryInterface.addIndex('cartitems', ['userid']);
    
    // Add index for faster product lookup within carts
    await queryInterface.addIndex('cartitems', ['productid']);
    
    // Add unique constraint to prevent duplicate product entries for a user
    await queryInterface.addIndex('cartitems', ['userid', 'productid'], {
      unique: true,
      name: 'unique_user_product'
    });
  },
  
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cartitems');
  }
};