'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sizes', 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Price for this specific size (if different from base product price)'
    });

    await queryInterface.addColumn('sizes', 'mrp', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'MRP for this specific size (if different from base product MRP)'
    });

    await queryInterface.addColumn('sizes', 'price_modifier_type', {
      type: Sequelize.ENUM('fixed', 'percentage', 'none'),
      allowNull: false,
      defaultValue: 'none',
      comment: 'How price is calculated: fixed price, percentage of base price, or use base price'
    });

    await queryInterface.addColumn('sizes', 'price_modifier_value', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Value for price calculation (fixed amount or percentage)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sizes', 'price');
    await queryInterface.removeColumn('sizes', 'mrp');
    await queryInterface.removeColumn('sizes', 'price_modifier_type');
    await queryInterface.removeColumn('sizes', 'price_modifier_value');
  }
};