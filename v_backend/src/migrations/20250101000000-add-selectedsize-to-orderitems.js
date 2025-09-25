'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orderitems', 'selectedSize', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Selected size for fashion products'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('orderitems', 'selectedSize');
  }
};