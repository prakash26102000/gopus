'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('productdescription', 'mrp', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Maximum Retail Price'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('productdescription', 'mrp');
  }
};