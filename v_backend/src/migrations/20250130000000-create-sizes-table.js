'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sizes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'productdescription',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      size_type: {
        type: Sequelize.ENUM('clothing', 'shoes', 'weight', 'custom'),
        allowNull: false,
        comment: 'Type of size: clothing (S,M,L), shoes (4,5,6), weight (kg), or custom'
      },
      size_value: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'The actual size value (e.g., "M", "42", "2.5kg")'
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Order in which sizes should be displayed'
      },
      is_available: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this size is currently available'
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

    // Add indexes for better performance
    await queryInterface.addIndex('sizes', ['product_id']);
    await queryInterface.addIndex('sizes', ['size_type']);
    await queryInterface.addIndex('sizes', ['product_id', 'size_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sizes');
  }
};